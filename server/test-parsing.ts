/**
 * Test parsing AI responses
 */
import { parseAIResponse } from './lib/bedrockClient.ts';

// Test case 1: Clean JSON (what we're getting from Claude)
const cleanJson = `{
  "story_arc": "After a rocky start to the season, you found your groove as the Roaming Terror of the Rift. With a 62.6% win rate across 99 games, you shook up the meta with your unorthodox playstyle.",
  "surprising_insights": [
    "Your win rate spikes to 75% when you play after 8 PM",
    "You have a hidden 68% win rate on Tuesdays",
    "Your comeback rate improved by 34% in the last quarter"
  ],
  "improvement_tips": [
    "Focus on early CS efficiency",
    "Review your games after 2+ losses",
    "Expand your champion pool"
  ],
  "archetype_explanation": "You embody the Roaming Terror archetype with exceptional map presence and vision control.",
  "season_prediction": "Based on your improvement trajectory, expect to climb 2-3 divisions in 2025.",
  "title": "The Roaming Terror"
}`;

// Test case 2: JSON with markdown blocks
const jsonWithMarkdown = `\`\`\`json
{
  "story_arc": "Your season was epic",
  "surprising_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "improvement_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "archetype_explanation": "You are a scaling specialist",
  "season_prediction": "You will reach Diamond",
  "title": "The Scaler"
}
\`\`\``;

// Test case 3: JSON with text before/after
const jsonWithExtraText = `Here's your analysis:

{
  "story_arc": "Amazing season",
  "surprising_insights": ["A", "B", "C"],
  "improvement_tips": ["1", "2", "3"],
  "archetype_explanation": "You're aggressive",
  "season_prediction": "Climb ahead",
  "title": "The Fighter"
}

Hope this helps!`;

console.log('🧪 Testing AI Response Parsing\n');

console.log('Test 1: Clean JSON');
try {
  const result1 = parseAIResponse(cleanJson);
  console.log('✅ Success!');
  console.log('   Title:', result1.title);
  console.log('   Story length:', result1.story_arc.length);
  console.log('   Insights:', result1.surprising_insights.length);
} catch (error) {
  console.log('❌ Failed:', error);
}

console.log('\nTest 2: JSON with markdown blocks');
try {
  const result2 = parseAIResponse(jsonWithMarkdown);
  console.log('✅ Success!');
  console.log('   Title:', result2.title);
} catch (error) {
  console.log('❌ Failed:', error);
}

console.log('\nTest 3: JSON with extra text');
try {
  const result3 = parseAIResponse(jsonWithExtraText);
  console.log('✅ Success!');
  console.log('   Title:', result3.title);
} catch (error) {
  console.log('❌ Failed:', error);
}

console.log('\n✨ All parsing tests complete!');
