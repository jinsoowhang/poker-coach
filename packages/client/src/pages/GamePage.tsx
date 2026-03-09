import { useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PokerTable } from '../components/PokerTable';
import { BettingControls } from '../components/BettingControls';
import { PotOddsDisplay } from '../components/PotOddsDisplay';
import { HandProbabilityOverlay } from '../components/HandProbabilityOverlay';
import { HandStrengthGauge } from '../components/HandStrengthGauge';
import { PostHandModal } from '../components/PostHandModal';

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
    validActions,
    eventLog,
    startGame,
    playNextHand,
  } = useGameStore();

  const { showOverlay, showPostHandModal, toggleOverlay, togglePostHandModal } = useSettingsStore();
  const [modalDismissed, setModalDismissed] = useState(false);

  // Reset modal dismissed state when a new hand ends
  const handleNextHand = () => {
    setModalDismissed(false);
    playNextHand();
  };

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
  const callAction = validActions.find(a => a.type === 'call');
  const callAmount = callAction?.minAmount ?? 0;

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
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#fbbf24' }}
          >
            Poker Coach
          </h1>
          <span className="text-xs text-gray-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            Hand #{handNumber}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle buttons */}
          <button
            onClick={toggleOverlay}
            className="text-xs px-2.5 py-1 rounded transition-all cursor-pointer"
            style={{
              background: showOverlay ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              color: showOverlay ? '#4ade80' : '#6b7280',
              border: `1px solid ${showOverlay ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Coach {showOverlay ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={togglePostHandModal}
            className="text-xs px-2.5 py-1 rounded transition-all cursor-pointer"
            style={{
              background: showPostHandModal ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              color: showPostHandModal ? '#60a5fa' : '#6b7280',
              border: `1px solid ${showPostHandModal ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Review {showPostHandModal ? 'ON' : 'OFF'}
          </button>

          <span className="text-sm tabular-nums" style={{ color: '#a7f3d0', fontFamily: "'DM Mono', monospace" }}>
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

      {/* Educational overlay panel */}
      {showOverlay && !isHandOver && humanPlayer?.holeCards && (
        <div
          className="px-6 py-3 flex flex-col gap-2"
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-6 flex-wrap">
            <HandStrengthGauge
              holeCards={humanPlayer.holeCards}
              communityCards={communityCards}
            />
            <PotOddsDisplay potSize={pot} callAmount={callAmount} />
          </div>
          <HandProbabilityOverlay
            holeCards={humanPlayer.holeCards}
            communityCards={communityCards}
          />
        </div>
      )}

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
            {lastHandSummary && (
              <div className="text-center">
                {lastHandSummary.winners.map((w, i) => (
                  <div key={i} className="text-sm" style={{ color: '#fbbf24', fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="font-bold">
                      {players.find(p => p.id === w.playerId)?.name ?? w.playerId}
                    </span>
                    {' wins $'}{w.amount} — {w.handName}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleNextHand}
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

      {/* Post-hand review modal */}
      {showPostHandModal && isHandOver && lastHandSummary && !modalDismissed && (
        <PostHandModal
          summary={lastHandSummary}
          events={eventLog}
          onClose={() => setModalDismissed(true)}
        />
      )}
    </div>
  );
}
