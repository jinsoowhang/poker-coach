import type { Player, Card } from '@poker-coach/engine';
import { PokerTable } from '../PokerTable';
import type { Scenario, ScenarioSeat } from '../../data/scenarios';

/** Dummy face-down card for opponents — never shown face-up. */
const HIDDEN: Card = { rank: '2', suit: 'clubs' };

function seatToPlayer(seat: ScenarioSeat, index: number, heroCards: [Card, Card]): Player {
  const isHero = seat.isHero === true;
  const folded = seat.status === 'folded';
  return {
    id: `seat-${index}`,
    name: seat.name ?? seat.position,
    chips: seat.stack,
    holeCards: folded ? null : isHero ? heroCards : [HIDDEN, HIDDEN],
    currentBet: seat.betAmount ?? 0,
    totalBetThisRound: seat.betAmount ?? 0,
    folded,
    allIn: false,
    seatIndex: index,
    isHuman: isHero,
  };
}

export function ScenarioTable({ scenario }: { scenario: Scenario }) {
  const players: Player[] = scenario.seats.map((s, i) => seatToPlayer(s, i, scenario.heroCards));
  const heroIndex = scenario.seats.findIndex((s) => s.isHero);

  return (
    <PokerTable
      players={players}
      communityCards={scenario.communityCards}
      pot={scenario.pot}
      dealerIndex={-1}
      currentPlayerIndex={heroIndex}
      showdown={false}
      isHandOver={false}
      winners={[]}
      thinkingPlayerId={null}
      awaitingInput={false}
      localPlayerId={`seat-${heroIndex}`}
    />
  );
}
