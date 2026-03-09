export interface Milestone {
  id: string;
  label: string;
  description: string;
  check: (stats: { handsPlayed: number; skillScore: number; vpip: number; winRate: number }) => boolean;
}

export const MILESTONES: Milestone[] = [
  { id: 'first-10', label: 'Getting Started', description: 'Play 10 hands', check: s => s.handsPlayed >= 10 },
  { id: 'first-50', label: 'Regular', description: 'Play 50 hands', check: s => s.handsPlayed >= 50 },
  { id: 'century', label: 'Century', description: 'Play 100 hands', check: s => s.handsPlayed >= 100 },
  { id: 'bronze', label: 'Bronze', description: 'Reach skill score 300', check: s => s.skillScore >= 300 },
  { id: 'silver', label: 'Silver', description: 'Reach skill score 500', check: s => s.skillScore >= 500 },
  { id: 'gold', label: 'Gold', description: 'Reach skill score 700', check: s => s.skillScore >= 700 },
  { id: 'tight', label: 'Disciplined', description: 'VPIP under 30% with 50+ hands', check: s => s.vpip <= 0.30 && s.handsPlayed >= 50 },
  { id: 'winner', label: 'Winner', description: 'Win rate above 40%', check: s => s.winRate >= 0.40 && s.handsPlayed >= 20 },
];

export function getEarnedMilestones(stats: { handsPlayed: number; skillScore: number; vpip: number; winRate: number }): Milestone[] {
  return MILESTONES.filter(m => m.check(stats));
}
