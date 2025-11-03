# Type System Organization

This directory contains all TypeScript type definitions for the Rift Rewind server, organized by data source and purpose.

## File Structure

```
server/types/
├── riot-api.ts      # Types matching Riot API responses (DTOs)
├── database.ts      # Database schema types (Supabase tables)
├── application.ts   # Business logic and internal types
├── index.ts         # Central re-export file
└── README.md        # This file
```

## Design Philosophy

The type system follows a **three-layer architecture**:

1. **API Layer** (`riot-api.ts`) - Raw external data
2. **Storage Layer** (`database.ts`) - Persisted data
3. **Application Layer** (`application.ts`) - Business logic

This separation ensures:
- **Clarity**: Know exactly where data comes from
- **Maintainability**: Changes to Riot API don't affect DB schema
- **Type Safety**: Explicit transformations between layers

## File Descriptions

### `riot-api.ts` - Riot API Response Types

Contains types that **exactly match** Riot Games API responses. These use the `DTO` (Data Transfer Object) suffix to indicate they represent raw API data.

**Naming Convention**: `Riot<Entity>DTO`

**Examples**:
- `RiotMatchDTO` - Full match data from Match-V5 API
- `RiotParticipantDTO` - Player data within a match
- `RiotAccountDTO` - Account data from Account-V1 API

**When to use**:
- When calling Riot API endpoints
- When parsing API responses
- In `server/lib/riot.ts` and similar API clients

```typescript
import type { RiotMatchDTO, RiotParticipantDTO } from '../types/riot-api.ts';

async function fetchMatch(matchId: string): Promise<RiotMatchDTO> {
  const response = await fetch(`https://.../${matchId}`);
  return response.json(); // Returns RiotMatchDTO
}
```

### `database.ts` - Database Schema Types

Contains types representing **Supabase table schemas**. These use the `DB` prefix and snake_case field names to match PostgreSQL conventions.

**Naming Convention**: `DB<Entity>`

**Examples**:
- `DBPlayer` - Schema for `players` table
- `DBMatch` - Schema for `matches` table
- `DBPlayerInsert` - Type for inserting new players (excludes auto-generated fields)

**When to use**:
- When reading from or writing to Supabase
- In `server/lib/supabaseClient.ts`
- When defining database operations

```typescript
import type { DBPlayer, DBMatch, DBMatchInsert } from '../types/database.ts';

async function saveMatch(match: DBMatchInsert): Promise<void> {
  await supabase.from('matches').insert(match);
}
```

### `application.ts` - Business Logic Types

Contains types for **internal application logic**, analysis, and API contracts. These use camelCase and represent processed/transformed data.

**Examples**:
- `PlayerStats` - Complete player statistics (what frontend receives)
- `DerivedMetrics` - Calculated metrics (aggression, farming, etc.)
- `AnalyzePlayerRequest` - API request format
- `AIInsights` - AI-generated content structure

**When to use**:
- When building API responses
- When calculating metrics in `server/lib/playerMetrics.ts`
- When transforming data between layers
- In API endpoint handlers

```typescript
import type { PlayerStats, DerivedMetrics } from '../types/application.ts';

function calculateStats(matches: DBMatch[]): PlayerStats {
  const derivedMetrics = calculateDerivedMetrics(matches);
  // ... transform DB data to API response
  return playerStats;
}
```

### `index.ts` - Central Export

Re-exports all types from the three modules for convenience. Also includes legacy type aliases for backwards compatibility.

**When to use**:
- When you need types from multiple modules
- For quick imports in small files
- When migrating existing code

```typescript
// Instead of multiple imports:
import type { RiotMatchDTO } from '../types/riot-api.ts';
import type { DBPlayer } from '../types/database.ts';
import type { PlayerStats } from '../types/application.ts';

// You can use:
import type { RiotMatchDTO, DBPlayer, PlayerStats } from '../types/index.ts';
```

## Data Flow Example

Here's how data flows through the type system:

```typescript
// 1. Fetch from Riot API (riot-api.ts)
import type { RiotMatchDTO, RiotParticipantDTO } from '../types/riot-api.ts';

const riotMatch: RiotMatchDTO = await riotClient.getMatch(matchId);
const participant: RiotParticipantDTO = riotMatch.info.participants.find(...);

// 2. Transform to database format (database.ts)
import type { DBMatchInsert } from '../types/database.ts';

const dbMatch: DBMatchInsert = {
  match_id: riotMatch.metadata.matchId,
  puuid: participant.puuid,
  champion_name: participant.championName,
  kills: participant.kills,
  deaths: participant.deaths,
  // ... transform from camelCase to snake_case
};

// 3. Save to database
await supabase.from('matches').insert(dbMatch);

// 4. Load from database
import type { DBMatch } from '../types/database.ts';

const matches: DBMatch[] = await supabase
  .from('matches')
  .select('*')
  .eq('puuid', puuid);

// 5. Transform to application format (application.ts)
import type { PlayerStats, ChampionStats } from '../types/application.ts';

const playerStats: PlayerStats = {
  puuid: player.puuid,
  riotId: player.riot_id, // snake_case → camelCase
  totalGames: matches.length,
  topChampions: calculateTopChampions(matches),
  derivedMetrics: calculateDerivedMetrics(matches),
  // ...
};

// 6. Return to frontend
return { success: true, data: playerStats };
```

## Migration Guide

The old `types/index.ts` had all types in one file. Here's how to migrate:

### Old Pattern
```typescript
import type { RiotMatch, DBPlayer, PlayerStats } from '../types/index.ts';
```

### New Pattern (Recommended)
```typescript
// Be explicit about data source
import type { RiotMatchDTO } from '../types/riot-api.ts';
import type { DBPlayer } from '../types/database.ts';
import type { PlayerStats } from '../types/application.ts';
```

### New Pattern (Convenience)
```typescript
// Still works via re-exports
import type { RiotMatchDTO, DBPlayer, PlayerStats } from '../types/index.ts';
```

## Best Practices

1. **Use specific imports** when working with a single layer:
   ```typescript
   // In riot.ts - only deals with API
   import type { RiotMatchDTO } from '../types/riot-api.ts';
   ```

2. **Use descriptive names** for transformation functions:
   ```typescript
   function riotMatchToDBMatch(riot: RiotMatchDTO): DBMatchInsert { ... }
   function dbPlayerToPlayerStats(db: DBPlayer): PlayerStats { ... }
   ```

3. **Keep transformations explicit**:
   ```typescript
   // ❌ Bad - unclear transformation
   function processMatch(match: any): any { ... }

   // ✅ Good - clear input/output types
   function transformRiotMatch(
     riotMatch: RiotMatchDTO,
     puuid: string
   ): DBMatchInsert { ... }
   ```

4. **Document JSONB fields** in database types:
   ```typescript
   export interface DBPlayer {
     derived_metrics: DerivedMetrics; // JSONB - references application.ts
     insights: AIInsights; // JSONB - references application.ts
   }
   ```

5. **Use DTO suffix for API types**:
   - `RiotMatchDTO` - clearly indicates it's from external API
   - `DBMatch` - clearly indicates it's a database table
   - `PlayerStats` - clearly indicates it's internal/application type

## Common Mistakes to Avoid

❌ **Don't mix API and DB types**:
```typescript
// Bad - trying to save API type directly to DB
const match: RiotMatchDTO = await riotClient.getMatch(id);
await supabase.from('matches').insert(match); // Type error!
```

✅ **Transform between layers**:
```typescript
const riotMatch: RiotMatchDTO = await riotClient.getMatch(id);
const dbMatch: DBMatchInsert = transformRiotMatch(riotMatch);
await supabase.from('matches').insert(dbMatch); // ✓
```

❌ **Don't use `any` for transformations**:
```typescript
function convert(data: any): any { ... } // Loses type safety
```

✅ **Use explicit types**:
```typescript
function riotToDb(riot: RiotMatchDTO): DBMatchInsert { ... }
```

## Questions?

- **"Which file should I import from?"**
  - Check what layer you're working in (API/DB/Application)
  - Import from the specific file for clarity

- **"Can I still use the old `RiotMatch` type?"**
  - Yes, but it's deprecated. Use `RiotMatchDTO` instead.

- **"How do I add a new type?"**
  - Determine the layer (API/DB/Application)
  - Add it to the appropriate file
  - Export it from `index.ts` if it's public

- **"What about shared types?"**
  - Types used across layers go in `application.ts`
  - Examples: `ChampionStats`, `DerivedMetrics`
