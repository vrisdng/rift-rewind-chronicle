import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ChampionStats, PlayerStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FinaleShareCustomizer } from "@/components/finale/FinaleShareCustomizer";
import { Trophy, Share2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";

type ShareAspectId = "story" | "grid" | "landscape";

interface ShareAspect {
	id: ShareAspectId;
	label: string;
	width: number;
	height: number;
	orientation: "portrait" | "square" | "landscape";
}

interface StatRelicBadge {
	label: string;
	value: string;
	description?: string;
}

interface LegendaryMomentCopy {
	title: string;
	date: string;
	description: string;
}

interface LeagueTwinCopy {
	name: string;
	subtitle: string;
	description: string;
	similarity?: number;
}

const SHARE_ASPECTS: ShareAspect[] = [
	{
		id: "story",
		label: "Stories",
		width: 1080,
		height: 1920,
		orientation: "portrait",
	},
	{
		id: "grid",
		label: "Square",
		width: 1080,
		height: 1080,
		orientation: "square",
	},
	{
		id: "landscape",
		label: "Landscape",
		width: 1920,
		height: 1080,
		orientation: "landscape",
	},
];

const METRIC_LABELS: Record<string, string> = {
	aggression: "Aggression",
	farming: "Farming",
	vision: "Vision",
	consistency: "Consistency",
	earlyGameStrength: "Early Game",
	lateGameScaling: "Late Game",
	comebackRate: "Comeback Rate",
	clutchFactor: "Clutch Factor",
	tiltFactor: "Tilt Resistance",
	championPoolDepth: "Champion Pool",
	improvementVelocity: "Improvement",
	roaming: "Roaming",
	teamfighting: "Teamfighting",
	snowballRate: "Snowball Rate",
};

const PLACEHOLDER_CHAMPION: ChampionStats = {
	championName: "Awaiting Legend",
	championId: -1,
	games: 0,
	wins: 0,
	winRate: 0,
	avgKills: 0,
	avgDeaths: 0,
	avgAssists: 0,
	avgCS: 0,
	avgDamage: 0,
};

const safeParseDate = (value?: string) => {
	if (!value) {
		return null;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}
	return parsed;
};

const formatDateLabel = (value?: string) => {
	const parsed = safeParseDate(value);
	if (!parsed) {
		return null;
	}
	return format(parsed, "MMMM d, yyyy");
};

interface FinaleSlideProps {
	playerData: PlayerStats;
	onContinue: () => void;
}

export const FinaleSlide = ({ playerData, onContinue }: FinaleSlideProps) => {
	const [isGenerating, setIsGenerating] = useState(false);
	const cardRefs = useRef<Record<ShareAspectId, HTMLDivElement | null>>({
		story: null,
		grid: null,
		landscape: null,
	});

	const signatureTrio = useMemo(() => {
		const champions = [...(playerData.topChampions || [])].slice(0, 3);
		while (champions.length < 3) {
			champions.push({
				...PLACEHOLDER_CHAMPION,
				championId: -champions.length - 1,
			});
		}
		return champions;
	}, [playerData.topChampions]);

	const statRelics = useMemo<StatRelicBadge[]>(() => {
		if (playerData.topStrengths && playerData.topStrengths.length) {
			return playerData.topStrengths.slice(0, 5).map((strength) => ({
				label: strength.metric,
				value: `${Math.round(strength.value)}%`,
			}));
		}

		const derivedEntries = Object.entries(playerData.derivedMetrics || {});
		if (!derivedEntries.length) {
			return [];
		}

		return derivedEntries
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([key, value]) => {
				const label =
					METRIC_LABELS[key] ||
					key
						.replace(/([A-Z])/g, " $1")
						.replace(/\b\w/g, (char) => char.toUpperCase())
						.trim();

				return {
					label,
					value: `${Math.round(value)}%`,
				};
			});
	}, [playerData.derivedMetrics, playerData.topStrengths]);

	const legendaryMoment = useMemo<LegendaryMomentCopy>(() => {
		if (playerData.watershedMoment) {
			return {
				title: playerData.watershedMoment.championName,
				date:
					formatDateLabel(playerData.watershedMoment.gameDate) ??
					format(new Date(), "MMMM d, yyyy"),
				description:
					playerData.watershedMoment.description ||
					`The turning point match that defined your ${playerData.watershedMoment.result ? "victory" : "resilience"}.`,
			};
		}

		if (playerData.currentStreak?.length) {
			const streakType =
				playerData.currentStreak.type === "win" ? "Win Streak" : "Clutch Grind";
			return {
				title: `${playerData.currentStreak.length}-Game ${streakType}`,
				date:
					formatDateLabel(playerData.currentStreak.endDate) ??
					(playerData.currentStreak.startDate
						? (formatDateLabel(playerData.currentStreak.startDate) ??
							format(new Date(), "MMMM d, yyyy"))
						: format(new Date(), "MMMM d, yyyy")),
				description:
					playerData.currentStreak.type === "win"
						? "Closed the split on an unstoppable hot streak."
						: "Weathered adversity and kept queuing up.",
			};
		}

		return {
			title: "Season Complete",
			date:
				formatDateLabel(playerData.generatedAt) ??
				format(new Date(), "MMMM d, yyyy"),
			description: `${playerData.totalGames} games. ${playerData.wins} wins. Countless memories.`,
		};
	}, [
		playerData.currentStreak,
		playerData.generatedAt,
		playerData.totalGames,
		playerData.watershedMoment,
		playerData.wins,
	]);

	const downloadCards = useCallback(async () => {
		const slug =
			playerData.riotId
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "") || "recap";

		for (const aspect of SHARE_ASPECTS) {
			const node = cardRefs.current[aspect.id];
			if (!node) {
				continue;
			}

			const dataUrl = await toPng(node, {
				cacheBust: true,
				width: aspect.width,
				height: aspect.height,
				pixelRatio: 1,
			});

			const link = document.createElement("a");
			link.download = `rift-rewind-${slug}-${aspect.id}.png`;
			link.href = dataUrl;
			link.click();
		}
	}, [playerData.riotId]);

	const handleShare = useCallback(async () => {
		if (isGenerating) {
			return;
		}
		setIsGenerating(true);
		toast("Preparing recap cards...");
		try {
			await downloadCards();
			toast.success("Recap cards downloaded!");
		} catch (error) {
			console.error(error);
			toast.error("Unable to generate recap cards.");
		} finally {
			setIsGenerating(false);
		}
	}, [downloadCards, isGenerating]);

	return (
		<>
			<div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-hextech p-4 sm:p-8">
				{/* Animated hextech background */}
				<div className="pointer-events-none absolute inset-0 opacity-10">
					<div className="absolute top-10 left-10 h-40 w-40 hexagon bg-primary animate-hextech-pulse" />
					<div
						className="absolute bottom-20 right-10 h-48 w-48 hexagon bg-accent animate-hextech-pulse"
						style={{ animationDelay: "0.5s" }}
					/>
					<div
						className="absolute top-1/3 right-1/4 h-32 w-32 hexagon bg-primary animate-hextech-pulse"
						style={{ animationDelay: "1s" }}
					/>
					<div
						className="absolute bottom-1/3 left-1/4 h-36 w-36 hexagon bg-accent animate-hextech-pulse"
						style={{ animationDelay: "1.5s" }}
					/>
				</div>

				<div className="animate-fade-in relative z-10 flex max-h-screen w-full max-w-3xl flex-col items-center space-y-8 overflow-y-auto px-4 py-8 text-center sm:space-y-12">
					{/* Trophy Icon with hextech styling */}
					<div className="relative">
						<div className="absolute inset-0 mx-auto h-32 w-32 hexagon bg-gradient-gold opacity-30 blur-xl animate-hextech-pulse sm:h-40 sm:w-40" />
						<div className="relative mx-auto flex h-32 w-32 items-center justify-center border-4 border-accent hexagon bg-gradient-gold shine-effect sm:h-40 sm:w-40">
							<Trophy className="h-20 w-20 text-background drop-shadow-[0_0_20px_rgba(200,150,0,0.8)] sm:h-24 sm:w-24" />
						</div>
					</div>

					{/* Title with LoL styling */}
					<div className="space-y-3 sm:space-y-4">
						<h2 className="text-5xl font-bold uppercase tracking-wider text-hextech sm:text-6xl md:text-7xl">
							Victory
						</h2>
						<p className="px-4 text-lg uppercase tracking-widest text-foreground/80 sm:text-xl md:text-2xl">
							{playerData.riotId}&apos;s Season Complete
						</p>
					</div>

					{/* Stats Summary with hextech styling */}
					<div className="grid grid-cols-3 gap-3 py-4 sm:gap-6 sm:py-8 md:gap-8">
						<div className="space-y-1 rounded-lg border border-primary/30 bg-card/40 p-3 text-hextech lol-corners backdrop-blur-sm sm:space-y-2 sm:p-4 md:p-6">
							<div className="text-3xl font-bold sm:text-4xl md:text-5xl">
								{playerData.totalGames}
							</div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
								Battles
							</div>
						</div>
						<div className="space-y-1 rounded-lg border border-accent/30 bg-card/40 p-3 text-glow-gold lol-corners backdrop-blur-sm sm:space-y-2 sm:p-4 md:p-6">
							<div className="text-3xl font-bold text-accent sm:text-4xl md:text-5xl">
								{playerData.winRate.toFixed(0)}%
							</div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
								Victory
							</div>
						</div>
						<div className="space-y-1 rounded-lg border border-primary/30 bg-card/40 p-3 text-hextech lol-corners backdrop-blur-sm sm:space-y-2 sm:p-4 md:p-6">
							<div className="text-xl font-bold truncate sm:text-2xl md:text-3xl">
								{playerData.topChampions[0]?.championName || "N/A"}
							</div>
							<div className="text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
								Main
							</div>
						</div>
					</div>

					{/* Archetype Badge with hextech styling */}
					<div className="lol-corners inline-flex max-w-full items-center gap-3 border border-primary/40 bg-card/60 px-6 py-4 backdrop-blur-sm shine-effect sm:gap-4 sm:px-8 sm:py-5 md:px-10">
						<div className="hexagon flex h-12 w-12 flex-shrink-0 items-center justify-center bg-gradient-hextech sm:h-14 sm:w-14 md:h-16 md:w-16">
							<span className="text-2xl sm:text-3xl">
								{playerData.archetype.icon}
							</span>
						</div>
						<div className="min-w-0 text-left">
							<p className="text-xs uppercase tracking-widest text-muted-foreground">
								Class
							</p>
							<p className="truncate text-lg font-bold text-primary sm:text-xl md:text-2xl">
								{playerData.archetype.name}
							</p>
						</div>
					</div>

					{/* CTA Buttons with LoL styling */}
					<div className="mx-auto flex w-full max-w-md flex-col justify-center gap-3 pt-4 sm:flex-row sm:gap-4 sm:pt-8">
						<FinaleShareCustomizer
							playerData={playerData}
							triggerLabel="Share Results"
							triggerIcon={<Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
							triggerProps={{
								variant: "outline",
								size: "lg",
								className:
									"lol-corners w-full border-primary/40 bg-card/80 text-primary backdrop-blur-sm hover:border-primary/60 hover:bg-card sm:w-auto",
							}}
							onDownloadAll={handleShare}
							isDownloadingAll={isGenerating}
						/>
						<Button
							size="lg"
							onClick={onContinue}
							className="lol-corners w-full border-2 border-accent/50 bg-gradient-gold text-background font-bold uppercase tracking-wider hover:opacity-90 sm:w-auto"
						>
							Continue
							<ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
						</Button>
					</div>

					{/* Footer */}
					<p className="text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
						Rift Rewind Chronicle
					</p>
				</div>
			</div>
		</>
	);
};
