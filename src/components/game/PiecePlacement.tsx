'use client';

import { useState, useEffect, useCallback } from 'react';
import { Piece, PieceType, PlayerPosition, PIECE_NAMES } from '@/types/game';
import { createPlayerPieces } from '@/lib/game-engine/board';

interface PiecePlacementProps {
  onComplete: (pieces: Piece[]) => void;
}

export default function PiecePlacement({ onComplete }: PiecePlacementProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // 行营位置（上方玩家）- 转换为实际棋盘坐标
  const camps = [
    { row: 1, col: 4 },
    { row: 1, col: 6 },
    { row: 2, col: 5 },
    { row: 3, col: 4 },
    { row: 3, col: 6 },
  ];

  const isCamp = (row: number, col: number) => {
    return camps.some(c => c.row === row && c.col === col);
  };

  // 创建默认布局
  const createDefaultLayout = useCallback((pieces: Piece[]): Piece[] => {
    // 大本营位置
    const leftHeadquarters = { row: 5, col: 4 }; // 左边大本营
    const rightHeadquarters = { row: 5, col: 6 }; // 右边大本营

    // 三角雷布局（围绕左边大本营）
    const triangleMines = [
      { row: 4, col: 4 }, // 军旗上方
      { row: 5, col: 3 }, // 军旗左边
      { row: 4, col: 3 }, // 左上角
    ];

    // 所有可用位置（从左到右，从上到下）
    const availablePositions: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 3; col < 8; col++) {
        const pos = { row, col };
        // 排除行营、大本营、三角雷位置
        if (
          !isCamp(row, col) &&
          !(row === leftHeadquarters.row && col === leftHeadquarters.col) &&
          !(row === rightHeadquarters.row && col === rightHeadquarters.col) &&
          !triangleMines.some(m => m.row === row && m.col === col)
        ) {
          availablePositions.push(pos);
        }
      }
    }

    let positionIndex = 0;

    return pieces.map(piece => {
      let position: { row: number; col: number };

      if (piece.type === PieceType.FLAG) {
        // 军旗放左边大本营
        position = leftHeadquarters;
      } else if (piece.type === PieceType.LANDMINE) {
        // 三个地雷围绕军旗（三角形）
        const mineIndex = pieces.filter(
          p => p.type === PieceType.LANDMINE && pieces.indexOf(p) < pieces.indexOf(piece)
        ).length;
        position = triangleMines[mineIndex];
      } else if (piece.type === PieceType.PLATOON && pieces.filter(p => p.type === PieceType.PLATOON).indexOf(piece) === 0) {
        // 第一个排长放右边大本营
        position = rightHeadquarters;
      } else {
        // 其他棋子从左到右放置
        position = availablePositions[positionIndex];
        positionIndex++;
      }

      return {
        ...piece,
        position,
      };
    });
  }, []);

  useEffect(() => {
    // 创建初始棋子（未放置）
    const initialPieces = createPlayerPieces(0 as PlayerPosition);
    // 应用默认布局
    const piecesWithDefaultLayout = createDefaultLayout(initialPieces);
    setPieces(piecesWithDefaultLayout);
  }, [createDefaultLayout]);

  const handleCellClick = (row: number, col: number) => {
    if (!selectedPiece) return;

    // 检查是否在上方玩家阵地内 (行: 0-5, 列: 3-7)
    if (row < 0 || row > 5 || col < 3 || col > 7) {
      alert('请在你的阵地内放置棋子');
      return;
    }

    // 检查是否是行营（行营不能放置棋子）
    if (isCamp(row, col)) {
      alert('行营位置不能放置棋子');
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

  const handleConfirm = () => {
    // 检查所有棋子是否都已放置
    const unplacedPieces = pieces.filter(p => p.position.row < 0 || p.position.col < 0);

    if (unplacedPieces.length > 0) {
      alert(`还有 ${unplacedPieces.length} 个棋子未放置`);
      return;
    }

    // 验证布局是否合法
    const headquarters = [
      { row: 5, col: 4 },
      { row: 5, col: 6 },
    ];


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
              const isCampCell = isCamp(actualRow, actualCol);

              // 大本营位置 - 在最后一行（第6行，索引5）
              const isHeadquarters = (actualRow === 5 && actualCol === 4) || (actualRow === 5 && actualCol === 6);

              return (
                <button
                  key={`${actualRow}-${actualCol}`}
                  onClick={() => handleCellClick(actualRow, actualCol)}
                  disabled={isCampCell}
                  className={`
                    aspect-square border-2 transition-all relative
                    ${isCampCell ? 'rounded-full bg-orange-900/30 border-orange-500/50 cursor-not-allowed' : 'rounded-lg'}
                    ${isHeadquarters ? 'bg-yellow-900/30 border-yellow-500' : ''}
                    ${!isCampCell && !isHeadquarters && selectedPiece ? 'cursor-pointer hover:border-blue-500' : ''}
                    ${!isCampCell && !isHeadquarters && piece ? 'bg-blue-600 border-blue-500' : ''}
                    ${!isCampCell && !isHeadquarters && !piece ? 'bg-white/5 border-white/20' : ''}
                  `}
                >
                  {piece && (
                    <span className="text-white font-bold text-lg">
                      {PIECE_NAMES[piece.type]}
                    </span>
                  )}
                  {isCampCell && (
                    <span className="text-orange-400 text-xs">营</span>
                  )}
                  {isHeadquarters && !piece && (
                    <span className="text-yellow-400 text-xs">营</span>
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
      <div>
        <button
          onClick={handleConfirm}
          disabled={placedCount < 25}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
        >
          确认布局
        </button>
      </div>
    </div>
  );
}
