import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { validateEvent, securityHeaders, VALID_SOURCES, MAX_BODY_SIZE } from './validation.js';

const app = express();
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(securityHeaders);

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Track connected game clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🎮 Game client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🎮 Game client disconnected');
    clients.delete(ws);
  });
});

// Broadcast XP event to all connected game clients
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
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
  console.log(`📤 Broadcast: ${type} +${amount} XP [${sourceInfo.name}] (${clients.size} clients)`);
}

// XP values for different events
const XP_VALUES = {
  message: 10,        // User sent a message
  tool_use: 5,        // Tool was used (file read, edit, etc.)
  task_complete: 50,  // Task completed
  response: 5,        // Claude responded
  // CLI-specific events
  claude_code: 15,    // Claude Code activity
  codex_cli: 12,      // OpenAI Codex CLI
  gemini_cli: 12,     // Google Gemini CLI
  cursor_ai: 10,      // Cursor AI
  copilot: 8,         // GitHub Copilot
};

// CLI source colors (for client display)
const CLI_SOURCES = {
  claude: { name: 'CLAUDE', color: '#00ffff' },    // Cyan
  codex: { name: 'CODEX', color: '#00ff88' },      // Green
  gemini: { name: 'GEMINI', color: '#4488ff' },    // Blue
  cursor: { name: 'CURSOR', color: '#ff88ff' },    // Pink
  copilot: { name: 'COPILOT', color: '#ffaa00' },  // Orange
  unknown: { name: 'CODE', color: '#ffffff' }      // White
};

// API endpoint for hooks to call
app.post('/event', (req, res) => {
  const result = validateEvent(req.body);
  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  const { type, source, toolName } = result;
  let xpAmount = XP_VALUES[type] || 5;

  // CLI-specific XP values
  if (source === 'claude') xpAmount = XP_VALUES.claude_code || xpAmount;
  else if (source === 'codex') xpAmount = XP_VALUES.codex_cli || xpAmount;
  else if (source === 'gemini') xpAmount = XP_VALUES.gemini_cli || xpAmount;
  else if (source === 'cursor') xpAmount = XP_VALUES.cursor_ai || xpAmount;
  else if (source === 'copilot') xpAmount = XP_VALUES.copilot || xpAmount;

  // Bonus XP for certain actions
  if (type === 'tool_use' && toolName) {
    if (toolName.includes('Edit') || toolName.includes('Write')) xpAmount = 15;
    if (toolName.includes('Bash')) xpAmount = 10;
  }

  broadcastXP(type, xpAmount, source);
  res.json({ success: true, xp: xpAmount, source });
});

// CLI-specific endpoints for easier integration
app.post('/cli/:source', (req, res) => {
  const { source } = req.params;
  if (!VALID_SOURCES.has(source) || !CLI_SOURCES[source]) {
    return res.status(400).json({ error: 'Unknown CLI source' });
  }
  const { action } = req.body;

  // Get XP based on source
  const xpKey = `${source}_code` in XP_VALUES ? `${source}_code` :
                `${source}_cli` in XP_VALUES ? `${source}_cli` :
                `${source}_ai` in XP_VALUES ? `${source}_ai` : null;
  const xpAmount = xpKey ? XP_VALUES[xpKey] : 10;

  broadcastXP(action || 'activity', xpAmount, source);
  res.json({ success: true, xp: xpAmount, source });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    uptime: process.uptime()
  });
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           VIBE CODER XP SERVER                    ║
║═══════════════════════════════════════════════════║
║  HTTP API:    http://localhost:${PORT}              ║
║  WebSocket:   ws://localhost:${PORT}                ║
║                                                   ║
║  Waiting for game client connection...            ║
╚═══════════════════════════════════════════════════╝
  `);
});
