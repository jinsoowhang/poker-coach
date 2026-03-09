import { Player, SidePot } from './types.js';

/**
 * Calculate side pots from player bets when all-ins are involved.
 *
 * Algorithm: sort players by total bet ascending, then create pots
 * layer by layer. Each layer is the difference from the previous
 * level, multiplied by the number of eligible players.
 */
export function calculateSidePots(players: Player[]): SidePot[] {
  const activePlayers = players
    .filter(p => p.totalBetThisRound > 0)
    .sort((a, b) => a.totalBetThisRound - b.totalBetThisRound);

  if (activePlayers.length === 0) return [];

  const pots: SidePot[] = [];
  let previousLevel = 0;

  for (let i = 0; i < activePlayers.length; i++) {
    const currentLevel = activePlayers[i].totalBetThisRound;
    const layerAmount = currentLevel - previousLevel;

    if (layerAmount <= 0) continue;

    // All players who bet >= currentLevel are eligible
    const eligiblePlayerIds = activePlayers
      .filter(p => p.totalBetThisRound >= currentLevel)
      .map(p => p.id);

    // Include non-folded players who bet at this level
    // But also count the folded players' contributions
    const eligibleCount = activePlayers.filter(p => p.totalBetThisRound >= currentLevel).length;
    const potAmount = layerAmount * eligibleCount;

    // Only non-folded players can win
    const winnableBy = eligiblePlayerIds.filter(id => {
      const player = players.find(p => p.id === id);
      return player && !player.folded;
    });

    pots.push({
      amount: potAmount,
      eligiblePlayerIds: winnableBy,
    });

    previousLevel = currentLevel;
  }

  // Merge pots with identical eligible players
  const merged: SidePot[] = [];
  for (const pot of pots) {
    const existing = merged.find(
      m => m.eligiblePlayerIds.length === pot.eligiblePlayerIds.length &&
           m.eligiblePlayerIds.every(id => pot.eligiblePlayerIds.includes(id)),
    );
    if (existing) {
      existing.amount += pot.amount;
    } else {
      merged.push({ ...pot });
    }
  }

  return merged;
}

/**
 * Collect bets from all players into the pot, returning the total.
 */
export function collectBets(players: Player[]): number {
  let total = 0;
  for (const player of players) {
    total += player.currentBet;
    player.currentBet = 0;
  }
  return total;
}
