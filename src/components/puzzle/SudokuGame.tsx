import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Clock,
  Sparkles,
  Edit3,
  Eraser,
  Lightbulb,
  Undo2,
  AlertCircle,
  CheckCircle2,
  Star,
  ArrowRight
} from 'lucide-react';
import {
  SudokuState,
  SudokuDifficulty,
  createSudokuGame,
  checkSudokuCompleted
} from '../../services/sudokuEngine';
import { soundEffects } from '../../services/soundEffects';
import { loadPlayerStats, savePlayerStats } from '../../services/puzzleThemes';

export const SudokuGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy');
  const [game, setGame] = useState<SudokuState>(() => createSudokuGame('easy'));
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  const startNewGame = useCallback((diff: SudokuDifficulty = difficulty) => {
    setDifficulty(diff);
    setGame(createSudokuGame(diff));
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setShowWinModal(false);
  }, [difficulty]);

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
      if (!stats.bestSudokuTime || timerSeconds < stats.bestSudokuTime) {
        stats.bestSudokuTime = timerSeconds;
      }
      savePlayerStats(stats);
    }
  }, [game.isCompleted, game.moves, timerSeconds]);

  // Handle cell click
  const handleSelectCell = (r: number, c: number) => {
    setGame((prev) => ({
      ...prev,
      selectedCell: [r, c]
    }));
    soundEffects.playSlide();
  };

  // Input number into selected cell
  const handleInputNumber = (num: number) => {
    if (!game.selectedCell || game.isCompleted) return;
    const [r, c] = game.selectedCell;
    const currentCell = game.grid[r][c];

    if (currentCell.initialValue > 0) {
      // Cannot modify original clue
      return;
    }

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    if (game.notesMode) {
      // Toggle note candidate
      const nextGrid = game.grid.map((row) => row.map((cell) => ({ ...cell })));
      const nextNotes = new Set(nextGrid[r][c].notes);
      if (nextNotes.has(num)) {
        nextNotes.delete(num);
      } else {
        nextNotes.add(num);
      }
      nextGrid[r][c].notes = nextNotes;

      setGame((prev) => ({
        ...prev,
        grid: nextGrid
      }));
      soundEffects.playSlide();
      return;
    }

    // Direct placement mode
    const prevVal = currentCell.value;
    const isCorrect = game.solution[r][c] === num;

    const nextGrid = game.grid.map((row) => row.map((cell) => ({ ...cell })));
    nextGrid[r][c].value = num;
    nextGrid[r][c].notes.clear();
    nextGrid[r][c].isError = !isCorrect;

    const newMistakes = isCorrect ? game.mistakes : game.mistakes + 1;
    const completed = checkSudokuCompleted(nextGrid, game.solution);

    if (isCorrect) {
      soundEffects.playSnap();
    } else {
      soundEffects.playError();
    }

    setGame((prev) => ({
      ...prev,
      grid: nextGrid,
      moves: prev.moves + 1,
      mistakes: newMistakes,
      isCompleted: completed,
      history: [...prev.history, { row: r, col: c, prevVal, newVal: num }]
    }));
  };

  // Erase cell
  const handleErase = () => {
    if (!game.selectedCell || game.isCompleted) return;
    const [r, c] = game.selectedCell;
    const cell = game.grid[r][c];
    if (cell.initialValue > 0) return;

    const prevVal = cell.value;
    const nextGrid = game.grid.map((row) => row.map((cl) => ({ ...cl })));
    nextGrid[r][c].value = 0;
    nextGrid[r][c].notes.clear();
    nextGrid[r][c].isError = false;

    setGame((prev) => ({
      ...prev,
      grid: nextGrid,
      history: [...prev.history, { row: r, col: c, prevVal, newVal: 0 }]
    }));
    soundEffects.playSlide();
  };

  // Hint: reveal correct number
  const handleHint = () => {
    if (!game.selectedCell || game.isCompleted) return;
    const [r, c] = game.selectedCell;
    const correctVal = game.solution[r][c];

    const nextGrid = game.grid.map((row) => row.map((cl) => ({ ...cl })));
    nextGrid[r][c].value = correctVal;
    nextGrid[r][c].notes.clear();
    nextGrid[r][c].isError = false;

    soundEffects.playHint();

    const completed = checkSudokuCompleted(nextGrid, game.solution);
    setGame((prev) => ({
      ...prev,
      grid: nextGrid,
      isCompleted: completed
    }));
  };

  // Undo last action
  const handleUndo = () => {
    if (game.history.length === 0 || game.isCompleted) return;
    const last = game.history[game.history.length - 1];
    const nextGrid = game.grid.map((row) => row.map((cl) => ({ ...cl })));
    nextGrid[last.row][last.col].value = last.prevVal;
    nextGrid[last.row][last.col].isError = false;

    setGame((prev) => ({
      ...prev,
      grid: nextGrid,
      history: prev.history.slice(0, -1)
    }));
    soundEffects.playSlide();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!game.selectedCell) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key === 'ArrowUp') {
        const [r, c] = game.selectedCell;
        if (r > 0) handleSelectCell(r - 1, c);
      } else if (e.key === 'ArrowDown') {
        const [r, c] = game.selectedCell;
        if (r < 8) handleSelectCell(r + 1, c);
      } else if (e.key === 'ArrowLeft') {
        const [r, c] = game.selectedCell;
        if (c > 0) handleSelectCell(r, c - 1);
      } else if (e.key === 'ArrowRight') {
        const [r, c] = game.selectedCell;
        if (c < 8) handleSelectCell(r, c + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.selectedCell, game.notesMode, game.isCompleted]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedVal =
    game.selectedCell ? game.grid[game.selectedCell[0]][game.selectedCell[1]].value : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header bar */}
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
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mistakes</div>
              <div className="text-xl font-black text-white">
                {game.mistakes} / {game.maxMistakes}
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['easy', 'medium', 'hard', 'master'] as SudokuDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                difficulty === d
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Shuffle Button */}
        <button
          onClick={() => startNewGame(difficulty)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Game</span>
        </button>
      </div>

      {/* Main Grid & Controls Container */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Sudoku Board */}
        <div className="relative bg-slate-950 p-2 sm:p-3 rounded-3xl border-2 border-slate-800 shadow-2xl">
          <div className="grid grid-cols-9 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700">
            {game.grid.map((row, r) =>
              row.map((cell, c) => {
                const isSelected =
                  game.selectedCell &&
                  game.selectedCell[0] === r &&
                  game.selectedCell[1] === c;

                const isSameNumber =
                  selectedVal > 0 && cell.value === selectedVal;

                // 3x3 block borders
                const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-600' : 'border-r border-r-slate-800/60';
                const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-600' : 'border-b border-b-slate-800/60';

                return (
                  <button
                    key={`sudoku-${r}-${c}`}
                    onClick={() => handleSelectCell(r, c)}
                    className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center relative transition-all ${borderRight} ${borderBottom} ${
                      isSelected
                        ? 'bg-indigo-600/40 text-white font-black ring-2 ring-indigo-400 z-10'
                        : isSameNumber
                        ? 'bg-indigo-950/60 text-indigo-300'
                        : cell.initialValue > 0
                        ? 'bg-slate-900 text-slate-200'
                        : 'bg-slate-950/70 text-indigo-400 hover:bg-slate-800/60'
                    }`}
                  >
                    {cell.value > 0 ? (
                      <span
                        className={`text-base sm:text-xl font-bold ${
                          cell.isError
                            ? 'text-rose-400 animate-pulse'
                            : cell.initialValue > 0
                            ? 'text-slate-100 font-black'
                            : 'text-indigo-400'
                        }`}
                      >
                        {cell.value}
                      </span>
                    ) : cell.notes.size > 0 ? (
                      // 3x3 mini candidate notes
                      <div className="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <div
                            key={n}
                            className={`flex items-center justify-center text-[7px] sm:text-[9px] font-bold ${
                              cell.notes.has(n) ? 'text-amber-300' : 'opacity-0'
                            }`}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Numpad and Tools */}
        <div className="w-full md:w-72 flex flex-col items-center gap-4">
          {/* Action Toolbar */}
          <div className="w-full grid grid-cols-4 gap-2">
            <button
              onClick={handleUndo}
              disabled={game.history.length === 0}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition-all"
            >
              <Undo2 className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Undo</span>
            </button>

            <button
              onClick={handleErase}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
            >
              <Eraser className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Erase</span>
            </button>

            <button
              onClick={() => setGame((prev) => ({ ...prev, notesMode: !prev.notesMode }))}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                game.notesMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit3 className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">
                Notes {game.notesMode ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={handleHint}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-all"
            >
              <Lightbulb className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Hint</span>
            </button>
          </div>

          {/* 1-9 Number Pad */}
          <div className="w-full grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleInputNumber(num)}
                className="h-14 rounded-2xl bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500 text-2xl font-black text-white hover:text-indigo-200 transition-all active:scale-95 shadow-lg"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Sudoku Conquered!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Flawless logical deduction on {difficulty.toUpperCase()} tier!
            </p>

            <div className="w-full grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold">Total Moves</div>
                <div className="text-2xl font-black text-white">{game.moves}</div>
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
                Inspect
              </button>
              <button
                onClick={() => startNewGame(difficulty)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>New Board</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
