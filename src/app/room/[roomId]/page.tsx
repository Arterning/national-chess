'use client';

import { use, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PiecePlacement from '@/components/game/PiecePlacement';
import { Piece, PieceType } from '@/types/game';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const [isPlacingPieces, setIsPlacingPieces] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  // TODO: 从 WebSocket 获取房间状态

  const handlePiecesPlaced = (pieces: Piece[]) => {
    console.log('棋子布局:', pieces);
    setIsReady(true);
    // TODO: 通过 WebSocket 发送准备状态
  };

  const handleReady = () => {
    // TODO: 通知服务器玩家已准备
    alert('等待其他玩家准备...');
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
                <h3 className="text-2xl font-bold text-white mb-2">布局完成</h3>
                <p className="text-blue-200 mb-6">等待其他玩家准备...</p>
                <button
                  onClick={() => setIsPlacingPieces(true)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  重新调整布局
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Players */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">玩家 (1/4)</h3>

              {/* Player Slots */}
              <div className="space-y-3">
                {[0, 1, 2, 3].map((position) => (
                  <div
                    key={position}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {position === 0 ? '上' : position === 1 ? '右' : position === 2 ? '下' : '左'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {position === 0 ? user?.firstName || user?.username : '等待中...'}
                          </div>
                          {position === 0 && (
                            <div className="text-xs text-green-400">已准备</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready Button */}
            {isReady && (
              <button
                onClick={handleReady}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all transform hover:scale-105"
              >
                开始游戏
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
