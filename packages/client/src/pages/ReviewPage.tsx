import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';
import { fetchDueScenarioIds } from '../lib/stats';
import { getScenarioById } from '../data/scenarios';

/**
 * /train/review → picks the most-overdue scenario the player has state for
 * and navigates to it. If no scenarios are due, bounces back to /train.
 */
export function ReviewPage() {
  const navigate = useNavigate();
  const playerId = usePlayerStore((s) => s.playerId);
  const [targetId, setTargetId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!playerId) return;
      const due = await fetchDueScenarioIds(playerId);
      if (cancelled) return;
      // Pick the first due scenario that still exists in the library.
      const first = due.map((d) => getScenarioById(d.scenario_id)).find((s) => s != null);
      setTargetId(first ? first.id : null);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [playerId, navigate]);

  if (targetId === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 flex items-center justify-center">
        <div className="animate-pulse">Loading review queue…</div>
      </div>
    );
  }

  if (targetId === null) {
    return <Navigate to="/train" replace />;
  }

  return <Navigate to={`/train/${targetId}?source=review`} replace />;
}
