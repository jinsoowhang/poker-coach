import { useState, useEffect, useRef } from 'react';
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
  const prevCardRef = useRef<Card | null>(null);

  // Deal animation: after dealDelay, transition from deck position to final position
  useEffect(() => {
    if (!card) {
      setDealt(false);
      setFlipped(false);
      prevCardRef.current = null;
      return;
    }

    // New card detected — reset and re-deal
    if (card !== prevCardRef.current) {
      setDealt(false);
      setFlipped(false);
      prevCardRef.current = card;

      const dealTimer = setTimeout(() => {
        setDealt(true);
      }, dealDelay);

      return () => clearTimeout(dealTimer);
    }
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
    return <div className={size === 'sm' ? 'w-10 h-14' : size === 'md' ? 'w-14 h-20' : 'w-20 h-28'} />;
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
