import {
  GameState, GameEvent, GameEventHandler, Player,
  PlayerAction, ValidAction, HandSummary, PlayerResult, Card,
} from './types.js';
import { Deck } from './deck.js';
import { createInitialState, applyAction } from './game-state.js';
import { getValidActions, countPlayersInHand, countActivePlayers } from './betting-round.js';
import { determineWinners } from './hand-rank.js';
import { calculateSidePots } from './pot-manager.js';

export type ActionProvider = (
  playerId: string,
  validActions: ValidAction[],
  state: GameState,
) => Promise<PlayerAction>;

export interface GameLoopConfig {
  players: Player[];
  smallBlind: number;
  bigBlind: number;
  onEvent: GameEventHandler;
  getAction: ActionProvider;
}

export class GameLoop {
  private state!: GameState;
  private deck!: Deck;
  private handNumber = 0;
  private dealerIndex = 0;
  private config: GameLoopConfig;

  constructor(config: GameLoopConfig) {
    this.config = config;
  }

  get currentState(): GameState {
    return this.state;
  }

  /**
   * Play a single hand from start to finish.
   */
  async playHand(): Promise<HandSummary> {
    this.handNumber++;
    this.deck = new Deck();
    this.deck.shuffle();

    // Store chip counts before hand for summary
    const chipsBefore = new Map(this.config.players.map(p => [p.id, p.chips]));

    // Initialize state
    this.state = createInitialState(
      this.config.players,
      this.dealerIndex,
      this.config.smallBlind,
      this.config.bigBlind,
      this.handNumber,
    );

    this.emit({ type: 'HAND_START', players: this.state.players.map(p => ({ ...p })) });

    // Post blinds
    this.state = applyAction(this.state, {
      type: 'POST_BLINDS',
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
    });

    // Deal hole cards
    for (const player of this.state.players) {
      const cards = this.deck.draw(2) as [Card, Card];
      this.state = applyAction(this.state, {
        type: 'DEAL_HOLE_CARDS',
        playerId: player.id,
        cards,
      });
      this.emit({ type: 'CARDS_DEALT', playerId: player.id, cards });
    }

    // Set starting position: after BB for preflop
    const numPlayers = this.state.players.length;
    if (numPlayers === 2) {
      // Heads-up: SB (dealer) acts first preflop
      this.state = { ...this.state, currentPlayerIndex: this.dealerIndex };
    } else {
      // UTG = dealer + 3
      this.state = { ...this.state, currentPlayerIndex: (this.dealerIndex + 3) % numPlayers };
    }

    // Play through streets
    const streets: Array<{ street: string; communityCount: number }> = [
      { street: 'preflop', communityCount: 0 },
      { street: 'flop', communityCount: 3 },
      { street: 'turn', communityCount: 1 },
      { street: 'river', communityCount: 1 },
    ];

    for (const { street, communityCount } of streets) {
      if (this.isHandFinished()) break;

      if (communityCount > 0) {
        // Advance street
        this.state = applyAction(this.state, { type: 'COLLECT_BETS' });
        this.state = applyAction(this.state, { type: 'ADVANCE_STREET' });

        // Deal community cards
        const cards = this.deck.draw(communityCount);
        this.state = applyAction(this.state, { type: 'DEAL_COMMUNITY', cards });
        this.emit({
          type: 'COMMUNITY_CARDS',
          street: this.state.street,
          cards: [...this.state.communityCards],
        });
        this.emit({ type: 'STREET_CHANGE', street: this.state.street });

        // Reset position to first active player after dealer
        this.setFirstPlayerPostFlop();
      }

      // Betting round
      if (countActivePlayers(this.state.players) > 0) {
        await this.runBettingRound();
      }
    }

    // Collect any remaining bets
    this.state = applyAction(this.state, { type: 'COLLECT_BETS' });

    // Determine winners
    const summary = this.resolveHand(chipsBefore);

    // End hand
    this.state = applyAction(this.state, { type: 'END_HAND' });
    this.emit({ type: 'HAND_END', summary });

    // Advance dealer for next hand
    this.advanceDealer();

    // Sync chip counts back to config players
    for (const p of this.state.players) {
      const configPlayer = this.config.players.find(cp => cp.id === p.id);
      if (configPlayer) {
        configPlayer.chips = p.chips;
      }
    }

    return summary;
  }

  private async runBettingRound(): Promise<void> {
    // Find a valid starting player
    this.skipInactivePlayers();

    let lastRaiserIndex = -1;
    let actionsThisRound = 0;
    const numPlayers = this.state.players.length;

    while (true) {
      if (this.isHandFinished()) break;
      if (countActivePlayers(this.state.players) === 0) break;

      const currentPlayer = this.state.players[this.state.currentPlayerIndex];
      if (currentPlayer.folded || currentPlayer.allIn) {
        this.state = applyAction(this.state, { type: 'NEXT_PLAYER' });
        continue;
      }

      // Check if betting round is complete
      if (actionsThisRound >= countActivePlayers(this.state.players) &&
          (lastRaiserIndex === -1 || this.state.currentPlayerIndex === lastRaiserIndex)) {
        break;
      }

      const validActions = getValidActions(this.state);
      if (validActions.length === 0) {
        this.state = applyAction(this.state, { type: 'NEXT_PLAYER' });
        continue;
      }

      // Request action
      this.emit({
        type: 'AWAITING_INPUT',
        playerId: currentPlayer.id,
        validActions,
      });

      const action = await this.config.getAction(
        currentPlayer.id,
        validActions,
        this.state,
      );

      // Apply action
      this.state = applyAction(this.state, {
        type: 'PLAYER_ACTION',
        playerId: currentPlayer.id,
        action,
      });

      this.emit({
        type: 'PLAYER_ACTION',
        playerId: currentPlayer.id,
        action,
      });

      if (action.type === 'raise' || action.type === 'all-in') {
        lastRaiserIndex = this.state.currentPlayerIndex;
        actionsThisRound = 1;
      } else {
        actionsThisRound++;
      }

      // Update pot display
      const sidePots = calculateSidePots(this.state.players);
      const currentPot = this.state.pot + this.state.players.reduce((s, p) => s + p.currentBet, 0);
      this.emit({ type: 'POT_UPDATE', pot: currentPot, sidePots });

      this.state = applyAction(this.state, { type: 'NEXT_PLAYER' });
    }
  }

  private resolveHand(chipsBefore: Map<string, number>): HandSummary {
    const playersInHand = this.state.players.filter(p => !p.folded);

    let winners;
    if (playersInHand.length === 1) {
      // Everyone else folded — last player standing wins
      const winner = playersInHand[0];
      winners = [{
        playerId: winner.id,
        amount: this.state.pot,
        handName: 'Last player standing',
        cards: [],
      }];
      // Award pot
      const statePlayer = this.state.players.find(p => p.id === winner.id)!;
      statePlayer.chips += this.state.pot;
    } else {
      // Showdown
      winners = determineWinners(
        this.state.players,
        this.state.communityCards,
        this.state.pot,
      );

      this.emit({ type: 'SHOWDOWN', winners });

      // Award chips
      for (const w of winners) {
        const statePlayer = this.state.players.find(p => p.id === w.playerId)!;
        statePlayer.chips += w.amount;
      }
    }

    const playerResults: PlayerResult[] = this.state.players.map(p => ({
      playerId: p.id,
      chipsBefore: chipsBefore.get(p.id) ?? 0,
      chipsAfter: p.chips,
      holeCards: p.holeCards,
      folded: p.folded,
    }));

    return {
      handNumber: this.handNumber,
      winners,
      potTotal: this.state.pot,
      communityCards: [...this.state.communityCards],
      playerResults,
    };
  }

  private isHandFinished(): boolean {
    return countPlayersInHand(this.state.players) <= 1;
  }

  private setFirstPlayerPostFlop(): void {
    const numPlayers = this.state.players.length;
    // First active player after dealer
    let idx = (this.dealerIndex + 1) % numPlayers;
    for (let i = 0; i < numPlayers; i++) {
      if (!this.state.players[idx].folded && !this.state.players[idx].allIn) {
        this.state = { ...this.state, currentPlayerIndex: idx };
        return;
      }
      idx = (idx + 1) % numPlayers;
    }
  }

  private skipInactivePlayers(): void {
    const current = this.state.players[this.state.currentPlayerIndex];
    if (current.folded || current.allIn) {
      this.state = applyAction(this.state, { type: 'NEXT_PLAYER' });
    }
  }

  private advanceDealer(): void {
    const numPlayers = this.config.players.length;
    this.dealerIndex = (this.dealerIndex + 1) % numPlayers;
  }

  private emit(event: GameEvent): void {
    this.config.onEvent(event);
  }
}
