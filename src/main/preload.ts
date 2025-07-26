import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  
  // ML Service API
  mlLoadModel: () => ipcRenderer.invoke('ml-load-model'),
  mlGenerateResponse: (prompt: string, maxLength?: number) => ipcRenderer.invoke('ml-generate-response', prompt, maxLength),
  mlGetModelInfo: () => ipcRenderer.invoke('ml-get-model-info'),
  mlIsModelReady: () => ipcRenderer.invoke('ml-is-model-ready'),
  mlUnloadModel: () => ipcRenderer.invoke('ml-unload-model'),
})

// Type definitions for the exposed API
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