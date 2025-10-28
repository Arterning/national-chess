'use client';

import { useState, useEffect } from 'react';
import { Piece, PieceType, PIECE_NAMES } from '@/types/game';
import { nanoid } from 'nanoid';

interface TwoPlayerPiecePlacementProps {
  onComplete: (pieces: Piece[]) => void;
}

// 二人军棋棋子配置 (每人25个棋子)
const PIECE_CONFIG: { type: PieceType; count: number; name: string }[] = [
  { type: PieceType.FLAG, count: 1, name: '军旗' },
  { type: PieceType.COMMANDER, count: 1, name: '司令' },
  { type: PieceType.GENERAL, count: 1, name: '军长' },
  { type: PieceType.MAJOR_GENERAL, count: 2, name: '师长' },
  { type: PieceType.BRIGADIER, count: 2, name: '旅长' },
  { type: PieceType.COLONEL, count: 2, name: '团长' },
  { type: PieceType.BATTALION, count: 2, name: '营长' },
  { type: PieceType.COMPANY, count: 3, name: '连长' },
  { type: PieceType.PLATOON, count: 3, name: '排长' },
  { type: PieceType.ENGINEER, count: 3, name: '工兵' },
  { type: PieceType.BOMB, count: 2, name: '炸弹' },
  { type: PieceType.LANDMINE, count: 3, name: '地雷' },
];

// 二人军棋大本营位置 (上方玩家)
const HEADQUARTERS = [
  { row: 0, col: 1 },
  { row: 0, col: 3 },
];

// 行营位置 (上方玩家, 5列布局)
const CAMPS = [
  { row: 1, col: 1 }, { row: 1, col: 3 },
  { row: 2, col: 2 },
  { row: 3, col: 1 }, { row: 3, col: 3 },
];

// 创建默认布局 (5列 x 6行)
function createDefaultLayout(): Piece[] {
  const pieces: Piece[] = [];

  // 生成所有棋子
  for (const config of PIECE_CONFIG) {
    for (let i = 0; i < config.count; i++) {
      pieces.push({
        id: nanoid(),
        type: config.type,
        position: { row: -1, col: -1 },
        owner: 0,
        isAlive: true,
        isRevealed: false,
      });
    }
  }

  // 获取所有可用位置 (5列 x 6行, 排除行营)
  const allPositions: { row: number; col: number }[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const isCamp = CAMPS.some(c => c.row === row && c.col === col);
      if (!isCamp) {
        allPositions.push({ row, col });
      }
    }
  }

  // 军旗放左边大本营 (0, 1)
  const flagPiece = pieces.find(p => p.type === PieceType.FLAG);
  if (flagPiece) {
    flagPiece.position = { row: 0, col: 1 };
  }

  // 排长放右边大本营 (0, 3)
  const platoonPiece = pieces.find(p => p.type === PieceType.PLATOON);
  if (platoonPiece) {
    platoonPiece.position = { row: 0, col: 3 };
  }

  // 地雷围绕军旗 (三角形)
  const mines = pieces.filter(p => p.type === PieceType.LANDMINE);
  const minePositions = [
    { row: 1, col: 0 }, // 左
    { row: 1, col: 2 }, // 右
    { row: 0, col: 0 }, // 左上
  ];
  mines.forEach((mine, index) => {
    if (index < minePositions.length) {
      mine.position = minePositions[index];
    }
  });

  // 已占用的位置
  const usedPositions = new Set<string>();
  pieces.forEach(p => {
    if (p.position.row >= 0 && p.position.col >= 0) {
      usedPositions.add(`${p.position.row},${p.position.col}`);
    }
  });

  // 剩余的棋子按从左到右、从上到下放置
  const remainingPieces = pieces.filter(p => p.position.row < 0);
  const availablePositions = allPositions.filter(
    pos => !usedPositions.has(`${pos.row},${pos.col}`)
  );

  remainingPieces.forEach((piece, index) => {
    if (index < availablePositions.length) {
      piece.position = availablePositions[index];
    }
  });

  return pieces;
}

export default function TwoPlayerPiecePlacement({ onComplete }: TwoPlayerPiecePlacementProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    setPieces(createDefaultLayout());
  }, []);

  const handlePieceClick = (pieceId: string) => {
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      return;
    }

    if (selectedPiece) {
      // 交换两个棋子的位置
      const piece1 = pieces.find(p => p.id === selectedPiece);
      const piece2 = pieces.find(p => p.id === pieceId);

      if (piece1 && piece2) {
        setPieces(prev =>
          prev.map(p => {
            if (p.id === piece1.id) {
              return { ...p, position: piece2.position };
            }
            if (p.id === piece2.id) {
              return { ...p, position: piece1.position };
            }
            return p;
          })
        );
      }
      setSelectedPiece(null);
    } else {
      setSelectedPiece(pieceId);
    }
  };

  const handleConfirm = () => {
    const allPlaced = pieces.every(p => p.position.row >= 0 && p.position.col >= 0);
    if (!allPlaced) {
      alert('请确保所有棋子都已放置');
      return;
    }
    onComplete(pieces);
  };

  const isHeadquarters = (row: number, col: number) => {
    return HEADQUARTERS.some(hq => hq.row === row && hq.col === col);
  };

  const isCamp = (row: number, col: number) => {
    return CAMPS.some(c => c.row === row && c.col === col);
  };

  const renderCell = (row: number, col: number) => {
    const piece = pieces.find(p => p.position.row === row && p.position.col === col);
    const isSelected = piece && selectedPiece === piece.id;
    const isHQ = isHeadquarters(row, col);
    const isCampCell = isCamp(row, col);

    return (
      <button
        key={`${row}-${col}`}
        onClick={() => piece && handlePieceClick(piece.id)}
        disabled={isCampCell}
        className={`
          aspect-square border transition-all relative text-sm font-bold
          ${isCampCell ? 'rounded-full bg-orange-900/30 border-orange-500/50 cursor-not-allowed' : 'rounded-md cursor-pointer'}
          ${isHQ && !isCampCell ? 'bg-yellow-900/30 border-yellow-500' : ''}
          ${isSelected ? 'bg-green-600 border-green-400 animate-bounce' : ''}
          ${!isCampCell && !isHQ && !isSelected && piece ? 'bg-blue-600/50 border-blue-500 hover:border-blue-400' : ''}
          ${!isCampCell && !isHQ && !isSelected && !piece ? 'bg-white/5 border-white/20' : ''}
        `}
      >
        {piece && (
          <span className="text-white">
            {PIECE_NAMES[piece.type]}
          </span>
        )}
        {isCampCell && !piece && (
          <span className="text-orange-400 text-xs">营</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 棋盘 - 5列 x 6行 */}
      <div className="bg-black/20 p-6 rounded-lg">
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => renderCell(row, col))
          )}
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-blue-300 font-semibold mb-2">布局说明</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• 点击一个棋子选中，再点击另一个棋子交换位置</li>
          <li>• 军旗必须放在大本营（黄色格子）</li>
          <li>• 地雷和炸弹只能放在后两排</li>
          <li>• 行营（橙色圆圈）不能放置棋子</li>
        </ul>
      </div>

      {/* 确认按钮 */}
      <button
        onClick={handleConfirm}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
      >
        确认布局
      </button>
    </div>
  );
}
