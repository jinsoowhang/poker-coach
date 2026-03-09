# Poker Coach

Texas Hold'em poker trainer with real-time educational overlays.

## Quick Start

```bash
# Install deps (from project root)
npm install

# Run engine tests
npm run test:engine

# Start dev server
npm run dev
# → http://localhost:5173
```

## Project Structure

npm workspaces monorepo:

```
poker-coach/
├── packages/
│   ├── engine/        # Pure TS game logic (zero DOM deps)
│   │   └── src/
│   │       ├── types.ts            # All shared types/interfaces
│   │       ├── card.ts             # Card creation, comparison, display
│   │       ├── deck.ts             # 52-card deck, shuffle, draw
│   │       ├── hand-evaluator.ts   # Wraps pokersolver
│   │       ├── hand-rank.ts        # Compare hands, find winners
│   │       ├── odds-calculator.ts  # Pot odds, outs, draw probabilities
│   │       ├── pot-manager.ts      # Main pot + side pots
│   │       ├── betting-round.ts    # Valid actions, blinds, all-in
│   │       ├── game-state.ts       # Pure reducer: applyAction()
│   │       ├── game-loop.ts        # Orchestrates hands, emits events
│   │       └── ai/
│   │           ├── decision-engine.ts   # Hand strength + personality → action
│   │           └── personalities.ts     # TAG, LP, TP, LAG profiles
│   ├── client/        # React + Vite + Tailwind frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── CardComponent.tsx          # CSS-only card rendering
│   │       │   ├── PokerTable.tsx             # Oval felt table layout
│   │       │   ├── PlayerSeat.tsx             # Player info + cards
│   │       │   ├── BettingControls.tsx        # Fold/Check/Call/Raise/All-in
│   │       │   ├── PotOddsDisplay.tsx         # Pot odds overlay
│   │       │   ├── HandProbabilityOverlay.tsx  # Outs by draw type
│   │       │   ├── HandStrengthGauge.tsx      # Percentile strength bar
│   │       │   └── PostHandModal.tsx          # Decision review modal
│   │       ├── stores/
│   │       │   ├── useGameStore.ts      # Zustand: game state + engine bridge
│   │       │   └── useSettingsStore.ts  # Zustand: overlay toggles
│   │       └── pages/
│   │           └── GamePage.tsx         # Main game page
│   └── server/        # Express API (not yet implemented)
└── supabase/          # Migrations (not yet created)
```

## Tech Stack

- **Engine**: Pure TypeScript, pokersolver for hand evaluation
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Zustand
- **Testing**: Vitest (96 tests across 11 files)
- **Design**: Casino noir — emerald felt, gold accents, Playfair Display / DM Sans / DM Mono / Crimson Text fonts

## Architecture

- **Event-driven**: GameLoop emits GameEvent → Zustand store subscribes → React re-renders
- **Human input**: Async Promise-based pattern via AWAITING_INPUT event
- **AI players**: Personality profiles (VPIP/aggression/bluff thresholds) + hand strength → fold/call/raise
- **State management**: Pure immutable reducer (applyAction) in engine, Zustand stores in client
- **Engine is DOM-free**: Can be used server-side or in workers

## Completed Phases

### Phase 1: Engine Core ✅
All game logic: cards, deck, hand evaluation, betting, pot management, game loop, AI.

### Phase 2: Playable Table ✅
Full React UI: poker table, card rendering, betting controls, game flow.

### Phase 3: Educational Overlays ✅
Real-time coaching: hand strength gauge, pot odds, outs/draw probabilities, post-hand review modal with coaching summaries.

## Remaining: Phase 4

1. Supabase integration (save hand history + stats)
2. Dashboard page with stats overview
3. Leaderboard page
4. Card dealing animations (CSS transitions)
5. Express server for leaderboard aggregation
6. GitHub Actions CI + GitHub Pages deploy

## Conventions

- Commits follow conventional commits: `feat(scope):`, `fix(scope):`, etc.
- Engine tests live next to source: `foo.ts` → `foo.test.ts`
- All engine functions are pure where possible (game-state reducer is fully immutable)
- AI delay is 400-800ms per action for readability
- Package names: `@poker-coach/engine`, `@poker-coach/client`, `@poker-coach/server`
