import { screen } from 'electron';

// Window mode configurations
const WINDOW_MODES = {
  floating: {
    name: 'Floating',
    frame: true,
    resizable: true,
    transparent: false,
    skipTaskbar: false,
    alwaysOnTop: false,
    defaultSize: { width: 800, height: 600 }
  },
  cornerSnap: {
    name: 'Corner Snap',
    frame: true,
    resizable: false,
    transparent: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    defaultSize: { width: 400, height: 300 }
  },
  desktopWidget: {
    name: 'Desktop Widget',
    frame: false,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: false, // Actually "always on bottom" - handled specially
    defaultSize: { width: 600, height: 400 }
  },
  miniHud: {
    name: 'Mini HUD',
    frame: false,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    defaultSize: { width: 200, height: 150 }
  }
};

const CORNER_POSITIONS = {
  'top-left': (display, size) => ({ x: display.workArea.x + 20, y: display.workArea.y + 20 }),
  'top-right': (display, size) => ({ x: display.workArea.x + display.workArea.width - size.width - 20, y: display.workArea.y + 20 }),
  'bottom-left': (display, size) => ({ x: display.workArea.x + 20, y: display.workArea.y + display.workArea.height - size.height - 20 }),
  'bottom-right': (display, size) => ({ x: display.workArea.x + display.workArea.width - size.width - 20, y: display.workArea.y + display.workArea.height - size.height - 20 })
};

export function getWindowModeConfig(mode) {
  return WINDOW_MODES[mode] || WINDOW_MODES.floating;
}

export function getCornerPosition(cornerName, windowSize) {
  const display = screen.getPrimaryDisplay();
  const positionFn = CORNER_POSITIONS[cornerName] || CORNER_POSITIONS['bottom-right'];
  return positionFn(display, windowSize);
}

export function applyWindowMode(window, mode, settings) {
  const config = getWindowModeConfig(mode);
  const currentBounds = window.getBounds();

  // Apply mode-specific settings
  window.setResizable(config.resizable);
  window.setSkipTaskbar(config.skipTaskbar);
  window.setAlwaysOnTop(config.alwaysOnTop || settings.get('alwaysOnTop', false));

  // Handle size changes
  if (mode === 'cornerSnap') {
    const cornerPosition = settings.get('cornerPosition', 'bottom-right');
    const size = config.defaultSize;
    const position = getCornerPosition(cornerPosition, size);
    window.setBounds({ ...position, ...size });
  } else if (mode === 'miniHud') {
    const size = config.defaultSize;
    // Position in bottom-right by default for mini HUD
    const position = getCornerPosition('bottom-right', size);
    window.setBounds({ ...position, ...size });
  } else if (mode === 'desktopWidget') {
    // Center on screen for desktop widget
    const display = screen.getPrimaryDisplay();
    const size = config.defaultSize;
    const x = display.workArea.x + (display.workArea.width - size.width) / 2;
    const y = display.workArea.y + (display.workArea.height - size.height) / 2;
    window.setBounds({ x: Math.round(x), y: Math.round(y), ...size });

    // Desktop widget goes behind other windows
    window.setAlwaysOnTop(false);
    // On macOS, we can use setVisibleOnAllWorkspaces for widget-like behavior
    if (process.platform === 'darwin') {
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    }
  } else {
    // Floating mode - restore saved bounds or use defaults
    const savedBounds = settings.get('windowBounds');
    if (savedBounds && savedBounds.width && savedBounds.height) {
      window.setBounds(savedBounds);
    }
  }

  // Handle frame changes (requires window recreation for some changes)
  // For now, we'll handle transparency via CSS in the renderer

  return config;
}

export function cycleWindowMode(currentMode) {
  const modes = Object.keys(WINDOW_MODES);
  const currentIndex = modes.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  return modes[nextIndex];
}

export function snapToCorner(window, corner, settings) {
  const size = window.getBounds();
  const position = getCornerPosition(corner, size);
  window.setBounds({ ...position, width: size.width, height: size.height });
  settings.set('cornerPosition', corner);
}

export function cycleCorner(currentCorner) {
  const corners = Object.keys(CORNER_POSITIONS);
  const currentIndex = corners.indexOf(currentCorner);
  const nextIndex = (currentIndex + 1) % corners.length;
  return corners[nextIndex];
}

export { WINDOW_MODES, CORNER_POSITIONS };
