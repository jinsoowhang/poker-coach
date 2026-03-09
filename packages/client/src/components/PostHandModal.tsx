import type { HandSummary, GameEvent, PlayerAction } from '@poker-coach/engine';

interface PostHandModalProps {
  summary: HandSummary;
  events: GameEvent[];
  onClose: () => void;
}

export function PostHandModal({ summary, events, onClose }: PostHandModalProps) {
  // Extract human player's actions from event log
  const humanActions = events
    .filter((e): e is GameEvent & { type: 'PLAYER_ACTION' } =>
      e.type === 'PLAYER_ACTION' && 'playerId' in e && (e as any).playerId === 'human',
    )
    .map(e => (e as any).action as PlayerAction);

  const humanResult = summary.playerResults.find(p => p.playerId === 'human');
  const chipDelta = humanResult ? humanResult.chipsAfter - humanResult.chipsBefore : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#fbbf24' }}
            >
              Hand #{summary.handNumber} Review
            </h2>
            <span
              className="text-lg font-bold tabular-nums"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: chipDelta >= 0 ? '#4ade80' : '#f87171',
              }}
            >
              {chipDelta >= 0 ? '+' : ''}{chipDelta}
            </span>
          </div>
        </div>

        {/* Winners */}
        <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {summary.winners.map((w, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span className="font-semibold" style={{ color: '#e5e7eb' }}>
                {w.playerId === 'human' ? 'You' : w.playerId}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: '#9ca3af' }}>{w.handName}</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: '#fbbf24', fontFamily: "'DM Mono', monospace" }}
                >
                  +${w.amount}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action timeline */}
        <div className="px-6 py-3 max-h-48 overflow-y-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
            Your Actions
          </div>
          {humanActions.length === 0 ? (
            <div className="text-sm" style={{ color: '#6b7280' }}>No actions taken</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {humanActions.map((action, i) => (
                <ActionItem key={i} action={action} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
            Summary
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>
            {generateSummary(humanActions, chipDelta, summary)}
          </p>
        </div>

        {/* Close button */}
        <div className="px-6 py-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              color: '#ecfdf5',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 2px 8px rgba(6, 95, 70, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ action, index }: { action: PlayerAction; index: number }) {
  const colorMap: Record<string, string> = {
    fold: '#f87171',
    check: '#60a5fa',
    call: '#4ade80',
    raise: '#fbbf24',
    'all-in': '#f87171',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
      >
        {index + 1}
      </span>
      <span
        className="font-semibold uppercase text-xs tracking-wide"
        style={{ color: colorMap[action.type] ?? '#d1d5db' }}
      >
        {action.type}
      </span>
      {action.amount > 0 && (
        <span className="tabular-nums" style={{ color: '#9ca3af', fontFamily: "'DM Mono', monospace" }}>
          ${action.amount}
        </span>
      )}
    </div>
  );
}

function generateSummary(actions: PlayerAction[], chipDelta: number, summary: HandSummary): string {
  if (actions.length === 0) {
    return 'You were not involved in this hand.';
  }

  const folded = actions.some(a => a.type === 'fold');
  const raised = actions.filter(a => a.type === 'raise').length;
  const called = actions.filter(a => a.type === 'call').length;
  const totalInvested = actions.reduce((s, a) => s + a.amount, 0);

  const parts: string[] = [];

  if (folded) {
    parts.push(`You folded after investing $${totalInvested}.`);
    if (chipDelta < -20) {
      parts.push('Consider folding earlier with marginal hands to save chips.');
    }
  } else if (chipDelta > 0) {
    parts.push(`You won $${chipDelta}!`);
    if (raised > 0) {
      parts.push(`Aggressive play with ${raised} raise${raised > 1 ? 's' : ''} paid off.`);
    }
  } else if (chipDelta < 0) {
    parts.push(`You lost $${Math.abs(chipDelta)}.`);
    if (called > 2) {
      parts.push('Calling multiple bets without improving can be costly — consider raising or folding.');
    }
  } else {
    parts.push('You broke even this hand.');
  }

  return parts.join(' ');
}
