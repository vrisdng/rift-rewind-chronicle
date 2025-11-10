/**
 * Player Analyzer
 * Main orchestrator that brings together all analysis components
 * Handles the complete flow from Riot API → Database → AI insights
 */

import { getClient } from './riot.ts';
import type { RiotMatch, PlayerStats, DBMatch, ProgressUpdate, DerivedMetrics } from '../types/index.ts';
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
import {
  calculateDerivedMetrics,
  determinePlayerIdentity,
  determinePlayerElement,
  getPersonaForElement,
} from './playerMetrics.ts';
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
  ARAM: 450,                  // ARAM
  ARENA: 1700,                // Arena
};

/**
 * Get Unix timestamp for earliest match we care about
 */
function getAnalysisStartTimestamp(): number {
  return Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000);
}

/**
 * Fetch ALL match IDs from the configured analysis window (handles pagination)
 * Fetches from all queue types defined in QUEUE_TYPES
 */
async function fetchAllRecentMatchIds(client: any, puuid: string): Promise<string[]> {
  const startTime = getAnalysisStartTimestamp();
  const endTime = Math.floor(Date.now() / 1000);
  
  let allMatchIds: string[] = [];
  const pageSize = 100; // Max per request
  
  console.log(`📅 Fetching matches from ${new Date(startTime * 1000).toISOString()} onwards...`);
  console.log(`⏰ Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`);
  console.log(`🎮 Queue types: ${Object.entries(QUEUE_TYPES).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  
  // Fetch matches from each queue type
  for (const [queueName, queueId] of Object.entries(QUEUE_TYPES)) {
    console.log(`\n🔍 Fetching ${queueName}...`);
    let start = 0;
    
    while (true) {
      try {
        const matchIds = await client.getMatchIdsByPuuid(puuid, {
          start,
          count: pageSize,
          startTime,
          endTime,
          queue: queueId,
        });
        
        if (matchIds.length === 0) {
          console.log(`📋 No more ${queueName} matches at offset ${start}`);
          break; // No more matches for this queue
        }
        
        allMatchIds = allMatchIds.concat(matchIds);
        console.log(`  � ${queueName}: ${matchIds.length} matches (total now: ${allMatchIds.length})`);
        
        if (matchIds.length < pageSize) {
          break; // Last page for this queue
        }
        
        start += pageSize;
      } catch (error) {
        console.error(`❌ Error fetching ${queueName} at offset ${start}:`, error);
        break;
      }
    }
  }
  
  console.log(`\n✅ Total match IDs found across all queues: ${allMatchIds.length}`);
  
  return allMatchIds;
}

/**
 * Analyze a player completely: fetch all matches in the configured window, calculate metrics, generate insights
 * @param forceRegenerateInsights - If true, will regenerate AI insights even if cached
 */
export async function analyzePlayer(
  riotId: string,
  tagLine: string,
  region: string = 'sg2',
  onProgress?: (update: ProgressUpdate) => void,
  forceRegenerateInsights: boolean = false
): Promise<PlayerStats> {
  const client = getClient({ region: region as any });

  // Step 1: Get player account
  onProgress?.({ stage: 'account', progress: 10, message: 'Fetching account info...' });

  const account = await client.getAccountByRiotId(riotId, tagLine);
  const { puuid } = account;

  // Step 2: Fetch match IDs FIRST (before creating database records)
  // This way we fail early if matches can't be fetched
  onProgress?.({ stage: 'matches', progress: 20, message: 'Fetching match list...' });

  let matchIds: string[];
  try {
    matchIds = await fetchAllRecentMatchIds(client, puuid);
  } catch (error: any) {
    // Failed to fetch match IDs - don't create any database records
    throw new Error(`Unable to fetch matches from Riot API. Please try again in a few moments. Error: ${error.message}`);
  }

  const matchIdSample = matchIds.slice(0, 5).join(', ') || 'none';
  console.log(
    `🎯 Riot returned ${matchIds.length} match IDs for ${riotId}#${tagLine} [region=${region}] (sample: ${matchIdSample})`,
  );
  if (matchIds.length <= 1) {
    console.warn(
      `⚠️ Low match count for ${riotId}#${tagLine}. startTime=${getAnalysisStartTimestamp()} queue filters=${Object.values(QUEUE_TYPES).join(
        ',',
      )}`,
    );
  }

  // Check if player exists in database
  const existingPlayer = await getPlayerByRiotId(riotId, tagLine);

  // Step 3: Check which matches we already have in cache
  let cachedMatches: DBMatch[] = [];
  if (existingPlayer) {
    cachedMatches = await getMatches(puuid);
  }

  let newMatchIds = matchIds.filter(id => !new Set(cachedMatches.map(m => m.match_id)).has(id));

  // CRITICAL CHECK: If no new matches AND no cached matches, fail completely
  if (matchIds.length === 0 && cachedMatches.length === 0) {
    throw new Error('No recent matches found for this player. They may not have queued in the selected timeframe yet. Please try again later.');
  }

  if (newMatchIds.length === 0 && cachedMatches.length === 0) {
    throw new Error('Unable to load match data. Please try again in a few moments.');
  }

  // Only NOW create/update player record (after we know we have matches)
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
    onProgress?.({ stage: 'cache', progress: 100, message: 'Using saved data' });
  }

  if (newMatchIds.length === 0 && cachedMatches.length > 0) {
    console.log(`📊 No new matches found, but using ${cachedMatches.length} saved matches`);
    onProgress?.({
      stage: 'processing',
      progress: 35,
      message: `Using ${cachedMatches.length} saved matches from previous analysis...`,
    });
  } else {
    console.log(`📊 Cache status: ${cachedMatches.length} cached, ${newMatchIds.length} new matches`);

    onProgress?.({
      stage: 'processing',
      progress: 35,
      message: `Fetching ${newMatchIds.length} new matches (${cachedMatches.length} saved)...`,
    });
  }

  // Step 4: Fetch new match details concurrently
  let newMatches: DBMatch[] = [];

  if (newMatchIds.length > 0) {
    let rawMatches: any[] = [];

    try {
      rawMatches = await client.fetchMatchesConcurrent(newMatchIds, 10);
    } catch (error: any) {
      console.error('❌ Failed to fetch match details:', error);

      // If we have cached matches, continue with those
      if (cachedMatches.length > 0) {
        console.log(`⚠️ Using ${cachedMatches.length} cached matches due to fetch error`);
      } else {
        // No cached matches and can't fetch new ones - fail completely
        throw new Error('Unable to fetch match details from Riot API. Please try again in a few moments.');
      }
    }

    // Convert to DB format
    if (rawMatches.length > 0) {
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
  }

  // Combine cached and new matches
  const allMatches = [...cachedMatches, ...newMatches];

  console.log(`✅ Total matches for analysis: ${allMatches.length}`);

  // FINAL VALIDATION: Must have at least some matches to analyze
  if (allMatches.length === 0) {
    throw new Error('Unable to load any match data. Please try again in a few moments. If this persists, the player may not have any ranked games in the selected timeframe.');
  }

  // Require a minimum number of matches for meaningful analysis
  if (allMatches.length < 5) {
    throw new Error(`Not enough match data for analysis (found ${allMatches.length} matches). Players need at least 5 eligible games for a complete year-in-review.`);
  }

  onProgress?.({
    stage: 'matches',
    progress: 30,
    message: `Found ${matchIds.length} matches in scope. Downloading details...`,
  });

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
    element: playerIdentity.element,
    persona: playerIdentity.persona,
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
    element_profile: stats.element as any,
    persona: stats.persona as any,
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

function hydrateDerivedMetrics(metrics?: Partial<DerivedMetrics>): DerivedMetrics {
  return {
    aggression: metrics?.aggression ?? 50,
    farming: metrics?.farming ?? 50,
    vision: metrics?.vision ?? 50,
    consistency: metrics?.consistency ?? 50,
    earlyGameStrength: metrics?.earlyGameStrength ?? 50,
    lateGameScaling: metrics?.lateGameScaling ?? 50,
    comebackRate: metrics?.comebackRate ?? 50,
    clutchFactor: metrics?.clutchFactor ?? 50,
    tiltFactor: metrics?.tiltFactor ?? 50,
    championPoolDepth: metrics?.championPoolDepth ?? 50,
    improvementVelocity: metrics?.improvementVelocity ?? 50,
    roaming: metrics?.roaming ?? 50,
    teamfighting: metrics?.teamfighting ?? 50,
    snowballRate: metrics?.snowballRate ?? 50,
    winrateVariance: metrics?.winrateVariance ?? 50,
    offMetaPickRate: metrics?.offMetaPickRate ?? 50,
  };
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

  const derived = hydrateDerivedMetrics(dbPlayer.derived_metrics);
  const archetypeProfile = {
    name: dbPlayer.archetype || 'Unknown',
    description: dbPlayer.archetype_description || '',
    distance: dbPlayer.archetype_distance || 0,
    matchPercentage: derived.consistency || 0,
  };
  const elementProfile = dbPlayer.element_profile || determinePlayerElement(derived);
  const personaProfile =
    dbPlayer.persona || getPersonaForElement(archetypeProfile.name, elementProfile);
  
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
    archetype: archetypeProfile,
    element: elementProfile,
    persona: personaProfile,
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
