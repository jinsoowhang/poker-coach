import { GameState, Player, PlayerAction, Street, Card } from './types.js';
import { applyBet } from './betting-round.js';
import { collectBets } from './pot-manager.js';

// ── Action types for the reducer ──

export type GameAction =
  | { type: 'POST_BLINDS'; smallBlind: number; bigBlind: number }
  | { type: 'DEAL_HOLE_CARDS'; playerId: string; cards: [Card, Card] }
  | { type: 'DEAL_COMMUNITY'; cards: Card[] }
  | { type: 'PLAYER_ACTION'; playerId: string; action: PlayerAction }
  | { type: 'ADVANCE_STREET' }
  | { type: 'END_HAND' }
  | { type: 'NEXT_PLAYER' }
  | { type: 'COLLECT_BETS' };

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river'];

/**
 * Create initial game state for a new hand.
 */
export function createInitialState(
  players: Player[],
  dealerIndex: number,
  smallBlind: number,
  bigBlind: number,
  handNumber: number,
): GameState {
  return {
    handNumber,
    players: players.map(p => ({
      ...p,
      currentBet: 0,
      totalBetThisRound: 0,
      folded: false,
      allIn: false,
      holeCards: null,
    })),
    communityCards: [],
    street: 'preflop',
    pot: 0,
    sidePots: [],
    currentPlayerIndex: dealerIndex,
    dealerIndex,
    smallBlind,
    bigBlind,
    lastRaiseAmount: bigBlind,
    minRaise: bigBlind,
    isHandOver: false,
  };
}

/**
 * Pure reducer: apply an action to game state, return new state.
 */
export function applyAction(state: GameState, action: GameAction): GameState {
  // Deep clone to maintain purity
  const next: GameState = {
    ...state,
    players: state.players.map(p => ({ ...p })),
    communityCards: [...state.communityCards],
    sidePots: state.sidePots.map(sp => ({ ...sp, eligiblePlayerIds: [...sp.eligiblePlayerIds] })),
  };

  switch (action.type) {
    case 'POST_BLINDS': {
      const numPlayers = next.players.length;
      let sbIndex: number;
      let bbIndex: number;

      if (numPlayers === 2) {
        sbIndex = next.dealerIndex;
        bbIndex = (next.dealerIndex + 1) % numPlayers;
      } else {
        sbIndex = (next.dealerIndex + 1) % numPlayers;
        bbIndex = (next.dealerIndex + 2) % numPlayers;
      }

      const sbPlayer = next.players[sbIndex];
      const bbPlayer = next.players[bbIndex];
      const sbAmount = Math.min(action.smallBlind, sbPlayer.chips);
      const bbAmount = Math.min(action.bigBlind, bbPlayer.chips);

      applyBet(sbPlayer, { type: sbAmount >= action.smallBlind ? 'call' : 'all-in', amount: sbAmount });
      applyBet(bbPlayer, { type: bbAmount >= action.bigBlind ? 'call' : 'all-in', amount: bbAmount });

      next.smallBlind = action.smallBlind;
      next.bigBlind = action.bigBlind;
      next.minRaise = action.bigBlind;
      next.lastRaiseAmount = action.bigBlind;
      break;
    }

    case 'DEAL_HOLE_CARDS': {
      const player = next.players.find(p => p.id === action.playerId);
      if (player) {
        player.holeCards = action.cards;
      }
      break;
    }

    case 'DEAL_COMMUNITY': {
      next.communityCards.push(...action.cards);
      break;
    }

    case 'PLAYER_ACTION': {
      const player = next.players.find(p => p.id === action.playerId);
      if (!player) break;

      const previousHighBet = Math.max(...next.players.map(p => p.currentBet));
      applyBet(player, action.action);

      if (action.action.type === 'raise' || action.action.type === 'all-in') {
        const raiseAmount = player.currentBet - previousHighBet;
        if (raiseAmount > 0) {
          next.lastRaiseAmount = raiseAmount;
          next.minRaise = raiseAmount;
        }
      }
      break;
    }

    case 'ADVANCE_STREET': {
      const currentIdx = STREET_ORDER.indexOf(next.street);
      if (currentIdx < STREET_ORDER.length - 1) {
        next.street = STREET_ORDER[currentIdx + 1];
        // Reset per-street state
        for (const p of next.players) {
          p.currentBet = 0;
        }
        next.lastRaiseAmount = next.bigBlind;
        next.minRaise = next.bigBlind;
      }
      break;
    }

    case 'COLLECT_BETS': {
      next.pot += collectBets(next.players);
      break;
    }

    case 'NEXT_PLAYER': {
      let idx = (next.currentPlayerIndex + 1) % next.players.length;
      let checked = 0;
      while (checked < next.players.length) {
        if (!next.players[idx].folded && !next.players[idx].allIn) {
          break;
        }
        idx = (idx + 1) % next.players.length;
        checked++;
      }
      next.currentPlayerIndex = idx;
      break;
    }

    case 'END_HAND': {
      next.isHandOver = true;
      break;
    }
  }

  return next;
}
