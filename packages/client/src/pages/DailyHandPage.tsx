import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { getDailyHandScenario } from '../lib/streak';

/**
 * /train/daily → redirects to /train/:todaysScenarioId?source=daily
 * Same scenario for all users on a given UTC day.
 */
export function DailyHandPage() {
  const daily = getDailyHandScenario(SCENARIOS);

  useEffect(() => {
    // no-op; routing handled by the Navigate below
  }, []);

  return <Navigate to={`/train/${daily.id}?source=daily`} replace />;
}
