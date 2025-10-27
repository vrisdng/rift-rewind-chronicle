// server/lib/riotClient.ts

/**
 * Riot Games API Client
 * Documentation: https://developer.riotgames.com/apis
 */

const RIOT_API_KEY = process.env.RIOT_API_KEY || "";
const RIOT_BASE_URL = "https://asia.api.riotgames.com"; // Use appropriate region
const RIOT_REGIONAL_URL = "https://sea.api.riotgames.com"; // For regional endpoints

interface RiotClientConfig {
  apiKey: string;
  region?: "americas" | "asia" | "europe" | "sea";
  platform?: string; // e.g., "sg2", "na1", "euw1"
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

interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
  name?: string;
}

interface MatchInfo {
  matchId: string;
  // Add more match details as needed
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
  return regionMap[region] || regionMap.asia;
}

function getPlatformUrl(platform: string): string {
  // Platform routing (e.g., sg2, na1, euw1, kr)
  return `https://${platform}.api.riotgames.com`;
}

class RiotClient {
  private apiKey: string;
  private region: string;
  private platform: string;
  private baseUrl: string;
  private platformUrl: string;

  constructor(config: RiotClientConfig) {
    this.apiKey = process.env.RIOT_API_KEY || config.apiKey;
    this.region = config.region || "asia";
    this.platform = config.platform || "sg2";
    this.baseUrl = getBaseUrl(this.region);
    this.platformUrl = getPlatformUrl(this.platform);

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
    const url = `${this.baseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`;
    return this.makeRequest<RiotAccount>(url);
  }

  /**
   * Get account by Riot ID (gameName#tagLine)
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);
    const url = `${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`;
    return this.makeRequest<RiotAccount>(url);
  }

  /**
   * Get summoner by summoner name
   */
  async getSummonerByName(summonerName: string): Promise<Summoner> {
    const encodedName = encodeURIComponent(summonerName);
    const url = `${this.platformUrl}/lol/summoner/v4/summoners/by-name/${encodedName}`;
    return this.makeRequest<Summoner>(url);
  }

  /**
   * Get summoner by PUUID
   */
  async getSummonerByPuuid(puuid: string): Promise<Summoner> {
    const url = `${this.platformUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.makeRequest<Summoner>(url);
  }

  /**
   * Get summoner by account ID
   */
  async getSummonerByAccountId(accountId: string): Promise<Summoner> {
    const url = `${this.platformUrl}/lol/summoner/v4/summoners/by-account/${accountId}`;
    return this.makeRequest<Summoner>(url);
  }

  /**
   * Get champion mastery scores for a summoner by PUUID
   */
  async getChampionMasteries(puuid: string): Promise<ChampionMastery[]> {
    const url = `${this.platformUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
    return this.makeRequest<ChampionMastery[]>(url);
  }

  /**
   * Get champion mastery for a specific champion
   */
  async getChampionMastery(
    puuid: string,
    championId: number
  ): Promise<ChampionMastery> {
    const url = `${this.platformUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
    return this.makeRequest<ChampionMastery>(url);
  }

  /**
   * Get total mastery score for a summoner
   */
  async getMasteryScore(puuid: string): Promise<number> {
    const url = `${this.platformUrl}/lol/champion-mastery/v4/scores/by-puuid/${puuid}`;
    return this.makeRequest<number>(url);
  }

  /**
   * Get top champion masteries (limited to count)
   */
  async getTopChampionMasteries(
    puuid: string,
    count: number = 10
  ): Promise<ChampionMastery[]> {
    const url = `${this.platformUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
    return this.makeRequest<ChampionMastery[]>(url);
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
    }
  ): Promise<string[]> {
    const params = new URLSearchParams();
    if (options?.start !== undefined) params.append("start", options.start.toString());
    if (options?.count !== undefined) params.append("count", options.count.toString());
    if (options?.queue !== undefined) params.append("queue", options.queue.toString());
    if (options?.type) params.append("type", options.type);

    const queryString = params.toString();
    const url = `${this.baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids${queryString ? `?${queryString}` : ""}`;
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
}

// Singleton instance
let cachedClient: RiotClient | undefined;

function createClient(config?: Partial<RiotClientConfig>): RiotClient {
  return new RiotClient({
    apiKey: config?.apiKey || RIOT_API_KEY,
    region: config?.region || "asia",
    platform: config?.platform || "sg2",
  });
}

export function getClient(config?: Partial<RiotClientConfig>): RiotClient {
  if (!cachedClient) {
    cachedClient = createClient(config);
  }
  return cachedClient;
}

// Convenience functions
export async function getAccountByPuuid(puuid: string): Promise<RiotAccount> {
  const client = getClient();
  return client.getAccountByPuuid(puuid);
}

export async function getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
  const client = getClient();
  return client.getAccountByRiotId(gameName, tagLine);
}

export async function getChampionMasteries(puuid: string): Promise<ChampionMastery[]> {
  const client = getClient();
  return client.getChampionMasteries(puuid);
}

export async function getSummonerByName(summonerName: string): Promise<Summoner> {
  const client = getClient();
  return client.getSummonerByName(summonerName);
}

export async function getTopChampions(puuid: string, count: number = 10): Promise<ChampionMastery[]> {
  const client = getClient();
  return client.getTopChampionMasteries(puuid, count);
}

export async function getMatchHistory(
  puuid: string,
  count: number = 20
): Promise<string[]> {
  const client = getClient();
  return client.getMatchIdsByPuuid(puuid, { count });
}

// Export types and classes
export type { ChampionMastery, Summoner, RiotClientConfig, MatchInfo };
export { RiotClient, RiotAPIError };

export default RiotClient;