import { pipeline, AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers';

export interface ModelResponse {
  text: string;
  tokens: number;
  time: number;
}

export class DeepSeekService {
  private model: any = null;
  private tokenizer: any = null;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    // Configure transformers.js to use local models
    // You can set the cache directory for models
    // pipeline('text-generation', 'deepseek-ai/deepseek-coder-1.3b-base', { cache_dir: './models' });
    
    // Force CPU-only mode to avoid GPU issues
    if (typeof window !== 'undefined') {
      // Set environment variables for CPU-only mode
      (window as any).ENV = {
        ...(window as any).ENV,
        WEBGL_CPU_FORWARD: true,
        WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE: false,
        WEBGL_FORCE_F16_TEXTURES: false
      };
    }
  }

  async loadModel(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    
    // List of models to try in order of preference
    const modelOptions = [
      {
        name: 'DeepSeek Coder 1.3B Base',
        id: 'deepseek-ai/deepseek-coder-1.3b-base',
        size: '~2.6GB'
      },
      {
        name: 'TinyLlama 1.1B Chat',
        id: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
        size: '~2.1GB'
      },
      {
        name: 'Phi-2 Mini',
        id: 'microsoft/phi-2',
        size: '~2.7GB'
      }
    ];

    for (let i = 0; i < modelOptions.length; i++) {
      const modelOption = modelOptions[i];
      try {
        console.log(`Attempting to load model: ${modelOption.name} (${modelOption.id})`);
        
        this.model = await pipeline(
          'text-generation',
          modelOption.id,
          {
            quantized: true,
            progress_callback: (progress: any) => {
              console.log(`Loading progress for ${modelOption.name}: ${Math.round(progress * 100)}%`);
            },
            // Add timeout and retry options
            cache_dir: './models',
            local_files_only: true,
            revision: 'main'
          }
        );

        this.isLoaded = true;
        console.log(`✅ Successfully loaded: ${modelOption.name}`);
        
        // Store the current model info
        this.currentModelInfo = modelOption;
        break;
        
      } catch (error) {
        console.error(`❌ Failed to load ${modelOption.name}:`, error);
        
        if (i === modelOptions.length - 1) {
          // This was the last model to try
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to load any model. Last error: ${errorMessage}. Please check your internet connection and try again.`);
        }
        
        console.log(`🔄 Trying next model...`);
        // Wait a bit before trying the next model
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.isLoading = false;
  }

  async generateResponse(prompt: string, maxLength: number = 256): Promise<ModelResponse> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const startTime = Date.now();
    
    try {
      // Different models might have different parameter names
      const generationParams = {
        max_new_tokens: maxLength,
        temperature: 0.7,
        top_p: 0.95,
        do_sample: true,
        pad_token_id: this.model.tokenizer?.eos_token_id || 0,
        // Add safety parameters
        repetition_penalty: 1.1,
        length_penalty: 1.0
      };

      const result = await this.model(prompt, generationParams);

      const endTime = Date.now();
      const response = result[0].generated_text;
      
      // Extract only the generated part (remove the original prompt)
      const generatedText = response.substring(prompt.length).trim();

      return {
        text: generatedText || "I couldn't generate a response. Please try again.",
        tokens: result[0].generated_tokens?.length || 0,
        time: endTime - startTime
      };
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Generation failed: ${errorMessage}`);
    }
  }

  async isModelReady(): Promise<boolean> {
    return this.isLoaded;
  }

  async getModelInfo(): Promise<{ name: string; size: string; loaded: boolean }> {
    return {
      name: this.currentModelInfo?.name || 'Unknown Model',
      size: this.currentModelInfo?.size || 'Unknown Size',
      loaded: this.isLoaded
    };
  }

  // Method to unload model and free memory
  async unloadModel(): Promise<void> {
    if (this.model) {
      this.model = null;
      this.tokenizer = null;
      this.isLoaded = false;
      this.currentModelInfo = null;
      console.log('Model unloaded');
    }
  }

  // Get current model information
  private currentModelInfo: { name: string; id: string; size: string } | null = null;
}

// Create a singleton instance
export const deepSeekService = new DeepSeekService();