import { useEffect } from 'react';
import { useStatsStore } from '../stores/useStatsStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import StatCard from '../components/dashboard/StatCard';
import ChipTrendChart from '../components/dashboard/ChipTrendChart';
import SkillTrendChart from '../components/dashboard/SkillTrendChart';
import SkillRadar from '../components/dashboard/SkillRadar';
import CoachingInsights from '../components/dashboard/CoachingInsights';
import RecentHandsTable from '../components/dashboard/RecentHandsTable';
import MilestoneBadges from '../components/dashboard/MilestoneBadges';

export default function DashboardPage() {
  const playerId = usePlayerStore((s) => s.playerId);
  const { leaderboard, recentHands, skillHistory, chipHistory, loading, loadDashboard, loadLeaderboard } =
    useStatsStore();

  useEffect(() => {
    if (playerId) {
      loadDashboard(playerId);
      loadLeaderboard();
    }
  }, [playerId, loadDashboard, loadLeaderboard]);

  const myStats = leaderboard.find((p) => p.player_id === playerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-10 w-48 bg-gray-800 rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-900 rounded-xl" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-72 bg-gray-900 rounded-xl" />
            <div className="h-72 bg-gray-900 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const handsPlayed = myStats?.hands_played ?? 0;
  const skillScore = myStats?.skill_score ?? 0;
  const winRate = myStats?.win_rate ?? 0;
  const vpip = myStats?.vpip ?? 0;
  const aggression = myStats?.aggression ?? 0;
  const showdownWinPct = myStats?.showdown_win_pct ?? 0;
  const avgProfit = myStats?.avg_profit ?? 0;
  const totalProfit = Math.round(avgProfit * handsPlayed);

  if (handsPlayed === 0 && recentHands.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-display text-amber-400 mb-8">Dashboard</h1>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No hands played yet</p>
            <p className="text-gray-600 text-sm">
              Play some poker to see your stats, charts, and coaching insights here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-display text-amber-400 mb-8">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Hands Played" value={handsPlayed} color="blue" />
          <StatCard
            label="Skill Score"
            value={Math.round(skillScore)}
            subtitle="/ 1000"
            color="amber"
          />
          <StatCard
            label="Win Rate"
            value={`${(winRate * 100).toFixed(1)}%`}
            color="emerald"
          />
          <StatCard
            label="Total Profit"
            value={`${totalProfit >= 0 ? '+' : ''}${totalProfit}`}
            color={totalProfit >= 0 ? 'emerald' : 'red'}
          />
        </div>

        {/* Milestone Badges */}
        <MilestoneBadges
          handsPlayed={handsPlayed}
          skillScore={skillScore}
          vpip={vpip}
          winRate={winRate}
        />

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ChipTrendChart data={chipHistory} />
          <SkillTrendChart data={skillHistory} />
        </div>

        {/* Radar + Coaching */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <SkillRadar
            vpip={vpip}
            aggression={aggression}
            winRate={winRate}
            showdownWinPct={showdownWinPct}
          />
          <CoachingInsights vpip={vpip} aggression={aggression} winRate={winRate} />
        </div>

        {/* Recent Hands */}
        <RecentHandsTable hands={recentHands} />
      </div>
    </div>
  );
}
