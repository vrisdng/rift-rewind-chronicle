/**
 * Player Analyzer
 * Main orchestrator that brings together all analysis components
 * Handles the complete flow from Riot API → Database → AI insights
 */

import { getClient } from './riot.js';
import type { RiotMatch, PlayerStats, DBMatch, ProgressUpdate } from '../types/index.js';
import {
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
} from './matchAnalyzer.js';
import { calculateDerivedMetrics, determineArchetype } from './playerMetrics.js';
import { detectWatershedMoment } from './watershedDetector.js';
import { generatePlayerInsights } from './insightGenerator.js';
import {
  getPlayerByRiotId,
  upsertPlayer,
  getMatches,
  insertMatches,
  markWatershedMoment,
  needsRefresh,
  updateAnalysisCache,
} from './supabaseClient.js';

const MAX_MATCHES_TO_FETCH = 100; // Limit for API calls
const RANKED_SOLO_QUEUE = 420;

/**
 * Analyze a player completely: fetch matches, calculate metrics, generate insights
 */
export async function analyzePlayer(
  riotId: string,
  tagLine: string,
  region: string = 'sg2',
  onProgress?: (update: ProgressUpdate) => void
): Promise<PlayerStats> {
  const client = getClient({ platform: region as any });

  // Step 1: Get player account
  onProgress?.({ stage: 'account', progress: 10, message: 'Fetching account info...' });

  const account = await client.getAccountByRiotId(riotId, tagLine);
  const { puuid } = account;

  // Check if we have recent cached data
  const shouldRefresh = await needsRefresh(puuid, 24);

  if (!shouldRefresh) {
    onProgress?.({ stage: 'cache', progress: 100, message: 'Using cached data' });

    const cachedPlayer = await getPlayerByRiotId(riotId, tagLine);
    if (cachedPlayer) {
      return convertDBPlayerToStats(cachedPlayer);
    }
  }

  // Step 2: Fetch match history
  onProgress?.({ stage: 'matches', progress: 20, message: 'Fetching match history...' });

  const matchIds = await client.getMatchIdsByPuuid(puuid, {
    count: MAX_MATCHES_TO_FETCH,
    queue: RANKED_SOLO_QUEUE,
  });

  onProgress?.({
    stage: 'matches',
    progress: 30,
    message: `Found ${matchIds.length} matches. Downloading details...`,
  });

  // Step 3: Fetch match details (with rate limiting)
  const matches: DBMatch[] = [];

  for (let i = 0; i < matchIds.length; i++) {
    try {
      const matchData: RiotMatch = await client.getMatch(matchIds[i]);
      const dbMatch = convertMatchToDBFormat(matchData, puuid);

      if (dbMatch) {
        matches.push(dbMatch);
      }

      // Update progress
      const progress = 30 + Math.floor((i / matchIds.length) * 30);
      onProgress?.({
        stage: 'processing',
        progress,
        message: `Processing match ${i + 1}/${matchIds.length}...`,
      });

      // Rate limiting: 20 requests per second max
      if (i > 0 && i % 20 === 0) {
        await sleep(1000);
      }
    } catch (error) {
      console.error(`Failed to fetch match ${matchIds[i]}:`, error);
      // Continue with other matches
    }
  }

  if (matches.length === 0) {
    throw new Error('No valid matches found for this player');
  }

  // Step 4: Calculate statistics
  onProgress?.({ stage: 'stats', progress: 65, message: 'Calculating statistics...' });

  const championStats = calculateChampionStats(matches);
  const roleStats = calculateRoleStats(matches);
  const mainRole = getMainRole(matches);
  const longestWinStreak = findLongestWinStreak(matches);
  const longestLossStreak = findLongestLossStreak(matches);
  const currentStreak = getCurrentStreak(matches);
  const performanceTrend = calculatePerformanceTrends(matches);
  const avgKDA = calculateAverageKDA(matches);
  const avgStats = calculateAverageStats(matches);

  const wins = matches.filter((m) => m.result).length;
  const losses = matches.length - wins;
  const winRate = (wins / matches.length) * 100;

  // Step 5: Calculate derived metrics
  onProgress?.({ stage: 'metrics', progress: 75, message: 'Analyzing playstyle...' });

  const derivedMetrics = calculateDerivedMetrics(matches);
  const archetype = determineArchetype(derivedMetrics);

  // Step 6: Detect watershed moment
  onProgress?.({ stage: 'watershed', progress: 80, message: 'Finding breakthrough moments...' });

  const watershedMoment = detectWatershedMoment(matches);

  // Step 7: Generate AI insights
  onProgress?.({ stage: 'ai', progress: 85, message: 'Generating personalized insights...' });

  const playerStats: PlayerStats = {
    puuid,
    riotId,
    tagLine,
    region,
    totalGames: matches.length,
    wins,
    losses,
    winRate: parseFloat(winRate.toFixed(2)),
    topChampions: championStats.slice(0, 10),
    championPoolSize: championStats.length,
    mainRole,
    roleDistribution: roleStats,
    avgKDA,
    avgKills: avgStats.avgKills,
    avgDeaths: avgStats.avgDeaths,
    avgAssists: avgStats.avgAssists,
    avgCS: avgStats.avgCS,
    avgVisionScore: avgStats.avgVisionScore,
    avgGameDuration: avgStats.avgGameDuration,
    longestWinStreak,
    longestLossStreak,
    currentStreak,
    performanceTrend,
    derivedMetrics,
    archetype,
    watershedMoment: watershedMoment || undefined,
    generatedAt: new Date().toISOString(),
  };

  // Generate AI insights
  try {
    const insights = await generatePlayerInsights(playerStats);
    playerStats.insights = insights;
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    // Continue without insights
  }

  // Step 8: Save to database
  onProgress?.({ stage: 'save', progress: 95, message: 'Saving analysis...' });

  await savePlayerAnalysis(playerStats, matches);

  onProgress?.({ stage: 'complete', progress: 100, message: 'Analysis complete!' });

  return playerStats;
}

/**
 * Save player analysis to database
 */
async function savePlayerAnalysis(stats: PlayerStats, matches: DBMatch[]): Promise<void> {
  // Save player data
  await upsertPlayer({
    puuid: stats.puuid,
    riot_id: stats.riotId,
    tag_line: stats.tagLine,
    region: stats.region,
    total_games: stats.totalGames,
    win_rate: stats.winRate,
    main_role: stats.mainRole,
    top_champions: stats.topChampions as any,
    derived_metrics: stats.derivedMetrics as any,
    narrative_story: stats.insights?.story_arc || '',
    insights: stats.insights as any,
    archetype: stats.archetype.name,
    generated_at: stats.generatedAt,
  });

  // Save matches
  await insertMatches(matches);

  // Mark watershed moment if exists
  if (stats.watershedMoment) {
    await markWatershedMoment(stats.watershedMoment.matchId, true);
  }

  // Update cache
  await updateAnalysisCache(stats.puuid, matches.length);
}

/**
 * Get player stats from cache
 */
export async function getCachedPlayerStats(
  riotId: string,
  tagLine: string
): Promise<PlayerStats | null> {
  const dbPlayer = await getPlayerByRiotId(riotId, tagLine);

  if (!dbPlayer) {
    return null;
  }

  return convertDBPlayerToStats(dbPlayer);
}

/**
 * Convert DB player to PlayerStats format
 */
function convertDBPlayerToStats(dbPlayer: any): PlayerStats {
  const matches = []; // Would need to fetch from DB if needed

  return {
    puuid: dbPlayer.puuid,
    riotId: dbPlayer.riot_id,
    tagLine: dbPlayer.tag_line,
    region: dbPlayer.region,
    totalGames: dbPlayer.total_games,
    wins: Math.round((dbPlayer.win_rate / 100) * dbPlayer.total_games),
    losses: dbPlayer.total_games - Math.round((dbPlayer.win_rate / 100) * dbPlayer.total_games),
    winRate: dbPlayer.win_rate,
    topChampions: dbPlayer.top_champions || [],
    championPoolSize: (dbPlayer.top_champions || []).length,
    mainRole: dbPlayer.main_role,
    roleDistribution: [],
    avgKDA: 0,
    avgKills: 0,
    avgDeaths: 0,
    avgAssists: 0,
    avgCS: 0,
    avgVisionScore: 0,
    avgGameDuration: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    currentStreak: { type: 'win', length: 0, startDate: '', endDate: '' },
    performanceTrend: [],
    derivedMetrics: dbPlayer.derived_metrics || {},
    archetype: {
      name: dbPlayer.archetype || 'Unknown',
      description: '',
      distance: 0,
      matchPercentage: 0,
      icon: '🎮',
    },
    insights: dbPlayer.insights || undefined,
    generatedAt: dbPlayer.generated_at,
  };
}

/**
 * Helper: Sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  analyzePlayer,
  getCachedPlayerStats,
};
