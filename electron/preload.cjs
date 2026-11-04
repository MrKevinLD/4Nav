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
});

