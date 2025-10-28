# 项目配置指南

## 1. 配置 Clerk 认证

### 步骤 1: 注册 Clerk 账号

1. 访问 [clerk.com](https://clerk.com)
2. 注册并创建新应用
3. 选择应用类型：Web Application

### 步骤 2: 获取 API 密钥

在 Clerk Dashboard 中：
1. 进入 **API Keys** 页面
2. 复制以下密钥：
   - `Publishable Key` (以 `pk_test_` 或 `pk_live_` 开头)
   - `Secret Key` (以 `sk_test_` 或 `sk_live_` 开头)

### 步骤 3: 配置环境变量

创建 `.env.local` 文件（或重命名 `.env.example`）：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/national_chess"

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_你的密钥
CLERK_SECRET_KEY=sk_test_你的密钥

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 步骤 4: 配置 Clerk 重定向

在 Clerk Dashboard 中设置：
- **Sign-in redirect**: `/dashboard`
- **Sign-up redirect**: `/dashboard`
- **After sign out redirect**: `/`

## 2. 配置数据库

### 安装 PostgreSQL

**Windows:**
1. 下载 PostgreSQL: https://www.postgresql.org/download/windows/
2. 安装并记住设置的密码
3. 默认用户名: `postgres`
4. 默认端口: `5432`

**macOS (使用 Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE national_chess;

# 退出
\q
```

### 更新环境变量

在 `.env.local` 中设置正确的数据库连接：
```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/national_chess"
```

### 运行迁移

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

## 3. 启动项目

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问: http://localhost:3000

## 4. 项目结构

```
已完成的页面：
├── / (landing page)              - 首页，包含登录/注册按钮
├── /dashboard                     - 用户仪表板，显示统计和创建/加入房间
├── /room/create                   - 创建房间页面
├── /room/[roomId]                 - 游戏房间，包含棋子摆放功能
└── /lobby                         - 待开发：房间列表
```

## 5. 功能清单

### 已完成 ✅
- Landing Page (首页)
- Clerk 认证集成（登录/注册）
- Dashboard（仪表板）
- 创建房间页面
- 棋子摆放界面
- 游戏规则引擎（后端）
- WebSocket 服务器
- 房间管理系统

### 待完成 🚧
- [ ] 房间列表页面 (/lobby)
- [ ] WebSocket 客户端集成
- [ ] 完整的游戏棋盘 UI
- [ ] 实时对战功能
- [ ] 用户数据持久化
- [ ] 游戏历史记录

## 6. 开发注意事项

### Clerk 相关
- 使用 `<SignInButton>` 和 `<SignUpButton>` 组件显示登录/注册模态框
- 使用 `useUser()` 获取当前用户信息
- 使用 `<UserButton />` 显示用户菜单
- 中间件已配置，未登录用户无法访问 `/dashboard` 等受保护页面

### 数据库
- 使用 Prisma ORM 操作数据库
- 修改 `prisma/schema.prisma` 后需要运行 `pnpm prisma migrate dev`
- 使用 `pnpm prisma studio` 可视化查看数据库

### WebSocket
- 服务器使用自定义 Next.js 服务器（`server.ts`）
- Socket.io 路径: `/api/socket`
- 需要创建客户端 Hook 来连接 WebSocket

## 7. 下一步开发

### 优先级 1: WebSocket 客户端
创建 `src/hooks/useSocket.ts`:
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  return socket;
}
```

### 优先级 2: 房间列表
创建 `/lobby` 页面显示所有可用房间

### 优先级 3: 实时对战
在房间页面集成 WebSocket，实现实时游戏状态同步

## 8. 常见问题

### Q: Clerk 中文显示
A: 已在 `layout.tsx` 中配置 `localization={zhCN}`（已注释，如需要可取消注释）

### Q: 数据库连接失败
A: 检查 PostgreSQL 是否运行，DATABASE_URL 是否正确

### Q: 开发服务器启动失败
A: 确保所有依赖已安装 (`pnpm install`)，环境变量已配置

### Q: TypeScript 错误
A: 运行 `pnpm run build` 检查所有错误

## 9. 有用的命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 数据库
pnpm prisma studio    # 打开数据库可视化工具
pnpm prisma migrate dev  # 创建新迁移
pnpm prisma generate  # 生成 Prisma Client

# 代码检查
pnpm lint             # 运行 ESLint
```

## 10. 技术栈文档

- [Next.js 14](https://nextjs.org/docs)
- [Clerk](https://clerk.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [Socket.io](https://socket.io/docs/v4/)
- [Tailwind CSS](https://tailwindcss.com/docs)
