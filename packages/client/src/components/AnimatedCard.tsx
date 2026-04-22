import { useState, useEffect } from 'react';
import type { Card } from '@poker-coach/engine';
import { CardComponent } from './CardComponent';

interface AnimatedCardProps {
  card: Card | null;
  faceUp: boolean;
  winner?: boolean;
  dealDelay?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Wrapper around CardComponent that adds deal, flip, and winner animations.
 * - Starts off-screen (at a "deck" position) and slides into place.
 * - Flips from face-down to face-up when `faceUp` transitions to true.
 * - Pulses a gold glow when `winner` is true.
 *
 * NOTE: we intentionally re-run the deal animation whenever `card` changes
 * reference. A ref-based guard would skip the re-deal under StrictMode's
 * double-fire (cleanup cancels the timer, second run sees the ref already
 * matches) — which left cards stuck at opacity 0 in Training mode.
 */
export function AnimatedCard({
  card,
  faceUp,
  winner = false,
  dealDelay = 0,
  size = 'sm',
}: AnimatedCardProps) {
  const [dealt, setDealt] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Deal animation: reset on every card/dealDelay change, then schedule.
  useEffect(() => {
    setDealt(false);
    setFlipped(false);
    if (!card) return;

    const dealTimer = setTimeout(() => {
      setDealt(true);
    }, dealDelay);

    return () => clearTimeout(dealTimer);
  }, [card, dealDelay]);

  // Flip animation: after card has arrived (dealt), flip if faceUp requested
  useEffect(() => {
    if (!dealt) return;
    if (!faceUp) {
      setFlipped(false);
      return;
    }

    // Slight delay after deal to start the flip
    const flipTimer = setTimeout(() => {
      setFlipped(true);
    }, 150);

    return () => clearTimeout(flipTimer);
  }, [dealt, faceUp]);

  if (!card) {
    const emptyClass =
      size === 'sm'
        ? 'w-8 h-11 sm:w-10 sm:h-14'
        : size === 'md'
          ? 'w-10 h-14 sm:w-14 sm:h-20'
          : 'w-14 h-20 sm:w-20 sm:h-28';
    return <div className={emptyClass} />;
  }

  return (
    <div
      className={`card-deal ${dealt ? 'card-deal-end' : 'card-deal-start'} ${winner ? 'winner-card' : ''}`}
      style={{ perspective: '600px' }}
    >
      <div
        className={`card-flip ${flipped ? 'card-face-up' : 'card-face-down'}`}
      >
        {/* Face side (front) */}
        <div className="card-front">
          <CardComponent card={card} faceDown={false} size={size} />
        </div>
        {/* Back side */}
        <div className="card-back">
          <CardComponent card={null} faceDown={true} size={size} />
        </div>
      </div>
    </div>
  );
}
