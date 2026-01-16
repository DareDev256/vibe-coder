// WebSocket connection to Vibe Coder XP Server

const WS_URL = 'ws://localhost:3333';

let socket = null;
let reconnectTimer = null;
let connected = false;

export function connectToXPServer() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  console.log('🔌 Connecting to XP server...');

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      connected = true;
      console.log('✅ Connected to XP server!');

      // Dispatch connection event
      window.dispatchEvent(new CustomEvent('xpserver-connected'));

      // Clear any reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const sourceName = data.sourceName || 'CODE';
        console.log(`📥 XP Event: ${data.type} +${data.amount} [${sourceName}]`);

        // Add XP through the game state
        if (window.VIBE_CODER) {
          // Pass source to addXP so isCodingActive() works for auto-move
          const source = {
            name: data.sourceName || 'CODE',
            color: data.sourceColor || '#ffffff'
          };
          window.VIBE_CODER.addXP(data.amount, source);
        }
      } catch (e) {
        console.error('Failed to parse XP event:', e);
      }
    };

    socket.onclose = () => {
      connected = false;
      console.log('❌ Disconnected from XP server');

      // Dispatch disconnection event
      window.dispatchEvent(new CustomEvent('xpserver-disconnected'));

      // Try to reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectToXPServer();
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.log('⚠️ XP server not available (is it running?)');
    };
  } catch (e) {
    console.log('⚠️ Could not connect to XP server');
  }
}

export function isConnected() {
  return connected;
}

export function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
