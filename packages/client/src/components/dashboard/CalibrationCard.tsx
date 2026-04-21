import type { ScenarioStats } from '../../lib/stats';

const CONFIDENCE_LABEL: Record<number, string> = {
  1: 'Guess',
  2: 'Unsure',
  3: 'Hunch',
  4: 'Confident',
  5: 'Certain',
};

function calibrationVerdict(brier: number): { label: string; color: string } {
  // Rough tiers for Brier on 5-bucket poker MCQ.
  if (brier <= 0.08) return { label: 'Sharp', color: '#34d399' };
  if (brier <= 0.15) return { label: 'Calibrated', color: '#6ee7b7' };
  if (brier <= 0.22) return { label: 'Developing', color: '#fbbf24' };
  return { label: 'Miscalibrated', color: '#f87171' };
}

export default function CalibrationCard({ stats }: { stats: ScenarioStats }) {
  const { calibration, brier, confidenceTotal } = stats;

  if (confidenceTotal === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-display text-amber-400 mb-2">Calibration</h3>
        <p className="text-sm text-gray-500">
          Rate your confidence on training scenarios to unlock calibration tracking. Good players
          know <em>when</em> they know — and when they don't.
        </p>
      </div>
    );
  }

  const verdict = brier != null ? calibrationVerdict(brier) : null;

  return (
    <div className="bg-gray-900 rounded-xl border border-amber-500/40 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-display text-amber-400">Calibration</h3>
        <span className="text-xs text-gray-500" style={{ fontFamily: "'DM Mono', monospace" }}>
          {confidenceTotal} rated
        </span>
      </div>

      {brier != null && verdict && (
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-3xl font-mono font-bold" style={{ color: verdict.color }}>
            {verdict.label}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            Brier {brier.toFixed(3)} · lower = better
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {calibration.map((bucket) => {
          if (bucket.total === 0) return null;
          const actualPct = Math.round(bucket.accuracy * 100);
          const expectedPct = Math.round(bucket.expectedAccuracy * 100);
          const gap = bucket.accuracy - bucket.expectedAccuracy;
          const tone =
            Math.abs(gap) < 0.12 ? '#6ee7b7' : gap < 0 ? '#f87171' : '#fbbf24';
          return (
            <div key={bucket.confidence}>
              <div
                className="flex items-center justify-between text-xs mb-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span className="text-gray-400">
                  {bucket.confidence}/5 · {CONFIDENCE_LABEL[bucket.confidence]}
                </span>
                <span className="text-gray-500 font-mono">
                  actual {actualPct}% · expected {expectedPct}% · n={bucket.total}
                </span>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                {/* Expected-accuracy marker */}
                <div
                  className="absolute top-0 h-full border-l-2 border-amber-300/60"
                  style={{ left: `${expectedPct}%` }}
                />
                {/* Actual-accuracy bar */}
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${actualPct}%`,
                    background: tone,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-600 mt-4 leading-relaxed">
        Amber line = confidence you stated. Bar = actual accuracy. When "Certain" you should be
        right ~95% of the time. When "Guess" you should be right ~25%. Gaps reveal over- or
        under-confidence.
      </p>
    </div>
  );
}
