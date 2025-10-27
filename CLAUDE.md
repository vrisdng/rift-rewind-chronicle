# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rift Rewind is a League of Legends year-in-review application that creates "Spotify Wrapped" style experiences for players. It's a cost-optimized full-stack app using React/TypeScript frontend with Express/TypeScript backend, Supabase (PostgreSQL), and AWS Bedrock (Claude) for AI insights.

**Cost Model**: ~$0.04 per player (single AI call only - all other analysis is pure math).

## Development Commands

```bash
# Install dependencies (run once, then again after pulling changes)
npm install
cd server && npm install && cd ..

# Start both frontend (Vite) and backend (Express) concurrently
npm run dev

# Frontend only (port 5173)
vite

# Backend only (port 3000)
cd server && npm run dev

# Lint
npm run lint

# Build for production
npm run build                    # Frontend
cd server && npx tsc             # Backend TypeScript compilation
```

## Environment Setup

Two `.env` files required:

**Root** `.env` (frontend):
- `VITE_API_URL` - Backend URL (default: http://localhost:3000)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**`server/.env`** (backend):
- `RIOT_API_KEY` - Required (get from https://developer.riotgames.com/)
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` - Required
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - Optional (falls back to mock insights)
- `PORT` - Optional (default: 3000)

Copy from `.env.example` files and populate.

## Architecture: Data Flow & Cost Model

The application follows a strict cost-optimization strategy where **only AI inference costs money**:

### 1. Data Collection (Riot API → $0)
- `server/lib/riot.ts` - Riot API client with rate limiting (20 req/sec max)
- Fetches up to 100 ranked solo queue matches per player
- `RiotClient.getMatchIdsByPuuid()` → `RiotClient.getMatch()` for each match

### 2. Match Processing (Pure Math → $0)
- `server/lib/matchAnalyzer.ts` - Converts Riot match data to internal format
- **Performance Scoring Algorithm**: Weighted formula (KDA 30%, CS 20%, Damage 25%, Vision 15%, Gold 10%)
- All functions return `DBMatch` objects with `performance_score` field

### 3. Metrics Calculation (Pure Math → $0)
- `server/lib/playerMetrics.ts` - Calculates 14 derived metrics from matches
  - **No AI or embeddings** - all statistical calculations
  - Examples: `calculateAggression()`, `calculateFarming()`, `calculateTiltFactor()`
  - Each metric is 0-100 scale based on percentile thresholds

### 4. Archetype Matching (Distance Metrics → $0)
- `server/lib/playerMetrics.ts` - 15 predefined `ARCHETYPES` constant
- **Uses Euclidean distance**, NOT AI embeddings
- `determineArchetype(metrics)` - finds closest archetype via `calculateDistance()`
- Each archetype has a `profile` with expected metric values

### 5. Watershed Detection (Statistical Analysis → $0)
- `server/lib/watershedDetector.ts` - Sliding window analysis
- **Algorithm**: For each match, compare avg performance 10 games before vs 10 after
- Returns match with largest improvement (min 15-point threshold)
- `detectWatershedMoment(matches)` - pure statistical breakpoint detection

### 6. AI Insights (AWS Bedrock → ~$0.04)
- `server/lib/bedrockClient.ts` - Claude 3.5 Sonnet via AWS Bedrock
- `server/lib/insightGenerator.ts` - Builds optimized prompt
- **ONLY 1 CALL PER PLAYER** - prompt includes all context (stats, metrics, archetype, watershed)
- Returns: story_arc, surprising_insights (3), improvement_tips (3), archetype_explanation, season_prediction, title
- Falls back to `getMockInsights()` if AWS credentials missing

### 7. Caching (Supabase → $0)
- `server/lib/supabaseClient.ts` - Database operations
- `analysis_cache` table tracks last analysis time
- `needsRefresh(puuid, maxAgeHours)` - checks 24-hour cache window
- All data stored: `players`, `matches`, `friend_groups` tables

### 8. Orchestration
- `server/lib/playerAnalyzer.ts` - **Main entry point**
- `analyzePlayer(riotId, tagLine, region, onProgress?)` - complete analysis pipeline
  1. Fetch account → 2. Fetch matches → 3. Calculate stats → 4. Calculate metrics → 5. Detect watershed → 6. Generate AI insights → 7. Save to DB
- `getCachedPlayerStats(riotId, tagLine)` - retrieve without re-analysis

## Key Design Patterns

### Type Sharing
- `server/types/index.ts` - Single source of truth for TypeScript types
- Frontend duplicates types in `src/lib/api.ts` (would ideally be shared package)
- All types use consistent naming: `DBMatch`, `PlayerStats`, `DerivedMetrics`, etc.

### Riot API Rate Limiting
```typescript
// In playerAnalyzer.ts - automatic rate limiting
if (i > 0 && i % 20 === 0) {
  await sleep(1000);  // Sleep after every 20 requests
}
```

### Progress Callbacks
```typescript
// playerAnalyzer.ts accepts optional progress callback
analyzePlayer(riotId, tagLine, region, (update: ProgressUpdate) => {
  console.log(`${update.stage} - ${update.message} (${update.progress}%)`);
});
```

### Mock Mode for Development
- `bedrockClient.ts` - Returns `getMockInsights()` if AWS credentials missing
- Allows full development without AWS costs

## Database Schema (Supabase)

Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor.

**Key tables**:
- `players` - PUUID (PK), riot_id, tag_line, derived_metrics (JSONB), insights (JSONB), archetype
- `matches` - match_id (PK), puuid (FK), performance_score, is_watershed
- `analysis_cache` - puuid (PK), last_analyzed, needs_refresh
- `friend_groups` + `friend_group_members` - friend comparison feature

**Important**: `derived_metrics` and `insights` are JSONB columns storing complex objects.

## API Endpoints

All endpoints in `server/index.ts`:

- `POST /api/analyze` - **Main endpoint**: Full analysis or cache retrieval
  - Body: `{ riotId, tagLine, region? }`
  - Calls `analyzePlayer()` if cache miss
  - Returns `{ success, data: PlayerStats, cached: boolean }`

- `GET /api/player/:riotId/:tagLine` - Cache-only lookup
  - 404 if not analyzed yet

- `GET /api/summoner/:gameName/:tagLine` - Quick lookup (no analysis)
  - Legacy endpoint for basic summoner info

- `POST /api/group` - Create friend group
  - Analyzes all players first if needed

- `GET /api/health` - Health check with config status

## Frontend Data Flow

1. **Landing page** (`src/pages/Landing.tsx`):
   - User enters Riot ID + tag line
   - Calls `analyzePlayer()` from `src/lib/api.ts`
   - Shows loading state with progress
   - Navigates to Dashboard with `playerData` in route state

2. **Dashboard** (`src/pages/Dashboard.tsx`):
   - Reads `location.state.playerData`
   - Renders stats cards, performance chart (Recharts), watershed moment, AI story
   - All data from single `PlayerStats` object

3. **API Client** (`src/lib/api.ts`):
   - Type-safe wrappers around fetch calls
   - Error handling with try/catch
   - Uses `VITE_API_URL` env variable

## Critical Implementation Details

### Performance Score Calculation
```typescript
// matchAnalyzer.ts - calculatePerformanceScore()
// Weighted: KDA (30%) + CS (20%) + Damage (25%) + Vision (15%) + Gold (10%)
// Normalized to 0-100, +10 bonus for wins
```

### Archetype Distance Formula
```typescript
// playerMetrics.ts - calculateDistance()
// Euclidean: sqrt(sum((metric - profile)^2) / count)
// Lower distance = better match
```

### Watershed Detection Window
```typescript
// watershedDetector.ts - detectWatershedMoment()
const WINDOW_SIZE = 10;  // Games before/after
const MIN_IMPROVEMENT_THRESHOLD = 15;  // Minimum performance jump
```

### AI Prompt Structure
```typescript
// insightGenerator.ts - buildInsightPrompt()
// Single optimized prompt with:
// - Player stats summary
// - All 14 metrics formatted
// - Archetype + match %
// - Watershed moment description
// - Explicit JSON output format
```

## Common Modifications

**Adding a new metric**:
1. Add to `DerivedMetrics` interface in `server/types/index.ts`
2. Implement calculation function in `server/lib/playerMetrics.ts`
3. Call from `calculateDerivedMetrics()`
4. Update archetype profiles if relevant

**Adding a new archetype**:
1. Add to `ARCHETYPES` array in `server/lib/playerMetrics.ts`
2. Define metric profile values (which metrics matter for this playstyle)
3. Add icon emoji

**Modifying AI insights**:
1. Edit prompt template in `server/lib/insightGenerator.ts` → `buildInsightPrompt()`
2. Update `AIInsights` type if changing JSON structure
3. Test with mock mode first (no AWS costs)

## Module Import Pattern

All server files use ES modules (`.js` extensions in imports):
```typescript
import { getClient } from './lib/riot.js';  // Note .js extension
import type { PlayerStats } from '../types/index.js';
```

Frontend uses standard TS imports with path aliases:
```typescript
import { analyzePlayer } from '@/lib/api';
import { Button } from '@/components/ui/button';
```

## Troubleshooting

**"Riot API rate limit exceeded"**:
- Reduce `MAX_MATCHES_TO_FETCH` in `playerAnalyzer.ts`
- Check sleep intervals in match fetching loop

**"Supabase error" during analysis**:
- Verify migration ran successfully
- Check `SUPABASE_SERVICE_KEY` (not anon key) in server/.env
- Inspect error - may be JSONB serialization issue

**AWS Bedrock not working**:
- Verify model access granted in AWS console
- Check region matches model availability
- Falls back to mocks gracefully - check logs

**TypeScript errors in server**:
- Ensure all imports have `.js` extension
- Server uses `"type": "module"` in package.json
- Run `npx tsc` to check compilation

**Frontend not connecting to backend**:
- Verify `VITE_API_URL` in root `.env`
- Check CORS settings in `server/index.ts`
- Confirm backend running on correct port (default 3000)
