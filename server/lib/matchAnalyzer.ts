/**
 * Match Analyzer
 * Processes raw Riot API match data and converts it to our internal format
 * Calculates performance scores and identifies watershed moments
 */

import type {
  RiotMatch,
  RiotParticipant,
  DBMatch,
  ChampionStats,
  RoleStats,
  StreakInfo,
  PerformanceTrend,
  WatershedMoment,
  ROLE_MAP,
} from '../types/index.js';

// ==================== PERFORMANCE SCORING ====================

/**
 * Calculate a performance score (0-100) for a single match
 * Weights: KDA (30%), CS (20%), Damage (25%), Vision (15%), Gold (10%)
 */
export function calculatePerformanceScore(
  participant: RiotParticipant,
  gameDuration: number // in seconds
): number {
  const durationMinutes = gameDuration / 60;

  // KDA Score (0-100)
  const kda = participant.deaths === 0
    ? (participant.kills + participant.assists) * 1.2
    : (participant.kills + participant.assists) / participant.deaths;
  const kdaScore = Math.min(kda * 20, 100); // Cap at 100

  // CS Score (0-100) - Based on CS per minute
  const csPerMin = (participant.totalMinionsKilled + participant.neutralMinionsKilled) / durationMinutes;
  const targetCS = 7; // Good CS/min target
  const csScore = Math.min((csPerMin / targetCS) * 100, 100);

  // Damage Score (0-100) - Relative to game duration
  const damagePerMin = participant.totalDamageDealtToChampions / durationMinutes;
  const targetDamage = 600; // Target damage per minute
  const damageScore = Math.min((damagePerMin / targetDamage) * 100, 100);

  // Vision Score (0-100)
  const visionPerMin = participant.visionScore / durationMinutes;
  const targetVision = 1.5; // Target vision per minute
  const visionScore = Math.min((visionPerMin / targetVision) * 100, 100);

  // Gold Score (0-100)
  const goldPerMin = participant.goldEarned / durationMinutes;
  const targetGold = 400; // Target gold per minute
  const goldScore = Math.min((goldPerMin / targetGold) * 100, 100);

  // Weighted average
  const totalScore =
    kdaScore * 0.3 +
    csScore * 0.2 +
    damageScore * 0.25 +
    visionScore * 0.15 +
    goldScore * 0.1;

  // Bonus for winning
  const winBonus = participant.win ? 10 : 0;

  return Math.min(totalScore + winBonus, 100);
}

/**
 * Convert Riot API match to our DB format
 */
export function convertMatchToDBFormat(
  match: RiotMatch,
  puuid: string
): DBMatch | null {
  const participant = match.info.participants.find((p) => p.puuid === puuid);

  if (!participant) {
    console.error('Participant not found in match');
    return null;
  }

  const totalCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const performanceScore = calculatePerformanceScore(participant, match.info.gameDuration);

  return {
    match_id: match.metadata.matchId,
    puuid,
    game_date: new Date(match.info.gameCreation).toISOString(),
    champion_name: participant.championName,
    role: normalizeRole(participant.teamPosition || participant.individualPosition),
    duration: match.info.gameDuration,
    result: participant.win,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    cs: totalCS,
    gold: participant.goldEarned,
    damage_dealt: participant.totalDamageDealtToChampions,
    vision_score: participant.visionScore,
    performance_score: parseFloat(performanceScore.toFixed(2)),
    is_watershed: false,
  };
}

/**
 * Normalize role names to consistent format
 */
function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    TOP: 'Top',
    JUNGLE: 'Jungle',
    MIDDLE: 'Mid',
    MID: 'Mid',
    BOTTOM: 'ADC',
    BOT: 'ADC',
    UTILITY: 'Support',
    SUPPORT: 'Support',
  };

  return roleMap[role.toUpperCase()] || role;
}

// ==================== CHAMPION STATISTICS ====================

/**
 * Calculate champion statistics from matches
 */
export function calculateChampionStats(matches: DBMatch[]): ChampionStats[] {
  const championMap = new Map<string, {
    games: number;
    wins: number;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    totalCS: number;
    totalDamage: number;
  }>();

  for (const match of matches) {
    const existing = championMap.get(match.champion_name) || {
      games: 0,
      wins: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      totalCS: 0,
      totalDamage: 0,
    };

    championMap.set(match.champion_name, {
      games: existing.games + 1,
      wins: existing.wins + (match.result ? 1 : 0),
      totalKills: existing.totalKills + match.kills,
      totalDeaths: existing.totalDeaths + match.deaths,
      totalAssists: existing.totalAssists + match.assists,
      totalCS: existing.totalCS + match.cs,
      totalDamage: existing.totalDamage + match.damage_dealt,
    });
  }

  const championStats: ChampionStats[] = [];

  for (const [championName, stats] of championMap.entries()) {
    championStats.push({
      championName,
      championId: 0, // We don't have championId in DBMatch
      games: stats.games,
      wins: stats.wins,
      winRate: parseFloat(((stats.wins / stats.games) * 100).toFixed(2)),
      avgKills: parseFloat((stats.totalKills / stats.games).toFixed(2)),
      avgDeaths: parseFloat((stats.totalDeaths / stats.games).toFixed(2)),
      avgAssists: parseFloat((stats.totalAssists / stats.games).toFixed(2)),
      avgCS: parseFloat((stats.totalCS / stats.games).toFixed(2)),
      avgDamage: parseFloat((stats.totalDamage / stats.games).toFixed(2)),
    });
  }

  // Sort by games played, then win rate
  return championStats.sort((a, b) => {
    if (b.games !== a.games) {
      return b.games - a.games;
    }
    return b.winRate - a.winRate;
  });
}

// ==================== ROLE STATISTICS ====================

/**
 * Calculate role distribution and stats
 */
export function calculateRoleStats(matches: DBMatch[]): RoleStats[] {
  const roleMap = new Map<string, { games: number; wins: number }>();

  for (const match of matches) {
    const existing = roleMap.get(match.role) || { games: 0, wins: 0 };
    roleMap.set(match.role, {
      games: existing.games + 1,
      wins: existing.wins + (match.result ? 1 : 0),
    });
  }

  const roleStats: RoleStats[] = [];

  for (const [role, stats] of roleMap.entries()) {
    roleStats.push({
      role,
      games: stats.games,
      winRate: parseFloat(((stats.wins / stats.games) * 100).toFixed(2)),
    });
  }

  return roleStats.sort((a, b) => b.games - a.games);
}

/**
 * Get main role (most played)
 */
export function getMainRole(matches: DBMatch[]): string {
  const roleStats = calculateRoleStats(matches);
  return roleStats.length > 0 ? roleStats[0].role : 'Unknown';
}

// ==================== STREAKS ====================

/**
 * Find longest win streak
 */
export function findLongestWinStreak(matches: DBMatch[]): number {
  let maxStreak = 0;
  let currentStreak = 0;

  // Sort by date ascending
  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  for (const match of sorted) {
    if (match.result) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Find longest loss streak
 */
export function findLongestLossStreak(matches: DBMatch[]): number {
  let maxStreak = 0;
  let currentStreak = 0;

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  for (const match of sorted) {
    if (!match.result) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Get current streak
 */
export function getCurrentStreak(matches: DBMatch[]): StreakInfo {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
  );

  if (sorted.length === 0) {
    return {
      type: 'win',
      length: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };
  }

  const isWinStreak = sorted[0].result;
  let streakLength = 0;
  let startDate = sorted[0].game_date;
  let endDate = sorted[0].game_date;

  for (const match of sorted) {
    if (match.result === isWinStreak) {
      streakLength++;
      startDate = match.game_date;
    } else {
      break;
    }
  }

  return {
    type: isWinStreak ? 'win' : 'loss',
    length: streakLength,
    startDate,
    endDate,
  };
}

// ==================== PERFORMANCE TRENDS ====================

/**
 * Calculate performance trends over time (weekly aggregates)
 */
export function calculatePerformanceTrends(matches: DBMatch[]): PerformanceTrend[] {
  // Group matches by week
  const weekMap = new Map<string, {
    games: number;
    wins: number;
    totalPerformance: number;
  }>();

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  for (const match of sorted) {
    const date = new Date(match.game_date);
    // Get the Monday of this week
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];

    const existing = weekMap.get(weekKey) || {
      games: 0,
      wins: 0,
      totalPerformance: 0,
    };

    weekMap.set(weekKey, {
      games: existing.games + 1,
      wins: existing.wins + (match.result ? 1 : 0),
      totalPerformance: existing.totalPerformance + match.performance_score,
    });
  }

  const trends: PerformanceTrend[] = [];

  for (const [date, stats] of weekMap.entries()) {
    trends.push({
      date,
      performanceScore: parseFloat((stats.totalPerformance / stats.games).toFixed(2)),
      winRate: parseFloat(((stats.wins / stats.games) * 100).toFixed(2)),
      gamesPlayed: stats.games,
    });
  }

  return trends.sort((a, b) => a.date.localeCompare(b.date));
}

// ==================== BASIC STATISTICS ====================

/**
 * Calculate average KDA
 */
export function calculateAverageKDA(matches: DBMatch[]): number {
  if (matches.length === 0) return 0;

  let totalKDA = 0;

  for (const match of matches) {
    const kda = match.deaths === 0
      ? (match.kills + match.assists) * 1.2
      : (match.kills + match.assists) / match.deaths;
    totalKDA += kda;
  }

  return parseFloat((totalKDA / matches.length).toFixed(2));
}

/**
 * Calculate average stats
 */
export function calculateAverageStats(matches: DBMatch[]): {
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgVisionScore: number;
  avgGameDuration: number;
} {
  if (matches.length === 0) {
    return {
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      avgCS: 0,
      avgVisionScore: 0,
      avgGameDuration: 0,
    };
  }

  const totals = matches.reduce(
    (acc, match) => ({
      kills: acc.kills + match.kills,
      deaths: acc.deaths + match.deaths,
      assists: acc.assists + match.assists,
      cs: acc.cs + match.cs,
      visionScore: acc.visionScore + match.vision_score,
      duration: acc.duration + match.duration,
    }),
    { kills: 0, deaths: 0, assists: 0, cs: 0, visionScore: 0, duration: 0 }
  );

  const count = matches.length;

  return {
    avgKills: parseFloat((totals.kills / count).toFixed(2)),
    avgDeaths: parseFloat((totals.deaths / count).toFixed(2)),
    avgAssists: parseFloat((totals.assists / count).toFixed(2)),
    avgCS: parseFloat((totals.cs / count).toFixed(2)),
    avgVisionScore: parseFloat((totals.visionScore / count).toFixed(2)),
    avgGameDuration: parseFloat((totals.duration / count).toFixed(2)),
  };
}

export default {
  calculatePerformanceScore,
  convertMatchToDBFormat,
  calculateChampionStats,
  calculateRoleStats,
  getMainRole,
  findLongestWinStreak,
  findLongestLossStreak,
  getCurrentStreak,
  calculatePerformanceTrends,
  calculateAverageKDA,
  calculateAverageStats,
};
