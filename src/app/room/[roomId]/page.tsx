'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PiecePlacement from '@/components/game/PiecePlacement';
import { Piece, PieceType, WsMessageType } from '@/types/game';
import { useSocket } from '@/hooks/useSocket';

interface PageProps {
  params: { roomId: string };
}

interface RoomPlayer {
  userId: string;
  username: string;
  position?: number;
  isReady: boolean;
}

interface RoomData {
  id: string;
  name: string;
  players: RoomPlayer[];
  spectators: any[];
  gameState?: any;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = params;
  const router = useRouter();
  const { user } = useUser();
  const { socket, isConnected } = useSocket();
  const [isPlacingPieces, setIsPlacingPieces] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [placedPieces, setPlacedPieces] = useState<Piece[]>([]);

  // 监听房间事件
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log('设置房间事件监听器');

    // 监听玩家加入（包括自己加入时接收初始房间数据）
    const handlePlayerJoined = (data: { room: RoomData }) => {
      console.log('玩家加入事件:', data.room);
      setRoom(data.room);
    };

    // 监听玩家离开
    const handlePlayerLeft = (data: { userId: string; room: RoomData }) => {
      console.log('玩家离开:', data.userId);
      setRoom(data.room);
    };

    // 监听玩家准备
    const handlePlayerReady = (data: { userId: string; room: RoomData }) => {
      console.log('玩家准备:', data.userId);
      setRoom(data.room);

      // 如果是当前用户准备，更新本地状态
      if (data.userId === user.id) {
        setIsReady(true);
      }
    };

    // 监听游戏开始
    const handleGameStart = (data: { gameState: any }) => {
      console.log('游戏开始:', data.gameState);
      setIsPlacingPieces(false);
    };

    // 监听错误
    const handleError = (data: { message: string }) => {
      console.error('收到错误:', data.message);
      alert(data.message);
      router.push('/lobby');
    };

    // 注册监听器
    socket.on(WsMessageType.PLAYER_JOINED, handlePlayerJoined);
    socket.on(WsMessageType.PLAYER_LEFT, handlePlayerLeft);
    socket.on(WsMessageType.PLAYER_READY, handlePlayerReady);
    socket.on(WsMessageType.GAME_START, handleGameStart);
    socket.on(WsMessageType.ERROR, handleError);

    return () => {
      socket.off(WsMessageType.PLAYER_JOINED, handlePlayerJoined);
      socket.off(WsMessageType.PLAYER_LEFT, handlePlayerLeft);
      socket.off(WsMessageType.PLAYER_READY, handlePlayerReady);
      socket.off(WsMessageType.GAME_START, handleGameStart);
      socket.off(WsMessageType.ERROR, handleError);

      // 离开房间
      socket.emit(WsMessageType.LEAVE_ROOM, {
        roomId,
        userId: user.id,
      });
    };
  }, [socket, isConnected, user, roomId, router]);

  // 加入房间（仅在组件挂载时执行一次）
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log('尝试加入房间:', roomId);

    // 加入房间
    socket.emit(WsMessageType.JOIN_ROOM, {
      roomId,
      userId: user.id,
      username: user.firstName || user.username || '玩家',
    });
  }, [socket, isConnected, user, roomId]);

  const handlePiecesPlaced = (pieces: Piece[]) => {
    console.log('棋子布局:', pieces);

    if (!socket || !user) {
      alert('请先登录');
      return;
    }

    if (pieces.length !== 25) {
      alert('请先完成棋子布局');
      return;
    }

    setPlacedPieces(pieces);
    setIsPlacingPieces(false);
    setIsReady(true);

    // 通知服务器玩家已准备
    socket.emit(WsMessageType.PLAYER_READY, {
      roomId,
      userId: user.id,
      pieces: pieces,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">四</span>
            </div>
            <span className="text-white text-2xl font-bold">四国军棋</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-blue-200">房间: {roomId}</span>
            <Link
              href="/dashboard"
              className="text-blue-300 hover:text-blue-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              离开
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Game Area */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            {isPlacingPieces ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">摆放棋子</h2>
                <PiecePlacement onComplete={handlePiecesPlaced} />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">已准备</h3>
                <p className="text-blue-200">等待其他玩家准备...</p>
                <p className="text-blue-300 text-sm mt-2">所有玩家准备后将自动开始游戏</p>
              </div>
            )}
          </div>

          {/* Sidebar - Players */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">
                玩家 ({room?.players.length || 0}/4)
              </h3>

              <div className="space-y-3">
                {room?.players.map((player) => {

                  return (
                    <div
                      key={player.userId}
                      className={`rounded-lg p-3 border transition-all ${
                        player
                          ? 'bg-white/5 border-white/10'
                          : 'bg-black/20 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            player
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                              : 'bg-white/10'
                          }`}>
                            <span className={`font-bold ${player ? 'text-white' : 'text-gray-500'}`}>
                              {player.username}
                            </span>
                          </div>
                          <div>
                            <div className={`font-semibold ${player ? 'text-white' : 'text-gray-500'}`}>
                              {player ? player.username : '等待中...'}
                            </div>
                            {player && (
                              <div className={`text-xs ${player.isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                {player.isReady ? '已准备' : '未准备'}
                              </div>
                            )}
                          </div>
                        </div>
                        {player?.userId === user?.id && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            你
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ready Status */}
            {isReady && (
              <div className="w-full px-6 py-4 bg-green-500/20 border-2 border-green-500 text-green-400 font-bold rounded-xl text-center">
                已准备 ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
