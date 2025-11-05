// server/lib/riotClient.ts

/**
 * Riot Games API Client
 * Documentation: https://developer.riotgames.com/apis
 */

const RIOT_API_KEY = process.env.RIOT_API_KEY || "";

interface RiotClientConfig {
  apiKey: string;
  region?: "americas" | "asia" | "europe" | "sea";
}

interface ChampionMastery {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  tokensEarned: number;
  championSeasonMilestone: number;
}

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}


class RiotAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "RiotAPIError";
  }
}

function createHeaders(apiKey: string): HeadersInit {
  return {
    "X-Riot-Token": apiKey,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
}

function getBaseUrl(region: string): string {
  const regionMap: Record<string, string> = {
    americas: "https://americas.api.riotgames.com",
    asia: "https://asia.api.riotgames.com",
    europe: "https://europe.api.riotgames.com",
    sea: "https://sea.api.riotgames.com",
  };
  return regionMap[region] || regionMap.sea;
}

class RiotClient {
  private apiKey: string;
  private region: string;
  private baseUrl: string;
  private accountUrl: string;

  constructor(config: RiotClientConfig) {
  this.apiKey = config.apiKey || process.env.RIOT_API_KEY || "";
  this.region = config.region || "sea";
  this.baseUrl = getBaseUrl(this.region);
  this.accountUrl = "https://asia.api.riotgames.com";
  
  if (!this.apiKey) {
    throw new Error("Riot API key is required");
  }
}


  private async makeRequest<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: createHeaders(this.apiKey),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new RiotAPIError(
          `Riot API request failed: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof RiotAPIError) {
        throw error;
      }
      throw new RiotAPIError(
        `Failed to make request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get account by PUUID (Riot Account API)
   * Returns gameName and tagLine
   */
  async getAccountByPuuid(puuid: string): Promise<RiotAccount> {
    const url = `${this.accountUrl}/riot/account/v1/accounts/by-puuid/${puuid}`;
    return this.makeRequest<RiotAccount>(url);
  }

  /**
   * Get account by Riot ID (gameName#tagLine)
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);
    const url = `${this.accountUrl}/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`;
    return this.makeRequest<RiotAccount>(url);
  }

  /**
   * Get match IDs by PUUID
   */
  async getMatchIdsByPuuid(
    puuid: string,
    options?: {
      start?: number;
      count?: number;
      queue?: number;
      type?: string;
      startTime?: number;
      endTime?: number;
    }
  ): Promise<string[]> {
    const params = new URLSearchParams();
    if (options?.start !== undefined) params.append("start", options.start.toString());
    if (options?.count !== undefined) params.append("count", options.count.toString());
    if (options?.queue !== undefined) params.append("queue", options.queue.toString());
    if (options?.type !== undefined) params.append("type", options.type.toString());
    if (options?.startTime !== undefined) params.append("startTime", options.startTime.toString());
    if (options?.endTime !== undefined) params.append("endTime", options.endTime.toString());

    const queryString = params.toString();
    console.log("base Url is: ", this.baseUrl);
    const url = `${this.baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids${queryString ? `?${queryString}` : ""}`;
    console.log("Fetching match IDs from URL:", url);
    return this.makeRequest<string[]>(url);
  }

  /**
   * Get match details by match ID
   */
  async getMatch(matchId: string): Promise<any> {
    const url = `${this.baseUrl}/lol/match/v5/matches/${matchId}`;
    return this.makeRequest<any>(url);
  }

  /**
   * Get match timeline by match ID
   */
  async getMatchTimeline(matchId: string): Promise<any> {
    const url = `${this.baseUrl}/lol/match/v5/matches/${matchId}/timeline`;
    return this.makeRequest<any>(url);
  }

  /**
 * Fetch multiple matches concurrently with rate limiting
 */
async fetchMatchesConcurrent(
  matchIds: string[],
  concurrency: number = 10
): Promise<any[]> {
  const matches: any[] = [];
  const errors: string[] = [];
  
  console.log(`📥 Fetching ${matchIds.length} matches with concurrency ${concurrency}...`);
  
  // Process in chunks
  for (let i = 0; i < matchIds.length; i += concurrency) {
    const chunk = matchIds.slice(i, i + concurrency);
    
    try {
      const results = await Promise.allSettled(
        chunk.map(id => this.getMatch(id))
      );
      
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          matches.push(result.value);
        } else {
          errors.push(chunk[idx]);
          console.warn(`❌ Failed to fetch match ${chunk[idx]}`);
        }
      });
      
      // Rate limit protection: small delay between chunks
      if (i + concurrency < matchIds.length) {
        await this.sleep(100); // 100ms between chunks
      }
      
      console.log(`📊 Progress: ${Math.min(i + concurrency, matchIds.length)}/${matchIds.length} matches`);
    } catch (error) {
      console.error('Chunk failed:', error);
    }
  }
  
  console.log(`✅ Successfully fetched ${matches.length}/${matchIds.length} matches`);
  if (errors.length > 0) {
    console.warn(`⚠️  Failed matches: ${errors.length}`);
  }
  
  return matches;
}

private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
}



// Singleton instance
let cachedClient: RiotClient | undefined;

function createClient(config?: Partial<RiotClientConfig>): RiotClient {
  return new RiotClient({
    apiKey: config?.apiKey || RIOT_API_KEY,
    region: config?.region || "sea",
  });
}

export function getClient(config?: Partial<RiotClientConfig>): RiotClient {
  if (!cachedClient) {
    cachedClient = createClient(config);
  }
  return cachedClient;
}

// Note: Convenience functions removed - use getClient() directly

// Export types and classes
export type { ChampionMastery, RiotClientConfig, RiotAccount };
export { RiotClient, RiotAPIError };

export default RiotClient;