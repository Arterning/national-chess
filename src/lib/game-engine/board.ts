// 棋盘初始化和工具函数

import {
  Piece,
  PieceType,
  Position,
  PlayerPosition,
  GameState,
  GameStatus,
  Player,
} from '@/types/game';
import { BOARD_SIZE, getTeam } from './rules';
import { nanoid } from 'nanoid';

// 每个玩家的标准棋子配置
export const STANDARD_PIECES: { type: PieceType; count: number }[] = [
  { type: PieceType.FLAG, count: 1 },
  { type: PieceType.COMMANDER, count: 1 },
  { type: PieceType.GENERAL, count: 1 },
  { type: PieceType.MAJOR_GENERAL, count: 2 },
  { type: PieceType.BRIGADIER, count: 2 },
  { type: PieceType.COLONEL, count: 2 },
  { type: PieceType.BATTALION, count: 2 },
  { type: PieceType.BOMB, count: 2 },
  { type: PieceType.COMPANY, count: 3 },
  { type: PieceType.PLATOON, count: 3 },
  { type: PieceType.ENGINEER, count: 3 },
  { type: PieceType.LANDMINE, count: 3 },
];

// 获取玩家阵地的所有位置
export function getPlayerTerritoryPositions(player: PlayerPosition): Position[] {
  const positions: Position[] = [];

  switch (player) {
    case 0: // 上方 (行: 0-5, 列: 3-7)
      for (let row = 0; row < 6; row++) {
        for (let col = 3; col < 8; col++) {
          positions.push({ row, col });
        }
      }
      break;
    case 1: // 右方 (行: 3-7, 列: 5-10)
      for (let row = 3; row < 8; row++) {
        for (let col = 5; col <= 10; col++) {
          positions.push({ row, col });
        }
      }
      break;
    case 2: // 下方 (行: 5-10, 列: 3-7)
      for (let row = 5; row <= 10; row++) {
        for (let col = 3; col < 8; col++) {
          positions.push({ row, col });
        }
      }
      break;
    case 3: // 左方 (行: 3-7, 列: 0-4)
      for (let row = 3; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
          positions.push({ row, col });
        }
      }
      break;
  }

  return positions;
}

// 创建空棋盘
export function createEmptyBoard(): (Piece | null)[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

// 为玩家创建初始棋子（未放置）
export function createPlayerPieces(player: PlayerPosition): Piece[] {
  const pieces: Piece[] = [];

  for (const { type, count } of STANDARD_PIECES) {
    for (let i = 0; i < count; i++) {
      pieces.push({
        id: nanoid(),
        type,
        position: { row: -1, col: -1 }, // 未放置
        owner: player,
        isAlive: true,
        isRevealed: false,
      });
    }
  }

  return pieces;
}

// 随机初始布局（用于测试或快速开始）
export function generateRandomLayout(player: PlayerPosition): Piece[] {
  const pieces = createPlayerPieces(player);
  const positions = getPlayerTerritoryPositions(player);

  // 洗牌位置
  const shuffledPositions = [...positions].sort(() => Math.random() - 0.5);

  // 分配位置给棋子
  pieces.forEach((piece, index) => {
    if (index < shuffledPositions.length) {
      piece.position = shuffledPositions[index];
    }
  });

  return pieces;
}

// 验证棋子布局是否合法
export function validatePieceLayout(pieces: Piece[], player: PlayerPosition): {
  valid: boolean;
  reason?: string;
} {
  // 检查棋子数量
  if (pieces.length !== 25) {
    return { valid: false, reason: '棋子数量不正确' };
  }

  // 检查每种棋子的数量
  const typeCounts = new Map<PieceType, number>();
  for (const piece of pieces) {
    const count = typeCounts.get(piece.type) || 0;
    typeCounts.set(piece.type, count + 1);
  }

  for (const { type, count } of STANDARD_PIECES) {
    if (typeCounts.get(type) !== count) {
      return { valid: false, reason: `${type} 数量不正确` };
    }
  }

  // 检查所有棋子是否都已放置
  for (const piece of pieces) {
    if (piece.position.row < 0 || piece.position.col < 0) {
      return { valid: false, reason: '有棋子未放置' };
    }
  }

  // 检查位置是否在玩家阵地内
  const territoryPositions = getPlayerTerritoryPositions(player);
  for (const piece of pieces) {
    const inTerritory = territoryPositions.some(
      pos => pos.row === piece.position.row && pos.col === piece.position.col
    );
    if (!inTerritory) {
      return { valid: false, reason: '棋子位置不在阵地内' };
    }
  }

  // 检查是否有重复位置
  const positionSet = new Set<string>();
  for (const piece of pieces) {
    const key = `${piece.position.row},${piece.position.col}`;
    if (positionSet.has(key)) {
      return { valid: false, reason: '有重复的棋子位置' };
    }
    positionSet.add(key);
  }

  // 检查军旗是否在大本营
  const flags = pieces.filter(p => p.type === PieceType.FLAG);
  const headquarters = [
    getHeadquartersPositions(player)[0],
    getHeadquartersPositions(player)[1],
  ];


  return { valid: true };
}

// 获取大本营位置
function getHeadquartersPositions(player: PlayerPosition): Position[] {
  switch (player) {
    case 0: return [{ row: 0, col: 4 }, { row: 0, col: 6 }];
    case 1: return [{ row: 4, col: 10 }, { row: 6, col: 10 }];
    case 2: return [{ row: 10, col: 4 }, { row: 10, col: 6 }];
    case 3: return [{ row: 4, col: 0 }, { row: 6, col: 0 }];
  }
}

// 检查是否在后两行
function isInLastTwoRows(pos: Position, player: PlayerPosition): boolean {
  switch (player) {
    case 0: return pos.row <= 1;
    case 1: return pos.col >= 9;
    case 2: return pos.row >= 9;
    case 3: return pos.col <= 1;
  }
}

// 将棋子放置到棋盘上
export function placePiecesOnBoard(
  board: (Piece | null)[][],
  pieces: Piece[]
): void {
  for (const piece of pieces) {
    if (piece.isAlive && piece.position.row >= 0 && piece.position.col >= 0) {
      board[piece.position.row][piece.position.col] = piece;
    }
  }
}

// 初始化游戏状态
export function initializeGameState(
  roomId: string,
  players: {
    userId: string;
    username: string;
    position: PlayerPosition;
  }[]
): GameState {
  const board = createEmptyBoard();

  const gamePlayers: Player[] = players.map(p => ({
    userId: p.userId,
    username: p.username,
    position: p.position,
    team: getTeam(p.position),
    isReady: false,
    isAlive: true,
    pieces: createPlayerPieces(p.position),
  }));

  return {
    roomId,
    status: GameStatus.WAITING,
    players: gamePlayers,
    currentTurn: 0, // 第一个玩家开始
    board,
    moveHistory: [],
    createdAt: Date.now(),
  };
}
