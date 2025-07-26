import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { mlService, ModelResponse, ModelInfo } from './MLService'

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
app.whenReady().then(createWindow)

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

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-name', () => {
  return app.getName()
})

// ML Service IPC handlers
ipcMain.handle('ml-load-model', async () => {
  try {
    await mlService.loadModel()
    return { success: true }
  } catch (error) {
    console.error('Failed to load model:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('ml-generate-response', async (event, prompt: string, maxLength: number = 256) => {
  try {
    const response = await mlService.generateResponse(prompt, maxLength)
    return { success: true, response }
  } catch (error) {
    console.error('Failed to generate response:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('ml-get-model-info', async () => {
  try {
    const info = await mlService.getModelInfo()
    return { success: true, info }
  } catch (error) {
    console.error('Failed to get model info:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('ml-is-model-ready', async () => {
  try {
    const ready = await mlService.isModelReady()
    return { success: true, ready }
  } catch (error) {
    console.error('Failed to check model readiness:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('ml-unload-model', async () => {
  try {
    await mlService.unloadModel()
    return { success: true }
  } catch (error) {
    console.error('Failed to unload model:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}) 