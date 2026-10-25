import { useEffect, useRef } from 'react';

export interface RealtimeEventPayload {
  type: string;
  data: any;
  timestamp: number;
}

export function useRealtimeEvents(onEvent?: (event: RealtimeEventPayload) => void) {
  const eventHandlerRef = useRef(onEvent);
  eventHandlerRef.current = onEvent;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onmessage = (e) => {
          try {
            if (!e.data || e.data.startsWith(':')) return; // Ignore heartbeats
            const payload: RealtimeEventPayload = JSON.parse(e.data);
            if (payload && eventHandlerRef.current) {
              eventHandlerRef.current(payload);
            }
          } catch (err) {
            // parse error ignore
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 6 seconds
          retryTimeout = setTimeout(connect, 6000);
        };
      } catch (err) {
        retryTimeout = setTimeout(connect, 6000);
      }
    }

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);
}
