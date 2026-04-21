import { Link, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';

const links = [
  { to: '/', label: 'Home' },
  { to: '/play', label: 'Play' },
  { to: '/train', label: 'Train' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export default function NavBar() {
  const { pathname } = useLocation();
  const displayName = usePlayerStore((s) => s.displayName);
  const streak = usePlayerStore((s) => s.currentStreak);
  const dailyDone = usePlayerStore((s) => s.dailyHandCompletedToday);

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-emerald-900/50">
      <span className="font-display text-xl text-amber-400 tracking-wide">
        Poker Coach
      </span>

      <div className="flex gap-6">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition-colors ${
              pathname === to ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <Link
            to="/train"
            title={dailyDone ? `Streak: ${streak} · Daily done` : `Streak: ${streak} · Daily Hand waiting`}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors"
            style={{
              background: dailyDone
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              color: dailyDone ? '#6ee7b7' : '#fbbf24',
              border: `1px solid ${dailyDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            <span>🔥</span>
            <span>{streak}</span>
          </Link>
        )}
        <span className="text-sm text-gray-400">{displayName ?? 'Player'}</span>
      </div>
    </nav>
  );
}
