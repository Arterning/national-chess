'use client';

import { useState } from 'react';
import { PIECE_NAMES } from '@/types/game';

interface TwoPlayerGameProps {
  gameState: any;
  currentUserId: string;
  onMove: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
}

export default function TwoPlayerGame({ gameState, currentUserId, onMove }: TwoPlayerGameProps) {
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);

  // 二人军棋棋盘：5列 x 13行
  // 上方玩家区域：行 0-5（6行）
  // 中间铁路/公路：行 6
  // 下方玩家区域：行 7-12（6行）

  // 行营位置（需要根据实际规则定义）
  const camps = [
    // 上方玩家行营
    { row: 1, col: 1 }, { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 3, col: 1 }, { row: 3, col: 3 },
    // 下方玩家行营
    { row: 9, col: 1 }, { row: 9, col: 3 },
    { row: 10, col: 2 },
    { row: 11, col: 1 }, { row: 11, col: 3 },
  ];

  const isCamp = (row: number, col: number) => {
    return camps.some(c => c.row === row && c.col === col);
  };

  // 大本营位置
  const isHeadquarters = (row: number, col: number) => {
    return (row === 5 && (col === 1 || col === 3)) || // 上方大本营
           (row === 7 && (col === 1 || col === 3));  // 下方大本营
  };

  const handleCellClick = (row: number, col: number) => {
    const piece = gameState?.board?.[row]?.[col];

    if (selectedPiece) {
      // 已有选中的棋子，尝试移动
      onMove(selectedPiece, { row, col });
      setSelectedPiece(null);
    } else if (piece) {
      // 选中棋子
      setSelectedPiece({ row, col });
    }
  };

  const renderCell = (row: number, col: number) => {
    const piece = gameState?.board?.[row]?.[col];
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    const isCampCell = isCamp(row, col);
    const isHQ = isHeadquarters(row, col);

    return (
      <button
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        className={`
          aspect-square border transition-all relative text-xs sm:text-sm
          ${isCampCell ? 'rounded-full bg-orange-900/30 border-orange-500/50' : 'rounded-md'}
          ${isHQ ? 'bg-yellow-900/30 border-yellow-500' : ''}
          ${isSelected ? 'bg-green-600 border-green-400 animate-pulse' : ''}
          ${!isCampCell && !isHQ && !isSelected && piece ? 'bg-blue-600/50 border-blue-500' : ''}
          ${!isCampCell && !isHQ && !isSelected && !piece ? 'bg-white/5 border-white/20' : ''}
          hover:border-blue-400
        `}
      >
        {piece && (
          <span className="text-white font-bold">
            {PIECE_NAMES[piece.type]}
          </span>
        )}
        {isCampCell && !piece && (
          <span className="text-orange-400 text-[10px]">营</span>
        )}
        {isHQ && !piece && (
          <span className="text-yellow-400 text-[10px]">营</span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Game Info */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold">二人军棋</h3>
            <p className="text-blue-200 text-sm">
              当前回合: {gameState?.currentPlayer}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">状态: {gameState?.status}</p>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="bg-black/20 p-4 rounded-lg">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {Array.from({ length: 13 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => renderCell(row, col))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-blue-300 font-semibold mb-2">操作说明</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• 点击你的棋子选中</li>
          <li>• 再点击目标位置移动</li>
          <li>• 炸弹可以与任何棋子同归于尽</li>
        </ul>
      </div>
    </div>
  );
}
