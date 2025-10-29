/**
 * Player Metrics Calculator
 * Calculates derived metrics and determines player archetypes
 * Enhanced with pro player comparisons for engaging, shareable results
 * Uses pure mathematics (no AI embeddings) for cost efficiency
 */

import type {
  DBMatch,
  DerivedMetrics,
  ArchetypeProfile,
  PlayerArchetype,
} from '../types/index.js';

// ==================== TYPE DEFINITIONS ====================

/**
 * Professional player profile from Worlds 2024
 */
export interface ProPlayerProfile {
  name: string;
  team: string;
  role: 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';
  region: 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'PCS' | 'VCS';
  playstyle: string;
  metrics: Partial<DerivedMetrics>;
  achievements?: string;
  icon: string;
}

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

// ==================== PRO PLAYER PROFILES ====================

/**
 * Worlds 2024 professional player profiles
 * Metrics estimated from professional analysis and statistics
 */
export const WORLDS_2024_PRO_PLAYERS: ProPlayerProfile[] = [
  // ==================== T1 (WORLDS 2024 CHAMPIONS) ====================
  {
    name: 'Faker',
    team: 'T1',
    role: 'Mid',
    region: 'LCK',
    playstyle: 'The Unkillable Demon King - Clutch playmaker with legendary status',
    metrics: {
      clutchFactor: 98,
      consistency: 92,
      aggression: 85,
      teamfighting: 90,
      lateGameScaling: 85,
      roaming: 82,
      comebackRate: 95,
    },
    achievements: '5x Worlds Champion (2024 MVP)',
    icon: '🇰🇷',
  },
  {
    name: 'Zeus',
    team: 'T1', // Left to HLE after Worlds 2024
    role: 'Top',
    region: 'LCK',
    playstyle: 'Dominant lane carry with exceptional snowball potential',
    metrics: {
      earlyGameStrength: 95,
      aggression: 92,
      snowballRate: 90,
      consistency: 88,
      teamfighting: 85,
      lateGameScaling: 80,
      clutchFactor: 87,
    },
    achievements: 'Worlds 2024 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Oner',
    team: 'T1',
    role: 'Jungle',
    region: 'LCK',
    playstyle: 'Aggressive jungler with perfect objective control',
    metrics: {
      aggression: 88,
      roaming: 92,
      earlyGameStrength: 90,
      vision: 85,
      consistency: 87,
      clutchFactor: 88,
      snowballRate: 85,
    },
    achievements: 'Worlds 2024 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Gumayusi',
    team: 'T1',
    role: 'ADC',
    region: 'LCK',
    playstyle: 'High-variance mechanical genius with clutch teamfighting',
    metrics: {
      clutchFactor: 92,
      aggression: 88,
      teamfighting: 93,
      consistency: 75,
      lateGameScaling: 88,
      farming: 90,
      earlyGameStrength: 82,
    },
    achievements: 'Worlds 2024 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Keria',
    team: 'T1',
    role: 'Support',
    region: 'LCK',
    playstyle: 'Vision mastermind and aggressive playmaking support',
    metrics: {
      vision: 98,
      roaming: 93,
      aggression: 88,
      clutchFactor: 90,
      teamfighting: 95,
      consistency: 90,
      earlyGameStrength: 88,
    },
    achievements: 'Worlds 2024 Champion',
    icon: '🇰🇷',
  },

  // ==================== BLG (WORLDS 2024 RUNNERS-UP) ====================
  {
    name: 'Bin',
    team: 'BLG',
    role: 'Top',
    region: 'LPL',
    playstyle: 'High-risk, high-reward Jax master with extreme variance',
    metrics: {
      aggression: 96,
      clutchFactor: 88,
      earlyGameStrength: 92,
      consistency: 55,
      snowballRate: 90,
      teamfighting: 85,
      lateGameScaling: 75,
    },
    achievements: 'Worlds 2024 Finalist, LPL Champion',
    icon: '🇨🇳',
  },
  {
    name: 'Xun',
    team: 'BLG',
    role: 'Jungle',
    region: 'LPL',
    playstyle: 'Aggressive jungler with strong early game pressure',
    metrics: {
      aggression: 90,
      earlyGameStrength: 92,
      roaming: 88,
      vision: 80,
      snowballRate: 87,
      consistency: 80,
      clutchFactor: 82,
    },
    achievements: 'Worlds 2024 Finalist',
    icon: '🇨🇳',
  },
  {
    name: 'Knight',
    team: 'BLG',
    role: 'Mid',
    region: 'LPL',
    playstyle: 'Consistent DPS machine with exceptional teamfighting',
    metrics: {
      teamfighting: 96,
      consistency: 94,
      farming: 92,
      lateGameScaling: 90,
      clutchFactor: 88,
      aggression: 78,
      earlyGameStrength: 82,
    },
    achievements: 'Worlds 2024 Finalist, LPL MVP',
    icon: '🇨🇳',
  },
  {
    name: 'Elk',
    team: 'BLG',
    role: 'ADC',
    region: 'LPL',
    playstyle: 'Aggressive lane-dominant ADC with strong positioning',
    metrics: {
      aggression: 90,
      earlyGameStrength: 88,
      teamfighting: 92,
      consistency: 85,
      lateGameScaling: 85,
      farming: 88,
      clutchFactor: 85,
    },
    achievements: 'Worlds 2024 Finalist',
    icon: '🇨🇳',
  },
  {
    name: 'ON',
    team: 'BLG',
    role: 'Support',
    region: 'LPL',
    playstyle: 'Aggressive roaming support with strong engage',
    metrics: {
      roaming: 94,
      aggression: 90,
      vision: 82,
      clutchFactor: 85,
      teamfighting: 88,
      earlyGameStrength: 88,
      consistency: 80,
    },
    achievements: 'Worlds 2024 Finalist',
    icon: '🇨🇳',
  },

  // ==================== GEN.G (SEMIFINALS) ====================
  {
    name: 'Chovy',
    team: 'Gen.G',
    role: 'Mid',
    region: 'LCK',
    playstyle: 'Perfect CS machine with exceptional scaling',
    metrics: {
      farming: 99,
      consistency: 96,
      lateGameScaling: 92,
      teamfighting: 90,
      aggression: 65,
      clutchFactor: 87,
      earlyGameStrength: 75,
    },
    achievements: 'MSI 2024 Champion, LCK MVP',
    icon: '🇰🇷',
  },
  {
    name: 'Peyz',
    team: 'Gen.G',
    role: 'ADC',
    region: 'LCK',
    playstyle: 'Rising star ADC with aggressive teamfighting',
    metrics: {
      aggression: 88,
      teamfighting: 90,
      earlyGameStrength: 87,
      lateGameScaling: 85,
      consistency: 83,
      clutchFactor: 85,
      farming: 88,
    },
    achievements: 'MSI 2024 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Canyon',
    team: 'Gen.G',
    role: 'Jungle',
    region: 'LCK',
    playstyle: 'Cerebral jungler with perfect pathing and vision control',
    metrics: {
      vision: 95,
      consistency: 94,
      roaming: 90,
      earlyGameStrength: 88,
      clutchFactor: 90,
      teamfighting: 88,
      aggression: 80,
    },
    achievements: 'MSI 2024 Champion, Worlds 2020 Champion',
    icon: '🇰🇷',
  },

  // ==================== HLE (HANWHA LIFE ESPORTS - SEMIFINALS) ====================
  {
    name: 'Doran',
    team: 'HLE',
    role: 'Top',
    region: 'LCK',
    playstyle: 'Versatile top with strong teamfighting and reliability',
    metrics: {
      teamfighting: 90,
      consistency: 87,
      lateGameScaling: 85,
      farming: 85,
      earlyGameStrength: 80,
      aggression: 75,
      clutchFactor: 82,
    },
    achievements: 'Worlds 2024 Semifinalist',
    icon: '🇰🇷',
  },
  {
    name: 'Zeka',
    team: 'HLE',
    role: 'Mid',
    region: 'LCK',
    playstyle: 'Clutch performer who thrives under pressure',
    metrics: {
      clutchFactor: 94,
      teamfighting: 89,
      consistency: 82,
      aggression: 80,
      lateGameScaling: 85,
      comebackRate: 88,
      farming: 83,
    },
    achievements: 'Worlds 2022 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Viper',
    team: 'HLE',
    role: 'ADC',
    region: 'LCK',
    playstyle: 'Consistent ADC with exceptional positioning',
    metrics: {
      consistency: 93,
      teamfighting: 92,
      lateGameScaling: 90,
      farming: 92,
      clutchFactor: 88,
      aggression: 70,
      earlyGameStrength: 78,
    },
    achievements: 'Worlds 2021 Champion',
    icon: '🇰🇷',
  },

  // ==================== WEIBO GAMING (QUARTERFINALS) ====================
  {
    name: 'TheShy',
    team: 'Weibo Gaming',
    role: 'Top',
    region: 'LPL',
    playstyle: 'Legendary aggressive carry with high variance',
    metrics: {
      aggression: 97,
      clutchFactor: 88,
      earlyGameStrength: 93,
      consistency: 60,
      snowballRate: 92,
      lateGameScaling: 75,
      teamfighting: 82,
    },
    achievements: 'Worlds 2018 Champion',
    icon: '🇨🇳',
  },
  {
    name: 'Xiaohu',
    team: 'Weibo Gaming',
    role: 'Mid',
    region: 'LPL',
    playstyle: 'Versatile veteran with deep champion pool',
    metrics: {
      championPoolDepth: 94,
      consistency: 90,
      teamfighting: 88,
      farming: 85,
      lateGameScaling: 87,
      clutchFactor: 87,
      earlyGameStrength: 78,
    },
    achievements: 'MSI 2021 Champion',
    icon: '🇨🇳',
  },

  // ==================== TOP ESPORTS (SWISS STAGE) ====================
  {
    name: 'JackeyLove',
    team: 'Top Esports',
    role: 'ADC',
    region: 'LPL',
    playstyle: 'Aggressive lane dominant ADC with clutch potential',
    metrics: {
      aggression: 92,
      clutchFactor: 90,
      earlyGameStrength: 90,
      teamfighting: 90,
      consistency: 78,
      lateGameScaling: 85,
      farming: 88,
    },
    achievements: 'Worlds 2019 Champion',
    icon: '🇨🇳',
  },
  {
    name: '369',
    team: 'Top Esports',
    role: 'Top',
    region: 'LPL',
    playstyle: 'Reliable carry top with strong teamfighting',
    metrics: {
      consistency: 90,
      teamfighting: 90,
      lateGameScaling: 88,
      farming: 88,
      snowballRate: 85,
      earlyGameStrength: 83,
      aggression: 80,
    },
    achievements: 'LPL Champion',
    icon: '🇨🇳',
  },

  // ==================== G2 ESPORTS (QUARTERFINALS) ====================
  {
    name: 'Caps',
    team: 'G2 Esports',
    role: 'Mid',
    region: 'LEC',
    playstyle: 'Baby Faker - High-risk playmaker with explosive potential',
    metrics: {
      aggression: 94,
      clutchFactor: 90,
      consistency: 68,
      roaming: 88,
      earlyGameStrength: 85,
      teamfighting: 85,
      comebackRate: 85,
    },
    achievements: 'MSI 2019 Champion, 4x LEC Champion',
    icon: '🇪🇺',
  },
  {
    name: 'Hans Sama',
    team: 'G2 Esports',
    role: 'ADC',
    region: 'LEC',
    playstyle: 'Aggressive ADC who thrives in skirmishes',
    metrics: {
      aggression: 87,
      teamfighting: 88,
      earlyGameStrength: 83,
      consistency: 82,
      lateGameScaling: 83,
      clutchFactor: 83,
      farming: 84,
    },
    achievements: 'Worlds 2024 Quarterfinalist',
    icon: '🇪🇺',
  },
  {
    name: 'Yike',
    team: 'G2 Esports',
    role: 'Jungle',
    region: 'LEC',
    playstyle: 'Aggressive early-game jungler with smart pathing',
    metrics: {
      earlyGameStrength: 90,
      aggression: 88,
      roaming: 88,
      vision: 82,
      consistency: 80,
      snowballRate: 85,
      teamfighting: 82,
    },
    achievements: 'LEC Champion 2024',
    icon: '🇪🇺',
  },

  // ==================== FLYQUEST (QUARTERFINALS) ====================
  {
    name: 'Bwipo',
    team: 'FlyQuest',
    role: 'Top',
    region: 'LCS',
    playstyle: 'Versatile veteran with champion pool depth',
    metrics: {
      championPoolDepth: 90,
      consistency: 85,
      aggression: 82,
      teamfighting: 87,
      clutchFactor: 85,
      earlyGameStrength: 80,
      lateGameScaling: 78,
    },
    achievements: 'Worlds 2018 Finalist, LCS Champion',
    icon: '🇺🇸',
  },
  {
    name: 'Inspired',
    team: 'FlyQuest',
    role: 'Jungle',
    region: 'LCS',
    playstyle: 'Smart pathing and vision control specialist',
    metrics: {
      vision: 92,
      consistency: 88,
      roaming: 87,
      earlyGameStrength: 85,
      clutchFactor: 82,
      teamfighting: 85,
      aggression: 78,
    },
    achievements: 'LCS Champion, LEC MVP',
    icon: '🇺🇸',
  },

  // ==================== TEAM LIQUID (SWISS STAGE) ====================
  {
    name: 'Impact',
    team: 'Team Liquid',
    role: 'Top',
    region: 'LCS',
    playstyle: 'Rock-solid veteran with exceptional consistency',
    metrics: {
      consistency: 94,
      teamfighting: 90,
      lateGameScaling: 88,
      tiltFactor: 15,
      clutchFactor: 90,
      farming: 85,
      earlyGameStrength: 78,
    },
    achievements: 'Worlds 2013 Champion',
    icon: '🇺🇸',
  },
  {
    name: 'CoreJJ',
    team: 'Team Liquid',
    role: 'Support',
    region: 'LCS',
    playstyle: 'World-class support with vision mastery',
    metrics: {
      vision: 96,
      consistency: 92,
      teamfighting: 92,
      clutchFactor: 88,
      roaming: 85,
      earlyGameStrength: 82,
      aggression: 75,
    },
    achievements: 'Worlds 2017 Champion',
    icon: '🇺🇸',
  },

  // ==================== DPLUS KIA (SWISS STAGE) ====================
  {
    name: 'ShowMaker',
    team: 'Dplus KIA',
    role: 'Mid',
    region: 'LCK',
    playstyle: 'Clutch mechanical genius with lane dominance',
    metrics: {
      clutchFactor: 92,
      aggression: 88,
      consistency: 88,
      teamfighting: 90,
      earlyGameStrength: 87,
      lateGameScaling: 85,
      farming: 88,
    },
    achievements: 'Worlds 2020 Champion',
    icon: '🇰🇷',
  },
  {
    name: 'Deft',
    team: 'Dplus KIA',
    role: 'ADC',
    region: 'LCK',
    playstyle: 'Legendary ADC with patient scaling',
    metrics: {
      lateGameScaling: 94,
      consistency: 92,
      teamfighting: 93,
      farming: 93,
      clutchFactor: 90,
      aggression: 70,
      earlyGameStrength: 75,
    },
    achievements: 'Worlds 2022 Champion',
    icon: '🇰🇷',
  },

  // ==================== LNG ESPORTS (SWISS STAGE) ====================
  {
    name: 'Tarzan',
    team: 'LNG Esports',
    role: 'Jungle',
    region: 'LPL',
    playstyle: 'Cerebral jungler with perfect macro play',
    metrics: {
      vision: 93,
      consistency: 90,
      roaming: 90,
      clutchFactor: 87,
      earlyGameStrength: 87,
      teamfighting: 88,
      aggression: 82,
    },
    achievements: 'LPL Champion',
    icon: '🇨🇳',
  },
  {
    name: 'Gala',
    team: 'LNG Esports',
    role: 'ADC',
    region: 'LPL',
    playstyle: 'Consistent teamfight ADC with strong positioning',
    metrics: {
      teamfighting: 92,
      consistency: 90,
      lateGameScaling: 90,
      farming: 90,
      clutchFactor: 87,
      aggression: 75,
      earlyGameStrength: 80,
    },
    achievements: 'MSI 2021 Finalist',
    icon: '🇨🇳',
  },

  // ==================== FNATIC (SWISS STAGE) ====================
  {
    name: 'Razork',
    team: 'Fnatic',
    role: 'Jungle',
    region: 'LEC',
    playstyle: 'Aggressive early-game jungler',
    metrics: {
      aggression: 88,
      earlyGameStrength: 88,
      roaming: 85,
      snowballRate: 83,
      consistency: 78,
      vision: 80,
      teamfighting: 80,
    },
    achievements: 'LEC Champion',
    icon: '🇪🇺',
  },
  {
    name: 'Humanoid',
    team: 'Fnatic',
    role: 'Mid',
    region: 'LEC',
    playstyle: 'Lane-dominant mid with strong roaming',
    metrics: {
      aggression: 85,
      roaming: 85,
      earlyGameStrength: 85,
      consistency: 82,
      teamfighting: 85,
      lateGameScaling: 80,
      clutchFactor: 82,
    },
    achievements: 'LEC Champion',
    icon: '🇪🇺',
  },
];

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
  const proScores = WORLDS_PRO_PLAYERS.map((pro) => {
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
 * Determine archetype based on player's STRONGEST characteristics (relative scoring)
 * Emphasizes what the player excels at rather than absolute values
 */
export function determineArchetypeRelative(metrics: DerivedMetrics): PlayerArchetype {
  // Find player's top 3 strongest metrics
  const metricEntries = Object.entries(metrics) as [keyof DerivedMetrics, number][];
  metricEntries.sort((a, b) => b[1] - a[1]);

  const topMetrics = metricEntries.slice(0, 3).map(([key]) => key);

  // Match archetypes based on what they EMPHASIZE, not absolute values
  const archetypeScores = ARCHETYPES.map((archetype) => {
    let score = 0;

    // Check if archetype's strong points match player's strong points
    for (const [metric, value] of Object.entries(archetype.profile)) {
      const metricKey = metric as keyof DerivedMetrics;
      const playerValue = metrics[metricKey];

      // If archetype emphasizes this metric (>75) AND player is good at it
      if (value > 75 && topMetrics.includes(metricKey)) {
        score += 30; // Big bonus for matching strengths
      }

      // Penalty for archetype requiring something player lacks
      if (value > 75 && playerValue < 50) {
        score -= 15;
      }

      // Small bonus for general similarity
      score += Math.max(0, 100 - Math.abs(value - playerValue)) * 0.1;
    }

    return {
      ...archetype,
      score,
      matchPercentage: Math.max(0, Math.min(100, Math.round(score))),
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
 * Determine player archetype using distance metrics (legacy method)
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
  // Core functions
  calculateDerivedMetrics,
  determinePlayerIdentity,
  
  // Legacy functions (maintained for compatibility)
  determineArchetype,
  determineArchetypeRelative,
  getTopArchetypes,
  
  // Pro player matching
  matchToProPlayer,
  getPlayfulComparison,
  
  // Constants
  ARCHETYPES,
  WORLDS_PRO_PLAYERS,
};
