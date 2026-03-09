import { supabase } from './supabase';
import type { HandSummary, GameEvent } from '@poker-coach/engine';

interface HeroAction {
  street: string;
  type: string;
  amount: number;
}

function extractHeroActions(events: GameEvent[], heroId: string): HeroAction[] {
  const actions: HeroAction[] = [];
  let currentStreet = 'preflop';

  for (const event of events) {
    if (event.type === 'STREET_CHANGE') {
      currentStreet = event.street;
    }
    if (event.type === 'PLAYER_ACTION' && event.playerId === heroId) {
      actions.push({
        street: currentStreet,
        type: event.action.type,
        amount: event.action.amount,
      });
    }
  }
  return actions;
}

function getHeroPosition(seatIndex: number, dealerIndex: number, playerCount: number): string {
  const positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];
  const relativePos = (seatIndex - dealerIndex + playerCount) % playerCount;
  return positions[relativePos] ?? 'MP';
}

export async function saveHand(
  playerId: string,
  sessionId: string,
  summary: HandSummary,
  events: GameEvent[],
  heroId: string,
  dealerIndex: number,
  playerCount: number,
  heroSeatIndex: number
): Promise<void> {
  if (!supabase) return;

  const heroResult = summary.playerResults.find(r => r.playerId === heroId);
  if (!heroResult) return;

  const heroActions = extractHeroActions(events, heroId);
  const heroPosition = getHeroPosition(heroSeatIndex, dealerIndex, playerCount);

  await supabase.from('hands').insert({
    player_id: playerId,
    session_id: sessionId,
    hand_number: summary.handNumber,
    pot_total: summary.potTotal,
    community_cards: summary.communityCards,
    player_results: summary.playerResults,
    winners: summary.winners,
    hero_hole_cards: heroResult.holeCards,
    hero_position: heroPosition,
    hero_actions: heroActions,
    hero_chips_before: heroResult.chipsBefore,
    hero_chips_after: heroResult.chipsAfter,
    hero_folded: heroResult.folded,
  });
}

export async function createSession(playerId: string, chipsStart: number): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('sessions')
    .insert({ player_id: playerId, chips_start: chipsStart })
    .select('id')
    .single();

  return data?.id ?? null;
}

export async function endSession(sessionId: string, handsPlayed: number, chipsEnd: number): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('sessions')
    .update({ hands_played: handsPlayed, chips_end: chipsEnd, ended_at: new Date().toISOString() })
    .eq('id', sessionId);
}
