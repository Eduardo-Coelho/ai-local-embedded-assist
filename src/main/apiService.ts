import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

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

export class ApiService {
  private pythonProcess: ChildProcess | null = null;
  private isLoaded = false;
  private isLoading = false;
  private currentModelInfo: { name: string; id: string; size: string } | null = null;
  private serverUrl = 'http://127.0.0.1:8000';
  private autoStartEnabled = true;
  private pythonCommand: string | null = null;

  constructor() {
    // Handle app shutdown to clean up Python process
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  // Method to enable/disable auto-start
  setAutoStart(enabled: boolean): void {
    this.autoStartEnabled = enabled;
  }

  // Method to automatically start the server (called from main.ts)
  async autoStart(): Promise<void> {
    if (!this.autoStartEnabled) {
      console.log('🔄 Auto-start disabled');
      return;
    }

    console.log('🚀 Auto-starting Python backend...');
    try {
      await this.loadModel();
      console.log('✅ Python backend auto-started successfully');
    } catch (error) {
      console.error('❌ Auto-start failed:', error);
      // Don't throw error for auto-start failures - let the app continue
    }
  }

  private async findPythonCommand(): Promise<string> {
    const pythonCommands = ['python', 'python3', 'py'];
    
    for (const command of pythonCommands) {
      try {
        await new Promise<void>((resolve, reject) => {
          const testProcess = spawn(command, ['--version']);
          testProcess.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Command ${command} failed with code ${code}`));
            }
          });
          testProcess.on('error', () => {
            reject(new Error(`Command ${command} not found`));
          });
        });
        console.log(`✅ Found Python command: ${command}`);
        return command;
      } catch (error) {
        console.log(`❌ Command ${command} not available: ${error}`);
      }
    }
    
    throw new Error('Python not found. Please install Python 3.8+ and add it to your PATH');
  }

  async loadModel(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    
    try {
      // Find Python command first
      if (!this.pythonCommand) {
        this.pythonCommand = await this.findPythonCommand();
      }

      // Start Python server
      await this.startPythonServer();
      
      // Test the connection
      await this.testConnection();
      
      this.isLoaded = true;
      this.currentModelInfo = {
        name: 'DeepSeek Coder 1.3B Base (Python)',
        id: 'deepseek-ai/deepseek-coder-1.3b-base',
        size: '~2.6GB'
      };
      
      console.log('✅ Python backend loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Python backend:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async startPythonServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Path to the external Python server
      const scriptPath = path.join(process.cwd(), 'python_server.py');

      console.log(`🚀 Starting Python server with command: ${this.pythonCommand}...`);
      console.log(`📁 Server script: ${scriptPath}`);
      
      // Start Python process
      this.pythonProcess = spawn(this.pythonCommand!, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      // Handle Python process events
      this.pythonProcess.stdout?.on('data', (data) => {
        console.log('Python:', data.toString());
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.log('Python Error:', data.toString());
      });

      this.pythonProcess.on('error', (error) => {
        console.error('Failed to start Python server:', error);
        reject(error);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python server closed with code ${code}`);
        this.isLoaded = false;
      });

      // Wait a bit for server to start
      setTimeout(() => resolve(), 5000);
    });
  }

  private async testConnection(): Promise<void> {
    const maxRetries = 15; // Increased retries for model loading
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await this.makeRequest('GET', '/health');
        if (response.status === 'success' && response.data.model_loaded) {
          console.log('✅ Python server is ready');
          return;
        }
      } catch (error) {
        console.log(`Retry ${retries + 1}/${maxRetries}: Server not ready yet...`);
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
    }

    throw new Error('Python server failed to start within timeout');
  }

  private makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.serverUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options: any = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = client.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: 'success', data: parsedData });
            } else {
              resolve({ status: 'error', data: parsedData });
            }
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async generateResponse(prompt: string, maxLength: number = 256): Promise<ModelResponse> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('POST', '/generate', { 
        prompt, 
        max_length: maxLength 
      });

      if (response.status === 'error') {
        throw new Error(`Python backend error: ${response.data.detail || 'Unknown error'}`);
      }

      const data = response.data;
      const endTime = Date.now();
      
      // Extract only the generated part (remove the original prompt)
      const generatedText = data.text.substring(prompt.length).trim();

      return {
        text: generatedText || "I couldn't generate a response. Please try again.",
        tokens: 0, // Python backend doesn't provide token count
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

  async getModelInfo(): Promise<ModelInfo> {
    return {
      name: this.currentModelInfo?.name || 'Unknown Model',
      size: this.currentModelInfo?.size || 'Unknown Size',
      loaded: this.isLoaded
    };
  }

  async unloadModel(): Promise<void> {
    await this.cleanup();
  }

  private async cleanup(): Promise<void> {
    if (this.pythonProcess) {
      console.log('🛑 Stopping Python server...');
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isLoaded = false;
    this.currentModelInfo = null;
    console.log('Model unloaded');
  }
}

export const apiService = new ApiService();