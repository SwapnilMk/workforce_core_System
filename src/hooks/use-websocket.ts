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
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect BroadcastChannel for instant same-browser cross-tab syncing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('egc_workforce_realtime');
      channel.onmessage = (event) => {
        setLastMessage(event.data);
      };
      broadcastChannelRef.current = channel;
      return () => {
        channel.close();
      };
    }
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('WebSocket Connected successfully');
        setIsConnected(true);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
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
        console.log('WebSocket connection inactive. Activating high-performance polling shield...');
        setIsConnected(false);
        startPollingFallback();
      };

      socket.onerror = () => {
        socket.close();
      };

      socketRef.current = socket;
    } catch (e) {
      console.log('WebSocket connection failed. Falling back to active REST polling channel...');
      setIsConnected(false);
      startPollingFallback();
    }
  }, [url]);

  const startPollingFallback = () => {
    if (pollingIntervalRef.current) return;
    
    // Simulate real-time by trigger polling updates every 8 seconds (gentle rest fallback)
    pollingIntervalRef.current = setInterval(() => {
      // Trigger a custom event to notify listeners they should query REST endpoints
      if (typeof window !== 'undefined') {
        const pollEvent = new CustomEvent('egc_poll_chat');
        window.dispatchEvent(pollEvent);
      }
      setIsConnected(true); // Treat polling mode as connected for UI convenience
    }, 8000);
  };

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    // 1. Send via WebSocket if open
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
    
    // 2. Broadcast locally across tabs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(message);
    }
    
    // 3. Trigger immediate page update locally
    setLastMessage(message);
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
