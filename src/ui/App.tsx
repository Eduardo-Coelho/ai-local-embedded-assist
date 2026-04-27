import './App.css';
import { useState, useEffect } from 'react';
import { ChatContainer, Sidebar } from './components';
import { AIServiceInit } from './services';

interface AppInfo {
  name: string;
  version: string;
}

interface ModelInfo {
  name: string;
  size: string;
  loaded: boolean;
}

function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>({ name: '', version: '' });
  const [modelInfo, setModelInfo] = useState<ModelInfo>({
    name: '',
    size: '',
    loaded: false,
  });
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);

  useEffect(() => {
    const getAppInfo = async () => {
      try {
        const windowVar: any = window;
        const name = await windowVar?.electronAPI.getAppName();
        const version = await windowVar?.electronAPI.getAppVersion();
        setAppInfo({ name, version });
      } catch (error) {
        console.error('Failed to get app info:', error);
        setAppInfo({ name: 'AI Local Embedded Assistant', version: '1.0.0' });
      }
    };
    getAppInfo();
    initializeModel();
  }, []);

  const initializeModel = async () => {
    try {
      setIsLoadingModel(true);
      setModelProgress(0);
      await AIServiceInit.loadModel();
      const info = await AIServiceInit.getModelInfo();
      setModelInfo(info);
      setUsingFallback(false);

      console.log('ML model initialized successfully via HTTP');
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
    } finally {
      setIsLoadingModel(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-info">
          <h1>{appInfo.name}</h1>
          <p className="version">Version {appInfo.version}</p>
        </div>
        <div className="status-indicator">
          <span
            className={`status-dot ${modelInfo.loaded ? 'online' : 'offline'}`}
          ></span>
          <span>
            {modelInfo.loaded
              ? usingFallback
                ? 'Simple AI Ready'
                : 'ML Model Ready'
              : isLoadingModel
                ? 'Loading Model...'
                : 'Model Not Loaded'}
          </span>
        </div>
      </header>

      <main className="app-main">
        <ChatContainer
          modelProgress={modelProgress}
          isLoadingModel={isLoadingModel}
          usingFallback={usingFallback}
          modelInfo={modelInfo}
        />
        <Sidebar
          modelName={modelInfo.name}
          modelSize={modelInfo.size}
          modelStatus={modelInfo.loaded}
        />
      </main>
    </div>
  );
}

export default App;
