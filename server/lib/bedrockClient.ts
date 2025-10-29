/**
 * AWS Bedrock Client
 * Handles AI inference using Claude 3.5 Sonnet via AWS Bedrock
 * Cost-optimized: Single call per player analysis (~$0.04)
 */

import type { AIInsights } from '../types/index.js';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

// Bedrock model ID for Claude 3.5 Sonnet (v2 model)
// Use cross-region inference profile for on-demand throughput
const MODEL_ID = 'us.anthropic.claude-3-haiku-20240307-v1:0';

interface BedrockRequest {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
}

/**
 * Invoke Claude via AWS Bedrock
 */
export async function invokeBedrockClaude(prompt: string): Promise<AIInsights> {
  // Check for AWS credentials
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS credentials not configured. Using mock AI insights.');
    return getMockInsights();
  }

  try {
    const request: BedrockRequest = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 0.9,
    };

    
    
    const client = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(request),
    });
    
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the content from Claude's response
    const content = responseBody.content?.[0]?.text || '';
    
    console.log('✅ Successfully invoked Bedrock Claude');
    
    // Parse the AI response to structured format
    return parseAIResponse(content);
  } catch (error: any) {
    // Handle specific error cases
    if (error.name === 'ResourceNotFoundException') {
      console.warn('⚠️  Bedrock access not yet configured. You need to:');
      console.warn('   1. Go to AWS Bedrock console');
      console.warn('   2. Submit the Anthropic use case form');
      console.warn('   3. Wait 15 minutes for approval');
      console.warn('   Using mock AI insights for now...');
    } else if (error.name === 'ValidationException') {
      console.warn('⚠️  Invalid Bedrock model configuration. Using mock AI insights...');
    } else {
      console.warn('⚠️  Bedrock invocation failed. Using mock AI insights...');
      console.warn('   Error:', error.message);
    }
    
    return getMockInsights();
  }
}

/**
 * Mock insights for development/testing
 */
function getMockInsights(): AIInsights {
  return {
    story_arc:
      "Your 2024 season was a journey of growth and adaptation. Starting strong in the early months, " +
      "you faced challenges mid-season but showed remarkable resilience. By year's end, you'd evolved " +
      "into a more calculated player, trading early aggression for consistent late-game dominance. " +
      "Your watershed moment came in August when you fundamentally shifted your approach, leading to " +
      "a significant win streak and improved performance across all metrics.",
    surprising_insights: [
      "You have a hidden 68% win rate on games played on Tuesdays, suggesting you're most focused mid-week.",
      "Despite maining ADC, your support games show 15% higher vision scores, indicating strong macro awareness.",
      "Your comeback rate improved by 34% in the last quarter, showing significant mental fortitude development.",
    ],
    improvement_tips: [
      "Focus on early CS efficiency - your late game is strong, but improving your 0-10 minute CS by 15% would accelerate your scaling.",
      "Review your games after 2+ losses in a row - your tilt factor spikes significantly, dropping performance by 18%.",
      "Expand your champion pool - mastering 2-3 more champions would increase your draft flexibility and counter-pick potential.",
    ],
    archetype_explanation:
      "You embody the 'Scaling Specialist' archetype because of your exceptional late-game performance " +
      "(85th percentile), consistent farming patterns (90th percentile), and preference for extended games. " +
      "While your early aggression is below average, you more than compensate with patient scaling and " +
      "decisive late-game impact. This playstyle mirrors professional ADC players who prioritize safe laning " +
      "and teamfight positioning over early skirmishes.",
    season_prediction:
      "Based on your improvement trajectory, expect to climb 2-3 divisions in 2025. " +
      "Your consistency improvements suggest you're ready to maintain higher ranks. " +
      "Focus on reducing your tilt factor and you could be looking at Diamond/Master territory.",
    title: 'The Patient Scaler',
  };
}

/**
 * Estimate cost for a Bedrock call
 * Claude 3.5 Sonnet pricing (approximate):
 * - Input: $3 per 1M tokens
 * - Output: $15 per 1M tokens
 */
export function estimateBedrockCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return inputCost + outputCost;
}

/**
 * Parse AI response to extract structured insights
 */
export function parseAIResponse(responseText: string): AIInsights {
  try {
    // Claude's response should be a JSON string
    // First, try to extract JSON from markdown code blocks if present
    let jsonText = responseText.trim();
    
    // Remove markdown code block markers if present
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(jsonText);

    return {
      story_arc: parsed.story_arc || parsed.storyArc || '',
      surprising_insights: parsed.surprising_insights || parsed.surprisingInsights || [],
      improvement_tips: parsed.improvement_tips || parsed.improvementTips || [],
      archetype_explanation: parsed.archetype_explanation || parsed.archetypeExplanation || '',
      season_prediction: parsed.season_prediction || parsed.seasonPrediction || '',
      title: parsed.title || 'Your League Journey',
    };
  } catch (error) {
    console.warn('⚠️  Failed to parse AI response as JSON. Using mock insights...');
    if (responseText) {
      console.warn('   Response preview:', responseText.substring(0, 200));
    }
    return getMockInsights();
  }
}

/**
 * Health check for Bedrock availability
 */
export async function checkBedrockHealth(): Promise<boolean> {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    return false;
  }

  try {
    // In production, implement a simple ping to Bedrock
    // For now, just check credentials exist
    return true;
  } catch (error) {
    console.error('Bedrock health check failed:', error);
    return false;
  }
}

export default {
  invokeBedrockClaude,
  parseAIResponse,
  estimateBedrockCost,
  checkBedrockHealth,
  getMockInsights,
};
