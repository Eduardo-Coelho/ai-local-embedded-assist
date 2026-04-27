export interface AIModelResponse {
  text: string;
  tokens: number;
  time: number;
}

export interface AIModelInfo {
  name: string;
  size: string;
  loaded: boolean;
}
