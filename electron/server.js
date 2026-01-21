import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';

let server = null;
let wss = null;
let expressApp = null;
const clients = new Set();

// Server state
let serverState = {
  running: false,
  port: 3001,
  clientCount: 0,
  lastEvent: null
};

// XP values for different events
const XP_VALUES = {
  message: 10,
  tool_use: 5,
  task_complete: 50,
  response: 5,
  claude_code: 15,
  codex_cli: 12,
  gemini_cli: 12,
  cursor_ai: 10,
  copilot: 8,
};

// CLI source colors
const CLI_SOURCES = {
  claude: { name: 'CLAUDE', color: '#00ffff' },
  codex: { name: 'CODEX', color: '#00ff88' },
  gemini: { name: 'GEMINI', color: '#4488ff' },
  cursor: { name: 'CURSOR', color: '#ff88ff' },
  copilot: { name: 'COPILOT', color: '#ffaa00' },
  unknown: { name: 'CODE', color: '#ffffff' }
};

// Event callback for main process
let onXPEvent = null;

export function setXPEventCallback(callback) {
  onXPEvent = callback;
}

function broadcastXP(type, amount, source = 'unknown') {
  const sourceInfo = CLI_SOURCES[source] || CLI_SOURCES.unknown;
  const message = JSON.stringify({
    type,
    amount,
    source,
    sourceName: sourceInfo.name,
    sourceColor: sourceInfo.color,
    timestamp: Date.now()
  });

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });

  serverState.lastEvent = { type, amount, source, timestamp: Date.now() };

  // Notify main process
  if (onXPEvent) {
    onXPEvent({ type, amount, source, sourceName: sourceInfo.name });
  }

  console.log(`[XP Server] Broadcast: ${type} +${amount} XP [${sourceInfo.name}] (${clients.size} clients)`);
}

export function startServer(port = 3001) {
  if (server) {
    console.log('[XP Server] Server already running');
    return serverState;
  }

  expressApp = express();
  expressApp.use(express.json());

  server = createServer(expressApp);
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[XP Server] Game client connected');
    clients.add(ws);
    serverState.clientCount = clients.size;

    ws.on('close', () => {
      console.log('[XP Server] Game client disconnected');
      clients.delete(ws);
      serverState.clientCount = clients.size;
    });
  });

  // API endpoint for hooks
  expressApp.post('/event', (req, res) => {
    const { type, data, source } = req.body;
    let xpAmount = XP_VALUES[type] || 5;

    // CLI-specific XP
    if (source === 'claude') xpAmount = XP_VALUES.claude_code || xpAmount;
    else if (source === 'codex') xpAmount = XP_VALUES.codex_cli || xpAmount;
    else if (source === 'gemini') xpAmount = XP_VALUES.gemini_cli || xpAmount;
    else if (source === 'cursor') xpAmount = XP_VALUES.cursor_ai || xpAmount;
    else if (source === 'copilot') xpAmount = XP_VALUES.copilot || xpAmount;

    // Bonus XP for code changes
    if (type === 'tool_use' && data?.tool) {
      if (data.tool.includes('Edit') || data.tool.includes('Write')) xpAmount = 15;
      if (data.tool.includes('Bash')) xpAmount = 10;
    }

    broadcastXP(type, xpAmount, source || 'unknown');
    res.json({ success: true, xp: xpAmount, source: source || 'unknown' });
  });

  // CLI-specific endpoints
  expressApp.post('/cli/:source', (req, res) => {
    const { source } = req.params;
    const { action } = req.body;

    if (!CLI_SOURCES[source]) {
      return res.status(400).json({ error: 'Unknown CLI source' });
    }

    const xpAmount = XP_VALUES[`${source}_code`] || XP_VALUES[`${source}_cli`] || 10;
    broadcastXP(action || 'activity', xpAmount, source);
    res.json({ success: true, xp: xpAmount, source });
  });

  // Health check
  expressApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      clients: clients.size,
      uptime: process.uptime()
    });
  });

  server.listen(port, () => {
    console.log(`[XP Server] Running on port ${port}`);
    serverState.running = true;
    serverState.port = port;
  });

  return serverState;
}

export function stopServer() {
  if (!server) {
    console.log('[XP Server] Server not running');
    return;
  }

  // Close all client connections
  clients.forEach((client) => client.close());
  clients.clear();

  wss.close();
  server.close();

  server = null;
  wss = null;
  expressApp = null;

  serverState.running = false;
  serverState.clientCount = 0;

  console.log('[XP Server] Stopped');
}

export function getServerState() {
  return { ...serverState, clientCount: clients.size };
}

export function isServerRunning() {
  return serverState.running;
}
