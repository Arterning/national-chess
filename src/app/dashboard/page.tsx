import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/');
  }

  // TODO: 从数据库获取用户游戏数据
  const userStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    rating: 1000,
    winRate: 0,
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
            <span className="text-white">{user.firstName || user.username}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            欢迎回来, {user.firstName || user.username}!
          </h1>
          <p className="text-blue-200">准备开始新的对局吧</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-blue-300 text-sm mb-2">等级分</div>
            <div className="text-4xl font-bold text-white mb-1">{userStats.rating}</div>
            <div className="text-xs text-blue-200">积分排名</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-blue-300 text-sm mb-2">胜率</div>
            <div className="text-4xl font-bold text-white mb-1">
              {userStats.gamesPlayed > 0
                ? `${((userStats.gamesWon / userStats.gamesPlayed) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <div className="text-xs text-blue-200">
              {userStats.gamesWon} 胜 / {userStats.gamesPlayed} 场
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-blue-300 text-sm mb-2">总场次</div>
            <div className="text-4xl font-bold text-white mb-1">{userStats.gamesPlayed}</div>
            <div className="text-xs text-blue-200">已完成对局</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="text-blue-300 text-sm mb-2">胜场</div>
            <div className="text-4xl font-bold text-white mb-1">{userStats.gamesWon}</div>
            <div className="text-xs text-blue-200">获胜次数</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room */}
          <Link
            href="/room/create"
            className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl p-8 transition-all transform hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-white transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">创建房间</h2>
            <p className="text-blue-100">创建新房间，邀请好友一起对战</p>
          </Link>

          {/* Join Room */}
          <Link
            href="/lobby"
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-8 border border-white/10 transition-all transform hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-white transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">加入房间</h2>
            <p className="text-blue-200">浏览可用房间，加入现有对局</p>
          </Link>
        </div>

        {/* Recent Games (Placeholder) */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">最近对局</h2>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-blue-200 text-lg">暂无对局记录</p>
            <p className="text-blue-300 text-sm mt-2">开始你的第一场对局吧！</p>
          </div>
        </div>
      </div>
    </div>
  );
}
