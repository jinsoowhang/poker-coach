import { create } from 'zustand';
import { fetchLeaderboard, fetchPlayerHands, fetchSkillHistory, fetchChipHistory, fetchScenarioStats } from '../lib/stats';
import type { PlayerStats, HandRecord, SkillSnapshot, ScenarioStats } from '../lib/stats';

interface StatsStore {
  leaderboard: PlayerStats[];
  recentHands: HandRecord[];
  skillHistory: SkillSnapshot[];
  chipHistory: { hand_number: number; chips: number }[];
  scenarioStats: ScenarioStats;
  loading: boolean;
  loadLeaderboard: () => Promise<void>;
  loadDashboard: (playerId: string) => Promise<void>;
}

const emptyScenarioStats: ScenarioStats = {
  total: 0,
  correct: 0,
  accuracy: 0,
  byCategory: {},
  calibration: [1, 2, 3, 4, 5].map((c) => ({
    confidence: c,
    total: 0,
    correct: 0,
    accuracy: 0,
    expectedAccuracy: c === 1 ? 0.25 : c === 2 ? 0.45 : c === 3 ? 0.6 : c === 4 ? 0.8 : 0.95,
  })),
  brier: null,
  confidenceTotal: 0,
};

export const useStatsStore = create<StatsStore>((set) => ({
  leaderboard: [],
  recentHands: [],
  skillHistory: [],
  chipHistory: [],
  scenarioStats: emptyScenarioStats,
  loading: false,

  loadLeaderboard: async () => {
    set({ loading: true });
    const leaderboard = await fetchLeaderboard();
    set({ leaderboard, loading: false });
  },

  loadDashboard: async (playerId: string) => {
    set({ loading: true });
    const [recentHands, skillHistory, chipHistory, scenarioStats] = await Promise.all([
      fetchPlayerHands(playerId),
      fetchSkillHistory(playerId),
      fetchChipHistory(playerId),
      fetchScenarioStats(playerId),
    ]);
    set({ recentHands, skillHistory, chipHistory, scenarioStats, loading: false });
  },
}));
