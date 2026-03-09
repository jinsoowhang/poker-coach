import { Card } from './types.js';
import { createDeck } from './card.js';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = createDeck();
  }

  /** Fisher-Yates shuffle. */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /** Draw n cards from top of deck. Throws if not enough cards. */
  draw(n: number = 1): Card[] {
    if (n > this.cards.length) {
      throw new Error(`Cannot draw ${n} cards, only ${this.cards.length} remaining`);
    }
    return this.cards.splice(0, n);
  }

  /** Number of cards remaining. */
  get remaining(): number {
    return this.cards.length;
  }

  /** Reset to a fresh 52-card deck (unshuffled). */
  reset(): void {
    this.cards = createDeck();
  }

  /** Return copy of remaining cards (for odds calculations). */
  peek(): Card[] {
    return [...this.cards];
  }
}
