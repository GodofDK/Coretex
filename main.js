const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');

// ── Keep a global reference so the window isn't garbage-collected ──
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1400,
    height: 900,
    minWidth:  900,
    minHeight: 600,
    title: 'CORETEX // SECURE NODE',
    backgroundColor: '#020810',   // matches --bg in CSS — no white flash on load
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,    // keep renderer sandboxed
      webSecurity: true,
    },
    // Frameless feel — comment out if you prefer native title bar
    // titleBarStyle: 'hidden',
  });

  mainWindow.loadFile('index.html');

  // Open DevTools only in dev mode (run with: CORETEX_DEV=1 npm start)
  if(process.env.CORETEX_DEV) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if(!url.startsWith('file://')) {
      e.preventDefault();
      shell.openExternal(url); // open links in real browser
    }
  });

  // Remove the default menu bar (gives ~30px back and looks cleaner)
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if(BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC: Save recording to a specific folder ─────────────────────────
// Called from renderer when a camera segment is ready to save
ipcMain.handle('save-recording', async (event, { buffer, filename, defaultDir }) => {
  try {
    // Ask user to pick a save folder (once — we remember it after that)
    let targetDir = defaultDir;
    if(!targetDir || !fs.existsSync(targetDir)) {
      const result = await dialog.showOpenDialog(mainWindow, {
        title:       'Vælg optagelsesmappe',
        buttonLabel: 'Gem her',
        properties:  ['openDirectory', 'createDirectory'],
      });
      if(result.canceled || !result.filePaths.length) return { ok: false, reason: 'cancelled' };
      targetDir = result.filePaths[0];
    }
    const fullPath = path.join(targetDir, filename);
    fs.writeFileSync(fullPath, Buffer.from(buffer));
    return { ok: true, path: fullPath, dir: targetDir };
  } catch(err) {
    return { ok: false, reason: err.message };
  }
});

// ── IPC: Choose recording folder (called from settings) ──────────────
ipcMain.handle('choose-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title:       'Vælg optagelsesmappe',
    buttonLabel: 'Brug denne mappe',
    properties:  ['openDirectory', 'createDirectory'],
  });
  if(result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// ── IPC: Open folder in Explorer/Finder ─────────────────────────────
ipcMain.handle('open-folder', async (event, folderPath) => {
  if(folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

// ── IPC: Get app version ─────────────────────────────────────────────
ipcMain.handle('get-version', () => app.getVersion());
