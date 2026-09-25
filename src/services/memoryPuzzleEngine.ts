/**
 * Memory Match & Card Matrix Puzzle Engine
 */

export interface MemoryCard {
  id: number;
  pairId: number;
  iconName: string;
  label: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedIndices: number[];
  moves: number;
  matches: number;
  totalPairs: number;
  streak: number;
  bestStreak: number;
  isCompleted: boolean;
}

export const MEMORY_ICONS = [
  { icon: 'Sparkles', label: 'Stardust', color: '#EC4899' },
  { icon: 'Zap', label: 'Lightning', color: '#EAB308' },
  { icon: 'Flame', label: 'Inferno', color: '#F97316' },
  { icon: 'Compass', label: 'Voyager', color: '#06B6D4' },
  { icon: 'Globe', label: 'Terra', color: '#3B82F6' },
  { icon: 'Key', label: 'Cipher', color: '#A855F7' },
  { icon: 'Shield', label: 'Aegis', color: '#10B981' },
  { icon: 'Heart', label: 'Vitality', color: '#EF4444' },
  { icon: 'Crown', label: 'Sovereign', color: '#F59E0B' },
  { icon: 'Moon', label: 'Eclipse', color: '#818CF8' },
  { icon: 'Anchor', label: 'Harbor', color: '#14B8A6' },
  { icon: 'Sun', label: 'Solstice', color: '#FBBF24' },
  { icon: 'Feather', label: 'Zephyr', color: '#60A5FA' },
  { icon: 'Award', label: 'Trophy', color: '#84CC16' },
  { icon: 'Gem', label: 'Crystal', color: '#D946EF' },
  { icon: 'Compass', label: 'Zenith', color: '#2DD4BF' },
  { icon: 'Bell', label: 'Chime', color: '#F43F5E' },
  { icon: 'Eye', label: 'Oracle', color: '#6366F1' }
];

export function createMemoryGame(pairsCount: number = 8): MemoryGameState {
  const selectedIcons = [...MEMORY_ICONS].sort(() => Math.random() - 0.5).slice(0, pairsCount);

  const cards: MemoryCard[] = [];
  let cardId = 0;

  selectedIcons.forEach((item, pairIdx) => {
    // 2 cards per pair
    for (let c = 0; c < 2; c++) {
      cards.push({
        id: cardId++,
        pairId: pairIdx,
        iconName: item.icon,
        label: item.label,
        color: item.color,
        isFlipped: false,
        isMatched: false
      });
    }
  });

  // Shuffle cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return {
    cards,
    flippedIndices: [],
    moves: 0,
    matches: 0,
    totalPairs: pairsCount,
    streak: 0,
    bestStreak: 0,
    isCompleted: false
  };
}
