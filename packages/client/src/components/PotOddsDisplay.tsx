import { calculatePotOdds } from '@poker-coach/engine';

interface PotOddsDisplayProps {
  potSize: number;
  callAmount: number;
}

export function PotOddsDisplay({ potSize, callAmount }: PotOddsDisplayProps) {
  if (callAmount <= 0) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
        <span className="font-semibold">Pot Odds:</span>
        <span>No bet to call</span>
      </div>
    );
  }

  const odds = calculatePotOdds(potSize, callAmount);
  const isGoodPrice = odds.percentage < 30; // rough heuristic

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold" style={{ color: '#9ca3af' }}>Pot Odds:</span>
        <span className="font-bold tabular-nums" style={{ color: '#e5e7eb', fontFamily: "'DM Mono', monospace" }}>
          {odds.ratio}
        </span>
        <span className="tabular-nums" style={{ color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>
          ({odds.percentage}%)
        </span>
      </div>
      <span
        className="text-xs font-bold px-1.5 py-0.5 rounded"
        style={{
          background: isGoodPrice ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: isGoodPrice ? '#4ade80' : '#f87171',
          border: `1px solid ${isGoodPrice ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}
      >
        {isGoodPrice ? 'Good price' : 'Expensive'}
      </span>
    </div>
  );
}
