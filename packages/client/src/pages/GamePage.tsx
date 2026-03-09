import { useGameStore } from '../stores/useGameStore';
import { PokerTable } from '../components/PokerTable';
import { BettingControls } from '../components/BettingControls';

export function GamePage() {
  const {
    players,
    communityCards,
    pot,
    dealerIndex,
    currentPlayerIndex,
    handNumber,
    isRunning,
    isHandOver,
    showdown,
    lastHandSummary,
    startGame,
    playNextHand,
  } = useGameStore();

  if (!isRunning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8">
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Poker Coach
        </h1>
        <p className="text-gray-400 text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Texas Hold'em trainer with real-time coaching
        </p>
        <button
          onClick={startGame}
          className="px-8 py-3 rounded-xl text-lg font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ecfdf5',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 20px rgba(6, 95, 70, 0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Start Game
        </button>
      </div>
    );
  }

  const humanPlayer = players.find(p => p.isHuman);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#fbbf24',
            }}
          >
            Poker Coach
          </h1>
          <span className="text-xs text-gray-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            Hand #{handNumber}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
          <span style={{ color: '#a7f3d0' }}>
            Chips: ${humanPlayer?.chips.toLocaleString() ?? 0}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex items-center justify-center px-4">
        <PokerTable
          players={players}
          communityCards={communityCards}
          pot={pot}
          dealerIndex={dealerIndex}
          currentPlayerIndex={currentPlayerIndex}
          showdown={showdown}
        />
      </div>

      {/* Controls */}
      <div
        className="px-6 py-2"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {isHandOver ? (
          <div className="flex flex-col items-center gap-3 py-3">
            {/* Hand result */}
            {lastHandSummary && (
              <div className="text-center">
                {lastHandSummary.winners.map((w, i) => (
                  <div key={i} className="text-sm" style={{ color: '#fbbf24', fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="font-bold">{players.find(p => p.id === w.playerId)?.name ?? w.playerId}</span>
                    {' wins $'}{w.amount} — {w.handName}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={playNextHand}
              className="px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                color: '#ecfdf5',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 2px 8px rgba(6, 95, 70, 0.4)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Next Hand
            </button>
          </div>
        ) : (
          <BettingControls />
        )}
      </div>
    </div>
  );
}
