import { useEffect, useRef } from 'react';
import { wsUrl } from '../api.js';

// Mantiene una única conexión WebSocket y despacha eventos por tipo ('message' | 'notification')
export function useWebSocket(enabled, onEvent) {
  const wsRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let socket;

    function connect() {
      socket = new WebSocket(wsUrl());
      wsRef.current = socket;

      socket.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          onEventRef.current?.(payload);
        } catch {
          /* ignorar mensajes no-JSON */
        }
      };

      socket.onclose = () => {
        if (!cancelled) setTimeout(connect, 3000); // reconexión simple
      };
    }

    connect();
    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [enabled]);

  return wsRef;
}
