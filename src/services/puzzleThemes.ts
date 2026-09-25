import cosmicNebulaImg from '../assets/images/puzzle_cosmic_nebula_1790316272439.jpg';
import enchantedForestImg from '../assets/images/puzzle_enchanted_forest_1790316290461.jpg';
import cyberpunkCityImg from '../assets/images/puzzle_cyberpunk_city_1790316305448.jpg';

export interface PuzzleArtwork {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  src: string;
  accentColor: string;
}

export const PRESET_ARTWORKS: PuzzleArtwork[] = [
  {
    id: 'cosmic_nebula',
    title: 'Cosmic Nebula',
    subtitle: 'Deep Space Celestial Aurora',
    category: 'Sci-Fi / Space',
    src: cosmicNebulaImg,
    accentColor: '#8B5CF6'
  },
  {
    id: 'enchanted_forest',
    title: 'Enchanted Forest',
    subtitle: 'Ancient Mystical Grove',
    category: 'Fantasy',
    src: enchantedForestImg,
    accentColor: '#10B981'
  },
  {
    id: 'cyberpunk_city',
    title: 'Neo-Tokyo 2099',
    subtitle: 'Rainy Cyberpunk Metropolis',
    category: 'Futuristic',
    src: cyberpunkCityImg,
    accentColor: '#06B6D4'
  }
];

export interface PlayerStats {
  gamesWon: number;
  totalMoves: number;
  bestSlidingTime: number | null; // seconds
  bestSlidingMoves: number | null;
  bestJigsawTime: number | null;
  bestBlockLevel: number;
  bestSudokuTime: number | null;
  starsEarned: number;
}

const STATS_STORAGE_KEY = 'mindforge_puzzle_stats_v1';

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    gamesWon: 0,
    totalMoves: 0,
    bestSlidingTime: null,
    bestSlidingMoves: null,
    bestJigsawTime: null,
    bestBlockLevel: 1,
    bestSudokuTime: null,
    starsEarned: 0
  };
}

export function savePlayerStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error(e);
  }
}
