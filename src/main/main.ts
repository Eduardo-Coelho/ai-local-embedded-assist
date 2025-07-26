import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { mlService } from './MLService'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

// Disable GPU acceleration to prevent crashes
app.disableHardwareAcceleration()

// Set environment variables for better stability
process.env.NODE_ENV = 'development';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Handle GPU process crashes gracefully
app.on('gpu-process-crashed', (event, killed) => {
  console.log('GPU process crashed:', { killed })
})

app.on('render-process-gone', (event, webContents, details) => {
  console.log('Render process gone:', details)
})

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Disable GPU acceleration for stability
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Increase memory limits for model loading
      backgroundThrottling: false,
      // Disable experimental features
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'))
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle renderer process crashes
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.log('Renderer process crashed:', { killed })
    // Optionally reload the window
    // mainWindow?.reload()
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  createWindow()
  
  // Auto-start Python backend (keep this)
  console.log('🚀 Starting application...')
  await mlService.autoStart()
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Keep only the basic IPC handlers, remove ML-specific ones
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-name', () => {
  return app.getName()
})

// Optional: Keep a simple IPC handler to check if Python server is running
ipcMain.handle('check-python-server', async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/health');
    return { success: true, running: response.ok };
  } catch (error) {
    return { success: false, running: false };
  }
})