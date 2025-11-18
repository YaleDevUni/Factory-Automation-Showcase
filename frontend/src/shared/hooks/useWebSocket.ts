import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url: string) => {
  const [data, setData] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnecting(false);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(message);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnecting(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnecting(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, isConnecting };
};

export default useWebSocket;
