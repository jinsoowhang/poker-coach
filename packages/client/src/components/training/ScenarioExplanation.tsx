import type { Scenario } from '../../data/scenarios';

interface Props {
  scenario: Scenario;
  isCorrect: boolean;
  chosenIndex: number;
  confidence: number;
}

/**
 * Lightweight markdown renderer for our explanation strings.
 * Supports **bold** and plain paragraphs. No external dep.
 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <strong key={key++} className="text-amber-300 font-semibold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts;
}

const CONFIDENCE_LABEL: Record<number, string> = {
  1: 'Guess',
  2: 'Unsure',
  3: 'Hunch',
  4: 'Confident',
  5: 'Certain',
};

function calibrationNote(isCorrect: boolean, confidence: number): string | null {
  // Flag the extreme ends of miscalibration — don't nag for middling picks.
  if (confidence >= 4 && !isCorrect) {
    return "Overconfident — you were sure and got it wrong. Worth rethinking the theory here.";
  }
  if (confidence <= 2 && isCorrect) {
    return "Underconfident — you were right but didn't trust it. Trust your read more.";
  }
  return null;
}

export function ScenarioExplanation({ scenario, isCorrect, chosenIndex, confidence }: Props) {
  const correctChoice = scenario.choices[scenario.correctIndex];
  const hasPerChoiceReasoning = scenario.choices.some((c) => c.reasoning);
  const calibration = calibrationNote(isCorrect, confidence);

  return (
    <div
      className="mt-4 p-4 sm:p-5 rounded-xl border"
      style={{
        background: 'rgba(17, 24, 39, 0.7)',
        borderColor: isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }}
    >
      <div className="flex items-start sm:items-center gap-3 mb-3 flex-wrap sm:flex-nowrap">
        <span
          className="text-2xl font-bold"
          style={{ color: isCorrect ? '#34d399' : '#f87171' }}
        >
          {isCorrect ? '✓' : '✗'}
        </span>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs uppercase tracking-widest"
            style={{ color: isCorrect ? '#34d399' : '#f87171', fontFamily: "'DM Sans', sans-serif" }}
          >
            {isCorrect ? 'Correct' : 'Not quite'}
          </div>
          <div
            className="text-sm sm:text-base font-bold break-words"
            style={{ color: '#fde68a', fontFamily: "'DM Sans', sans-serif" }}
          >
            Best play: {correctChoice.label}
          </div>
        </div>
        <div
          className="text-left sm:text-right text-[11px] sm:text-xs w-full sm:w-auto"
          style={{ fontFamily: "'DM Mono', monospace", color: '#9ca3af' }}
        >
          <div className="uppercase tracking-widest">Your confidence</div>
          <div className="text-gray-300 font-bold">
            {confidence}/5 · {CONFIDENCE_LABEL[confidence]}
          </div>
        </div>
      </div>

      {calibration && (
        <div
          className="mb-4 px-3 py-2 rounded-md text-sm"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            borderLeft: '3px solid rgba(251, 191, 36, 0.6)',
            color: '#fcd34d',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {calibration}
        </div>
      )}

      <p
        className="text-sm leading-relaxed text-gray-200"
        style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '1.05rem', lineHeight: 1.7 }}
      >
        {renderInline(scenario.explanation)}
      </p>

      {hasPerChoiceReasoning && (
        <div className="mt-5 pt-4 border-t border-gray-800">
          <div
            className="text-xs uppercase tracking-widest text-amber-400 mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Breakdown by choice
          </div>
          <div className="flex flex-col gap-2">
            {scenario.choices.map((choice, i) => {
              if (!choice.reasoning) return null;
              const isCorrectChoice = i === scenario.correctIndex;
              const isYourChoice = i === chosenIndex;
              const marker = isCorrectChoice ? '✓' : isYourChoice ? '✗' : '·';
              const color = isCorrectChoice
                ? '#34d399'
                : isYourChoice
                ? '#f87171'
                : '#6b7280';
              return (
                <div
                  key={i}
                  className="flex gap-3 text-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <span style={{ color, minWidth: '1rem' }} className="font-bold">
                    {marker}
                  </span>
                  <div className="flex-1">
                    <span className="font-bold" style={{ color: '#fde68a' }}>
                      {choice.label}
                    </span>
                    {isYourChoice && !isCorrectChoice && (
                      <span className="text-xs text-red-400 ml-2">(your pick)</span>
                    )}
                    {isYourChoice && isCorrectChoice && (
                      <span className="text-xs text-emerald-400 ml-2">(your pick)</span>
                    )}
                    <p className="text-gray-400 text-[13px] mt-0.5 leading-relaxed">
                      {renderInline(choice.reasoning)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scenario.concepts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {scenario.concepts.map((concept) => (
            <span
              key={concept}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                background: 'rgba(251, 191, 36, 0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {concept}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
