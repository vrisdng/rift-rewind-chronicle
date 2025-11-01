/**
 * Player Analyzer
 * Main orchestrator that brings together all analysis components
 * Handles the complete flow from Riot API → Database → AI insights
 */

import { getClient } from './riot.ts';
import type { RiotMatch, PlayerStats, DBMatch, ProgressUpdate } from '../types/index.ts';
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
} from './matchAnalyzer.ts';
import { calculateDerivedMetrics, determinePlayerIdentity } from './playerMetrics.ts';
import { detectWatershedMoment } from './watershedDetector.ts';
import { generatePlayerInsights } from './insightGenerator.ts';
import {
  getPlayerByRiotId,
  upsertPlayer,
  getMatches,
  insertMatches,
  markWatershedMoment,
  needsRefresh,
} from './supabaseClient.ts';

// const RANKED_SOLO_QUEUE = 420; // Uncomment for ranked only

const QUEUE_TYPES = {
  RANKED_SOLO: 420,           // Ranked Solo/Duo
  RANKED_FLEX: 440,           // Ranked Flex
  NORMAL_DRAFT: 400,          // Normal Draft Pick
  NORMAL_BLIND: 430,          // Normal Blind Pick
};

/**
 * Get Unix timestamp for start of 2025
 */
function get2025StartTimestamp(): number {
  return Math.floor(new Date('2025-01-01T00:00:00Z').getTime() / 1000);
}

/**
 * Fetch ALL match IDs from 2025 (handles pagination)
 */
async function fetchAll2025MatchIds(client: any, puuid: string): Promise<string[]> {
  const startTime = get2025StartTimestamp();
  const endTime = Math.floor(Date.now() / 1000);
  
  let allMatchIds: string[] = [];
  let start = 0;
  const pageSize = 100; // Max per request
  
  console.log(`📅 Fetching ALL matches from 2025-01-01 onwards...`);
  
  while (true) {
    const matchIds = await client.getMatchIdsByPuuid(puuid, {
      start,
      count: pageSize,
      startTime,
      endTime,
      // queue: RANKED_SOLO_QUEUE, // Uncomment for ranked only
    });
    
    if (matchIds.length === 0) {
      break; // No more matches
    }
    
    allMatchIds = allMatchIds.concat(matchIds);
    console.log(`📋 Fetched ${allMatchIds.length} match IDs so far...`);
    
    if (matchIds.length < pageSize) {
      break; // Last page
    }
    
    start += pageSize;
  }
  
  console.log(`✅ Total match IDs found: ${allMatchIds.length}`);
  return allMatchIds;
}

/**
 * Analyze a player completely: fetch ALL 2025 matches, calculate metrics, generate insights
 * @param forceRegenerateInsights - If true, will regenerate AI insights even if cached
 */
export async function analyzePlayer(
  riotId: string,
  tagLine: string,
  region: string = 'sg2',
  onProgress?: (update: ProgressUpdate) => void,
  forceRegenerateInsights: boolean = false
): Promise<PlayerStats> {
  const client = getClient({ platform: region as any });

  // Step 1: Get player account
  onProgress?.({ stage: 'account', progress: 10, message: 'Fetching account info...' });

  const account = await client.getAccountByRiotId(riotId, tagLine);
  const { puuid } = account;

  // IMPORTANT: Save player to database FIRST, before attempting to fetch cached matches
  // This ensures the player exists before any foreign key references are attempted
  onProgress?.({ stage: 'account', progress: 15, message: 'Creating player record...' });
  
  await upsertPlayer({
    puuid,
    riot_id: riotId,
    tag_line: tagLine,
    region,
  });
  
  console.log(`✅ Player ${riotId}#${tagLine} created/updated in database`);

  // Check if we have recent cached data
  const shouldRefresh = await needsRefresh(puuid, 24);

  if (!shouldRefresh) {
    onProgress?.({ stage: 'cache', progress: 100, message: 'Using cached data' });
  }

  // Step 2: Fetch ALL 2025 match IDs (with pagination)
  onProgress?.({ stage: 'matches', progress: 20, message: 'Fetching 2025 match list...' });

  const matchIds = await fetchAll2025MatchIds(client, puuid);

  if (matchIds.length === 0) {
    throw new Error('No matches found in 2025 for this player');
  }

  onProgress?.({
    stage: 'matches',
    progress: 30,
    message: `Found ${matchIds.length} matches in 2025. Downloading details...`,
  });

  // Step 3: Check which matches we already have in cache (safe now that player exists)
  const cachedMatches = await getMatches(puuid);
  const cachedMatchIds = new Set(cachedMatches.map(m => m.match_id));
  const newMatchIds = matchIds.filter(id => !cachedMatchIds.has(id));
  
  console.log(`📊 Cache status: ${cachedMatchIds.size} cached, ${newMatchIds.length} new matches`);

  onProgress?.({
    stage: 'processing',
    progress: 35,
    message: `Fetching ${newMatchIds.length} new matches (${cachedMatchIds.size} cached)...`,
  });

  // Step 4: Fetch new match details concurrently
  let newMatches: DBMatch[] = [];
  
  if (newMatchIds.length > 0) {
    const rawMatches = await client.fetchMatchesConcurrent(newMatchIds, 10);
    
    // Convert to DB format
    for (const matchData of rawMatches) {
      const dbMatch = convertMatchToDBFormat(matchData, puuid);
      if (dbMatch) {
        newMatches.push(dbMatch);
      }
    }
    
    // Save new matches to cache
    if (newMatches.length > 0) {
      await insertMatches(newMatches);
      console.log(`💾 Saved ${newMatches.length} new matches to cache`);
    }
  }

  // Combine cached and new matches
  const allMatches = [...cachedMatches, ...newMatches];
  
  console.log(`✅ Total matches for analysis: ${allMatches.length}`);

  if (allMatches.length === 0) {
    throw new Error('No valid matches found for this player');
  }

  // Step 5: Calculate statistics
  onProgress?.({ stage: 'stats', progress: 65, message: 'Calculating statistics...' });

  const championStats = calculateChampionStats(allMatches);
  const roleStats = calculateRoleStats(allMatches);
  const mainRole = getMainRole(allMatches);
  const longestWinStreak = findLongestWinStreak(allMatches);
  const longestLossStreak = findLongestLossStreak(allMatches);
  const currentStreak = getCurrentStreak(allMatches);
  const performanceTrend = calculatePerformanceTrends(allMatches);
  const avgKDA = calculateAverageKDA(allMatches);
  const avgStats = calculateAverageStats(allMatches);

  const wins = allMatches.filter((m) => m.result).length;
  const losses = allMatches.length - wins;
  const winRate = (wins / allMatches.length) * 100;

  // Step 6: Calculate derived metrics and player identity
  onProgress?.({ stage: 'metrics', progress: 75, message: 'Analyzing playstyle...' });

  const derivedMetrics = calculateDerivedMetrics(allMatches);
  const playerIdentity = determinePlayerIdentity(derivedMetrics);

  // Step 7: Detect watershed moment
  onProgress?.({ stage: 'watershed', progress: 80, message: 'Finding breakthrough moments...' });

  const watershedMoment = detectWatershedMoment(allMatches);

  // Step 8: Generate AI insights
  onProgress?.({ stage: 'ai', progress: 85, message: 'Generating personalized insights...' });

  const playerStats: PlayerStats = {
    puuid,
    riotId,
    tagLine,
    region,
    totalGames: allMatches.length,
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
    archetype: playerIdentity.archetype,
    watershedMoment: watershedMoment || undefined,
    // New identity fields
    proComparison: playerIdentity.proComparison,
    topStrengths: playerIdentity.topStrengths,
    needsWork: playerIdentity.needsWork,
    playfulComparison: playerIdentity.playfulComparison,
    generatedAt: new Date().toISOString(),
  };

  // Generate AI insights (or use cached if available)
  try {
    // Check if player already has cached insights (unless forced to regenerate)
    const existingPlayer = await getPlayerByRiotId(riotId, tagLine);
    const hasExistingInsights = existingPlayer?.insights && Object.keys(existingPlayer.insights).length > 0;

    if (hasExistingInsights && !forceRegenerateInsights) {
      console.log('✅ Using cached AI insights (already generated)');
      playerStats.insights = existingPlayer.insights;
    } else {
      if (forceRegenerateInsights && hasExistingInsights) {
        console.log('🔄 Force regenerating AI insights...');
      } else {
        console.log('🤖 Generating new AI insights...');
      }
      const insights = await generatePlayerInsights(playerStats);
      playerStats.insights = insights;
    }
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    // Continue without insights
  }

  // Step 9: Save to database
  onProgress?.({ stage: 'save', progress: 95, message: 'Saving analysis...' });

  await savePlayerAnalysis(playerStats, allMatches);

  onProgress?.({ stage: 'complete', progress: 100, message: 'Analysis complete!' });

  return playerStats;
}

/**
 * Save player analysis to database
 */
async function savePlayerAnalysis(stats: PlayerStats, matches: DBMatch[]): Promise<void> {
  // Step 1: Update player data with full analysis results
  // (Player already exists from analyzePlayer, so this is a safe update)
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
    // New identity fields
    pro_comparison: stats.proComparison as any,
    top_strengths: stats.topStrengths as any,
    needs_work: stats.needsWork as any,
    playful_comparison: stats.playfulComparison,
    generated_at: stats.generatedAt,
  });

  console.log(`✅ Player ${stats.riotId}#${stats.tagLine} analysis updated in database`);

  // Step 2: Only after player is saved, insert any new matches (foreign key constraint)
  // Note: Some matches may already be in DB from earlier in analyzePlayer(), so insertMatches
  // should handle duplicates via upsert with onConflict
  if (matches.length > 0) {
    await insertMatches(matches);
    console.log(`✅ ${matches.length} matches saved for ${stats.riotId}#${stats.tagLine}`);
  }

  // Step 3: Mark watershed moment if exists
  if (stats.watershedMoment) {
    await markWatershedMoment(stats.watershedMoment.matchId, true);
    console.log(`🌊 Watershed moment marked for ${stats.riotId}#${stats.tagLine}`);
  }
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

  return await convertDBPlayerToStats(dbPlayer);
}

/**
 * Convert DB player to PlayerStats format
 */
async function convertDBPlayerToStats(dbPlayer: any): Promise<PlayerStats> {
  // Fetch recent matches
  const matches = await getMatches(dbPlayer.puuid);
  
  // Calculate stats from match history
  const roleStats = calculateRoleStats(matches);
  const avgStats = calculateAverageStats(matches);
  const avgKDA = calculateAverageKDA(matches);
  const longestWinStreak = findLongestWinStreak(matches);
  const longestLossStreak = findLongestLossStreak(matches);
  const currentStreak = getCurrentStreak(matches);
  const performanceTrend = calculatePerformanceTrends(matches);

  const derived = dbPlayer.derived_metrics || {};
  
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
    championPoolSize: derived.championPoolDepth || (dbPlayer.top_champions || []).length,
    mainRole: dbPlayer.main_role,
    roleDistribution: roleStats,
    avgKDA: avgKDA,
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
    derivedMetrics: derived,
    archetype: {
      name: dbPlayer.archetype || 'Unknown',
      description: dbPlayer.archetype_description || '',
      distance: dbPlayer.archetype_distance || 0,
      matchPercentage: derived.consistency || 0,
      icon: dbPlayer.archetype_icon || '🎮',
    },
    // New identity fields from database
    proComparison: dbPlayer.pro_comparison || undefined,
    topStrengths: dbPlayer.top_strengths || undefined,
    needsWork: dbPlayer.needs_work || undefined,
    playfulComparison: dbPlayer.playful_comparison || undefined,
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
