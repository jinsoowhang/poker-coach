# Poker Coach

A Texas Hold'em poker trainer that helps you improve your game through real-time educational overlays, AI opponents with distinct personalities, and detailed performance tracking.

**[Play Now](https://jinsoowhang.github.io/poker-coach/)**

## What It Does

Play poker against AI opponents while receiving real-time coaching feedback. The app tracks your decisions, analyzes your playstyle, and shows you where to improve.

### Game Table
- Play against 3 AI opponents with unique personalities (Tight-Aggressive, Loose-Passive, Loose-Aggressive)
- Casino-feel card dealing animations with flip reveals and chip movement
- AI players "think" with variable delays based on their personality and decision complexity

### Real-Time Coaching
- **Hand Strength Gauge** — see how strong your hand is as a percentile (0-100%)
- **Pot Odds Display** — know if calling is mathematically correct
- **Outs Calculator** — see your flush draws, straight draws, and their probabilities
- **Post-Hand Review** — after each hand, review your decisions with coaching feedback

### Stats & Progress
- **Dashboard** — chip trend charts, skill radar comparing your play to optimal strategy, coaching insights
- **Leaderboard** — ranked by a composite skill score (win rate, VPIP, aggression, showdown performance)
- **Milestone Badges** — achievement tracking as you improve
- **Skill Snapshots** — your skill score tracked every 10 hands to visualize improvement over time

## Tech Stack

| Layer | Technology |
|---|---|
| Engine | Pure TypeScript (zero DOM dependencies) |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Zustand |
| Charts | Recharts, custom SVG radar |
| Backend | Supabase (Postgres + JS client) |
| Testing | Vitest (100 tests across 12 files) |
| CI/CD | GitHub Actions → GitHub Pages |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  @poker-coach/engine (pure TypeScript)          │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │ GameLoop │→ │ GameEvents │→ │ HandSummary│  │
│  └──────────┘  └────────────┘  └────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │   Deck   │  │Hand Evaluat│  │ AI Players │  │
│  └──────────┘  └────────────┘  └────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ Events
┌────────────────────▼────────────────────────────┐
│  @poker-coach/client (React)                    │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │ GameStore│  │PlayerStore │  │ StatsStore │  │
│  │ (Zustand)│  │ (Zustand)  │  │ (Zustand)  │  │
│  └────┬─────┘  └─────┬──────┘  └─────┬──────┘  │
│       │              │               │          │
│  ┌────▼─────────────▼───────────────▼────────┐ │
│  │  Pages: Game | Dashboard | Leaderboard     │ │
│  └────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ Async persistence
┌────────────────────▼────────────────────────────┐
│  Supabase                                       │
│  players | hands | sessions | skill_snapshots   │
│  leaderboard_stats (Postgres view)              │
└─────────────────────────────────────────────────┘
```

The engine is completely DOM-free and emits events that the React client subscribes to via Zustand stores. Hand data is persisted to Supabase asynchronously after each hand — the game works fully offline if Supabase is unavailable.

## AI Opponents

Each AI has a distinct poker personality:

| Name | Style | VPIP | Aggression | Speed |
|---|---|---|---|---|
| TAG | Tight-Aggressive | 22% | High | Normal |
| LAG | Loose-Aggressive | 50% | High | Fast |
| TP | Tight-Passive | 18% | Low | Slow |
| LP | Loose-Passive | 55% | Low | Slightly slow |

AI action delays vary by decision type (quick folds, longer all-in decisions) and personality (LAG acts impulsively, TP deliberates).

## Skill Score

Players are ranked by a composite skill score (0–1000) based on:

- **Win Rate** (30%) — hands won vs played
- **VPIP** (25%) — hand selection discipline (optimal ~22%)
- **Aggression** (20%) — raise-to-call ratio (optimal ~2.0)
- **Showdown Win %** (25%) — winning when you see the river

Minimum 20 hands to qualify for the leaderboard.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run engine tests
npm run test:engine

# Production build
npm run build --workspace=@poker-coach/client
```

### Environment Variables

Copy `packages/client/.env.example` to `packages/client/.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app runs without Supabase — stats just won't persist between sessions.

## Built With

Built with [Claude Code](https://claude.ai/claude-code).
