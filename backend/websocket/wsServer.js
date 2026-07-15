const WebSocket = require('ws');

// Map of hospitalId -> Set of connected WebSocket clients
// e.g. { "1": Set([ws1, ws2]), "3": Set([ws3]) }
const hospitalSubscriptions = new Map();

const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.hospitalId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        // Client sends { type: 'subscribe', hospitalId: '1' }
        if (data.type === 'subscribe' && data.hospitalId) {
          const hospitalId = String(data.hospitalId);

          // Remove from previous subscription if any
          if (ws.hospitalId) {
            const prevSubs = hospitalSubscriptions.get(ws.hospitalId);
            if (prevSubs) prevSubs.delete(ws);
          }

          // Add to new subscription
          if (!hospitalSubscriptions.has(hospitalId)) {
            hospitalSubscriptions.set(hospitalId, new Set());
          }
          hospitalSubscriptions.get(hospitalId).add(ws);
          ws.hospitalId = hospitalId;

          ws.send(JSON.stringify({
            type: 'subscribed',
            hospitalId,
          }));
        }

        // Client sends { type: 'unsubscribe' }
        if (data.type === 'unsubscribe' && ws.hospitalId) {
          const subs = hospitalSubscriptions.get(ws.hospitalId);
          if (subs) subs.delete(ws);
          ws.hospitalId = null;
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    });

    ws.on('close', () => {
      // Clean up subscription on disconnect
      if (ws.hospitalId) {
        const subs = hospitalSubscriptions.get(ws.hospitalId);
        if (subs) subs.delete(ws);
      }
    });

    // Keep connection alive with ping
    ws.on('pong', () => { ws.isAlive = true; });
  });

  // Ping all clients every 30 seconds to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        if (ws.hospitalId) {
          const subs = hospitalSubscriptions.get(ws.hospitalId);
          if (subs) subs.delete(ws);
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  console.log('WebSocket server initialized');
  return wss;
};

/**
 * Directly broadcast a wait-time update to all WebSocket clients
 * subscribed to the given hospitalId. Called in-process by the
 * hospital controller — no Redis Pub/Sub needed for a single instance.
 */
const broadcastWaitTime = (hospitalId, data) => {
  const subscribers = hospitalSubscriptions.get(String(hospitalId));
  if (!subscribers || subscribers.size === 0) return;

  const payload = JSON.stringify({
    type: 'waittime_update',
    ...data,
  });

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });

  console.log(`Broadcast to ${subscribers.size} clients for hospital ${hospitalId}`);
};

module.exports = { initWebSocket, broadcastWaitTime };
