import React from 'react';
import {
  HelpCircle,
  X,
  Sliders,
  Layers,
  Boxes,
  Grid3X3,
  Sparkles,
  Zap
} from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">How to Play</h3>
              <p className="text-xs text-slate-400">Rules & strategies for each puzzle mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guides */}
        <div className="flex flex-col gap-4 text-xs text-slate-300">
          {/* Sliding */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1.5">
              <Sliders className="w-4 h-4" />
              <span>Sliding Tile / 15-Puzzle</span>
            </div>
            <p className="leading-relaxed text-slate-400 mb-2">
              Slide tiles adjacent to the empty square to reassemble the picture in numerical
              sequence from top-left to bottom-right.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>Pro Tip: Toggle the "#" icon to reveal tile numbers if you get stuck!</span>
            </div>
          </div>

          {/* Jigsaw */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1.5">
              <Layers className="w-4 h-4" />
              <span>Jigsaw Snap & Swap</span>
            </div>
            <p className="leading-relaxed text-slate-400 mb-2">
              Tap any tile to select it, then tap another tile to swap their positions. When a
              piece lands in its true spot, it locks in with a green border and lock icon.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hold the eye icon at any moment to peek the completed reference guide!</span>
            </div>
          </div>

          {/* Tangram */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm mb-1.5">
              <Boxes className="w-4 h-4" />
              <span>Tangram & Polyomino Fitter</span>
            </div>
            <p className="leading-relaxed text-slate-400 mb-2">
              Select geometric blocks from the right tray and place them onto the grid. Fill all
              available empty squares without overlapping or crossing void boundaries.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-pink-300 font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>Rotate pieces 90° using the Rotate button to find the perfect geometric fit.</span>
            </div>
          </div>

          {/* Sudoku */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1.5">
              <Grid3X3 className="w-4 h-4" />
              <span>Sudoku Zen</span>
            </div>
            <p className="leading-relaxed text-slate-400 mb-2">
              Fill each row, column, and 3×3 square with numbers 1 through 9 without duplicates.
              Use Notes Mode to draft candidate numbers, or press Hint for a guiding hand.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
