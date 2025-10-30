/**
 * Insight Generator
 * Creates the optimized prompt for AWS Bedrock Claude
 * Generates personalized narrative and insights with a single AI call
 */

import type {
  PlayerStats,
  DerivedMetrics,
  ChampionStats,
  WatershedMoment,
  AIInsights,
} from '../types/index.ts';
import { invokeBedrockClaude, parseAIResponse } from './bedrockClient.ts';

/**
 * Generate comprehensive player insights using a single AI call
 * This is the ONLY AI cost per player (~$0.04)
 */
export async function generatePlayerInsights(
  stats: PlayerStats
): Promise<AIInsights> {
  const prompt = buildInsightPrompt(stats);

  try {
    const response = await invokeBedrockClaude(prompt);
    return response;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

/**
 * Build the optimized prompt for Claude
 * Includes all necessary context in a single request
 */
function buildInsightPrompt(stats: PlayerStats): string {
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

  const prompt = `You are analyzing a League of Legends player's 2024 season. Create a personalized, engaging year-in-review.

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
  "story_arc": "250-word engaging narrative of their year, written in second person. Tell their story with specific details from the data. Make it dramatic and personal. Reference their playstyle, growth, challenges, and triumphs.",
  "surprising_insights": [
    "First surprising insight about hidden patterns in their play (be specific with numbers)",
    "Second insight revealing something they might not have noticed",
    "Third insight connecting different aspects of their gameplay"
  ],
  "improvement_tips": [
    "First specific, actionable tip based on their weaknesses (include metric names)",
    "Second tip targeting a different area for growth",
    "Third advanced tip to elevate their game further"
  ],
  "archetype_explanation": "2-3 sentence explanation of why they fit the ${archetype.name} archetype. Reference specific metrics and playstyle patterns that led to this classification.",
  "season_prediction": "Bold prediction for their 2025 season based on their growth trajectory and current trends. Be optimistic but realistic.",
  "title": "A catchy 3-5 word title for their year (examples: 'The Comeback King', 'Patient Scaling Master', 'Vision Prodigy')"
}

IMPORTANT:
- Use ONLY the data provided - do not make up stats
- Write in an engaging, personal tone (use "you", "your")
- Be specific with numbers and percentages
- Make insights surprising and non-obvious
- Keep tips actionable and metric-driven
- Return ONLY the JSON, nothing else`;

  return prompt;
}

/**
 * Format metrics for the prompt
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

/**
 * Generate quick summary (no AI) for immediate feedback
 */
export function generateQuickSummary(stats: PlayerStats): string {
  const { totalGames, winRate, mainRole, topChampions, archetype } = stats;

  const winRateEmoji = winRate >= 55 ? '🔥' : winRate >= 50 ? '✅' : winRate >= 45 ? '⚖️' : '📉';

  return (
    `${winRateEmoji} ${totalGames} games as ${mainRole} • ${winRate.toFixed(1)}% WR\n` +
    `🎭 Archetype: ${archetype.name}\n` +
    `🏆 Top Pick: ${topChampions[0]?.championName || 'N/A'} (${topChampions[0]?.games || 0} games)`
  );
}

/**
 * Generate shareable card text (no AI)
 */
export function generateShareableText(stats: PlayerStats): string {
  const { riotId, totalGames, winRate, archetype, insights } = stats;

  const title = insights?.title || 'My League Year';

  return `${title}

${riotId}'s 2024 Season:
• ${totalGames} games • ${winRate.toFixed(1)}% WR
• ${archetype.name}
• ${archetype.description}

#RiftRewind #LeagueOfLegends`;
}

/**
 * Validate AI insights response
 */
export function validateInsights(insights: AIInsights): boolean {
  if (!insights.story_arc || insights.story_arc.length < 100) {
    console.warn('Story arc too short or missing');
    return false;
  }

  if (!insights.surprising_insights || insights.surprising_insights.length !== 3) {
    console.warn('Surprising insights invalid');
    return false;
  }

  if (!insights.improvement_tips || insights.improvement_tips.length !== 3) {
    console.warn('Improvement tips invalid');
    return false;
  }

  if (!insights.archetype_explanation || insights.archetype_explanation.length < 50) {
    console.warn('Archetype explanation too short or missing');
    return false;
  }

  if (!insights.season_prediction || insights.season_prediction.length < 20) {
    console.warn('Season prediction too short or missing');
    return false;
  }

  if (!insights.title || insights.title.length < 3) {
    console.warn('Title invalid');
    return false;
  }

  return true;
}

export default {
  generatePlayerInsights,
  generateQuickSummary,
  generateShareableText,
  validateInsights,
};
