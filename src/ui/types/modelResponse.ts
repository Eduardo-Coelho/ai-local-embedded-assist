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