// WebSocket connection to Vibe Coder XP Server
// Port 3001 is used by the Electron built-in server
// Port 3333 was the old standalone server port

const WS_URL = 'ws://localhost:3001';

let socket = null;
let reconnectTimer = null;
let connected = false;

let connecting = false;

export function connectToXPServer() {
  // Guard against concurrent connection attempts
  if (connecting) return;
  if (socket && socket.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  // Clear stale socket reference (CLOSING/CLOSED state)
  if (socket && socket.readyState !== WebSocket.CONNECTING) {
    socket = null;
  }

  connecting = true;
  console.log('🔌 Connecting to XP server...');

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      connected = true;
      connecting = false;
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
      connecting = false;
      console.log('❌ Disconnected from XP server');

      // Dispatch disconnection event
      window.dispatchEvent(new CustomEvent('xpserver-disconnected'));

      // Schedule reconnect — keep reconnectTimer set until the next
      // attempt starts so duplicate timers can't be created.
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectToXPServer();
        }, 3000);
      }
    };

    socket.onerror = () => {
      console.log('⚠️ XP server not available (is it running?)');
      // onclose will fire after onerror, which handles reconnection
    };
  } catch (e) {
    connecting = false;
    console.log('⚠️ Could not connect to XP server');
  }
}

export function isConnected() {
  return connected;
}

export function disconnect() {
  connecting = false;
  if (socket) {
    socket.close();
    socket = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
