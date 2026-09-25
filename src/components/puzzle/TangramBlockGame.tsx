import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCw,
  RotateCcw,
  Trophy,
  Sparkles,
  CheckCircle2,
  Undo2,
  Trash2,
  ArrowRight,
  Boxes,
  HelpCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  BLOCK_LEVELS,
  BlockLevel,
  BlockPiece,
  rotateMatrixClockwise,
  canPlacePiece
} from '../../services/blockPuzzleEngine';
import { soundEffects } from '../../services/soundEffects';
import { loadPlayerStats, savePlayerStats } from '../../services/puzzleThemes';

export const TangramBlockGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentLevel = BLOCK_LEVELS[levelIndex];

  // Grid state: rows x cols containing null, pieceId, or '__BLOCKED__'
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    createInitialGrid(BLOCK_LEVELS[0])
  );

  // Available pieces for current level
  const [pieces, setPieces] = useState<BlockPiece[]>(() =>
    JSON.parse(JSON.stringify(BLOCK_LEVELS[0].pieces))
  );

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  function createInitialGrid(level: BlockLevel): (string | null)[][] {
    const matrix = Array.from({ length: level.rows }, () =>
      Array(level.cols).fill(null)
    );
    level.blockedCells.forEach(([r, c]) => {
      matrix[r][c] = '__BLOCKED__';
    });
    return matrix;
  }

  // Reload level
  const loadLevel = useCallback((idx: number) => {
    setLevelIndex(idx);
    const lvl = BLOCK_LEVELS[idx];
    setGrid(createInitialGrid(lvl));
    setPieces(JSON.parse(JSON.stringify(lvl.pieces)));
    setSelectedPieceId(null);
    setHoverCoord(null);
    setShowWinModal(false);
  }, []);

  // Check victory condition
  useEffect(() => {
    const allPiecesPlaced = pieces.every((p) => p.isPlaced);
    if (allPiecesPlaced && pieces.length > 0) {
      setShowWinModal(true);
      soundEffects.playVictory();

      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.6 }
      });

      const stats = loadPlayerStats();
      stats.gamesWon += 1;
      stats.starsEarned += 3;
      stats.bestBlockLevel = Math.max(stats.bestBlockLevel, levelIndex + 2);
      savePlayerStats(stats);
    }
  }, [pieces, levelIndex]);

  // Selected piece object
  const activePiece = pieces.find((p) => p.id === selectedPieceId) || null;

  // Rotate selected piece
  const handleRotateActive = () => {
    if (!activePiece || activePiece.isPlaced) return;
    soundEffects.playSlide();

    const nextPieces = pieces.map((p) => {
      if (p.id === activePiece.id) {
        return {
          ...p,
          shape: rotateMatrixClockwise(p.shape)
        };
      }
      return p;
    });
    setPieces(nextPieces);
  };

  // Place piece on grid
  const handleGridCellClick = (r: number, c: number) => {
    if (!activePiece || activePiece.isPlaced) {
      // If clicking an already placed piece on the grid, remove it back to tray
      const clickedPieceId = grid[r][c];
      if (clickedPieceId && clickedPieceId !== '__BLOCKED__') {
        removePieceFromGrid(clickedPieceId);
      }
      return;
    }

    const blockedSet = new Set(
      currentLevel.blockedCells.map(([br, bc]) => `${br},${bc}`)
    );

    if (canPlacePiece(grid, activePiece, r, c, blockedSet)) {
      // Place piece
      const nextGrid = grid.map((row) => [...row]);
      for (let pr = 0; pr < activePiece.shape.length; pr++) {
        for (let pc = 0; pc < activePiece.shape[0].length; pc++) {
          if (activePiece.shape[pr][pc] === 1) {
            nextGrid[r + pr][c + pc] = activePiece.id;
          }
        }
      }

      setGrid(nextGrid);
      setPieces((prev) =>
        prev.map((p) =>
          p.id === activePiece.id
            ? { ...p, isPlaced: true, placedRow: r, placedCol: c }
            : p
        )
      );
      setSelectedPieceId(null);
      soundEffects.playSnap();
    } else {
      soundEffects.playError();
    }
  };

  const removePieceFromGrid = (pieceId: string) => {
    const nextGrid = grid.map((row) =>
      row.map((cell) => (cell === pieceId ? null : cell))
    );
    setGrid(nextGrid);
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, isPlaced: false } : p))
    );
    soundEffects.playSlide();
  };

  const handleResetLevel = () => {
    loadLevel(levelIndex);
  };

  // Compute ghost placement overlay
  const getGhostPreview = () => {
    if (!activePiece || activePiece.isPlaced || !hoverCoord) return null;
    const [hr, hc] = hoverCoord;
    const blockedSet = new Set(
      currentLevel.blockedCells.map(([br, bc]) => `${br},${bc}`)
    );
    const isValid = canPlacePiece(grid, activePiece, hr, hc, blockedSet);

    const ghostCells: Array<{ r: number; c: number }> = [];
    for (let pr = 0; pr < activePiece.shape.length; pr++) {
      for (let pc = 0; pc < activePiece.shape[0].length; pc++) {
        if (activePiece.shape[pr][pc] === 1) {
          ghostCells.push({ r: hr + pr, c: hc + pc });
        }
      }
    }

    return { ghostCells, isValid };
  };

  const ghostPreview = getGhostPreview();

  // Find color for cell
  const getCellColor = (cellVal: string | null) => {
    if (!cellVal || cellVal === '__BLOCKED__') return null;
    const piece = pieces.find((p) => p.id === cellVal);
    return piece ? piece.color : '#6366F1';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Header & Level Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Tangram Level {levelIndex + 1}
            </div>
            <div className="text-lg font-black text-white">{currentLevel.name}</div>
          </div>
        </div>

        {/* Level Pager */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLevel(Math.max(0, levelIndex - 1))}
            disabled={levelIndex === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-300 px-2">
            Stage {levelIndex + 1} / {BLOCK_LEVELS.length}
          </span>

          <button
            onClick={() => loadLevel(Math.min(BLOCK_LEVELS.length - 1, levelIndex + 1))}
            disabled={levelIndex === BLOCK_LEVELS.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activePiece && !activePiece.isPlaced && (
            <button
              onClick={handleRotateActive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-all active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate 90°</span>
            </button>
          )}

          <button
            onClick={handleResetLevel}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage Area */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Tangram Grid */}
        <div className="relative bg-slate-950 p-4 sm:p-5 rounded-3xl border-2 border-slate-800 shadow-2xl">
          <div
            className="grid gap-1.5 sm:gap-2 bg-slate-900/60 p-2 rounded-2xl"
            style={{
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isBlocked = cell === '__BLOCKED__';
                const cellColor = getCellColor(cell);

                const isGhost =
                  ghostPreview?.ghostCells.some((gc) => gc.r === r && gc.c === c) || false;
                const isGhostValid = ghostPreview?.isValid;

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    disabled={isBlocked}
                    onClick={() => handleGridCellClick(r, c)}
                    onMouseEnter={() => setHoverCoord([r, c])}
                    onMouseLeave={() => setHoverCoord(null)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                      isBlocked
                        ? 'bg-slate-950 border border-slate-800/40 opacity-40 cursor-not-allowed'
                        : cell
                        ? 'cursor-pointer hover:brightness-110 active:scale-95 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: cellColor || undefined
                    }}
                  >
                    {/* Ghost preview overlay */}
                    {isGhost && (
                      <div
                        className={`absolute inset-0 rounded-xl border-2 transition-all ${
                          isGhostValid
                            ? 'bg-emerald-400/40 border-emerald-400 animate-pulse'
                            : 'bg-rose-500/40 border-rose-500'
                        }`}
                      />
                    )}

                    {isBlocked && (
                      <div className="w-3 h-3 rounded-full bg-slate-800" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pieces Tray / Inventory */}
        <div className="w-full md:w-80 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Available Pieces ({pieces.filter((p) => !p.isPlaced).length} Left)
            </span>
            {activePiece && (
              <span className="text-xs font-bold text-amber-400 animate-pulse">
                Click grid to place
              </span>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-3 min-h-[220px]">
            {pieces.map((piece) => {
              const isSelected = selectedPieceId === piece.id;

              if (piece.isPlaced) {
                return (
                  <div
                    key={piece.id}
                    className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 opacity-40 flex items-center justify-center text-xs font-bold text-slate-500"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                    Placed
                  </div>
                );
              }

              return (
                <button
                  key={piece.id}
                  onClick={() => {
                    setSelectedPieceId(isSelected ? null : piece.id);
                    soundEffects.playSlide();
                  }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500 shadow-lg scale-102'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Shape Visualizer */}
                  <div className="flex flex-col gap-1 items-center">
                    {piece.shape.map((row, r) => (
                      <div key={r} className="flex gap-1">
                        {row.map((val, c) => (
                          <div
                            key={c}
                            className={`w-3.5 h-3.5 rounded-sm ${
                              val === 1 ? 'shadow-sm' : 'opacity-0'
                            }`}
                            style={{
                              backgroundColor: val === 1 ? piece.color : 'transparent'
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">
                    {piece.name}
                  </span>
                </button>
              );
            })}
          </div>

          {activePiece && !activePiece.isPlaced && (
            <div className="w-full mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Selected: {activePiece.name}</span>
              <button
                onClick={handleRotateActive}
                className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate Piece
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Win Celebration Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Tangram Complete!</h3>
            <p className="text-sm text-slate-400 mb-6">
              All polyomino pieces fit flawlessly into {currentLevel.name}.
            </p>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setShowWinModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Inspect
              </button>

              {levelIndex < BLOCK_LEVELS.length - 1 ? (
                <button
                  onClick={() => loadLevel(levelIndex + 1)}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Next Level</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => loadLevel(0)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Replay All</span>
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
