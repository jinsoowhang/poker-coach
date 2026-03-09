import type { Card } from '@poker-coach/engine';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

interface CardComponentProps {
  card?: Card | null;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-lg',
};

const RANK_SIZES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

const CENTER_SUIT_SIZES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function CardComponent({ card, faceDown = false, size = 'md', className = '' }: CardComponentProps) {
  if (faceDown || !card) {
    return (
      <div className={`${SIZES[size]} rounded-lg relative select-none flex-shrink-0 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a365d 100%)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Card back pattern */}
        <div className="absolute inset-1 rounded opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.08) 3px,
              rgba(255,255,255,0.08) 4px
            )`,
          }}
        />
        <div className="absolute inset-2 rounded border border-amber-400/20" />
      </div>
    );
  }

  const suit = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  return (
    <div
      className={`${SIZES[size]} rounded-lg relative select-none flex-shrink-0 ${className}`}
      style={{
        background: 'linear-gradient(160deg, #fefef8 0%, #f5f0e8 100%)',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
      }}
    >
      {/* Top-left rank + suit */}
      <div className={`absolute top-0.5 left-1 leading-none ${color}`}>
        <div className={`${RANK_SIZES[size]} font-bold`} style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
          {card.rank}
        </div>
        <div className="text-[0.6em] -mt-0.5">{suit}</div>
      </div>

      {/* Center suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${color} ${CENTER_SUIT_SIZES[size]}`}>
        {suit}
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div className={`absolute bottom-0.5 right-1 leading-none rotate-180 ${color}`}>
        <div className={`${RANK_SIZES[size]} font-bold`} style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
          {card.rank}
        </div>
        <div className="text-[0.6em] -mt-0.5">{suit}</div>
      </div>
    </div>
  );
}
