'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketHook {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
}

export function useWebSocket(url: string): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        setLastMessage(event.data);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected. Retrying...');
      setIsConnected(false);
      setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      socket.close();
    };

    socketRef.current = socket;
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent.');
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
