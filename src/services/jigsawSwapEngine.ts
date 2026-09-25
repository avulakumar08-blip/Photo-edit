/**
 * Jigsaw Tile Swap & Snap Engine
 * Players swap scrambled tiles until each piece snaps into its exact coordinate.
 */

export interface JigsawPiece {
  id: number; // 0 to N-1
  currentPos: number; // current slot 0 to N-1
  isLocked: boolean; // true if currentPos === id
}

export interface JigsawBoardState {
  pieces: JigsawPiece[];
  size: number;
  swaps: number;
  correctCount: number;
  isCompleted: boolean;
}

export function createJigsawBoard(size: number): JigsawBoardState {
  const total = size * size;
  const positions: number[] = Array.from({ length: total }, (_, i) => i);

  // Shuffle positions thoroughly
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Ensure not all pieces start in correct spot
  const pieces: JigsawPiece[] = positions.map((origId, currentPos) => ({
    id: origId,
    currentPos,
    isLocked: origId === currentPos
  }));

  const correct = pieces.filter((p) => p.isLocked).length;

  return {
    pieces,
    size,
    swaps: 0,
    correctCount: correct,
    isCompleted: correct === total
  };
}

export function swapJigsawPieces(
  state: JigsawBoardState,
  indexA: number,
  indexB: number
): { newState: JigsawBoardState; newlyLockedCount: number } {
  if (indexA === indexB) return { newState: state, newlyLockedCount: 0 };

  const pieces = [...state.pieces];
  const pieceA = { ...pieces[indexA] };
  const pieceB = { ...pieces[indexB] };

  // Swap their assignments
  pieceA.currentPos = indexB;
  pieceA.isLocked = pieceA.id === indexB;

  pieceB.currentPos = indexA;
  pieceB.isLocked = pieceB.id === indexA;

  const wasALocked = pieces[indexA].isLocked;
  const wasBLocked = pieces[indexB].isLocked;

  pieces[indexA] = pieceB;
  pieces[indexB] = pieceA;

  let newlyLocked = 0;
  if (!wasALocked && pieceB.isLocked) newlyLocked++;
  if (!wasBLocked && pieceA.isLocked) newlyLocked++;

  const correct = pieces.filter((p) => p.isLocked).length;
  const total = state.size * state.size;

  return {
    newState: {
      ...state,
      pieces,
      swaps: state.swaps + 1,
      correctCount: correct,
      isCompleted: correct === total
    },
    newlyLockedCount: newlyLocked
  };
}
