import { supabase } from './supabase';

export async function computeAndSaveSnapshot(playerId: string): Promise<void> {
  if (!supabase) return;

  const { data: hands } = await supabase
    .from('hands')
    .select('hero_actions, hero_chips_before, hero_chips_after, hero_folded')
    .eq('player_id', playerId);

  if (!hands || hands.length === 0) return;

  const total = hands.length;
  const wins = hands.filter(h => h.hero_chips_after > h.hero_chips_before).length;
  const winRate = wins / total;

  const vpipHands = hands.filter(h =>
    (h.hero_actions as any[]).some(
      (a: any) => a.street === 'preflop' && ['call', 'raise', 'all-in'].includes(a.type)
    )
  ).length;
  const vpip = vpipHands / total;

  let raises = 0, calls = 0;
  for (const h of hands) {
    for (const a of h.hero_actions as any[]) {
      if (a.type === 'raise' || a.type === 'all-in') raises++;
      if (a.type === 'call') calls++;
    }
  }
  const aggression = calls > 0 ? raises / calls : raises;

  const showdownHands = hands.filter(h => !h.hero_folded);
  const showdownWins = showdownHands.filter(h => h.hero_chips_after > h.hero_chips_before).length;
  const showdownWinPct = showdownHands.length > 0 ? showdownWins / showdownHands.length : 0;

  const vpipComponent = Math.max(250 - Math.abs(vpip - 0.22) * 1000, 0);
  const aggressionComponent = Math.max(200 - Math.abs(aggression - 2.0) * 100, 0);
  const skillScore = Math.round(
    winRate * 300 + vpipComponent + aggressionComponent + showdownWinPct * 250
  );

  await supabase.from('skill_snapshots').insert({
    player_id: playerId,
    hands_total: total,
    skill_score: skillScore,
    vpip: Math.round(vpip * 1000) / 1000,
    aggression: Math.round(aggression * 100) / 100,
    win_rate: Math.round(winRate * 1000) / 1000,
  });
}
