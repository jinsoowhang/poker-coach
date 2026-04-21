import type { Card } from '@poker-coach/engine';

export type Position = 'UTG' | 'UTG+1' | 'MP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ScenarioCategory = 'preflop-opens' | 'isolation' | 'spr-commitment';

export type SeatStatus = 'active' | 'limped' | 'folded' | 'raised';

export interface ScenarioSeat {
  position: Position;
  stack: number;
  status: SeatStatus;
  betAmount?: number;
  isHero?: boolean;
  name?: string;
}

export interface ScenarioChoice {
  label: string;
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  amount?: number;
  /** 1–2 sentence reasoning shown after the answer: why this choice is right or wrong. */
  reasoning?: string;
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  difficulty: 1 | 2 | 3;
  title: string;
  narrative: string;
  stakes: { sb: number; bb: number };
  effectiveStack: number;
  heroPosition: Position;
  heroCards: [Card, Card];
  /** Seats listed clockwise starting from hero. */
  seats: ScenarioSeat[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  choices: ScenarioChoice[];
  correctIndex: number;
  explanation: string;
  concepts: string[];
}

export const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  'preflop-opens': 'Preflop Opens by Position',
  'isolation': 'Isolation Over Limpers',
  'spr-commitment': 'SPR Commitment',
};

export const CATEGORY_BLURBS: Record<ScenarioCategory, string> = {
  'preflop-opens':
    'When should you open-raise? Learn how position dictates range width — tighter early, wider late.',
  'isolation':
    'Limpers everywhere. Should you iso-raise, overlimp, or fold? Master sizing: 3BB + 1BB per limper.',
  'spr-commitment':
    'Stack-to-Pot Ratio decides commitment. Low SPR (≤3): commit with top pair. High SPR (≥9): need monsters.',
};

// ── Card shorthand ──
const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

// ────────────────────────────────────────────────────────────────────────────
// Category A — Preflop Opens by Position (8)
// ────────────────────────────────────────────────────────────────────────────

const A1: Scenario = {
  id: 'preflop-opens-01',
  category: 'preflop-opens',
  difficulty: 1,
  title: 'UTG with QJo',
  narrative:
    "9-handed $1/$2 live. You're UTG with $200 effective. Action folds to you first. Everyone behind is still to act. What's your play?",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'UTG',
  heroCards: [c('Q', 'spades'), c('J', 'hearts')],
  seats: [
    { position: 'UTG', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'UTG+1', stack: 200, status: 'active' },
    { position: 'MP', stack: 200, status: 'active' },
    { position: 'LJ', stack: 200, status: 'active' },
    { position: 'HJ', stack: 200, status: 'active' },
    { position: 'CO', stack: 200, status: 'active' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Correct. Tight UTG opening ranges are math-backed — skipping marginal spots from the worst position preserves EV." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping telegraphs weakness and invites 4–5 way pots where QJo is dominated by every better broadway." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "Opens a hand that's dominated by every UTG+1 through BB call-3-bet range (AA–JJ, AK, AQ, KQ)." },
    { label: 'Raise to $10', action: 'raise', amount: 10, reasoning: "Larger sizing doesn't help — still opens a dominated hand from the worst position with 6 players behind." },
  ],
  correctIndex: 0,
  explanation:
    "**Fold.** A standard UTG opening range in 9-handed is around 12–15% of hands — premium pairs, strong broadways, and suited aces. **QJo is outside that range.** With 6 players left to act, QJo is dominated by KJ/QK/AJ/AQ and plays poorly out of position in multiway pots. Limping is worse than raising: you invite everyone into the pot with no initiative. The strongest line is to tighten up from early position and wait for a spot with positional or hand advantage.",
  concepts: ['Position', 'Opening ranges', 'Domination'],
};

const A2: Scenario = {
  id: 'preflop-opens-02',
  category: 'preflop-opens',
  difficulty: 1,
  title: 'MP with AQo',
  narrative:
    "9-handed $1/$2. You're in MP with $200 effective. UTG and UTG+1 both fold. Action is on you. What's the play?",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'MP',
  heroCards: [c('A', 'clubs'), c('Q', 'diamonds')],
  seats: [
    { position: 'MP', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'LJ', stack: 200, status: 'active' },
    { position: 'HJ', stack: 200, status: 'active' },
    { position: 'CO', stack: 200, status: 'active' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'UTG+1', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Way too tight. AQo is top of any MP opening range — folding premiums is a significant leak." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping forfeits initiative and lets everyone see a cheap flop against your hand advantage." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "Correct. Standard 3BB open — AQo dominates most offsuit broadways and plays well heads-up." },
  ],
  correctIndex: 2,
  explanation:
    "**Raise to $6 (3BB).** AQo is a premium hand — top of the MP opening range. You dominate AJ, AT, KQ, and flip or beat many small pairs. **Open-raising builds the pot with a hand that performs well heads-up.** Limping forfeits initiative and invites multiway pots where AQo's equity deteriorates. Standard 3BB open. Some players open smaller (2.5BB) but 3BB is the canonical size live.",
  concepts: ['Position', 'Opening ranges', 'Value'],
};

const A3: Scenario = {
  id: 'preflop-opens-03',
  category: 'preflop-opens',
  difficulty: 1,
  title: 'CO with KTs',
  narrative:
    "6-handed $1/$2 online. You're in the CO with $200. Everyone folds to you. What's your play?",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'CO',
  heroCards: [c('K', 'hearts'), c('10', 'hearts')],
  seats: [
    { position: 'CO', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "KTs is comfortably inside a 26% CO opening range. Folding it is way too tight." },
    { label: 'Raise to $5', action: 'raise', amount: 5, reasoning: "Correct. Standard 2.5BB CO open. Suited broadway with flush and straight potential, only 3 players behind." },
    { label: 'Raise to $14', action: 'raise', amount: 14, reasoning: "Massively oversized. Folds out everything worse and bloats the pot without building value." },
  ],
  correctIndex: 1,
  explanation:
    "**Raise to $5 (2.5BB).** KTs is a strong suited broadway — well within a CO opening range (~26% 6-max). Only 3 players left to act. **Raising is standard; folding KTs from the CO is way too tight.** The smaller sizing (2.5BB) is preferred online — cheaper when called, same fold equity. The $14 sizing is massively overplayed for a non-premium.",
  concepts: ['Position', 'Opening ranges', 'Sizing'],
};

const A4: Scenario = {
  id: 'preflop-opens-04',
  category: 'preflop-opens',
  difficulty: 2,
  title: 'BTN with 65s',
  narrative:
    "6-handed $1/$2. You're on the BTN with $200. Folds around to you. The blinds are reasonable regs. Your move?",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'BTN',
  heroCards: [c('6', 'diamonds'), c('5', 'diamonds')],
  seats: [
    { position: 'BTN', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "BTN opens ~45% of hands — 65s is in every reasonable chart. Folding is far too tight." },
    { label: 'Raise to $5', action: 'raise', amount: 5, reasoning: "Correct. Prime steal hand: fold equity + positional advantage + implied odds when you connect." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping BTN forfeits steal equity and tips off a weak range to the blinds." },
  ],
  correctIndex: 1,
  explanation:
    "**Raise to $5.** 65s is a prime BTN steal hand — it plays excellent postflop with position, flops equity often (pairs, draws, straights), and folding would be far too tight (BTN opens ~45% of hands). **Steal equity + positional advantage + implied odds when you connect = raise.** Limping is a leak: you telegraph a weak range and lose the fold equity of the raise.",
  concepts: ['Position', 'Suited connectors', 'Steal equity'],
};

const A5: Scenario = {
  id: 'preflop-opens-05',
  category: 'preflop-opens',
  difficulty: 2,
  title: 'SB folded to with AQo',
  narrative:
    "6-handed $1/$2. Folds around to you in the SB with $200. Just the BB left behind. You have AQo.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'SB',
  heroCards: [c('A', 'spades'), c('Q', 'clubs')],
  seats: [
    { position: 'SB', stack: 199, status: 'active', betAmount: 1, isHero: true, name: 'You' },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
    { position: 'BTN', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding AQo in SB vs BB is burning money — it's at the top of any reasonable SB open range." },
    { label: 'Complete to $2', action: 'call', amount: 1, reasoning: "Completing keeps the pot small when your hand wants to build and surrenders initiative OOP." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "3BB is online-standard but slightly small OOP vs. BB's wide defense range — bigger is better here." },
    { label: 'Raise to $8', action: 'raise', amount: 8, reasoning: "Correct. 4x open punishes BB's wide defense and compensates for playing out-of-position postflop." },
  ],
  correctIndex: 3,
  explanation:
    "**Raise to $8 (3–4BB).** AQo is way too strong to complete or fold. SB vs. BB is a heads-up fight where you're **always out of position postflop** — which is why SB open sizes are larger than late-position opens (3.5–4BB is standard vs. just the BB). The bigger size builds a pot with your hand advantage and punishes the BB's wide defensive range. Completing (limping) surrenders initiative and creates small pots where your edge is thinnest.",
  concepts: ['Blind play', 'Sizing', 'Out-of-position'],
};

const A6: Scenario = {
  id: 'preflop-opens-06',
  category: 'preflop-opens',
  difficulty: 2,
  title: 'UTG with A8o',
  narrative:
    "9-handed $1/$2 live. UTG with $200 effective. First to act after the blinds.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'UTG',
  heroCards: [c('A', 'diamonds'), c('8', 'clubs')],
  seats: [
    { position: 'UTG', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'UTG+1', stack: 200, status: 'active' },
    { position: 'MP', stack: 200, status: 'active' },
    { position: 'LJ', stack: 200, status: 'active' },
    { position: 'HJ', stack: 200, status: 'active' },
    { position: 'CO', stack: 200, status: 'active' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Correct. A8o is dominated by every better ace — a classic trap hand from the worst position." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "Opens a hand that's dominated by ATo+ and gets 3-bet off by AQ+/KK+. Negative EV multiway." },
    { label: 'Raise to $10', action: 'raise', amount: 10, reasoning: "Bigger pot with a reverse-implied-odds hand — the sizing makes the leak worse, not better." },
  ],
  correctIndex: 0,
  explanation:
    "**Fold.** A8o is a **trap ace** — it's an ace that looks pretty but is dominated by every better ace that calls or 3-bets you (AT, AJ, AQ, AK). From UTG in 9-max, you're in the worst possible seat with this type of hand: 7 players left to act, and any opponent who plays back has you crushed. When you hit a weak top pair, you can't tell if you're ahead. Offsuit aces below ATo are almost always folds from UTG.",
  concepts: ['Position', 'Domination', 'Trap hands'],
};

const A7: Scenario = {
  id: 'preflop-opens-07',
  category: 'preflop-opens',
  difficulty: 1,
  title: 'BTN with 22, folded to',
  narrative:
    "6-handed $1/$2 online. Folds to you on the BTN with $200. Two blinds left to act. You have pocket deuces.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'BTN',
  heroCards: [c('2', 'hearts'), c('2', 'spades')],
  seats: [
    { position: 'BTN', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding pocket pairs folded-to on the BTN is a huge leak — you lose set-mine equity and steal equity." },
    { label: 'Raise to $5', action: 'raise', amount: 5, reasoning: "Correct. Steal equity + ~12% set-flop chance + position = print money. Never limp 22 folded-to BTN." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping surrenders fold equity from the blinds and signals a weak range." },
  ],
  correctIndex: 1,
  explanation:
    "**Raise to $5.** Pocket pairs play great from the BTN because you **flop a set ~12% of the time** with huge implied odds at 100BB deep. On top of that, you have steal equity: the blinds fold a lot to BTN opens. Raising wins the pot preflop often, realizes equity well in position when called, and gets paid when you hit. Limping is a leak here — it's only right in multiway spots with many limpers already in (see the isolation category).",
  concepts: ['Position', 'Set mining', 'Steal equity'],
};

const A8: Scenario = {
  id: 'preflop-opens-08',
  category: 'preflop-opens',
  difficulty: 1,
  title: 'CO with AJs',
  narrative:
    "6-handed $1/$2 online. You're CO with $200 effective. UTG and MP fold. Action to you.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'CO',
  heroCards: [c('A', 'spades'), c('J', 'spades')],
  seats: [
    { position: 'CO', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 3,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "AJs is far too strong to fold — it's premium in the CO, dominates most calling ranges." },
    { label: 'Raise to $5', action: 'raise', amount: 5, reasoning: "Correct. Standard 2.5BB open. Suited broadway with nut flush + straight potential." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping a premium wastes hand advantage. You play for stacks with AJs — build the pot." },
  ],
  correctIndex: 1,
  explanation:
    "**Raise to $5 (2.5BB).** AJs is a premium CO opening hand — suited, connected, and an ace-high holding with both nut flush and broadway straight potential. It's far too strong to fold or limp. **Standard 2.5BB open.** If BTN 3-bets you'll have to decide based on reads, but preflop, opening is automatic.",
  concepts: ['Position', 'Opening ranges', 'Suited broadways'],
};

// ────────────────────────────────────────────────────────────────────────────
// Category B — Isolation Over Limpers (8)
// ────────────────────────────────────────────────────────────────────────────

const B1: Scenario = {
  id: 'isolation-01',
  category: 'isolation',
  difficulty: 1,
  title: 'CO with AJo, 3 limpers',
  narrative:
    "9-handed $1/$2 live. UTG, MP, and HJ all limp. Action folds to you in the CO with $200 and AJo.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'CO',
  heroCards: [c('A', 'clubs'), c('J', 'diamonds')],
  seats: [
    { position: 'CO', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'MP', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'HJ', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 9,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding AJo here is far too tight — you crush the limpers' ranges and want the pot." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Overlimping kills hand advantage; AJo multiway 5-ways flops second-best top pair constantly." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "Mini-raise doesn't fold limpers — pot bloats multiway with AJo still at equity risk." },
    { label: 'Raise to $12', action: 'raise', amount: 12, reasoning: "Correct. 3BB + 1BB per limper = 6BB iso. Gets heads-up with position + hand advantage." },
  ],
  correctIndex: 3,
  explanation:
    "**Raise to $12 (iso).** The isolation sizing heuristic is **3BB + 1BB per limper** = 3 + 3 = 6BB = $12. With AJo you want to play **heads-up in position** — multiway, AJo's equity collapses against the limpers' connected suited hands. Limping behind turns AJo into a hand that will often see 5-way flops where top pair is second-best. The $6 mini-raise doesn't fold anyone; it just bloats the pot multiway. **Iso big, take it down now, or get HU with position.**",
  concepts: ['Isolation', 'Multiway', 'Sizing'],
};

const B2: Scenario = {
  id: 'isolation-02',
  category: 'isolation',
  difficulty: 2,
  title: 'BTN with AKs, 2 limpers',
  narrative:
    "6-handed $1/$2 online. HJ and CO both limp. Folds to you on BTN with $200 and AKs.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'BTN',
  heroCards: [c('A', 'hearts'), c('K', 'hearts')],
  seats: [
    { position: 'BTN', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'HJ', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'CO', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 7,
  currentBet: 2,
  choices: [
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Limping AKs is a massive leak — surrenders fold equity + plays premium hand multiway without initiative." },
    { label: 'Raise to $6', action: 'raise', amount: 6, reasoning: "Too small — limpers call with everything and AKs sees 4-way flops missing 2/3 of the time." },
    { label: 'Raise to $10', action: 'raise', amount: 10, reasoning: "Correct. 5BB iso (3 + 1 per limper + kicker) punishes limpers and isolates HU with position." },
    { label: 'Raise to $16', action: 'raise', amount: 16, reasoning: "Overbet that folds everyone out. Wins $5 instead of the $30+ pots AKs wants to build." },
  ],
  correctIndex: 2,
  explanation:
    "**Raise to $10 (5BB).** Formula: 3BB + 1BB per limper + maybe 1BB to punish dead money = ~5BB = $10. **AKs is a top-tier value hand** that wants to get heads-up in position with initiative. Limping behind with AKs is a massive leak — you surrender fold equity, let the blinds see a cheap flop with trash, and give up a hand that performs best when it's the preflop aggressor. $16 is too large; $6 is too small to fold out the limpers' weak hands.",
  concepts: ['Isolation', 'Premium hands', 'Sizing'],
};

const B3: Scenario = {
  id: 'isolation-03',
  category: 'isolation',
  difficulty: 2,
  title: 'MP with K9o, 4 limpers (trick)',
  narrative:
    "9-handed $1/$2 live. UTG limps. You're in MP with $200 and K9o. Action on you — and you know 3 more players behind like to limp along.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'MP',
  heroCards: [c('K', 'clubs'), c('9', 'diamonds')],
  seats: [
    { position: 'MP', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'LJ', stack: 200, status: 'active' },
    { position: 'HJ', stack: 200, status: 'active' },
    { position: 'CO', stack: 200, status: 'active' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'UTG+1', stack: 200, status: 'folded' },
  ],
  communityCards: [],
  pot: 5,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Correct. Dominated trap OOP with 4+ players behind in a loose limping table — save your money." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "The classic K9o trap: flops top pair into worse kickers multiway OOP. Reverse implied odds." },
    { label: 'Raise to $12', action: 'raise', amount: 12, reasoning: "Iso-raising K9o for value is fantasy — you only get action from hands that crush you." },
  ],
  correctIndex: 0,
  explanation:
    "**Fold.** K9o is a **dominated trap hand** — every better king (KT+, KQ, AK) crushes it, and you're out of position with 4 players left plus a loose limping table behind you. Limping behind is the classic trap: you're rarely ahead when you flop top pair, and you can't iso-raise for value because K9o doesn't want action. **Folding seems tight but it's correct.** The EV of playing K9o multiway OOP against better kings is negative.",
  concepts: ['Domination', 'Multiway', 'Out-of-position'],
};

const B4: Scenario = {
  id: 'isolation-04',
  category: 'isolation',
  difficulty: 2,
  title: 'CO with 76s, 1 limper',
  narrative:
    "6-handed $1/$2 online. MP limps. Folds to you in the CO with $200 and 76s.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'CO',
  heroCards: [c('7', 'hearts'), c('6', 'hearts')],
  seats: [
    { position: 'CO', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 5,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Way too tight. 76s has huge playability and iso-raising vs. weak limp ranges is strictly +EV." },
    { label: 'Limp $2', action: 'call', amount: 2, reasoning: "Overlimping is OK but worse — forgoes fold equity and doesn't build pot for implied odds." },
    { label: 'Raise to $8', action: 'raise', amount: 8, reasoning: "Correct. 3BB + 1BB per limper = 4BB iso. Builds pot, takes position, applies fold pressure." },
  ],
  correctIndex: 2,
  explanation:
    "**Raise to $8 (4BB).** 3BB + 1BB per limper = 4BB = $8. 76s is a strong **equity + playability** holding — it flops pairs, open-enders, and flush draws constantly. Iso-raising does two jobs: it **builds a pot for when you hit** (implied odds), and it **punishes MP's weak limp range** with fold equity. Overlimping is acceptable but strictly worse here — it turns a profitable hand into a small-pot breakeven. Folding is way too tight.",
  concepts: ['Isolation', 'Suited connectors', 'Implied odds'],
};

const B5: Scenario = {
  id: 'isolation-05',
  category: 'isolation',
  difficulty: 3,
  title: 'BTN with 55, 2 limpers',
  narrative:
    "6-handed $1/$2 online. HJ and CO limp. You're on the BTN with $200 and 55. SB/BB are tight regs.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'BTN',
  heroCards: [c('5', 'clubs'), c('5', 'diamonds')],
  seats: [
    { position: 'BTN', stack: 200, status: 'active', isHero: true, name: 'You' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'HJ', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'CO', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 7,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding a pocket pair with ~40x implied odds is throwing away a profitable set-mine spot." },
    { label: 'Overlimp $2', action: 'call', amount: 2, reasoning: "Correct. Cheap set-mine in a multiway pot — 12% flop chance + 100BB deep = max EV." },
    { label: 'Raise to $10', action: 'raise', amount: 10, reasoning: "Iso-raising 55 bloats pot with a hand that whiffs 88% of flops and gets 3-bet off by blinds." },
    { label: 'Raise to $16', action: 'raise', amount: 16, reasoning: "Overkill size that invites squeezes from blinds. Small pair wants cheap multiway flops." },
  ],
  correctIndex: 1,
  explanation:
    "**Overlimp $2.** This is the classic exception to iso-raising. Small pocket pairs like 55 want to **see a cheap flop in a multiway pot** to hit a set (~12% of the time) and stack someone. With $200 effective you have ~40x implied odds — excellent for set-mining. Iso-raising 55 does two bad things: (1) gets 3-bet off your hand by the blinds often, (2) bloats the pot with a hand that whiffs the flop 88% of the time. **Set-mine cheap, pay off once.**",
  concepts: ['Set mining', 'Implied odds', 'Multiway'],
};

const B6: Scenario = {
  id: 'isolation-06',
  category: 'isolation',
  difficulty: 3,
  title: 'SB with AQs, 1 limper',
  narrative:
    "6-handed $1/$2 live. MP limps, folds around to you in the SB with $200 and AQs.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'SB',
  heroCards: [c('A', 'diamonds'), c('Q', 'diamonds')],
  seats: [
    { position: 'SB', stack: 199, status: 'active', betAmount: 1, isHero: true, name: 'You' },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'HJ', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
    { position: 'BTN', stack: 200, status: 'folded' },
    { position: 'MP', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 5,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding AQs to a single limper is throwing money away — it crushes the limp range." },
    { label: 'Complete $1', action: 'call', amount: 1, reasoning: "Completing with AQs forfeits your hand advantage and surrenders initiative OOP." },
    { label: 'Raise to $10', action: 'raise', amount: 10, reasoning: "A bit small for OOP — doesn't create enough fold equity against BB's wide defense." },
    { label: 'Raise to $14', action: 'raise', amount: 14, reasoning: "Correct. 7BB iso — oversized to compensate for OOP play + builds pot with premium." },
  ],
  correctIndex: 3,
  explanation:
    "**Raise to $14 (7BB).** From the SB with a limper in, use a **bigger iso size** to compensate for being out of position: ~3BB + 1BB per limper + ~2BB OOP premium = 6–7BB. AQs is a clear iso — it dominates MP's limp range and crushes BB's defense range. Completing is a blunder with AQs; you surrender both your hand advantage and your initiative. OOP, you **need fold equity** — the big size creates it.",
  concepts: ['Isolation', 'Out-of-position', 'Sizing'],
};

const B7: Scenario = {
  id: 'isolation-07',
  category: 'isolation',
  difficulty: 3,
  title: 'BB with JJ, 3 limpers',
  narrative:
    "9-handed $1/$2 live. UTG, MP, and CO all limp. SB folds. Action to you in the BB with $200 and pocket jacks.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 200,
  heroPosition: 'BB',
  heroCards: [c('J', 'clubs'), c('J', 'hearts')],
  seats: [
    { position: 'BB', stack: 198, status: 'active', betAmount: 2, isHero: true, name: 'You' },
    { position: 'UTG', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'UTG+1', stack: 200, status: 'folded' },
    { position: 'MP', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'LJ', stack: 200, status: 'folded' },
    { position: 'HJ', stack: 200, status: 'folded' },
    { position: 'CO', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'BTN', stack: 200, status: 'folded' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
  ],
  communityCards: [],
  pot: 9,
  currentBet: 2,
  choices: [
    { label: 'Check', action: 'check', reasoning: "Checking JJ with 3 limpers is a disaster — you get 4-way flops with a one-pair hand and reverse implied odds." },
    { label: 'Raise to $8', action: 'raise', amount: 8, reasoning: "Mini-raise doesn't fold anyone. Still multiway with JJ — exactly what you're trying to avoid." },
    { label: 'Raise to $18', action: 'raise', amount: 18, reasoning: "Correct. 9BB squeeze punishes dead money, folds speculative hands, isolates to HU." },
    { label: 'Raise to $35', action: 'raise', amount: 35, reasoning: "Overbet folds everyone out. Wins $9 when you could build a $50+ pot with JJ as favorite." },
  ],
  correctIndex: 2,
  explanation:
    "**Raise to $18 (9BB).** 3BB + 1BB per limper = 6BB baseline; from the BB with a big pair and 3 limpers, add more to **punish the dead money and fold out speculative hands**. JJ is a huge equity favorite but plays terribly multiway — you **need to fold 1–2 players out** or JJ becomes a one-pair hand in a 4-way bloated pot with bad reverse implied odds. Checking is a trap; small raises ($8) don't fold anyone and bloat the multiway disaster. $35 is overbet territory — too easy to fold out everything and win only $9.",
  concepts: ['Isolation', 'Big pairs multiway', 'Sizing'],
};

const B8: Scenario = {
  id: 'isolation-08',
  category: 'isolation',
  difficulty: 2,
  title: 'CO with 44, 4 limpers',
  narrative:
    "9-handed $1/$2 live. UTG, UTG+1, MP, and HJ all limp, and you're in the CO with $250 and 44. One player behind (BTN) plus blinds still to act.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 250,
  heroPosition: 'CO',
  heroCards: [c('4', 'spades'), c('4', 'diamonds')],
  seats: [
    { position: 'CO', stack: 250, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'active' },
    { position: 'SB', stack: 199, status: 'active', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 2 },
    { position: 'UTG', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'UTG+1', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'MP', stack: 198, status: 'limped', betAmount: 2 },
    { position: 'LJ', stack: 200, status: 'folded' },
    { position: 'HJ', stack: 198, status: 'limped', betAmount: 2 },
  ],
  communityCards: [],
  pot: 9,
  currentBet: 2,
  choices: [
    { label: 'Fold', action: 'fold', reasoning: "Folding 44 with massive implied odds against 3 limpers is throwing money away." },
    { label: 'Overlimp $2', action: 'call', amount: 2, reasoning: "Correct. Multiway limped pot + cheap set-mine + 125x implied odds = max EV. Hit 12%, print." },
    { label: 'Raise to $14', action: 'raise', amount: 14, reasoning: "Iso-raising 44 for value is a mistake — gets called by broadways and loses the multiway set-mine edge." },
  ],
  correctIndex: 1,
  explanation:
    "**Overlimp $2.** You're getting **125:1 implied odds** against 3 limpers and will flop a set ~12% of the time. Overlimping is the textbook play for small/medium pocket pairs in multiway limped pots: cheap, high EV when you hit, easy to fold when you miss. Iso-raising 44 for value doesn't make sense — you'll get called by everyone's broadways and junk, and multiway you're a coin flip or worse. **When the pot's already 4-way, set-mine; don't bloat.**",
  concepts: ['Set mining', 'Implied odds', 'Multiway'],
};

// ────────────────────────────────────────────────────────────────────────────
// Category C — SPR Commitment Decisions (8)
// ────────────────────────────────────────────────────────────────────────────

const C1: Scenario = {
  id: 'spr-commitment-01',
  category: 'spr-commitment',
  difficulty: 2,
  title: 'SPR 2.6, TPTK on dry ace-high',
  narrative:
    "6-handed $1/$2. You raised CO to $6, BTN called. Pot $15. You have $55 behind, so does BTN (started $61 effective). Flop: A♦ 7♣ 2♠. You have A♠ 9♥. Action on you.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 55,
  heroPosition: 'CO',
  heroCards: [c('A', 'spades'), c('9', 'hearts')],
  seats: [
    { position: 'CO', stack: 55, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 55, status: 'active' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'folded', betAmount: 2 },
  ],
  communityCards: [c('A', 'diamonds'), c('7', 'clubs'), c('2', 'spades')],
  pot: 15,
  currentBet: 0,
  choices: [
    { label: 'Check (pot control)', action: 'check', reasoning: "Passive — lets BTN realize backdoor equity cheaply. At low SPR with TPTK you want aggression, not pot control." },
    { label: 'Bet $10 small', action: 'raise', amount: 10, reasoning: "Invites floats. At SPR 2.6 you want sizing that commits stacks by the turn, not small streets." },
    { label: 'Bet $20 and plan to stack off', action: 'raise', amount: 20, reasoning: "Correct. ~130% pot builds toward commitment by turn. TPTK at low SPR is a stack-off hand." },
    { label: 'Shove $55', action: 'all-in', amount: 55, reasoning: "Overbet folds out worse and only gets called by better. Burns value for zero gain." },
  ],
  correctIndex: 2,
  explanation:
    "**Bet $20 and commit.** SPR = 55/15 ≈ **2.6 (low)**. On low SPR, **top pair top kicker is a commit hand** — you should plan to get stacks in on this street or the turn. A dry ace-high board hits your CO range hard; BTN's flatting range has fewer aces than yours. Check is passive and lets BTN realize equity cheaply with backdoor draws. The $10 small bet isn't bad but it invites floats; $20 builds the pot at a pace where stacks go in by the turn. Shoving is overkill — you fold out worse and only get called by better.",
  concepts: ['SPR', 'Commitment', 'TPTK'],
};

const C2: Scenario = {
  id: 'spr-commitment-02',
  category: 'spr-commitment',
  difficulty: 3,
  title: 'SPR 2, nut flush draw + overcards',
  narrative:
    "6-handed $1/$2. You opened BTN to $6, BB called. Pot $13. Eff stack $25 behind. Flop: K♥ Q♥ 3♦. BB checks. You have A♥ J♥ (nut flush draw + inside straight draw + overcard).",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 25,
  heroPosition: 'BTN',
  heroCards: [c('A', 'hearts'), c('J', 'hearts')],
  seats: [
    { position: 'BTN', stack: 25, status: 'active', isHero: true, name: 'You' },
    { position: 'BB', stack: 25, status: 'active' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
  ],
  communityCards: [c('K', 'hearts'), c('Q', 'hearts'), c('3', 'diamonds')],
  pot: 13,
  currentBet: 0,
  choices: [
    { label: 'Check (free card)', action: 'check', reasoning: "Wastes 15 outs of semi-bluff equity. Passive at low SPR with a monster draw is leaving money on the table." },
    { label: 'Bet $6 small', action: 'raise', amount: 6, reasoning: "Commits you on the turn anyway. Might as well shove now for maximum fold equity + stack-off plan." },
    { label: 'Shove $25', action: 'all-in', amount: 25, reasoning: "Correct. ~54% raw equity + fold equity vs. weak pairs and gutshots = textbook semi-bluff shove." },
  ],
  correctIndex: 2,
  explanation:
    "**Shove $25.** SPR ≈ **1.9 — very low.** You have **9 flush outs + 4 gutshot outs + 3 overcard outs ≈ 15 outs (~54% equity)** against a typical check-calling range. With such low SPR, there's no room for pot-control or multi-street play — **just get it in as a semi-bluff**. You have enough equity that even if called, you're close to a coin flip; plus you have fold equity vs. weak pairs and gutshots in BB's range. Checking wastes the semi-bluff. Small bet commits you anyway on the turn.",
  concepts: ['SPR', 'Semi-bluff', 'Equity'],
};

const C3: Scenario = {
  id: 'spr-commitment-03',
  category: 'spr-commitment',
  difficulty: 3,
  title: 'SPR 6, middle pair on wet board',
  narrative:
    "6-handed $1/$2. You 3-bet to $18 from BTN, UTG called. Pot $39. Eff stack $240 behind. Flop: J♠ 10♠ 9♦. UTG checks. You have 7♣ 7♥.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 240,
  heroPosition: 'BTN',
  heroCards: [c('7', 'clubs'), c('7', 'hearts')],
  seats: [
    { position: 'BTN', stack: 240, status: 'active', isHero: true, name: 'You' },
    { position: 'UTG', stack: 240, status: 'active' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'folded', betAmount: 2 },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
  ],
  communityCards: [c('J', 'spades'), c('10', 'spades'), c('9', 'diamonds')],
  pot: 39,
  currentBet: 0,
  choices: [
    { label: 'Check behind', action: 'check', reasoning: "Correct. Pot-control a medium pair on a wet connected board that smashes UTG's call-3-bet range." },
    { label: 'Bet $18 small', action: 'raise', amount: 18, reasoning: "Turns 77 into a bluff — can't call a raise, doesn't get value from worse. Pure leak at mid SPR." },
    { label: 'Bet $30', action: 'raise', amount: 30, reasoning: "Larger bet with same problem — only gets called by hands that crush you (sets, straights, JJ+)." },
    { label: 'Bet $60 big', action: 'raise', amount: 60, reasoning: "Massive overbet with one pair on a wet board — one of the biggest leaks in poker." },
  ],
  correctIndex: 0,
  explanation:
    "**Check behind.** SPR = 240/39 ≈ **6 (medium)** on one of the worst possible boards for 77. JT9 with a flush draw smashes UTG's call-3-bet range: every JJ/TT/99/QQ+ beats you, plus straights, two-pair, and huge draws. **Betting turns 77 into a bluff** — you can't call a raise and don't get value from worse. **Pot-controlling with a marginal made hand at mid-SPR on a connected wet board is the correct play.** Check, see the turn cheaply, fold to any real aggression.",
  concepts: ['SPR', 'Pot control', 'Board texture'],
};

const C4: Scenario = {
  id: 'spr-commitment-04',
  category: 'spr-commitment',
  difficulty: 3,
  title: 'SPR 15, overpair on dynamic board',
  narrative:
    "9-handed $1/$2. UTG limp, you iso from BTN to $10 with TT, BB calls, UTG calls. Pot $31. Eff stack $465 behind. Flop: 9♠ 8♠ 7♦. Both players check.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 465,
  heroPosition: 'BTN',
  heroCards: [c('10', 'clubs'), c('10', 'hearts')],
  seats: [
    { position: 'BTN', stack: 465, status: 'active', isHero: true, name: 'You' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'active', betAmount: 0 },
    { position: 'UTG', stack: 198, status: 'active', betAmount: 0 },
    { position: 'UTG+1', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'LJ', stack: 200, status: 'folded' },
    { position: 'HJ', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
  ],
  communityCards: [c('9', 'spades'), c('8', 'spades'), c('7', 'diamonds')],
  pot: 31,
  currentBet: 0,
  choices: [
    { label: 'Check behind', action: 'check', reasoning: "OK but loses thin value from worse overpairs and draws that would pay off a small bet." },
    { label: 'Bet $15 small', action: 'raise', amount: 15, reasoning: "Too small — doesn't protect against draws; gutshots and flush draws call profitably." },
    { label: 'Bet $25 and plan to fold to raise', action: 'raise', amount: 25, reasoning: "Correct. Thin value + protection. At high SPR, overpairs on wet boards are bet-fold hands." },
    { label: 'Shove $465', action: 'all-in', amount: 465, reasoning: "Turns TT into a 15× pot bluff. Only hands that call absolutely crush you (sets, straights)." },
  ],
  correctIndex: 2,
  explanation:
    "**Bet $25 small, ready to fold to a raise.** SPR = 465/31 ≈ **15 (very high)** on a wet connected board. TT is an overpair to the board but **any J or 6 makes a straight**, flush draws are live, and any set absolutely crushes you. At high SPR your overpair **cannot be a stack-off hand** — you're drawing thin vs. sets/straights and getting 3-way, your equity is capped. A small bet builds pot and extracts from weaker overpairs/draws, but if either opponent raises, you're done — you have only one pair with bad reverse-implied odds. Shoving turns TT into a bluff for ~15 pot-sized bets of value. Checking is ok but loses thin value.",
  concepts: ['SPR', 'Pot control', 'Reverse implied odds'],
};

const C5: Scenario = {
  id: 'spr-commitment-05',
  category: 'spr-commitment',
  difficulty: 2,
  title: 'SPR 1 after 4-bet pot, AK on Q83',
  narrative:
    "6-handed $1/$2 online. BTN opened to $6, you 3-bet SB to $22, BTN 4-bet to $60, you called. Pot $121. Eff stack $140 behind. Flop: Q♦ 8♣ 3♥. You have A♠ K♣.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 140,
  heroPosition: 'SB',
  heroCards: [c('A', 'spades'), c('K', 'clubs')],
  seats: [
    { position: 'SB', stack: 140, status: 'active', betAmount: 60, isHero: true, name: 'You' },
    { position: 'BB', stack: 198, status: 'folded', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
    { position: 'CO', stack: 200, status: 'folded' },
    { position: 'BTN', stack: 140, status: 'active', betAmount: 60 },
  ],
  communityCards: [c('Q', 'diamonds'), c('8', 'clubs'), c('3', 'hearts')],
  pot: 121,
  currentBet: 0,
  choices: [
    { label: 'Check-fold', action: 'check', reasoning: "Massive leak. AK has ~36% equity + blockers; folding at SPR 1 in a 4-bet pot is pure money loss." },
    { label: 'Check-shove if bet', action: 'check', reasoning: "Correct. Low SPR + pot odds + Ax/Kx blockers + high BTN c-bet frequency = check-shove." },
    { label: 'Donk-shove $140', action: 'all-in', amount: 140, reasoning: "Works but denies BTN the chance to c-bet his missed 4-bet range that will fold to a shove." },
    { label: 'Bet $40 small', action: 'raise', amount: 40, reasoning: "Small donk makes no sense — BTN raises you off the best 'ahead' hands you have." },
  ],
  correctIndex: 1,
  explanation:
    "**Check-call/shove.** SPR = 140/121 ≈ **1.2 — extreme low**. In a 4-bet pot at this SPR, **AK still has ~35–40% equity** against BTN's 4-bet range (heavy on JJ+/AK), and the **pot odds on any shove are too good to fold**: calling $140 into a ~$400 pot needs only ~26% equity. **Checking is right** — BTN will c-bet close to 100% here, and you can check-call or check-shove with 6 outs + blockers. Donk-shoving works but check-shove lets BTN bluff his Ax/KK-KJ combos. Check-folding AK in a 4-bet pot at SPR 1 is a massive leak.",
  concepts: ['SPR', 'Pot odds', 'Blockers', '4-bet pot'],
};

const C6: Scenario = {
  id: 'spr-commitment-06',
  category: 'spr-commitment',
  difficulty: 2,
  title: 'SPR 3, top set on wet board',
  narrative:
    "6-handed $1/$2. UTG limp, MP raise to $10, you call CO with $200, BTN folds, UTG calls. Pot $33. Eff stack $190 behind. Flop: K♠ Q♠ 8♦. UTG checks, MP bets $20. You have K♥ K♦ (top set).",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 190,
  heroPosition: 'CO',
  heroCards: [c('K', 'hearts'), c('K', 'diamonds')],
  seats: [
    { position: 'CO', stack: 190, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'folded' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'folded', betAmount: 2 },
    { position: 'UTG', stack: 190, status: 'active' },
    { position: 'MP', stack: 190, status: 'raised', betAmount: 20 },
  ],
  communityCards: [c('K', 'spades'), c('Q', 'spades'), c('8', 'diamonds')],
  pot: 53,
  currentBet: 20,
  choices: [
    { label: 'Call $20', action: 'call', amount: 20, reasoning: "Flat lets a scary turn card (spade, T, J, 9, A) kill your action or give free equity to draws." },
    { label: 'Raise to $55', action: 'raise', amount: 55, reasoning: "Mini-raise doesn't protect — flush and straight draws still get cheap equity against your set." },
    { label: 'Raise to $90', action: 'raise', amount: 90, reasoning: "Correct. Charges all draws, commits by turn, extracts from AK/KQ/QQ/flush draws." },
    { label: 'Shove $190', action: 'all-in', amount: 190, reasoning: "Overkill — folds out worse hands; only near-nuts call. Burns value for zero gain." },
  ],
  correctIndex: 2,
  explanation:
    "**Raise to $90.** SPR = 190/53 ≈ **3.5 (low)** and you've flopped **top set on a draw-heavy board** — flush draws, straight draws (JT, AJ, T9), and two-pair combos all have equity against you. You want to **charge draws maximum** and build a pot where stacks go in by the turn. Flatting lets a scary turn (spade, T, J, 9, A) kill your action or give free equity. Min-raising ($55) doesn't protect. Shoving is overkill — you fold out all worse hands and only get called by nuts/near-nuts. The $90 raise gets calls from AK, KQ, QQ, flush draws, and commits you for stacks.",
  concepts: ['SPR', 'Commitment', 'Protection', 'Sets'],
};

const C7: Scenario = {
  id: 'spr-commitment-07',
  category: 'spr-commitment',
  difficulty: 2,
  title: 'SPR 10, TPTK deep on dry board',
  narrative:
    "6-handed $1/$2 deep. You opened CO to $5 with AQo, BB called. Pot $11. Both players have $400 behind (started $405 effective). Flop: A♦ 7♣ 2♠. BB checks.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 400,
  heroPosition: 'CO',
  heroCards: [c('A', 'clubs'), c('Q', 'hearts')],
  seats: [
    { position: 'CO', stack: 400, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'folded' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 400, status: 'active' },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 200, status: 'folded' },
  ],
  communityCards: [c('A', 'diamonds'), c('7', 'clubs'), c('2', 'spades')],
  pot: 11,
  currentBet: 0,
  choices: [
    { label: 'Bet $7 small, plan to bet small on every street', action: 'raise', amount: 7, reasoning: "Correct. Deep TPTK is not a stack-off hand. Small streets extract 3 barrels of thin value." },
    { label: 'Bet $30 big, plan to stack off', action: 'raise', amount: 30, reasoning: "Bloats pot with one pair. At SPR 36, TPTK becomes a bluff-catcher on turn/river — don't build the pot." },
    { label: 'Shove $400', action: 'all-in', amount: 400, reasoning: "15 pot-sized bets with one pair. Absurd — instant fold-out of everything worse." },
    { label: 'Check', action: 'check', reasoning: "Dry ace-high board hits CO range hard; checking gives up thin value you easily extract by betting." },
  ],
  correctIndex: 0,
  explanation:
    "**Bet $7 small (~60% pot), play 3 small streets.** SPR = 400/11 ≈ **36 (extreme high)**. At this depth, TPTK is **not a stack-off hand** — BB's check-call range contains weaker aces but also sets (77, 22) and slowplayed AA that crush you. The small bet extracts thin value on each street while **keeping the pot manageable**. Big bets bloat the pot with one pair and turn AQ into a bluff-catcher on later streets. Shoving is bizarre. Checking gives up thin value on a dry board.",
  concepts: ['SPR', 'Deep stack', 'Pot control', 'Sizing'],
};

const C8: Scenario = {
  id: 'spr-commitment-08',
  category: 'spr-commitment',
  difficulty: 2,
  title: 'SPR 2, overpair on disconnected board',
  narrative:
    "6-handed $1/$2. You 3-bet CO to $18 vs. MP open of $6, MP called. Pot $39. Eff stack $82 behind. Flop: J♣ 7♦ 2♥. MP checks. You have Q♠ Q♥.",
  stakes: { sb: 1, bb: 2 },
  effectiveStack: 82,
  heroPosition: 'CO',
  heroCards: [c('Q', 'spades'), c('Q', 'hearts')],
  seats: [
    { position: 'CO', stack: 82, status: 'active', isHero: true, name: 'You' },
    { position: 'BTN', stack: 200, status: 'folded' },
    { position: 'SB', stack: 199, status: 'folded', betAmount: 1 },
    { position: 'BB', stack: 198, status: 'folded', betAmount: 2 },
    { position: 'UTG', stack: 200, status: 'folded' },
    { position: 'MP', stack: 82, status: 'active' },
  ],
  communityCards: [c('J', 'clubs'), c('7', 'diamonds'), c('2', 'hearts')],
  pot: 39,
  currentBet: 0,
  choices: [
    { label: 'Check behind', action: 'check', reasoning: "Disaster. Free card lets villain realize equity and misses value from AK/AQ that would fold to pressure." },
    { label: 'Bet $20', action: 'raise', amount: 20, reasoning: "Too small — lets draws peel cheap and doesn't commit stacks by the turn as low SPR demands." },
    { label: 'Bet $40 and plan to stack off', action: 'raise', amount: 40, reasoning: "Correct. Large bet protects + commits. QQ at SPR 2 on a dry Jack-high board is a pure stack-off." },
  ],
  correctIndex: 2,
  explanation:
    "**Bet $40, plan to stack off.** SPR = 82/39 ≈ **2.1 (low)**. On a dry, disconnected Jack-high board, your QQ is a **huge overpair** that absolutely wants to play for stacks — MP's call-3-bet range has lots of JJ/TT/99/AK/AQ, and you're crushing all of it except JJ and the rare 77/22. **At low SPR, overpairs are commit hands.** Small bet lets draws peel cheap and doesn't build the pot for the stack-off you want. Checking is a disaster — you give free cards and miss value from AK/AQ that will fold to turn pressure. Bet big, plan to get it in.",
  concepts: ['SPR', 'Commitment', 'Overpair', '3-bet pot'],
};

// ────────────────────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  A1, A2, A3, A4, A5, A6, A7, A8,
  B1, B2, B3, B4, B5, B6, B7, B8,
  C1, C2, C3, C4, C5, C6, C7, C8,
];

export function getScenariosByCategory(category: ScenarioCategory): Scenario[] {
  return SCENARIOS.filter((s) => s.category === category);
}

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
