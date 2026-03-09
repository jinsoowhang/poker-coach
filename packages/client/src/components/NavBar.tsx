import { Link, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';

const links = [
  { to: '/', label: 'Play' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export default function NavBar() {
  const { pathname } = useLocation();
  const displayName = usePlayerStore((s) => s.displayName);

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

      <span className="text-sm text-gray-400">{displayName ?? 'Player'}</span>
    </nav>
  );
}
