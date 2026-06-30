const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'RK Dental Clinic Suite',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start local Express backend child process for CJS standalone builds
function startBackendServer() {
  const serverPath = path.join(__dirname, '../dist/server.cjs');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Express API backend child process exited with code ${code} and signal ${signal}`);
  });
}

app.whenReady().then(() => {
  if (process.env.NODE_ENV !== 'development') {
    startBackendServer();
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

// --- Register native clinical IPC handlers ---

ipcMain.handle('app:print', async (event, options) => {
  if (mainWindow) {
    mainWindow.webContents.print(options, (success, errorType) => {
      if (!success) console.error('Clinical print failed:', errorType);
    });
  }
});

ipcMain.handle('app:whatsapp-share', async (event, { phone, message }) => {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  await shell.openExternal(url);
});
