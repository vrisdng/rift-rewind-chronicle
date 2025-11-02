/**
 * AWS Bedrock Client
 * Handles AI inference using Claude 3.5 Sonnet via AWS Bedrock
 * Cost-optimized: Single call per player analysis (~$0.04)
 */

import type { AIInsights } from '../types/index.ts';
import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

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
    
    if (!content) {
      console.warn('⚠️  Empty response from Bedrock. Response body:', responseBody);
      return getMockInsights();
    }
    
    console.log('✅ Successfully invoked Bedrock Claude');
    console.log('📝 Response length:', content.length, 'characters');
    
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
 * Invoke Claude via AWS Bedrock with STREAMING support
 * Streams tokens in real-time as they're generated
 */
export async function invokeBedrockClaudeStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  // Check for AWS credentials
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS credentials not configured. Using mock streaming.');
    const mockText = "I'm your RiftRewind assistant! I can help you understand your gameplay, suggest improvements, and answer questions about your season. What would you like to know?";
    
    // Simulate streaming for development
    for (let i = 0; i < mockText.length; i += 3) {
      const chunk = mockText.slice(i, i + 3);
      onChunk(chunk);
      await new Promise(r => setTimeout(r, 20));
    }
    onComplete?.();
    return;
  }

  try {
    const request: BedrockRequest = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      messages,
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

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(request),
    });

    const response = await client.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock stream');
    }

    console.log('✅ Bedrock stream started');

    // Process the stream
    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        
        // Handle different event types from Claude
        if (chunk.type === 'content_block_delta') {
          const text = chunk.delta?.text || '';
          if (text) {
            onChunk(text);
          }
        } else if (chunk.type === 'message_stop') {
          console.log('✅ Bedrock stream completed');
          onComplete?.();
        } else if (chunk.type === 'error') {
          console.error('❌ Bedrock stream error:', chunk);
          onError?.(new Error(chunk.message || 'Stream error'));
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Bedrock streaming failed:', error.message);
    onError?.(error);
    
    // Fallback: send error message
    onChunk('Sorry, I encountered an error. Please try again.');
    onComplete?.();
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
    // Claude's response should be clean JSON (no markdown blocks)
    let jsonText = responseText.trim();

    // Handle cases where Claude might wrap in markdown despite instructions
    // Check for code block markers and extract if present
    if (jsonText.startsWith('```')) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    }

    // Find the first { and last } to extract just the JSON object
    // This handles cases where Claude adds explanatory text before/after
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    // Strategy: Try parsing first, if it fails then try to fix it
    let parsed;
    try {
      // Try parsing as-is first
      parsed = JSON.parse(jsonText);
    } catch (firstError) {
      console.log('First parse attempt failed, trying to repair JSON...');

      // Repair strategy: Escape control characters ONLY inside string values
      // This regex finds string values and escapes newlines/tabs/carriage returns within them
      const repairedJson = jsonText.replace(
        /"([^"\\]*(\\.[^"\\]*)*)"/g,
        (match) => {
          return match
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        }
      );

      try {
        parsed = JSON.parse(repairedJson);
        console.log('✅ Successfully repaired and parsed JSON');
      } catch (secondError) {
        // If still failing, try one more aggressive strategy: remove ALL literal newlines
        console.log('Second parse attempt failed, trying aggressive repair...');
        const aggressiveRepair = jsonText
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ');  // Collapse multiple spaces

        parsed = JSON.parse(aggressiveRepair);
        console.log('✅ Successfully parsed with aggressive repair');
      }
    }

    // Map to our interface (handle both snake_case and camelCase)
    const insights: AIInsights = {
      story_arc: parsed.story_arc || parsed.storyArc || '',
      surprising_insights: parsed.surprising_insights || parsed.surprisingInsights || [],
      improvement_tips: parsed.improvement_tips || parsed.improvementTips || [],
      archetype_explanation: parsed.archetype_explanation || parsed.archetypeExplanation || '',
      season_prediction: parsed.season_prediction || parsed.seasonPrediction || '',
      title: parsed.title || 'Your League Journey',
    };

    // Validate we got all required fields
    if (!insights.story_arc || !insights.title) {
      throw new Error('Missing required fields in AI response');
    }

    console.log('✅ Successfully parsed AI insights');
    return insights;
    
  } catch (error) {
    console.error('❌ Failed to parse AI response as JSON:', error);
    console.error('   Response text:', responseText.substring(0, 500));
    console.error('   Full error:', error);
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
  invokeBedrockClaudeStream,
  parseAIResponse,
  estimateBedrockCost,
  checkBedrockHealth,
  getMockInsights,
};
