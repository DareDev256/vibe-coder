#!/usr/bin/env node
// Vibe Coder XP Server
// Receives XP events from CLI hooks via HTTP and broadcasts to game via WebSocket

import http from 'http';
import { WebSocketServer } from 'ws';
import { validateEvent, getSecureHeaders, MAX_RAW_BODY_BYTES } from './server/validation.js';

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
  const headers = getSecureHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_RAW_BODY_BYTES) {
        res.writeHead(413);
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const result = validateEvent(event);
        if (!result.valid) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: result.error }));
          return;
        }

        const { type, source } = result;
        const xpAmount = XP_VALUES[type] || 5;

        console.log(`📥 ${type} from ${source} → +${xpAmount} XP`);

        const message = JSON.stringify({
          type,
          amount: xpAmount,
          sourceName: source.toUpperCase(),
          sourceColor: getSourceColor(source)
        });

        clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(message);
          }
        });

        res.writeHead(200);
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
