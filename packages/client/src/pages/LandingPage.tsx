import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { createRoom, joinRoom } from '../lib/room-service';
import { supabase } from '../lib/supabase';

export function LandingPage() {
  const navigate = useNavigate();
  const { playerId, displayName } = usePlayerStore();
  const setRoom = useMultiplayerStore(s => s.setRoom);

  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mpDisabled = !supabase;

  const handleCreateRoom = async () => {
    if (!playerId || !displayName) return;
    setLoading(true);
    setError('');

    const result = await createRoom(playerId, displayName);
    if (result) {
      setRoom(result.roomId, result.roomCode, result.channel, true, playerId);
      navigate(`/room/${result.roomCode}`);
    } else {
      setError('Failed to create room. Try again.');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerId || !displayName || !joinCode.trim()) return;
    setLoading(true);
    setError('');

    const result = await joinRoom(joinCode.trim(), playerId, displayName);
    if (result) {
      setRoom(result.roomId, result.roomCode, result.channel, false, result.hostId);
      navigate(`/room/${result.roomCode}`);
    } else {
      setError('Room not found, full, or already started.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-4">
      {/* Title */}
      <div className="text-center">
        <h1
          className="text-6xl font-bold tracking-tight mb-3"
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
      </div>

      {/* Player name display */}
      <div className="text-sm text-gray-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Playing as <span className="text-gray-300 font-semibold">{displayName ?? 'Loading...'}</span>
      </div>

      {/* Mode buttons */}
      <div className="flex flex-col gap-6 w-full max-w-sm">
        {/* Single Player */}
        <button
          onClick={() => navigate('/play')}
          className="w-full px-8 py-4 rounded-xl text-lg font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ecfdf5',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 20px rgba(6, 95, 70, 0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Single Player
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Multiplayer
          </span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Create Room */}
        <button
          onClick={handleCreateRoom}
          disabled={mpDisabled || loading}
          className="w-full px-8 py-4 rounded-xl text-lg font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 4px 20px rgba(30, 58, 95, 0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>

        {/* Join Room */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={mpDisabled}
            className="flex-1 px-4 py-3 rounded-xl text-center text-lg font-bold uppercase tracking-widest disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <button
            onClick={handleJoinRoom}
            disabled={mpDisabled || loading || joinCode.length < 6}
            className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
              color: '#fde68a',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 2px 8px rgba(146, 64, 14, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Join
          </button>
        </div>

        {mpDisabled && (
          <p className="text-xs text-gray-600 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Multiplayer requires Supabase configuration
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
