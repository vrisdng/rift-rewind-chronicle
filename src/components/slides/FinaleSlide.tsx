import {
	forwardRef,useCallback, useMemo, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { ChampionStats, PlayerStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FinaleShareCustomizer } from "@/components/finale/FinaleShareCustomizer";
import { Trophy, Share2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getArchetypeIcon } from "@/lib/archetypeIcons";

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

const CTA_BUBBLE_MESSAGES = [
	"Want to know how hitting 1 more creep per minute will increase your win rate by 2%? Explore the Prediction Lab.",
	"Want to know how your synergy is with your friend? Check out Synergy Duo.",
] as const;

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
	const navigate = useNavigate();
	const archetypeIcon = getArchetypeIcon(playerData.archetype.name);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showShareCustomizer, setShowShareCustomizer] = useState(false);
	const [typedMessage, setTypedMessage] = useState("");
	const [ctaIndex, setCtaIndex] = useState(0);
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

	useEffect(() => {
		let index = 0;
		setTypedMessage("");
		const message = CTA_BUBBLE_MESSAGES[ctaIndex];
		const interval = window.setInterval(() => {
			index += 1;
			setTypedMessage(message.slice(0, index));
			if (index >= message.length) {
				window.clearInterval(interval);
			}
		}, 35);

		return () => window.clearInterval(interval);
	}, [ctaIndex]);

	useEffect(() => {
		const message = CTA_BUBBLE_MESSAGES[ctaIndex];
		if (typedMessage.length !== message.length) {
			return;
		}
		const timeout = window.setTimeout(() => {
			setCtaIndex((prev) => (prev + 1) % CTA_BUBBLE_MESSAGES.length);
		}, 3000);
		return () => window.clearTimeout(timeout);
	}, [typedMessage, ctaIndex]);

	const caretVisible =
		typedMessage.length < CTA_BUBBLE_MESSAGES[ctaIndex].length;

	return (
		<>
			<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
				{/* Background Image */}
				<div 
					className="absolute inset-0 bg-cover bg-center bg-no-repeat "
					style={{ backgroundImage: 'url(/images/background-1.jpg)' }}
				/>
				{/* Dark Overlay */}
				<div className="absolute inset-0 bg-black/60" />
				
				<div className="absolute left-6  top-6 z-20 flex max-w-xs sm:max-w-4xl mx-auto flex-col items-start gap-3 text-left">
					<div className="hidden sm:block w-full rounded-2xl border border-white/20 bg-black/80 px-4 py-3 text-sm leading-relaxed text-white shadow-lg backdrop-blur">
						<span>{typedMessage}</span>
						{caretVisible && <span className="ml-1 inline-block animate-pulse align-middle">|</span>}
					</div>
					<Button
						size="sm"
						onClick={() => navigate("/predict-lab")}
						className="bg-[#C8AA6E] text-[#0A1428] font-bold shadow-[0_0_20px_rgba(200,170,110,0.45)] transition transform hover:-translate-y-1 hover:bg-[#D4B982]"
					>
						Prediction Lab
					</Button>
					<Button
						size="sm"
						onClick={() => navigate("/duo-synergy")}
						className="bg-white/10 text-white font-semibold border border-white/30 shadow-[0_0_20px_rgba(200,170,110,0.18)] transition transform hover:-translate-y-1"
					>
						Synergy Duo
					</Button>
				</div>

				<div className="max-w-4xl w-full space-y-6 animate-fade-in relative z-10">
					{/* Trophy Icon */}
					<div className="text-center">
						<div className="relative inline-block">
							<div className="absolute inset-0 bg-[#C8AA6E] opacity-20 blur-2xl" />
							<Trophy className="w-20 h-20 text-[#C8AA6E] relative mx-auto" />
						</div>
					</div>

					{/* Title */}
					<div className="text-center space-y-2">
						<h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
							Victory
						</h2>
						<p className="lol-subheading text-gray-500 text-xs">
							{playerData.riotId}&apos;s Season Complete
						</p>
					</div>

					{/* Stats Summary */}
					<div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
						{/* Battles and Victory in one row on mobile */}
						<div className="grid grid-cols-2 sm:contents gap-4">
							<div className="lol-card p-4 text-center">
								<div className="text-3xl md:text-4xl font-bold text-[#C8AA6E] lol-body">
									{playerData.totalGames}
								</div>
								<div className="lol-subheading text-gray-600 text-xs mt-1">
									Battles
								</div>
							</div>
							<div className="lol-card p-4 text-center border-[#C8AA6E]/40">
								<div className="text-3xl md:text-4xl font-bold text-[#C8AA6E] lol-body">
									{playerData.winRate.toFixed(0)}%
								</div>
								<div className="lol-subheading text-gray-600 text-xs mt-1">
									Victory
								</div>
							</div>
						</div>
						{/* Main champion stacked below on mobile */}
						<div className="lol-card p-4 text-center relative overflow-hidden">
							{/* Champion Splash Art Background */}
							{playerData.topChampions[0]?.championName && 
								playerData.topChampions[0]?.championName !== "N/A" && (
								<div 
									className="absolute inset-0 bg-cover bg-center opacity-30"
									style={{
										backgroundImage: `url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${playerData.topChampions[0].championName.replace(/[^a-zA-Z]/g, '')}_0.jpg)`
									}}
								/>
							)}
							{/* Gradient overlay for better text readability */}
							<div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/80 to-transparent" />
							
							{/* Content */}
							<div className="relative z-10">
								<div className="text-xl md:text-2xl font-bold text-[#C8AA6E] lol-body truncate">
									{playerData.topChampions[0]?.championName || "N/A"}
								</div>
								<div className="lol-subheading text-gray-600 text-xs mt-1">
									Main
								</div>
							</div>
						</div>
					</div>

					{/* Archetype Badge */}
						<div className="lol-card inline-flex w-full items-center gap-3 px-6 py-3 border-[#C8AA6E]/40">
							<div className="flex h-12 w-12 items-center justify-center ">
								<img
									src={archetypeIcon}
									alt={playerData.archetype.name}
									className="w-8 h-8 object-contain"
								/>
							</div>
							<div className="text-left">
								<p className="lol-subheading text-gray-600 text-[10px]">
									Class
								</p>
								<p className="text-lg font-bold text-[#C8AA6E] lol-heading">
									{playerData.archetype.name}
								</p>
							</div>
						</div>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 w-full sm:w-auto">
						<Button
							size="lg"
							onClick={() => setShowShareCustomizer(true)}
							className="bg-[#C8AA6E] text-[#0A1428] font-bold hover:bg-[#C8AA6E]/90 transition-all duration-300 lol-heading w-full sm:w-auto text-sm sm:text-base"
						>
							<Share2 className="mr-2 h-4 w-4" />
							Share Results
						</Button>
						<Button
							size="lg"
							variant="outline"
							onClick={() => window.location.href = '/'}
							className="border-[#C8AA6E] text-[#C8AA6E] hover:bg-[#C8AA6E]/10 font-bold transition-all duration-300 lol-heading w-full sm:w-auto text-sm sm:text-base"
						>
							Start Again
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>

					{/* Footer */}
					<p className="text-center lol-subheading text-gray-600 text-xs">
						Rift Rewind Chronicle
					</p>
				</div>
			</div>

			<div
				aria-hidden="true"
				className="fixed left-[-9999px] top-0 flex select-none flex-col gap-10 opacity-0 pointer-events-none"
			></div>

			{showShareCustomizer && (
				<FinaleShareCustomizer
					playerData={playerData}
					open={showShareCustomizer}
					onOpenChange={setShowShareCustomizer}
				/>
			)}
		</>
	);
};
