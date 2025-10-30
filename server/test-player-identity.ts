/**
 * Test Player Identity System
 * Run this to verify the new archetype and pro player matching system
 */

import { calculateDerivedMetrics, determinePlayerIdentity } from './lib/playerMetrics.ts';
import type { DBMatch, DerivedMetrics } from './types/index.ts';

// ==================== TEST CASES ====================

/**
 * Test Case 1: Chovy-like player (extreme farming, scaling specialist)
 */
const chovyLikeMetrics: DerivedMetrics = {
  farming: 95,
  consistency: 90,
  lateGameScaling: 88,
  aggression: 40,
  earlyGameStrength: 50,
  teamfighting: 80,
  clutchFactor: 85,
  vision: 65,
  roaming: 45,
  comebackRate: 75,
  tiltFactor: 25,
  snowballRate: 60,
  championPoolDepth: 70,
  improvementVelocity: 65,
};

/**
 * Test Case 2: Faker-like player (aggressive playmaker)
 */
const fakerLikeMetrics: DerivedMetrics = {
  aggression: 90,
  clutchFactor: 95,
  roaming: 85,
  consistency: 85,
  earlyGameStrength: 85,
  teamfighting: 88,
  farming: 75,
  lateGameScaling: 80,
  vision: 75,
  comebackRate: 85,
  tiltFactor: 20,
  snowballRate: 88,
  championPoolDepth: 85,
  improvementVelocity: 70,
};

/**
 * Test Case 3: Balanced player (Knight-like)
 */
const balancedMetrics: DerivedMetrics = {
  aggression: 70,
  farming: 85,
  consistency: 88,
  teamfighting: 90,
  lateGameScaling: 85,
  clutchFactor: 85,
  earlyGameStrength: 75,
  vision: 75,
  roaming: 70,
  comebackRate: 80,
  tiltFactor: 30,
  snowballRate: 75,
  championPoolDepth: 75,
  improvementVelocity: 65,
};

/**
 * Test Case 4: Bin-like player (high variance, aggressive)
 */
const binLikeMetrics: DerivedMetrics = {
  aggression: 95,
  consistency: 50,
  clutchFactor: 85,
  earlyGameStrength: 90,
  snowballRate: 88,
  farming: 70,
  teamfighting: 80,
  lateGameScaling: 65,
  vision: 55,
  roaming: 75,
  comebackRate: 70,
  tiltFactor: 65,
  championPoolDepth: 65,
  improvementVelocity: 60,
};

// ==================== RUN TESTS ====================

function runTest(name: string, metrics: DerivedMetrics): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(60));

  const identity = determinePlayerIdentity(metrics);

  console.log(`\n📊 Archetype: ${identity.archetype.icon} ${identity.archetype.name}`);
  console.log(`   Match: ${identity.archetype.matchPercentage}%`);
  console.log(`   ${identity.archetype.description}`);

  console.log(`\n🏆 Pro Player Comparison:`);
  console.log(`   Primary: ${identity.proComparison.primary.icon} ${identity.proComparison.primary.name} (${identity.proComparison.primary.team})`);
  console.log(`   Similarity: ${identity.proComparison.similarity}%`);
  console.log(`   Secondary: ${identity.proComparison.secondary.icon} ${identity.proComparison.secondary.name} (${identity.proComparison.secondary.team})`);
  console.log(`   ${identity.proComparison.description}`);

  console.log(`\n💪 Top Strengths:`);
  identity.topStrengths.forEach((strength, i) => {
    console.log(`   ${i + 1}. ${strength.metric}: ${strength.value}/100 (${strength.percentile}th percentile)`);
  });

  console.log(`\n📈 Needs Work:`);
  if (identity.needsWork.length === 0) {
    console.log('   No major weaknesses detected! 🎉');
  } else {
    identity.needsWork.forEach((weakness, i) => {
      console.log(`   ${i + 1}. ${weakness.metric}: ${weakness.value}/100`);
      console.log(`      💡 ${weakness.suggestion}`);
    });
  }

  console.log(`\n😄 Playful Comparison:`);
  console.log(`   "${identity.playfulComparison}"`);
}

// Run all test cases
console.log('\n🚀 TESTING PLAYER IDENTITY SYSTEM\n');

runTest('Chovy-like Player (Farming Specialist)', chovyLikeMetrics);
runTest('Faker-like Player (Aggressive Playmaker)', fakerLikeMetrics);
runTest('Knight-like Player (Balanced)', balancedMetrics);
runTest('Bin-like Player (High Variance Carry)', binLikeMetrics);

console.log(`\n${'='.repeat(60)}`);
console.log('✅ All tests completed!');
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('1. Integrate determinePlayerIdentity() into playerAnalyzer.ts');
console.log('2. Update Dashboard to display pro comparisons');
console.log('3. Add social sharing with playful comparisons');
console.log('4. Test with real player data\n');
