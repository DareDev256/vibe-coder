import Store from 'electron-store';

const defaults = {
  // Launch
  autoStart: false,

  // Tray
  trayMode: 'rich', // minimal | rich | miniWidget | hidden

  // Window
  windowMode: 'floating', // floating | cornerSnap | desktopWidget | miniHud
  alwaysOnTop: false,
  windowBounds: { width: 800, height: 600 },
  cornerPosition: 'bottom-right',

  // Audio
  musicEnabled: true,
  musicVolume: 0.5,
  sfxEnabled: true,
  sfxVolume: 0.7,
  xpChimeEnabled: true,

  // Notifications
  notifyLevelUp: true,
  notifyLegendary: true,
  notifyHighScore: false,

  // Server
  serverMode: 'built-in', // built-in | external
  externalServerUrl: 'ws://localhost:3001',

  // Hotkeys
  toggleHotkey: 'CommandOrControl+Shift+V',
  cycleWindowHotkey: 'CommandOrControl+Shift+W'
};

let store = null;

export function createSettingsStore() {
  store = new Store({
    name: 'vibe-coder-settings',
    defaults
  });

  return store;
}

export function getSettings() {
  return store;
}
