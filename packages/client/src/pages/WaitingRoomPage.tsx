import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export function WaitingRoomPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const {
    roomCode,
    isHost,
    roomStatus,
    connectedPlayers,
    hostId,
    startGame,
    cleanup,
  } = useMultiplayerStore();

  const localPlayerId = usePlayerStore(s => s.playerId);
  const [copied, setCopied] = useState(false);

  // Redirect home if no room state
  useEffect(() => {
    if (!roomCode || roomCode !== code) {
      navigate('/');
    }
  }, [roomCode, code, navigate]);

  // Navigate to game when status changes to playing
  useEffect(() => {
    if (roomStatus === 'playing') {
      navigate(`/room/${roomCode}/play`);
    }
  }, [roomStatus, roomCode, navigate]);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    cleanup();
    navigate('/');
  };

  const handleStart = () => {
    startGame();
  };

  if (!roomCode) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      {/* Room code */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Room Code
        </p>
        <button
          onClick={handleCopyCode}
          className="text-5xl font-black tracking-[0.3em] px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            fontFamily: "'DM Mono', monospace",
            color: '#fbbf24',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '2px solid rgba(251, 191, 36, 0.25)',
          }}
        >
          {roomCode}
        </button>
        <p className="text-xs text-gray-600 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {copied ? 'Copied!' : 'Click to copy'}
        </p>
      </div>

      {/* Player list */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Players
          </p>
          <p className="text-sm tabular-nums" style={{ color: '#a7f3d0', fontFamily: "'DM Mono', monospace" }}>
            {connectedPlayers.length}/6
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {connectedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{
                background: player.id === localPlayerId
                  ? 'linear-gradient(135deg, rgba(6,95,70,0.2) 0%, rgba(4,120,87,0.2) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: player.id === localPlayerId
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                {player.name}
              </span>
              <div className="flex items-center gap-2">
                {player.id === localPlayerId && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}>
                    You
                  </span>
                )}
                {player.id === hostId && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }}>
                    Host
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 6 - connectedPlayers.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center px-4 py-3 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-xs text-gray-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Waiting for player...
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleLeave}
          className="px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 2px 8px rgba(127, 29, 29, 0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Leave
        </button>

        {isHost && (
          <button
            onClick={handleStart}
            disabled={connectedPlayers.length < 2}
            className="px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              color: '#ecfdf5',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 20px rgba(6, 95, 70, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Start Game ({connectedPlayers.length}/2+)
          </button>
        )}
      </div>
    </div>
  );
}
