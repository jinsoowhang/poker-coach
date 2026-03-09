import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  initialize: () => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playerId: null,
  displayName: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    const storedId = localStorage.getItem('poker-coach-player-id');
    const storedName = localStorage.getItem('poker-coach-display-name');

    if (storedId && storedName) {
      set({ playerId: storedId, displayName: storedName, initialized: true });
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
        return;
      }
    }

    // Fallback: local UUID if Supabase unavailable
    const localId = crypto.randomUUID();
    localStorage.setItem('poker-coach-player-id', localId);
    localStorage.setItem('poker-coach-display-name', displayName);
    set({ playerId: localId, displayName, initialized: true });
  },
}));
