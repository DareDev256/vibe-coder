import { Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getServerState } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let trayInstance = null;

// Game state for rich tray menu
let gameState = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  weapon: 'None',
  runTime: '0:00',
  isPlaying: false
};

// Last XP event for tray display
let lastXPEvent = null;

// Store callbacks for menu updates
let callbacks = {};

export function createTray(settings, toggleWindowFn, quitFn, setWindowModeFn, toggleAlwaysOnTopFn) {
  // Store callbacks for later use
  callbacks = { toggleWindowFn, quitFn, setWindowModeFn, toggleAlwaysOnTopFn };

  // Try multiple icon paths
  const iconPaths = [
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/assets/sprites/player.png'),
    path.join(__dirname, '../public/assets/sprites/player/vibe-coder-idle.png')
  ];

  let trayIcon = null;

  for (const iconPath of iconPaths) {
    try {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) {
        // Resize to 22x22 for macOS menu bar (or 16x16 for template)
        trayIcon = img.resize({ width: 22, height: 22 });
        // On macOS, set as template image for proper menu bar appearance
        if (process.platform === 'darwin') {
          trayIcon.setTemplateImage(true);
        }
        console.log('[Tray] Using icon:', iconPath);
        break;
      }
    } catch (e) {
      console.log('[Tray] Failed to load icon:', iconPath, e.message);
    }
  }

  // Fallback: create a simple colored icon if no file found
  if (!trayIcon || trayIcon.isEmpty()) {
    console.log('[Tray] Creating fallback icon');
    // Create a simple 22x22 cyan square as fallback
    const size = 22;
    const canvas = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      canvas[i * 4] = 0;      // R
      canvas[i * 4 + 1] = 255; // G
      canvas[i * 4 + 2] = 255; // B
      canvas[i * 4 + 3] = 255; // A
    }
    trayIcon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  try {
    trayInstance = new Tray(trayIcon);
    trayInstance.setToolTip('Vibe Coder');
    console.log('[Tray] Created successfully');

    // Set up click handlers
    trayInstance.on('click', () => {
      toggleWindowFn();
    });

    // Build initial menu
    updateTrayMenu(trayInstance, null, settings, quitFn);
  } catch (e) {
    console.error('[Tray] Failed to create tray:', e);
  }

  return trayInstance;
}

export function updateTrayMenu(tray, mainWindow, settings, quitFn) {
  if (!tray) return;

  const trayMode = settings?.get('trayMode', 'rich') || 'rich';
  const currentWindowMode = settings?.get('windowMode', 'floating') || 'floating';
  const alwaysOnTop = settings?.get('alwaysOnTop', false);

  let menuTemplate = [];

  // Get server state
  const serverState = getServerState();
  const serverStatus = serverState.running
    ? `Server: ON (${serverState.clientCount} clients)`
    : 'Server: OFF';

  if (trayMode === 'rich') {
    // Rich mode: show game state + window options + server status
    menuTemplate = [
      { label: `Level ${gameState.level}`, enabled: false },
      { label: `XP: ${gameState.xp}/${gameState.xpToNext}`, enabled: false },
      { label: `Weapon: ${gameState.weapon}`, enabled: false },
      { type: 'separator' },
      { label: serverStatus, enabled: false },
      { type: 'separator' },
      {
        label: mainWindow?.isVisible() ? 'Hide Window' : 'Show Window',
        accelerator: 'CmdOrCtrl+Shift+V',
        click: () => callbacks.toggleWindowFn?.()
      },
      { type: 'separator' },
      {
        label: 'Window Mode',
        submenu: [
          { label: 'Floating', type: 'radio', checked: currentWindowMode === 'floating', click: () => callbacks.setWindowModeFn?.('floating') },
          { label: 'Corner Snap', type: 'radio', checked: currentWindowMode === 'cornerSnap', click: () => callbacks.setWindowModeFn?.('cornerSnap') },
          { label: 'Desktop Widget', type: 'radio', checked: currentWindowMode === 'desktopWidget', click: () => callbacks.setWindowModeFn?.('desktopWidget') },
          { label: 'Mini HUD', type: 'radio', checked: currentWindowMode === 'miniHud', click: () => callbacks.setWindowModeFn?.('miniHud') }
        ]
      },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: alwaysOnTop,
        click: () => callbacks.toggleAlwaysOnTopFn?.()
      },
      { type: 'separator' },
      { label: 'Settings...', click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }},
      { type: 'separator' },
      { label: 'Quit Vibe Coder', click: quitFn || callbacks.quitFn }
    ];
  } else {
    // Minimal mode: just show/hide and quit
    menuTemplate = [
      {
        label: mainWindow?.isVisible() ? 'Hide' : 'Show',
        click: () => callbacks.toggleWindowFn?.()
      },
      { type: 'separator' },
      { label: 'Quit', click: quitFn || callbacks.quitFn }
    ];
  }

  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
}

export function updateGameState(newState) {
  gameState = { ...gameState, ...newState };
}

export function setTrayIcon(iconPath) {
  if (!trayInstance) return;

  try {
    let icon = nativeImage.createFromPath(iconPath);
    icon = icon.resize({ width: 22, height: 22 });
    trayInstance.setImage(icon);
  } catch (e) {
    console.error('Failed to set tray icon:', e);
  }
}
