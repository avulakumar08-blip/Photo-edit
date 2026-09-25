import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  Eye,
  Star,
  Upload,
  ArrowRight,
  Layers
} from 'lucide-react';
import {
  JigsawBoardState,
  createJigsawBoard,
  swapJigsawPieces
} from '../../services/jigsawSwapEngine';
import { soundEffects } from '../../services/soundEffects';
import { PRESET_ARTWORKS, PuzzleArtwork, loadPlayerStats, savePlayerStats } from '../../services/puzzleThemes';

interface JigsawSwapGameProps {
  customImage?: string | null;
  onOpenCustomModal?: () => void;
}

export const JigsawSwapGame: React.FC<JigsawSwapGameProps> = ({
  customImage,
  onOpenCustomModal
}) => {
  const [gridSize, setGridSize] = useState<number>(4); // default 4x4 for Jigsaw
  const [selectedArtwork, setSelectedArtwork] = useState<PuzzleArtwork>(PRESET_ARTWORKS[1]); // enchanted forest
  const [board, setBoard] = useState<JigsawBoardState>(() => createJigsawBoard(4));
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [showPeek, setShowPeek] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  const activeImageSrc = customImage || selectedArtwork.src;
  const totalPieces = gridSize * gridSize;
  const progressPercent = Math.round((board.correctCount / totalPieces) * 100);

  const startNewGame = useCallback((size: number = gridSize) => {
    const newBoard = createJigsawBoard(size);
    setBoard(newBoard);
    setSelectedTileIndex(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setShowWinModal(false);
  }, [gridSize]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !board.isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, board.isCompleted]);

  // Victory Handler
  useEffect(() => {
    if (board.isCompleted && board.swaps > 0) {
      setIsTimerRunning(false);
      setShowWinModal(true);
      soundEffects.playVictory();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const stats = loadPlayerStats();
      stats.gamesWon += 1;
      stats.totalMoves += board.swaps;
      stats.starsEarned += 3;
      if (!stats.bestJigsawTime || timerSeconds < stats.bestJigsawTime) {
        stats.bestJigsawTime = timerSeconds;
      }
      savePlayerStats(stats);
    }
  }, [board.isCompleted, board.swaps, timerSeconds]);

  const handleTileClick = (clickedIndex: number) => {
    if (board.isCompleted) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    if (selectedTileIndex === null) {
      // First tile selected
      soundEffects.playSlide();
      setSelectedTileIndex(clickedIndex);
    } else if (selectedTileIndex === clickedIndex) {
      // Deselect
      setSelectedTileIndex(null);
    } else {
      // Perform swap
      const { newState, newlyLockedCount } = swapJigsawPieces(
        board,
        selectedTileIndex,
        clickedIndex
      );
      setBoard(newState);
      setSelectedTileIndex(null);

      if (newlyLockedCount > 0) {
        soundEffects.playSnap();
      } else {
        soundEffects.playSlide();
      }
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Header & Stats */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Swaps</div>
              <div className="text-xl font-black text-white">{board.swaps}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Time</div>
              <div className="text-xl font-black text-white font-mono">{formatTime(timerSeconds)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Locked Pieces
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-400">
                {board.correctCount} / {totalPieces}
              </span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Size Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { label: '3×3 Quick', size: 3 },
            { label: '4×4 Standard', size: 4 },
            { label: '5×5 Expert', size: 5 }
          ].map((item) => (
            <button
              key={item.size}
              onClick={() => {
                setGridSize(item.size);
                startNewGame(item.size);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gridSize === item.size
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => setShowPeek(true)}
            onMouseUp={() => setShowPeek(false)}
            onTouchStart={() => setShowPeek(true)}
            onTouchEnd={() => setShowPeek(false)}
            title="Hold to peek completed picture"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => startNewGame()}
            title="Restart Jigsaw"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reshuffle</span>
          </button>
        </div>
      </div>

      {/* Main Jigsaw Board */}
      <div className="relative w-full flex flex-col items-center justify-center">
        <div
          className="relative bg-slate-950 p-3 sm:p-4 rounded-3xl border-2 border-slate-800 shadow-2xl max-w-full"
          style={{ width: 'min(92vw, 480px)', height: 'min(92vw, 480px)' }}
        >
          {/* Peek Original Overlay */}
          {showPeek && (
            <div className="absolute inset-3 sm:inset-4 rounded-2xl overflow-hidden z-30 pointer-events-none shadow-2xl border-2 border-indigo-400 animate-fadeIn">
              <img
                src={activeImageSrc}
                alt="Reference View"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reference Guide</span>
              </div>
            </div>
          )}

          {/* Pieces Grid */}
          <div
            className="w-full h-full grid gap-1.5 sm:gap-2 rounded-2xl overflow-hidden bg-slate-900/80 p-1"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {board.pieces.map((piece, currentSlotIndex) => {
              // The original coordinate of this piece is piece.id
              const origRow = Math.floor(piece.id / gridSize);
              const origCol = piece.id % gridSize;

              const percentX = (origCol / (gridSize - 1)) * 100;
              const percentY = (origRow / (gridSize - 1)) * 100;

              const isSelected = selectedTileIndex === currentSlotIndex;
              const isLocked = piece.isLocked;

              return (
                <button
                  key={`jigsaw-${piece.id}-${currentSlotIndex}`}
                  onClick={() => handleTileClick(currentSlotIndex)}
                  className={`relative w-full h-full rounded-xl overflow-hidden transition-all duration-200 transform select-none ${
                    isSelected
                      ? 'ring-4 ring-amber-400 scale-105 z-20 shadow-xl'
                      : isLocked
                      ? 'ring-2 ring-emerald-500/80 hover:ring-emerald-400'
                      : 'hover:scale-98 hover:brightness-110 active:scale-95 ring-1 ring-white/10'
                  }`}
                  style={{
                    backgroundImage: `url(${activeImageSrc})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${percentX}% ${percentY}%`,
                    boxShadow: isLocked
                      ? 'inset 0 0 12px rgba(16, 185, 129, 0.4), 0 4px 6px -1px rgba(0,0,0,0.5)'
                      : '0 4px 6px -1px rgba(0,0,0,0.4)'
                  }}
                >
                  {/* Locked Badge */}
                  {isLocked && (
                    <div className="absolute bottom-1 right-1 bg-emerald-950/80 backdrop-blur-sm text-emerald-400 p-0.5 rounded shadow">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                      <span className="bg-amber-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded shadow">
                        SELECTED
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-slate-400 mt-3 text-center">
          Tap one piece, then tap another to swap them. Pieces lock in green when placed correctly.
        </p>

        {/* Artwork Selector Deck */}
        <div className="w-full mt-6 flex flex-col items-center">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Select Artwork or Upload Custom Photo</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {PRESET_ARTWORKS.map((artwork) => (
              <button
                key={artwork.id}
                onClick={() => {
                  setSelectedArtwork(artwork);
                  startNewGame();
                }}
                className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all ${
                  !customImage && selectedArtwork.id === artwork.id
                    ? 'bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <img
                  src={artwork.src}
                  alt={artwork.title}
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-white leading-tight">{artwork.title}</div>
                  <div className="text-[10px] text-slate-400">{artwork.category}</div>
                </div>
              </button>
            ))}

            {onOpenCustomModal && (
              <button
                onClick={onOpenCustomModal}
                className={`flex items-center gap-2 p-2 px-3 rounded-xl border border-dashed transition-all ${
                  customImage
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">
                  {customImage ? 'Custom Photo Active' : 'Upload Any Photo'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Mosaic Reassembled!</h3>
            <p className="text-sm text-slate-400 mb-4">
              All {totalPieces} jigsaw pieces locked into their exact coordinates.
            </p>

            <div className="flex items-center justify-center gap-1.5 mb-6 text-amber-400">
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
            </div>

            <div className="w-full grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold">Total Swaps</div>
                <div className="text-2xl font-black text-white">{board.swaps}</div>
              </div>
              <div className="text-center border-l border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">Time Elapsed</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {formatTime(timerSeconds)}
                </div>
              </div>
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setShowWinModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Review Board
              </button>
              <button
                onClick={() => startNewGame()}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Play Again</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
