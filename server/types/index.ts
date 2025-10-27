/**
 * Shared TypeScript types for Rift Rewind
 * Used across both client and server
 */

// ==================== RIOT API TYPES ====================

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameType: string;
    queueId: number;
    participants: RiotParticipant[];
  };
}

export interface RiotParticipant {
  puuid: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  visionScore: number;
  teamPosition: string;
  individualPosition: string;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  perks: any;
  challenges?: {
    kda?: number;
    killParticipation?: number;
    [key: string]: any;
  };
}

// ==================== DATABASE TYPES ====================

export interface DBPlayer {
  puuid: string;
  riot_id: string;
  tag_line: string;
  region: string;
  total_games: number;
  win_rate: number;
  main_role: string;
  top_champions: ChampionStats[];
  derived_metrics: DerivedMetrics;
  narrative_story: string;
  insights: AIInsights;
  archetype: string;
  generated_at: string;
}

export interface DBMatch {
  match_id: string;
  puuid: string;
  game_date: string;
  champion_name: string;
  role: string;
  duration: number;
  result: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage_dealt: number;
  vision_score: number;
  performance_score: number;
  is_watershed: boolean;
}

// ==================== ANALYSIS TYPES ====================

export interface DerivedMetrics {
  // Playstyle metrics (0-100)
  aggression: number;
  farming: number;
  vision: number;
  consistency: number;

  // Performance metrics
  earlyGameStrength: number;
  lateGameScaling: number;
  comebackRate: number;
  clutchFactor: number;
  tiltFactor: number;

  // Meta metrics
  championPoolDepth: number;
  improvementVelocity: number;
  roaming: number;
  teamfighting: number;
  snowballRate: number;
}

export interface ArchetypeProfile {
  name: string;
  description: string;
  profile: Partial<DerivedMetrics>;
  icon: string;
}

export interface PlayerArchetype {
  name: string;
  description: string;
  distance: number;
  matchPercentage: number;
  icon: string;
}

export interface WatershedMoment {
  matchId: string;
  gameDate: string;
  championName: string;
  result: boolean;
  performanceScore: number;
  beforeAverage: number;
  afterAverage: number;
  improvement: number;
  description: string;
}

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
}

export interface RoleStats {
  role: string;
  games: number;
  winRate: number;
}

export interface StreakInfo {
  type: 'win' | 'loss';
  length: number;
  startDate: string;
  endDate: string;
}

export interface PerformanceTrend {
  date: string;
  performanceScore: number;
  winRate: number;
  gamesPlayed: number;
}

// ==================== AI TYPES ====================

export interface AIInsights {
  story_arc: string;
  surprising_insights: string[];
  improvement_tips: string[];
  archetype_explanation: string;
  season_prediction: string;
  title: string;
}

// ==================== PLAYER STATS TYPES ====================

export interface PlayerStats {
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
  watershedMoment?: WatershedMoment;

  // AI-generated content
  insights?: AIInsights;

  // Metadata
  generatedAt: string;
}

// ==================== FRIEND GROUP TYPES ====================

export interface FriendGroup {
  id: string;
  name: string;
  members: PlayerStats[];
  dynamics: GroupDynamics;
}

export interface GroupDynamics {
  bestDuo?: {
    player1: string;
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

export interface TiltChain {
  trigger: string; // puuid of player who loses
  affected: string; // puuid of player who tilts
  correlation: number; // 0-1
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface AnalyzePlayerRequest {
  riotId: string;
  tagLine: string;
  region?: string;
}

export interface AnalyzePlayerResponse {
  success: boolean;
  data?: PlayerStats;
  error?: string;
  cached?: boolean;
}

export interface CreateGroupRequest {
  name: string;
  players: { riotId: string; tagLine: string }[];
}

export interface CreateGroupResponse {
  success: boolean;
  groupId?: string;
  error?: string;
}

// ==================== UTILITY TYPES ====================

export interface ProgressUpdate {
  stage: string;
  progress: number; // 0-100
  message: string;
}

export type Region = 'americas' | 'asia' | 'europe' | 'sea';
export type Platform = 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'na1' | 'oc1' | 'ph2' | 'ru' | 'sg2' | 'th2' | 'tr1' | 'tw2' | 'vn2';

export const QUEUE_IDS = {
  RANKED_SOLO: 420,
  RANKED_FLEX: 440,
  NORMAL_DRAFT: 400,
  NORMAL_BLIND: 430,
  ARAM: 450,
} as const;

export const ROLE_MAP = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
} as const;
