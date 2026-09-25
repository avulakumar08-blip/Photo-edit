/**
 * Polyomino Tangram Grid Puzzle Engine
 * Fit colored polyomino blocks into target grid formations.
 */

export interface BlockPiece {
  id: string;
  name: string;
  color: string;
  shape: number[][]; // 2D array of 0s and 1s
  placedRow?: number;
  placedCol?: number;
  isPlaced: boolean;
}

export interface BlockLevel {
  id: number;
  name: string;
  rows: number;
  cols: number;
  targetCellsCount: number;
  blockedCells: [number, number][]; // cells that are walls
  pieces: BlockPiece[];
}

export const BLOCK_LEVELS: BlockLevel[] = [
  {
    id: 1,
    name: 'Level 1: The Gateway',
    rows: 4,
    cols: 4,
    targetCellsCount: 16,
    blockedCells: [],
    pieces: [
      {
        id: 'p1',
        name: 'O-Block',
        color: '#6366F1',
        shape: [
          [1, 1],
          [1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'p2',
        name: 'I-Block',
        color: '#06B6D4',
        shape: [[1], [1], [1], [1]],
        isPlaced: false
      },
      {
        id: 'p3',
        name: 'L-Block',
        color: '#F59E0B',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'p4',
        name: 'T-Block',
        color: '#EC4899',
        shape: [
          [1, 1, 1],
          [0, 1, 0]
        ],
        isPlaced: false
      }
    ]
  },
  {
    id: 2,
    name: 'Level 2: The Monolith',
    rows: 5,
    cols: 5,
    targetCellsCount: 21,
    blockedCells: [
      [0, 0],
      [0, 4],
      [4, 0],
      [4, 4]
    ],
    pieces: [
      {
        id: 'l2_p1',
        name: 'Cross',
        color: '#10B981',
        shape: [
          [0, 1, 0],
          [1, 1, 1],
          [0, 1, 0]
        ],
        isPlaced: false
      },
      {
        id: 'l2_p2',
        name: 'T-Tromino',
        color: '#8B5CF6',
        shape: [
          [1, 1, 1],
          [0, 1, 0]
        ],
        isPlaced: false
      },
      {
        id: 'l2_p3',
        name: 'Z-Tetromino',
        color: '#F43F5E',
        shape: [
          [1, 1, 0],
          [0, 1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'l2_p4',
        name: 'Square',
        color: '#3B82F6',
        shape: [
          [1, 1],
          [1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'l2_p5',
        name: 'Corner-L',
        color: '#F59E0B',
        shape: [
          [1, 0],
          [1, 1]
        ],
        isPlaced: false
      }
    ]
  },
  {
    id: 3,
    name: 'Level 3: The Citadel',
    rows: 6,
    cols: 6,
    targetCellsCount: 32,
    blockedCells: [
      [2, 2],
      [2, 3],
      [3, 2],
      [3, 3]
    ],
    pieces: [
      {
        id: 'l3_p1',
        name: 'L-Long',
        color: '#6366F1',
        shape: [
          [1, 0],
          [1, 0],
          [1, 0],
          [1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'l3_p2',
        name: 'P-Pentomino',
        color: '#06B6D4',
        shape: [
          [1, 1],
          [1, 1],
          [1, 0]
        ],
        isPlaced: false
      },
      {
        id: 'l3_p3',
        name: 'W-Pentomino',
        color: '#EC4899',
        shape: [
          [1, 0, 0],
          [1, 1, 0],
          [0, 1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'l3_p4',
        name: 'U-Pentomino',
        color: '#10B981',
        shape: [
          [1, 0, 1],
          [1, 1, 1]
        ],
        isPlaced: false
      },
      {
        id: 'l3_p5',
        name: 'F-Pentomino',
        color: '#F59E0B',
        shape: [
          [0, 1, 1],
          [1, 1, 0],
          [0, 1, 0]
        ],
        isPlaced: false
      },
      {
        id: 'l3_p6',
        name: 'Tetris-I',
        color: '#8B5CF6',
        shape: [[1], [1], [1], [1]],
        isPlaced: false
      }
    ]
  }
];

export function rotateMatrixClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

/**
 * Validates if placing a piece at (row, col) is valid inside grid boundaries
 * without colliding with blocked cells or already placed pieces.
 */
export function canPlacePiece(
  grid: (string | null)[][],
  piece: BlockPiece,
  startRow: number,
  startCol: number,
  blockedMap: Set<string>
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const shape = piece.shape;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        const targetR = startRow + r;
        const targetC = startCol + c;

        // Out of bounds
        if (targetR < 0 || targetR >= rows || targetC < 0 || targetC >= cols) {
          return false;
        }

        // Blocked / obstacle cell
        if (blockedMap.has(`${targetR},${targetC}`)) {
          return false;
        }

        // Overlapping another piece
        if (grid[targetR][targetC] !== null && grid[targetR][targetC] !== piece.id) {
          return false;
        }
      }
    }
  }

  return true;
}
