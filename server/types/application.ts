/**
 * Application Types
 * These types represent business logic and data transformations
 * Used internally by the application for analysis and computation
 */

// ==================== PLAYER ANALYSIS TYPES ====================

/**
 * Derived metrics calculated from match data
 * All values normalized to 0-100 scale
 */
export interface DerivedMetrics {
  // Playstyle metrics (0-100)
  aggression: number; // How often player fights
  farming: number; // CS efficiency
  vision: number; // Vision score relative to game length
  consistency: number; // Performance variance

  // Performance metrics (0-100)
  earlyGameStrength: number; // Performance in first 15min
  lateGameScaling: number; // Performance after 30min
  comebackRate: number; // Win rate when behind
  clutchFactor: number; // Performance in close games
  tiltFactor: number; // Performance degradation after losses

  // Meta metrics (0-100)
  championPoolDepth: number; // Effectiveness across champions
  improvementVelocity: number; // Rate of improvement over time
  roaming: number; // Map presence outside lane
  teamfighting: number; // Damage/utility in teamfights
  snowballRate: number; // Ability to capitalize on leads
  winrateVariance: number; // Volatility of rolling win rates
  offMetaPickRate: number; // Frequency of rare/experimental champion picks
}

/**
 * Player archetype definition
 * Pre-defined playstyle templates
 */
export interface ArchetypeProfile {
  name: string;
  description: string;
  profile: Partial<DerivedMetrics>; // Expected metric values
}

/**
 * Matched archetype for a specific player
 */
export interface PlayerArchetype {
  name: string;
  description: string;
  distance: number; // Euclidean distance from archetype
  matchPercentage: number; // 0-100, how well player fits
}

export type ElementName = 'Inferno' | 'Tide' | 'Gale' | 'Terra' | 'Void';

export interface PlayerElement {
  name: ElementName;
  icon: string;
  description: string;
  keywords: string[];
  score: number; // 0-100 confidence
}

export interface ElementPersona {
  codename: string;
  description: string;
  archetypeName: string;
  elementName: ElementName;
}

/**
 * Pro player profile for comparison
 */
export interface ProPlayerProfile {
  name: string;
  team: string;
  role: 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';
  region: 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'PCS' | 'VCS';
  playstyle: string; // Description of playstyle
  metrics: Partial<DerivedMetrics>; // Their metric profile
  achievements?: string;
  icon: string;
}

/**
 * Complete player identity analysis
 */
export interface PlayerIdentity {
  archetype: PlayerArchetype;
  element: PlayerElement;
  persona: ElementPersona;
  proComparison: {
    primary: ProPlayerProfile;
    secondary: ProPlayerProfile;
    similarity: number; // 0-100
    description: string;
  };
  topStrengths: Array<{
    metric: string;
    value: number;
    percentile: number; // Where they rank (0-100)
  }>;
  needsWork: Array<{
    metric: string;
    value: number;
    suggestion: string;
  }>;
  playfulComparison: string; // Funny comparison text
}

/**
 * Watershed moment - turning point in performance
 */
export interface WatershedMoment {
  matchId: string;
  gameDate: string;
  championName: string;
  result: boolean;
  performanceScore: number;
  beforeAverage: number; // Avg performance 10 games before
  afterAverage: number; // Avg performance 10 games after
  improvement: number; // Difference
  description: string; // AI-generated description
}

// ==================== CHAMPION & ROLE STATS ====================

/**
 * Aggregated champion statistics
 */
export interface ChampionStats {
  championName: string;
  championId: number;
  games: number;
  wins: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgDamage: number;
  splashArtUrl?: string; // Champion splash art URL (e.g., https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Anivia_0.jpg)
}

/**
 * Role distribution statistics
 */
export interface RoleStats {
  role: string;
  games: number;
  winRate: number;
}

// ==================== PERFORMANCE TRACKING ====================

/**
 * Win/loss streak information
 */
export interface StreakInfo {
  type: 'win' | 'loss';
  length: number;
  startDate: string;
  endDate: string;
}

/**
 * Performance trend over time
 */
export interface PerformanceTrend {
  date: string; // ISO date
  performanceScore: number;
  winRate: number;
  gamesPlayed: number;
}

// ==================== AI-GENERATED CONTENT ====================

/**
 * AI-generated insights from AWS Bedrock
 */
export interface AIInsights {
  story_arc: string; // Narrative summary of season
  surprising_insights: string[]; // 3 interesting findings
  improvement_tips: string[]; // 3 actionable suggestions
  archetype_explanation: string; // Why this archetype fits
  season_prediction: string; // Prediction for next season
  title: string; // Catchy title for player's year
}

// ==================== COMPLETE PLAYER STATS ====================

/**
 * Complete player statistics object
 * This is what gets returned to the frontend
 */
export interface PlayerStats {
  // Identity
  puuid: string;
  riotId: string;
  tagLine: string;
  region: string;

  // Basic stats
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;

  // Champion stats
  topChampions: ChampionStats[];
  championPoolSize: number;

  // Role stats
  mainRole: string;
  roleDistribution: RoleStats[];

  // Performance stats
  avgKDA: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgVisionScore: number;
  avgGameDuration: number;

  // Streaks
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: StreakInfo;

  // Trends
  performanceTrend: PerformanceTrend[];

  // Advanced analytics
  derivedMetrics: DerivedMetrics;
  archetype: PlayerArchetype;
  element?: PlayerElement;
  persona?: ElementPersona;
  watershedMoment?: WatershedMoment;

  // Pro player comparison
  proComparison?: {
    primary: ProPlayerProfile;
    secondary: ProPlayerProfile;
    similarity: number;
    description: string;
  };
  topStrengths?: Array<{
    metric: string;
    value: number;
    percentile: number;
  }>;
  needsWork?: Array<{
    metric: string;
    value: number;
    suggestion: string;
  }>;
  playfulComparison?: string;

  // AI-generated content
  insights?: AIInsights;

  // Metadata
  generatedAt: string;
}

// ==================== FRIEND GROUP TYPES ====================

/**
 * Friend group with member data
 */
export interface FriendGroup {
  id: string;
  name: string;
  members: PlayerStats[];
  dynamics: GroupDynamics;
}

/**
 * Group dynamics and comparisons
 */
export interface GroupDynamics {
  bestDuo?: {
    player1: string; // Riot ID
    player2: string;
    winRate: number;
    gamesPlayed: number;
  };
  tiltChains: TiltChain[];
  mvp: {
    puuid: string;
    riotId: string;
    avgPerformance: number;
  };
}

/**
 * Tilt correlation between players
 */
export interface TiltChain {
  trigger: string; // PUUID of player who loses
  affected: string; // PUUID of player who tilts after
  correlation: number; // 0-1
}

// ==================== API REQUEST/RESPONSE TYPES ====================

/**
 * Request to analyze a player
 */
export interface AnalyzePlayerRequest {
  riotId: string;
  tagLine: string;
  region?: string;
}

/**
 * Response from player analysis
 */
export interface AnalyzePlayerResponse {
  success: boolean;
  data?: PlayerStats;
  error?: string;
  cached?: boolean; // True if loaded from cache
}

/**
 * Request to create friend group
 */
export interface CreateGroupRequest {
  name: string;
  players: Array<{
    riotId: string;
    tagLine: string;
  }>;
}

/**
 * Response from group creation
 */
export interface CreateGroupResponse {
  success: boolean;
  groupId?: string;
  data?: FriendGroup;
  error?: string;
}

// ==================== SHARE CARD API ====================

export interface ShareCardPlayerSummary {
  puuid?: string;
  riotId: string;
  tagLine: string;
  totalGames: number;
  winRate: number;
  archetype: Pick<PlayerArchetype, 'name' | 'description'>;
  insights?: Pick<AIInsights, 'title'> | null;
}

export interface CreateShareCardRequest {
  cardDataUrl: string;
  caption?: string;
  player: ShareCardPlayerSummary;
}

export interface ShareCardPayload {
  slug: string;
  imageUrl: string;
  caption: string;
  player: {
    riotId: string | null;
    tagLine: string | null;
  };
  createdAt: string;
}

export interface CreateShareCardResponse {
  success: boolean;
  data?: ShareCardPayload;
  error?: string;
}

export interface GetShareCardResponse {
  success: boolean;
  data?: ShareCardPayload;
  error?: string;
}

// ==================== X (TWITTER) INTEGRATION ====================

export interface XRequestTokenResponse {
  success: boolean;
  data?: {
    authUrl: string;
    oauthToken: string;
  };
  error?: string;
}

export interface XAccessTokenRequest {
  oauthToken: string;
  oauthVerifier: string;
}

export interface XAccessTokenPayload {
  oauthToken: string;
  oauthTokenSecret: string;
  screenName: string;
  userId: string;
}

export interface XAccessTokenResponse {
  success: boolean;
  data?: XAccessTokenPayload;
  error?: string;
}

export interface XPostTweetRequest {
  caption: string;
  cardDataUrl: string;
  oauthToken: string;
  oauthTokenSecret: string;
}

export interface XPostTweetResponse {
  success: boolean;
  data?: {
    tweetUrl: string;
    tweetId: string;
    truncated?: boolean;
  };
  error?: string;
}

// ==================== PROGRESS TRACKING ====================

/**
 * Progress update during analysis
 */
export interface ProgressUpdate {
  stage: string; // e.g., "Fetching matches", "Calculating metrics"
  progress: number; // 0-100
  message: string;
}

// ==================== CONSTANTS ====================

export const ROLE_MAP = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
} as const;

export type RoleName = typeof ROLE_MAP[keyof typeof ROLE_MAP];
