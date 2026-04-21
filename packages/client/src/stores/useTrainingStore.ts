import { create } from 'zustand';
import type { ScenarioCategory } from '../data/scenarios';

export interface SessionAttempt {
  scenarioId: string;
  category: ScenarioCategory;
  chosenIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  confidence: number;
  submittedAt: number;
}

interface TrainingStore {
  /** Index within the selected category list (0-based) */
  positionInCategory: number;
  /** Staged but not yet submitted — used for the two-step confirm UX. */
  pendingChoice: number | null;
  /** Confidence 1–5 (default 3) recorded BEFORE the answer is revealed. */
  pendingConfidence: number;
  /** Result for the current scenario, null if not yet answered */
  currentAttempt: { chosenIndex: number; isCorrect: boolean; confidence: number } | null;
  /** Every attempt made this session, across categories */
  sessionHistory: SessionAttempt[];

  stageChoice: (index: number) => void;
  setConfidence: (confidence: number) => void;
  submitAttempt: (scenarioId: string, category: ScenarioCategory, correctIndex: number) => void;
  clearCurrent: () => void;
  advance: () => void;
  resetPosition: () => void;
  sessionAccuracy: () => { total: number; correct: number };
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  positionInCategory: 0,
  pendingChoice: null,
  pendingConfidence: 3,
  currentAttempt: null,
  sessionHistory: [],

  stageChoice: (index) => set({ pendingChoice: index }),
  setConfidence: (confidence) => set({ pendingConfidence: confidence }),

  submitAttempt: (scenarioId, category, correctIndex) => {
    const { pendingChoice, pendingConfidence } = get();
    if (pendingChoice === null) return;
    const isCorrect = pendingChoice === correctIndex;
    const attempt: SessionAttempt = {
      scenarioId,
      category,
      chosenIndex: pendingChoice,
      correctIndex,
      isCorrect,
      confidence: pendingConfidence,
      submittedAt: Date.now(),
    };
    set((state) => ({
      currentAttempt: { chosenIndex: pendingChoice, isCorrect, confidence: pendingConfidence },
      sessionHistory: [...state.sessionHistory, attempt],
    }));
  },

  clearCurrent: () =>
    set({ currentAttempt: null, pendingChoice: null, pendingConfidence: 3 }),

  advance: () =>
    set((state) => ({
      positionInCategory: state.positionInCategory + 1,
      currentAttempt: null,
      pendingChoice: null,
      pendingConfidence: 3,
    })),

  resetPosition: () =>
    set({ positionInCategory: 0, currentAttempt: null, pendingChoice: null, pendingConfidence: 3 }),

  sessionAccuracy: () => {
    const h = get().sessionHistory;
    return {
      total: h.length,
      correct: h.filter((a) => a.isCorrect).length,
    };
  },
}));
