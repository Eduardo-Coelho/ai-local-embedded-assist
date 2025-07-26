import React, { useState, useEffect } from 'react'
import './App.css'
import { mlClientService, ModelResponse } from './services/MLClientService'
import { simpleAIService } from './services/SimpleAIService'

interface AppInfo {
  name: string
  version: string
}

interface ModelInfo {
  name: string
  size: string
  loaded: boolean
}

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>({ name: '', version: '' })
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState('')
  const [modelInfo, setModelInfo] = useState<ModelInfo>({ name: '', size: '', loaded: false })
  const [isLoadingModel, setIsLoadingModel] = useState(false)
  const [modelProgress, setModelProgress] = useState(0)
  const [usingFallback, setUsingFallback] = useState(false)
 
  useEffect(() => {
    // Get app information from Electron main process
    const getAppInfo = async () => {
      try {
        const windowVar = window as Window & typeof globalThis & { electronAPI: { getAppName: () => Promise<string>, getAppVersion: () => Promise<string> } }
        const name = await windowVar?.electronAPI.getAppName()
        const version = await windowVar?.electronAPI.getAppVersion()
        setAppInfo({ name, version })
      } catch (error) {
        console.error('Failed to get app info:', error)
        setAppInfo({ name: 'AI Local Embedded Assistant', version: '1.0.0' })
      }
    }

    getAppInfo()
    initializeModel()
  }, [])

  const initializeModel = async () => {
    try {
      setIsLoadingModel(true)
      setModelProgress(0)
      
      // Try to load the ML model via IPC
      await mlClientService.loadModel()
      
      // Get model info
      const info = await mlClientService.getModelInfo()
      setModelInfo(info)
      setUsingFallback(false)
      
      console.log('ML model initialized successfully via IPC')
    } catch (error) {
      console.error('Failed to initialize ML model:', error)
    } finally {
      setIsLoadingModel(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !modelInfo.loaded) return

    setIsProcessing(true)
    setResponse('')

    try {
      let result: ModelResponse;
      result = await mlClientService.generateResponse(inputText, 256)
      setResponse(result.text)
    } catch (error) {
      console.error('Error generating response:', error)
      setResponse('Sorry, I encountered an error while processing your request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-info">
          <h1>{appInfo.name}</h1>
          <p className="version">Version {appInfo.version}</p>
        </div>
        <div className="status-indicator">
          <span className={`status-dot ${modelInfo.loaded ? 'online' : 'offline'}`}></span>
          <span>
            {modelInfo.loaded 
              ? (usingFallback ? 'Simple AI Ready' : 'ML Model Ready')
              : isLoadingModel 
                ? 'Loading Model...' 
                : 'Model Not Loaded'
            }
          </span>
        </div>
      </header>

      <main className="app-main">
        <div className="chat-container">
          <div className="chat-messages">
            {isLoadingModel && (
              <div className="message system-message">
                <div className="message-content">
                  <p>🔄 Loading AI model... This may take a few minutes on first run.</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${modelProgress}%` }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {usingFallback && (
              <div className="message system-message">
                <div className="message-content">
                  <p>⚠️ Running in fallback mode. The main AI model couldn't be loaded, but you can still get basic responses.</p>
                </div>
              </div>
            )}
            
            {response && (
              <div className="message ai-message">
                <div className="message-content">
                  <p>{response}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-container">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={modelInfo.loaded ? (usingFallback ? "Ask me anything... (Simple AI mode)" : "Ask AI anything... (Your message will be processed locally)") : "Model is loading, please wait..."}
                disabled={isProcessing || !modelInfo.loaded || isLoadingModel}
                rows={3}
                className="text-input"
              />
              <button 
                type="submit" 
                disabled={isProcessing || !inputText.trim() || !modelInfo.loaded || isLoadingModel}
                className="send-button"
              >
                {isProcessing ? (
                  <div className="loading-spinner"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Model Information</h3>
            <div className="model-info">
              <p><strong>Model:</strong> {modelInfo.name}</p>
              <p><strong>Size:</strong> {modelInfo.size}</p>
              <p><strong>Status:</strong> {modelInfo.loaded ? '✅ Loaded' : '❌ Not Loaded'}</p>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Features</h3>
            <ul>
              <li>✅ Local AI Processing</li>
              <li>✅ Offline Capability</li>
              <li>✅ Privacy Focused</li>
              <li>✅ DeepSeek Lite Model</li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3>Usage Tips</h3>
            <ul>
              <li>💡 Ask coding questions</li>
              <li>💡 Request explanations</li>
              <li>💡 Get creative writing help</li>
              <li>💡 All processing is local</li>
            </ul>
          </div>
          
        </div>
      </main>
    </div>
  )
}

export default App 