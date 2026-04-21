import { Link } from 'react-router-dom';
import type { ScenarioStats } from '../../lib/stats';
import { CATEGORY_LABELS } from '../../data/scenarios';
import type { ScenarioCategory } from '../../data/scenarios';

const CATEGORY_ORDER: ScenarioCategory[] = ['preflop-opens', 'isolation', 'spr-commitment'];

export default function ScenarioStatsCard({ stats }: { stats: ScenarioStats }) {
  const { total, correct, accuracy, byCategory } = stats;

  if (total === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-display text-amber-400 mb-2">Training Accuracy</h3>
        <p className="text-sm text-gray-500 mb-4">
          No training scenarios attempted yet. Drill specific situations and master poker theory.
        </p>
        <Link
          to="/train"
          className="inline-block px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ecfdf5',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Start Training
        </Link>
      </div>
    );
  }

  const accuracyPct = Math.round(accuracy * 100);

  return (
    <div className="bg-gray-900 rounded-xl border border-emerald-500/40 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-display text-amber-400">Training Accuracy</h3>
        <Link to="/train" className="text-xs text-gray-500 hover:text-gray-300">
          Drill more →
        </Link>
      </div>

      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-4xl font-mono font-bold text-emerald-400">{accuracyPct}%</span>
        <span className="text-sm text-gray-500 font-mono">
          {correct}/{total} correct
        </span>
      </div>

      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => {
          const c = byCategory[cat];
          if (!c || c.total === 0) return null;
          const pct = Math.round((c.correct / c.total) * 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-gray-500 font-mono">
                  {c.correct}/{c.total} · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
