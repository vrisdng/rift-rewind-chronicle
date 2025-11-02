/**
 * System Prompt Builder for RiftRewind Chatbot
 * 
 * Customize the chatbot's personality, tone, guardrails, and behavior here.
 */

export interface PlayerContext {
  riotId?: string;
  tagLine?: string;
  puuid?: string;
  totalGames?: number;
  winRate?: number;
  avgKDA?: number;
  mainRole?: string;
  topChampions?: Array<{
    championName: string;
    games: number;
    winRate: number;
    avgKills?: number;
    avgDeaths?: number;
    avgAssists?: number;
  }>;
  archetype?: {
    name: string;
    description: string;
    matchPercentage?: number;
  };
  insights?: {
    story_arc?: string;
    surprising_insights?: string[];
    improvement_tips?: string[];
    archetype_explanation?: string;
    season_prediction?: string;
  };
  topStrengths?: Array<{
    metric: string;
    value: number;
    percentile: number;
  }>;
  needsWork?: Array<{
    metric: string;
    value: number;
    suggestion: string;
  }>;
  proComparison?: {
    primary?: {
      name: string;
      team?: string;
      role?: string;
    };
    similarity?: number;
    description?: string;
  };
  watershedMoment?: {
    description?: string;
    gameDate?: string;
    championName?: string;
    improvement?: number;
  };
}

export function buildChatbotSystemPrompt(playerContext?: PlayerContext): string {
  let prompt = `You are RiftRewind's brutally honest AI coach. You roast players about their gameplay with creative humor while sneaking in real advice.

Your style:
- Use wit and sarcasm, not generic insults
- Reference their actual stats in your roasts
- Keep responses under 120 words
- Use ONE emoji per response (💀 🔥 ☠️ 😬 🤡)
- Balance savage roasts with hidden helpful advice
- End with a mic-drop line

Rules you must follow:
- Only roast GAMEPLAY and STATS, never personal characteristics
- No slurs, hate speech, or genuinely cruel attacks
- Don't encourage toxic behavior or discuss cheating
- If player seems upset, dial back and give real advice
- Stay on topic - redirect non-League questions`;

  // Player context section
  if (!playerContext || !playerContext.insights) {
    prompt += `\n\nNo player data loaded yet. Tell them to analyze their profile first so you can properly roast their gameplay.`;
    return prompt;
  }

  const ctx = playerContext;
  const topChamp = ctx.topChampions?.[0];
  
  prompt += `\n\n<player_data>
Summoner: ${ctx.riotId}#${ctx.tagLine}
Games Played: ${ctx.totalGames || 'N/A'}
Win Rate: ${ctx.winRate ? `${ctx.winRate}%` : 'N/A'}
Average KDA: ${ctx.avgKDA ? ctx.avgKDA.toFixed(1) : 'N/A'}
Main Role: ${ctx.mainRole || 'Unknown'}`;

  if (topChamp) {
    prompt += `
Most Played Champion: ${topChamp.championName} (${topChamp.games} games, ${topChamp.winRate}% WR)`;
  }

  if (ctx.archetype?.name) {
    prompt += `
Playstyle: ${ctx.archetype.name}`;
  }

  if (ctx.insights?.story_arc) {
    prompt += `\n\nSeason Summary: ${ctx.insights.story_arc}`;
  }

  if (ctx.insights?.surprising_insights && ctx.insights.surprising_insights.length > 0) {
    prompt += `\n\nKey Facts:`;
    ctx.insights.surprising_insights.forEach((insight) => {
      prompt += `\n- ${insight}`;
    });
  }

  if (ctx.insights?.improvement_tips && ctx.insights.improvement_tips.length > 0) {
    prompt += `\n\nWeaknesses to Roast:`;
    ctx.insights.improvement_tips.forEach((tip) => {
      prompt += `\n- ${tip}`;
    });
  }

  if (ctx.topStrengths && ctx.topStrengths.length > 0) {
    prompt += `\n\nStrengths:`;
    ctx.topStrengths.slice(0, 3).forEach((s) => {
      prompt += `\n- ${s.metric}: ${s.percentile}th percentile`;
    });
  }

  if (ctx.needsWork && ctx.needsWork.length > 0) {
    prompt += `\n\nBiggest Problems:`;
    ctx.needsWork.slice(0, 2).forEach((w) => {
      prompt += `\n- ${w.metric}: ${w.suggestion}`;
    });
  }

  if (ctx.proComparison?.primary) {
    prompt += `\n\nPro Comparison: Similar to ${ctx.proComparison.primary.name}`;
    if (ctx.proComparison.description) {
      prompt += ` - ${ctx.proComparison.description}`;
    }
  }

  prompt += `\n</player_data>

Now roast them based on what they ask. Use their actual stats, be creative and funny, and sneak in real advice. Don't explain who you are - just start roasting.`;

  return prompt;
}