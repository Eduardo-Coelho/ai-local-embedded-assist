import React, { useState, useEffect } from 'react'
import './App.css'

interface AppInfo {
  name: string
  version: string
}

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>({ name: '', version: '' })
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState('')

  useEffect(() => {
    // Get app information from Electron main process
    const getAppInfo = async () => {
      try {
        const name = await window.electronAPI.getAppName()
        const version = await window.electronAPI.getAppVersion()
        setAppInfo({ name, version })
      } catch (error) {
        console.error('Failed to get app info:', error)
        setAppInfo({ name: 'AI Local Embedded Assistant', version: '1.0.0' })
      }
    }

    getAppInfo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setIsProcessing(true)
    setResponse('')

    // Simulate AI processing (replace with actual AI model integration)
    setTimeout(() => {
      setResponse(`AI Response: "${inputText}" - This is a simulated response. In a real implementation, this would be processed by your local AI model.`)
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-info">
          <h1>{appInfo.name}</h1>
          <p className="version">Version {appInfo.version}</p>
        </div>
        <div className="status-indicator">
          <span className="status-dot online"></span>
          <span>Local AI Ready</span>
        </div>
      </header>

      <main className="app-main">
        <div className="chat-container">
          <div className="chat-messages">
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
                placeholder="Ask me anything... (Your message will be processed locally by AI)"
                disabled={isProcessing}
                rows={3}
                className="text-input"
              />
              <button 
                type="submit" 
                disabled={isProcessing || !inputText.trim()}
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
            <h3>Features</h3>
            <ul>
              <li>✅ Local AI Processing</li>
              <li>✅ Offline Capability</li>
              <li>✅ Privacy Focused</li>
              <li>✅ Fast Response</li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3>Model Info</h3>
            <p>Lightweight NLP model running locally on your device.</p>
            <p>No internet connection required.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 