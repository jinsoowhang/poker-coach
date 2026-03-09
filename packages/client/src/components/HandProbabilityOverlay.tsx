import { countOuts, totalUniqueOuts } from '@poker-coach/engine';
import type { Card, OutInfo } from '@poker-coach/engine';

interface HandProbabilityOverlayProps {
  holeCards: [Card, Card] | null;
  communityCards: Card[];
}

export function HandProbabilityOverlay({ holeCards, communityCards }: HandProbabilityOverlayProps) {
  if (!holeCards || communityCards.length < 3) {
    return (
      <div className="text-sm" style={{ color: '#6b7280' }}>
        Outs available after the flop
      </div>
    );
  }

  const outs = countOuts(holeCards, communityCards);
  const uniqueTotal = totalUniqueOuts(outs);

  if (outs.length === 0) {
    return (
      <div className="text-sm" style={{ color: '#6b7280' }}>
        No obvious draws detected
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {outs.map((out) => (
          <OutBadge key={out.drawType} out={out} />
        ))}
      </div>
      {uniqueTotal > 0 && (
        <div className="text-xs" style={{ color: '#6b7280' }}>
          Total unique outs: <span className="font-bold" style={{ color: '#d1d5db' }}>{uniqueTotal}</span>
        </div>
      )}
    </div>
  );
}

function OutBadge({ out }: { out: OutInfo }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    'Flush draw': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    'Open-ended straight draw': { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
    'Gutshot straight draw': { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
    'Overcard pair': { bg: 'rgba(234,179,8,0.12)', text: '#facc15', border: 'rgba(234,179,8,0.25)' },
    'Set (trips)': { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  };

  const colors = colorMap[out.drawType] ?? { bg: 'rgba(255,255,255,0.05)', text: '#d1d5db', border: 'rgba(255,255,255,0.1)' };

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span>{out.drawType}:</span>
      <span className="font-bold tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
        {out.outs} outs
      </span>
      <span className="tabular-nums" style={{ color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>
        ({out.probability}%)
      </span>
    </div>
  );
}
