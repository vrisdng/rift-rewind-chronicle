import type { ChampionStats, PlayerStats } from "@/lib/api";

const ROLE_ORDER = ["Top", "Jungle", "Mid", "Bot", "Support"] as const;
type ChampionRole = (typeof ROLE_ORDER)[number];

const RESOURCE_TYPES = ["Mana", "Energy", "Fury", "Grit", "Manaless", "Health", "None"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

const DAMAGE_TYPES = ["Physical", "Magic", "Mixed"] as const;
type DamageType = (typeof DAMAGE_TYPES)[number];

export interface ChampionStaticProfile {
	role: ChampionRole;
	range: "Melee" | "Ranged";
	resource: ResourceType;
	damageType: DamageType;
	complexity: number; // 1-10
	tags: string[];
	playPattern: "Burst" | "Control" | "Skirmisher" | "Juggernaut" | "Artillery" | "Enchanter" | "Duelist" | "Specialist";
}

export interface ChampionMapNode {
	id: string;
	name: string;
	games: number;
	winRate: number;
	avgKDA: number;
	avgCSPerMin: number;
	damageShare: number;
	metadata: ChampionStaticProfile;
	aggressionScore: number;
	averageGameLength: number;
	winRateZ: number;
	vector: number[];
	position: { x: number; y: number };
	clusterId?: string;
	offMetaScore: number;
}

export interface ChampionLink {
	source: string;
	target: string;
	similarity: number;
	sharedTraits: string[];
}

export interface ChampionClusterSummary {
	id: string;
	theme: string;
	champions: string[];
	role: ChampionRole;
	winRate: number;
	gameShare: number;
	color: string;
}

export interface ChampionMapInsights {
	dominantClusterShare: number;
	diversityIndex: number;
	experimentationRate: number;
	outlierCount: number;
	centerRole: ChampionRole;
}

export interface ChampionMapResult {
	nodes: ChampionMapNode[];
	links: ChampionLink[];
	centroid: { x: number; y: number };
	outliers: ChampionMapNode[];
	clusters: ChampionClusterSummary[];
	insights: ChampionMapInsights;
	clusterPayload: {
		clusters: Array<Pick<ChampionClusterSummary, "theme" | "champions" | "winRate">>;
		outliers: string[];
	};
	coachSummary: string;
}

interface BuildOptions {
	averageGameDuration?: number;
	minGames?: number;
	width?: number;
	height?: number;
}

interface ChampionFeatureInput {
	name: string;
	games: number;
	winRate: number;
	avgKills: number;
	avgDeaths: number;
	avgAssists: number;
	avgCS: number;
	avgDamage?: number;
}

const DEFAULT_OPTIONS: Required<Pick<BuildOptions, "averageGameDuration" | "minGames" | "width" | "height">> = {
	averageGameDuration: 31,
	minGames: 4,
	width: 960,
	height: 560,
};

const ROLE_COLORS: Record<ChampionRole, string> = {
	Top: "#f97316",
	Jungle: "#22d3ee",
	Mid: "#6366f1",
	Bot: "#facc15",
	Support: "#34d399",
};

const CHAMPION_STATIC_DATA: Record<string, ChampionStaticProfile> = {
	Ahri: {
		role: "Mid",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 5,
		tags: ["Mage", "Burst", "Charm"],
		playPattern: "Control",
	},
	Akali: {
		role: "Mid",
		range: "Melee",
		resource: "Energy",
		damageType: "Mixed",
		complexity: 8,
		tags: ["Assassin", "Skirmisher"],
		playPattern: "Burst",
	},
	Ekko: {
		role: "Mid",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 7,
		tags: ["Assassin", "Diver"],
		playPattern: "Skirmisher",
	},
	Katarina: {
		role: "Mid",
		range: "Melee",
		resource: "None",
		damageType: "Magic",
		complexity: 9,
		tags: ["Assassin", "Reset"],
		playPattern: "Burst",
	},
	Lux: {
		role: "Mid",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 4,
		tags: ["Mage", "Artillery"],
		playPattern: "Artillery",
	},
	Orianna: {
		role: "Mid",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 6,
		tags: ["Mage", "Control"],
		playPattern: "Control",
	},
	Syndra: {
		role: "Mid",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 7,
		tags: ["Mage", "Burst"],
		playPattern: "Control",
	},
	Zed: {
		role: "Mid",
		range: "Melee",
		resource: "Energy",
		damageType: "Physical",
		complexity: 8,
		tags: ["Assassin"],
		playPattern: "Burst",
	},
	Yone: {
		role: "Mid",
		range: "Melee",
		resource: "None",
		damageType: "Mixed",
		complexity: 7,
		tags: ["Skirmisher", "Reset"],
		playPattern: "Duelist",
	},
	Garen: {
		role: "Top",
		range: "Melee",
		resource: "None",
		damageType: "Physical",
		complexity: 2,
		tags: ["Juggernaut"],
		playPattern: "Juggernaut",
	},
	Darius: {
		role: "Top",
		range: "Melee",
		resource: "Mana",
		damageType: "Physical",
		complexity: 5,
		tags: ["Juggernaut"],
		playPattern: "Juggernaut",
	},
	Fiora: {
		role: "Top",
		range: "Melee",
		resource: "Mana",
		damageType: "Physical",
		complexity: 7,
		tags: ["Duelist"],
		playPattern: "Duelist",
	},
	Fizz: {
		role: "Mid",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 6,
		tags: ["Assassin"],
		playPattern: "Burst",
	},
	Singed: {
		role: "Top",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 6,
		tags: ["Specialist"],
		playPattern: "Specialist",
	},
	Teemo: {
		role: "Top",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 4,
		tags: ["Specialist", "Artillery"],
		playPattern: "Artillery",
	},
	LeeSin: {
		role: "Jungle",
		range: "Melee",
		resource: "Energy",
		damageType: "Physical",
		complexity: 8,
		tags: ["Diver", "Skirmisher"],
		playPattern: "Skirmisher",
	},
	Viego: {
		role: "Jungle",
		range: "Melee",
		resource: "Mana",
		damageType: "Physical",
		complexity: 7,
		tags: ["Assassin", "Skirmisher"],
		playPattern: "Skirmisher",
	},
	Lillia: {
		role: "Jungle",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 7,
		tags: ["Skirmisher"],
		playPattern: "Skirmisher",
	},
	Jinx: {
		role: "Bot",
		range: "Ranged",
		resource: "Mana",
		damageType: "Physical",
		complexity: 3,
		tags: ["Marksman"],
		playPattern: "Artillery",
	},
	Aphelios: {
		role: "Bot",
		range: "Ranged",
		resource: "Mana",
		damageType: "Physical",
		complexity: 9,
		tags: ["Marksman"],
		playPattern: "Artillery",
	},
	Draven: {
		role: "Bot",
		range: "Ranged",
		resource: "Mana",
		damageType: "Physical",
		complexity: 6,
		tags: ["Marksman"],
		playPattern: "Duelist",
	},
	Samira: {
		role: "Bot",
		range: "Ranged",
		resource: "Mana",
		damageType: "Physical",
		complexity: 6,
		tags: ["Marksman", "Diver"],
		playPattern: "Skirmisher",
	},
	Lulu: {
		role: "Support",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 3,
		tags: ["Enchanter"],
		playPattern: "Enchanter",
	},
	Karma: {
		role: "Support",
		range: "Ranged",
		resource: "Mana",
		damageType: "Magic",
		complexity: 5,
		tags: ["Enchanter"],
		playPattern: "Control",
	},
	Thresh: {
		role: "Support",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 7,
		tags: ["Catcher", "Tank"],
		playPattern: "Control",
	},
	Nautilus: {
		role: "Support",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 4,
		tags: ["Tank", "Catcher"],
		playPattern: "Control",
	},
	Rakan: {
		role: "Support",
		range: "Melee",
		resource: "Mana",
		damageType: "Magic",
		complexity: 6,
		tags: ["Enchanter", "Diver"],
		playPattern: "Skirmisher",
	},
};

const DEFAULT_PROFILE: ChampionStaticProfile = {
	role: "Mid",
	range: "Ranged",
	resource: "Mana",
	damageType: "Magic",
	complexity: 5,
	tags: ["Mage"],
	playPattern: "Control",
};

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

const magnitude = (vector: number[]) =>
	Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

const cosineSimilarity = (a: number[], b: number[]) => {
	const magA = magnitude(a);
	const magB = magnitude(b);
	if (!magA || !magB) return 0;
	const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
	return dot / (magA * magB);
};

const zScore = (value: number, mean: number, stdDev: number) => {
	if (!stdDev) return 0;
	return (value - mean) / stdDev;
};

const computeAggressionScore = (kills: number, deaths: number, assists: number) => {
	const raw = ((kills * 2 + assists) / Math.max(1, deaths)) * 1.25;
	return clamp(raw, 0, 10);
};

const makeFeatureVector = (
	input: ChampionFeatureInput,
	meta: ChampionStaticProfile,
	gameLength: number,
	winRateZ: number,
) => {
	const roleVector = ROLE_ORDER.map((role) => (meta.role === role ? 1 : 0));
	const rangeBinary = meta.range === "Ranged" ? 1 : 0;
	const resourceVector = RESOURCE_TYPES.map((resource) =>
		meta.resource === resource ? 1 : 0,
	);
	const damageVector = DAMAGE_TYPES.map((type) =>
		meta.damageType === type ? 1 : 0,
	);
	const aggression = computeAggressionScore(
		input.avgKills,
		input.avgDeaths,
		input.avgAssists,
	);
	return [
		...roleVector,
		rangeBinary,
		...resourceVector,
		...damageVector,
		meta.complexity / 10,
		aggression / 10,
		gameLength / 40,
		winRateZ / 3,
	];
};

const similarityToTraits = (
	a: ChampionStaticProfile,
	b: ChampionStaticProfile,
): string[] => {
	const traits: string[] = [];
	if (a.role === b.role) traits.push(a.role);
	if (a.damageType === b.damageType) traits.push(`${a.damageType} damage`);
	if (a.resource === b.resource) traits.push(`${a.resource} users`);
	if (a.range === b.range) traits.push(a.range === "Ranged" ? "Artillery" : "Melee core");
	if (a.playPattern === b.playPattern) traits.push(a.playPattern);
	const sharedTags = a.tags.filter((tag) => b.tags.includes(tag));
	if (sharedTags.length) traits.push(...sharedTags.slice(0, 2));
	return traits.slice(0, 3);
};

const forceLayout = (
	nodes: ChampionMapNode[],
	links: ChampionLink[],
	width: number,
	height: number,
) => {
	const iterations = 220;
	const repulsion = 3600;
	const attraction = 0.05;
	const damping = 0.9;
	const centerX = width / 2;
	const centerY = height / 2;
	const velocity = new Map<string, { vx: number; vy: number }>();

	nodes.forEach((node, idx) => {
		const angle = (idx / nodes.length) * Math.PI * 2;
		node.position = {
			x: centerX + Math.cos(angle) * (width / 4),
			y: centerY + Math.sin(angle) * (height / 4),
		};
		velocity.set(node.id, { vx: 0, vy: 0 });
	});

	for (let i = 0; i < iterations; i += 1) {
		// Repulsion
		for (let a = 0; a < nodes.length; a += 1) {
			for (let b = a + 1; b < nodes.length; b += 1) {
				const nodeA = nodes[a];
				const nodeB = nodes[b];
				const dx = nodeA.position.x - nodeB.position.x;
				const dy = nodeA.position.y - nodeB.position.y;
				let distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
				const force = (repulsion * (nodeA.games + nodeB.games)) / (distance * distance);
				const fx = (force * dx) / distance;
				const fy = (force * dy) / distance;
				const va = velocity.get(nodeA.id)!;
				const vb = velocity.get(nodeB.id)!;
				va.vx += fx / nodeA.games;
				va.vy += fy / nodeA.games;
				vb.vx -= fx / nodeB.games;
				vb.vy -= fy / nodeB.games;
			}
		}

		// Attraction
		for (const link of links) {
			const source = nodes.find((node) => node.id === link.source);
			const target = nodes.find((node) => node.id === link.target);
			if (!source || !target) continue;
			const dx = target.position.x - source.position.x;
			const dy = target.position.y - source.position.y;
			const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
			const desire = (distance - 120) * attraction * link.similarity;
			const fx = (desire * dx) / distance;
			const fy = (desire * dy) / distance;
			const vs = velocity.get(source.id)!;
			const vt = velocity.get(target.id)!;
			vs.vx += fx / source.games;
			vs.vy += fy / source.games;
			vt.vx -= fx / target.games;
			vt.vy -= fy / target.games;
		}

		nodes.forEach((node) => {
			const vel = velocity.get(node.id)!;
			node.position.x = clamp(
				node.position.x + vel.vx,
				40,
				width - 40,
			);
			node.position.y = clamp(
				node.position.y + vel.vy,
				40,
				height - 40,
			);
			vel.vx *= damping;
			vel.vy *= damping;
		});
	}
};

const kMeans = (vectors: number[][], k: number, maxIterations = 30): number[] => {
	if (vectors.length === 0) return [];
	const assignments = new Array(vectors.length).fill(0);
	const centroids = vectors.slice(0, k).map((vector) => vector.slice());

	const distance = (a: number[], b: number[]) =>
		Math.sqrt(a.reduce((sum, val, idx) => sum + (val - b[idx]) ** 2, 0));

	for (let iteration = 0; iteration < maxIterations; iteration += 1) {
		// Assign
		for (let i = 0; i < vectors.length; i += 1) {
			let best = 0;
			let bestDistance = Number.POSITIVE_INFINITY;
			for (let c = 0; c < centroids.length; c += 1) {
				const d = distance(vectors[i], centroids[c]);
				if (d < bestDistance) {
					bestDistance = d;
					best = c;
				}
			}
			assignments[i] = best;
		}

		// Update centroids
		const sums = Array.from({ length: centroids.length }, () =>
			new Array(vectors[0].length).fill(0),
		);
		const counts = new Array(centroids.length).fill(0);
		for (let i = 0; i < vectors.length; i += 1) {
			const cluster = assignments[i];
			const vector = vectors[i];
			for (let d = 0; d < vector.length; d += 1) {
				sums[cluster][d] += vector[d];
			}
			counts[cluster] += 1;
		}
		for (let c = 0; c < centroids.length; c += 1) {
			if (counts[c] === 0) continue;
			for (let d = 0; d < centroids[c].length; d += 1) {
				centroids[c][d] = sums[c][d] / counts[c];
			}
		}
	}

	return assignments;
};

const describeCluster = (champions: ChampionMapNode[]): string => {
	const roleCounts = new Map<ChampionRole, number>();
	const tagCounts = new Map<string, number>();
	const playPatternCounts = new Map<string, number>();

	champions.forEach((champ) => {
		const { metadata } = champ;
		roleCounts.set(metadata.role, (roleCounts.get(metadata.role) || 0) + champ.games);
		metadata.tags.forEach((tag) => {
			tagCounts.set(tag, (tagCounts.get(tag) || 0) + champ.games);
		});
		playPatternCounts.set(
			metadata.playPattern,
			(playPatternCounts.get(metadata.playPattern) || 0) + champ.games,
		);
	});

	const sortedRoles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]);
	const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
	const sortedPatterns = [...playPatternCounts.entries()].sort((a, b) => b[1] - a[1]);

	const primaryRole = sortedRoles[0]?.[0] ?? "Mid";
	const primaryTag = sortedTags[0]?.[0] ?? "";
	const pattern = sortedPatterns[0]?.[0] ?? "";

	if (primaryTag && pattern) {
		return `${pattern} ${primaryTag}s`;
	}
	if (primaryTag) {
		return `${primaryTag} Specialists`;
	}
	return `${primaryRole} Cohort`;
};

const computeDiversityIndex = (nodes: ChampionMapNode[]) => {
	const totalGames = nodes.reduce((sum, node) => sum + node.games, 0);
	if (!totalGames) return 0;
	const entropy = nodes.reduce((sum, node) => {
		const p = node.games / totalGames;
		return sum - p * Math.log2(p || 1);
	}, 0);
	const maxEntropy = Math.log2(nodes.length || 1);
	return maxEntropy ? entropy / maxEntropy : 0;
};

const computeOutliers = (nodes: ChampionMapNode[], centroid: { x: number; y: number }) => {
	const distances = nodes.map((node) => {
		const dx = node.position.x - centroid.x;
		const dy = node.position.y - centroid.y;
		return Math.sqrt(dx * dx + dy * dy);
	});
	const mean =
		distances.reduce((sum, value) => sum + value, 0) / (distances.length || 1);
	const variance =
		distances.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
		(distances.length || 1);
	const stdDev = Math.sqrt(variance);
	return nodes.filter((node, idx) => distances[idx] > mean + stdDev * 0.9);
};

const buildCoachSummary = (
	clusters: ChampionClusterSummary[],
	insights: ChampionMapInsights,
	outliers: ChampionMapNode[],
) => {
	if (!clusters.length) return "We need at least one cluster to explain your DNA.";
	const primary = clusters[0];
	const secondary = clusters[1];
	const dominantShare = Math.round(insights.dominantClusterShare * 100);
	const diversity = Math.round(insights.diversityIndex * 100);
	const experimentation = Math.round(insights.experimentationRate * 100);

	let summary = `Your DNA orbits around ${primary.theme} (${dominantShare}% of your games). `;
	if (secondary) {
		summary += `You pivot into ${secondary.theme} when drafts demand it, adding a ${secondary.role} flavor to your pool. `;
	}
	summary += `Diversity index at ${diversity}% shows ${
		diversity > 55 ? "broad curiosity" : "a honed comfort zone"
	}.`;
	if (experimentation > 0) {
		summary += ` Experimentation rate of ${experimentation}% keeps your opponents guessing.`;
	}
	if (outliers.length) {
		const names = outliers.slice(0, 3).map((node) => node.name).join(", ");
		summary += ` Off-meta probes like ${names} form your experiment zone—deploy when you need chaos injection.`;
	}
	return summary;
};

const getStaticProfile = (championName: string): ChampionStaticProfile => {
	return CHAMPION_STATIC_DATA[championName] || DEFAULT_PROFILE;
};

const computeCenter = (nodes: ChampionMapNode[]) => {
	const totalWeight = nodes.reduce((sum, node) => sum + node.games, 0) || 1;
	const x =
		nodes.reduce((sum, node) => sum + node.position.x * node.games, 0) /
		totalWeight;
	const y =
		nodes.reduce((sum, node) => sum + node.position.y * node.games, 0) /
		totalWeight;
	return { x, y };
};

const buildClusterPayload = (clusters: ChampionClusterSummary[], outliers: ChampionMapNode[]) => ({
	clusters: clusters.slice(0, 4).map((cluster) => ({
		theme: cluster.theme,
		champions: cluster.champions,
		winRate: Number(cluster.winRate.toFixed(2)),
	})),
	outliers: outliers.map((node) => node.name),
});

const roleAtCenter = (nodes: ChampionMapNode[], centroid: { x: number; y: number }): ChampionRole => {
	if (!nodes.length) return "Mid";
	const closest = [...nodes].sort((a, b) => {
		const da =
			(a.position.x - centroid.x) ** 2 + (a.position.y - centroid.y) ** 2;
		const db =
			(b.position.x - centroid.x) ** 2 + (b.position.y - centroid.y) ** 2;
		return da - db;
	})[0];
	return closest?.metadata.role ?? "Mid";
};

const preprocessChampions = (
	champions: ChampionFeatureInput[],
	options?: BuildOptions,
): ChampionMapNode[] => {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
	const filtered = champions.filter((champ) => champ.games >= mergedOptions.minGames);
	if (!filtered.length) {
		return [];
	}
	const avgGameDuration = mergedOptions.averageGameDuration || DEFAULT_OPTIONS.averageGameDuration;
	const totalDamage = filtered.reduce((sum, champ) => sum + (champ.avgDamage || 0), 0) || 1;
	const winRates = filtered.map((champ) => champ.winRate);
	const mean =
		winRates.reduce((sum, wr) => sum + wr, 0) / (winRates.length || 1);
	const variance =
		winRates.reduce((sum, wr) => sum + (wr - mean) ** 2, 0) /
		(winRates.length || 1);
	const stdDev = Math.sqrt(variance);

	const nodes = filtered.map<ChampionMapNode>((champ) => {
		const metadata = getStaticProfile(champ.name);
		const avgKDA =
			(champ.avgKills + champ.avgAssists) / Math.max(1, champ.avgDeaths);
		const avgCSPerMin = champ.avgCS / Math.max(1, avgGameDuration);
		const damageShare = (champ.avgDamage || 0) / totalDamage;
		const winRateZ = zScore(champ.winRate, mean, stdDev);
		const vector = makeFeatureVector(
			champ,
			metadata,
			avgGameDuration,
			winRateZ,
		);
		return {
			id: champ.name,
			name: champ.name,
			games: champ.games,
			winRate: champ.winRate,
			avgKDA,
			avgCSPerMin,
			damageShare,
			metadata,
			aggressionScore: computeAggressionScore(
				champ.avgKills,
				champ.avgDeaths,
				champ.avgAssists,
			),
			averageGameLength: avgGameDuration,
			winRateZ,
			vector,
			position: { x: 0, y: 0 },
			offMetaScore: 0,
		};
	});

	return nodes;
};

export const buildChampionMap = (
	championStats: ChampionStats[],
	options?: BuildOptions,
): ChampionMapResult => {
	const nodes = preprocessChampions(
		championStats.map((champ) => ({
			name: champ.championName,
			games: champ.games,
			winRate: champ.winRate,
			avgKills: champ.avgKills,
			avgDeaths: champ.avgDeaths,
			avgAssists: champ.avgAssists,
			avgCS: champ.avgCS,
			avgDamage: champ.avgDamage,
		})),
		options,
	);

	const mergedOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };

	if (!nodes.length) {
		return {
			nodes: [],
			links: [],
			centroid: { x: mergedOptions.width / 2, y: mergedOptions.height / 2 },
			outliers: [],
			clusters: [],
			insights: {
				dominantClusterShare: 0,
				diversityIndex: 0,
				experimentationRate: 0,
				outlierCount: 0,
				centerRole: "Mid",
			},
			clusterPayload: { clusters: [], outliers: [] },
			coachSummary: "Add more champions (5+ games) to unlock your DNA map.",
		};
	}

	const links: ChampionLink[] = [];
	for (let i = 0; i < nodes.length; i += 1) {
		for (let j = i + 1; j < nodes.length; j += 1) {
			const similarity = cosineSimilarity(nodes[i].vector, nodes[j].vector);
			if (similarity > 0.4) {
				links.push({
					source: nodes[i].id,
					target: nodes[j].id,
					similarity,
					sharedTraits: similarityToTraits(
						nodes[i].metadata,
						nodes[j].metadata,
					),
				});
			}
		}
	}

	forceLayout(nodes, links, mergedOptions.width, mergedOptions.height);

	const centroid = computeCenter(nodes);
	const outliers = computeOutliers(nodes, centroid);
	const offMetaNames = new Set(outliers.map((node) => node.id));
	nodes.forEach((node) => {
		node.offMetaScore = offMetaNames.has(node.id) ? 1 : 0;
	});

	const clusterCount = Math.min(
		4,
		Math.max(2, Math.round(nodes.length / 3)),
	);
	const assignments = kMeans(
		nodes.map((node) => node.vector),
		clusterCount,
	);

	const clustersMap = new Map<number, ChampionMapNode[]>();
	assignments.forEach((clusterIdx, idx) => {
		const bucket = clustersMap.get(clusterIdx) || [];
		bucket.push(nodes[idx]);
		nodes[idx].clusterId = `cluster-${clusterIdx}`;
		clustersMap.set(clusterIdx, bucket);
	});

	const clusters: ChampionClusterSummary[] = [...clustersMap.entries()]
		.map(([clusterIdx, champions]) => {
			const totalGames = champions.reduce((sum, champ) => sum + champ.games, 0);
			const winRate =
				champions.reduce((sum, champ) => sum + champ.winRate * champ.games, 0) /
				(totalGames || 1);
			const roleTotals = champions.reduce<Record<ChampionRole, number>>((acc, champ) => {
				const role = champ.metadata.role;
				acc[role] = (acc[role] || 0) + champ.games;
				return acc;
			}, {} as Record<ChampionRole, number>);
			const topRole =
				(Object.entries(roleTotals).sort((a, b) => b[1] - a[1])[0]?.[0] as ChampionRole) ||
				"Mid";
			return {
				id: `cluster-${clusterIdx}`,
				theme: describeCluster(champions),
				champions: champions.map((champ) => champ.name),
				role: topRole,
				winRate,
				gameShare: totalGames,
				color: ROLE_COLORS[topRole] || "#FFFFFF",
			};
		})
		.sort((a, b) => b.gameShare - a.gameShare)
		.map((cluster) => ({
			...cluster,
			gameShare: cluster.gameShare / nodes.reduce((sum, node) => sum + node.games, 0),
		}));

	const insights: ChampionMapInsights = {
		dominantClusterShare: clusters[0]?.gameShare || 0,
		diversityIndex: computeDiversityIndex(nodes),
		experimentationRate:
			outliers.reduce((sum, node) => sum + node.games, 0) /
			(nodes.reduce((sum, node) => sum + node.games, 0) || 1),
		outlierCount: outliers.length,
		centerRole: roleAtCenter(nodes, centroid),
	};

	const clusterPayload = buildClusterPayload(clusters, outliers);
	const coachSummary = buildCoachSummary(clusters, insights, outliers);

	return {
		nodes,
		links,
		centroid,
		outliers,
		clusters,
		insights,
		clusterPayload,
		coachSummary,
	};
};

export const buildChampionMapFromPlayer = (playerData: PlayerStats): ChampionMapResult => {
	return buildChampionMap(playerData.topChampions, {
		averageGameDuration: playerData.avgGameDuration || DEFAULT_OPTIONS.averageGameDuration,
	});
};

export const getRoleColor = (role: ChampionRole) => ROLE_COLORS[role] || "#94a3b8";
