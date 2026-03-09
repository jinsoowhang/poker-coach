import type { HandRecord } from '../../lib/stats';

interface Props {
  hands: HandRecord[];
}

export default function RecentHandsTable({ hands }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm text-gray-400 font-sans mb-4">Recent Hands</h3>
      {hands.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No hands played yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 font-medium">Hand #</th>
                <th className="text-left py-2 pr-4 font-medium">Position</th>
                <th className="text-left py-2 pr-4 font-medium">Result</th>
                <th className="text-right py-2 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {hands.map((h) => {
                const profit = h.hero_chips_after - h.hero_chips_before;
                return (
                  <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 pr-4 font-mono text-gray-300">{h.hand_number}</td>
                    <td className="py-2 pr-4 text-gray-400">{h.hero_position}</td>
                    <td className="py-2 pr-4 text-gray-400">
                      {h.hero_folded ? 'Folded' : 'Showdown'}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${
                        profit > 0
                          ? 'text-emerald-400'
                          : profit < 0
                            ? 'text-red-400'
                            : 'text-gray-500'
                      }`}
                    >
                      {profit > 0 ? '+' : ''}
                      {profit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
