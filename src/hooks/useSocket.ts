'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WsMessageType } from '@/types/game';

// 全局 Socket 实例，在整个应用中共享
let globalSocket: Socket | null = null;
let connectionCount = 0;

function getSocket(): Socket {
  if (!globalSocket) {
    console.log('创建全局 WebSocket 连接');
    globalSocket = io({
      path: '/api/socket',
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();
    connectionCount++;
    console.log(`useSocket 挂载，当前使用计数: ${connectionCount}`);

    const handleConnect = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // 设置初始连接状态
    setIsConnected(socketInstance.connected);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    setSocket(socketInstance);

    return () => {
      connectionCount--;
      console.log(`useSocket 卸载，当前使用计数: ${connectionCount}`);

      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);

      // 只有当没有组件使用时才关闭连接
      if (connectionCount === 0 && globalSocket) {
        console.log('关闭全局 WebSocket 连接');
        globalSocket.close();
        globalSocket = null;
      }
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
