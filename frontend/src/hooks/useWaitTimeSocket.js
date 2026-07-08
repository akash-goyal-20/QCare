import { useEffect, useRef } from 'react';

/**
 * Subscribes to wait-time WebSocket updates for a specific hospital.
 * Uses a ref for the callback so the WebSocket always calls the LATEST
 * version — prevents stale-closure crashes when the parent re-renders.
 */
const useWaitTimeSocket = (hospitalId, onUpdate) => {
  const wsRef = useRef(null);

  // Keep a stable ref to the latest callback so the WS handler is never stale
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!hospitalId) return;

    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', hospitalId: String(hospitalId) }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'waittime_update') {
          // Always call the latest callback via ref — never a stale closure
          onUpdateRef.current(data);
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => {
      // Close regardless of readyState to prevent orphaned connections
      // (especially important in React 18 StrictMode double-invoke)
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unsubscribe' }));
        }
        ws.close();
      } catch (_) { /* ignore close errors */ }
    };
  }, [hospitalId]);

  return wsRef;
};

export default useWaitTimeSocket;
