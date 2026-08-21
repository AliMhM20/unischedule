const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startDownloadUpdate: () => ipcRenderer.invoke('start-download-update'),
  pauseDownload: () => ipcRenderer.invoke('pause-download'),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onDownloadProgress: (callback) => {
    const handler = (_, progress) => callback(progress);
    ipcRenderer.on('updater-download-progress', handler);
    return () => ipcRenderer.removeListener('updater-download-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_, info) => callback(info);
    ipcRenderer.on('updater-downloaded', handler);
    return () => ipcRenderer.removeListener('updater-downloaded', handler);
  },
  onUpdateCancelled: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('updater-cancelled', handler);
    return () => ipcRenderer.removeListener('updater-cancelled', handler);
  },
  onUpdateError: (callback) => {
    const handler = (_, error) => callback(error);
    ipcRenderer.on('updater-error', handler);
    return () => ipcRenderer.removeListener('updater-error', handler);
  },
});
