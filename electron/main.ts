import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { initDatabase, db } from './db';
import { createHandlers } from './services';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 1200,
    minHeight: 720,
    title: 'DOBİ',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase(app.getPath('userData'));
  createHandlers({ ipcMain, db, dialog, app });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:getMeta', () => ({
  appName: 'DOBİ',
  developer: 'Tolgahan Doğan',
  version: app.getVersion(),
  offline: true
}));
