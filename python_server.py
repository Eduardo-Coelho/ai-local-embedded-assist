import sys
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import uvicorn
import torch
from contextlib import asynccontextmanager

# Global model variable
generator = None

class PromptRequest(BaseModel):
    prompt: str
    max_length: int = 256

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global generator
    try:
        print("Loading model...")
        model_id = "deepseek-ai/deepseek-coder-1.3b-base"
        tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir="./models")
        model = AutoModelForCausalLM.from_pretrained(
            model_id, 
            cache_dir="./models",
            torch_dtype=torch.float16,
            device_map="auto"
        )
        generator = pipeline("text-generation", model=model, tokenizer=tokenizer)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise e
    
    yield
    
    # Shutdown
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173",  # Alternative Vite port
        "http://localhost:8080",  # Alternative dev port
        "http://127.0.0.1:8080",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_text(request: PromptRequest):
    global generator
    if generator is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        result = generator(
            request.prompt, 
            max_new_tokens=request.max_length,
            do_sample=True,
            temperature=0.7,
            top_p=0.95,
            repetition_penalty=1.1
        )
        return {"text": result[0]["generated_text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": generator is not None}

@app.get("/")
async def root():
    return {"message": "AI Local Embedded Assistant Python Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)