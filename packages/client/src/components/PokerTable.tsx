import { useState, useEffect, useRef } from 'react';
import type { Player, Card } from '@poker-coach/engine';
import { PlayerSeat } from './PlayerSeat';
import { AnimatedCard } from './AnimatedCard';
import { DeckPosition } from './DeckPosition';
import { useGameStore } from '../stores/useGameStore';

interface PokerTableProps {
  players: Player[];
  communityCards: Card[];
  pot: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  showdown: boolean;
  isHandOver: boolean;
}

/**
 * Seat positions around an oval table.
 * Index 0 = bottom center (human), then clockwise.
 */
const SEAT_POSITIONS: Record<number, string[]> = {
  2: [
    'bottom-2 left-1/2 -translate-x-1/2',         // 0: bottom center
    'top-2 left-1/2 -translate-x-1/2',             // 1: top center
  ],
  3: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'top-6 left-8',
    'top-6 right-8',
  ],
  4: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'top-1/2 -translate-y-1/2 left-4',
    'top-2 left-1/2 -translate-x-1/2',
    'top-1/2 -translate-y-1/2 right-4',
  ],
  5: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-16 left-6',
    'top-6 left-16',
    'top-6 right-16',
    'bottom-16 right-6',
  ],
  6: [
    'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-12 left-4',
    'top-8 left-8',
    'top-2 left-1/2 -translate-x-1/2',
    'top-8 right-8',
    'bottom-12 right-4',
  ],
};

/** Chip animation element sliding from player to pot */
interface ChipAnim {
  id: number;
  active: boolean;
}

export function PokerTable({
  players,
  communityCards,
  pot,
  dealerIndex,
  currentPlayerIndex,
  showdown,
  isHandOver,
}: PokerTableProps) {
  const positions = SEAT_POSITIONS[players.length] ?? SEAT_POSITIONS[4];
  const winners = useGameStore(s => s.winners);
  const winnerIds = new Set(winners.map(w => w.playerId));

  // Track previous pot to detect bet events
  const prevPotRef = useRef(pot);
  const [chipAnims, setChipAnims] = useState<ChipAnim[]>([]);
  const animIdRef = useRef(0);

  // Chip slide animation when pot increases
  useEffect(() => {
    if (pot > prevPotRef.current && prevPotRef.current >= 0) {
      const id = ++animIdRef.current;
      setChipAnims(prev => [...prev, { id, active: false }]);

      // Trigger the transition on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setChipAnims(prev =>
            prev.map(a => (a.id === id ? { ...a, active: true } : a)),
          );
        });
      });

      // Clean up after animation
      setTimeout(() => {
        setChipAnims(prev => prev.filter(a => a.id !== id));
      }, 600);
    }
    prevPotRef.current = pot;
  }, [pot]);

  /**
   * Compute community card deal delays:
   * - Flop (indices 0-2): stagger 0, 150, 300ms
   * - Turn (index 3): 0ms
   * - River (index 4): 0ms
   */
  function getCommunityDealDelay(index: number, total: number): number {
    // If showing flop (3 cards appear at once)
    if (total <= 3) return index * 150;
    // Turn or river — the latest card is the new one
    if (index === total - 1 && total > 3) return 0;
    // Already-dealt cards: no delay
    return 0;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/10' }}>
      {/* Table surface */}
      <div
        className="absolute inset-8 rounded-[50%] overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 40% 40%, #166534 0%, #14532d 40%, #052e16 100%)',
          border: '8px solid #5a3825',
          boxShadow: `
            0 0 0 4px #3d2517,
            0 0 0 8px rgba(0,0,0,0.3),
            inset 0 2px 30px rgba(0,0,0,0.3),
            0 8px 40px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Felt texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='%23fff'/%3E%3C/svg%3E")`,
            backgroundSize: '4px 4px',
          }}
        />

        {/* Deck position — top-right area */}
        <div className="absolute top-6 right-12">
          <DeckPosition />
        </div>

        {/* Center area: community cards + pot */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {/* Pot */}
          {pot > 0 && (
            <div
              className="px-4 py-1 rounded-full text-sm font-bold tabular-nums relative"
              style={{
                background: 'rgba(0,0,0,0.35)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                fontFamily: "'DM Mono', monospace",
                backdropFilter: 'blur(4px)',
              }}
            >
              Pot: ${pot.toLocaleString()}

              {/* Chip slide animations */}
              {chipAnims.map(anim => (
                <span
                  key={anim.id}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg chip-to-pot"
                  style={{
                    opacity: anim.active ? 0 : 1,
                    transform: anim.active
                      ? 'translate(-50%, 8px) scale(0.5)'
                      : 'translate(-50%, -16px) scale(1)',
                    transition: 'transform 0.4s ease-in, opacity 0.3s ease 0.2s',
                  }}
                >
                  ●
                </span>
              ))}
            </div>
          )}

          {/* Community cards */}
          <div className="flex gap-1.5">
            {communityCards.map((card, i) => (
              <AnimatedCard
                key={`${card.rank}-${card.suit}`}
                card={card}
                faceUp={true}
                dealDelay={getCommunityDealDelay(i, communityCards.length)}
                size="md"
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-14 h-20 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player seats */}
      {players.map((player, i) => (
        <div key={player.id} className={`absolute ${positions[i] ?? ''}`}>
          <PlayerSeat
            player={player}
            isDealer={i === dealerIndex}
            isCurrentTurn={i === currentPlayerIndex && !player.folded && !player.allIn}
            isHuman={player.isHuman}
            showCards={showdown || isHandOver}
            seatIndex={i}
            isWinner={winnerIds.has(player.id)}
          />
        </div>
      ))}
    </div>
  );
}
