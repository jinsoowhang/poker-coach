import { estimatePreflopStrength, estimatePostflopStrength } from '@poker-coach/engine';
import type { Card } from '@poker-coach/engine';

interface HandStrengthGaugeProps {
  holeCards: [Card, Card] | null;
  communityCards: Card[];
}

export function HandStrengthGauge({ holeCards, communityCards }: HandStrengthGaugeProps) {
  if (!holeCards) return null;

  const strength = communityCards.length >= 3
    ? estimatePostflopStrength(holeCards, communityCards)
    : estimatePreflopStrength(holeCards);

  const percentage = Math.round(strength * 100);

  // Color gradient from red (weak) through yellow to green (strong)
  const hue = strength * 120; // 0=red, 60=yellow, 120=green

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold" style={{ color: '#9ca3af' }}>
        Hand Strength:
      </span>

      {/* Gauge bar */}
      <div className="flex-1 max-w-40 relative">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: `hsl(${hue}, 75%, 50%)`,
              boxShadow: `0 0 8px hsla(${hue}, 75%, 50%, 0.4)`,
            }}
          />
        </div>
        {/* Tick marks at 25%, 50%, 75% */}
        <div className="absolute inset-0 flex justify-between px-[25%]">
          {[0.25, 0.5, 0.75].map(v => (
            <div key={v} className="w-px h-2" style={{ background: 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>

      {/* Percentage label */}
      <span
        className="text-sm font-bold tabular-nums min-w-[4ch] text-right"
        style={{
          color: `hsl(${hue}, 75%, 65%)`,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {percentage}%
      </span>

      {/* Strength label */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded"
        style={{
          background: `hsla(${hue}, 75%, 50%, 0.12)`,
          color: `hsl(${hue}, 75%, 65%)`,
          border: `1px solid hsla(${hue}, 75%, 50%, 0.2)`,
        }}
      >
        {getStrengthLabel(percentage)}
      </span>
    </div>
  );
}

function getStrengthLabel(pct: number): string {
  if (pct >= 80) return 'Monster';
  if (pct >= 65) return 'Strong';
  if (pct >= 45) return 'Decent';
  if (pct >= 25) return 'Weak';
  return 'Junk';
}
