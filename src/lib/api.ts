/**
 * API Client for Rift Rewind
 * Handles all communication with the backend
 */

// Import types from server (would normally be shared package)
export interface PlayerStats {
  puuid: string;
  riotId: string;
  tagLine: string;
  region: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  topChampions: ChampionStats[];
  championPoolSize: number;
  mainRole: string;
  roleDistribution: RoleStats[];
  avgKDA: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgVisionScore: number;
  avgGameDuration: number;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: StreakInfo;
  performanceTrend: PerformanceTrend[];
  derivedMetrics: DerivedMetrics;
  archetype: PlayerArchetype;
  watershedMoment?: WatershedMoment;
  insights?: AIInsights;
  proComparison?: ProComparison;
  topStrengths?: MetricStrength[];
  needsWork?: MetricWeakness[];
  playfulComparison?: string;
  generatedAt: string;
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
  splashArtUrl?: string;
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

export interface DerivedMetrics {
  aggression: number;
  farming: number;
  vision: number;
  consistency: number;
  earlyGameStrength: number;
  lateGameScaling: number;
  comebackRate: number;
  clutchFactor: number;
  tiltFactor: number;
  championPoolDepth: number;
  improvementVelocity: number;
  roaming: number;
  teamfighting: number;
  snowballRate: number;
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

export interface AIInsights {
  story_arc: string;
  surprising_insights: string[];
  improvement_tips: string[];
  archetype_explanation: string;
  season_prediction: string;
  title: string;
}

export interface ProComparison {
  primary: ProPlayerProfile;
  secondary: ProPlayerProfile;
  similarity: number;
  description: string;
}

export interface ProPlayerProfile {
  name: string;
  team: string;
  role: 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';
  region: 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'PCS' | 'VCS';
  playstyle: string;
  metrics: Partial<DerivedMetrics>;
  icon?: string; // Emoji or icon for display
  achievements?: string; // Notable achievements
}

export interface MetricStrength {
  metric: string;
  value: number;
  percentile: number;
}

export interface MetricWeakness {
  metric: string;
  value: number;
  suggestion: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Analyze a player (or get from cache)
 */
export async function analyzePlayer(
  riotId: string,
  tagLine: string,
  region: string = 'sg2'
): Promise<{ success: boolean; data?: PlayerStats; error?: string; cached?: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ riotId, tagLine, region }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to analyze player');
    }

    return result;
  } catch (error: any) {
    console.error('Error analyzing player:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze player',
    };
  }
}

/**
 * Get cached player data
 */
export async function getPlayer(
  riotId: string,
  tagLine: string
): Promise<{ success: boolean; data?: PlayerStats; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/player/${riotId}/${tagLine}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch player');
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching player:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch player',
    };
  }
}

/**
 * Create friend group
 */
export async function createFriendGroup(
  name: string,
  players: Array<{ riotId: string; tagLine: string }>
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, players }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create group');
    }

    return result;
  } catch (error: any) {
    console.error('Error creating group:', error);
    return {
      success: false,
      error: error.message || 'Failed to create group',
    };
  }
}

/**
 * Get friend group
 */
export async function getFriendGroup(groupId: string) {
  try {
    const response = await fetch(`${API_URL}/api/group/${groupId}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch group');
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching group:', error);
    throw error;
  }
}
