import { create } from 'zustand';
import { fetchLeaderboard, fetchPlayerHands, fetchSkillHistory, fetchChipHistory } from '../lib/stats';
import type { PlayerStats, HandRecord, SkillSnapshot } from '../lib/stats';

interface StatsStore {
  leaderboard: PlayerStats[];
  recentHands: HandRecord[];
  skillHistory: SkillSnapshot[];
  chipHistory: { hand_number: number; chips: number }[];
  loading: boolean;
  loadLeaderboard: () => Promise<void>;
  loadDashboard: (playerId: string) => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  leaderboard: [],
  recentHands: [],
  skillHistory: [],
  chipHistory: [],
  loading: false,

  loadLeaderboard: async () => {
    set({ loading: true });
    const leaderboard = await fetchLeaderboard();
    set({ leaderboard, loading: false });
  },

  loadDashboard: async (playerId: string) => {
    set({ loading: true });
    const [recentHands, skillHistory, chipHistory] = await Promise.all([
      fetchPlayerHands(playerId),
      fetchSkillHistory(playerId),
      fetchChipHistory(playerId),
    ]);
    set({ recentHands, skillHistory, chipHistory, loading: false });
  },
}));
