// 四国军棋游戏规则引擎

import {
  Piece,
  PieceType,
  Position,
  PlayerPosition,
  MoveResult,
  MoveType,
  PIECE_RANK,
  PIECE_NAMES,
  PositionType,
  GameState,
  TeamId,
} from '@/types/game';

// 棋盘尺寸常量 (整体棋盘)
export const BOARD_SIZE = 11; // 11x11 的棋盘 (横纵各11条线)

// 每个玩家阵地大小：横6纵5 (30个交叉点)
export const PLAYER_AREA_ROWS = 6;
export const PLAYER_AREA_COLS = 5;

// 获取联盟 (0=上下联盟, 1=左右联盟)
export function getTeam(position: PlayerPosition): TeamId {
  return position % 2 === 0 ? 0 : 1;
}

// 检查两个玩家是否是盟友
export function isAlly(pos1: PlayerPosition, pos2: PlayerPosition): boolean {
  return getTeam(pos1) === getTeam(pos2);
}

// 检查位置是否在棋盘范围内
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

// 判断位置是否是铁路
export function isRailway(pos: Position): boolean {
  // 横向铁路：第2、5、8行
  const horizontalRailways = [1, 4, 7]; // 索引从0开始，所以是1,4,7
  // 纵向铁路：第2、5、8列
  const verticalRailways = [1, 4, 7];

  return horizontalRailways.includes(pos.row) || verticalRailways.includes(pos.col);
}

// 判断位置是否在玩家阵地内
export function isInPlayerTerritory(pos: Position, owner: PlayerPosition): boolean {
  switch (owner) {
    case 0: // 上方玩家 (行: 0-5, 列: 3-7)
      return pos.row >= 0 && pos.row < 6 && pos.col >= 3 && pos.col < 8;
    case 1: // 右方玩家 (行: 3-7, 列: 5-10)
      return pos.row >= 3 && pos.row < 8 && pos.col >= 5 && pos.col <= 10;
    case 2: // 下方玩家 (行: 5-10, 列: 3-7)
      return pos.row >= 5 && pos.row <= 10 && pos.col >= 3 && pos.col < 8;
    case 3: // 左方玩家 (行: 3-7, 列: 0-4)
      return pos.row >= 3 && pos.row < 8 && pos.col >= 0 && pos.col < 5;
    default:
      return false;
  }
}

// 获取位置类型
export function getPositionType(pos: Position, owner: PlayerPosition): PositionType {
  // 大本营位置 (每个玩家2个)
  const headquarters: Record<PlayerPosition, Position[]> = {
    0: [{ row: 0, col: 4 }, { row: 0, col: 6 }], // 上
    1: [{ row: 4, col: 10 }, { row: 6, col: 10 }], // 右
    2: [{ row: 10, col: 4 }, { row: 10, col: 6 }], // 下
    3: [{ row: 4, col: 0 }, { row: 6, col: 0 }], // 左
  };

  // 行营位置 (每个玩家5个)
  const camps: Record<PlayerPosition, Position[]> = {
    0: [
      { row: 1, col: 3 }, { row: 1, col: 7 },
      { row: 2, col: 4 }, { row: 2, col: 5 }, { row: 2, col: 6 }
    ],
    1: [
      { row: 3, col: 9 }, { row: 7, col: 9 },
      { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 }
    ],
    2: [
      { row: 9, col: 3 }, { row: 9, col: 7 },
      { row: 8, col: 4 }, { row: 8, col: 5 }, { row: 8, col: 6 }
    ],
    3: [
      { row: 3, col: 1 }, { row: 7, col: 1 },
      { row: 4, col: 2 }, { row: 5, col: 2 }, { row: 6, col: 2 }
    ],
  };

  // 检查是否是大本营
  if (headquarters[owner]?.some(hq => hq.row === pos.row && hq.col === pos.col)) {
    return PositionType.HEADQUARTERS;
  }

  // 检查是否是行营
  for (const playerCamps of Object.values(camps)) {
    if (playerCamps.some(camp => camp.row === pos.row && camp.col === pos.col)) {
      return PositionType.CAMP;
    }
  }

  // 检查是否是铁路
  if (isRailway(pos)) {
    return PositionType.RAILWAY;
  }

  return PositionType.NORMAL;
}

// 检查是否可以移动（基本规则）
export function canMove(piece: Piece, gameState: GameState): boolean {
  // 军旗不能移动
  if (piece.type === PieceType.FLAG) return false;

  // 地雷不能移动
  if (piece.type === PieceType.LANDMINE) return false;

  // 炸弹不能移动
  if (piece.type === PieceType.BOMB) return false;

  // 必须是当前玩家的回合
  if (piece.owner !== gameState.currentTurn) return false;

  // 玩家必须还活着
  const player = gameState.players.find(p => p.position === piece.owner);
  if (!player || !player.isAlive) return false;

  return true;
}

// BFS 寻找工兵可以到达的所有位置（铁路飞行）
function getEngineerRailwayMoves(
  startPos: Position,
  piece: Piece,
  gameState: GameState
): Position[] {
  const visited = new Set<string>();
  const queue: Position[] = [startPos];
  const reachable: Position[] = [];

  visited.add(`${startPos.row},${startPos.col}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // 四个方向
    const directions = [
      { dr: -1, dc: 0 }, // 上
      { dr: 1, dc: 0 },  // 下
      { dr: 0, dc: -1 }, // 左
      { dr: 0, dc: 1 },  // 右
    ];

    for (const dir of directions) {
      const next = {
        row: current.row + dir.dr,
        col: current.col + dir.dc,
      };

      // 检查是否越界
      if (!isValidPosition(next)) continue;

      const key = `${next.row},${next.col}`;
      if (visited.has(key)) continue;

      // 检查是否是铁路
      if (!isRailway(next)) continue;

      const targetPiece = gameState.board[next.row][next.col];

      // 如果有己方棋子，不能通过
      if (targetPiece && isAlly(piece.owner, targetPiece.owner)) continue;

      // 标记为已访问
      visited.add(key);

      // 如果是敌方棋子，可以攻击但不能继续飞行
      if (targetPiece && !isAlly(piece.owner, targetPiece.owner)) {
        reachable.push(next);
        continue;
      }

      // 空位且是铁路，可以继续探索
      reachable.push(next);
      queue.push(next);
    }
  }

  return reachable;
}

// 获取铁路上直线移动的位置（普通棋子）
function getRailwayLineMoves(
  startPos: Position,
  piece: Piece,
  gameState: GameState
): Position[] {
  const moves: Position[] = [];

  // 四个方向
  const directions = [
    { dr: -1, dc: 0 }, // 上
    { dr: 1, dc: 0 },  // 下
    { dr: 0, dc: -1 }, // 左
    { dr: 0, dc: 1 },  // 右
  ];

  for (const dir of directions) {
    let step = 1;
    while (step < BOARD_SIZE) {
      const newPos = {
        row: startPos.row + dir.dr * step,
        col: startPos.col + dir.dc * step,
      };

      // 越界
      if (!isValidPosition(newPos)) break;

      // 不在铁路上
      if (!isRailway(newPos)) break;

      const targetPiece = gameState.board[newPos.row][newPos.col];

      // 遇到己方棋子停止
      if (targetPiece && isAlly(piece.owner, targetPiece.owner)) break;

      moves.push(newPos);

      // 遇到敌方棋子可以攻击但停止
      if (targetPiece) break;

      step++;
    }
  }

  return moves;
}

// 获取可能的移动位置
export function getPossibleMoves(
  piece: Piece,
  gameState: GameState
): Position[] {
  if (!canMove(piece, gameState)) return [];

  const { position } = piece;
  const moves: Position[] = [];
  const inTerritory = isInPlayerTerritory(position, piece.owner);

  // 在阵地内，只能走一步
  if (inTerritory) {
    const adjacentMoves = [
      { row: position.row - 1, col: position.col }, // 上
      { row: position.row + 1, col: position.col }, // 下
      { row: position.row, col: position.col - 1 }, // 左
      { row: position.row, col: position.col + 1 }, // 右
    ];

    for (const move of adjacentMoves) {
      if (!isValidPosition(move)) continue;

      const targetPiece = gameState.board[move.row][move.col];

      // 不能移动到己方棋子位置
      if (targetPiece && isAlly(piece.owner, targetPiece.owner)) continue;

      // 行营中的棋子不能被攻击
      if (targetPiece) {
        const targetPosType = getPositionType(move, targetPiece.owner);
        if (targetPosType === PositionType.CAMP) continue;
      }

      moves.push(move);
    }
  } else {
    // 在铁路上
    if (piece.type === PieceType.ENGINEER) {
      // 工兵可以飞行（拐弯）
      return getEngineerRailwayMoves(position, piece, gameState);
    } else {
      // 普通棋子可以直线移动多格（不能拐弯）
      return getRailwayLineMoves(position, piece, gameState);
    }
  }

  return moves;
}

// 战斗结果计算
export function calculateBattle(attacker: Piece, defender: Piece): MoveResult {
  // 特殊规则1: 炸弹与任何棋子（除工兵）同归于尽
  if (defender.type === PieceType.BOMB) {
    if (attacker.type === PieceType.ENGINEER) {
      return {
        success: true,
        type: MoveType.ATTACK,
        attacker,
        defender,
        attackerSurvived: true,
        defenderSurvived: false,
        message: '工兵成功拆除炸弹',
      };
    } else {
      return {
        success: true,
        type: MoveType.ATTACK,
        attacker,
        defender,
        attackerSurvived: false,
        defenderSurvived: false,
        message: '炸弹爆炸，同归于尽',
      };
    }
  }

  // 特殊规则2: 工兵挖地雷
  if (defender.type === PieceType.LANDMINE) {
    if (attacker.type === PieceType.ENGINEER) {
      return {
        success: true,
        type: MoveType.ATTACK,
        attacker,
        defender,
        attackerSurvived: true,
        defenderSurvived: false,
        message: '工兵成功挖掉地雷',
      };
    } else {
      return {
        success: false,
        type: MoveType.ATTACK,
        attacker,
        defender,
        attackerSurvived: false,
        defenderSurvived: true,
        message: '踩到地雷',
      };
    }
  }

  // 特殊规则3: 军旗被夺
  if (defender.type === PieceType.FLAG) {
    return {
      success: true,
      type: MoveType.ATTACK,
      attacker,
      defender,
      attackerSurvived: true,
      defenderSurvived: false,
      message: '夺取军旗！',
    };
  }

  // 普通战斗：比较等级
  const attackerRank = PIECE_RANK[attacker.type];
  const defenderRank = PIECE_RANK[defender.type];

  if (attackerRank > defenderRank) {
    return {
      success: true,
      type: MoveType.ATTACK,
      attacker,
      defender,
      attackerSurvived: true,
      defenderSurvived: false,
      message: `${PIECE_NAMES[attacker.type]} 击败 ${PIECE_NAMES[defender.type]}`,
    };
  } else if (attackerRank < defenderRank) {
    return {
      success: false,
      type: MoveType.ATTACK,
      attacker,
      defender,
      attackerSurvived: false,
      defenderSurvived: true,
      message: `${PIECE_NAMES[defender.type]} 击败 ${PIECE_NAMES[attacker.type]}`,
    };
  } else {
    return {
      success: true,
      type: MoveType.ATTACK,
      attacker,
      defender,
      attackerSurvived: false,
      defenderSurvived: false,
      message: '势均力敌，同归于尽',
    };
  }
}

// 验证移动是否合法
export function validateMove(
  piece: Piece,
  to: Position,
  gameState: GameState
): { valid: boolean; reason?: string } {
  if (!canMove(piece, gameState)) {
    return { valid: false, reason: '该棋子不能移动' };
  }

  const possibleMoves = getPossibleMoves(piece, gameState);
  const isValidMove = possibleMoves.some(
    pos => pos.row === to.row && pos.col === to.col
  );

  if (!isValidMove) {
    return { valid: false, reason: '不能移动到该位置' };
  }

  const targetPiece = gameState.board[to.row][to.col];

  if (targetPiece && isAlly(piece.owner, targetPiece.owner)) {
    return { valid: false, reason: '不能攻击盟友' };
  }

  // 行营中的棋子不能被攻击
  if (targetPiece) {
    const targetPosType = getPositionType(to, targetPiece.owner);
    if (targetPosType === PositionType.CAMP) {
      return { valid: false, reason: '不能攻击行营中的棋子' };
    }
  }

  return { valid: true };
}

// 检查玩家是否被淘汰
export function checkPlayerEliminated(player: PlayerPosition, gameState: GameState): boolean {
  const playerPieces = gameState.players.find(p => p.position === player)?.pieces || [];

  // 检查军旗是否还在
  const hasFlag = playerPieces.some(p => p.type === PieceType.FLAG && p.isAlive);
  if (!hasFlag) return true;

  // 检查是否还有可移动的棋子
  const hasMovablePiece = playerPieces.some(p =>
    p.isAlive &&
    p.type !== PieceType.FLAG &&
    p.type !== PieceType.LANDMINE
  );

  return !hasMovablePiece;
}

// 检查游戏是否结束
export function checkGameEnd(gameState: GameState): {
  ended: boolean;
  winner?: { team: TeamId; players: PlayerPosition[] };
} {
  const alivePlayers = gameState.players.filter(p => p.isAlive);

  if (alivePlayers.length <= 1) {
    // 只剩一个玩家或没有玩家
    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0];
      return {
        ended: true,
        winner: {
          team: winner.team,
          players: [winner.position],
        },
      };
    }
    return { ended: true };
  }

  // 检查是否只剩一个联盟
  const teams = new Set(alivePlayers.map(p => p.team));

  if (teams.size === 1) {
    const winningTeam = Array.from(teams)[0];
    const winners = alivePlayers.filter(p => p.team === winningTeam);

    return {
      ended: true,
      winner: {
        team: winningTeam,
        players: winners.map(p => p.position),
      },
    };
  }

  return { ended: false };
}

// 获取下一个回合的玩家
export function getNextPlayer(currentPlayer: PlayerPosition, gameState: GameState): PlayerPosition {
  // 顺序: 0(本家) -> 1(下家) -> 2(对家) -> 3(上家)
  let next = ((currentPlayer + 1) % 4) as PlayerPosition;

  // 跳过已被淘汰的玩家
  let attempts = 0;
  while (attempts < 4) {
    const player = gameState.players.find(p => p.position === next);
    if (player && player.isAlive) {
      return next;
    }
    next = ((next + 1) % 4) as PlayerPosition;
    attempts++;
  }

  return currentPlayer; // 如果所有玩家都被淘汰，返回当前玩家
}
