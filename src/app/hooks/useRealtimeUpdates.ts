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

  console.log('🚀 useRealtimeUpdates hook called');

  useEffect(() => {
    const token = getToken();
    console.log('🔑 Token from getToken():', token ? 'exists' : 'null');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      // EventSource doesn't support custom headers, pass token via query string
      const sseUrl = `${baseUrl}/api/sse/registrations?token=${encodeURIComponent(token)}`;
      console.log('🌐 SSE connecting to:', sseUrl);
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
        setRetryCount(0);
        console.log('🔌 SSE Connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          setLastEvent(data);

          switch (data.type) {
            case 'connected':
              console.log('✅ Real-time connection established:', data.clientId);
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
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        console.log('🔍 SSE readyState:', eventSource?.readyState); // 0=connecting, 1=open, 2=closed
        setIsConnected(false);
        
        // Close current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(5000 * Math.pow(2, retryCount), 30000);
        setRetryCount(prev => prev + 1);
        
        console.log(`🔄 SSE reconnecting in ${delay}ms... (attempt ${retryCount + 1})`);
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    // Initial connection
    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
      setIsConnected(false);
      console.log('🔌 SSE Disconnected');
    };
  }, [retryCount]);

  const refreshStats = useCallback(async () => {
    // This will trigger a manual refresh if needed
    setStats(prev => ({ ...prev }));
  }, []);

  return { isConnected, stats, lastEvent, refreshStats };
}

export default useRealtimeUpdates;
