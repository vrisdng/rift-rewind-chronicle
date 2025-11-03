import express from 'express';
import cors from 'cors';
import { getClient } from './lib/riot.ts';
import { analyzePlayer, getCachedPlayerStats } from './lib/playerAnalyzer.ts';
import { createFriendGroup, getFriendGroup } from './lib/supabaseClient.ts';
import type { AnalyzePlayerRequest, CreateGroupRequest, ProgressUpdate } from './types/index.ts';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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