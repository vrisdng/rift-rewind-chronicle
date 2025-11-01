/**
 * Watershed Moment Detector
 * Identifies the breakthrough match where a player's skill fundamentally shifted
 * Uses sliding window statistical analysis to detect performance breakpoints
 */

import type { DBMatch, WatershedMoment } from '../types/index.ts';

const WINDOW_SIZE = 10; // Games before and after to analyze
const MIN_MATCHES_REQUIRED = 25; // Need enough data to detect patterns
const MIN_IMPROVEMENT_THRESHOLD = 15; // Minimum 15-point improvement to count

/**
 * Detect the watershed moment in a player's match history
 * Returns the match where performance fundamentally improved
 */
export function detectWatershedMoment(matches: DBMatch[]): WatershedMoment | null {
  if (matches.length < MIN_MATCHES_REQUIRED) {
    return null; // Not enough data
  }

  // Sort chronologically
  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  let bestWatershed: WatershedMoment | null = null;
  let maxImprovement = MIN_IMPROVEMENT_THRESHOLD;

  // Slide window through match history (skip first and last WINDOW_SIZE matches)
  for (let i = WINDOW_SIZE; i < sorted.length - WINDOW_SIZE; i++) {
    const match = sorted[i];

    // Get games before and after this match
    const beforeGames = sorted.slice(Math.max(0, i - WINDOW_SIZE), i);
    const afterGames = sorted.slice(i + 1, Math.min(sorted.length, i + 1 + WINDOW_SIZE));

    if (beforeGames.length < WINDOW_SIZE || afterGames.length < WINDOW_SIZE) {
      continue;
    }

    // Calculate average performance before and after
    const beforeAverage = calculateAverage(beforeGames);
    const afterAverage = calculateAverage(afterGames);

    // Check for significant improvement
    const improvement = afterAverage - beforeAverage;

    if (improvement > maxImprovement) {
      maxImprovement = improvement;

      bestWatershed = {
        matchId: match.match_id,
        gameDate: match.game_date,
        championName: match.champion_name,
        result: match.result,
        performanceScore: match.performance_score,
        beforeAverage: parseFloat(beforeAverage.toFixed(2)),
        afterAverage: parseFloat(afterAverage.toFixed(2)),
        improvement: parseFloat(improvement.toFixed(2)),
        description: generateWatershedDescription(match, improvement),
      };
    }
  }

  return bestWatershed;
}

/**
 * Calculate average performance score for a set of matches
 */
function calculateAverage(matches: DBMatch[]): number {
  const sum = matches.reduce((acc, m) => acc + m.performance_score, 0);
  return sum / matches.length;
}

/**
 * Generate a narrative description of the watershed moment
 */
function generateWatershedDescription(match: DBMatch, improvement: number): string {
  const resultText = match.result ? 'won' : 'lost';
  const kda = match.deaths === 0
    ? `${match.kills}/${match.deaths}/${match.assists} (Perfect)`
    : `${match.kills}/${match.deaths}/${match.assists}`;

  const improvementDesc = improvement > 25
    ? 'massive'
    : improvement > 20
    ? 'significant'
    : 'notable';

  return `After ${resultText} a game on ${match.champion_name} with a ${kda} KDA, ` +
         `you showed a ${improvementDesc} ${improvement.toFixed(0)}-point improvement in ` +
         `your average performance. This was your breakthrough moment.`;
}

/**
 * Detect multiple significant improvement points (top 3)
 */
export function detectMultipleBreakthroughs(matches: DBMatch[]): WatershedMoment[] {
  if (matches.length < MIN_MATCHES_REQUIRED) {
    return [];
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  const breakthroughs: WatershedMoment[] = [];

  for (let i = WINDOW_SIZE; i < sorted.length - WINDOW_SIZE; i++) {
    const match = sorted[i];

    const beforeGames = sorted.slice(Math.max(0, i - WINDOW_SIZE), i);
    const afterGames = sorted.slice(i + 1, Math.min(sorted.length, i + 1 + WINDOW_SIZE));

    if (beforeGames.length < WINDOW_SIZE || afterGames.length < WINDOW_SIZE) {
      continue;
    }

    const beforeAverage = calculateAverage(beforeGames);
    const afterAverage = calculateAverage(afterGames);
    const improvement = afterAverage - beforeAverage;

    if (improvement > MIN_IMPROVEMENT_THRESHOLD) {
      breakthroughs.push({
        matchId: match.match_id,
        gameDate: match.game_date,
        championName: match.champion_name,
        result: match.result,
        performanceScore: match.performance_score,
        beforeAverage: parseFloat(beforeAverage.toFixed(2)),
        afterAverage: parseFloat(afterAverage.toFixed(2)),
        improvement: parseFloat(improvement.toFixed(2)),
        description: generateWatershedDescription(match, improvement),
      });
    }
  }

  // Return top 3 by improvement
  return breakthroughs
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 3);
}

/**
 * Detect performance decline (negative watershed)
 */
export function detectPerformanceDecline(matches: DBMatch[]): WatershedMoment | null {
  if (matches.length < MIN_MATCHES_REQUIRED) {
    return null;
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  let worstDecline: WatershedMoment | null = null;
  let maxDecline = MIN_IMPROVEMENT_THRESHOLD;

  for (let i = WINDOW_SIZE; i < sorted.length - WINDOW_SIZE; i++) {
    const match = sorted[i];

    const beforeGames = sorted.slice(Math.max(0, i - WINDOW_SIZE), i);
    const afterGames = sorted.slice(i + 1, Math.min(sorted.length, i + 1 + WINDOW_SIZE));

    if (beforeGames.length < WINDOW_SIZE || afterGames.length < WINDOW_SIZE) {
      continue;
    }

    const beforeAverage = calculateAverage(beforeGames);
    const afterAverage = calculateAverage(afterGames);
    const decline = beforeAverage - afterAverage; // Reversed

    if (decline > maxDecline) {
      maxDecline = decline;

      worstDecline = {
        matchId: match.match_id,
        gameDate: match.game_date,
        championName: match.champion_name,
        result: match.result,
        performanceScore: match.performance_score,
        beforeAverage: parseFloat(beforeAverage.toFixed(2)),
        afterAverage: parseFloat(afterAverage.toFixed(2)),
        improvement: parseFloat((-decline).toFixed(2)), // Negative
        description: `This game marked a ${decline.toFixed(0)}-point decline in performance.`,
      };
    }
  }

  return worstDecline;
}

/**
 * Analyze performance volatility over time
 */
export function analyzePerformanceVolatility(matches: DBMatch[]): {
  avgVolatility: number;
  stabilityScore: number; // 0-100, higher = more stable
  volatilePeriods: Array<{ startDate: string; endDate: string; volatility: number }>;
} {
  if (matches.length < 10) {
    return {
      avgVolatility: 0,
      stabilityScore: 50,
      volatilePeriods: [],
    };
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
  );

  const volatilities: number[] = [];
  const volatilePeriods: Array<{ startDate: string; endDate: string; volatility: number }> = [];

  // Calculate rolling volatility with window of 5 games
  for (let i = 0; i < sorted.length - 5; i++) {
    const window = sorted.slice(i, i + 5);
    const scores = window.map((m) => m.performance_score);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    volatilities.push(stdDev);

    if (stdDev > 20) {
      // High volatility period
      volatilePeriods.push({
        startDate: window[0].game_date,
        endDate: window[window.length - 1].game_date,
        volatility: parseFloat(stdDev.toFixed(2)),
      });
    }
  }

  const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
  const stabilityScore = Math.max(100 - (avgVolatility / 30) * 100, 0);

  return {
    avgVolatility: parseFloat(avgVolatility.toFixed(2)),
    stabilityScore: Math.round(stabilityScore),
    volatilePeriods: volatilePeriods.slice(0, 3), // Top 3 most volatile periods
  };
}

export default {
  detectWatershedMoment,
  detectMultipleBreakthroughs,
  detectPerformanceDecline,
  analyzePerformanceVolatility,
};
