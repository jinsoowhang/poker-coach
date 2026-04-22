import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CATEGORY_LABELS,
  getScenarioById,
  getScenariosByCategory,
} from '../data/scenarios';
import { useTrainingStore } from '../stores/useTrainingStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { saveScenarioAttempt, markDailyHandCompleted } from '../lib/training-persistence';
import { ScenarioTable } from '../components/training/ScenarioTable';
import { ScenarioChoices } from '../components/training/ScenarioChoices';
import { ScenarioExplanation } from '../components/training/ScenarioExplanation';
import { ConfidenceSlider } from '../components/training/ConfidenceSlider';

export function ScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get('source'); // 'daily' | 'review' | null

  const playerId = usePlayerStore((s) => s.playerId);
  const refreshStreak = usePlayerStore((s) => s.refreshStreak);
  const pendingChoice = useTrainingStore((s) => s.pendingChoice);
  const pendingConfidence = useTrainingStore((s) => s.pendingConfidence);
  const currentAttempt = useTrainingStore((s) => s.currentAttempt);
  const stageChoice = useTrainingStore((s) => s.stageChoice);
  const setConfidence = useTrainingStore((s) => s.setConfidence);
  const submit = useTrainingStore((s) => s.submitAttempt);
  const advance = useTrainingStore((s) => s.advance);
  const sessionAccuracy = useTrainingStore((s) => s.sessionAccuracy);

  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;

  // Reset pending + attempt when navigating between scenarios.
  useEffect(() => {
    useTrainingStore.setState({
      currentAttempt: null,
      pendingChoice: null,
      pendingConfidence: 3,
    });
  }, [scenarioId]);

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Scenario not found.</p>
        <button
          onClick={() => navigate('/train')}
          className="px-5 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600"
        >
          Back to Training
        </button>
      </div>
    );
  }

  const categoryScenarios = getScenariosByCategory(scenario.category);
  const indexInCategory = categoryScenarios.findIndex((s) => s.id === scenario.id);
  const nextInCategory = categoryScenarios[indexInCategory + 1];

  const handleSubmit = () => {
    if (pendingChoice === null || currentAttempt) return;
    submit(scenario.id, scenario.category, scenario.correctIndex);
    if (playerId) {
      void saveScenarioAttempt(
        playerId,
        scenario.id,
        scenario.category,
        pendingChoice,
        scenario.correctIndex,
        pendingConfidence,
      );
      if (source === 'daily') {
        void markDailyHandCompleted(playerId).then(() => refreshStreak());
      }
    }
  };

  const handleNext = () => {
    advance();
    // Daily Hand: go back to training landing (only one per day).
    // Review: advance to next due scenario via the review route.
    if (source === 'daily') {
      navigate('/train');
      return;
    }
    if (source === 'review') {
      navigate('/train/review');
      return;
    }
    if (nextInCategory) {
      navigate(`/train/${nextInCategory.id}`);
    } else {
      navigate('/train');
    }
  };

  const { total, correct } = sessionAccuracy();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div
              className="text-xs uppercase tracking-widest text-amber-400"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {source === 'daily'
                ? '🔥 Daily Hand'
                : source === 'review'
                ? '↻ Review'
                : `${CATEGORY_LABELS[scenario.category]} · ${indexInCategory + 1} / ${categoryScenarios.length}`}
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold text-gray-100 mt-1 break-words"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {scenario.title}
            </h1>
          </div>
          {total > 0 && (
            <div
              className="text-xs sm:text-sm text-gray-400 text-right whitespace-nowrap shrink-0 pt-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Session: {correct}/{total}
            </div>
          )}
        </div>

        {/* Table */}
        <ScenarioTable scenario={scenario} />

        {/* Narrative */}
        <div
          className="mt-4 p-3 sm:p-4 rounded-xl border border-gray-800"
          style={{ background: 'rgba(17, 24, 39, 0.5)' }}
        >
          <p
            className="text-gray-200 leading-relaxed text-[1rem] sm:text-[1.1rem]"
            style={{ fontFamily: "'Crimson Text', Georgia, serif", lineHeight: 1.6 }}
          >
            {scenario.narrative}
          </p>
          <div
            className="flex flex-wrap gap-x-3 sm:gap-x-5 gap-y-1 mt-3 text-[11px] sm:text-xs text-gray-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span>Stakes ${scenario.stakes.sb}/${scenario.stakes.bb}</span>
            <span>Eff. ${scenario.effectiveStack}</span>
            <span>Pot ${scenario.pot}</span>
            {scenario.currentBet > 0 && <span>To call ${scenario.currentBet}</span>}
          </div>
        </div>

        {/* Choices */}
        <div className="mt-5">
          <ScenarioChoices
            scenario={scenario}
            pendingIndex={pendingChoice}
            submittedIndex={currentAttempt?.chosenIndex ?? null}
            onStage={stageChoice}
          />
        </div>

        {/* Confidence slider (only visible after staging a choice, before submitting) */}
        {pendingChoice !== null && !currentAttempt && (
          <div className="mt-5 flex justify-center">
            <ConfidenceSlider
              value={pendingConfidence}
              onChange={setConfidence}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* Explanation + Next */}
        {currentAttempt && (
          <>
            <ScenarioExplanation
              scenario={scenario}
              isCorrect={currentAttempt.isCorrect}
              chosenIndex={currentAttempt.chosenIndex}
              confidence={currentAttempt.confidence}
            />
            <div className="mt-5 flex justify-center">
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                  color: '#ecfdf5',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 2px 8px rgba(6, 95, 70, 0.4)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {source === 'daily'
                  ? 'Back to Training'
                  : source === 'review'
                  ? 'Next review →'
                  : nextInCategory
                  ? 'Next scenario →'
                  : 'Back to categories'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
