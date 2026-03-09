import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SkillSnapshot } from '../../lib/stats';

interface Props {
  data: SkillSnapshot[];
}

export default function SkillTrendChart({ data }: Props) {
  const chartData = data.map((s) => ({
    hands: s.hands_total,
    score: Math.round(s.skill_score),
  }));

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm text-gray-400 font-sans mb-4">Skill Score Over Time</h3>
      {chartData.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No skill data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hands"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Hands', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 1000]}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }}
              labelFormatter={(v) => `${v} hands`}
              formatter={(v: number) => [v, 'Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#eab308' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
