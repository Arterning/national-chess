// WebSocket 服务器（Socket.io）

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { roomManager } from '../room-manager';
import { WsMessageType, Piece } from '@/types/game';

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 获取所有公开房间列表
    socket.on('GET_ROOM_LIST', () => {
      try {
        const rooms = roomManager.getPublicRooms();
        socket.emit('ROOM_LIST', { rooms });
      } catch (error) {
        console.error('Get room list error:', error);
        socket.emit(WsMessageType.ERROR, { message: '获取房间列表失败' });
      }
    });

    // 创建房间
    socket.on(WsMessageType.JOIN_ROOM, (data: {
      roomId?: string;
      roomName?: string;
      userId: string;
      username: string;
      password?: string;
      createNew?: boolean;
    }) => {
      try {
        const { roomId, roomName, userId, username, password, createNew } = data;

        if (createNew) {
          // 创建新房间
          const newRoomId = roomId || `room_${Date.now()}`;
          const room = roomManager.createRoom(
            newRoomId,
            roomName || '四国军棋房间',
            userId,
            username,
            socket.id
          );

          socket.join(newRoomId);

          // 通知房间内所有玩家（包括创建者）
          io.to(newRoomId).emit(WsMessageType.PLAYER_JOINED, {
            player: {
              userId,
              username,
              socketId: socket.id,
            },
            room,
          });

          // 广播房间列表更新
          const rooms = roomManager.getPublicRooms();
          io.emit('ROOM_LIST_UPDATE', { rooms });
        } else {
          // 加入现有房间
          if (!roomId) {
            socket.emit(WsMessageType.ERROR, { message: '房间ID不能为空' });
            return;
          }

          const result = roomManager.joinRoom(roomId, userId, username, socket.id, password);

          if (!result.success) {
            socket.emit(WsMessageType.ERROR, { message: result.error });
            return;
          }

          socket.join(roomId);

          // 通知房间内所有玩家（包括刚加入的玩家）
          io.to(roomId).emit(WsMessageType.PLAYER_JOINED, {
            player: {
              userId,
              username,
              socketId: socket.id,
            },
            room: result.room,
          });

          // 广播房间列表更新
          const rooms = roomManager.getPublicRooms();
          io.emit('ROOM_LIST_UPDATE', { rooms });
        }
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit(WsMessageType.ERROR, { message: '加入房间失败' });
      }
    });

    // 离开房间
    socket.on(WsMessageType.LEAVE_ROOM, (data: { roomId: string; userId: string }) => {
      try {
        const { roomId, userId } = data;
        const result = roomManager.leaveRoom(roomId, userId);

        if (result.success) {
          socket.leave(roomId);

          if (!result.shouldDeleteRoom) {
            const room = roomManager.getRoom(roomId);
            // 通知其他玩家
            socket.to(roomId).emit(WsMessageType.PLAYER_LEFT, {
              userId,
              room,
            });
          }

          // 广播房间列表更新
          const rooms = roomManager.getPublicRooms();
          io.emit('ROOM_LIST_UPDATE', { rooms });
        }
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // 玩家准备
    socket.on(WsMessageType.PLAYER_READY, (data: {
      roomId: string;
      userId: string;
      pieces: Piece[];
    }) => {
      try {
        const { roomId, userId, pieces } = data;
        const result = roomManager.playerReady(roomId, userId, pieces);

        if (!result.success) {
          socket.emit(WsMessageType.ERROR, { message: result.error });
          return;
        }

        const room = roomManager.getRoom(roomId);

        // 通知房间内所有玩家
        io.to(roomId).emit(WsMessageType.PLAYER_READY, {
          userId,
          room,
        });

        // 如果所有玩家都准备好，开始游戏
        if (result.allReady && room?.gameState) {
          io.to(roomId).emit(WsMessageType.GAME_START, {
            gameState: room.gameState,
          });
        }
      } catch (error) {
        console.error('Player ready error:', error);
        socket.emit(WsMessageType.ERROR, { message: '准备失败' });
      }
    });

    // 执行移动
    socket.on(WsMessageType.MAKE_MOVE, (data: {
      roomId: string;
      userId: string;
      pieceId: string;
      to: { row: number; col: number };
    }) => {
      try {
        const { roomId, userId, pieceId, to } = data;
        const result = roomManager.makeMove(roomId, userId, pieceId, to);

        if (!result.success) {
          socket.emit(WsMessageType.ERROR, { message: result.error });
          return;
        }

        // 通知所有玩家移动结果
        io.to(roomId).emit(WsMessageType.MOVE_RESULT, {
          userId,
          pieceId,
          to,
          moveResult: result.moveResult,
          gameState: result.gameState,
        });

        // 如果游戏结束
        if (result.gameState?.status === 'FINISHED') {
          io.to(roomId).emit(WsMessageType.GAME_END, {
            winner: result.gameState.winner,
            gameState: result.gameState,
          });
        }
      } catch (error) {
        console.error('Make move error:', error);
        socket.emit(WsMessageType.ERROR, { message: '移动失败' });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // 查找玩家所在的房间
      const room = roomManager.findRoomBySocketId(socket.id);
      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          // 可以选择立即移除玩家或给予重连时间
          // 这里简化处理：立即移除
          roomManager.leaveRoom(room.id, player.userId);

          socket.to(room.id).emit(WsMessageType.PLAYER_LEFT, {
            userId: player.userId,
            room: roomManager.getRoom(room.id),
          });
        }
      }
    });
  });

  return io;
}
