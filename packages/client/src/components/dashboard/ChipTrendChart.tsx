import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { hand_number: number; chips: number }[];
}

export default function ChipTrendChart({ data }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm text-gray-400 font-sans mb-4">Chip Trend</h3>
      {data.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No chip data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hand_number"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Hand #', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }}
              labelFormatter={(v) => `Hand #${v}`}
              formatter={(v) => [Number(v).toLocaleString(), 'Chips']}
            />
            <Line
              type="monotone"
              dataKey="chips"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
