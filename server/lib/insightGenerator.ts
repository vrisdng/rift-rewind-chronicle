/**
 * Insight Generator
 * Creates the optimized prompt for AWS Bedrock Claude
 * Generates personalized narrative and insights with a single AI call
 */

import type {
  PlayerStats,
  AIInsights,
  ShareCardPlayerSummary,
} from '../types/index.ts';
import { invokeBedrockClaude } from './bedrockClient.ts';
import { buildPlayerInsightPrompt } from '../prompts/analyze-player-prompt.ts';

/**
 * Generate comprehensive player insights using a single AI call
 * This is the ONLY AI cost per player (~$0.0008 with Claude 3 Haiku)
 */
export async function generatePlayerInsights(
  stats: PlayerStats
): Promise<AIInsights> {
  const prompt = buildPlayerInsightPrompt(stats);

  try {
    const response = await invokeBedrockClaude(prompt);
    return response;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}


/**
 * Generate shareable card text (no AI)
 */
export function generateShareableText(stats: PlayerStats): string {
  const { riotId, totalGames, winRate, archetype, insights } = stats;

  const title = insights?.title || 'My League Year';

  return `${title}

${riotId}'s 2025 Season:
• ${totalGames} games • ${winRate.toFixed(1)}% WR
• ${archetype.name}
• ${archetype.description}

#RiftRewind #LeagueOfLegends`;
}

/**
 * Generate shareable card text from a lightweight summary
 */
export function generateShareableTextFromSummary(
  summary: ShareCardPlayerSummary
): string {
  const title = summary.insights?.title || 'My League Year';

  return `${title}

${summary.riotId}'s 2025 Season:
• ${summary.totalGames} games • ${summary.winRate.toFixed(1)}% WR
• ${summary.archetype.name}
• ${summary.archetype.description}

#RiftRewind #LeagueOfLegends`;
}

/**
 * Validate AI insights response
 */
export function validateInsights(insights: AIInsights): boolean {
  if (!insights.story_arc || insights.story_arc.length < 50) {
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

  if (!insights.archetype_explanation || insights.archetype_explanation.length < 20) {
    console.warn('Archetype explanation too short or missing');
    return false;
  }

  if (!insights.season_prediction || insights.season_prediction.length < 15) {
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
  generateShareableText,
  generateShareableTextFromSummary,
  validateInsights,
};
