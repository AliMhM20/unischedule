const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater, CancellationToken } = require('electron-updater');

// Configure autoUpdater for differential updates
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowDowngrade = false;

let cancellationToken = null;

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-external', async (_, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
  }
});

let mainWindow = null;

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { isDev: true, currentVersion: app.getVersion() };
  }
  try {
    const checkResult = await autoUpdater.checkForUpdates();
    return {
      success: true,
      updateInfo: checkResult?.updateInfo || null,
      currentVersion: app.getVersion(),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      currentVersion: app.getVersion(),
    };
  }
});

ipcMain.handle('start-download-update', async () => {
  try {
    if (app.isPackaged) {
      await autoUpdater.checkForUpdates();
      cancellationToken = new CancellationToken();
      await autoUpdater.downloadUpdate(cancellationToken);
    }
    return { success: true };
  } catch (err) {
    if (err?.message?.includes('cancelled') || err?.name === 'CancellationError') {
      return { success: true, cancelled: true };
    }
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pause-download', () => {
  if (cancellationToken) {
    cancellationToken.cancel();
    cancellationToken = null;
  }
  return { success: true };
});

ipcMain.handle('cancel-download', () => {
  if (cancellationToken) {
    cancellationToken.cancel();
    cancellationToken = null;
  }
  return { success: true };
});

ipcMain.handle('quit-and-install', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true);
  });
});

// AutoUpdater Event Listeners -> Forward to renderer
autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-download-progress', {
      percent: progressObj.percent || 0,
      bytesPerSecond: progressObj.bytesPerSecond || 0,
      transferred: progressObj.transferred || 0,
      total: progressObj.total || 0,
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-downloaded', {
      version: info?.version,
      releaseNotes: info?.releaseNotes,
    });
  }
});

autoUpdater.on('update-cancelled', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-cancelled');
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater-error', err?.message || 'خطا در دانلود به‌روزرسانی');
  }
});

app.name = 'UniSchedule';
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'UniSchedule'));
} catch (e) {
  // Path fallback
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 480,
    title: 'برنامه‌ریز انتخاب واحد و تقویم دانشگاه',
    icon: path.join(__dirname, '../build/icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Remove default menu bar for modern clean UI
  Menu.setApplicationMenu(null);

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
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
