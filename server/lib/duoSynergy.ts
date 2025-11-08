import type { DBMatch, PlayerStats } from "../types/index.ts";
import { getMatches } from "./supabaseClient.ts";
import { analyzePlayer, getCachedPlayerStats } from "./playerAnalyzer.ts";

export type BondType = "inferno" | "tide" | "terra" | "gale";

export type RoleKey = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";

export interface DuoPlayerInput {
	riotId: string;
	tagLine: string;
	region?: string;
}

export interface PairCombo {
	a: string;
	b: string;
	wr: number;
	games: number;
}

export interface DuoPlayerIdentity {
	raw: string;
	gameName: string;
	tagLine: string;
	display: string;
	short: string;
}

export interface DuoPlayerProfile {
	identity: DuoPlayerIdentity;
	role: RoleKey;
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
	styleLean: BondType;
	region: string;
}

interface PlayerContext {
	stats: PlayerStats;
	matches: DBMatch[];
	role: RoleKey;
	profile: DuoPlayerProfile;
	baseline: PlayerAverages;
}

interface DuoMatchPair {
	id: string;
	a: DBMatch;
	b: DBMatch;
	date: number;
}

interface PlayerAverages {
	sample: number;
	wins: number;
	csPerMin: number;
	deaths: number;
	kills: number;
	assists: number;
	takedowns: number;
	objectiveScore: number;
	performance: number;
	visionPerMin: number;
	goldPerMin: number;
	winRate: number;
}

export interface DuoSynergyProfile {
	playerA: DuoPlayerProfile;
	playerB: DuoPlayerProfile;
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
			bestChamps: PairCombo[];
			worstChamps: PairCombo[];
		};
		summary: string;
		nextMatchAdvice: string;
		bestCombos: PairCombo[];
		worstCombos: PairCombo[];
		commentary: Record<string, string>;
		comebackRate: number;
	};
	bond: {
		score: number;
		type: BondType;
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

const BOND_ARCHETYPES: Record<
	BondType,
	{ label: string; nickname: string; description: string; aura: string }
> = {
	inferno: {
		label: "Inferno Bond",
		nickname: "The Blood Brothers",
		description: "Hyper-kill synergy, terrifying engages.",
		aura: "from-orange-500/20 via-red-500/10 to-transparent",
	},
	tide: {
		label: "Tide Bond",
		nickname: "The Tidecallers",
		description: "Adaptive duo that rides comeback waves.",
		aura: "from-sky-500/20 via-cyan-500/10 to-transparent",
	},
	terra: {
		label: "Terra Bond",
		nickname: "The Guardians",
		description: "Low deaths, high macro discipline.",
		aura: "from-emerald-500/15 via-lime-500/5 to-transparent",
	},
	gale: {
		label: "Gale Bond",
		nickname: "The Mindmeld",
		description: "High map sync, flexible aggression.",
		aura: "from-fuchsia-500/20 via-blue-500/10 to-transparent",
	},
};

const QUESTION_BANK = {
	midFights: "Why do we lose mid-game fights?",
	closeGames: "How do we close out early leads?",
	tilt: "How do we stop the tilt chain after one of us dies?",
} as const;

const clamp = (value: number, min = 0, max = 1) =>
	Math.min(Math.max(value, min), max);

const safeDivide = (value: number, total: number, fallback = 0) =>
	total === 0 ? fallback : value / total;

const minutesPlayed = (match: DBMatch) => Math.max(1, match.game_duration / 60);

const objectiveScore = (match: DBMatch) => {
	const minutes = minutesPlayed(match);
	const visionPerMin = match.vision_score / minutes;
	const wardsPerMin = match.wards_placed / minutes;
	const dpm = match.damage_dealt / minutes;
	const jungleBonus = /jungle/i.test(match.role ?? "") ? 0.35 : 0;

	return (
		visionPerMin * 0.35 +
		wardsPerMin * 0.25 +
		(dpm / 1200) * 0.2 +
		(match.performance_score / 100) * 0.2 +
		jungleBonus
	);
};

function calculateAverages(matches: DBMatch[]): PlayerAverages {
	if (!matches.length) {
		return {
			sample: 0,
			wins: 0,
			csPerMin: 0,
			deaths: 0,
			kills: 0,
			assists: 0,
			takedowns: 0,
			objectiveScore: 0,
			performance: 0,
			visionPerMin: 0,
			goldPerMin: 0,
			winRate: 0,
		};
	}

	const totals = matches.reduce(
		(acc, match) => {
			const minutes = minutesPlayed(match);
			const csPerMin = match.cs / minutes;
			const visionPerMin = match.vision_score / minutes;
			const goldPerMin = match.gold / minutes;

			acc.sample += 1;
			acc.wins += match.result ? 1 : 0;
			acc.csPerMin += csPerMin;
			acc.deaths += match.deaths;
			acc.kills += match.kills;
			acc.assists += match.assists;
			acc.takedowns += match.kills + match.assists;
			acc.objectiveScore += objectiveScore(match);
			acc.performance += match.performance_score;
			acc.visionPerMin += visionPerMin;
			acc.goldPerMin += goldPerMin;
			return acc;
		},
		{
			sample: 0,
			wins: 0,
			csPerMin: 0,
			deaths: 0,
			kills: 0,
			assists: 0,
			takedowns: 0,
			objectiveScore: 0,
			performance: 0,
			visionPerMin: 0,
			goldPerMin: 0,
		},
	);

	return {
		sample: totals.sample,
		wins: totals.wins,
		csPerMin: totals.csPerMin / totals.sample,
		deaths: totals.deaths / totals.sample,
		kills: totals.kills / totals.sample,
		assists: totals.assists / totals.sample,
		takedowns: totals.takedowns / totals.sample,
		objectiveScore: totals.objectiveScore / totals.sample,
		performance: totals.performance / totals.sample,
		visionPerMin: totals.visionPerMin / totals.sample,
		goldPerMin: totals.goldPerMin / totals.sample,
		winRate: totals.wins / totals.sample,
	};
}

const roleMap: Record<string, RoleKey> = {
	TOP: "TOP",
	TOPLANE: "TOP",
	JUNGLE: "JUNGLE",
	JGL: "JUNGLE",
	MID: "MID",
	MIDDLE: "MID",
	ADC: "ADC",
	BOTTOM: "ADC",
	BOT: "ADC",
	SUP: "SUPPORT",
	SUPPORT: "SUPPORT",
	UTILITY: "SUPPORT",
};

const toRoleKey = (role?: string): RoleKey => {
	if (!role) return "MID";
	const upper = role.toUpperCase();
	return roleMap[upper] ?? "MID";
};

const toShortRole = (role: RoleKey) => {
	switch (role) {
		case "SUPPORT":
			return "SUPP";
		case "JUNGLE":
			return "JGL";
		default:
			return role;
	}
};

const buildIdentity = (stats: PlayerStats): DuoPlayerIdentity => {
	const display = `${stats.riotId}${stats.tagLine ? `#${stats.tagLine}` : ""}`;
	return {
		raw: display,
		gameName: stats.riotId,
		tagLine: stats.tagLine,
		display,
		short: stats.riotId.split(" ")[0],
	};
};

const traitVectorFromMetrics = (stats: PlayerStats): number[] => {
	const metrics = stats.derivedMetrics;
	const durability = clamp(
		(100 - metrics.aggression + metrics.teamfighting) / 200,
		0,
		1,
	);
	const burst = clamp(
		(metrics.aggression + metrics.snowballRate) / 200,
		0,
		1,
	);
	const utility = clamp(
		(metrics.vision + metrics.roaming) / 200,
		0,
		1,
	);
	const control = clamp(
		(metrics.consistency + metrics.teamfighting) / 200,
		0,
		1,
	);
	const mobility = clamp(
		(metrics.roaming + metrics.earlyGameStrength) / 200,
		0,
		1,
	);
	return [durability, burst, utility, control, mobility];
};

const deriveTraitTags = (stats: PlayerStats): string[] => {
	const tags = new Set<string>();
	const metrics = stats.derivedMetrics;
	const role = stats.mainRole?.toLowerCase() ?? "";

	if (role.includes("support")) tags.add("support");
	if (role.includes("jungle")) tags.add("jungle pathing");
	if (metrics.aggression >= 60) tags.add("aggressive");
	if (metrics.aggression <= 40) tags.add("patient");
	if (metrics.vision >= 60) tags.add("vision");
	if (metrics.roaming >= 60) tags.add("roamer");
	if (metrics.teamfighting >= 65) tags.add("teamfight anchor");
	if (metrics.lateGameScaling >= 60) tags.add("late-game scaling");
	if (metrics.earlyGameStrength >= 60) tags.add("early spike");
	if (metrics.offMetaPickRate >= 55) tags.add("off-meta");

	return Array.from(tags);
};

const inferStyleLean = (vector: number[]): BondType => {
	const [durability, burst, utility, control, mobility] = vector;
	if (burst + mobility > 1.3) return "inferno";
	if (utility + control > 1.3) return "tide";
	if (durability + control > 1.4) return "terra";
	return "gale";
};

const deriveStyleStory = (tagsA: string[], tagsB: string[]) => {
	const has = (tags: string[], tag: string) =>
		tags.some((value) => value.toLowerCase().includes(tag));

	if (
		(has(tagsA, "support") && has(tagsB, "aggressive")) ||
		(has(tagsB, "support") && has(tagsA, "aggressive"))
	) {
		return "Tank/enchanter setting up burst damage — initiate + finish.";
	}
	if (
		(has(tagsA, "support") && has(tagsB, "late-game")) ||
		(has(tagsB, "support") && has(tagsA, "late-game"))
	) {
		return "Enchanter plus scaling carry = sustain into unstoppable late fights.";
	}
	if (has(tagsA, "aggressive") && has(tagsB, "aggressive")) {
		return "Double aggression — explosive but punishes every mistake.";
	}
	if (has(tagsA, "roamer") || has(tagsB, "roamer")) {
		return "Roaming instincts align — traps and collapses appear everywhere.";
	}
	return "Balanced map control duo with flexible responses to any comp.";
};

const cosineSimilarity = (a: number[], b: number[]) => {
	const dot = a.reduce((sum, value, idx) => sum + value * b[idx], 0);
	const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
	const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
	if (!normA || !normB) return 0.5;
	return clamp((dot / (normA * normB) + 1) / 2, 0, 1);
};

const buildPlayerProfile = (
	stats: PlayerStats,
	matches: DBMatch[],
	duoIds: Set<string>,
): PlayerContext => {
	const identity = buildIdentity(stats);
	const role = toRoleKey(stats.mainRole);

	const soloMatches = matches.filter((match) => !duoIds.has(match.match_id));
	const soloAverages = calculateAverages(
		soloMatches.length ? soloMatches : matches,
	);

	const vector = traitVectorFromMetrics(stats);
	const traitTags = deriveTraitTags(stats);
	const styleLean = inferStyleLean(vector);

	const champions = (stats.topChampions || [])
		.slice(0, 2)
		.map((champ) => champ.championName);

	const profile: DuoPlayerProfile = {
		identity,
		role,
		champions,
		soloWinRate: soloAverages.winRate,
		csPerMin: soloAverages.csPerMin,
		deathsPerGame: soloAverages.deaths,
		objectiveRate: clamp(soloAverages.objectiveScore / 4, 0, 1),
		aggression: clamp(stats.derivedMetrics.aggression / 100, 0, 1),
		roamTempo: clamp(stats.derivedMetrics.roaming / 100, 0, 1),
		controlScore: clamp(stats.derivedMetrics.vision / 100, 0, 1),
		traitVector: vector,
		traitTags,
		fatigueSlope: clamp(
			(100 - stats.derivedMetrics.consistency) / 1200 + 0.015,
			0.01,
			0.08,
		),
		tiltSensitivity: clamp(stats.derivedMetrics.tiltFactor / 100, 0, 1),
		tiltResilience: clamp(stats.derivedMetrics.clutchFactor / 100, 0, 1),
		styleLean,
		region: stats.region,
	};

	return {
		stats,
		matches,
		role,
		profile,
		baseline: soloAverages,
	};
};

const ratioOrZero = (value: number, total: number) =>
	total === 0 ? 0 : value / total;

const chronologicalPairs = (pairs: DuoMatchPair[]) =>
	[...pairs].sort((a, b) => a.date - b.date);

const computeFatigueDrop = (pairs: DuoMatchPair[]) => {
	if (pairs.length < 4) return 0;
	const sorted = chronologicalPairs(pairs);
	const chunk = Math.max(2, Math.floor(sorted.length / 3));
	const early = sorted.slice(0, chunk);
	const late = sorted.slice(-chunk);
	const earlyWR = ratioOrZero(
		early.filter((pair) => pair.a.result).length,
		early.length,
	);
	const lateWR = ratioOrZero(
		late.filter((pair) => pair.a.result).length,
		late.length,
	);
	return Math.max(0, earlyWR - lateWR);
};

const buildCombos = (pairs: DuoMatchPair[]): PairCombo[] => {
	const comboMap = new Map<
		string,
		{ a: string; b: string; games: number; wins: number }
	>();

	for (const pair of pairs) {
		const key = `${pair.a.champion_name}::${pair.b.champion_name}`;
		const current = comboMap.get(key) || {
			a: pair.a.champion_name,
			b: pair.b.champion_name,
			games: 0,
			wins: 0,
		};
		current.games += 1;
		current.wins += pair.a.result ? 1 : 0;
		comboMap.set(key, current);
	}

	return Array.from(comboMap.values()).map((combo) => ({
		a: combo.a,
		b: combo.b,
		wr: combo.wins / combo.games,
		games: combo.games,
	}));
};

const selectCombos = (
	combos: PairCombo[],
	type: "best" | "worst",
): PairCombo[] => {
	const filtered = combos.filter((combo) => combo.games >= 2);
	if (!filtered.length) return [];
	const sorted = filtered.sort((a, b) =>
		type === "best" ? b.wr - a.wr : a.wr - b.wr,
	);
	return sorted.slice(0, type === "best" ? 3 : 1);
};

const commentaryText = (
	key: keyof typeof QUESTION_BANK,
	metrics: {
		roamSyncSeconds: number;
		deltaWR: number;
		leadConversion: number;
		bestCombo?: PairCombo;
		tiltPropagation: number;
		playerNames: [string, string];
	},
) => {
	switch (key) {
		case "midFights": {
			const drift = metrics.roamSyncSeconds.toFixed(1);
			const wrDelta = Math.round(metrics.deltaWR * 100);
			return `Mid-game slips because you're arriving ${drift}s apart to river fights. Sync waves and recalls to bring that ${wrDelta >= 0 ? `+${wrDelta}` : wrDelta}% ΔWR online sooner.`;
		}
		case "closeGames": {
			const conversion = Math.round(metrics.leadConversion * 100);
			const combo = metrics.bestCombo
				? `${metrics.bestCombo.a} + ${metrics.bestCombo.b}`
				: "your comfort picks";
			return `You're converting ${conversion}% of early leads. Draft ${combo}, secure Herald, and force Baron within two rotations to keep that trend rolling.`;
		}
		case "tilt": {
			const tilt = Math.round(metrics.tiltPropagation * 100);
			return `${metrics.playerNames[1]} inherits ${tilt}% of the tilt when ${metrics.playerNames[0]} dies twice in a row. Take a deep breath, drop a control ward, and stabilize before the next objective.`;
		}
		default:
			return "Keep communicating and reviewing VODs together.";
	}
};

const detectBondType = (
	coKill: number,
	objectiveOverlap: number,
	discipline: number,
	comebackRate: number,
): BondType => {
	if (coKill >= 0.6 && objectiveOverlap >= 0.55) return "inferno";
	if (objectiveOverlap >= 0.6 && comebackRate >= 0.55) return "tide";
	if (discipline >= 0.6) return "terra";
	return "gale";
};

export async function computeDuoSynergy(
	playerAInput: DuoPlayerInput,
	playerBInput: DuoPlayerInput,
): Promise<DuoSynergyProfile> {
	if (!playerAInput?.riotId || !playerAInput?.tagLine) {
		throw new Error("Player A Riot ID and tag line are required");
	}
	if (!playerBInput?.riotId || !playerBInput?.tagLine) {
		throw new Error("Player B Riot ID and tag line are required");
	}

	const [playerAStats, playerBStats] = await Promise.all([
		(async () => {
			let stats =
				(await getCachedPlayerStats(playerAInput.riotId, playerAInput.tagLine)) ||
				null;
			if (!stats) {
				stats = await analyzePlayer(
					playerAInput.riotId,
					playerAInput.tagLine,
					playerAInput.region || "sea",
				);
			}
			const matches = await getMatches(stats.puuid);
			if (!matches.length) {
				throw new Error(
					`No matches found for ${stats.riotId}#${stats.tagLine}. Analyze them first.`,
				);
			}
			return buildPlayerProfile(
				stats,
				matches,
				new Set<string>(), // placeholder; replaced later
			);
		})(),
		(async () => {
			let stats =
				(await getCachedPlayerStats(playerBInput.riotId, playerBInput.tagLine)) ||
				null;
			if (!stats) {
				stats = await analyzePlayer(
					playerBInput.riotId,
					playerBInput.tagLine,
					playerBInput.region || "sea",
				);
			}
			const matches = await getMatches(stats.puuid);
			if (!matches.length) {
				throw new Error(
					`No matches found for ${stats.riotId}#${stats.tagLine}. Analyze them first.`,
				);
			}
			return buildPlayerProfile(
				stats,
				matches,
				new Set<string>(), // placeholder; replaced later
			);
		})(),
	]);

	const matchesAMap = new Map(playerAStats.matches.map((m) => [m.match_id, m]));
	const matchesBMap = new Map(playerBStats.matches.map((m) => [m.match_id, m]));

	const duoPairs: DuoMatchPair[] = [];
	for (const match of playerAStats.matches) {
		const opponent = matchesBMap.get(match.match_id);
		if (opponent && opponent.team_id === match.team_id) {
			duoPairs.push({
				id: match.match_id,
				a: match,
				b: opponent,
				date: new Date(match.game_date).getTime(),
			});
		}
	}

	if (!duoPairs.length) {
		throw new Error(
			"No shared matches found for this duo in the analyzed timeframe.",
		);
	}

	const duoMatchIds = new Set(duoPairs.map((pair) => pair.id));

	const ctxA = buildPlayerProfile(
		playerAStats.stats,
		playerAStats.matches,
		duoMatchIds,
	);
	const ctxB = buildPlayerProfile(
		playerBStats.stats,
		playerBStats.matches,
		duoMatchIds,
	);

	const duoMatchesA = duoPairs.map((pair) => pair.a);
	const duoMatchesB = duoPairs.map((pair) => pair.b);

	const duoStatsA = calculateAverages(duoMatchesA);
	const duoStatsB = calculateAverages(duoMatchesB);

	const wrDuo = ratioOrZero(
		duoPairs.filter((pair) => pair.a.result).length,
		duoPairs.length,
	);
	const expectedWR =
		1 -
		(1 - ctxA.baseline.winRate) *
			(1 - ctxB.baseline.winRate);
	const deltaWR = wrDuo - expectedWR;
	const sampleConfidence = clamp(0.35 + duoPairs.length * 0.03, 0.35, 0.92);

	const perMatch = {
		cs: {
			a: parseFloat((duoStatsA.csPerMin - ctxA.baseline.csPerMin).toFixed(2)),
			b: parseFloat((duoStatsB.csPerMin - ctxB.baseline.csPerMin).toFixed(2)),
		},
		deaths: {
			a: parseFloat(
				(ctxA.baseline.deaths - duoStatsA.deaths).toFixed(2),
			),
			b: parseFloat(
				(ctxB.baseline.deaths - duoStatsB.deaths).toFixed(2),
			),
		},
		objectives: {
			a: parseFloat(
				(duoStatsA.objectiveScore - ctxA.baseline.objectiveScore).toFixed(2),
			),
			b: parseFloat(
				(duoStatsB.objectiveScore - ctxB.baseline.objectiveScore).toFixed(2),
			),
		},
	};

	const tacticalMetrics = duoPairs.reduce(
		(acc, pair) => {
			const takedownsA = pair.a.kills + pair.a.assists;
			const takedownsB = pair.b.kills + pair.b.assists;
			const shared = Math.min(takedownsA, takedownsB);
			const total = Math.max(takedownsA + takedownsB, 1);
			acc.coKill += clamp((shared * 2) / total, 0, 1);

			const objA = objectiveScore(pair.a);
			const objB = objectiveScore(pair.b);
			acc.objectiveOverlap += clamp(
				Math.min(objA, objB) / Math.max(objA, objB, 0.1),
				0,
				1,
			);

			const highPressure =
				(pair.a.performance_score + pair.b.performance_score) / 2 >= 55;
			if (highPressure) {
				acc.leadOpportunities += 1;
				if (pair.a.result) {
					acc.leadConversions += 1;
				}
			}

			const minutesA = minutesPlayed(pair.a);
			const minutesB = minutesPlayed(pair.b);
			const roamGap = Math.abs(
				pair.a.vision_score / minutesA - pair.b.vision_score / minutesB,
			);
			acc.roamSyncSeconds += roamGap * 18;

			return acc;
		},
		{
			coKill: 0,
			objectiveOverlap: 0,
			leadConversions: 0,
			leadOpportunities: 0,
			roamSyncSeconds: 0,
		},
	);

	const coKill = tacticalMetrics.coKill / duoPairs.length;
	const objectiveOverlap = tacticalMetrics.objectiveOverlap / duoPairs.length;
	const leadConversion = tacticalMetrics.leadOpportunities
		? tacticalMetrics.leadConversions / tacticalMetrics.leadOpportunities
		: wrDuo;
	const roamSyncSeconds =
		tacticalMetrics.roamSyncSeconds / duoPairs.length;

	const similarity = cosineSimilarity(
		ctxA.profile.traitVector,
		ctxB.profile.traitVector,
	);
	const complementarity = clamp(1 - Math.abs(similarity - 0.65), 0.2, 1);
	const pairingStory = deriveStyleStory(
		ctxA.profile.traitTags,
		ctxB.profile.traitTags,
	);

	const fatigueDrop = computeFatigueDrop(duoPairs);

	const sortedPairs = chronologicalPairs(duoPairs);
	let winsAfterWin = 0;
	let afterWinOpportunities = 0;
	let winsAfterLoss = 0;
	let afterLossOpportunities = 0;

	for (let i = 1; i < sortedPairs.length; i += 1) {
		const prev = sortedPairs[i - 1];
		const current = sortedPairs[i];
		if (prev.a.result) {
			afterWinOpportunities += 1;
			if (current.a.result) winsAfterWin += 1;
		} else {
			afterLossOpportunities += 1;
			if (current.a.result) winsAfterLoss += 1;
		}
	}

	const afterWinWR = afterWinOpportunities
		? winsAfterWin / afterWinOpportunities
		: wrDuo;
	const afterLossWR = afterLossOpportunities
		? winsAfterLoss / afterLossOpportunities
		: wrDuo;
	const momentumFactor = afterWinOpportunities
		? winsAfterWin / afterWinOpportunities
		: wrDuo;
	const comebackRate = afterLossOpportunities
		? winsAfterLoss / afterLossOpportunities
		: wrDuo;

	const tiltPool = duoPairs.filter(
		(pair) =>
			pair.a.deaths >= ctxA.baseline.deaths + 2 ||
			pair.b.deaths >= ctxB.baseline.deaths + 2,
	);
	const tiltPropagation = tiltPool.length
		? tiltPool.filter((pair) => !pair.a.result).length / tiltPool.length
		: 0.35;

	const combos = buildCombos(duoPairs);
	let bestCombos = selectCombos(combos, "best");
	let worstCombos = selectCombos(combos, "worst");

	if (!bestCombos.length) {
		bestCombos = [
			{
				a: ctxA.profile.champions[0] || "Primary",
				b: ctxB.profile.champions[0] || "Partner",
				wr: wrDuo,
				games: duoPairs.length,
			},
		];
	}

	if (!worstCombos.length) {
		worstCombos = [
			{
				a: ctxA.profile.champions[1] || ctxA.profile.champions[0] || "Flex",
				b: ctxB.profile.champions[1] || ctxB.profile.champions[0] || "Flex",
				wr: wrDuo,
				games: Math.max(1, Math.floor(duoPairs.length / 2)),
			},
		];
	}

	const strengths: string[] = [];
	if (coKill >= 0.55) {
		strengths.push(
			`${Math.round(coKill * 100)}% co-kill overlap shows trust in every fight.`,
		);
	}
	if (leadConversion >= 0.6) {
		strengths.push(
			`${Math.round(leadConversion * 100)}% lead conversion keeps snowballs alive.`,
		);
	}
	if (perMatch.deaths.a > 0 || perMatch.deaths.b > 0) {
		strengths.push("Death count drops when you pair up — clean front-to-back plays.");
	}
	if (!strengths.length) {
		strengths.push("Solid fundamentals — your duo WR already outpaces solo expectations.");
	}

	let weakness = "Vision tempo dips after 20 minutes, so late objectives feel dark.";
	if (objectiveOverlap < 0.45) {
		weakness = "Objective overlap falls below 50%, so dragons slip through your fingers.";
	} else if (roamSyncSeconds > 4) {
		weakness = `Roam arrivals are ${roamSyncSeconds.toFixed(1)} seconds apart on average.`;
	} else if (perMatch.deaths.a < 0 && perMatch.deaths.b < 0) {
		weakness = "Deaths spike together once games go past 30 minutes.";
	}

	const goal =
		roamSyncSeconds > 4
			? `Sync recalls and pathing to shave ${Math.max(
					1,
					Math.round(roamSyncSeconds - 2),
				)} seconds off roam arrivals.`
			: "Drop one extra control ward per 10 minutes to keep objectives lit when defending leads.";

	const aiSummary = `You two already outperform expectations — ${strengths
		.slice(0, 2)
		.join(" ")} Weak spot: ${weakness} Goal: ${goal}`;

	const questionMetrics = {
		roamSyncSeconds,
		deltaWR,
		leadConversion,
		bestCombo: bestCombos[0],
		tiltPropagation,
		playerNames: [ctxA.profile.identity.short, ctxB.profile.identity.short] as [
			string,
			string,
		],
	};

	const commentary: Record<string, string> = {
		midFights: commentaryText("midFights", questionMetrics),
		closeGames: commentaryText("closeGames", questionMetrics),
		tilt: commentaryText("tilt", questionMetrics),
	};

	const disciplineScore = clamp(
		0.5 +
			Math.max(perMatch.deaths.a, perMatch.deaths.b) * 0.12 +
			leadConversion * 0.3,
		0,
		1,
	);

	const bondType = detectBondType(
		coKill,
		objectiveOverlap,
		disciplineScore,
		comebackRate,
	);

	const bondScore = Math.round(
		wrDuo * 100 * 0.35 +
			coKill * 100 * 0.2 +
			objectiveOverlap * 100 * 0.15 +
			leadConversion * 100 * 0.15 +
			(1 - tiltPropagation) * 100 * 0.15,
	);

	const sharedCurveNote = `You both drop ${Math.round(
		fatigueDrop * 100,
	)}% WR once the session hits five games — plan micro breaks or swap champs to reset focus.`;

	const data: DuoSynergyProfile = {
		playerA: ctxA.profile,
		playerB: ctxB.profile,
		rolePairLabel: `${toShortRole(ctxA.profile.role)}+${toShortRole(ctxB.profile.role)}`,
		statistical: {
			wrDuo,
			baselineWR: expectedWR,
			deltaWR,
			sampleConfidence,
			sampleSize: duoPairs.length,
			perMatch,
		},
		tactical: {
			coKill,
			objectiveOverlap,
			leadConversion,
			roamSyncSeconds: parseFloat(roamSyncSeconds.toFixed(1)),
		},
		style: {
			similarity,
			complementarity,
			pairingStory,
			tags: Array.from(new Set([...ctxA.profile.traitTags, ...ctxB.profile.traitTags])),
		},
		psychological: {
			fatigueDrop,
			sharedCurveNote,
			tiltPropagation,
			momentumFactor,
			afterWinWR,
			afterLossWR,
		},
		ai: {
			payload: {
				summary: {
					WR_duo: parseFloat(wrDuo.toFixed(2)),
					deltaWR: parseFloat(deltaWR.toFixed(2)),
					coKill: parseFloat(coKill.toFixed(2)),
					objTogether: parseFloat(objectiveOverlap.toFixed(2)),
					convRate: parseFloat(leadConversion.toFixed(2)),
					comeback: parseFloat(comebackRate.toFixed(2)),
				},
				rolePair: `${toShortRole(ctxA.profile.role)}+${toShortRole(ctxB.profile.role)}`,
				bestChamps: bestCombos,
				worstChamps: worstCombos,
			},
			summary: aiSummary,
			nextMatchAdvice: `Next Match Advice: lock in ${bestCombos[0].a} + ${bestCombos[0].b} (${Math.round(
				bestCombos[0].wr * 100,
			)}% WR). Avoid ${worstCombos[0].a} + ${worstCombos[0].b} until you steady the tempo.`,
			bestCombos,
			worstCombos,
			commentary,
			comebackRate,
		},
		bond: {
			score: bondScore,
			type: bondType,
			label: BOND_ARCHETYPES[bondType].label,
			nickname: BOND_ARCHETYPES[bondType].nickname,
			description: BOND_ARCHETYPES[bondType].description,
			aura: BOND_ARCHETYPES[bondType].aura,
			triangle: {
				mechanics: clamp((deltaWR + 0.1) / 0.2, 0, 1),
				coordination: clamp(coKill * 0.6 + objectiveOverlap * 0.4, 0, 1),
				discipline: disciplineScore,
			},
		},
	};

	return data;
}

/**
 * Mock duo synergy data for demo purposes
 * Demo accounts: Racchanvris#VN8 and hhjj4#6983
 */
export function getMockDuoSynergy(
	playerAInput: DuoPlayerInput,
	playerBInput: DuoPlayerInput,
): DuoSynergyProfile {
	const mockPlayerA: DuoPlayerProfile = {
		identity: {
			raw: `${playerAInput.riotId}#${playerAInput.tagLine}`,
			gameName: playerAInput.riotId,
			tagLine: playerAInput.tagLine,
			display: `${playerAInput.riotId}#${playerAInput.tagLine}`,
			short: playerAInput.riotId.substring(0, 8),
		},
		role: "MID",
		champions: ["Ahri", "Syndra", "Orianna"],
		soloWinRate: 0.52,
		csPerMin: 7.8,
		deathsPerGame: 3.2,
		objectiveRate: 0.48,
		aggression: 65,
		roamTempo: 72,
		controlScore: 58,
		traitVector: [0.45, 0.75, 0.62, 0.58, 0.71],
		traitTags: ["Mage", "Burst", "Control"],
		fatigueSlope: -0.08,
		tiltSensitivity: 0.42,
		tiltResilience: 0.68,
		styleLean: "inferno",
		region: playerAInput.region || "sea",
	};

	const mockPlayerB: DuoPlayerProfile = {
		identity: {
			raw: `${playerBInput.riotId}#${playerBInput.tagLine}`,
			gameName: playerBInput.riotId,
			tagLine: playerBInput.tagLine,
			display: `${playerBInput.riotId}#${playerBInput.tagLine}`,
			short: playerBInput.riotId.substring(0, 8),
		},
		role: "JUNGLE",
		champions: ["Lee Sin", "Jarvan IV", "Elise"],
		soloWinRate: 0.49,
		csPerMin: 5.2,
		deathsPerGame: 4.1,
		objectiveRate: 0.55,
		aggression: 78,
		roamTempo: 85,
		controlScore: 62,
		traitVector: [0.38, 0.82, 0.45, 0.52, 0.88],
		traitTags: ["Fighter", "Diver", "Early Game"],
		fatigueSlope: -0.12,
		tiltSensitivity: 0.55,
		tiltResilience: 0.52,
		styleLean: "inferno",
		region: playerBInput.region || "sea",
	};

	return {
		playerA: mockPlayerA,
		playerB: mockPlayerB,
		rolePairLabel: "MID + JUNGLE",
		statistical: {
			wrDuo: 0.58,
			baselineWR: 0.505,
			deltaWR: 0.075,
			sampleConfidence: 0.82,
			sampleSize: 47,
			perMatch: {
				cs: { a: 12.5, b: -3.2 },
				deaths: { a: -0.8, b: -1.2 },
				objectives: { a: 0.45, b: 0.52 },
			},
		},
		tactical: {
			coKill: 0.68,
			objectiveOverlap: 0.72,
			leadConversion: 0.64,
			roamSyncSeconds: 2.8,
		},
		style: {
			similarity: 0.42,
			complementarity: 0.78,
			pairingStory:
				"Your mage control pairs perfectly with aggressive jungle pressure. Ahri + Lee Sin is your bread and butter — charm setups into kicks create unwinnable skirmishes.",
			tags: ["Burst", "Dive", "Pick", "Tempo"],
		},
		psychological: {
			fatigueDrop: 0.09,
			sharedCurveNote:
				"Both of you drop 9% WR after 5 consecutive games — sync your breaks.",
			tiltPropagation: 0.38,
			momentumFactor: 0.72,
			afterWinWR: 0.64,
			afterLossWR: 0.42,
		},
		ai: {
			payload: {
				summary: {
					WR_duo: 0.58,
					deltaWR: 0.075,
					coKill: 0.68,
					objTogether: 0.72,
					convRate: 0.64,
					comeback: 0.35,
				},
				rolePair: "MID+JG",
				bestChamps: [
					{ a: "Ahri", b: "Lee Sin", wr: 0.71, games: 14 },
					{ a: "Syndra", b: "Jarvan IV", wr: 0.67, games: 9 },
					{ a: "Orianna", b: "Lee Sin", wr: 0.63, games: 8 },
				],
				worstChamps: [
					{ a: "Orianna", b: "Elise", wr: 0.33, games: 6 },
					{ a: "Ahri", b: "Elise", wr: 0.40, games: 5 },
					{ a: "Syndra", b: "Lee Sin", wr: 0.43, games: 7 },
				],
			},
			summary:
				"You two already outperform expectations — CS efficiency jumps when paired, death count drops. Weak spot: Vision tempo dips after 20 minutes. Goal: Drop one extra control ward per 10 minutes to keep objectives lit.",
			nextMatchAdvice:
				"Next Match Advice: lock in Ahri + Lee Sin (71% WR). Avoid Orianna + Elise until you steady the tempo.",
			bestCombos: [
				{ a: "Ahri", b: "Lee Sin", wr: 0.71, games: 14 },
				{ a: "Syndra", b: "Jarvan IV", wr: 0.67, games: 9 },
				{ a: "Orianna", b: "Lee Sin", wr: 0.63, games: 8 },
			],
			worstCombos: [
				{ a: "Orianna", b: "Elise", wr: 0.33, games: 6 },
				{ a: "Ahri", b: "Elise", wr: 0.40, games: 5 },
				{ a: "Syndra", b: "Lee Sin", wr: 0.43, games: 7 },
			],
			commentary: {
				midFights:
					"Your mid-game fights win because Lee's ward-hop kick chains with Ahri charm — but you arrive 2.8s apart on average. Sync roam timers tighter (ping recalls simultaneously) and you'll spike that 68% co-kill rate even higher. When one of you is split pushing, the other needs vision 10 seconds earlier.",
				closeGames:
					"You're at 64% lead conversion, which is solid but not elite. The pattern: after securing first baron, you wait too long to force the next objective. Goal: first baron → immediately set up vision for soul/elder within 90 seconds. Don't reset unless someone is genuinely low — your duo tempo thrives on continuous pressure.",
				tilt:
					"38% tilt propagation means when one of you ints, the other's mental wobbles. Counter-strategy: after a bad death, the alive player should hard-focus on farming/vision for 60 seconds instead of forcing a revenge play. Your after-loss WR is 42% but after-win is 64% — ride win streaks, pause after two losses.",
			},
			comebackRate: 0.35,
		},
		bond: {
			score: 76,
			type: "inferno",
			label: "Inferno Bond",
			nickname: "The Blood Brothers",
			description: "Hyper-kill synergy, terrifying engages.",
			aura: "from-orange-500/20 via-red-500/10 to-transparent",
			triangle: {
				mechanics: 0.875,
				coordination: 0.70,
				discipline: 0.68,
			},
		},
	};
}
