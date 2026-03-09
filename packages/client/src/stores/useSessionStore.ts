import { create } from 'zustand';
import { createSession, endSession } from '../lib/persistence';

interface SessionStore {
  sessionId: string | null;
  handsPlayed: number;
  startSession: (playerId: string, chipsStart: number) => Promise<void>;
  endSession: (chipsEnd: number) => Promise<void>;
  incrementHands: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  handsPlayed: 0,

  startSession: async (playerId, chipsStart) => {
    const id = await createSession(playerId, chipsStart);
    set({ sessionId: id, handsPlayed: 0 });
  },

  endSession: async (chipsEnd) => {
    const { sessionId, handsPlayed } = get();
    if (sessionId) {
      await endSession(sessionId, handsPlayed, chipsEnd);
    }
    set({ sessionId: null, handsPlayed: 0 });
  },

  incrementHands: () => set(s => ({ handsPlayed: s.handsPlayed + 1 })),
}));
