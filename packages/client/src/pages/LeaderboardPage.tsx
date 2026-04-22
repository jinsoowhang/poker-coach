import { useEffect } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useStatsStore } from '../stores/useStatsStore';

export default function LeaderboardPage() {
  const playerId = usePlayerStore((s) => s.playerId);
  const { leaderboard, loading, loadLeaderboard } = useStatsStore();

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const qualified = leaderboard.filter((p) => p.hands_played >= 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-10 w-56 bg-gray-800 rounded mb-2" />
          <div className="h-5 w-72 bg-gray-800 rounded mb-8" />
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded mb-3" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-display text-amber-400 mb-1">Leaderboard</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">Minimum 20 hands to qualify</p>

        {qualified.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 sm:p-12 text-center">
            <p className="text-gray-400">
              No players have reached 20 hands yet. Keep playing!
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="text-gray-500 uppercase text-[10px] sm:text-xs border-b border-gray-800">
                  <th className="text-left px-2 sm:px-5 py-3">#</th>
                  <th className="text-left px-2 sm:px-5 py-3">Player</th>
                  <th className="text-right px-2 sm:px-5 py-3 whitespace-nowrap">Skill</th>
                  <th className="text-right px-2 sm:px-5 py-3 whitespace-nowrap hidden sm:table-cell">Hands</th>
                  <th className="text-right px-2 sm:px-5 py-3 whitespace-nowrap">Win %</th>
                  <th className="text-right px-2 sm:px-5 py-3 whitespace-nowrap hidden sm:table-cell">VPIP</th>
                  <th className="text-right px-2 sm:px-5 py-3 whitespace-nowrap hidden sm:table-cell">AGG</th>
                </tr>
              </thead>
              <tbody>
                {qualified.map((player, index) => {
                  const isCurrentPlayer = player.player_id === playerId;
                  return (
                    <tr
                      key={player.player_id}
                      className={`border-b border-gray-800 last:border-b-0 ${
                        isCurrentPlayer ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-gray-400">{index + 1}</td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3">
                        <span className={isCurrentPlayer ? 'text-amber-400' : 'text-gray-100'}>
                          {player.display_name}
                          {isCurrentPlayer && (
                            <span className="text-amber-400 ml-1">(You)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-right font-mono text-amber-400 whitespace-nowrap">
                        {Math.round(player.skill_score)}
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-right text-gray-300 hidden sm:table-cell">
                        {player.hands_played}
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-right text-gray-300 whitespace-nowrap">
                        {(player.win_rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-right text-gray-300 hidden sm:table-cell">
                        {(player.vpip * 100).toFixed(1)}%
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 text-right text-gray-300 hidden sm:table-cell">
                        {(player.aggression * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
