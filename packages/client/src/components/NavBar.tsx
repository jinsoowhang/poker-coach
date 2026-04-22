import { useState, useRef, useEffect } from 'react';
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const streakPill = streak > 0 && (
    <Link
      to="/train"
      title={dailyDone ? `Streak: ${streak} · Daily done` : `Streak: ${streak} · Daily Hand waiting`}
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors shrink-0"
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
  );

  return (
    <nav className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-gray-950 border-b border-emerald-900/50">
      <Link
        to="/"
        className="font-display text-lg sm:text-xl text-amber-400 tracking-wide whitespace-nowrap shrink-0"
      >
        Poker Coach
      </Link>

      {/* Desktop links */}
      <div className="hidden sm:flex gap-5 md:gap-6">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition-colors whitespace-nowrap ${
              pathname === to ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop right side */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {streakPill}
        <span className="text-sm text-gray-400 whitespace-nowrap">{displayName ?? 'Player'}</span>
      </div>

      {/* Mobile right side: streak + hamburger */}
      <div ref={menuRef} className="sm:hidden flex items-center gap-2 shrink-0">
        {streakPill}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-md border border-emerald-900/60 text-gray-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
        >
          <span className="block w-4 h-0.5 bg-current" />
          <span className="block w-4 h-0.5 bg-current" />
          <span className="block w-4 h-0.5 bg-current" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-4 top-full mt-2 w-48 rounded-lg bg-gray-950 border border-emerald-900/60 shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-emerald-900/40 uppercase tracking-wider">
              {displayName ?? 'Player'}
            </div>
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-emerald-950/40 text-amber-400'
                    : 'text-gray-300 hover:bg-emerald-950/30 hover:text-amber-400'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
