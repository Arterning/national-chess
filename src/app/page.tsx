import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

export default async function Home() {
  // 如果已登录，重定向到 dashboard
  const user = await currentUser();
  if (user) {
    redirect('/dashboard');
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">四</span>
            </div>
            <span className="text-white text-2xl font-bold">四国军棋</span>
          </div>
          <SignedOut>
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <button className="px-6 py-2 text-white hover:text-blue-300 transition-colors">
                  登录
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  注册
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
        </nav>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl font-bold text-white mb-6">
            四国军棋对战平台
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            在线实时对战，体验经典策略棋牌游戏的魅力
          </p>
          <SignedOut>
            <div className="flex gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105">
                  开始游戏
                </button>
              </SignUpButton>
              <Link
                href="#features"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-lg backdrop-blur-sm transition-all"
              >
                了解更多
              </Link>
            </div>
          </SignedOut>
        </div>

        {/* Features Section */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center hover:bg-white/15 transition-all">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">实时对战</h3>
            <p className="text-blue-200">
              基于 WebSocket 的实时通信，流畅的游戏体验
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center hover:bg-white/15 transition-all">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">多人对战</h3>
            <p className="text-blue-200">
              支持 4 人同时在线对战，联盟作战更有趣
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center hover:bg-white/15 transition-all">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">标准规则</h3>
            <p className="text-blue-200">
              完整实现四国军棋标准规则，公平竞技
            </p>
          </div>
        </div>

        {/* Game Info Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">游戏规则</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="text-xl font-semibold text-blue-300 mb-3">基本玩法</h3>
              <ul className="space-y-2 text-blue-100">
                <li>• 4 人同时对战，上下联盟 vs 左右联盟</li>
                <li>• 每个玩家控制 25 个棋子</li>
                <li>• 夺取敌方军旗或消灭所有可移动棋子获胜</li>
                <li>• 工兵可在铁路上飞行拐弯</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-300 mb-3">特殊规则</h3>
              <ul className="space-y-2 text-blue-100">
                <li>• 炸弹与任何棋子（除工兵）同归于尽</li>
                <li>• 工兵可拆炸弹、挖地雷</li>
                <li>• 行营内的棋子免受攻击</li>
                <li>• 司令 &gt; 军长 &gt; 师长 &gt; ... &gt; 工兵</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-blue-300">
          <p>© 2024 四国军棋对战平台. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
