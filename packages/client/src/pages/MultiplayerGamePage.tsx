import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { PokerTable } from '../components/PokerTable';
import { BettingControls } from '../components/BettingControls';
import { CardComponent } from '../components/CardComponent';

export function MultiplayerGamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const localPlayerId = usePlayerStore(s => s.playerId);

  const {
    roomCode,
    roomStatus,
    isHost,
    players,
    communityCards,
    pot,
    dealerIndex,
    currentPlayerIndex,
    handNumber,
    isHandOver,
    showdown,
    winners,
    lastHandSummary,
    awaitingInput,
    validActions,
    submitAction,
    playNextHand,
    cleanup,
    hostDisconnected,
    disconnectedPlayers,
  } = useMultiplayerStore();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Route guard: redirect if not in a game
  useEffect(() => {
    if (!roomCode || roomCode !== code || roomStatus !== 'playing') {
      if (roomCode && roomStatus === 'waiting') {
        navigate(`/room/${roomCode}`);
      } else {
        navigate('/');
      }
    }
  }, [roomCode, code, roomStatus, navigate]);

  // Host disconnect detection
  useEffect(() => {
    if (hostDisconnected) {
      setShowDisconnectModal(true);
    }
  }, [hostDisconnected]);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanup();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cleanup]);

  const handleLeaveGame = () => {
    cleanup();
    navigate('/');
  };

  const localPlayer = players.find(p => p.id === localPlayerId);

  if (!roomCode || roomStatus !== 'playing') return null;

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
          <span className="text-xs px-2 py-0.5 rounded" style={{
            color: '#93c5fd',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            fontFamily: "'DM Mono', monospace",
          }}>
            Room: {roomCode}
          </span>
          <span className="text-xs text-gray-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            Hand #{handNumber}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums" style={{ color: '#a7f3d0', fontFamily: "'DM Mono', monospace" }}>
            Chips: ${localPlayer?.chips.toLocaleString() ?? 0}
          </span>
          <button
            onClick={handleLeaveGame}
            className="text-xs px-2.5 py-1 rounded transition-all cursor-pointer"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Disconnect banners */}
      {disconnectedPlayers.size > 0 && (
        <div className="px-6 py-2 text-center" style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-xs text-amber-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Disconnected: {Array.from(disconnectedPlayers).map(id => {
              const p = players.find(pl => pl.id === id);
              return p?.name ?? id;
            }).join(', ')}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 flex items-center justify-center px-4">
        <PokerTable
          players={players}
          communityCards={communityCards}
          pot={pot}
          dealerIndex={dealerIndex}
          currentPlayerIndex={currentPlayerIndex}
          showdown={showdown}
          isHandOver={isHandOver}
          winners={winners}
          thinkingPlayerId={null}
          awaitingInput={awaitingInput}
          localPlayerId={localPlayerId ?? undefined}
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
            {lastHandSummary && (
              <div className="flex flex-col gap-2 w-full max-w-lg">
                {/* Winner announcement */}
                {lastHandSummary.winners.map((w, i) => (
                  <div key={i} className="text-sm text-center" style={{ color: '#fbbf24', fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="font-bold">
                      {players.find(p => p.id === w.playerId)?.name ?? w.playerId}
                    </span>
                    {' wins $'}{w.amount} — {w.handName}
                  </div>
                ))}

                {/* All players' hands */}
                <div className="flex justify-center gap-4 flex-wrap">
                  {lastHandSummary.playerResults.map((pr) => {
                    const p = players.find(pl => pl.id === pr.playerId);
                    const isWinner = lastHandSummary.winners.some(w => w.playerId === pr.playerId);
                    const chipDiff = pr.chipsAfter - pr.chipsBefore;
                    return (
                      <div
                        key={pr.playerId}
                        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg"
                        style={{
                          background: isWinner ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: isWinner ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span className="text-[11px] font-semibold" style={{
                          color: isWinner ? '#fbbf24' : '#94a3b8',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {p?.name ?? pr.playerId}
                        </span>
                        <div className="flex gap-0.5">
                          {pr.holeCards ? (
                            <>
                              <CardComponent card={pr.holeCards[0]} size="sm" />
                              <CardComponent card={pr.holeCards[1]} size="sm" />
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">no cards</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {pr.folded && (
                            <span className="text-[9px] uppercase tracking-wider" style={{ color: '#ef4444' }}>Folded</span>
                          )}
                          <span className="text-[10px] tabular-nums font-bold" style={{
                            color: chipDiff > 0 ? '#4ade80' : chipDiff < 0 ? '#f87171' : '#6b7280',
                            fontFamily: "'DM Mono', monospace",
                          }}>
                            {chipDiff > 0 ? '+' : ''}{chipDiff}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isHost && (
              <button
                onClick={() => playNextHand()}
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
            )}

            {!isHost && (
              <div className="text-sm animate-pulse" style={{ color: '#6b7280', fontFamily: "'DM Sans', sans-serif" }}>
                Waiting for host to start next hand...
              </div>
            )}
          </div>
        ) : (
          <BettingControls
            awaitingInput={awaitingInput}
            validActions={validActions}
            onSubmitAction={submitAction}
          />
        )}
      </div>

      {/* Host disconnected modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="flex flex-col items-center gap-4 px-8 py-6 rounded-xl max-w-sm"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h2 className="text-lg font-bold" style={{ color: '#f87171', fontFamily: "'DM Sans', sans-serif" }}>
              Host Disconnected
            </h2>
            <p className="text-sm text-gray-400 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The host has left the game. The game is over.
            </p>
            <button
              onClick={handleLeaveGame}
              className="px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                color: '#ecfdf5',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
