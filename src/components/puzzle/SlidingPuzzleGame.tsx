import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Clock,
  Footprints,
  Eye,
  Hash,
  Sparkles,
  HelpCircle,
  Play,
  Volume2,
  VolumeX,
  Star,
  CheckCircle2,
  Upload,
  ArrowRight
} from 'lucide-react';
import {
  BoardState,
  createSolvableBoard,
  moveTile,
  isSolved
} from '../../services/slidingPuzzleEngine';
import { soundEffects } from '../../services/soundEffects';
import { PRESET_ARTWORKS, PuzzleArtwork, loadPlayerStats, savePlayerStats } from '../../services/puzzleThemes';

interface SlidingPuzzleGameProps {
  customImage?: string | null;
  onOpenCustomModal?: () => void;
}

export const SlidingPuzzleGame: React.FC<SlidingPuzzleGameProps> = ({
  customImage,
  onOpenCustomModal
}) => {
  const [gridSize, setGridSize] = useState<number>(3); // 3x3, 4x4, 5x5
  const [selectedArtwork, setSelectedArtwork] = useState<PuzzleArtwork>(PRESET_ARTWORKS[0]);
  const [board, setBoard] = useState<BoardState>(() => createSolvableBoard(3));
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [showPeek, setShowPeek] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [bestScore, setBestScore] = useState<{ moves: number; time: number } | null>(null);

  const activeImageSrc = customImage || selectedArtwork.src;

  // Initialize board on size change
  const startNewGame = useCallback((size: number = gridSize) => {
    const newBoard = createSolvableBoard(size);
    setBoard(newBoard);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setShowWinModal(false);
  }, [gridSize]);

  // Load best scores
  useEffect(() => {
    const stats = loadPlayerStats();
    if (stats.bestSlidingMoves && stats.bestSlidingTime) {
      setBestScore({ moves: stats.bestSlidingMoves, time: stats.bestSlidingTime });
    }
  }, []);

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

  // On winning
  useEffect(() => {
    if (board.isCompleted && board.moves > 0) {
      setIsTimerRunning(false);
      setShowWinModal(true);
      soundEffects.playVictory();

      // Trigger colorful celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update stats
      const stats = loadPlayerStats();
      stats.gamesWon += 1;
      stats.totalMoves += board.moves;
      stats.starsEarned += 3;

      if (!stats.bestSlidingMoves || board.moves < stats.bestSlidingMoves) {
        stats.bestSlidingMoves = board.moves;
      }
      if (!stats.bestSlidingTime || timerSeconds < stats.bestSlidingTime) {
        stats.bestSlidingTime = timerSeconds;
      }
      savePlayerStats(stats);
      setBestScore({ moves: stats.bestSlidingMoves, time: stats.bestSlidingTime });
    }
  }, [board.isCompleted, board.moves, timerSeconds]);

  const handleTileClick = (index: number) => {
    if (board.isCompleted) return;

    // Start timer on first move
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const nextState = moveTile(board, index);
    if (nextState) {
      soundEffects.playSlide();
      setBoard(nextState);
    } else {
      soundEffects.playError();
    }
  };

  const handleSizeChange = (size: number) => {
    setGridSize(size);
    startNewGame(size);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6">
        {/* Game Stats & Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Moves</div>
              <div className="text-xl font-black text-white">{board.moves}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Time</div>
              <div className="text-xl font-black text-white font-mono">{formatTime(timerSeconds)}</div>
            </div>
          </div>

          {bestScore && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-6">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Best Record</div>
                <div className="text-sm font-bold text-amber-200">
                  {bestScore.moves} moves ({formatTime(bestScore.time)})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Difficulty Size Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { label: '3×3 Casual', size: 3 },
            { label: '4×4 Classic', size: 4 },
            { label: '5×5 Master', size: 5 }
          ].map((item) => (
            <button
              key={item.size}
              onClick={() => handleSizeChange(item.size)}
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
            onClick={() => setShowNumbers(!showNumbers)}
            title="Toggle number indicators"
            className={`p-2.5 rounded-xl border transition-all ${
              showNumbers
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" />
          </button>

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
            title="Restart & Shuffle"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Main Puzzle Board Area */}
      <div className="relative w-full flex flex-col items-center justify-center">
        {/* The Puzzle Canvas Frame */}
        <div
          className="relative bg-slate-950 p-3 sm:p-4 rounded-3xl border-2 border-slate-800 shadow-2xl max-w-full"
          style={{ width: 'min(92vw, 480px)', height: 'min(92vw, 480px)' }}
        >
          {/* Peek Original Overlay */}
          {showPeek && (
            <div className="absolute inset-3 sm:inset-4 rounded-2xl overflow-hidden z-30 pointer-events-none shadow-2xl border-2 border-indigo-400 animate-fadeIn">
              <img
                src={activeImageSrc}
                alt="Original Solved View"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reference Guide</span>
              </div>
            </div>
          )}

          {/* Interactive Tiles Grid */}
          <div
            className="w-full h-full grid gap-1.5 sm:gap-2 rounded-2xl overflow-hidden bg-slate-900/80 p-1"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {board.tiles.map((tileId, index) => {
              if (tileId === 0) {
                // Empty blank space
                return (
                  <div
                    key={`blank-${index}`}
                    className="w-full h-full rounded-xl bg-slate-950/60 border border-dashed border-slate-800/80 transition-colors"
                  />
                );
              }

              // Calculate background image coordinates for this tile
              // Tile ID ranges from 1 to total-1. Correct coordinate in solved board is (tileId - 1)
              const solvedIndex = tileId - 1;
              const origRow = Math.floor(solvedIndex / gridSize);
              const origCol = solvedIndex % gridSize;

              const percentX = (origCol / (gridSize - 1)) * 100;
              const percentY = (origRow / (gridSize - 1)) * 100;

              const isDirectlyMovable =
                Math.abs(Math.floor(index / gridSize) - Math.floor(board.emptyIndex / gridSize)) +
                  Math.abs((index % gridSize) - (board.emptyIndex % gridSize)) ===
                1;

              return (
                <button
                  key={`tile-${tileId}`}
                  onClick={() => handleTileClick(index)}
                  className={`relative w-full h-full rounded-xl overflow-hidden transition-all duration-150 transform select-none ${
                    isDirectlyMovable
                      ? 'cursor-pointer hover:brightness-110 active:scale-95 ring-2 ring-indigo-400/40 hover:ring-indigo-400'
                      : 'cursor-default opacity-95'
                  }`}
                  style={{
                    backgroundImage: `url(${activeImageSrc})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${percentX}% ${percentY}%`,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 4px 6px -1px rgba(0,0,0,0.4)'
                  }}
                >
                  {/* Optional Number Badge Overlay */}
                  {showNumbers && (
                    <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-white font-extrabold text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md shadow-sm border border-white/20">
                      {tileId}
                    </div>
                  )}

                  {/* Solved subtle dot indicator */}
                  {tileId === index + 1 && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

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

      {/* Victory Celebration Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Puzzle Solved!</h3>
            <p className="text-sm text-slate-400 mb-4">
              Magnificent logic and spatial precision!
            </p>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-1.5 mb-6 text-amber-400">
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
              <Star className="w-6 h-6 fill-current" />
            </div>

            {/* Scorecard */}
            <div className="w-full grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold">Total Moves</div>
                <div className="text-2xl font-black text-white">{board.moves}</div>
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
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
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
