import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SCENARIOS,
  CATEGORY_LABELS,
  CATEGORY_BLURBS,
  getScenariosByCategory,
} from '../data/scenarios';
import type { ScenarioCategory } from '../data/scenarios';
import { useTrainingStore } from '../stores/useTrainingStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { getDailyHandScenario } from '../lib/streak';
import { fetchDueScenarioIds, fetchCompletedScenarioIds } from '../lib/stats';

const CATEGORIES: ScenarioCategory[] = ['preflop-opens', 'isolation', 'spr-commitment'];

const ACCENTS: Record<ScenarioCategory, string> = {
  'preflop-opens': 'rgba(59, 130, 246, 0.35)',
  'isolation': 'rgba(245, 158, 11, 0.35)',
  'spr-commitment': 'rgba(16, 185, 129, 0.35)',
};

export function TrainingPage() {
  const navigate = useNavigate();
  const resetPosition = useTrainingStore((s) => s.resetPosition);
  const sessionHistory = useTrainingStore((s) => s.sessionHistory);
  const playerId = usePlayerStore((s) => s.playerId);
  const dailyDone = usePlayerStore((s) => s.dailyHandCompletedToday);
  const streak = usePlayerStore((s) => s.currentStreak);
  const refreshStreak = usePlayerStore((s) => s.refreshStreak);

  const [dueCount, setDueCount] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const dailyScenario = getDailyHandScenario(SCENARIOS);

  useEffect(() => {
    resetPosition();
    void refreshStreak();
  }, [resetPosition, refreshStreak]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!playerId) return;
      const [due, completed] = await Promise.all([
        fetchDueScenarioIds(playerId),
        fetchCompletedScenarioIds(playerId),
      ]);
      if (!cancelled) {
        setDueCount(due.length);
        setCompletedIds(new Set(completed));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const sessionStatsByCategory = (category: ScenarioCategory) => {
    const attempts = sessionHistory.filter((a) => a.category === category);
    const correct = attempts.filter((a) => a.isCorrect).length;
    return { total: attempts.length, correct };
  };

  const startCategory = (category: ScenarioCategory) => {
    resetPosition();
    const scenarios = getScenariosByCategory(category);
    // Resume at the first scenario the player hasn't completed yet.
    // If all scenarios in the category are completed, fall back to the first
    // (they can still cycle through for practice).
    const next = scenarios.find((s) => !completedIds.has(s.id)) ?? scenarios[0];
    if (next) navigate(`/train/${next.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Training
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-8 sm:mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Drill specific situations. Multiple-choice. Theory-backed explanations.
        </p>

        {/* Daily Hand + Review queue */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Daily Hand */}
          <button
            onClick={() => navigate('/train/daily')}
            disabled={dailyDone}
            className={`text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${
              dailyDone ? 'opacity-70 cursor-default' : 'hover:scale-[1.02] active:scale-[0.99]'
            }`}
            style={{
              background: dailyDone
                ? 'linear-gradient(135deg, rgba(6, 95, 70, 0.6) 0%, rgba(6, 95, 70, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(146, 64, 14, 0.8) 0%, rgba(180, 83, 9, 0.6) 100%)',
              borderColor: dailyDone ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.6)',
              boxShadow: dailyDone
                ? '0 4px 20px rgba(6, 95, 70, 0.4)'
                : '0 4px 20px rgba(245, 158, 11, 0.35)',
            }}
          >
            <div
              className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span>{dailyDone ? '✓ Daily Hand done' : '🔥 Daily Hand'}</span>
              {streak > 0 && (
                <span className="text-amber-200 font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                  · {streak}-day streak
                </span>
              )}
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold mb-2 text-gray-100"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {dailyDone ? 'See you tomorrow' : dailyScenario.title}
            </h2>
            <p
              className="text-sm text-gray-300 leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {dailyDone
                ? 'A new Daily Hand unlocks at UTC midnight. Come back to keep your streak alive.'
                : 'One hand per day, same for everyone. Answer it to bank your streak.'}
            </p>
          </button>

          {/* Due for Review */}
          <button
            onClick={() => navigate('/train/review')}
            disabled={!dueCount}
            className={`text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
              !dueCount ? 'opacity-50 cursor-default' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(3, 7, 18, 0.9) 100%)',
              borderColor: dueCount ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.3)',
              boxShadow: dueCount ? '0 4px 20px rgba(59, 130, 246, 0.25)' : 'none',
            }}
          >
            <div
              className="text-xs uppercase tracking-widest text-blue-400 mb-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              ↻ Spaced Review
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold mb-2 text-gray-100"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {dueCount === null
                ? 'Loading…'
                : dueCount === 0
                ? 'Nothing due'
                : `${dueCount} due today`}
            </h2>
            <p
              className="text-sm text-gray-400 leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {dueCount === 0
                ? 'Missed scenarios resurface at 1d/3d/7d/14d/30d — come back tomorrow for new reviews.'
                : 'Scenarios you got wrong or haven\'t seen recently. The Leitner box schedules them back.'}
            </p>
          </button>
        </div>

        {/* Free practice categories */}
        <div
          className="text-xs uppercase tracking-widest text-gray-500 mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Free Practice
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {CATEGORIES.map((category) => {
            const scenarios = getScenariosByCategory(category);
            const stats = sessionStatsByCategory(category);
            const accuracyPct =
              stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
            const completedInCategory = scenarios.filter((s) => completedIds.has(s.id)).length;
            return (
              <button
                key={category}
                onClick={() => startCategory(category)}
                className="text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(3, 7, 18, 0.9) 100%)',
                  borderColor: ACCENTS[category],
                  boxShadow: `0 4px 20px ${ACCENTS[category]}`,
                }}
              >
                <div
                  className="flex items-center justify-between text-xs uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <span className="text-amber-400">{scenarios.length} scenarios</span>
                  {completedInCategory > 0 && (
                    <span
                      className="text-emerald-400"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {completedInCategory}/{scenarios.length} done
                    </span>
                  )}
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold mb-3 text-gray-100"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {CATEGORY_LABELS[category]}
                </h2>
                <p
                  className="text-sm text-gray-400 leading-relaxed mb-5"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {CATEGORY_BLURBS[category]}
                </p>
                {accuracyPct !== null && (
                  <div
                    className="text-xs text-gray-500 pt-3 border-t border-gray-800"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    This session: {stats.correct}/{stats.total} · {accuracyPct}%
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p
          className="mt-10 text-xs text-gray-600 text-center"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {SCENARIOS.length} scenarios · Leitner-box spaced repetition · Daily Hand resets at UTC midnight
        </p>
      </div>
    </div>
  );
}
