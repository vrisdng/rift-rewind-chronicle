import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ChampionStats, ElementName, PlayerStats } from "@/lib/api";
import {
	buildChampionMap,
	getRoleColor,
	type ChampionLink,
	type ChampionMapNode,
	type ChampionMapResult,
} from "@/lib/champion-map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Chatbot from "@/components/ui/chatbot";
import {
	Activity,
	ArrowLeft,
	Compass,
	Copy,
	Info,
	Sparkles,
	Target,
	Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ColorMode = "winRate" | "kda";

interface ElementPalette {
	name: string;
	hex: string;
	background: string;
	label: string;
}

const ELEMENT_TINTS: Record<ElementName | "Default", ElementPalette> = {
	Inferno: {
		name: "Inferno",
		hex: "#fb923c",
		background: "radial-gradient(circle at top, rgba(251,146,60,0.35), transparent 55%)",
		label: "Inferno tint = aggressive plays spike node warmth.",
	},
	Tide: {
		name: "Tide",
		hex: "#38bdf8",
		background: "radial-gradient(circle at top, rgba(56,189,248,0.35), transparent 55%)",
		label: "Tide tint = smooth, control-oriented rhythm.",
	},
	Gale: {
		name: "Gale",
		hex: "#86efac",
		background: "radial-gradient(circle at top, rgba(134,239,172,0.35), transparent 55%)",
		label: "Gale tint = adaptive, roaming instincts.",
	},
	Terra: {
		name: "Terra",
		hex: "#a3e635",
		background: "radial-gradient(circle at top, rgba(163,230,53,0.35), transparent 55%)",
		label: "Terra tint = stability and macro patience.",
	},
	Void: {
		name: "Void",
		hex: "#c084fc",
		background: "radial-gradient(circle at top, rgba(192,132,252,0.35), transparent 55%)",
		label: "Void tint = creative, high-variance drafts.",
	},
	Default: {
		name: "Adaptive",
		hex: "#818cf8",
		background: "radial-gradient(circle at top, rgba(129,140,248,0.32), transparent 55%)",
		label: "Adaptive tint = baseline spectrum.",
	},
};

const SAMPLE_CHAMPIONS: ChampionStats[] = [
	{
		championName: "Ahri",
		championId: 103,
		games: 62,
		wins: 36,
		winRate: 58.1,
		avgKills: 7.2,
		avgDeaths: 3.1,
		avgAssists: 7.4,
		avgCS: 205,
		avgDamage: 23000,
	},
	{
		championName: "Orianna",
		championId: 61,
		games: 34,
		wins: 20,
		winRate: 58.8,
		avgKills: 5.8,
		avgDeaths: 2.9,
		avgAssists: 9.1,
		avgCS: 210,
		avgDamage: 24000,
	},
	{
		championName: "Lux",
		championId: 99,
		games: 27,
		wins: 15,
		winRate: 55.6,
		avgKills: 6.7,
		avgDeaths: 3.4,
		avgAssists: 10.1,
		avgCS: 188,
		avgDamage: 21500,
	},
	{
		championName: "Ekko",
		championId: 245,
		games: 24,
		wins: 13,
		winRate: 54.2,
		avgKills: 8.4,
		avgDeaths: 4.2,
		avgAssists: 6.8,
		avgCS: 174,
		avgDamage: 20500,
	},
	{
		championName: "Katarina",
		championId: 55,
		games: 19,
		wins: 10,
		winRate: 52.6,
		avgKills: 9.2,
		avgDeaths: 5.1,
		avgAssists: 5.4,
		avgCS: 165,
		avgDamage: 19800,
	},
	{
		championName: "Zed",
		championId: 238,
		games: 14,
		wins: 8,
		winRate: 57.1,
		avgKills: 8.9,
		avgDeaths: 4.6,
		avgAssists: 4.1,
		avgCS: 182,
		avgDamage: 21400,
	},
	{
		championName: "Lulu",
		championId: 117,
		games: 18,
		wins: 11,
		winRate: 61.1,
		avgKills: 2.1,
		avgDeaths: 3.0,
		avgAssists: 14.5,
		avgCS: 45,
		avgDamage: 9600,
	},
	{
		championName: "Karma",
		championId: 43,
		games: 16,
		wins: 10,
		winRate: 62.5,
		avgKills: 2.9,
		avgDeaths: 3.3,
		avgAssists: 13.8,
		avgCS: 52,
		avgDamage: 11000,
	},
	{
		championName: "Singed",
		championId: 27,
		games: 11,
		wins: 6,
		winRate: 54.5,
		avgKills: 5.5,
		avgDeaths: 6.2,
		avgAssists: 9.1,
		avgCS: 170,
		avgDamage: 26000,
	},
	{
		championName: "Teemo",
		championId: 17,
		games: 9,
		wins: 4,
		winRate: 44.4,
		avgKills: 6.2,
		avgDeaths: 4.1,
		avgAssists: 6.4,
		avgCS: 178,
		avgDamage: 22200,
	},
	{
		championName: "Lee Sin",
		championId: 64,
		games: 12,
		wins: 6,
		winRate: 50,
		avgKills: 7.1,
		avgDeaths: 5.2,
		avgAssists: 7.8,
		avgCS: 154,
		avgDamage: 18900,
	},
	{
		championName: "Samira",
		championId: 360,
		games: 10,
		wins: 5,
		winRate: 50,
		avgKills: 7.6,
		avgDeaths: 5.8,
		avgAssists: 5.1,
		avgCS: 210,
		avgDamage: 24500,
	},
];

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

const mixColors = (colorA: string, colorB: string, amount: number) => {
	const hexToRgb = (hex: string) => {
		const sanitized = hex.replace("#", "");
		return {
			r: parseInt(sanitized.slice(0, 2), 16),
			g: parseInt(sanitized.slice(2, 4), 16),
			b: parseInt(sanitized.slice(4, 6), 16),
		};
	};
	const rgbToHex = (r: number, g: number, b: number) =>
		`#${[r, g, b]
			.map((value) => value.toString(16).padStart(2, "0"))
			.join("")}`;

	const a = hexToRgb(colorA);
	const b = hexToRgb(colorB);
	const mix = (channelA: number, channelB: number) =>
		Math.round(channelA * (1 - amount) + channelB * amount);
	return rgbToHex(mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b));
};

const getWinRateColor = (winRate: number) => {
	const normalized = clamp((winRate - 45) / 25, 0, 1);
	const start = "#3b82f6";
	const mid = "#fbbf24";
	const end = "#f43f5e";
	if (normalized < 0.5) {
		return mixColors(start, mid, normalized * 2);
	}
	return mixColors(mid, end, (normalized - 0.5) * 2);
};

const getKDAColor = (kda: number) => {
	const normalized = clamp((kda - 2) / 4, 0, 1);
	const start = "#38bdf8";
	const end = "#c084fc";
	return mixColors(start, end, normalized);
};

const metricFormatter = (value: number, suffix = "%") =>
	`${(value * 100).toFixed(0)}${suffix}`;

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

const championEdgeLabel = (link: ChampionLink) =>
	`${link.similarity.toFixed(2)} • ${link.sharedTraits.join(", ")}`;

interface GraphProps {
	result: ChampionMapResult;
	linkThreshold: number;
	colorMode: ColorMode;
	elementTint: ElementPalette;
	onHover: (node: ChampionMapNode | null) => void;
	hovered: ChampionMapNode | null;
}

const ChampionGalaxyGraph = ({
	result,
	linkThreshold,
	colorMode,
	elementTint,
	onHover,
	hovered,
}: GraphProps) => {
	if (!result.nodes.length) {
		return (
		 <div className="h-[360px] flex items-center justify-center text-muted-foreground">
			 Add at least 5 champions played to generate the DNA map.
		 </div>
		);
	}

	const filteredLinks = result.links.filter(
		(link) => link.similarity >= linkThreshold,
	);
	const outlierIds = new Set(result.outliers.map((node) => node.id));

	return (
		<div className="relative">
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ backgroundImage: elementTint.background }}
			/>
			<svg viewBox="0 0 960 560" className="w-full h-[560px]" role="img">
				<defs>
					<radialGradient id="spaceGradient" cx="50%" cy="30%" r="70%">
						<stop offset="0%" stopColor="#1f2a4d" stopOpacity="0.9" />
						<stop offset="80%" stopColor="#050914" stopOpacity="0.4" />
						<stop offset="100%" stopColor="#03050c" stopOpacity="0.2" />
					</radialGradient>
					<linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#38bdf8" />
						<stop offset="50%" stopColor="#c084fc" />
						<stop offset="100%" stopColor="#f472b6" />
					</linearGradient>
					<filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
						<feDropShadow
							dx="0"
							dy="0"
							stdDeviation="6"
							floodColor="#0ea5e9"
							floodOpacity="0.25"
						/>
					</filter>
				</defs>
				<rect width="960" height="560" fill="url(#spaceGradient)" />
				{filteredLinks.map((link) => {
					const source = result.nodes.find((node) => node.id === link.source);
					const target = result.nodes.find((node) => node.id === link.target);
					if (!source || !target) return null;
					const opacity = clamp(
						(link.similarity - linkThreshold) / (1 - linkThreshold),
						0.15,
						0.85,
					);
					return (
						<line
							key={`${link.source}-${link.target}`}
							x1={source.position.x}
							y1={source.position.y}
							x2={target.position.x}
							y2={target.position.y}
							stroke="url(#linkGradient)"
							strokeOpacity={opacity}
							strokeWidth={1 + (link.similarity - linkThreshold) * 2}
						>
							<title>{championEdgeLabel(link)}</title>
						</line>
					);
				})}
				{/* Center of gravity */}
				<g>
					<circle
						cx={result.centroid.x}
						cy={result.centroid.y}
						r={12}
						fill="none"
						stroke="#fcd34d"
						strokeDasharray="4 4"
						strokeWidth={1.2}
					/>
					<circle
						cx={result.centroid.x}
						cy={result.centroid.y}
						r={4}
						fill="#facc15"
					/>
				</g>
				{result.nodes.map((node) => {
					const baseColor =
						colorMode === "winRate"
							? getWinRateColor(node.winRate)
							: getKDAColor(node.avgKDA);
					const aggressionBlend = node.aggressionScore / 10;
					const fill = mixColors(
						baseColor,
						elementTint.hex,
						0.2 + aggressionBlend * 0.3,
					);
					const size = 12 + Math.log(node.games + 1) * 5;
					const isHovered = hovered?.id === node.id;
					return (
						<g key={node.id}>
							<circle
								cx={node.position.x}
								cy={node.position.y}
								r={size + 6}
								fill="transparent"
								stroke={getRoleColor(node.metadata.role)}
								strokeOpacity={0.45}
							/>
							<circle
								cx={node.position.x}
								cy={node.position.y}
								r={size}
								fill={fill}
								stroke={isHovered ? "#fef3c7" : "#0f172a"}
								strokeWidth={isHovered ? 2.4 : 1}
								filter="url(#node-glow)"
								onMouseEnter={() => onHover(node)}
								onMouseLeave={() => onHover(null)}
							>
								<title>
									{node.name} • {node.games} games • {node.winRate.toFixed(1)}% WR
								</title>
							</circle>
							{outlierIds.has(node.id) && (
								<text
									x={node.position.x}
									y={node.position.y - size - 8}
									textAnchor="middle"
									fontSize={12}
									fill="#f472b6"
								>
									✦
								</text>
							)}
							<text
								x={node.position.x}
								y={node.position.y + 4}
								textAnchor="middle"
								fontSize={11}
								fill="#0b1120"
								fontWeight={700}
							>
								{node.name.slice(0, 4)}
							</text>
						</g>
					);
				})}
			</svg>
		</div>
	);
};

interface NodePanelProps {
	node?: ChampionMapNode;
	elementTint: ElementPalette;
}

const NodePanel = ({ node, elementTint }: NodePanelProps) => {
	if (!node) return null;
	return (
		<Card className="bg-slate-900/60 border-slate-800">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
						Highlighted champion
					</p>
					<h3 className="text-2xl font-semibold">{node.name}</h3>
				</div>
				<Badge className="bg-transparent border border-white/20 text-xs">
					{node.metadata.role}
				</Badge>
			</div>
			<div className="grid grid-cols-3 gap-4 text-center py-4">
				<div>
					<p className="text-muted-foreground text-xs">Win Rate</p>
					<p className="text-xl font-semibold text-white">
						{node.winRate.toFixed(1)}%
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Games Played</p>
					<p className="text-xl font-semibold text-white">{node.games}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Avg KDA</p>
					<p className="text-xl font-semibold text-white">{node.avgKDA.toFixed(2)}</p>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<div className="p-3 rounded-lg bg-white/5">
					<p className="text-muted-foreground text-xs uppercase">Damage Type</p>
					<p className="font-medium">{node.metadata.damageType}</p>
				</div>
				<div className="p-3 rounded-lg bg-white/5">
					<p className="text-muted-foreground text-xs uppercase">Resource</p>
					<p className="font-medium">{node.metadata.resource}</p>
				</div>
				<div className="p-3 rounded-lg bg-white/5">
					<p className="text-muted-foreground text-xs uppercase">Aggression</p>
					<p className="font-medium">
						{node.aggressionScore.toFixed(1)} / 10
					</p>
				</div>
				<div className="p-3 rounded-lg bg-white/5">
					<p className="text-muted-foreground text-xs uppercase">CS / min</p>
					<p className="font-medium">
						{node.avgCSPerMin.toFixed(1)}
					</p>
				</div>
			</div>
			<div className="flex flex-wrap gap-2 mt-4">
				{node.metadata.tags.map((tag) => (
					<span
						key={tag}
						className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10"
					>
						{tag}
					</span>
				))}
			</div>
			<p className="text-xs text-muted-foreground mt-3">
				Node tint: {elementTint.label}
			</p>
		</Card>
	);
};

const clusterColors = ["border-indigo-400/60", "border-cyan-400/60", "border-amber-400/60", "border-rose-400/60"];

const ChampionMap = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
	const [linkThreshold, setLinkThreshold] = useState(0.6);
	const [colorMode, setColorMode] = useState<ColorMode>("winRate");
	const [hoveredNode, setHoveredNode] = useState<ChampionMapNode | null>(null);

	useEffect(() => {
		const data = location.state?.playerData as PlayerStats | undefined;
		if (data) {
			setPlayerData(data);
		}
	}, [location.state]);

	const elementPalette =
		(playerData?.element
			? ELEMENT_TINTS[playerData.element.name]
			: undefined) || ELEMENT_TINTS.Default;

	const champions = playerData?.topChampions?.length
		? playerData.topChampions
		: SAMPLE_CHAMPIONS;

	const championMap = useMemo(
		() =>
			buildChampionMap(champions, {
				averageGameDuration: playerData?.avgGameDuration ?? 31,
			}),
		[champions, playerData?.avgGameDuration],
	);

	const activeNode = hoveredNode ?? championMap.nodes[0];

	const clusterPayloadString = useMemo(
		() => JSON.stringify(championMap.clusterPayload, null, 2),
		[championMap.clusterPayload],
	);

	const copyPayload = async () => {
		try {
			await navigator.clipboard.writeText(clusterPayloadString);
		} catch (error) {
			console.error("Failed to copy payload", error);
		}
	};

	const insightRows = [
		{
			label: "Dominant cluster share",
			value: championMap.insights.dominantClusterShare,
			text: `${
				championMap.clusters[0]?.theme ?? "Cluster"
			} anchors ${metricFormatter(championMap.insights.dominantClusterShare)}`,
		},
		{
			label: "Diversity index",
			value: championMap.insights.diversityIndex,
			text: `Champion diversity ${
				championMap.insights.diversityIndex.toFixed(2)
			} — ${
				championMap.insights.diversityIndex > 0.6
					? "broader than most peers"
					: "laser-focused mastery"
			}`,
		},
		{
			label: "Experimentation rate",
			value: championMap.insights.experimentationRate,
			text: `Experiment zone = ${
				championMap.outliers.length
			} picks (${metricFormatter(championMap.insights.experimentationRate)})`,
		},
		{
			label: "Center of gravity",
			value: 0,
			text: `Core identity sits near ${championMap.insights.centerRole} DNA`,
		},
	];

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1d2643,_#050a18)] text-white">
			<div className="container mx-auto px-6 py-12 space-y-8">
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						className="text-muted-foreground hover:text-white gap-2"
						onClick={() => navigate(-1)}
					>
						<ArrowLeft className="w-4 h-4" />
						Back
					</Button>
					<Badge className="bg-white/10 border-white/20 text-xs">
						New experimental view
					</Badge>
				</div>

				<div className="space-y-4">
					<div>
						<p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
							Champion Intelligence Lab
						</p>
						<h1 className="text-4xl md:text-5xl font-semibold mt-2">
							Champion DNA Map
						</h1>
						<p className="text-muted-foreground text-lg mt-3 max-w-3xl">
							A galaxy map that clusters every champion you leaned on. Distance
							represents playstyle difference; size shows commitment; color encodes performance.
						</p>
					</div>
					<div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
						<span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
							Distance = style delta
						</span>
						<span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
							Size = games
						</span>
						<span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
							Color = win rate / KDA
						</span>
						<span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
							Lines = shared DNA
						</span>
					</div>
				</div>

				<Card className="bg-slate-900/40 border-slate-800/60 p-6">
					<div className="flex flex-wrap gap-6">
						<div>
							<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
								Player
							</p>
							<h3 className="text-2xl font-semibold">
								{playerData?.riotId ?? "PrototypePlayer"}
								<span className="text-muted-foreground">
									#
									{playerData?.tagLine ?? "AI"}
								</span>
							</h3>
							<p className="text-sm text-muted-foreground">
								Main role: {playerData?.mainRole ?? "Mid"} | Average game length:{" "}
								{playerData?.avgGameDuration ?? 31} min
							</p>
						</div>
						<div className="flex gap-4 flex-wrap">
							{championMap.clusters.slice(0, 3).map((cluster, idx) => (
								<div
									key={cluster.id}
									className={cn(
										"px-4 py-3 rounded-xl border bg-white/5",
										clusterColors[idx] || "border-white/10",
									)}
								>
									<p className="text-xs text-muted-foreground uppercase tracking-[0.4em]">
										Cluster {idx + 1}
									</p>
									<p className="text-lg font-semibold">{cluster.theme}</p>
									<p className="text-sm text-muted-foreground">
										{metricFormatter(cluster.gameShare)} of games •{" "}
										{cluster.winRate.toFixed(1)}% WR
									</p>
								</div>
							))}
						</div>
					</div>
				</Card>

				<Card className="bg-slate-900/50 border-slate-800 p-6 space-y-6 relative overflow-hidden">
					<div className="flex flex-wrap items-center gap-4 justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
								Galaxy projection
							</p>
							<h2 className="text-2xl font-semibold">Style Constellation</h2>
						</div>
						<div className="flex flex-wrap items-center gap-4">
							<div className="w-64">
								<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
									<span>Similarity threshold</span>
									<span>{linkThreshold.toFixed(2)}</span>
								</div>
								<Tooltip>
									<TooltipTrigger asChild>
										<div>
											<Slider
												value={[linkThreshold]}
												min={0.4}
												max={0.9}
												step={0.02}
												onValueChange={([value]) => setLinkThreshold(value)}
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent>
										Higher values only keep very similar champions connected.
									</TooltipContent>
								</Tooltip>
							</div>
							<div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
								{(["winRate", "kda"] as ColorMode[]).map((mode) => (
									<button
										key={mode}
										onClick={() => setColorMode(mode)}
										className={cn(
											"px-3 py-1 rounded-full text-sm transition",
											colorMode === mode
												? "bg-white text-slate-900"
												: "text-muted-foreground",
										)}
									>
										{mode === "winRate" ? "Win rate palette" : "KDA heat"}
									</button>
								))}
							</div>
						</div>
					</div>

					<ChampionGalaxyGraph
						result={championMap}
						linkThreshold={linkThreshold}
						colorMode={colorMode}
						elementTint={elementPalette}
						onHover={setHoveredNode}
						hovered={hoveredNode}
					/>

					<div className="grid gap-6 md:grid-cols-2">
						<NodePanel node={activeNode} elementTint={elementPalette} />
						<Card className="bg-slate-900/60 border-slate-800 flex flex-col gap-4">
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
									Experiment zone
								</p>
								<h3 className="text-xl font-semibold">
									{championMap.outliers.length} off-meta outliers
								</h3>
								<p className="text-sm text-muted-foreground">
									Distance from centroid threshold surfaces adventurous picks.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								{championMap.outliers.map((node) => (
									<Badge key={node.id} className="bg-rose-500/10 text-rose-200 border border-rose-400/30">
										{node.name}
									</Badge>
								))}
								{!championMap.outliers.length && (
									<p className="text-xs text-muted-foreground">
										No off-meta experiments detected.
									</p>
								)}
							</div>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<Compass className="w-4 h-4 text-sky-400" />
									<span>Centroid role: {championMap.insights.centerRole}</span>
								</div>
								<div className="flex items-center gap-2">
									<Activity className="w-4 h-4 text-amber-400" />
									<span>
										Experimentation rate:{" "}
										{metricFormatter(championMap.insights.experimentationRate)}
									</span>
								</div>
							</div>
						</Card>
					</div>
				</Card>

				<div className="grid gap-6 lg:grid-cols-3">
					<Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
						<div className="flex items-center gap-3">
							<Target className="w-5 h-5 text-emerald-300" />
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
									Cluster breakdown
								</p>
								<h3 className="text-xl font-semibold">Where you gravitate</h3>
							</div>
						</div>
						<div className="space-y-4">
							{championMap.clusters.map((cluster) => (
								<div
									key={cluster.id}
									className="p-4 rounded-xl bg-white/5 border border-white/10"
								>
									<div className="flex items-center justify-between">
										<p className="text-lg font-semibold">{cluster.theme}</p>
										<span className="text-sm text-muted-foreground">
											{cluster.winRate.toFixed(1)}% WR
										</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{metricFormatter(cluster.gameShare)} of games • Core role: {cluster.role}
									</p>
									<div className="flex flex-wrap gap-2 mt-3">
										{cluster.champions.slice(0, 4).map((name) => (
											<span
												key={name}
												className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10"
											>
												{name}
											</span>
										))}
										{cluster.champions.length > 4 && (
											<span className="text-xs text-muted-foreground">
												+{cluster.champions.length - 4} more
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</Card>

					<Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
						<div className="flex items-center gap-3">
							<Sparkles className="w-5 h-5 text-amber-300" />
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
									AI interpretation layer
								</p>
								<h3 className="text-xl font-semibold">Coach-ready summary</h3>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Package the clusters + outliers JSON into Bedrock (or your LLM of choice) with this prompt:
						</p>
						<pre className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs overflow-auto max-h-60">
							{clusterPayloadString}
						</pre>
						<Button variant="outline" size="sm" className="w-fit gap-2" onClick={copyPayload}>
							<Copy className="w-4 h-4" />
							Copy payload
						</Button>
						<div className="bg-white/5 rounded-lg p-4 text-sm border border-white/10 space-y-3">
							<p className="font-semibold">Prompt</p>
							<p className="text-muted-foreground">
								“Summarise this champion map like a coach. Identify the dominant cluster and shifts
								through the year. Tell the player what their identity says about their climb.”
							</p>
							<p className="font-semibold">Sample Output</p>
							<p className="text-muted-foreground">{championMap.coachSummary}</p>
						</div>
					</Card>

					<Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
						<div className="flex items-center gap-3">
							<Wand2 className="w-5 h-5 text-cyan-300" />
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
									Quantitative insights
								</p>
								<h3 className="text-xl font-semibold">Readable metrics</h3>
							</div>
						</div>
						<div className="space-y-3">
							{insightRows.map((row) => (
								<div
									key={row.label}
									className="p-3 rounded-xl bg-white/5 border border-white/10"
								>
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										{row.label}
									</p>
									<p className="text-sm mt-1 text-white">{row.text}</p>
								</div>
							))}
						</div>
					</Card>
				</div>

				<Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4">
					<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
						Enhancement runway
					</p>
					<div className="grid gap-4 md:grid-cols-3 text-sm">
						<div className="p-4 rounded-xl bg-white/5 border border-white/10">
							<p className="font-semibold mb-1">Evolution View</p>
							<p className="text-muted-foreground">
								Animate coordinates per patch or quarter to show how clusters drift over time.
							</p>
						</div>
						<div className="p-4 rounded-xl bg-white/5 border border-white/10">
							<p className="font-semibold mb-1">Meta Overlay</p>
							<p className="text-muted-foreground">
								Contrast each champion’s WR vs current patch averages (e.g., “+3% above meta on Ahri”).
							</p>
						</div>
						<div className="p-4 rounded-xl bg-white/5 border border-white/10">
							<p className="font-semibold mb-1">Compare View</p>
							<p className="text-muted-foreground">
								Overlay two players to check duo DNA compatibility or scout enemy tendencies.
							</p>
						</div>
					</div>
				</Card>
			</div>
			<Chatbot />
		</div>
	);
};

export default ChampionMap;
