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
    max_length: int = 1024

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global generator
    try:
        print("Loading model...")
        # Use TinyLlama for lightweight embedded performance
        model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        
        # Check if model is already downloaded locally
        import os
        model_path = "./models"
        if not os.path.exists(model_path):
            os.makedirs(model_path)
            print("Models directory created. First run will download the model.")
        
        # Check if we have the model files locally
        model_cache_path = os.path.join(model_path, "models--TinyLlama--TinyLlama-1.1B-Chat-v1.0")
        has_local_model = os.path.exists(model_cache_path)
        
        if has_local_model:
            print("Using locally cached model...")
            # Force local files only when offline
            tokenizer = AutoTokenizer.from_pretrained(
                model_id, 
                cache_dir="./models",
                local_files_only=True  # Force offline mode
            )
            model = AutoModelForCausalLM.from_pretrained(
                model_id, 
                cache_dir="./models",
                torch_dtype=torch.float16,
                device_map="auto",
                local_files_only=True  # Force offline mode
            )
        else:
            print("Downloading model (requires internet connection)...")
            # Allow downloading if not cached
            tokenizer = AutoTokenizer.from_pretrained(
                model_id, 
                cache_dir="./models",
                local_files_only=False
            )
            model = AutoModelForCausalLM.from_pretrained(
                model_id, 
                cache_dir="./models",
                torch_dtype=torch.float16,
                device_map="auto",
                local_files_only=False
            )
        
        generator = pipeline("text-generation", model=model, tokenizer=tokenizer)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        if "local_files_only" in str(e):
            print("Model not found locally. Please run with internet connection first to download the model.")
        else:
            print("Make sure you have an internet connection for the first run to download the model.")
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
        "http://localhost:8000",  # Python server port
        "http://127.0.0.1:8000",  # Alternative Python server port
        "file://*",  # Allow file:// protocol for Electron
        "*"  # Temporarily allow all origins for debugging
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
        # TinyLlama uses a specific chat format
        formatted_prompt = f"<|system|>\nYou are a helpful AI assistant.\n<|user|>\n{request.prompt}\n<|assistant|>\n"
        
        result = generator(
            formatted_prompt, 
            max_new_tokens=request.max_length,
            do_sample=True,
            temperature=0.7,
            top_p=0.95,
            repetition_penalty=1.1,
            pad_token_id=generator.tokenizer.eos_token_id,
            eos_token_id=generator.tokenizer.eos_token_id
        )
        
        generated_text = result[0]["generated_text"]
        
        # Clean up the response - extract only the assistant's response
        if "<|assistant|>" in generated_text:
            # Extract only the assistant part
            assistant_start = generated_text.find("<|assistant|>") + len("<|assistant|>")
            answer = generated_text[assistant_start:].strip()
            
            # Remove any trailing system/user tags
            if "<|system|>" in answer:
                answer = answer.split("<|system|>")[0].strip()
            if "<|user|>" in answer:
                answer = answer.split("<|user|>")[0].strip()
        else:
            # Fallback: try to remove the original prompt
            if request.prompt in generated_text:
                answer = generated_text.replace(request.prompt, "").strip()
            else:
                answer = generated_text.strip()
        
        # Clean up any trailing incomplete sentences or HTML-like content
        answer = clean_response(answer)
        
        return {"text": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def clean_response(text: str) -> str:
    """Clean up the response text"""
    # Remove HTML tags
    import re
    text = re.sub(r'</?[^>]+(>|$)', '', text)
    
    # Remove TinyLlama specific tokens
    text = re.sub(r'<\|[^>]+\|>', '', text)
    
    # Remove common incomplete endings
    text = re.sub(r'</div>.*$', '', text, flags=re.DOTALL)
    text = re.sub(r'</body>.*$', '', text, flags=re.DOTALL)
    text = re.sub(r'</html>.*$', '', text, flags=re.DOTALL)
    
    # Clean up multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove trailing incomplete sentences
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line and not line.endswith('...') and len(line) > 5:  # Reduced minimum length for TinyLlama
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": generator is not None}

@app.get("/")
async def root():
    return {"message": "AI Local Embedded Assistant Python Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)