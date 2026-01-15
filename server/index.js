import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
app.use(express.json());

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
function broadcastXP(type, amount) {
  const message = JSON.stringify({ type, amount, timestamp: Date.now() });
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
  console.log(`📤 Broadcast: ${type} +${amount} XP (${clients.size} clients)`);
}

// XP values for different events
const XP_VALUES = {
  message: 10,        // User sent a message
  tool_use: 5,        // Tool was used (file read, edit, etc.)
  task_complete: 50,  // Task completed
  response: 5,        // Claude responded
};

// API endpoint for hooks to call
app.post('/event', (req, res) => {
  const { type, data } = req.body;

  let xpAmount = XP_VALUES[type] || 5;

  // Bonus XP for certain actions
  if (type === 'tool_use' && data?.tool) {
    if (data.tool.includes('Edit') || data.tool.includes('Write')) {
      xpAmount = 15; // Code changes = more XP
    }
    if (data.tool.includes('Bash')) {
      xpAmount = 10; // Running commands
    }
  }

  broadcastXP(type, xpAmount);
  res.json({ success: true, xp: xpAmount });
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
