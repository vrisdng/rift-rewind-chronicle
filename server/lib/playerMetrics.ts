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
} from '../types/index.js';

// ==================== ARCHETYPE DEFINITIONS ====================

export const ARCHETYPES: ArchetypeProfile[] = [
  {
    name: 'Calculated Assassin',
    description: 'High aggression with surgical precision. Knows when to strike.',
    profile: {
      aggression: 85,
      consistency: 70,
      clutchFactor: 80,
      farming: 60,
      vision: 50,
      earlyGameStrength: 75,
      lateGameScaling: 65,
    },
    icon: '🗡️',
  },
  {
    name: 'Scaling Specialist',
    description: 'Patient farmer who dominates late game. Weak early, unstoppable late.',
    profile: {
      farming: 90,
      lateGameScaling: 85,
      earlyGameStrength: 40,
      consistency: 80,
      aggression: 35,
      vision: 65,
      clutchFactor: 70,
    },
    icon: '📈',
  },
  {
    name: 'Vision Mastermind',
    description: 'Eyes everywhere. Controls the map with superior vision and information.',
    profile: {
      vision: 95,
      roaming: 70,
      teamfighting: 75,
      aggression: 50,
      farming: 60,
      consistency: 75,
      earlyGameStrength: 60,
    },
    icon: '👁️',
  },
  {
    name: 'Teamfight Commander',
    description: 'Thrives in chaos. The bigger the fight, the better they perform.',
    profile: {
      teamfighting: 90,
      clutchFactor: 85,
      aggression: 70,
      vision: 65,
      consistency: 75,
      lateGameScaling: 80,
      earlyGameStrength: 60,
    },
    icon: '⚔️',
  },
  {
    name: 'Early Game Bully',
    description: 'Dominates the first 15 minutes. Snowballs leads to victory.',
    profile: {
      earlyGameStrength: 95,
      aggression: 85,
      snowballRate: 80,
      lateGameScaling: 40,
      vision: 50,
      farming: 65,
      consistency: 60,
    },
    icon: '💪',
  },
  {
    name: 'Consistent Performer',
    description: 'Reliable and steady. Never ints, always contributes.',
    profile: {
      consistency: 95,
      tiltFactor: 20,
      aggression: 55,
      farming: 75,
      vision: 70,
      earlyGameStrength: 60,
      lateGameScaling: 60,
    },
    icon: '🎯',
  },
  {
    name: 'Clutch Player',
    description: 'Performs best under pressure. Turns impossible games around.',
    profile: {
      clutchFactor: 95,
      comebackRate: 85,
      aggression: 75,
      teamfighting: 80,
      consistency: 65,
      earlyGameStrength: 60,
      lateGameScaling: 70,
    },
    icon: '🔥',
  },
  {
    name: 'CS God',
    description: 'Farming perfection. Highest CS/min in every game.',
    profile: {
      farming: 95,
      consistency: 85,
      aggression: 40,
      vision: 55,
      earlyGameStrength: 60,
      lateGameScaling: 80,
      clutchFactor: 60,
    },
    icon: '💰',
  },
  {
    name: 'Roaming Terror',
    description: 'Never stays in lane. Creates pressure across the entire map.',
    profile: {
      roaming: 95,
      aggression: 80,
      vision: 75,
      farming: 50,
      earlyGameStrength: 80,
      teamfighting: 70,
      consistency: 60,
    },
    icon: '🌪️',
  },
  {
    name: 'Comeback King',
    description: 'Best when behind. Specializes in turning lost games into wins.',
    profile: {
      comebackRate: 90,
      clutchFactor: 85,
      lateGameScaling: 80,
      tiltFactor: 30,
      consistency: 70,
      teamfighting: 75,
      aggression: 65,
    },
    icon: '👑',
  },
  {
    name: 'Tilt-Proof Machine',
    description: 'Unshakeable mental. Performance never drops after losses.',
    profile: {
      tiltFactor: 10,
      consistency: 90,
      clutchFactor: 75,
      aggression: 60,
      farming: 70,
      vision: 70,
      earlyGameStrength: 60,
    },
    icon: '🧘',
  },
  {
    name: 'Snowball Expert',
    description: 'Gets ahead early and never lets go. Chokes out opponents.',
    profile: {
      snowballRate: 95,
      earlyGameStrength: 85,
      aggression: 80,
      farming: 70,
      lateGameScaling: 55,
      consistency: 70,
      clutchFactor: 65,
    },
    icon: '❄️',
  },
  {
    name: 'Safe Scaler',
    description: 'Plays safe, farms well, scales hard. Avoids risks.',
    profile: {
      farming: 85,
      consistency: 85,
      lateGameScaling: 85,
      aggression: 30,
      earlyGameStrength: 40,
      tiltFactor: 40,
      vision: 60,
    },
    icon: '🛡️',
  },
  {
    name: 'Chaos Agent',
    description: 'High variance, high reward. Either pops off or ints.',
    profile: {
      aggression: 95,
      consistency: 30,
      clutchFactor: 80,
      earlyGameStrength: 85,
      tiltFactor: 70,
      farming: 50,
      vision: 45,
    },
    icon: '🎲',
  },
  {
    name: 'Balanced Tactician',
    description: 'Well-rounded in all aspects. Master of fundamentals.',
    profile: {
      aggression: 65,
      farming: 70,
      vision: 70,
      consistency: 75,
      earlyGameStrength: 65,
      lateGameScaling: 65,
      clutchFactor: 70,
    },
    icon: '⚖️',
  },
];

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

  if (shortGames.length < 5) {
    return 50; // Not enough data
  }

  const winRate = (shortGames.filter((m) => m.result).length / shortGames.length) * 100;
  const avgPerformance = shortGames.reduce((sum, m) => sum + m.performance_score, 0) / shortGames.length;

  return Math.round((winRate * 0.6 + avgPerformance * 0.4));
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
  // Approximate: Short wins with high performance
  const snowballWins = matches.filter((m) =>
    m.result && m.duration < 30 * 60 && m.performance_score > 70
  );

  if (matches.length < 10) {
    return 50;
  }

  const snowballRate = (snowballWins.length / matches.filter((m) => m.result).length) * 100;
  return Math.min(Math.round(snowballRate * 1.5), 100);
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
 * Determine player archetype using distance metrics
 */
export function determineArchetype(metrics: DerivedMetrics): PlayerArchetype {
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

  // Sort by lowest distance (best match)
  archetypesWithDistances.sort((a, b) => a.distance - b.distance);

  return archetypesWithDistances[0];
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

export default {
  ARCHETYPES,
  calculateDerivedMetrics,
  determineArchetype,
  getTopArchetypes,
};
