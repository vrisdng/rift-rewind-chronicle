import express from 'express';
import cors from 'cors';
import { getClient } from './lib/riot.ts';
import { analyzePlayer, getCachedPlayerStats } from './lib/playerAnalyzer.ts';
import { createFriendGroup, getFriendGroup } from './lib/supabaseClient.ts';
import { invokeBedrockClaude, invokeBedrockClaudeStream } from './lib/bedrockClient.ts';
import { buildChatbotSystemPrompt } from './prompts/chatbot-system-prompt.ts';
import type { AnalyzePlayerRequest, CreateGroupRequest, ProgressUpdate } from './types/index.ts';

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse navigation actions from AI response
 * Format: "NAVIGATE: /path1 | Label 1 | /path2 | Label 2"
 * Returns array of { label, path } and cleaned text (without NAVIGATE lines)
 */
function parseNavigationActions(text: string): { 
  actions: Array<{ label: string; path: string }>, 
  cleanedText: string 
} {
  const navigationActions: Array<{ label: string; path: string }> = [];
  
  // Match lines starting with "NAVIGATE:"
  const navigateRegex = /NAVIGATE:\s*(.+)/gi;
  const matches = text.match(navigateRegex);
  
  if (!matches) return { actions: navigationActions, cleanedText: text };
  
  for (const match of matches) {
    // Extract content after "NAVIGATE:"
    const content = match.replace(/NAVIGATE:\s*/i, '').trim();
    
    // Split by | to get path/label pairs
    const parts = content.split('|').map(p => p.trim());
    
    // Parse pairs: /path | Label | /path2 | Label2
    for (let i = 0; i < parts.length - 1; i += 2) {
      const path = parts[i];
      const label = parts[i + 1];
      
      if (path && label && path.startsWith('/')) {
        navigationActions.push({ label, path });
      }
    }
  }
  
  // Remove NAVIGATE lines from text (including surrounding newlines)
  const cleanedText = text.replace(/\n*NAVIGATE:\s*(.+)\n*/gi, '\n').trim();
  
  return { actions: navigationActions, cleanedText };
}

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
 * POST /api/analyze-stream
 * Analyze a player with SSE (Server-Sent Events) for real-time progress updates
 */
app.post('/api/analyze-stream', async (req, res) => {
  try {
    const { riotId, tagLine, region = 'sg2', forceRegenerateInsights = true } = req.body as AnalyzePlayerRequest & { forceRegenerateInsights?: boolean };

    if (!riotId || !tagLine) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: riotId and tagLine',
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Important for Nginx/Render

    // Helper to send SSE messages
    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    console.log(`📊 Starting streaming analysis for ${riotId}#${tagLine}`);

    try {
      // Check cache first (unless forcing regeneration)
      if (!forceRegenerateInsights) {
        const cached = await getCachedPlayerStats(riotId, tagLine);
        if (cached) {
          console.log(`✅ Returning cached data for ${riotId}#${tagLine}`);
          sendEvent('complete', { data: cached, cached: true });
          res.end();
          return;
        }
      }

      // Analyze with progress callback
      const playerStats = await analyzePlayer(
        riotId,
        tagLine,
        region,
        (update: ProgressUpdate) => {
          console.log(`📈 Progress: ${update.stage} - ${update.message} (${update.progress}%)`);
          sendEvent('progress', update);
        },
        forceRegenerateInsights
      );

      console.log(`✅ Analysis complete for ${riotId}#${tagLine}`);
      sendEvent('complete', { data: playerStats, cached: false });
      res.end();
    } catch (error: any) {
      console.error('Error during streaming analysis:', error);
      sendEvent('error', { message: error.message || 'Failed to analyze player' });
      res.end();
    }
  } catch (error: any) {
    console.error('Error setting up streaming:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start analysis',
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
    console.log(`👤 Player context:`, playerContext ? `${playerContext.riotId}#${playerContext.tagLine} (${playerContext.totalGames} games)` : 'None');

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
    console.log(`📋 System prompt built with ${systemPrompt.length} chars, has player data: ${!!playerContext}`);
    
    // Trim history to last 10 messages to avoid token limit issues
    const recentHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim().length > 0)
      .slice(-10);
    
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    // Accumulate full response to parse navigation actions
    let fullResponse = '';
    let streamedText = ''; // Track what we've already sent to client

    // Stream tokens from Bedrock
    await invokeBedrockClaudeStream(
      messages,
      // onChunk: send each token as NDJSON line and accumulate
      (text: string) => {
        if (!res.writableEnded) {
          fullResponse += text;
          
          // Check if we're currently in a NAVIGATE line
          const lastNewlineIndex = fullResponse.lastIndexOf('\n');
          const currentLine = lastNewlineIndex >= 0 
            ? fullResponse.substring(lastNewlineIndex + 1) 
            : fullResponse;
          
          // If current line starts with NAVIGATE, don't stream it yet
          if (currentLine.trim().startsWith('NAVIGATE:')) {
            // Buffer this line, don't send to client
            return;
          }
          
          // Only send the text that hasn't been streamed yet
          const textToStream = fullResponse.substring(streamedText.length);
          if (textToStream) {
            res.write(JSON.stringify({ delta: textToStream }) + '\n');
            streamedText = fullResponse;
          }
        }
      },
      // onComplete: parse navigation actions and send done signal
      () => {
        if (!res.writableEnded) {
          // Parse navigation actions from response
          const { actions, cleanedText } = parseNavigationActions(fullResponse);
          
          // If we found navigation actions
          if (actions.length > 0) {
            // If there's unstreamed clean text (after removing NAVIGATE lines), send it
            if (cleanedText.length > streamedText.length || cleanedText !== streamedText) {
              res.write(JSON.stringify({ replaceText: cleanedText }) + '\n');
              console.log(`📝 Replaced text (removed NAVIGATE lines)`);
            }
            
            // Send navigation actions
            res.write(JSON.stringify({ navigationActions: actions }) + '\n');
            console.log(`🧭 Sent ${actions.length} navigation action(s):`, actions.map(a => `${a.label} → ${a.path}`).join(', '));
          }
          
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