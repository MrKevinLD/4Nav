const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  prepareSession: (partitionName) => ipcRenderer.invoke('session:prepare', partitionName),
  clearSession: (partitionName) => ipcRenderer.invoke('session:clear', partitionName),
  openExternal: (targetUrl) => ipcRenderer.invoke('shell:openExternal', targetUrl),
  onBlockedDownload: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('security:blocked-download', handler);
    return () => ipcRenderer.removeListener('security:blocked-download', handler);
  },
  onDownloadUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download:updated', handler);
    return () => ipcRenderer.removeListener('download:updated', handler);
  },
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  openDownloadedFile: (filePath) => ipcRenderer.invoke('downloads:openFile', filePath),
  showDownloadedFileInFolder: (filePath) => ipcRenderer.invoke('downloads:showInFolder', filePath),
  cancelDownload: (id) => ipcRenderer.invoke('downloads:cancel', id),
  clearDownloads: () => ipcRenderer.invoke('downloads:clear'),
});

