import type { Scenario } from '../../data/scenarios';

const BASE_BUTTON_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
};

const COLORS: Record<string, { bg: string; border: string; color: string; shadow: string }> = {
  fold:    { bg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', border: 'rgba(239, 68, 68, 0.3)',  color: '#fca5a5', shadow: 'rgba(127, 29, 29, 0.4)' },
  check:   { bg: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', border: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd', shadow: 'rgba(30, 58, 95, 0.4)' },
  call:    { bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', shadow: 'rgba(6, 95, 70, 0.4)' },
  raise:   { bg: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)', border: 'rgba(245, 158, 11, 0.3)', color: '#fde68a', shadow: 'rgba(146, 64, 14, 0.4)' },
  'all-in':{ bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', border: 'rgba(239, 68, 68, 0.5)',  color: '#fff',    shadow: 'rgba(220, 38, 38, 0.4)' },
};

interface Props {
  scenario: Scenario;
  pendingIndex: number | null;
  submittedIndex: number | null;
  onStage: (index: number) => void;
}

export function ScenarioChoices({ scenario, pendingIndex, submittedIndex, onStage }: Props) {
  const answered = submittedIndex !== null;
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {scenario.choices.map((choice, i) => {
        const c = COLORS[choice.action];
        const isCorrect = i === scenario.correctIndex;
        const isSubmitted = i === submittedIndex;
        const isStaged = !answered && i === pendingIndex;

        let overlay = '';
        if (answered && isCorrect) overlay = 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-gray-950';
        if (answered && isSubmitted && !isCorrect) overlay = 'ring-4 ring-red-400 ring-offset-2 ring-offset-gray-950';
        if (isStaged) overlay = 'ring-2 ring-amber-300 ring-offset-2 ring-offset-gray-950';

        let opacity = 1;
        if (answered && !isSubmitted && !isCorrect) opacity = 0.4;
        if (!answered && pendingIndex !== null && !isStaged) opacity = 0.6;

        return (
          <button
            key={i}
            onClick={() => !answered && onStage(i)}
            disabled={answered}
            className={`px-5 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 ${
              answered ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'
            } ${overlay}`}
            style={{
              ...BASE_BUTTON_STYLE,
              background: c.bg,
              color: c.color,
              border: `1px solid ${c.border}`,
              boxShadow: `0 2px 8px ${c.shadow}`,
              opacity,
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
