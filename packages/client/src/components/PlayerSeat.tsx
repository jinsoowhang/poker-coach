import { useState, useEffect } from 'react';
import type { Player } from '@poker-coach/engine';
import { CardComponent } from './CardComponent';
import { useGameStore } from '../stores/useGameStore';

interface PlayerSeatProps {
  player: Player;
  isDealer: boolean;
  isCurrentTurn: boolean;
  isHuman: boolean;
  showCards: boolean;
}

export function PlayerSeat({ player, isDealer, isCurrentTurn, isHuman, showCards }: PlayerSeatProps) {
  const canSeeCards = isHuman || showCards;
  const thinkingPlayerId = useGameStore(s => s.thinkingPlayerId);
  const awaitingInput = useGameStore(s => s.awaitingInput);
  const isThinking = thinkingPlayerId === player.id;
  const showTimer = isHuman && awaitingInput;

  // Human turn timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!showTimer) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [showTimer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${
      player.folded ? 'opacity-40' : ''
    }`}>
      {/* Cards */}
      <div className="flex gap-1">
        {player.holeCards ? (
          <>
            <CardComponent card={canSeeCards ? player.holeCards[0] : null} faceDown={!canSeeCards} size="sm" />
            <CardComponent card={canSeeCards ? player.holeCards[1] : null} faceDown={!canSeeCards} size="sm" />
          </>
        ) : (
          <div className="w-10 h-14" /> /* empty placeholder */
        )}
      </div>

      {/* Name plate */}
      <div
        className={`relative px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
          isCurrentTurn
            ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent'
            : ''
        }`}
        style={{
          background: isHuman
            ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span>{player.name}</span>
        {isDealer && (
          <span
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#1a1a1a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            D
          </span>
        )}
      </div>

      {/* Chips */}
      <div className="text-xs tabular-nums" style={{ color: '#a7f3d0', fontFamily: "'DM Mono', monospace" }}>
        ${player.chips.toLocaleString()}
      </div>

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div
          className="px-2 py-0.5 rounded text-[10px] font-bold tabular-nums"
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          Bet ${player.currentBet}
        </div>
      )}

      {/* Status badges */}
      {player.folded && (
        <div className="text-[10px] uppercase tracking-widest" style={{ color: '#ef4444' }}>
          Fold
        </div>
      )}
      {player.allIn && (
        <div
          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider animate-pulse"
          style={{
            background: 'rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          All In
        </div>
      )}

      {/* AI thinking indicator */}
      {isThinking && (
        <div className="flex items-center gap-1 text-amber-400 text-xs">
          <span className="animate-pulse">●</span>
          <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
          <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
        </div>
      )}

      {/* Human turn timer */}
      {showTimer && (
        <div className="text-xs font-mono" style={{ color: '#4b5563' }}>
          {formatTime(elapsed)}
        </div>
      )}
    </div>
  );
}
