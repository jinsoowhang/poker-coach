import { useState, useMemo } from 'react';
import type { ValidAction } from '@poker-coach/engine';
import { useGameStore } from '../stores/useGameStore';

export function BettingControls() {
  const { awaitingInput, validActions, submitAction } = useGameStore();
  const [raiseAmount, setRaiseAmount] = useState(0);

  const actions = useMemo(() => {
    const fold = validActions.find(a => a.type === 'fold');
    const check = validActions.find(a => a.type === 'check');
    const call = validActions.find(a => a.type === 'call');
    const raise = validActions.find(a => a.type === 'raise');
    const allIn = validActions.find(a => a.type === 'all-in');
    return { fold, check, call, raise, allIn };
  }, [validActions]);

  // Set initial raise amount when actions change
  useMemo(() => {
    if (actions.raise) {
      setRaiseAmount(actions.raise.minAmount!);
    }
  }, [actions.raise]);

  if (!awaitingInput) {
    return (
      <div className="h-20 flex items-center justify-center">
        <div className="text-sm tracking-wide animate-pulse" style={{ color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>
          Waiting for opponents...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 items-center py-3">
      <div className="flex gap-3 items-center">
        {/* Fold */}
        {actions.fold && (
          <button
            onClick={() => submitAction({ type: 'fold', amount: 0 })}
            className="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 2px 8px rgba(127, 29, 29, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Fold
          </button>
        )}

        {/* Check */}
        {actions.check && (
          <button
            onClick={() => submitAction({ type: 'check', amount: 0 })}
            className="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 2px 8px rgba(30, 58, 95, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Check
          </button>
        )}

        {/* Call */}
        {actions.call && (
          <button
            onClick={() => submitAction({ type: 'call', amount: actions.call!.minAmount! })}
            className="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              color: '#6ee7b7',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 2px 8px rgba(6, 95, 70, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Call ${actions.call.minAmount}
          </button>
        )}

        {/* Raise */}
        {actions.raise && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => submitAction({ type: 'raise', amount: raiseAmount })}
              className="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
                color: '#fde68a',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 2px 8px rgba(146, 64, 14, 0.4)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Raise ${raiseAmount}
            </button>
            <input
              type="range"
              min={actions.raise.minAmount}
              max={actions.raise.maxAmount}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="w-28 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f59e0b ${
                  ((raiseAmount - actions.raise.minAmount!) / (actions.raise.maxAmount! - actions.raise.minAmount!)) * 100
                }%, #374151 0%)`,
              }}
            />
          </div>
        )}

        {/* All-in */}
        {actions.allIn && (
          <button
            onClick={() => submitAction({ type: 'all-in', amount: actions.allIn!.minAmount! })}
            className="px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
              color: '#fff',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 2px 12px rgba(220, 38, 38, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            All In ${actions.allIn.minAmount}
          </button>
        )}
      </div>
    </div>
  );
}
