import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer (game)
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Game state (for tray updates)
  updateGameState: (state) => ipcRenderer.send('game:state', state),

  // Notifications
  showNotification: (title, body) => ipcRenderer.send('notification:show', { title, body }),

  // Server control
  getServerState: () => ipcRenderer.invoke('server:getState'),
  toggleServer: () => ipcRenderer.send('server:toggle'),

  // Event listeners
  onXPEvent: (callback) => {
    ipcRenderer.on('xp-event', (_, event) => callback(event));
  },
  onWindowModeChanged: (callback) => {
    ipcRenderer.on('window-mode-changed', (_, mode) => callback(mode));
  },

  // Check if running in Electron
  isElectron: true,

  // Platform info
  platform: process.platform
});

// Let the game know it's running in Electron
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Vibe Coder] Running in Electron with built-in XP server');
});
