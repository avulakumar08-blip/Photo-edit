import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Upload,
  Camera,
  Layers,
  Sliders,
  Boxes,
  Grid3X3,
  Brain,
  SlidersHorizontal,
  Star,
  ExternalLink
} from 'lucide-react';
import { SlidingPuzzleGame } from './SlidingPuzzleGame';
import { JigsawSwapGame } from './JigsawSwapGame';
import { TangramBlockGame } from './TangramBlockGame';
import { SudokuGame } from './SudokuGame';
import { MemoryMatrixGame } from './MemoryMatrixGame';
import { CustomPhotoPuzzleModal } from './CustomPhotoPuzzleModal';
import { StatsModal } from './StatsModal';
import { HowToPlayModal } from './HowToPlayModal';
import { soundEffects } from '../../services/soundEffects';

export type PuzzleMode = 'sliding' | 'jigsaw' | 'tangram' | 'sudoku' | 'memory';

interface PuzzleStudioProps {
  onSwitchToPhotoEditor?: () => void;
}

export const PuzzleStudio: React.FC<PuzzleStudioProps> = ({ onSwitchToPhotoEditor }) => {
  const [activeMode, setActiveMode] = useState<PuzzleMode>('sliding');
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Modals
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playSlide();
    }
  };

  const navItems = [
    { id: 'sliding', label: 'Sliding Tiles', icon: Sliders, badge: 'Classic' },
    { id: 'jigsaw', label: 'Jigsaw Snap', icon: Layers, badge: 'Mosaic' },
    { id: 'tangram', label: 'Tangram', icon: Boxes, badge: 'Spatial' },
    { id: 'sudoku', label: 'Sudoku Zen', icon: Grid3X3, badge: 'Logic' },
    { id: 'memory', label: 'Memory Matrix', icon: Brain, badge: 'Focus' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">
                  MindForge Puzzles
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Brain Teasers, Photo Puzzles & Spatial Logic
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Custom Photo Button */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Create puzzle from your own picture or camera"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Custom Photo</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-slate-800/60 border-slate-700 text-slate-500'
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              }`}
              title={isMuted ? 'Sound Muted' : 'Sound Effects Active'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* How to Play */}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Player Stats */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 transition-all"
              title="Player Records & Stats"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Switch to Photo Studio */}
            {onSwitchToPhotoEditor && (
              <button
                onClick={onSwitchToPhotoEditor}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-violet-900/40 transition-all active:scale-95"
                title="Switch to Android Photo Editor Studio"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Photo Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* Game Mode Tab Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-start sm:justify-center overflow-x-auto gap-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMode(item.id as PuzzleMode);
                  soundEffects.playSlide();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Game Surface */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-7xl w-full mx-auto">
        {activeMode === 'sliding' && (
          <SlidingPuzzleGame
            customImage={customImage}
            onOpenCustomModal={() => setShowCustomModal(true)}
          />
        )}

        {activeMode === 'jigsaw' && (
          <JigsawSwapGame
            customImage={customImage}
            onOpenCustomModal={() => setShowCustomModal(true)}
          />
        )}

        {activeMode === 'tangram' && <TangramBlockGame />}

        {activeMode === 'sudoku' && <SudokuGame />}

        {activeMode === 'memory' && <MemoryMatrixGame />}
      </main>

      {/* Modals */}
      <CustomPhotoPuzzleModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSelectImage={(dataUrl) => {
          setCustomImage(dataUrl);
          soundEffects.playSnap();
        }}
        onOpenPhotoEditor={onSwitchToPhotoEditor}
      />

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
};
