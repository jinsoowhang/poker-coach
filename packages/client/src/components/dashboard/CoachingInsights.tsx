interface Props {
  vpip: number;
  aggression: number;
  winRate: number;
}

interface Insight {
  type: 'warning' | 'success' | 'info';
  label: string;
  message: string;
}

function getInsights(vpip: number, aggression: number, winRate: number): Insight[] {
  const insights: Insight[] = [];

  if (vpip > 0.35) {
    insights.push({
      type: 'warning',
      label: 'VPIP',
      message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — you're playing too many hands. Tighten to 20-25%.`,
    });
  } else if (vpip < 0.15) {
    insights.push({
      type: 'warning',
      label: 'VPIP',
      message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — you're too tight. Open up to 20-25%.`,
    });
  } else {
    insights.push({
      type: 'success',
      label: 'VPIP',
      message: `Your VPIP is ${(vpip * 100).toFixed(0)}% — solid hand selection.`,
    });
  }

  if (aggression < 1.0) {
    insights.push({
      type: 'warning',
      label: 'Aggression',
      message: `Aggression factor is ${aggression.toFixed(1)} — you're too passive. Raise more, aim for 2.0+.`,
    });
  } else if (aggression > 3.5) {
    insights.push({
      type: 'info',
      label: 'Aggression',
      message: `Aggression factor is ${aggression.toFixed(1)} — very high. Consider calling more in marginal spots.`,
    });
  } else {
    insights.push({
      type: 'success',
      label: 'Aggression',
      message: `Aggression factor is ${aggression.toFixed(1)} — well-balanced play.`,
    });
  }

  if (winRate < 0.25) {
    insights.push({
      type: 'warning',
      label: 'Win Rate',
      message: `Win rate is ${(winRate * 100).toFixed(0)}% — below average. Focus on position and hand selection.`,
    });
  } else {
    insights.push({
      type: 'success',
      label: 'Win Rate',
      message: `Win rate is ${(winRate * 100).toFixed(0)}% — above average, keep it up.`,
    });
  }

  return insights;
}

const typeStyles = {
  warning: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
  success: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
  info: 'border-blue-500/40 bg-blue-500/5 text-blue-300',
};

const labelStyles = {
  warning: 'text-amber-400',
  success: 'text-emerald-400',
  info: 'text-blue-400',
};

export default function CoachingInsights({ vpip, aggression, winRate }: Props) {
  const insights = getInsights(vpip, aggression, winRate);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm text-gray-400 font-sans mb-4">Coaching Insights</h3>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.label}
            className={`rounded-lg border px-4 py-3 ${typeStyles[insight.type]}`}
          >
            <span className={`text-xs font-semibold uppercase ${labelStyles[insight.type]}`}>
              {insight.label}
            </span>
            <p className="text-sm mt-1">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
