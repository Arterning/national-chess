// 四国军棋核心类型定义

// 棋子类型
export enum PieceType {
  FLAG = 'FLAG',           // 军旗
  BOMB = 'BOMB',           // 炸弹
  LANDMINE = 'LANDMINE',   // 地雷
  COMMANDER = 'COMMANDER', // 司令
  GENERAL = 'GENERAL',     // 军长
  MAJOR_GENERAL = 'MAJOR_GENERAL',     // 师长
  BRIGADIER = 'BRIGADIER', // 旅长
  COLONEL = 'COLONEL',     // 团长
  BATTALION = 'BATTALION', // 营长
  COMPANY = 'COMPANY',     // 连长
  PLATOON = 'PLATOON',     // 排长
  ENGINEER = 'ENGINEER',   // 工兵
}

// 棋子等级（用于比较大小）
export const PIECE_RANK: Record<PieceType, number> = {
  [PieceType.FLAG]: 0,
  [PieceType.LANDMINE]: 0,
  [PieceType.BOMB]: 0,
  [PieceType.ENGINEER]: 1,
  [PieceType.PLATOON]: 2,
  [PieceType.COMPANY]: 3,
  [PieceType.BATTALION]: 4,
  [PieceType.COLONEL]: 5,
  [PieceType.BRIGADIER]: 6,
  [PieceType.MAJOR_GENERAL]: 7,
  [PieceType.GENERAL]: 8,
  [PieceType.COMMANDER]: 9,
};

// 棋子显示名称
export const PIECE_NAMES: Record<PieceType, string> = {
  [PieceType.FLAG]: '旗',
  [PieceType.BOMB]: '炸',
  [PieceType.LANDMINE]: '雷',
  [PieceType.COMMANDER]: '司',
  [PieceType.GENERAL]: '军',
  [PieceType.MAJOR_GENERAL]: '师',
  [PieceType.BRIGADIER]: '旅',
  [PieceType.COLONEL]: '团',
  [PieceType.BATTALION]: '营',
  [PieceType.COMPANY]: '连',
  [PieceType.PLATOON]: '排',
  [PieceType.ENGINEER]: '工',
};

// 玩家位置（0=上, 1=右, 2=下, 3=左）
export type PlayerPosition = 0 | 1 | 2 | 3;

// 联盟（0=上下联盟, 1=左右联盟）
export type TeamId = 0 | 1;

// 棋盘位置类型
export enum PositionType {
  NORMAL = 'NORMAL',           // 普通位置
  CAMP = 'CAMP',               // 行营（不能被攻击）
  HEADQUARTERS = 'HEADQUARTERS', // 大本营（军旗位置）
  RAILWAY = 'RAILWAY',         // 铁路（工兵可以飞行）
}

// 坐标
export interface Position {
  row: number;
  col: number;
}

// 棋子
export interface Piece {
  id: string;
  type: PieceType;
  position: Position;
  owner: PlayerPosition;    // 属于哪个玩家
  isAlive: boolean;
  isRevealed: boolean;      // 是否已翻开（对其他玩家可见）
}

// 玩家信息
export interface Player {
  userId: string;
  username: string;
  position: PlayerPosition;
  team: TeamId;
  isReady: boolean;
  isAlive: boolean;         // 军旗是否被夺
  pieces: Piece[];
}

// 移动类型
export enum MoveType {
  NORMAL = 'NORMAL',         // 普通移动
  ATTACK = 'ATTACK',         // 攻击
  RAILWAY = 'RAILWAY',       // 铁路移动（工兵）
}

// 移动结果
export interface MoveResult {
  success: boolean;
  type: MoveType;
  attacker?: Piece;
  defender?: Piece;
  attackerSurvived?: boolean;
  defenderSurvived?: boolean;
  message?: string;
}

// 游戏移动
export interface GameMove {
  playerId: string;
  pieceId: string;
  from: Position;
  to: Position;
  timestamp: number;
  result?: MoveResult;
}

// 游戏状态
export enum GameStatus {
  WAITING = 'WAITING',       // 等待玩家
  READY = 'READY',           // 准备开始
  PLAYING = 'PLAYING',       // 游戏中
  FINISHED = 'FINISHED',     // 已结束
}

// 游戏房间状态
export interface GameState {
  roomId: string;
  status: GameStatus;
  players: Player[];
  currentTurn: PlayerPosition;
  board: (Piece | null)[][];  // 12x5 的棋盘
  moveHistory: GameMove[];
  winner?: {
    team: TeamId;
    players: PlayerPosition[];
  };
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

// WebSocket 消息类型
export enum WsMessageType {
  // 房间相关
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_READY = 'PLAYER_READY',

  // 游戏相关
  GAME_START = 'GAME_START',
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  MAKE_MOVE = 'MAKE_MOVE',
  MOVE_RESULT = 'MOVE_RESULT',
  GAME_END = 'GAME_END',

  // 错误
  ERROR = 'ERROR',
}

export interface WsMessage {
  type: WsMessageType;
  payload: any;
  timestamp: number;
}
