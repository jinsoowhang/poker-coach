import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { todayISO } from '../lib/streak';

function generateDisplayName(): string {
  const adjectives = ['Lucky', 'Bold', 'Sharp', 'Cool', 'Sly', 'Swift', 'Keen', 'Wise'];
  const nouns = ['Ace', 'King', 'Shark', 'Fox', 'Wolf', 'Hawk', 'Tiger', 'Eagle'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

interface PlayerStore {
  playerId: string | null;
  displayName: string | null;
  initialized: boolean;

  currentStreak: number;
  longestStreak: number;
  dailyHandCompletedToday: boolean;

  initialize: () => Promise<void>;
  refreshStreak: () => Promise<void>;
  setStreak: (next: { currentStreak: number; longestStreak: number; dailyHandCompletedToday: boolean }) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playerId: null,
  displayName: null,
  initialized: false,

  currentStreak: 0,
  longestStreak: 0,
  dailyHandCompletedToday: false,

  initialize: async () => {
    if (get().initialized) return;

    const storedId = localStorage.getItem('poker-coach-player-id');
    const storedName = localStorage.getItem('poker-coach-display-name');

    if (storedId && storedName) {
      set({ playerId: storedId, displayName: storedName, initialized: true });
      await get().refreshStreak();
      return;
    }

    const displayName = generateDisplayName();

    if (supabase) {
      const { data, error } = await supabase
        .from('players')
        .insert({ display_name: displayName })
        .select('id')
        .single();

      if (data && !error) {
        localStorage.setItem('poker-coach-player-id', data.id);
        localStorage.setItem('poker-coach-display-name', displayName);
        set({ playerId: data.id, displayName, initialized: true });
        await get().refreshStreak();
        return;
      }
    }

    // Fallback: local UUID if Supabase unavailable
    const localId = crypto.randomUUID();
    localStorage.setItem('poker-coach-player-id', localId);
    localStorage.setItem('poker-coach-display-name', displayName);
    set({ playerId: localId, displayName, initialized: true });
  },

  refreshStreak: async () => {
    const { playerId } = get();
    if (!playerId || !supabase) return;

    const { data } = await supabase
      .from('players')
      .select('current_streak, longest_streak, daily_hand_completed_date')
      .eq('id', playerId)
      .maybeSingle();

    if (!data) return;

    set({
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      dailyHandCompletedToday: data.daily_hand_completed_date === todayISO(),
    });
  },

  setStreak: (next) => set(next),
}));
