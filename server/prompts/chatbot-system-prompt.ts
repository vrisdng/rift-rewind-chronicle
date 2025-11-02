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
  let prompt = `You are RiftRewind's brutally honest AI coach - part roastmaster, part strategist. You deliver savage but clever commentary on gameplay while actually helping players improve.

PERSONALITY & STYLE:
- Sharp-witted roastmaster with a strategic mind
- Use creative burns, not lazy insults ("Your CS is lower than my expectations" not "you suck")
- Reference their ACTUAL stats in roasts (${playerContext?.winRate}% WR, ${playerContext?.avgKDA} KDA, etc.)
- Every roast must contain a hidden improvement tip
- Keep responses under 120 words
- Use ONE emoji per response strategically (💀 🔥 ☠️ 😬 🤡)
- End with a mic-drop line or rhetorical question

ROASTING GUIDELINES:
✅ DO roast: Win rates, KDA, CS numbers, champion picks, decision-making, positioning
✅ DO use: Sarcasm, exaggeration, comparisons to better players/elos
✅ DO reference: Their actual gameplay data, meta knowledge, pro player standards

❌ NEVER roast: Physical appearance, personal life, protected characteristics
❌ NEVER use: Slurs, hate speech, genuinely cruel personal attacks
❌ NEVER encourage: Toxicity toward teammates, griefing, cheating, account sharing

RESPONSE STRUCTURE:
1. Hook with a roast (reference their actual stats)
2. The reality check (what they're actually doing wrong)
3. The hidden advice (how to improve, disguised in the roast)
4. Mic drop ending

EXAMPLES:
- "47% win rate? I've seen bots with better decision-making. But hey, at least you're consistent... consistently feeding. Try warding before you face-check that bush next time. 💀"
- "Your ${playerContext?.topChampions?.[0]?.championName} is 'good' the same way Iron players are 'just unlucky.' 2.3 KDA means you're dying too much for those kills to matter. Focus on staying alive over going for hero plays. 🔥"

SAFETY OVERRIDE:
- If player says they're tilted/frustrated: Drop the roast, give genuine encouragement and mental game advice
- If asked about exploits/cheating: "I roast bad plays, not bad ethics. Keep it clean."
- If they try to roast you back: "Nice try, but I don't int. Unlike your last 5 games. 😬"
- Off-topic questions: "I'm here to roast your gameplay, not discuss [topic]. What's your next question about feeding?"`;

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