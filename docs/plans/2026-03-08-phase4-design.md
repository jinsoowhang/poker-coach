# Phase 4 Design: Persistence, Stats, Animations & Deploy

**Date:** 2026-03-08
**Status:** Approved

## Overview

Phase 4 completes poker-coach with data persistence, stats tracking, polished animations, and deployment. The Express server is eliminated in favor of Supabase-only backend.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Supabase-only | No server to host; leaderboard via Postgres views |
| Auth | Anonymous (localStorage ID), schema ready for Supabase Auth | Ship fast, upgrade later without migrations |
| Animations | Pure CSS transitions + requestAnimationFrame | Small bundle, no Framer Motion/GSAP |
| Deployment | GitHub Pages (static) + GitHub Actions CI | Free hosting, Supabase handles backend |

## Database Schema

### `players`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| display_name | text | Auto-generated "Player_abc123" |
| auth_user_id | uuid nullable | FK → auth.users (null for now) |
| created_at | timestamptz | |

### `hands`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK | → players |
| hand_number | int | |
| pot_total | int | |
| community_cards | jsonb | Card[] |
| player_results | jsonb | PlayerResult[] |
| winners | jsonb | HandWinner[] |
| hero_hole_cards | jsonb | [Card, Card] |
| hero_position | text | BTN/SB/BB/UTG/MP/CO |
| hero_actions | jsonb | [{street, type, amount}] |
| hero_chips_before | int | |
| hero_chips_after | int | |
| hero_folded | boolean | |
| created_at | timestamptz | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK | → players |
| hands_played | int | |
| chips_start | int | |
| chips_end | int | |
| started_at | timestamptz | |
| ended_at | timestamptz | |

### `skill_snapshots`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK | → players |
| hands_total | int | |
| skill_score | float | |
| vpip | float | |
| aggression | float | |
| win_rate | float | |
| created_at | timestamptz | |

### `leaderboard_stats` (Postgres view)
Computed per-player from `hands` table:
- Total hands played
- Win rate (hands won / hands played)
- VPIP (voluntarily put chips in preflop)
- Aggression factor (raises / calls)
- Showdown win %
- Average profit per hand
- Composite skill score (weighted formula)
- Minimum 20 hands to qualify

### Row Level Security
- Players can only read/write their own hands, sessions, and snapshots
- `leaderboard_stats` view is public read

## Client Architecture

### Routing (React Router)
```
/              → GamePage (existing poker table)
/dashboard     → DashboardPage (personal stats)
/leaderboard   → LeaderboardPage (ranked skill scores)
```

### New Stores
- **usePlayerStore** — On load: check localStorage for player_id, create if missing. Exposes playerId, displayName.
- **useStatsStore** — Fetches from leaderboard_stats view. Powers Dashboard and Leaderboard.

### Persistence Flow
`HAND_END` event → async Supabase insert (fire-and-forget). Game works offline; stats just don't persist.

## AI Action Timing

Variable delay by action type + personality modifier:
| Action | Delay Range |
|---|---|
| Fold | 800-1500ms |
| Check/Call | 1200-2500ms |
| Raise | 1500-3500ms |
| All-in | 2000-4000ms |

- LAG acts faster, TP acts slower
- "Thinking" indicator (pulsing dot) on AI seat during delay
- No hard shot clock for human (learning tool), but subtle timer shown

## Card Dealing Animations

All CSS transforms/transitions + requestAnimationFrame sequencing:

**Deal:** Cards fly from deck (top-right) to each player, 100ms stagger, ~1s total. Human cards flip face-up; AI stays face-down.

**Community cards:** Flop — 3 cards slide out with 150ms stagger, flip simultaneously. Turn/River — single card slides, pauses, flips.

**Showdown:** AI cards flip with 200ms rotation. Winning hand gets gold glow. Losers fade.

**Chips:** Bet chips slide from player toward pot. Win chips slide to winner.

**Sequencing:** AI thinks (delay) → action animation (300ms) → next player.

## Dashboard Page

- **Session summary cards:** Hands played, session profit, win rate
- **Chip trend chart:** Line chart of chips over hands (recharts or custom SVG)
- **Skill radar:** Hexagonal chart — VPIP, aggression, showdown win %, bluff freq vs optimal
- **Skill score trend:** Line chart from skill_snapshots (captured every 10 hands)
- **Recent hands table:** Last 20 hands, expandable action timeline
- **Coaching insights:** Text callouts comparing stats to TAG optimal ranges

## Leaderboard Page

- Ranked table by composite skill score
- Columns: Rank, Player, Skill Score, Hands Played, Win Rate, VPIP, Aggression
- Current player row highlighted
- 20-hand minimum to qualify

## Skill Progression

- Snapshots taken every 10 hands → `skill_snapshots` table
- Trend line on dashboard shows skill score over time
- Milestone badges: "Reached Silver (500+)", "100 hands played", "VPIP under 30% for 50 hands"

## CI/CD

### GitHub Actions (on push to main + PRs)
1. Install dependencies
2. Run engine tests (vitest)
3. TypeScript type check (tsc --noEmit)
4. Build client (vite build)
5. Deploy to GitHub Pages (main only)

### Environment
- Supabase URL + anon key as GitHub Actions secrets
- Injected at build time via Vite env vars

## Design Language

Casino noir theme (existing):
- Dark backgrounds, emerald felt, gold accents
- Playfair Display (headers), DM Sans (body), DM Mono (numbers), Crimson Text
