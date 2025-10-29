/**
 * Test archetype matching with sample metrics
 */

import { determineArchetypeRelative, calculateDerivedMetrics } from './lib/playerMetrics.js';
import { ARCHETYPES } from './constants/archetype.js';
import type { DerivedMetrics } from './types/index.js';

// Test with different player profiles
const testProfiles: { name: string; metrics: DerivedMetrics }[] = [
  {
    name: 'High Farming Player (should be Scaling Specialist or CS God)',
    metrics: {
      farming: 90,
      lateGameScaling: 85,
      consistency: 80,
      aggression: 35,
      earlyGameStrength: 40,
      vision: 65,
      clutchFactor: 70,
      comebackRate: 50,
      tiltFactor: 40,
      championPoolDepth: 60,
      improvementVelocity: 55,
      roaming: 45,
      teamfighting: 65,
      snowballRate: 45,
    },
  },
  {
    name: 'Aggressive Early Game Player (should be Early Game Bully)',
    metrics: {
      earlyGameStrength: 95,
      aggression: 85,
      snowballRate: 80,
      lateGameScaling: 40,
      vision: 50,
      farming: 65,
      consistency: 60,
      clutchFactor: 65,
      comebackRate: 45,
      tiltFactor: 60,
      championPoolDepth: 55,
      improvementVelocity: 50,
      roaming: 75,
      teamfighting: 70,
    },
  },
  {
    name: 'Consistent Vision Player (should be Vision Mastermind)',
    metrics: {
      vision: 95,
      consistency: 85,
      roaming: 70,
      teamfighting: 75,
      aggression: 50,
      farming: 60,
      earlyGameStrength: 60,
      lateGameScaling: 65,
      clutchFactor: 70,
      comebackRate: 55,
      tiltFactor: 30,
      championPoolDepth: 65,
      improvementVelocity: 55,
      snowballRate: 50,
    },
  },
  {
    name: 'Clutch Teamfighter (should be Clutch Player or Teamfight Commander)',
    metrics: {
      clutchFactor: 95,
      teamfighting: 90,
      comebackRate: 85,
      aggression: 75,
      consistency: 65,
      vision: 70,
      earlyGameStrength: 60,
      lateGameScaling: 70,
      farming: 65,
      tiltFactor: 35,
      championPoolDepth: 60,
      improvementVelocity: 60,
      roaming: 65,
      snowballRate: 55,
    },
  },
  {
    name: 'Balanced Player (should be Balanced Tactician)',
    metrics: {
      aggression: 65,
      farming: 70,
      vision: 70,
      consistency: 75,
      earlyGameStrength: 65,
      lateGameScaling: 65,
      clutchFactor: 70,
      comebackRate: 60,
      tiltFactor: 50,
      championPoolDepth: 65,
      improvementVelocity: 60,
      roaming: 60,
      teamfighting: 70,
      snowballRate: 60,
    },
  },
];

console.log('🧪 Testing Archetype Matching\n');
console.log('='.repeat(80));

for (const profile of testProfiles) {
  console.log(`\n📊 Testing: ${profile.name}`);
  console.log('-'.repeat(80));

  // Show top 5 metrics
  const metricEntries = Object.entries(profile.metrics) as [keyof DerivedMetrics, number][];
  metricEntries.sort((a, b) => b[1] - a[1]);
  console.log('Top Metrics:', metricEntries.slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', '));

  // Test archetype matching
  const result = determineArchetypeRelative(profile.metrics);

  console.log(`\n✅ Matched Archetype: ${result.icon} ${result.name} (${result.matchPercentage}% match)`);
  console.log(`   ${result.description}`);

  // Show top 3 archetype matches for comparison
  console.log('\n   Top 3 Matches:');
  
  const allScores = ARCHETYPES.map((archetype) => {
    let strengthMatchScore = 0;
    let profileMatchScore = 0;
    let weaknessMatchScore = 0;

    const topMetrics = metricEntries.slice(0, 5).map(([key]) => key);

    for (const [metric, archetypeValue] of Object.entries(archetype.profile)) {
      const metricKey = metric as keyof DerivedMetrics;
      const playerValue = profile.metrics[metricKey] || 50;

      if (archetypeValue > 80) {
        if (topMetrics.includes(metricKey) && playerValue > 70) {
          strengthMatchScore += 3;
        } else if (playerValue < 50) {
          strengthMatchScore -= 2;
        }
      }

      if (archetypeValue > 70 && playerValue > 65) {
        strengthMatchScore += 1;
      }

      const similarity = 1 - Math.abs(archetypeValue - playerValue) / 100;
      profileMatchScore += similarity;

      if (archetypeValue < 40 && playerValue > 70) {
        weaknessMatchScore -= 1;
      }
    }

    const numMetrics = Object.keys(archetype.profile).length;
    profileMatchScore = (profileMatchScore / numMetrics) * 100;

    const totalScore = 
      strengthMatchScore * 10 +
      profileMatchScore * 0.5 +
      weaknessMatchScore * 5;

    return {
      name: archetype.name,
      icon: archetype.icon,
      score: totalScore,
      matchPercentage: Math.max(0, Math.min(100, Math.round(totalScore))),
    };
  });

  allScores.sort((a, b) => b.score - a.score);

  for (let i = 0; i < 3; i++) {
    console.log(`   ${i + 1}. ${allScores[i].icon} ${allScores[i].name} - ${allScores[i].matchPercentage}% (score: ${allScores[i].score.toFixed(1)})`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Test Complete\n');
