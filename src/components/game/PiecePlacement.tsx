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
    // 检查该位置是否有棋子
    const pieceAtPosition = pieces.find(
      p => p.position.row === row && p.position.col === col
    );

    // 如果点击的位置有棋子，选中该棋子（或交换）
    if (pieceAtPosition) {
      handlePieceClick(pieceAtPosition.id);
      return;
    }

    // 如果没有选中的棋子，什么也不做
    if (!selectedPiece) return;

    // 检查是否是行营（行营不能放置棋子）
    if (isCamp(row, col)) {
      alert('行营位置不能放置棋子');
      return;
    }

    // 移动选中的棋子到空位置
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
    // 如果点击的是已选中的棋子，取消选中
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      return;
    }

    // 如果已经有选中的棋子，交换两个棋子的位置
    if (selectedPiece) {
      const piece1 = pieces.find(p => p.id === selectedPiece);
      const piece2 = pieces.find(p => p.id === pieceId);

      if (piece1 && piece2) {
        // 交换位置
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
      // 没有选中的棋子，选中当前棋子
      setSelectedPiece(pieceId);
    }
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
              const isSelected = piece && piece.id === selectedPiece;

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
                    ${!isCampCell && !isHeadquarters && piece && !isSelected ? 'bg-blue-600 border-blue-500' : ''}
                    ${!isCampCell && !isHeadquarters && isSelected ? 'bg-green-600 border-green-400 animate-bounce' : ''}
                    ${!isCampCell && !isHeadquarters && !piece ? 'bg-white/5 border-white/20' : ''}
                  `}
                >
                  {piece && (
                    <span className={`text-white font-bold text-lg ${isSelected ? 'animate-pulse' : ''}`}>
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

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          操作说明
        </h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• 点击一个棋子，再点击另一个棋子，即可交换位置</li>
          <li>• 点击已选中的棋子可以取消选中</li>
          <li>• 选中的棋子会有跳动效果</li>
        </ul>
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
