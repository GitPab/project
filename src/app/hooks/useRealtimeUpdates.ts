import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getToken } from '../services/tokenHelper';

interface SSEMessage {
  type: 'connected' | 'stats' | 'new_registration' | 'registration_updated' | 'heartbeat';
  data?: any;
  timestamp?: string;
  clientId?: number;
  registrations?: number;
}

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ registrations: 0 });
  const [lastEvent, setLastEvent] = useState<SSEMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Max retry limit
  const isMaxRetriesReached = retryCount >= maxRetries;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isManualClose = false;

    const connect = () => {
      // Stop trying if max retries reached
      if (retryCount >= maxRetries) {
        console.log(`[SSE] Max retries (${maxRetries}) reached, stopping reconnect attempts`);
        return;
      }

      if (eventSource) {
        eventSource.close();
      }

      // EventSource doesn't support custom headers, pass token via query string
      const sseUrl = `${baseUrl}/api/sse/registrations?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
        setRetryCount(0);
        console.log('[SSE] Connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          setLastEvent(data);

          switch (data.type) {
            case 'connected':
              console.log('[SSE] Connected with clientId:', data.clientId);
              break;
            
            case 'stats':
              setStats({ registrations: data.registrations || 0 });
              break;
            
            case 'new_registration':
              toast.info(`📬 New registration received!`, {
                description: `${data.data?.studentName || 'A student'} applied to ${data.data?.universityName || 'a university'}`,
                action: {
                  label: 'View',
                  onClick: () => window.location.href = '/admin/registrations'
                }
              });
              break;
            
            case 'registration_updated':
              toast.success(`✅ Registration updated`, {
                description: `Status changed to ${data.data?.status}`
              });
              break;
          }
        } catch (err) {
          console.error('[SSE] Parse error:', err);
        }
      };

      eventSource.onerror = (error) => {
        if (isManualClose) return; // Don't reconnect on manual close
        
        console.error('[SSE] Connection error:', error);
        setIsConnected(false);
        
        // Close current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Check if max retries reached
        if (retryCount >= maxRetries) {
          console.log(`[SSE] Max retries (${maxRetries}) reached, giving up`);
          toast.error('Realtime connection failed. Please refresh the page.');
          return;
        }
        
        // Auto-reconnect with exponential backoff (max 30s)
        const delay = Math.min(5000 * Math.pow(2, retryCount), 30000);
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    // Initial connection
    connect();

    // Handle page unload - clean close
    const handleBeforeUnload = () => {
      isManualClose = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isManualClose = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
      setIsConnected(false);
    };
  }, [retryCount]);

  const refreshStats = useCallback(async () => {
    // This will trigger a manual refresh if needed
    setStats(prev => ({ ...prev }));
  }, []);

  return { isConnected, stats, lastEvent, refreshStats };
}

export default useRealtimeUpdates;
