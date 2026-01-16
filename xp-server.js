#!/usr/bin/env node
// Vibe Coder XP Server
// Receives XP events from CLI hooks via HTTP and broadcasts to game via WebSocket

import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = 3333;
const clients = new Set();

// XP amounts for different event types
const XP_VALUES = {
  tool_use: 10,
  response: 5,
  message: 10,
  unknown: 5
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const eventType = event.type || 'unknown';
        const source = event.source || 'claude';
        const xpAmount = XP_VALUES[eventType] || 5;

        console.log(`📥 ${eventType} from ${source} → +${xpAmount} XP`);

        // Broadcast to all connected game clients
        const message = JSON.stringify({
          type: eventType,
          amount: xpAmount,
          sourceName: source.toUpperCase(),
          sourceColor: getSourceColor(source)
        });

        clients.forEach(client => {
          if (client.readyState === 1) { // OPEN
            client.send(message);
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, xp: xpAmount }));
      } catch (e) {
        console.error('Parse error:', e.message);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server on same port
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🎮 Game connected! (${clients.size} client${clients.size > 1 ? 's' : ''})`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🎮 Game disconnected (${clients.size} client${clients.size > 1 ? 's' : ''} remaining)`);
  });
});

function getSourceColor(source) {
  const colors = {
    claude: '#ff9f43',
    cursor: '#00d9ff',
    codex: '#00ff88',
    gemini: '#4285f4',
    copilot: '#6e40c9'
  };
  return colors[source.toLowerCase()] || '#ffffff';
}

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     🎮 VIBE CODER XP SERVER               ║
║                                           ║
║     WebSocket: ws://localhost:${PORT}       ║
║     HTTP POST: http://localhost:${PORT}     ║
╚═══════════════════════════════════════════╝
  `);
});
