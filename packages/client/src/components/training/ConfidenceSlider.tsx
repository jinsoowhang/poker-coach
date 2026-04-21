const LABELS: Record<number, string> = {
  1: 'Guess',
  2: 'Unsure',
  3: 'Hunch',
  4: 'Confident',
  5: 'Certain',
};

interface Props {
  value: number;
  onChange: (v: number) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ConfidenceSlider({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-xl border border-amber-500/30"
      style={{ background: 'rgba(17, 24, 39, 0.6)', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-widest text-amber-400">
          How confident?
        </span>
        <span className="text-sm text-gray-300 font-bold">{LABELS[value]}</span>
      </div>

      <div className="flex items-center gap-2 w-full max-w-md">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-md text-sm font-bold transition-all duration-150 ${
              disabled ? 'cursor-default' : 'cursor-pointer hover:scale-[1.03]'
            }`}
            style={{
              background:
                value === n
                  ? 'linear-gradient(135deg, #92400e 0%, #b45309 100%)'
                  : 'rgba(255,255,255,0.05)',
              color: value === n ? '#fde68a' : '#9ca3af',
              border:
                value === n
                  ? '1px solid rgba(245, 158, 11, 0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={disabled}
        className={`mt-1 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 ${
          disabled ? 'cursor-default opacity-40' : 'cursor-pointer hover:scale-105 active:scale-95'
        }`}
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: '#ecfdf5',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 2px 8px rgba(6, 95, 70, 0.4)',
        }}
      >
        Submit
      </button>

      <p className="text-[11px] text-gray-500 max-w-xs text-center">
        Rate your confidence <em>before</em> seeing the answer. We'll show your calibration on the
        Dashboard.
      </p>
    </div>
  );
}
