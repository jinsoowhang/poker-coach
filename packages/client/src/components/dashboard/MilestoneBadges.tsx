import { getEarnedMilestones } from '../../lib/milestones';

interface Props {
  handsPlayed: number;
  skillScore: number;
  vpip: number;
  winRate: number;
}

export default function MilestoneBadges({ handsPlayed, skillScore, vpip, winRate }: Props) {
  const earned = getEarnedMilestones({ handsPlayed, skillScore, vpip, winRate });

  if (earned.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
      <h3 className="text-gray-400 text-sm mb-3">Milestones</h3>
      <div className="flex flex-wrap gap-2">
        {earned.map((m) => (
          <span
            key={m.id}
            title={m.description}
            className="bg-amber-950/30 border border-amber-800 text-amber-400 text-sm px-3 py-1 rounded-full"
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
