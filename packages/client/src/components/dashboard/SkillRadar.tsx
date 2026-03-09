interface Props {
  vpip: number;
  aggression: number;
  winRate: number;
  showdownWinPct: number;
}

const LABELS = ['VPIP', 'Aggression', 'Win Rate', 'Showdown %'];
const OPTIMAL = [0.22 / 0.5, 2.0 / 4, 0.35 / 0.6, 0.55 / 0.8];

function normalize(props: Props): number[] {
  return [
    Math.min(props.vpip / 0.5, 1),
    Math.min(props.aggression / 4, 1),
    Math.min(props.winRate / 0.6, 1),
    Math.min(props.showdownWinPct / 0.8, 1),
  ];
}

function polarToXY(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function polygonPoints(cx: number, cy: number, radius: number, values: number[]): string {
  return values
    .map((v, i) => {
      const { x, y } = polarToXY(cx, cy, radius * v, i, values.length);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function SkillRadar(props: Props) {
  const cx = 150;
  const cy = 150;
  const maxR = 110;
  const rings = [0.25, 0.5, 0.75, 1.0];
  const player = normalize(props);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm text-gray-400 font-sans mb-4">Skill Radar</h3>
      <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={polygonPoints(cx, cy, maxR, [r, r, r, r])}
            fill="none"
            stroke="#374151"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const { x, y } = polarToXY(cx, cy, maxR, i, 4);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#374151" strokeWidth={1} />;
        })}

        {/* Optimal shape (amber dashed) */}
        <polygon
          points={polygonPoints(cx, cy, maxR, OPTIMAL)}
          fill="rgba(234,179,8,0.08)"
          stroke="#eab308"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Player shape (emerald) */}
        <polygon
          points={polygonPoints(cx, cy, maxR, player)}
          fill="rgba(16,185,129,0.15)"
          stroke="#10b981"
          strokeWidth={2}
        />

        {/* Labels */}
        {LABELS.map((label, i) => {
          const { x, y } = polarToXY(cx, cy, maxR + 20, i, 4);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9ca3af"
              fontSize={11}
              fontFamily="DM Sans, sans-serif"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-gray-400">You</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-amber-500 border-dashed inline-block" />
          <span className="text-gray-400">Optimal (TAG)</span>
        </span>
      </div>
    </div>
  );
}
