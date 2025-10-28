'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WsMessageType } from '@/types/game';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    }
  }, [socket]);

  return { socket, isConnected, emit, on };
}
