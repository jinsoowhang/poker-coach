import { Player, ValidAction, PlayerAction, GameState } from './types.js';

/**
 * Get valid actions for the current player given game state.
 */
export function getValidActions(state: GameState): ValidAction[] {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.folded || player.allIn) return [];

  const highestBet = Math.max(...state.players.map(p => p.currentBet));
  const toCall = highestBet - player.currentBet;
  const actions: ValidAction[] = [];

  // Can always fold (unless no bet to face)
  actions.push({ type: 'fold' });

  if (toCall === 0) {
    // No bet to face — can check
    actions.push({ type: 'check' });
  } else {
    // Must call to stay in
    if (player.chips >= toCall) {
      actions.push({ type: 'call', minAmount: toCall, maxAmount: toCall });
    }
  }

  // Raise: minimum raise is previous raise amount (or big blind)
  const minRaiseTotal = highestBet + Math.max(state.minRaise, state.bigBlind);
  const raiseChipsNeeded = minRaiseTotal - player.currentBet;

  if (player.chips > toCall && player.chips >= raiseChipsNeeded) {
    actions.push({
      type: 'raise',
      minAmount: raiseChipsNeeded,
      maxAmount: player.chips,
    });
  }

  // All-in is always available if player has chips
  if (player.chips > 0) {
    actions.push({ type: 'all-in', minAmount: player.chips, maxAmount: player.chips });
  }

  return actions;
}

/**
 * Apply a player action to the game state. Returns updated player.
 * Mutates the player object directly for simplicity.
 */
export function applyBet(player: Player, action: PlayerAction): void {
  switch (action.type) {
    case 'fold':
      player.folded = true;
      break;
    case 'check':
      // Nothing changes
      break;
    case 'call':
    case 'raise':
      player.chips -= action.amount;
      player.currentBet += action.amount;
      player.totalBetThisRound += action.amount;
      if (player.chips === 0) {
        player.allIn = true;
      }
      break;
    case 'all-in':
      player.currentBet += player.chips;
      player.totalBetThisRound += player.chips;
      player.chips = 0;
      player.allIn = true;
      break;
  }
}

/**
 * Post blinds for a hand. Mutates players.
 * Returns [smallBlindIndex, bigBlindIndex].
 */
export function postBlinds(
  players: Player[],
  dealerIndex: number,
  smallBlind: number,
  bigBlind: number,
): [number, number] {
  const activePlayers = players.filter(p => !p.folded);
  const numPlayers = activePlayers.length;

  let sbIndex: number;
  let bbIndex: number;

  if (numPlayers === 2) {
    // Heads-up: dealer posts small blind
    sbIndex = dealerIndex;
    bbIndex = (dealerIndex + 1) % players.length;
  } else {
    sbIndex = (dealerIndex + 1) % players.length;
    bbIndex = (dealerIndex + 2) % players.length;
  }

  const sbPlayer = players[sbIndex];
  const bbPlayer = players[bbIndex];

  const sbAmount = Math.min(smallBlind, sbPlayer.chips);
  const bbAmount = Math.min(bigBlind, bbPlayer.chips);

  applyBet(sbPlayer, { type: sbAmount >= smallBlind ? 'call' : 'all-in', amount: sbAmount });
  applyBet(bbPlayer, { type: bbAmount >= bigBlind ? 'call' : 'all-in', amount: bbAmount });

  return [sbIndex, bbIndex];
}

/**
 * Get the index of the next active (non-folded, non-all-in) player.
 */
export function nextActivePlayer(players: Player[], fromIndex: number): number {
  let idx = (fromIndex + 1) % players.length;
  let checked = 0;

  while (checked < players.length) {
    if (!players[idx].folded && !players[idx].allIn) {
      return idx;
    }
    idx = (idx + 1) % players.length;
    checked++;
  }

  return -1; // No active player found
}

/**
 * Count players who can still act (not folded, not all-in).
 */
export function countActivePlayers(players: Player[]): number {
  return players.filter(p => !p.folded && !p.allIn).length;
}

/**
 * Count players still in the hand (not folded).
 */
export function countPlayersInHand(players: Player[]): number {
  return players.filter(p => !p.folded).length;
}
