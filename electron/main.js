import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { createTray, updateTrayMenu } from './tray.js';
import { createSettingsStore } from './settings.js';
import { applyWindowMode, cycleWindowMode, getWindowModeConfig } from './windows.js';
import { startServer, stopServer, getServerState, setXPEventCallback } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let settings = null;
let currentWindowMode = 'floating';
let appIsReady = false;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createWindow() {
  const bounds = settings.get('windowBounds', {
    width: 800,
    height: 600
  });

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 400,
    minHeight: 300,
    title: 'Vibe Coder',
    icon: path.join(__dirname, '../public/assets/sprites/player.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // Start with standard frame, can be made frameless for widget modes later
    frame: true,
    // Transparent background for future desktop widget mode
    transparent: false,
    backgroundColor: '#1a1a2e'
  });

  // Load the game
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Save window position/size on close
  mainWindow.on('close', (event) => {
    // Prevent actual close, minimize to tray instead
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }

    // Save bounds before closing
    const bounds = mainWindow.getBounds();
    settings.set('windowBounds', bounds);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Update tray when window state changes
  mainWindow.on('show', () => updateTrayMenu(tray, mainWindow, settings));
  mainWindow.on('hide', () => updateTrayMenu(tray, mainWindow, settings));

  return mainWindow;
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function setWindowMode(mode) {
  if (!mainWindow) return;

  currentWindowMode = mode;
  settings.set('windowMode', mode);
  applyWindowMode(mainWindow, mode, settings);
  updateTrayMenu(tray, mainWindow, settings, quitApp);

  // Notify renderer of mode change
  mainWindow.webContents.send('window-mode-changed', mode);
}

function cycleMode() {
  const nextMode = cycleWindowMode(currentWindowMode);
  setWindowMode(nextMode);
}

function toggleAlwaysOnTop() {
  if (!mainWindow) return;

  const current = settings.get('alwaysOnTop', false);
  const newValue = !current;
  settings.set('alwaysOnTop', newValue);
  mainWindow.setAlwaysOnTop(newValue);
  updateTrayMenu(tray, mainWindow, settings, quitApp);
}

function quitApp() {
  stopServer(); // Stop the XP server before quitting
  app.isQuitting = true;
  app.quit();
}

// Server management
function initServer() {
  const serverMode = settings.get('serverMode', 'built-in');

  if (serverMode === 'built-in') {
    startServer(3001);

    // Set up callback to forward XP events to renderer
    setXPEventCallback((event) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('xp-event', event);
      }
      // Update tray with latest activity
      updateTrayMenu(tray, mainWindow, settings, quitApp);
    });
  }
}

function toggleServerMode() {
  const currentMode = settings.get('serverMode', 'built-in');
  const newMode = currentMode === 'built-in' ? 'external' : 'built-in';

  if (newMode === 'built-in') {
    startServer(3001);
  } else {
    stopServer();
  }

  settings.set('serverMode', newMode);
  updateTrayMenu(tray, mainWindow, settings, quitApp);
}

function registerGlobalShortcuts() {
  const toggleHotkey = settings.get('toggleHotkey', 'CommandOrControl+Shift+V');
  const cycleHotkey = settings.get('cycleWindowHotkey', 'CommandOrControl+Shift+W');

  globalShortcut.register(toggleHotkey, () => {
    toggleWindow();
  });

  globalShortcut.register(cycleHotkey, () => {
    cycleMode();
  });
}

// IPC handlers for renderer communication
function setupIPC() {
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.hide());

  ipcMain.handle('settings:get', (_, key) => settings.get(key));
  ipcMain.handle('settings:set', (_, key, value) => {
    settings.set(key, value);
    return true;
  });

  ipcMain.on('window:setMode', (_, mode) => setWindowMode(mode));
  ipcMain.on('window:toggleAlwaysOnTop', () => toggleAlwaysOnTop());

  // Server IPC
  ipcMain.handle('server:getState', () => getServerState());
  ipcMain.on('server:toggle', () => toggleServerMode());
}

app.whenReady().then(() => {
  appIsReady = true;

  // Initialize settings
  settings = createSettingsStore();

  // Load saved window mode
  currentWindowMode = settings.get('windowMode', 'floating');

  // Set up IPC handlers
  setupIPC();

  // Create system tray
  tray = createTray(settings, toggleWindow, quitApp, setWindowMode, toggleAlwaysOnTop);

  // Create main window
  createWindow();

  // Apply saved window mode
  if (currentWindowMode !== 'floating') {
    applyWindowMode(mainWindow, currentWindowMode, settings);
  }

  // Register global shortcuts
  registerGlobalShortcuts();

  // Start built-in XP server if enabled
  initServer();

  // macOS: re-create window when clicking dock icon
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Handle second instance (single instance lock) - must be at top level
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Unregister shortcuts on quit (only if app was ready)
app.on('will-quit', () => {
  if (appIsReady) {
    globalShortcut.unregisterAll();
  }
});

// Keep app running in background on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running if tray exists
    // Only quit if explicitly requested
  }
});

export { mainWindow, toggleWindow };
