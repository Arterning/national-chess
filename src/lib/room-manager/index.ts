// 房间管理系统（内存中维护游戏状态）

import { GameState, PlayerPosition, Piece, GameStatus } from '@/types/game';
import { initializeGameState, placePiecesOnBoard, validatePieceLayout } from '../game-engine/board';
import {
  validateMove,
  calculateBattle,
  checkPlayerEliminated,
  checkGameEnd,
  getNextPlayer,
} from '../game-engine/rules';

export enum RoomType {
  FOUR_PLAYER = 'FOUR_PLAYER', // 四国军棋
  TWO_PLAYER = 'TWO_PLAYER',   // 二人军棋
}

export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
  position?: PlayerPosition;
  isReady: boolean;
  pieces?: Piece[]; // 玩家的棋子布局
  joinedAt: number; // 加入时间
  lastActiveAt: number; // 最后活跃时间
}

export interface Spectator {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: number;
}

export interface Room {
  id: string;
  name: string;
  host: string; // userId
  roomType: RoomType; // 房间类型
  players: RoomPlayer[];
  spectators: Spectator[]; // 观战者
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  gameState?: GameState;
  createdAt: number;
}

// 自动踢出超时时间（2小时）
const PLAYER_TIMEOUT_MS = 2 * 60 * 60 * 1000;

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private inactivityTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // 启动定期检查不活跃玩家的任务
    setInterval(() => this.checkInactivePlayers(), 60 * 60 * 1000); // 每小时检查一次
  }

  // 检查并踢出不活跃的玩家
  private checkInactivePlayers() {
    const now = Date.now();

    for (const [roomId, room] of this.rooms.entries()) {
      // 只检查等待中的房间，游戏已开始的不踢人
      if (room.gameState?.status === 'PLAYING') continue;

      const inactivePlayers = room.players.filter(player => {
        // 如果玩家已准备，不踢出
        if (player.isReady) return false;

        // 检查是否超时（2分钟）
        return now - player.lastActiveAt > PLAYER_TIMEOUT_MS;
      });

      // 踢出不活跃玩家
      for (const player of inactivePlayers) {
        console.log(`踢出不活跃玩家: ${player.username} (房间: ${roomId})`);
        this.leaveRoom(roomId, player.userId);
      }
    }
  }

  // 更新玩家活跃时间
  updatePlayerActivity(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.lastActiveAt = Date.now();
      return true;
    }

    return false;
  }

  // 创建房间
  createRoom(
    roomId: string,
    name: string,
    hostUserId: string,
    hostUsername: string,
    hostSocketId: string,
    options: {
      isPrivate?: boolean;
      password?: string;
      maxPlayers?: number;
      roomType?: RoomType;
    } = {}
  ): Room {
    const now = Date.now();
    const roomType = options.roomType || RoomType.FOUR_PLAYER;
    const maxPlayers = roomType === RoomType.TWO_PLAYER ? 2 : 4;

    const room: Room = {
      id: roomId,
      name,
      host: hostUserId,
      roomType,
      players: [
        {
          userId: hostUserId,
          username: hostUsername,
          socketId: hostSocketId,
          isReady: false,
          joinedAt: now,
          lastActiveAt: now,
        },
      ],
      spectators: [],
      maxPlayers,
      isPrivate: options.isPrivate || false,
      password: options.password,
      createdAt: now,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  // 加入房间（玩家或观战者）
  joinRoom(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
    password?: string,
    asSpectator?: boolean
  ): { success: boolean; room?: Room; error?: string; isSpectator?: boolean } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    if (room.isPrivate && room.password !== password) {
      return { success: false, error: '密码错误' };
    }

    const now = Date.now();

    // 检查是否已在房间中
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      // 更新 socket ID（重连场景）
      existingPlayer.socketId = socketId;
      existingPlayer.lastActiveAt = now;
      return { success: true, room, isSpectator: false };
    }

    // 游戏已开始或房间已满，以观战者身份加入
    if (asSpectator || room.gameState?.status === 'PLAYING' || room.players.length >= room.maxPlayers) {
      // 检查是否已经是观战者
      const existingSpectator = room.spectators.find(s => s.userId === userId);
      if (existingSpectator) {
        existingSpectator.socketId = socketId;
        return { success: true, room, isSpectator: true };
      }

      // 添加为观战者
      room.spectators.push({
        userId,
        username,
        socketId,
        joinedAt: now,
      });

      return { success: true, room, isSpectator: true };
    }

    // 添加为玩家
    room.players.push({
      userId,
      username,
      socketId,
      isReady: false,
      joinedAt: now,
      lastActiveAt: now,
    });

    return { success: true, room, isSpectator: false };
  }

  // 离开房间
  leaveRoom(roomId: string, userId: string): { success: boolean; shouldDeleteRoom: boolean } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, shouldDeleteRoom: false };
    }

    // 移除玩家
    room.players = room.players.filter(p => p.userId !== userId);

    // 移除观战者
    room.spectators = room.spectators.filter(s => s.userId !== userId);

    // 如果房间为空（没有玩家），删除房间
    if (room.players.length === 0) {
      // this.rooms.delete(roomId);
      return { success: true, shouldDeleteRoom: true };
    }

    // 如果房主离开，转移房主权限
    if (room.host === userId && room.players.length > 0) {
      room.host = room.players[0].userId;
    }

    return { success: true, shouldDeleteRoom: false };
  }

  // 玩家准备
  playerReady(
    roomId: string,
    userId: string,
    pieces: Piece[]
  ): { success: boolean; error?: string; allReady?: boolean } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    const player = room.players.find(p => p.userId === userId);
    if (!player) {
      return { success: false, error: '玩家不在房间中' };
    }

    // 分配位置（如果还没分配）
    if (player.position === undefined) {
      const takenPositions = new Set(
        room.players.filter(p => p.position !== undefined).map(p => p.position)
      );

      for (let pos = 0; pos < 4; pos++) {
        if (!takenPositions.has(pos as PlayerPosition)) {
          player.position = pos as PlayerPosition;
          break;
        }
      }
    }

    // 验证棋子布局
    if (player.position !== undefined) {
      const validation = validatePieceLayout(pieces, player.position);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }
    }

    player.isReady = true;
    player.pieces = pieces; // 存储玩家的棋子布局

    // 检查是否所有玩家都准备好（根据房间类型判断）
    const requiredPlayers = room.roomType === RoomType.TWO_PLAYER ? 2 : 4;
    const allReady = room.players.length === requiredPlayers && room.players.every(p => p.isReady);

    // 如果都准备好，初始化游戏
    if (allReady) {
      const isTwoPlayer = room.roomType === RoomType.TWO_PLAYER;
      room.gameState = initializeGameState(
        roomId,
        room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          position: p.position!,
        })),
        isTwoPlayer
      );

      // 放置所有玩家的棋子
      for (const roomPlayer of room.players) {
        if (roomPlayer.pieces) {
          placePiecesOnBoard(room.gameState.board, roomPlayer.pieces);
        }
      }

      room.gameState.status = GameStatus.PLAYING;
      room.gameState.startedAt = Date.now();
    }

    return { success: true, allReady };
  }

  // 执行移动
  makeMove(
    roomId: string,
    userId: string,
    pieceId: string,
    to: { row: number; col: number }
  ): {
    success: boolean;
    error?: string;
    gameState?: GameState;
    moveResult?: any;
  } {
    const room = this.rooms.get(roomId);

    if (!room || !room.gameState) {
      return { success: false, error: '游戏未开始' };
    }

    const { gameState } = room;
    const player = room.players.find(p => p.userId === userId);

    if (!player || player.position === undefined) {
      return { success: false, error: '玩家不存在' };
    }

    // 检查是否轮到该玩家
    if (gameState.currentTurn !== player.position) {
      return { success: false, error: '不是你的回合' };
    }

    // 找到棋子
    const gamePlayer = gameState.players.find(p => p.position === player.position);
    if (!gamePlayer) {
      return { success: false, error: '玩家状态错误' };
    }

    const piece = gamePlayer.pieces.find(p => p.id === pieceId);
    if (!piece || !piece.isAlive) {
      return { success: false, error: '棋子不存在或已被消灭' };
    }

    // 验证移动
    const validation = validateMove(piece, to, gameState);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    const from = { ...piece.position };
    const targetPiece = gameState.board[to.row][to.col];

    let moveResult;

    // 执行移动
    if (targetPiece) {
      // 战斗
      moveResult = calculateBattle(piece, targetPiece);

      if (!moveResult.attackerSurvived) {
        piece.isAlive = false;
        gameState.board[from.row][from.col] = null;
      } else {
        gameState.board[from.row][from.col] = null;
        piece.position = to;
        gameState.board[to.row][to.col] = piece;
      }

      if (!moveResult.defenderSurvived) {
        targetPiece.isAlive = false;
      }

      // 显示双方棋子
      piece.isRevealed = true;
      targetPiece.isRevealed = true;

      // 检查防守方玩家是否被淘汰
      if (checkPlayerEliminated(targetPiece.owner, gameState)) {
        const defenderPlayer = gameState.players.find(p => p.position === targetPiece.owner);
        if (defenderPlayer) {
          defenderPlayer.isAlive = false;
        }
      }
    } else {
      // 普通移动
      gameState.board[from.row][from.col] = null;
      piece.position = to;
      gameState.board[to.row][to.col] = piece;
    }

    // 记录移动
    gameState.moveHistory.push({
      playerId: userId,
      pieceId,
      from,
      to,
      timestamp: Date.now(),
      result: moveResult,
    });

    // 检查游戏是否结束
    const gameEnd = checkGameEnd(gameState);
    if (gameEnd.ended) {
      gameState.status = GameStatus.FINISHED;
      gameState.winner = gameEnd.winner;
      gameState.endedAt = Date.now();
    } else {
      // 切换到下一个玩家
      gameState.currentTurn = getNextPlayer(gameState.currentTurn, gameState);
    }

    return { success: true, gameState, moveResult };
  }

  // 获取房间
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // 获取所有公开房间
  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => !room.isPrivate);
  }

  // 通过 socketId 查找玩家所在的房间
  findRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }
}

// 单例
export const roomManager = new RoomManager();
