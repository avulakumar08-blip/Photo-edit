import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Clock,
  Sparkles,
  Zap,
  Flame,
  Compass,
  Globe,
  Key,
  Shield,
  Heart,
  Crown,
  Moon,
  Anchor,
  Sun,
  Feather,
  Award,
  Gem,
  Bell,
  Eye,
  Star,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  MemoryGameState,
  MemoryCard,
  createMemoryGame
} from '../../services/memoryPuzzleEngine';
import { soundEffects } from '../../services/soundEffects';
import { loadPlayerStats, savePlayerStats } from '../../services/puzzleThemes';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Zap,
  Flame,
  Compass,
  Globe,
  Key,
  Shield,
  Heart,
  Crown,
  Moon,
  Anchor,
  Sun,
  Feather,
  Award,
  Gem,
  Bell,
  Eye
};

export const MemoryMatrixGame: React.FC = () => {
  const [pairsCount, setPairsCount] = useState<number>(8); // 8 pairs = 16 cards (4x4)
  const [game, setGame] = useState<MemoryGameState>(() => createMemoryGame(8));
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  const startNewGame = useCallback((pairs: number = pairsCount) => {
    setPairsCount(pairs);
    setGame(createMemoryGame(pairs));
    setIsProcessing(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setShowWinModal(false);
  }, [pairsCount]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !game.isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, game.isCompleted]);

  // Win condition check
  useEffect(() => {
    if (game.isCompleted && game.moves > 0) {
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
      stats.totalMoves += game.moves;
      stats.starsEarned += 3;
      savePlayerStats(stats);
    }
  }, [game.isCompleted, game.moves]);

  const handleCardClick = (index: number) => {
    if (isProcessing || game.isCompleted) return;

    const card = game.cards[index];
    if (card.isFlipped || card.isMatched) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    soundEffects.playSlide();

    // Flip card
    const nextCards = [...game.cards];
    nextCards[index] = { ...card, isFlipped: true };
    const nextFlipped = [...game.flippedIndices, index];

    if (nextFlipped.length === 1) {
      setGame((prev) => ({
        ...prev,
        cards: nextCards,
        flippedIndices: nextFlipped
      }));
    } else if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];
      const isMatch = firstCard.pairId === secondCard.pairId;

      setIsProcessing(true);

      if (isMatch) {
        soundEffects.playSnap();
        nextCards[firstIdx].isMatched = true;
        nextCards[secondIdx].isMatched = true;

        const nextMatches = game.matches + 1;
        const nextStreak = game.streak + 1;
        const bestStreak = Math.max(game.bestStreak, nextStreak);
        const completed = nextMatches === game.totalPairs;

        setGame((prev) => ({
          ...prev,
          cards: nextCards,
          flippedIndices: [],
          moves: prev.moves + 1,
          matches: nextMatches,
          streak: nextStreak,
          bestStreak,
          isCompleted: completed
        }));
        setIsProcessing(false);
      } else {
        soundEffects.playError();
        setGame((prev) => ({
          ...prev,
          cards: nextCards,
          flippedIndices: nextFlipped,
          moves: prev.moves + 1,
          streak: 0
        }));

        setTimeout(() => {
          setGame((prev) => {
            const resetCards = prev.cards.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            );
            return {
              ...prev,
              cards: resetCards,
              flippedIndices: []
            };
          });
          setIsProcessing(false);
        }, 900);
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
      {/* Top Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Time</div>
              <div className="text-xl font-black text-white font-mono">{formatTime(timerSeconds)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Matches</div>
              <div className="text-xl font-black text-white">
                {game.matches} / {game.totalPairs}
              </div>
            </div>
          </div>

          {game.streak > 1 && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-6 animate-pulse">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Streak</div>
                <div className="text-xl font-black text-amber-300">×{game.streak}</div>
              </div>
            </div>
          )}
        </div>

        {/* Difficulty Size Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { label: '8 Pairs (4×4)', pairs: 8 },
            { label: '10 Pairs (4×5)', pairs: 10 }
          ].map((item) => (
            <button
              key={item.pairs}
              onClick={() => startNewGame(item.pairs)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                pairsCount === item.pairs
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => startNewGame(pairsCount)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reshuffle</span>
        </button>
      </div>

      {/* Card Matrix */}
      <div className="relative bg-slate-950 p-3 sm:p-5 rounded-3xl border-2 border-slate-800 shadow-2xl max-w-full">
        <div
          className="grid gap-2.5 sm:gap-3.5"
          style={{
            gridTemplateColumns: pairsCount === 8 ? 'repeat(4, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))'
          }}
        >
          {game.cards.map((card, idx) => {
            const IconComponent = ICON_MAP[card.iconName] || Sparkles;
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.isMatched || isProcessing}
                className={`w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 rounded-2xl relative transition-all duration-300 transform preserve-3d select-none ${
                  isRevealed
                    ? 'rotate-y-180 shadow-lg'
                    : 'bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500 hover:scale-102 cursor-pointer shadow-md'
                }`}
              >
                {/* Front (Hidden Face) */}
                {!isRevealed && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-slate-900/90 border border-slate-800 group-hover:border-indigo-500/50">
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Back (Revealed Face) */}
                {isRevealed && (
                  <div
                    className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all ${
                      card.isMatched
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400'
                        : 'bg-indigo-950/40 border-indigo-500 text-indigo-300'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 shadow-md"
                      style={{
                        backgroundColor: `${card.color}25`,
                        color: card.color
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-tight truncate max-w-full">
                      {card.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Memory Matrix Mastered!</h3>
            <p className="text-sm text-slate-400 mb-6">
              All {game.totalPairs} pairs matched with supreme recall speed.
            </p>

            <div className="w-full grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold">Total Flips</div>
                <div className="text-2xl font-black text-white">{game.moves}</div>
              </div>
              <div className="text-center border-l border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">Best Streak</div>
                <div className="text-2xl font-black text-amber-400">×{game.bestStreak}</div>
              </div>
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setShowWinModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                Inspect
              </button>
              <button
                onClick={() => startNewGame(pairsCount)}
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
