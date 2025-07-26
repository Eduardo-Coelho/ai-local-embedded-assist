export interface ModelResponse {
  text: string;
  tokens: number;
  time: number;
}

export class SimpleAIService {
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    // This service is always ready
    this.isLoaded = true;
  }

  async loadModel(): Promise<void> {
    // Simple service doesn't need to load anything
    this.isLoaded = true;
    console.log('✅ Simple AI Service ready');
  }

  async generateResponse(prompt: string, maxLength: number = 256): Promise<ModelResponse> {
    const startTime = Date.now();
    
    // Simple response patterns based on input
    let response = this.generateSimpleResponse(prompt);
    
    // Limit response length
    if (response.length > maxLength) {
      response = response.substring(0, maxLength) + '...';
    }

    const endTime = Date.now();
    
    return {
      text: response,
      tokens: Math.ceil(response.length / 4), // Rough estimate
      time: endTime - startTime
    };
  }

  private generateSimpleResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Programming-related responses
    if (lowerPrompt.includes('python') || lowerPrompt.includes('code') || lowerPrompt.includes('function')) {
      return `Here's a simple Python function example:

def example_function():
    """
    This is a basic Python function.
    Add your logic here.
    """
    result = "Hello from Python!"
    return result

# Usage
print(example_function())

This is a basic example. For more complex functionality, you might want to try a full AI model when available.`;
    }
    
    // General questions
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return `Hello! I'm a simple AI assistant running locally. I can provide basic responses, but for more advanced features, you'll need to load a full AI model.`;
    }
    
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      return `I'm a simple AI assistant that can provide basic responses. I'm currently running in fallback mode because the main AI model couldn't be loaded. 

To get full AI capabilities:
1. Check your internet connection
2. Try restarting the application
3. Ensure you have sufficient disk space (~3GB)

For now, I can help with basic questions and provide simple code examples.`;
    }
    
    // Default response
    return `I understand you're asking about "${prompt}". I'm currently running in simple mode because the main AI model couldn't be loaded. 

This might be due to:
- Network connectivity issues
- Insufficient disk space
- Model download problems

Try checking your internet connection and restarting the application. For now, I can provide basic assistance and simple examples.`;
  }

  async isModelReady(): Promise<boolean> {
    return this.isLoaded;
  }

  async getModelInfo(): Promise<{ name: string; size: string; loaded: boolean }> {
    return {
      name: 'Simple AI Fallback',
      size: '~1MB',
      loaded: this.isLoaded
    };
  }

  async unloadModel(): Promise<void> {
    // Nothing to unload
    console.log('Simple AI Service unloaded');
  }
}

// Create a singleton instance
export const simpleAIService = new SimpleAIService();