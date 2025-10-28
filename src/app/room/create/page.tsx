'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useUser();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('请输入房间名称');
      return;
    }

    if (isPrivate && !password.trim()) {
      alert('私密房间需要设置密码');
      return;
    }

    setIsCreating(true);

    try {
      // TODO: 创建房间并跳转
      const roomId = `room_${Date.now()}`;
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('创建房间失败:', error);
      alert('创建房间失败，请重试');
    } finally {
      setIsCreating(false);
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">创建房间</h1>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            {/* Room Name */}
            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                房间名称
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="输入房间名称"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={30}
              />
            </div>

            {/* Privacy Settings */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 rounded bg-white/10 border-white/20"
                />
                <span className="text-white font-semibold">私密房间</span>
              </label>
              <p className="text-blue-200 text-sm mt-2 ml-8">
                设置为私密房间后，其他玩家需要密码才能加入
              </p>
            </div>

            {/* Password (if private) */}
            {isPrivate && (
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  房间密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  maxLength={20}
                />
              </div>
            )}

            {/* Game Rules Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                游戏规则
              </h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• 需要 4 名玩家才能开始游戏</li>
                <li>• 每位玩家需要摆放自己的棋子</li>
                <li>• 所有玩家准备完成后游戏开始</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isCreating ? '创建中...' : '创建房间'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-center"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
