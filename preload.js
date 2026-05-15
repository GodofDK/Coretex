// preload.js — runs in renderer context but has access to Node APIs
// Exposes a safe, limited API to index.html via window.electronAPI

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // Save a camera recording segment directly to disk
  // buffer: ArrayBuffer, filename: string, defaultDir: string|null
  saveRecording: (buffer, filename, defaultDir) =>
    ipcRenderer.invoke('save-recording', { buffer, filename, defaultDir }),

  // Let user pick a folder for recordings
  chooseFolder: () =>
    ipcRenderer.invoke('choose-folder'),

  // Open a folder in Explorer/Finder
  openFolder: (folderPath) =>
    ipcRenderer.invoke('open-folder', folderPath),

  // Get the app version
  getVersion: () =>
    ipcRenderer.invoke('get-version'),

  // Are we running inside Electron?
  isElectron: true,
});
