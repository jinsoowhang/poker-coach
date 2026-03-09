// ── Card primitives ──

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

// ── Player ──

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: [Card, Card] | null;
  currentBet: number;
  totalBetThisRound: number;
  folded: boolean;
  allIn: boolean;
  seatIndex: number;
  isHuman: boolean;
}

// ── Betting ──

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface PlayerAction {
  type: ActionType;
  amount: number;
}

export interface ValidAction {
  type: ActionType;
  minAmount?: number;
  maxAmount?: number;
}

// ── Streets ──

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// ── Pot ──

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

// ── Game state ──

export interface GameState {
  handNumber: number;
  players: Player[];
  communityCards: Card[];
  street: Street;
  pot: number;
  sidePots: SidePot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  lastRaiseAmount: number;
  minRaise: number;
  isHandOver: boolean;
}

// ── Events ──

export interface HandWinner {
  playerId: string;
  amount: number;
  handName: string;
  cards: Card[];
}

export interface HandSummary {
  handNumber: number;
  winners: HandWinner[];
  potTotal: number;
  communityCards: Card[];
  playerResults: PlayerResult[];
}

export interface PlayerResult {
  playerId: string;
  chipsBefore: number;
  chipsAfter: number;
  holeCards: [Card, Card] | null;
  folded: boolean;
}

export type GameEvent =
  | { type: 'HAND_START'; players: Player[] }
  | { type: 'CARDS_DEALT'; playerId: string; cards: [Card, Card] }
  | { type: 'COMMUNITY_CARDS'; street: Street; cards: Card[] }
  | { type: 'PLAYER_ACTION'; playerId: string; action: PlayerAction }
  | { type: 'SHOWDOWN'; winners: HandWinner[] }
  | { type: 'HAND_END'; summary: HandSummary }
  | { type: 'AWAITING_INPUT'; playerId: string; validActions: ValidAction[] }
  | { type: 'POT_UPDATE'; pot: number; sidePots: SidePot[] }
  | { type: 'STREET_CHANGE'; street: Street };

export type GameEventHandler = (event: GameEvent) => void;

// ── AI ──

export type AiPersonalityType = 'TAG' | 'LAG' | 'TP' | 'LP';

export interface AiPersonality {
  type: AiPersonalityType;
  name: string;
  vpip: number;         // voluntarily put in pot % (hand range width)
  aggression: number;   // 0-1 scale, tendency to raise vs call
  bluffFrequency: number; // 0-1 scale
  speedModifier: number;  // 0.7 = fast, 1.0 = normal, 1.3 = slow
}

export interface AiDecision {
  action: PlayerAction;
  reasoning: string;
}
