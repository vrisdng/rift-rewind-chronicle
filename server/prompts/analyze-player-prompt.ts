/**
 * Player Analysis Prompt for AI Insights Generation
 * Used by insightGenerator.ts to create personalized year-in-review insights
 */

import type { PlayerStats, DerivedMetrics } from '../types/index.ts';

/**
 * Build the insight generation prompt for player analysis
 * This prompt generates the AI-powered insights shown in the player's year-in-review
 *
 * Cost: ~$0.0008 per call (Claude 3 Haiku)
 * Token usage: ~1,000 input + 420 output tokens
 */
export function buildPlayerInsightPrompt(stats: PlayerStats): string {
  const {
    riotId,
    tagLine,
    totalGames,
    winRate,
    mainRole,
    topChampions,
    longestWinStreak,
    longestLossStreak,
    derivedMetrics,
    archetype,
    watershedMoment,
    avgKDA,
    avgCS,
  } = stats;

  const topChampsList = topChampions
    .slice(0, 5)
    .map((c) => `${c.championName} (${c.games} games, ${c.winRate}% WR)`)
    .join(', ');

  const watershedInfo = watershedMoment
    ? `\nWatershed Moment: ${watershedMoment.description} (${new Date(watershedMoment.gameDate).toLocaleDateString()})`
    : '\nNo clear watershed moment detected.';

  const metricsInfo = formatMetrics(derivedMetrics);

  return `You are analyzing a League of Legends player's 2025 season. Create a personalized, engaging year-in-review.

Player: ${riotId}#${tagLine}
Games Played: ${totalGames}
Win Rate: ${winRate.toFixed(1)}%
Main Role: ${mainRole}
Top Champions: ${topChampsList}
Average KDA: ${avgKDA.toFixed(2)}
Average CS: ${avgCS.toFixed(0)}
Longest Win Streak: ${longestWinStreak} games
Longest Loss Streak: ${longestLossStreak} games

DERIVED METRICS (0-100 scale):
${metricsInfo}

ARCHETYPE: ${archetype.name} - ${archetype.description}
Match Strength: ${archetype.matchPercentage}%
${watershedInfo}

Your task: Generate a comprehensive year-in-review that feels personal and insightful.

CRITICAL FORMATTING RULES:
- Return ONLY valid JSON (no markdown, no code blocks, no extra text)
- ALL string values MUST be continuous text with NO line breaks
- Use proper punctuation and spaces instead of newlines in narratives
- Do not use actual newline characters (\\n) in any strings

Return in this exact format:
{
  "story_arc": "60-80 word engaging narrative of their year, written in second person. Tell their story with specific details from the data. Make it dramatic and personal. Reference their playstyle, growth, challenges, and triumphs.",
  "surprising_insights": [
    "First surprising insight in 1-2 concise sentences (be specific with numbers)",
    "Second insight in 1-2 concise sentences revealing something they might not have noticed",
    "Third insight in 1-2 concise sentences connecting different aspects of their gameplay"
  ],
  "improvement_tips": [
    "First specific, actionable tip in 1 sentence based on their weaknesses (include metric names)",
    "Second tip in 1 sentence targeting a different area for growth",
    "Third advanced tip in 1 sentence to elevate their game further"
  ],
  "archetype_explanation": "1-2 sentence explanation of why they fit the ${archetype.name} archetype. Reference specific metrics and playstyle patterns that led to this classification.",
  "season_prediction": "1-2 sentence bold prediction for their 2026 season based on their growth trajectory and current trends. Be optimistic but realistic.",
  "title": "A catchy 3-5 word title for their year (examples: 'The Comeback King', 'Patient Scaling Master', 'Vision Prodigy')"
}

IMPORTANT:
- Use ONLY the data provided - do not make up stats
- Write in an engaging, personal tone (use "you", "your")
- Be specific with numbers and percentages
- Make insights surprising and non-obvious
- Keep tips actionable and metric-driven
- Return ONLY the JSON, nothing else`;
}

/**
 * Format metrics for inclusion in prompts
 */
function formatMetrics(metrics: DerivedMetrics): string {
  return `Aggression: ${metrics.aggression}
Farming: ${metrics.farming}
Vision: ${metrics.vision}
Consistency: ${metrics.consistency}
Early Game Strength: ${metrics.earlyGameStrength}
Late Game Scaling: ${metrics.lateGameScaling}
Comeback Rate: ${metrics.comebackRate}
Clutch Factor: ${metrics.clutchFactor}
Tilt Factor: ${metrics.tiltFactor} (lower is better)
Champion Pool Depth: ${metrics.championPoolDepth}
Improvement Velocity: ${metrics.improvementVelocity}
Roaming: ${metrics.roaming}
Teamfighting: ${metrics.teamfighting}
Snowball Rate: ${metrics.snowballRate}`;
}

export default {
  buildPlayerInsightPrompt,
};
