# 四国军棋网页版

基于 Next.js 14 开发的实时四国军棋对战游戏。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: Clerk
- **实时通信**: Socket.io (WebSocket)
- **语言**: TypeScript

## 项目结构

```
national-chess/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/                   # Next.js 页面和API路由
│   ├── components/            # React 组件
│   ├── lib/
│   │   ├── game-engine/      # 游戏规则引擎
│   │   │   ├── rules.ts      # 移动规则、战斗逻辑
│   │   │   └── board.ts      # 棋盘初始化、棋子布局
│   │   ├── room-manager/     # 房间管理系统
│   │   │   └── index.ts      # 房间创建、加入、游戏状态管理
│   │   └── websocket/        # WebSocket 服务
│   │       └── server.ts     # Socket.io 服务器
│   └── types/
│       └── game.ts           # 游戏类型定义
├── server.ts                 # 自定义 Next.js 服务器
└── package.json
```

## 核心功能

### 已实现

1. **游戏规则引擎**
   - 完整的四国军棋规则实现
   - 棋子移动验证（工兵飞行、铁路移动）
   - 战斗逻辑（棋子大小相克、炸弹、地雷）
   - 阵地内一步走、铁路上多步走
   - 行营保护机制

2. **房间管理系统**
   - 创建/加入/离开房间
   - 玩家准备机制
   - 棋子布局验证
   - 游戏状态管理（内存）

3. **WebSocket 实时通信**
   - Socket.io 服务器配置
   - 玩家连接/断线处理
   - 实时游戏状态同步

4. **数据库设计**
   - 用户信息表
   - 游戏历史记录
   - 房间配置（可选）

### 待实现

1. **前端界面**
   - 大厅/房间列表页面
   - 游戏棋盘 UI
   - 棋子摆放界面
   - 对局界面

2. **Clerk 认证集成**
   - 用户注册/登录
   - 用户信息同步

3. **高级功能**
   - 游戏回放
   - AI 对手（后期）
   - 排行榜
   - 聊天系统

## 游戏规则

### 棋盘布局
- 11x11 棋盘（整体）
- 每个玩家阵地：6行x5列（30个交叉点）
- 4个玩家位置：上、右、下、左
- 联盟：上下联盟 vs 左右联盟

### 棋子配置（每位玩家25个）
- 军旗 x1、司令 x1、军长 x1
- 师长 x2、旅长 x2、团长 x2、营长 x2
- 连长 x3、排长 x3、工兵 x3
- 炸弹 x2、地雷 x3

### 移动规则
- **阵地内**：所有棋子一次只能走一步
- **铁路上**：
  - 普通棋子可直线移动多格（不能拐弯）
  - 工兵可飞行（可拐弯），到达任何铁路连接位置
- **行营**：内部棋子免受攻击，但可主动出击

### 战斗规则
- 司令 > 军长 > 师长 > ... > 工兵
- 工兵可拆炸弹、挖地雷
- 炸弹与任何棋子（除工兵）同归于尽
- 非工兵踩地雷死亡

### 胜利条件
1. 夺取敌方军旗
2. 消灭敌方所有可移动棋子

## 环境配置

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
创建 `.env` 文件：
```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/national_chess"

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 初始化数据库
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

## 下一步计划

1. 配置 Clerk 认证
2. 创建游戏棋盘 UI 组件
3. 实现大厅和房间列表页面
4. 连接前后端（WebSocket 客户端）
5. 测试完整游戏流程

## 开发注意事项

- 游戏状态存储在内存中，服务器重启会丢失
- WebSocket 使用自定义服务器（server.ts）
- 棋盘坐标从 (0,0) 开始
- 玩家位置：0=上, 1=右, 2=下, 3=左
