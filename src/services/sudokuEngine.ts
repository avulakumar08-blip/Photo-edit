/**
 * Sudoku Generator, Solver, and Validation Engine
 */

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface SudokuCell {
  row: number;
  col: number;
  value: number; // 0 for empty, 1-9
  initialValue: number; // original clue, cannot be edited if > 0
  notes: Set<number>; // candidate pencil marks
  isError: boolean;
  isValidated: boolean;
}

export interface SudokuState {
  grid: SudokuCell[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
  selectedCell: [number, number] | null;
  moves: number;
  mistakes: number;
  maxMistakes: number;
  isCompleted: boolean;
  notesMode: boolean;
  history: Array<{ row: number; col: number; prevVal: number; newVal: number }>;
}

// Helper to check valid digit in 9x9 grid
function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) return false;
    }
  }
  return true;
}

// Backtracking solver
function solveSudoku(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        // Shuffle candidate numbers 1-9 for randomized complete solution
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSudoku(difficulty: SudokuDifficulty): {
  initial: number[][];
  solution: number[][];
} {
  const fullBoard: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(fullBoard);

  const solution = fullBoard.map((row) => [...row]);
  const puzzle = fullBoard.map((row) => [...row]);

  let cluesToKeep = 40;
  if (difficulty === 'easy') cluesToKeep = 42;
  else if (difficulty === 'medium') cluesToKeep = 34;
  else if (difficulty === 'hard') cluesToKeep = 28;
  else if (difficulty === 'master') cluesToKeep = 24;

  const totalToRemove = 81 - cluesToKeep;
  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push([r, c]);
    }
  }
  cells.sort(() => Math.random() - 0.5);

  for (let i = 0; i < totalToRemove; i++) {
    const [r, c] = cells[i];
    puzzle[r][c] = 0;
  }

  return { initial: puzzle, solution };
}

export function createSudokuGame(difficulty: SudokuDifficulty): SudokuState {
  const { initial, solution } = generateSudoku(difficulty);

  const grid: SudokuCell[][] = initial.map((rowArr, r) =>
    rowArr.map((val, c) => ({
      row: r,
      col: c,
      value: val,
      initialValue: val,
      notes: new Set<number>(),
      isError: false,
      isValidated: false
    }))
  );

  return {
    grid,
    solution,
    difficulty,
    selectedCell: null,
    moves: 0,
    mistakes: 0,
    maxMistakes: 5,
    isCompleted: false,
    notesMode: false,
    history: []
  };
}

export function checkSudokuCompleted(grid: SudokuCell[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}
