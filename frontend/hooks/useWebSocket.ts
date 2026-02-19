'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '@/lib/websocket/client';
import {
  MessageType,
  ConnectionState,
  UseWebSocketOptions,
  UseWebSocketReturn
} from '@/lib/websocket/types';

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    adminId,
    token,
    onConnect,
    onDisconnect,
    onMessage,
    onError,
  } = options;
  const clientRef = useRef<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const client = new WebSocketClient({
      url,
      adminId,
      token,
      onStateChange: (state) => {
        setConnectionState(state);
        if (client) {
          setReconnectAttempts(client.getReconnectAttempt());
        }
      },
      onConnect: () => {
        setReconnectAttempts(0);
        onConnect?.();
      },
      onDisconnect,
      onMessage,
      onError
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [adminId, onConnect, onDisconnect, onError, onMessage, token, url]);

  const send = useCallback((type: MessageType | string, payload: unknown) => {
    clientRef.current?.send(type, payload);
  }, []);

  const reconnect = useCallback(() => {
    clientRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  return {
    send,
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    reconnectAttempts,
    reconnect,
    disconnect
  };
}
