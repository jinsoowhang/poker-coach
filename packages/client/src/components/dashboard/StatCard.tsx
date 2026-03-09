interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'emerald' | 'amber' | 'red' | 'blue';
}

const borderColors = {
  emerald: 'border-emerald-500/40',
  amber: 'border-amber-500/40',
  red: 'border-red-500/40',
  blue: 'border-blue-500/40',
};

const textColors = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
};

export default function StatCard({ label, value, subtitle, color = 'emerald' }: StatCardProps) {
  return (
    <div className={`bg-gray-900 rounded-xl border ${borderColors[color]} p-5`}>
      <p className="text-sm text-gray-400 font-sans">{label}</p>
      <p className={`text-3xl font-mono font-bold mt-1 ${textColors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
