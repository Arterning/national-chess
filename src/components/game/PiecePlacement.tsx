'use client';

import { useState, useEffect } from 'react';
import { Piece, PieceType, PlayerPosition, PIECE_NAMES } from '@/types/game';
import { createPlayerPieces } from '@/lib/game-engine/board';

interface PiecePlacementProps {
  onComplete: (pieces: Piece[]) => void;
}

export default function PiecePlacement({ onComplete }: PiecePlacementProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    // 创建初始棋子（未放置）
    const initialPieces = createPlayerPieces(0 as PlayerPosition);
    setPieces(initialPieces);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (!selectedPiece) return;

    // 检查是否在上方玩家阵地内 (行: 0-5, 列: 3-7)
    if (row < 0 || row > 5 || col < 3 || col > 7) {
      alert('请在你的阵地内放置棋子');
      return;
    }

    // 检查该位置是否已有棋子
    const existingPiece = pieces.find(
      p => p.position.row === row && p.position.col === col
    );

    if (existingPiece) {
      alert('该位置已有棋子');
      return;
    }

    // 放置棋子
    setPieces(prev =>
      prev.map(p =>
        p.id === selectedPiece
          ? { ...p, position: { row, col } }
          : p
      )
    );

    setSelectedPiece(null);
  };

  const handlePieceClick = (pieceId: string) => {
    setSelectedPiece(pieceId);
  };

  const handleRandomPlacement = () => {
    // TODO: 实现随机布局
    alert('随机布局功能开发中...');
  };

  const handleConfirm = () => {
    // 检查所有棋子是否都已放置
    const unplacedPieces = pieces.filter(p => p.position.row < 0 || p.position.col < 0);

    if (unplacedPieces.length > 0) {
      alert(`还有 ${unplacedPieces.length} 个棋子未放置`);
      return;
    }

    // TODO: 验证布局是否合法（军旗在大本营、地雷在后两行等）

    onComplete(pieces);
  };

  const placedCount = pieces.filter(p => p.position.row >= 0).length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-200">放置进度</span>
          <span className="text-white font-bold">{placedCount} / 25</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${(placedCount / 25) * 100}%` }}
          />
        </div>
      </div>

      {/* Simplified Board (Top Player View) */}
      <div className="bg-black/20 p-4 rounded-lg">
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => {
              const actualRow = row;
              const actualCol = col + 3;
              const piece = pieces.find(
                p => p.position.row === actualRow && p.position.col === actualCol
              );

              return (
                <button
                  key={`${actualRow}-${actualCol}`}
                  onClick={() => handleCellClick(actualRow, actualCol)}
                  className={`
                    aspect-square rounded-lg border-2 transition-all
                    ${selectedPiece ? 'cursor-pointer hover:border-blue-500' : ''}
                    ${piece ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/20'}
                  `}
                >
                  {piece && (
                    <span className="text-white font-bold text-lg">
                      {PIECE_NAMES[piece.type]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Piece List */}
      <div>
        <h3 className="text-white font-semibold mb-3">可用棋子</h3>
        <div className="grid grid-cols-5 gap-2">
          {pieces
            .filter(p => p.position.row < 0)
            .map(piece => (
              <button
                key={piece.id}
                onClick={() => handlePieceClick(piece.id)}
                className={`
                  px-3 py-2 rounded-lg border-2 transition-all
                  ${selectedPiece === piece.id
                    ? 'bg-blue-600 border-blue-500 scale-110'
                    : 'bg-white/10 border-white/20 hover:border-blue-500'
                  }
                `}
              >
                <span className="text-white font-bold">
                  {PIECE_NAMES[piece.type]}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleRandomPlacement}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          随机布局
        </button>
        <button
          onClick={handleConfirm}
          disabled={placedCount < 25}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
        >
          确认布局
        </button>
      </div>
    </div>
  );
}
