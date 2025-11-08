/**
 * API Client for Rift Rewind
 * Handles all communication with the backend
 */

// Import types from server (would normally be shared package)
export interface PlayerStats {
	puuid: string;
	riotId: string;
	tagLine: string;
	region: string;
	totalGames: number;
	wins: number;
	losses: number;
	winRate: number;
	topChampions: ChampionStats[];
	championPoolSize: number;
	mainRole: string;
	roleDistribution: RoleStats[];
	avgKDA: number;
	avgKills: number;
	avgDeaths: number;
	avgAssists: number;
	avgCS: number;
	avgVisionScore: number;
	avgGameDuration: number;
	longestWinStreak: number;
	longestLossStreak: number;
	currentStreak: StreakInfo;
	performanceTrend: PerformanceTrend[];
	derivedMetrics: DerivedMetrics;
	archetype: PlayerArchetype;
	element?: PlayerElement;
	persona?: ElementPersona;
	watershedMoment?: WatershedMoment;
	insights?: AIInsights;
	proComparison?: ProComparison;
	topStrengths?: MetricStrength[];
	needsWork?: MetricWeakness[];
	playfulComparison?: string;
	generatedAt: string;
}

export interface ChampionStats {
	championName: string;
	championId: number;
	games: number;
	wins: number;
	winRate: number;
	avgKills: number;
	avgDeaths: number;
	avgAssists: number;
	avgCS: number;
	avgDamage: number;
	splashArtUrl?: string;
}

export interface RoleStats {
	role: string;
	games: number;
	winRate: number;
}

export interface StreakInfo {
	type: "win" | "loss";
	length: number;
	startDate: string;
	endDate: string;
}

export interface PerformanceTrend {
	date: string;
	performanceScore: number;
	winRate: number;
	gamesPlayed: number;
}

export interface DerivedMetrics {
	aggression: number;
	farming: number;
	vision: number;
	consistency: number;
	earlyGameStrength: number;
	lateGameScaling: number;
	comebackRate: number;
	clutchFactor: number;
	tiltFactor: number;
	championPoolDepth: number;
	improvementVelocity: number;
	roaming: number;
	teamfighting: number;
	snowballRate: number;
	winrateVariance: number;
	offMetaPickRate: number;
}

export interface PlayerArchetype {
	name: string;
	description: string;
	distance: number;
	matchPercentage: number;
}

export type ElementName = "Inferno" | "Tide" | "Gale" | "Terra" | "Void";

export interface PlayerElement {
	name: ElementName;
	icon: string;
	description: string;
	keywords: string[];
	score: number;
}

export interface ElementPersona {
	codename: string;
	description: string;
	archetypeName: string;
	elementName: ElementName;
}

export interface WatershedMoment {
	matchId: string;
	gameDate: string;
	championName: string;
	result: boolean;
	performanceScore: number;
	beforeAverage: number;
	afterAverage: number;
	improvement: number;
	description: string;
}

export interface AIInsights {
	story_arc: string;
	surprising_insights: string[];
	improvement_tips: string[];
	archetype_explanation: string;
	season_prediction: string;
	title: string;
}

export interface ProComparison {
	primary: ProPlayerProfile;
	secondary: ProPlayerProfile;
	similarity: number;
	description: string;
}

export interface ProPlayerProfile {
	name: string;
	team: string;
	role: "Top" | "Jungle" | "Mid" | "ADC" | "Support";
	region: "LCK" | "LPL" | "LEC" | "LCS" | "PCS" | "VCS";
	playstyle: string;
	metrics: Partial<DerivedMetrics>;
	icon?: string; // Emoji or icon for display
	achievements?: string; // Notable achievements
}

export interface MetricStrength {
	metric: string;
	value: number;
	percentile: number;
}

export interface MetricWeakness {
	metric: string;
	value: number;
	suggestion: string;
}

export interface ShareCardPlayerSummary {
	puuid?: string;
	riotId: string;
	tagLine: string;
	totalGames: number;
	winRate: number;
	archetype: Pick<PlayerArchetype, "name" | "description">;
	insights?: Pick<AIInsights, "title"> | null;
}

export interface CreateShareCardRequest {
	cardDataUrl: string;
	caption?: string;
	player: ShareCardPlayerSummary;
}

export interface ShareCardPayload {
	slug: string;
	imageUrl: string;
	caption: string;
	player: {
		riotId: string | null;
		tagLine: string | null;
	};
	createdAt: string;
}

export interface CreateShareCardResponse {
	success: boolean;
	data?: ShareCardPayload;
	error?: string;
}

export interface GetShareCardResponse {
	success: boolean;
	data?: ShareCardPayload;
	error?: string;
}

export interface XRequestTokenResponse {
	success: boolean;
	data?: {
		authUrl: string;
		oauthToken: string;
	};
	error?: string;
}

export interface XAuthSessionPayload {
	oauthToken: string;
	oauthTokenSecret: string;
	screenName: string;
	userId: string;
}

export interface XAccessTokenResponse {
	success: boolean;
	data?: XAuthSessionPayload;
	error?: string;
}

export interface XPostTweetRequest {
	caption: string;
	cardDataUrl: string;
	oauthToken: string;
	oauthTokenSecret: string;
}

export interface XPostTweetResponse {
	success: boolean;
	data?: {
		tweetUrl: string;
		tweetId: string;
		truncated?: boolean;
	};
	error?: string;
}

export type DuoBondType = "inferno" | "tide" | "terra" | "gale";

export interface DuoSynergyIdentity {
	raw: string;
	gameName: string;
	tagLine: string;
	display: string;
	short: string;
}

export type DuoRoleKey = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";

export interface DuoPairCombo {
	a: string;
	b: string;
	wr: number;
	games: number;
}

export interface DuoSynergyPlayerProfile {
	identity: DuoSynergyIdentity;
	role: DuoRoleKey;
	champions: string[];
	soloWinRate: number;
	csPerMin: number;
	deathsPerGame: number;
	objectiveRate: number;
	aggression: number;
	roamTempo: number;
	controlScore: number;
	traitVector: number[];
	traitTags: string[];
	fatigueSlope: number;
	tiltSensitivity: number;
	tiltResilience: number;
	styleLean: DuoBondType;
	region: string;
}

export interface DuoSynergyProfile {
	playerA: DuoSynergyPlayerProfile;
	playerB: DuoSynergyPlayerProfile;
	rolePairLabel: string;
	statistical: {
		wrDuo: number;
		baselineWR: number;
		deltaWR: number;
		sampleConfidence: number;
		sampleSize: number;
		perMatch: {
			cs: { a: number; b: number };
			deaths: { a: number; b: number };
			objectives: { a: number; b: number };
		};
	};
	tactical: {
		coKill: number;
		objectiveOverlap: number;
		leadConversion: number;
		roamSyncSeconds: number;
	};
	style: {
		similarity: number;
		complementarity: number;
		pairingStory: string;
		tags: string[];
	};
	psychological: {
		fatigueDrop: number;
		sharedCurveNote: string;
		tiltPropagation: number;
		momentumFactor: number;
		afterWinWR: number;
		afterLossWR: number;
	};
	ai: {
		payload: {
			summary: {
				WR_duo: number;
				deltaWR: number;
				coKill: number;
				objTogether: number;
				convRate: number;
				comeback: number;
			};
			rolePair: string;
			bestChamps: DuoPairCombo[];
			worstChamps: DuoPairCombo[];
		};
		summary: string;
		nextMatchAdvice: string;
		bestCombos: DuoPairCombo[];
		worstCombos: DuoPairCombo[];
		commentary: Record<string, string>;
		comebackRate: number;
	};
	bond: {
		score: number;
		type: DuoBondType;
		label: string;
		nickname: string;
		description: string;
		aura: string;
		triangle: {
			mechanics: number;
			coordination: number;
			discipline: number;
		};
	};
}

export interface DuoSynergyRequest {
	playerA: { riotId: string; tagLine: string; region?: string };
	playerB: { riotId: string; tagLine: string; region?: string };
}

export interface DuoSynergyResponse {
	success: boolean;
	data?: DuoSynergyProfile;
	error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const CANONICAL_SHARE_URL = "https://rift-rewind-chronicle.vercel.app/";

export interface ProgressUpdate {
	stage: string;
	message: string;
	progress: number;
}

function summarizeErrorBody(text: string, response: Response): string {
	if (!text) {
		return `Unexpected ${response.status} response from server`;
	}
	const cleaned = text
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!cleaned) {
		return `Unexpected ${response.status} response from server`;
	}
	const snippet = cleaned.slice(0, 200);
	return cleaned.length > 200 ? `${snippet}...` : snippet;
}

async function readJsonBody<T>(response: Response): Promise<T> {
	const text = await response.text();
	try {
		return JSON.parse(text) as T;
	} catch {
		throw new Error(summarizeErrorBody(text, response));
	}
}

/**
 * Analyze a player with real-time progress updates via SSE
 */
export async function analyzePlayerWithProgress(
	riotId: string,
	tagLine: string,
	region: string = "sg2",
	onProgress?: (update: ProgressUpdate) => void,
	onComplete?: (data: PlayerStats, cached: boolean) => void,
	onError?: (error: string) => void,
): Promise<void> {
	try {
		// Use fetch to POST, then read stream
		const response = await fetch(`${API_URL}/api/analyze-stream`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ riotId, tagLine, region }),
		});

		if (!response.ok) {
			throw new Error("Failed to start analysis");
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) {
			throw new Error("Stream not available");
		}

		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n\n");
			buffer = lines.pop() || ""; // Keep incomplete message in buffer

			for (const line of lines) {
				if (!line.trim()) continue;

				const eventMatch = line.match(/^event: (.+)$/m);
				const dataMatch = line.match(/^data: (.+)$/m);

				if (!eventMatch || !dataMatch) continue;

				const event = eventMatch[1];
				const data = JSON.parse(dataMatch[1]);

				switch (event) {
					case "progress":
						onProgress?.(data);
						break;
					case "complete":
						onComplete?.(data.data, data.cached);
						break;
					case "error":
						onError?.(data.message);
						break;
				}
			}
		}
	} catch (error: any) {
		console.error("Error during streaming analysis:", error);
		onError?.(error.message || "Failed to analyze player");
	}
}

/**
 * Analyze a player (or get from cache) - Legacy non-streaming version
 */
export async function analyzePlayer(
	riotId: string,
	tagLine: string,
	region: string = "sg2",
): Promise<{
	success: boolean;
	data?: PlayerStats;
	error?: string;
	cached?: boolean;
}> {
	try {
		const response = await fetch(`${API_URL}/api/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ riotId, tagLine, region }),
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to analyze player");
		}

		return result;
	} catch (error: any) {
		console.error("Error analyzing player:", error);
		return {
			success: false,
			error: error.message || "Failed to analyze player",
		};
	}
}

/**
 * Get cached player data
 */
export async function getPlayer(
	riotId: string,
	tagLine: string,
): Promise<{ success: boolean; data?: PlayerStats; error?: string }> {
	try {
		const response = await fetch(`${API_URL}/api/player/${riotId}/${tagLine}`);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to fetch player");
		}

		return result;
	} catch (error: any) {
		console.error("Error fetching player:", error);
		return {
			success: false,
			error: error.message || "Failed to fetch player",
		};
	}
}

/**
 * Fetch duo synergy analysis
 */
export async function fetchDuoSynergy(
	request: DuoSynergyRequest,
): Promise<DuoSynergyProfile> {
	const response = await fetch(`${API_URL}/api/duo-synergy`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	const result = await readJsonBody<DuoSynergyResponse>(response);

	if (!response.ok || !result.success || !result.data) {
		throw new Error(
			result.error || `Failed to compute duo synergy (${response.status})`,
		);
	}

	return result.data;
}

/**
 * Create friend group
 */
export async function createFriendGroup(
	name: string,
	players: Array<{ riotId: string; tagLine: string }>,
): Promise<{ success: boolean; groupId?: string; error?: string }> {
	try {
		const response = await fetch(`${API_URL}/api/group`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, players }),
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to create group");
		}

		return result;
	} catch (error: any) {
		console.error("Error creating group:", error);
		return {
			success: false,
			error: error.message || "Failed to create group",
		};
	}
}

/**
 * Get friend group
 */
export async function getFriendGroup(groupId: string) {
	try {
		const response = await fetch(`${API_URL}/api/group/${groupId}`);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to fetch group");
		}

		return result;
	} catch (error: any) {
		console.error("Error fetching group:", error);
		throw error;
	}
}

/**
 * Upload a share card and persist metadata
 */
export async function createShareCard(
	request: CreateShareCardRequest,
): Promise<ShareCardPayload> {
	const response = await fetch(`${API_URL}/api/share-cards`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(request),
	});

	const result = await readJsonBody<CreateShareCardResponse>(response);

	console.log("Result: ", result);

	if (!response.ok || !result.success || !result.data) {
		throw new Error(
			result.error || `Failed to create share card (${response.status})`,
		);
	}

	return result.data;
}

/**
 * Fetch a share card by slug
 */
export async function fetchShareCard(slug: string): Promise<ShareCardPayload> {
	const response = await fetch(`${API_URL}/api/share-cards/${slug}`);
	const result = await readJsonBody<GetShareCardResponse>(response);

	if (!response.ok || !result.success || !result.data) {
		throw new Error(
			result.error || `Share card not found (${response.status})`,
		);
	}

	return result.data;
}

export async function startXAuthSession(): Promise<{
	authUrl: string;
	oauthToken: string;
}> {
	const response = await fetch(`${API_URL}/api/x/request-token`, {
		method: "POST",
	});

	const result = await readJsonBody<XRequestTokenResponse>(response);
	if (!response.ok || !result.success || !result.data) {
		throw new Error(result.error || `Failed to contact X (${response.status})`);
	}
	return result.data;
}

export async function completeXAuthSession(
	oauthToken: string,
	oauthVerifier: string,
): Promise<XAuthSessionPayload> {
	const response = await fetch(`${API_URL}/api/x/access-token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ oauthToken, oauthVerifier }),
	});

	const result = await readJsonBody<XAccessTokenResponse>(response);
	if (!response.ok || !result.success || !result.data) {
		throw new Error(
			result.error || `Failed to finalize X login (${response.status})`,
		);
	}
	return result.data;
}

export async function postRecapToX(
	payload: XPostTweetRequest,
): Promise<{ tweetUrl: string; tweetId: string; truncated?: boolean }> {
	const response = await fetch(`${API_URL}/api/x/post-tweet`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = await readJsonBody<XPostTweetResponse>(response);
	if (!response.ok || !result.success || !result.data) {
		throw new Error(result.error || `Failed to post on X (${response.status})`);
	}

	return result.data;
}
