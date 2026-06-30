const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge exposing safe IPC channels
contextBridge.exposeInMainWorld('electronAPI', {
  print: (options) => ipcRenderer.invoke('app:print', options),
  shareWhatsApp: (payload) => ipcRenderer.invoke('app:whatsapp-share', payload),
  getVersion: () => '1.0.0',
});
