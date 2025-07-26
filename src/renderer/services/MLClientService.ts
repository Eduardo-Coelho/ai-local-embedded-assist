export interface ModelResponse {
  text: string;
  tokens: number;
  time: number;
}

export interface ModelInfo {
  name: string;
  size: string;
  loaded: boolean;
}

// Type for the window object with electronAPI
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>
      getAppName: () => Promise<string>
      
      // ML Service API
      mlLoadModel: () => Promise<{ success: boolean; error?: string }>
      mlGenerateResponse: (prompt: string, maxLength?: number) => Promise<{ success: boolean; response?: any; error?: string }>
      mlGetModelInfo: () => Promise<{ success: boolean; info?: any; error?: string }>
      mlIsModelReady: () => Promise<{ success: boolean; ready?: boolean; error?: string }>
      mlUnloadModel: () => Promise<{ success: boolean; error?: string }>
    }
  }
}

export class MLClientService {
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    // This service runs in the renderer process and communicates with the main process
  }

  async loadModel(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    
    try {
      const result = await window.electronAPI.mlLoadModel();
      
      if (result.success) {
        this.isLoaded = true;
        console.log('✅ Model loaded successfully via IPC');
      } else {
        throw new Error(result.error || 'Failed to load model');
      }
    } catch (error) {
      console.error('Failed to load model via IPC:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateResponse(prompt: string, maxLength: number = 256): Promise<ModelResponse> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const result = await window.electronAPI.mlGenerateResponse(prompt, maxLength);
      
      if (result.success && result.response) {
        return result.response as ModelResponse;
      } else {
        throw new Error(result.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('Error generating response via IPC:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Generation failed: ${errorMessage}`);
    }
  }

  async isModelReady(): Promise<boolean> {
    try {
      const result = await window.electronAPI.mlIsModelReady();
      
      if (result.success) {
        this.isLoaded = result.ready || false;
        return this.isLoaded;
      } else {
        console.error('Failed to check model readiness:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error checking model readiness:', error);
      return false;
    }
  }

  async getModelInfo(): Promise<ModelInfo> {
    try {
      const result = await window.electronAPI.mlGetModelInfo();
      
      if (result.success && result.info) {
        this.isLoaded = result.info.loaded;
        return result.info as ModelInfo;
      } else {
        console.error('Failed to get model info:', result.error);
        return { name: 'Unknown Model', size: 'Unknown Size', loaded: false };
      }
    } catch (error) {
      console.error('Error getting model info:', error);
      return { name: 'Unknown Model', size: 'Unknown Size', loaded: false };
    }
  }

  async unloadModel(): Promise<void> {
    try {
      const result = await window.electronAPI.mlUnloadModel();
      
      if (result.success) {
        this.isLoaded = false;
        console.log('Model unloaded via IPC');
      } else {
        console.error('Failed to unload model:', result.error);
      }
    } catch (error) {
      console.error('Error unloading model:', error);
    }
  }
}

// Create a singleton instance
export const mlClientService = new MLClientService(); 