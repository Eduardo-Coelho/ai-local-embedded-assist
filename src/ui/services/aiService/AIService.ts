import { AIModelInfo, AIModelResponse } from './AIServiceResponse';

export class AIService {
  private serverUrl = 'http://127.0.0.1:8000';
  private isLoaded = false;
  private isLoading = false;
  private currentModelInfo: AIModelInfo | null = null;

  constructor() {
    // Check if server is already running on startup
    this.checkServerStatus();
  }

  private async checkServerStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        this.isLoaded = data.model_loaded || false;
        if (this.isLoaded) {
          this.currentModelInfo = {
            name: 'TinyLlama 1.1B Chat',
            size: '~2.1GB',
            loaded: true,
          };
        }
      }
    } catch (error) {
      console.log('Python server not running yet');
    }
  }

  async loadModel(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      // Wait for the server to be ready
      await this.waitForServer();

      // Check if model is loaded
      const healthResponse = await fetch(`${this.serverUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error('Server health check failed');
      }

      const healthData = await healthResponse.json();
      if (!healthData.model_loaded) {
        throw new Error('Model not loaded on server');
      }

      this.isLoaded = true;
      this.currentModelInfo = {
        name: 'TinyLlama 1.1B Chat',
        size: '~2.1GB',
        loaded: true,
      };

      console.log('✅ Model loaded successfully via HTTP');
    } catch (error) {
      console.error('Failed to load model via HTTP:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async waitForServer(): Promise<void> {
    const maxRetries = 20;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await fetch(`${this.serverUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.model_loaded) {
            console.log('✅ Python server is ready');
            return;
          }
        }
      } catch (error) {
        console.log(
          `Retry ${retries + 1}/${maxRetries}: Server not ready yet...`,
        );
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Python server failed to start within timeout');
  }

  async generateResponse(
    prompt: string,
    maxLength: number = 1024,
  ): Promise<AIModelResponse> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.serverUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          max_length: maxLength,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Server error: ${errorData.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      const endTime = Date.now();

      // Return the full generated text - let the formatter handle cleaning
      return {
        text: data.text || "I couldn't generate a response. Please try again.",
        tokens: 0, // Python backend doesn't provide token count
        time: endTime - startTime,
      };
    } catch (error) {
      console.error('Error generating response via HTTP:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Generation failed: ${errorMessage}`);
    }
  }

  async isModelReady(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        this.isLoaded = data.model_loaded || false;
        return this.isLoaded;
      }
      return false;
    } catch (error) {
      console.error('Error checking model readiness:', error);
      return false;
    }
  }

  async getModelInfo(): Promise<AIModelInfo> {
    if (this.currentModelInfo) {
      return this.currentModelInfo;
    }

    return {
      name: 'Unknown Model',
      size: 'Unknown Size',
      loaded: this.isLoaded,
    };
  }

  async unloadModel(): Promise<void> {
    this.isLoaded = false;
    this.currentModelInfo = null;
    console.log('Model unloaded (server remains running)');
  }

  // Method to check if server is running
  async isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const AIServiceInit = new AIService();
