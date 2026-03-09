/**
 * Visual stack of card backs representing the deck.
 * Positioned in the dealer area (top-right of table center).
 */
export function DeckPosition() {
  const cardBackStyle = {
    background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a365d 100%)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  return (
    <div className="relative w-10 h-14">
      {/* Stacked card backs (3 layers) */}
      {[2, 1, 0].map((offset) => (
        <div
          key={offset}
          className="absolute w-10 h-14 rounded-lg"
          style={{
            ...cardBackStyle,
            top: -offset * 1.5,
            left: offset * 0.5,
          }}
        >
          {offset === 0 && (
            <>
              <div
                className="absolute inset-1 rounded opacity-30"
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
            </>
          )}
        </div>
      ))}
    </div>
  );
}
