import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Star,
  Clock,
  Footprints,
  Flame,
  Award,
  RotateCcw,
  Boxes,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  PlayerStats,
  loadPlayerStats,
  savePlayerStats
} from '../../services/puzzleThemes';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats());

  useEffect(() => {
    if (isOpen) {
      setStats(loadPlayerStats());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number | null) => {
    if (!totalSec) return '--:--';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (window.confirm('Reset all high scores and player statistics?')) {
      const empty: PlayerStats = {
        gamesWon: 0,
        totalMoves: 0,
        bestSlidingTime: null,
        bestSlidingMoves: null,
        bestJigsawTime: null,
        bestBlockLevel: 1,
        bestSudokuTime: null,
        starsEarned: 0
      };
      savePlayerStats(empty);
      setStats(empty);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Player Records & Badges</h3>
              <p className="text-xs text-slate-400">Your mind-bending puzzle accomplishments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Highlights Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-semibold mb-1">Puzzles Won</div>
            <div className="text-2xl font-black text-indigo-400">{stats.gamesWon}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-semibold mb-1">Stars Earned</div>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
              <span>{stats.starsEarned}</span>
              <Star className="w-4 h-4 fill-current text-amber-400" />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-semibold mb-1">Total Moves</div>
            <div className="text-2xl font-black text-emerald-400">{stats.totalMoves}</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="flex flex-col gap-2.5 mb-6">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Footprints className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">Fastest Sliding Puzzle</span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {formatTime(stats.bestSlidingTime)}
              {stats.bestSlidingMoves ? ` (${stats.bestSlidingMoves} moves)` : ''}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Fastest Jigsaw Snap</span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {formatTime(stats.bestJigsawTime)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Boxes className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold text-slate-300">Tangram Highest Level</span>
            </div>
            <div className="text-xs font-bold text-white">
              Stage {stats.bestBlockLevel}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-300">Fastest Sudoku Win</span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {formatTime(stats.bestSudokuTime)}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
