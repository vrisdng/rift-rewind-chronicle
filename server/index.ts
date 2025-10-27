import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { getClient } from './lib/riot';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/summoner/:gameName/:tagLine', async (req, res) => {
  try {
    const client = getClient();
    const { gameName, tagLine } = req.params;
    
    // First get the Riot account info
    const account = await client.getAccountByRiotId(gameName, tagLine);
    
    // Then get the summoner info using the PUUID
    const summoner = await client.getSummonerByPuuid(account.puuid);
    
    // Get champion masteries
    const masteries = await client.getChampionMasteries(account.puuid);
    
    res.json({
      account,
      summoner,
      masteries: masteries.slice(0, 5) // Return top 5 champions
    });
  } catch (error) {
    console.error('Error fetching summoner:', error);
    if (error.statusCode === 404) {
      res.status(404).json({ error: 'Summoner not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch summoner data' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Riot API Key loaded: ${!!process.env.RIOT_API_KEY}`); // Just to verify env loading
});