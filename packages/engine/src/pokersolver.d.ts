declare module 'pokersolver' {
  interface SolvedHand {
    name: string;
    descr: string;
    rank: number;
    cards: unknown[];
  }

  interface HandConstructor {
    solve(cards: string[]): SolvedHand;
    winners(hands: SolvedHand[]): SolvedHand[];
  }

  const Hand: HandConstructor;
  export default { Hand };
}
