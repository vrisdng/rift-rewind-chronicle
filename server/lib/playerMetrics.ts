/**
 * Player Metrics Calculator
 * Calculates derived metrics and determines player archetypes
 * Uses pure mathematics (no AI embeddings) for cost efficiency
 */

import type {
  DBMatch,
  DerivedMetrics,
  ArchetypeProfile,
  PlayerArchetype,
  ProPlayerProfile,
} from '../types/index.js';

import { WORLDS_2024_PRO_PLAYERS } from '../constants/pro-player.ts';
import { ARCHETYPES } from '../constants/archetype.ts';

// ==================== TYPE DEFINITIONS ====================

/**
 * Player identity including archetype and pro comparison
 */
export interface PlayerIdentity {
  archetype: PlayerArchetype;
  proComparison: {
    primary: ProPlayerProfile;
    secondary: ProPlayerProfile;
    similarity: number;
    description: string;
  };
  topStrengths: Array<{ metric: string; value: number; percentile: number }>;
  needsWork: Array<{ metric: string; value: number; suggestion: string }>;
  playfulComparison: string;
}

/**
 * Metric importance weights for distance calculations
 */
const METRIC_WEIGHTS: Record<keyof DerivedMetrics, number> = {
  clutchFactor: 1.5,
  consistency: 1.5,
  aggression: 1.3,
  farming: 1.2,
  teamfighting: 1.2,
  lateGameScaling: 1.0,
  earlyGameStrength: 1.0,
  comebackRate: 1.0,
  tiltFactor: 0.9,
  snowballRate: 0.9,
  vision: 0.8,
  roaming: 0.8,
  improvementVelocity: 0.7,
  championPoolDepth: 0.5,
};


// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate weighted Euclidean distance between player metrics and target profile
 * Emphasizes important metrics like clutch factor and consistency
 */
function calculateWeightedDistance(
  metrics: DerivedMetrics,
  profile: Partial<DerivedMetrics>
): number {
  let weightedSumSquaredDiff = 0;
  let totalWeight = 0;

  for (const key in profile) {
    const metricKey = key as keyof DerivedMetrics;
    const metricValue = metrics[metricKey];
    const profileValue = profile[metricKey];
    const weight = METRIC_WEIGHTS[metricKey] || 1.0;

    if (typeof metricValue === 'number' && typeof profileValue === 'number') {
      weightedSumSquaredDiff += weight * Math.pow(metricValue - profileValue, 2);
      totalWeight += weight;
    }
  }

  return Math.sqrt(weightedSumSquaredDiff / totalWeight);
}

/**
 * Match player to closest pro player using weighted distance
 * Returns primary and secondary matches with similarity scores
 */
export function matchToProPlayer(metrics: DerivedMetrics): {
  primary: ProPlayerProfile;
  secondary: ProPlayerProfile;
  similarity: number;
  description: string;
} {
  const proScores = WORLDS_2024_PRO_PLAYERS.map((pro) => {
    const distance = calculateWeightedDistance(metrics, pro.metrics);
    const similarity = Math.max(0, 100 - distance);

    return {
      pro,
      similarity,
      distance,
    };
  });

  proScores.sort((a, b) => b.similarity - a.similarity);

  const primary = proScores[0];
  const secondary = proScores[1];

  const description = `Your playstyle mirrors ${primary.pro.name} (${Math.round(primary.similarity)}% match) from ${primary.pro.team}. ${primary.pro.playstyle}. You also share traits with ${secondary.pro.name} (${Math.round(secondary.similarity)}% match).`;

  return {
    primary: primary.pro,
    secondary: secondary.pro,
    similarity: Math.round(primary.similarity),
    description,
  };
}

/**
 * Get player's top 3 strongest metrics with percentile rankings
 */
function getTopStrengths(metrics: DerivedMetrics): Array<{ metric: string; value: number; percentile: number }> {
  const metricEntries = Object.entries(metrics) as [keyof DerivedMetrics, number][];
  metricEntries.sort((a, b) => b[1] - a[1]);

  return metricEntries.slice(0, 3).map(([metric, value]) => ({
    metric: formatMetricName(metric),
    value: Math.round(value),
    percentile: Math.round(value), // Using value as percentile approximation
  }));
}

/**
 * Get metrics that need improvement with actionable suggestions
 */
function getWeaknesses(metrics: DerivedMetrics): Array<{ metric: string; value: number; suggestion: string }> {
  const metricEntries = Object.entries(metrics) as [keyof DerivedMetrics, number][];
  metricEntries.sort((a, b) => a[1] - b[1]); // Lowest first

  const weakMetrics = metricEntries.slice(0, 3).filter(([_, value]) => value < 60);

  return weakMetrics.map(([metric, value]) => ({
    metric: formatMetricName(metric),
    value: Math.round(value),
    suggestion: getSuggestionForMetric(metric),
  }));
}

/**
 * Format metric key to readable name
 */
function formatMetricName(metric: keyof DerivedMetrics): string {
  const nameMap: Record<keyof DerivedMetrics, string> = {
    aggression: 'Aggression',
    farming: 'Farming',
    vision: 'Vision Control',
    consistency: 'Consistency',
    earlyGameStrength: 'Early Game',
    lateGameScaling: 'Late Game',
    comebackRate: 'Comeback Ability',
    clutchFactor: 'Clutch Factor',
    tiltFactor: 'Mental Fortitude',
    championPoolDepth: 'Champion Pool',
    improvementVelocity: 'Improvement Rate',
    roaming: 'Roaming',
    teamfighting: 'Teamfighting',
    snowballRate: 'Snowball Potential',
  };
  return nameMap[metric] || metric;
}

/**
 * Get improvement suggestion for specific metric
 */
function getSuggestionForMetric(metric: keyof DerivedMetrics): string {
  const suggestions: Record<keyof DerivedMetrics, string> = {
    aggression: 'Look for more opportunities to pressure opponents early. Practice recognizing power spikes.',
    farming: 'Focus on last-hitting practice and wave management. Aim for 7+ CS/min consistently.',
    vision: 'Buy more control wards and place them at key objectives. Watch mini-map more frequently.',
    consistency: 'Review your deaths after each game. Work on reducing unnecessary risks.',
    earlyGameStrength: 'Study level 1-3 trading patterns for your champions. Be more proactive early.',
    lateGameScaling: "Practice positioning in late-game teamfights. Don't get caught out.",
    comebackRate: 'Learn to identify win conditions when behind. Focus on vision denial and picks.',
    clutchFactor: 'Practice high-pressure scenarios. Review close games to spot missed opportunities.',
    tiltFactor: 'Take breaks after losses. Focus on learning, not LP. Review VODs with fresh eyes.',
    championPoolDepth: 'Add 2-3 meta champions to your pool. Practice them in normals first.',
    improvementVelocity: 'Set specific goals each week. Track your progress and review regularly.',
    roaming: 'Push wave and look for plays. Communicate with team before roaming.',
    teamfighting: 'Focus on positioning and target selection. Watch pro teamfights for positioning tips.',
    snowballRate: 'After getting ahead, focus on denying enemy resources and maintaining vision control.',
  };
  return suggestions[metric] || 'Keep practicing and reviewing your games.';
}

/**
 * Generate playful comparison based on metrics
 * Uses humor while staying accurate to player's stats
 */
export function getPlayfulComparison(metrics: DerivedMetrics): string {
  const strengths = getTopStrengths(metrics);
  const weaknesses = getWeaknesses(metrics);

  // High farming, low aggression
  if (metrics.farming > 80 && metrics.aggression < 50) {
    return "You farm like Chovy but fight like a caster minion 🌾";
  }

  // High aggression, low consistency
  if (metrics.aggression > 80 && metrics.consistency < 50) {
    return "Caps' aggression with a coinflip's consistency 🎲";
  }

  // High clutch, high consistency
  if (metrics.clutchFactor > 85 && metrics.consistency > 85) {
    return "Faker's clutch gene with Knight's reliability 👑";
  }

  // High vision
  if (metrics.vision > 85) {
    return "Keria's vision game but your team still face-checks bushes 👁️";
  }

  // High tilt factor
  if (metrics.tiltFactor > 70) {
    return "You're 70% skill, 30% mental boom after one death 💀";
  }

  // Balanced but unexceptional
  if (Math.max(...Object.values(metrics)) < 75) {
    return "Perfectly balanced... like all things should be (but also kinda meh) ⚖️";
  }

  // High early game, low late game
  if (metrics.earlyGameStrength > 80 && metrics.lateGameScaling < 50) {
    return "Zeus level 3 all-in energy, then you turn into a super minion 💪➡️😴";
  }

  // Default playful comparison
  const topStrength = strengths[0];
  const topWeakness = weaknesses[0];

  if (topStrength && topWeakness) {
    return `Elite ${topStrength.metric.toLowerCase()} but ${topWeakness.metric.toLowerCase()} needs work 🎯`;
  }

  return "You're built different... but the game hasn't figured out how yet 🤔";
}


// ==================== METRIC CALCULATIONS ====================

/**
 * Calculate all derived metrics from match history
 */
export function calculateDerivedMetrics(matches: DBMatch[]): DerivedMetrics {
  if (matches.length === 0) {
    return getDefaultMetrics();
  }

  return {
    aggression: calculateAggression(matches),
    farming: calculateFarming(matches),
    vision: calculateVision(matches),
    consistency: calculateConsistency(matches),
    earlyGameStrength: calculateEarlyGameStrength(matches),
    lateGameScaling: calculateLateGameScaling(matches),
    comebackRate: calculateComebackRate(matches),
    clutchFactor: calculateClutchFactor(matches),
    tiltFactor: calculateTiltFactor(matches),
    championPoolDepth: calculateChampionPoolDepth(matches),
    improvementVelocity: calculateImprovementVelocity(matches),
    roaming: calculateRoaming(matches),
    teamfighting: calculateTeamfighting(matches),
    snowballRate: calculateSnowballRate(matches),
  };
}

function getDefaultMetrics(): DerivedMetrics {
  return {
    aggression: 50,
    farming: 50,
    vision: 50,
    consistency: 50,
    earlyGameStrength: 50,
    lateGameScaling: 50,
    comebackRate: 50,
    clutchFactor: 50,
    tiltFactor: 50,
    championPoolDepth: 50,
    improvementVelocity: 50,
    roaming: 50,
    teamfighting: 50,
    snowballRate: 50,
  };
}

/**
 * Aggression: Based on KDA and kill participation
 */
function calculateAggression(matches: DBMatch[]): number {
  const avgKDA = matches.reduce((sum, m) => {
    const kda = m.deaths === 0 ? (m.kills + m.assists) * 1.2 : (m.kills + m.assists) / m.deaths;
    return sum + kda;
  }, 0) / matches.length;

  const avgKills = matches.reduce((sum, m) => sum + m.kills, 0) / matches.length;

  // Normalize: High KDA (>4) and high kills (>8) = 100
  const kdaScore = Math.min((avgKDA / 4) * 100, 100);
  const killScore = Math.min((avgKills / 8) * 100, 100);

  return Math.round((kdaScore * 0.6 + killScore * 0.4));
}

/**
 * Farming: CS per minute percentile
 */
function calculateFarming(matches: DBMatch[]): number {
  const csPerMinScores = matches.map((m) => {
    const csPerMin = m.cs / (m.duration / 60);
    // 8+ CS/min = 100, 5 CS/min = 50, 3 CS/min = 0
    return Math.min(Math.max(((csPerMin - 3) / 5) * 100, 0), 100);
  });

  return Math.round(csPerMinScores.reduce((sum, score) => sum + score, 0) / csPerMinScores.length);
}

/**
 * Vision: Vision score percentile
 */
function calculateVision(matches: DBMatch[]): number {
  const visionScores = matches.map((m) => {
    const visionPerMin = m.vision_score / (m.duration / 60);
    // 2+ vision/min = 100, 1 vision/min = 50, 0.5 = 0
    return Math.min(Math.max(((visionPerMin - 0.5) / 1.5) * 100, 0), 100);
  });

  return Math.round(visionScores.reduce((sum, score) => sum + score, 0) / visionScores.length);
}

/**
 * Consistency: Inverse of performance variance
 */
function calculateConsistency(matches: DBMatch[]): number {
  const scores = matches.map((m) => m.performance_score);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Low std dev (<10) = 100, high std dev (>30) = 0
  const consistencyScore = Math.max(100 - (stdDev / 30) * 100, 0);

  return Math.round(consistencyScore);
}

/**
 * Early Game Strength: Performance in games under 25 minutes
 */
function calculateEarlyGameStrength(matches: DBMatch[]): number {
  const shortGames = matches.filter((m) => m.duration < 25 * 60);

  if (shortGames.length < 3) {
    return 50; // Not enough data
  }

  const winRate = (shortGames.filter((m) => m.result).length / shortGames.length) * 100;
  const avgPerformance = shortGames.reduce((sum, m) => sum + m.performance_score, 0) / shortGames.length;

  // Don't over-weight win rate in short games
  return Math.round((winRate * 0.5 + avgPerformance * 0.5));
}

/**
 * Late Game Scaling: Performance in games over 35 minutes
 */
function calculateLateGameScaling(matches: DBMatch[]): number {
  const longGames = matches.filter((m) => m.duration > 35 * 60);

  if (longGames.length < 5) {
    return 50;
  }

  const winRate = (longGames.filter((m) => m.result).length / longGames.length) * 100;
  const avgPerformance = longGames.reduce((sum, m) => sum + m.performance_score, 0) / longGames.length;

  return Math.round((winRate * 0.6 + avgPerformance * 0.4));
}

/**
 * Comeback Rate: Win rate when performing poorly early
 */
function calculateComebackRate(matches: DBMatch[]): number {
  // Approximate: Games where player had poor KDA but still won
  const comebackGames = matches.filter((m) => {
    const kda = m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths;
    return m.result && kda < 2; // Won despite poor KDA
  });

  if (matches.length < 10) {
    return 50;
  }

  const comebackRate = (comebackGames.length / matches.filter((m) => m.result).length) * 100;
  return Math.min(Math.round(comebackRate * 2), 100); // Scale up
}

/**
 * Clutch Factor: Performance in close games
 */
function calculateClutchFactor(matches: DBMatch[]): number {
  // Close games: 25-40 minute games
  const closeGames = matches.filter((m) => m.duration >= 25 * 60 && m.duration <= 40 * 60);

  if (closeGames.length < 5) {
    return 50;
  }

  const avgPerformance = closeGames.reduce((sum, m) => sum + m.performance_score, 0) / closeGames.length;
  const winRate = (closeGames.filter((m) => m.result).length / closeGames.length) * 100;

  return Math.round((avgPerformance * 0.5 + winRate * 0.5));
}

/**
 * Tilt Factor: Performance drop after losses
 */
function calculateTiltFactor(matches: DBMatch[]): number {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  let gamesAfterLoss: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    if (!sorted[i - 1].result) {
      gamesAfterLoss.push(sorted[i].performance_score);
    }
  }

  if (gamesAfterLoss.length < 5) {
    return 50;
  }

  const avgAfterLoss = gamesAfterLoss.reduce((sum, s) => sum + s, 0) / gamesAfterLoss.length;
  const avgOverall = sorted.reduce((sum, m) => sum + m.performance_score, 0) / sorted.length;

  const performanceDrop = avgOverall - avgAfterLoss;

  // High drop (>15) = high tilt (100), no drop = no tilt (0)
  return Math.min(Math.max(Math.round((performanceDrop / 15) * 100), 0), 100);
}

/**
 * Champion Pool Depth: Unique champions played with decent performance
 */
function calculateChampionPoolDepth(matches: DBMatch[]): number {
  const championMap = new Map<string, number>();

  for (const match of matches) {
    championMap.set(match.champion_name, (championMap.get(match.champion_name) || 0) + 1);
  }

  const viableChampions = Array.from(championMap.entries()).filter(
    ([_, games]) => games >= 3
  ).length;

  // 10+ champions = 100, 5 = 50, 1-2 = 0
  return Math.min(Math.round((viableChampions / 10) * 100), 100);
}

/**
 * Improvement Velocity: Skill increase rate over time
 */
function calculateImprovementVelocity(matches: DBMatch[]): number {
  if (matches.length < 20) {
    return 50;
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
  const lastThird = sorted.slice(-Math.floor(sorted.length / 3));

  const firstAvg = firstThird.reduce((sum, m) => sum + m.performance_score, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((sum, m) => sum + m.performance_score, 0) / lastThird.length;

  const improvement = lastAvg - firstAvg;

  // 15+ improvement = 100, 0 = 50, -15 = 0
  return Math.min(Math.max(Math.round(50 + (improvement / 15) * 50), 0), 100);
}

/**
 * Roaming: Low CS with high kill participation (approximation)
 */
function calculateRoaming(matches: DBMatch[]): number {
  const roamScores = matches.map((m) => {
    const csPerMin = m.cs / (m.duration / 60);
    const killParticipation = m.kills + m.assists;

    // Low CS (<6) but high KP (>10) suggests roaming
    const lowCSScore = Math.max(100 - (csPerMin / 8) * 100, 0);
    const highKPScore = Math.min((killParticipation / 15) * 100, 100);

    return (lowCSScore * 0.4 + highKPScore * 0.6);
  });

  return Math.round(roamScores.reduce((sum, s) => sum + s, 0) / roamScores.length);
}

/**
 * Teamfighting: High KDA with high damage
 */
function calculateTeamfighting(matches: DBMatch[]): number {
  const teamfightScores = matches.map((m) => {
    const kda = m.deaths === 0 ? (m.kills + m.assists) * 1.2 : (m.kills + m.assists) / m.deaths;
    const damagePerMin = m.damage_dealt / (m.duration / 60);

    const kdaScore = Math.min((kda / 5) * 100, 100);
    const damageScore = Math.min((damagePerMin / 800) * 100, 100);

    return (kdaScore * 0.5 + damageScore * 0.5);
  });

  return Math.round(teamfightScores.reduce((sum, s) => sum + s, 0) / teamfightScores.length);
}

/**
 * Snowball Rate: Win rate when ahead early
 */
function calculateSnowballRate(matches: DBMatch[]): number {
  // More strict definition: Quick wins (<25min) with dominant performance (>80 score)
  const snowballWins = matches.filter((m) =>
    m.result && m.duration < 25 * 60 && m.performance_score > 80
  );

  const totalWins = matches.filter((m) => m.result).length;

  if (totalWins < 5) {
    return 50; // Not enough data
  }

  // What percentage of wins were snowballs?
  const snowballRate = (snowballWins.length / totalWins) * 100;
  
  // Don't inflate - use raw percentage
  return Math.round(snowballRate);
}

// ==================== ARCHETYPE MATCHING ====================

/**
 * Calculate Euclidean distance between player metrics and archetype profile
 */
function calculateDistance(metrics: DerivedMetrics, profile: Partial<DerivedMetrics>): number {
  let sumSquaredDiff = 0;
  let count = 0;

  for (const key in profile) {
    const metricKey = key as keyof DerivedMetrics;
    const metricValue = metrics[metricKey];
    const profileValue = profile[metricKey];

    if (typeof metricValue === 'number' && typeof profileValue === 'number') {
      sumSquaredDiff += Math.pow(metricValue - profileValue, 2);
      count++;
    }
  }

  return Math.sqrt(sumSquaredDiff / count);
}

/**
 * Determine archetype based on player's STRONGEST characteristics (relative scoring)
 * Emphasizes what the player excels at rather than absolute values
 */
export function determineArchetypeRelative(metrics: DerivedMetrics): PlayerArchetype {
  // Find player's top 5 strongest metrics (expanded for better matching)
  const metricEntries = Object.entries(metrics) as [keyof DerivedMetrics, number][];
  metricEntries.sort((a, b) => b[1] - a[1]);

  const topMetrics = metricEntries.slice(0, 5).map(([key]) => key);
  const bottomMetrics = metricEntries.slice(-3).map(([key]) => key);

  // Match archetypes based on what they EMPHASIZE, not absolute values
  const archetypeScores = ARCHETYPES.map((archetype) => {
    let strengthMatchScore = 0; // How well player's strengths match archetype
    let profileMatchScore = 0;  // General profile similarity
    let weaknessMatchScore = 0; // Check for conflicting weaknesses

    // Count how many defining traits match
    for (const [metric, archetypeValue] of Object.entries(archetype.profile)) {
      const metricKey = metric as keyof DerivedMetrics;
      const playerValue = metrics[metricKey] || 50;

      // If archetype REQUIRES this (>80), check if player has it
      if (archetypeValue > 80) {
        if (topMetrics.includes(metricKey) && playerValue > 70) {
          strengthMatchScore += 3; // Strong match!
        } else if (playerValue < 50) {
          strengthMatchScore -= 2; // Player lacks key trait
        }
      }

      // If archetype emphasizes this (>70)
      if (archetypeValue > 70 && playerValue > 65) {
        strengthMatchScore += 1;
      }

      // General similarity (normalized to 0-1)
      const similarity = 1 - Math.abs(archetypeValue - playerValue) / 100;
      profileMatchScore += similarity;

      // Check for conflicts: archetype requires low value but player has high
      if (archetypeValue < 40 && playerValue > 70) {
        weaknessMatchScore -= 1;
      }
    }

    // Normalize profile match score
    const numMetrics = Object.keys(archetype.profile).length;
    profileMatchScore = (profileMatchScore / numMetrics) * 100;

    // Combine scores with weights
    const totalScore = 
      strengthMatchScore * 10 + // Most important: matching key strengths
      profileMatchScore * 0.5 +  // General similarity
      weaknessMatchScore * 5;    // Penalty for conflicts

    const matchPercentage = Math.max(0, Math.min(100, Math.round(totalScore)));

    return {
      ...archetype,
      score: totalScore,
      matchPercentage,
    };
  });

  archetypeScores.sort((a, b) => b.score - a.score);

  return {
    name: archetypeScores[0].name,
    description: archetypeScores[0].description,
    distance: 0,
    matchPercentage: archetypeScores[0].matchPercentage,
    icon: archetypeScores[0].icon,
  };
}


/**
 * Get top 3 archetype matches
 */
export function getTopArchetypes(metrics: DerivedMetrics): PlayerArchetype[] {
  const archetypesWithDistances = ARCHETYPES.map((archetype) => {
    const distance = calculateDistance(metrics, archetype.profile);
    const matchPercentage = Math.max(100 - distance, 0);

    return {
      name: archetype.name,
      description: archetype.description,
      distance,
      matchPercentage: Math.round(matchPercentage),
      icon: archetype.icon,
    };
  });

  archetypesWithDistances.sort((a, b) => a.distance - b.distance);

  return archetypesWithDistances.slice(0, 3);
}

/**
 * Main function: Determine complete player identity
 * Combines archetype matching with pro player comparisons
 * Returns engaging, shareable results
 *
 * @param metrics - Calculated derived metrics from match history
 * @returns Complete player identity including archetype, pro comparison, strengths, and weaknesses
 *
 * @example
 * ```typescript
 * const metrics = calculateDerivedMetrics(matches);
 * const identity = determinePlayerIdentity(metrics);
 * console.log(`You play like ${identity.proComparison.primary.name}!`);
 * console.log(identity.playfulComparison); // "Faker's clutch gene with Knight's reliability 👑"
 * ```
 */
export function determinePlayerIdentity(metrics: DerivedMetrics): PlayerIdentity {
  // 1. Find their archetype (playstyle category) using relative scoring
  const archetype = determineArchetypeRelative(metrics);

  // 2. Find closest pro player (aspirational comparison)
  const proMatch = matchToProPlayer(metrics);

  // 3. Identify top strengths
  const topStrengths = getTopStrengths(metrics);

  // 4. Identify areas for improvement
  const needsWork = getWeaknesses(metrics);

  // 5. Generate playful comparison
  const playfulComparison = getPlayfulComparison(metrics);

  return {
    archetype,
    proComparison: {
      primary: proMatch.primary,
      secondary: proMatch.secondary,
      similarity: proMatch.similarity,
      description: proMatch.description,
    },
    topStrengths,
    needsWork,
    playfulComparison,
  };
}

// ==================== EXPORTS ====================

export default {
  calculateDerivedMetrics,
  determineArchetypeRelative,
  getTopArchetypes,
};
