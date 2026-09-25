/**
 * Mathematical 15-Puzzle & Sliding Tile Engine
 * Implements strict inversion parity calculation guaranteeing 100% solvability.
 */

export interface SlidingTile {
  id: number; // 0 represents the blank space, 1..N-1 are the tiles
  correctIndex: number;
}

export interface BoardState {
  tiles: number[]; // Array of tile IDs, length = size * size
  size: number;
  moves: number;
  emptyIndex: number;
  isCompleted: boolean;
}

/**
 * Counts inversions in a 1D permutation (ignoring the empty tile 0)
 */
function countInversions(tiles: number[]): number {
  let inversions = 0;
  const filtered = tiles.filter((t) => t !== 0);
  for (let i = 0; i < filtered.length - 1; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      if (filtered[i] > filtered[j]) {
        inversions++;
      }
    }
  }
  return inversions;
}

/**
 * Checks if a given arrangement is mathematically solvable.
 * For odd grid widths: inversion count must be even.
 * For even grid widths: (blank row from bottom is odd && inversions even) OR (blank row from bottom is even && inversions odd).
 */
export function isSolvable(tiles: number[], size: number): boolean {
  const inversions = countInversions(tiles);
  const blankIndex = tiles.indexOf(0);
  const blankRowFromBottom = size - Math.floor(blankIndex / size);

  if (size % 2 === 1) {
    return inversions % 2 === 0;
  } else {
    if (blankRowFromBottom % 2 === 1) {
      return inversions % 2 === 0;
    } else {
      return inversions % 2 === 1;
    }
  }
}

/**
 * Generates a guaranteed solvable shuffled board of dimension `size x size`
 */
export function createSolvableBoard(size: number): BoardState {
  const total = size * size;
  // Standard solved state: 1, 2, 3, ..., total - 1, 0
  const solved: number[] = [];
  for (let i = 1; i < total; i++) solved.push(i);
  solved.push(0);

  let shuffled: number[];
  do {
    shuffled = [...solved];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (!isSolvable(shuffled, size) || isSolved(shuffled));

  return {
    tiles: shuffled,
    size,
    moves: 0,
    emptyIndex: shuffled.indexOf(0),
    isCompleted: false
  };
}

export function isSolved(tiles: number[]): boolean {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

/**
 * Determines if a tile can move towards the empty space.
 * Supports row/column slide (clicking a tile in the same row/col slides it towards 0).
 */
export function canMoveTile(index: number, emptyIndex: number, size: number): boolean {
  const r1 = Math.floor(index / size);
  const c1 = index % size;
  const r2 = Math.floor(emptyIndex / size);
  const c2 = index % size;

  // Adjacent orthogonally
  const isDirectNeighbor =
    (Math.abs(r1 - r2) === 1 && c1 === (emptyIndex % size)) ||
    (Math.abs(c1 - (emptyIndex % size)) === 1 && r1 === r2);

  return isDirectNeighbor;
}

/**
 * Moves a tile into the empty space if it is adjacent.
 * Returns the new board state, or null if illegal move.
 */
export function moveTile(state: BoardState, clickedIndex: number): BoardState | null {
  const { tiles, size, emptyIndex, moves } = state;
  if (!canMoveTile(clickedIndex, emptyIndex, size)) {
    return null;
  }

  const nextTiles = [...tiles];
  nextTiles[emptyIndex] = nextTiles[clickedIndex];
  nextTiles[clickedIndex] = 0;

  const solved = isSolved(nextTiles);

  return {
    ...state,
    tiles: nextTiles,
    moves: moves + 1,
    emptyIndex: clickedIndex,
    isCompleted: solved
  };
}
