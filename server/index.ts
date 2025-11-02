import express from 'express';
import cors from 'cors';
import { getClient } from './lib/riot.ts';
import { analyzePlayer, getCachedPlayerStats } from './lib/playerAnalyzer.ts';
import { createFriendGroup, getFriendGroup } from './lib/supabaseClient.ts';
import { invokeBedrockClaude, invokeBedrockClaudeStream } from './lib/bedrockClient.ts';
import { buildChatbotSystemPrompt } from './prompts/chatbot-system-prompt.ts';
import type { AnalyzePlayerRequest, CreateGroupRequest, ProgressUpdate } from './types/index.ts';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ==================== PLAYER ANALYSIS ====================

/**
 * POST /api/analyze
 * Analyze a player completely: fetch matches, calculate metrics, generate insights
 * Optional: forceRegenerateInsights - if true, will regenerate AI insights even if cached
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { riotId, tagLine, region = 'sg2', forceRegenerateInsights = false } = req.body as AnalyzePlayerRequest & { forceRegenerateInsights?: boolean };

    if (!riotId || !tagLine) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: riotId and tagLine',
      });
    }

    console.log(`📊 Starting analysis for ${riotId}#${tagLine}${forceRegenerateInsights ? ' (force regenerate insights)' : ''}`);

    // Check cache first
    // const cached = await getCachedPlayerStats(riotId, tagLine);
    // if (cached) {
    //   console.log(`✅ Returning cached data for ${riotId}#${tagLine}`);
    //   return res.json({
    //     success: true,
    //     data: cached,
    //     cached: true,
    //   });
    // }

    // Perform full analysis
    const playerStats = await analyzePlayer(
      riotId,
      tagLine,
      region,
      (update: ProgressUpdate) => {
        console.log(`📈 Progress: ${update.stage} - ${update.message} (${update.progress}%)`);
        // In production, you could send progress via WebSocket or SSE
      },
      forceRegenerateInsights
    );

    console.log(`✅ Analysis complete for ${riotId}#${tagLine}`);

    res.json({
      success: true,
      data: playerStats,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error analyzing player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze player',
    });
  }
});

/**
 * GET /api/player/:riotId/:tagLine
 * Get cached player data
 */
app.get('/api/player/:riotId/:tagLine', async (req, res) => {
  try {
    const { riotId, tagLine } = req.params;

    const playerStats = await getCachedPlayerStats(riotId, tagLine);

    if (!playerStats) {
      return res.status(404).json({
        success: false,
        error: 'Player not found. Please analyze first.',
      });
    }

    res.json({
      success: true,
      data: playerStats,
    });
  } catch (error: any) {
    console.error('Error fetching player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch player data',
    });
  }
});


// ==================== FRIEND GROUPS ====================

/**
 * POST /api/group
 * Create a friend group for comparative analysis
 */
app.post('/api/group', async (req, res) => {
  try {
    const { name, players } = req.body as CreateGroupRequest;

    if (!name || !players || players.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Group name and at least 2 players required',
      });
    }

    // Analyze all players first
    const puuids: string[] = [];

    for (const player of players) {
      const stats = await getCachedPlayerStats(player.riotId, player.tagLine);
      if (stats) {
        puuids.push(stats.puuid);
      } else {
        // Need to analyze first
        const analyzed = await analyzePlayer(player.riotId, player.tagLine);
        puuids.push(analyzed.puuid);
      }
    }

    // Create group
    const groupId = await createFriendGroup(name, puuids);

    res.json({
      success: true,
      groupId,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create group',
    });
  }
});

/**
 * GET /api/group/:groupId
 * Get friend group with member stats
 */
app.get('/api/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await getFriendGroup(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch group',
    });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`\n🚀 Rift Rewind API server running on http://localhost:${PORT}`);
  console.log(`\n📊 Configuration:`);
  console.log(`  ✅ Riot API Key: ${!!process.env.RIOT_API_KEY ? 'Configured' : '❌ Missing'}`);
  console.log(`  ✅ Supabase: ${!!process.env.SUPABASE_URL ? 'Configured' : '❌ Missing'}`);
  console.log(`  ✅ AWS Bedrock: ${!!process.env.AWS_ACCESS_KEY_ID ? 'Configured' : '❌ Missing (using mocks)'}`);
});

// ==================== CHAT STREAMING ====================

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{role, content}> }
 * Streams LLM response as NDJSON (newline-delimited JSON)
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], playerContext } = req.body as { 
      message: string; 
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      playerContext?: any; // PlayerStats with insights
    };

    if (!message) {
      return res.status(400).json({ success: false, error: 'Missing message' });
    }

    console.log(`💬 Chat request: "${message.substring(0, 50)}..."`);

    // Set headers for NDJSON streaming
    res.set({
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // Build system prompt using dedicated prompt builder
    const systemPrompt = buildChatbotSystemPrompt(playerContext);
    
    // Trim history to last 10 messages to avoid token limit issues
    const recentHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim().length > 0)
      .slice(-10);
    
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    // Stream tokens from Bedrock
    await invokeBedrockClaudeStream(
      messages,
      // onChunk: send each token as NDJSON line
      (text: string) => {
        if (!res.writableEnded) {
          res.write(JSON.stringify({ delta: text }) + '\n');
        }
      },
      // onComplete: send done signal
      () => {
        if (!res.writableEnded) {
          res.write(JSON.stringify({ done: true }) + '\n');
          res.end();
          console.log(`✅ Chat stream complete`);
        }
      },

      (error: Error) => {
        if (!res.writableEnded) {
          res.write(JSON.stringify({ error: error.message }) + '\n');
          res.end();
          console.error(`❌ Chat stream error:`, error);
        }
      }
    );

  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    
    // If headers not sent yet, send JSON error
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message || 'Chat failed' });
    }
    
    // Otherwise send error in stream (only if stream hasn't ended)
    if (!res.writableEnded) {
      res.write(JSON.stringify({ error: error.message || 'Chat failed' }) + '\n');
      res.end();
    }
  }
});