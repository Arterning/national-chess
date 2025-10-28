'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
  createdAt: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: 通过 WebSocket 获取房间列表
    // 模拟数据
    setTimeout(() => {
      setRooms([
        {
          id: 'room_1',
          name: '新手房间',
          host: '玩家A',
          playerCount: 2,
          maxPlayers: 4,
          status: 'waiting',
          isPrivate: false,
          createdAt: Date.now() - 60000,
        },
        {
          id: 'room_2',
          name: '高手对决',
          host: '玩家B',
          playerCount: 4,
          maxPlayers: 4,
          status: 'playing',
          isPrivate: false,
          createdAt: Date.now() - 120000,
        },
        {
          id: 'room_3',
          name: '休闲娱乐',
          host: '玩家C',
          playerCount: 1,
          maxPlayers: 4,
          status: 'waiting',
          isPrivate: false,
          createdAt: Date.now() - 30000,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleJoinRoom = (room: Room) => {
    if (room.playerCount >= room.maxPlayers && room.status === 'waiting') {
      alert('房间已满，无法加入');
      return;
    }

    // 如果游戏已开始且房间满员，进入观战模式
    const isSpectator = room.status === 'playing';

    router.push(`/room/${room.id}${isSpectator ? '?spectator=true' : ''}`);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (room: Room) => {
    if (room.status === 'playing') {
      return (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
          游戏中
        </span>
      );
    } else if (room.playerCount >= room.maxPlayers) {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
          已满
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
          等待中
        </span>
      );
    }
  };

  const getJoinButtonText = (room: Room) => {
    if (room.status === 'playing') {
      return '观战';
    } else if (room.playerCount >= room.maxPlayers) {
      return '已满';
    } else {
      return '加入';
    }
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
          <Link
            href="/dashboard"
            className="text-blue-300 hover:text-blue-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">游戏大厅</h1>
          <p className="text-blue-200">选择一个房间开始游戏</p>
        </div>

        {/* Search and Create */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索房间..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-5 h-5 text-blue-300 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link
            href="/room/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            创建房间
          </Link>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-blue-200 mt-4">加载中...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
            <svg className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-blue-200 text-lg">暂无可用房间</p>
            <p className="text-blue-300 text-sm mt-2">创建一个新房间开始游戏</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                    <p className="text-blue-200 text-sm">房主: {room.host}</p>
                  </div>
                  {getStatusBadge(room)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{room.playerCount} / {room.maxPlayers} 玩家</span>
                  </div>

                  {room.isPrivate && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>私密房间</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleJoinRoom(room)}
                  disabled={room.playerCount >= room.maxPlayers && room.status === 'waiting'}
                  className={`
                    w-full px-4 py-3 rounded-lg font-semibold transition-all
                    ${room.status === 'playing'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : room.playerCount >= room.maxPlayers
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }
                  `}
                >
                  {getJoinButtonText(room)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
