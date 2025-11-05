/**
 * Central Type Exports for Rift Rewind
 *
 * This file re-exports all types from organized modules:
 * - riot-api.ts: Types matching Riot API responses (DTOs)
 * - database.ts: Database schema types (Supabase tables)
 * - application.ts: Business logic and internal types
 *
 * Import pattern:
 * ```typescript
 * // Prefer specific imports for clarity:
 * import type { RiotMatchDTO } from '../types/riot-api.ts';
 * import type { DBPlayer, DBMatch } from '../types/database.ts';
 * import type { PlayerStats, DerivedMetrics } from '../types/application.ts';
 *
 * // Or use the central export:
 * import type { PlayerStats } from '../types/index.ts';
 * ```
 */

// ==================== RIOT API TYPES ====================
// Raw response types from Riot's APIs

export type {
  // Account API
  RiotAccountDTO,
  RiotSummonerDTO,

  // Match API
  RiotMatchDTO,
  RiotMatchMetadataDTO,
  RiotMatchInfoDTO,
  RiotParticipantDTO,
  RiotPerksDTO,
  RiotChallengesDTO,
  RiotTeamDTO,
  RiotObjectiveDTO,

  // Champion Mastery API
  RiotChampionMasteryDTO,

  // Utility types
  RiotRegion,
  RiotPlatform,
} from './riot-api.ts';

export { RIOT_QUEUE_IDS } from './riot-api.ts';

// ==================== DATABASE TYPES ====================
// Types representing Supabase table schemas

export type {
  // Table schemas
  DBPlayer,
  DBMatch,
  DBAnalysisCache,
  DBFriendGroup,
  DBFriendGroupMember,
  DBPerformanceTrend,

  // Helper types for database operations
  DBPlayerInsert,
  DBMatchInsert,
  DBAnalysisCacheInsert,
  DBFriendGroupInsert,
  DBPlayerUpdate,
  DBMatchUpdate,
  DBAnalysisCacheUpdate,
} from './database.ts';

// ==================== APPLICATION TYPES ====================
// Business logic, analysis, and API types

export type {
  // Player analysis
  DerivedMetrics,
  ArchetypeProfile,
  PlayerArchetype,
  ProPlayerProfile,
  PlayerIdentity,
  WatershedMoment,

  // Stats aggregations
  ChampionStats,
  RoleStats,
  StreakInfo,
  PerformanceTrend,

  // AI content
  AIInsights,

  // Complete player data
  PlayerStats,

  // Friend groups
  FriendGroup,
  GroupDynamics,
  TiltChain,

  // API contracts
  AnalyzePlayerRequest,
  AnalyzePlayerResponse,
  CreateGroupRequest,
  CreateGroupResponse,

  // Utilities
  ProgressUpdate,
  RoleName,
} from './application.ts';

export { ROLE_MAP } from './application.ts';

// ==================== LEGACY COMPATIBILITY ====================
// For backwards compatibility during migration
// TODO: Remove these after updating all imports

/**
 * @deprecated Use RiotMatchDTO from riot-api.ts instead
 */
export type RiotMatch = import('./riot-api.ts').RiotMatchDTO;

/**
 * @deprecated Use RiotParticipantDTO from riot-api.ts instead
 */
export type RiotParticipant = import('./riot-api.ts').RiotParticipantDTO;

/**
 * @deprecated Use RiotRegion from riot-api.ts instead
 */
export type Region = import('./riot-api.ts').RiotRegion;

/**
 * @deprecated Use RiotPlatform from riot-api.ts instead
 */
export type Platform = import('./riot-api.ts').RiotPlatform;

/**
 * @deprecated Use RIOT_QUEUE_IDS instead
 */
export const QUEUE_IDS = {
  RANKED_SOLO: 420,
  RANKED_FLEX: 440,
  NORMAL_DRAFT: 400,
  NORMAL_BLIND: 430,
  ARAM: 450,
} as const;
