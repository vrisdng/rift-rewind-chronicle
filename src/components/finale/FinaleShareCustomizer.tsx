import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { CANONICAL_SHARE_URL, type PlayerStats } from "@/lib/api";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Download,
	Instagram,
	Loader2,
	MessageCircle,
	Send,
	Sparkles,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "@/components/ui/sonner";
import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";
import {
	METRIC_DEFINITIONS,
	type MetricDatum,
} from "@/components/ui/metrics-radar";
import { useShareCardUpload } from "@/hooks/useShareCardUpload";
type BackgroundOptionType = "color" | "image" | "gradient";
interface BackgroundOption {
	id: string;
	label: string;
	description?: string;
	type: BackgroundOptionType;
	value: string;
}
type ButtonProps = ComponentProps<typeof Button>;

interface FinaleShareCustomizerProps {
	playerData: PlayerStats;
	triggerLabel?: string;
	triggerIcon?: ReactNode;
	triggerProps?: {
		variant?: ButtonProps["variant"];
		size?: ButtonProps["size"];
		className?: string;
	};
	onDownloadAll?: () => void | Promise<void>;
	isDownloadingAll?: boolean;
	downloadAllLabel?: string;
	downloadAllIcon?: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}
const radarMetricKeys: Array<keyof PlayerStats["derivedMetrics"]> = [
	"vision",
	"farming",
	"roaming",
	"aggression",
	"teamfighting",
];
type SharePlatform = "telegram" | "whatsapp" | "instagram";

function buildDefaultShareCaption(playerData: PlayerStats): string {
	const title = playerData.insights?.title || "My League Year";

	return `${title}

${playerData.riotId}'s 2025 Season:
• ${playerData.totalGames} games • ${playerData.winRate.toFixed(1)}% WR
• ${playerData.persona?.codename || playerData.archetype?.name || "Unknown"}
• ${playerData.persona?.description || playerData.archetype?.description || ""}

#RiftRewind #LeagueOfLegends`;
}

function buildShareText(caption: string): string {
	const trimmed = caption.trim();
	return trimmed.length
		? `${trimmed}\n${CANONICAL_SHARE_URL}`
		: CANONICAL_SHARE_URL;
}

export const FinaleShareCustomizer = ({
	playerData,
	triggerLabel,
	triggerIcon,
	triggerProps,
	onDownloadAll,
	isDownloadingAll = false,
	downloadAllLabel,
	downloadAllIcon,
	open: controlledOpen,
	onOpenChange,
}: FinaleShareCustomizerProps) => {
	const [internalOpen, setInternalOpen] = useState(false);
	const [showWinRate] = useState(true);
	const [showGamesPlayed] = useState(true);
	const [showAverageKda] = useState(true);
	const [selectedBackground, setSelectedBackground] =
		useState<string>("prestige-gold");
	const [activeTab, setActiveTab] = useState<"customize" | "share">(
		"customize",
	);
	const cardRef = useRef<HTMLDivElement | null>(null);
	const defaultShareCaption = useMemo(
		() => buildDefaultShareCaption(playerData),
		[playerData],
	);
	const [shareCaption, setShareCaption] = useState(defaultShareCaption);
	useEffect(() => {
		setShareCaption(defaultShareCaption);
	}, [defaultShareCaption]);
	const {
		shareCard,
		isUploading: isUploadingShareCard,
		error: shareUploadError,
		uploadShareCard,
		resetShareCard,
	} = useShareCardUpload(playerData);
	const [isGeneratingShareCard, setIsGeneratingShareCard] = useState(false);
	useEffect(() => {
		if (shareUploadError) {
			toast.error(shareUploadError);
		}
	}, [shareUploadError]);
	const trimmedShareCaption = shareCaption.trim();
	const shareText = useMemo(
		() => buildShareText(trimmedShareCaption),
		[trimmedShareCaption],
	);
	const isShareReady =
		Boolean(shareCard) && shareCard?.caption === trimmedShareCaption;
	const shareBusy = isGeneratingShareCard || isUploadingShareCard;
	const generateShareCardJpeg = useCallback(async () => {
		if (!cardRef.current) {
			throw new Error("Card preview is not ready yet.");
		}

		try {
			// Capture at actual rendered size with high quality
			const dataUrl = await toPng(cardRef.current, {
				cacheBust: true,
				pixelRatio: 2, // 2x for high quality/retina displays
				backgroundColor: "#050505",
			});

			return dataUrl;
		} catch (error) {
			console.error("Failed to generate share card:", error);
			throw error;
		}
	}, [cardRef]);

	// Use controlled state if provided, otherwise use internal state
	const open = controlledOpen ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;
	const {
		variant: triggerVariant = "hero",
		size: triggerSize = "lg",
		className: triggerClassName,
	} = triggerProps ?? {};
	const triggerContentIcon = triggerIcon ?? (
		<Sparkles className="mr-2 h-5 w-5 text-[#0A1428]" />
	);
	const triggerButtonClassName = cn(
		"lol-heading text-lg px-12 py-6 h-auto font-bold tracking-[0.3em] uppercase bg-[#C8AA6E] text-[#0A1428] hover:bg-[#d7b977] border-[#C8AA6E]/60 shadow-[0_18px_40px_rgba(8,12,22,0.55)] transition-transform hover:-translate-y-0.5 focus-visible:ring-[#C8AA6E]",
		triggerClassName,
	);
	const downloadAllButtonLabel = downloadAllLabel ?? "Download Recap Cards";
	const downloadAllButtonIcon = downloadAllIcon ?? (
		<Sparkles className="mr-2 h-4 w-4 text-[#C8AA6E]" />
	);
	const backgroundOptions = useMemo<BackgroundOption[]>(() => {
		const championOptions: BackgroundOption[] = (playerData.topChampions || [])
			.filter((champion) => Boolean(champion.splashArtUrl))
			.slice(0, 3)
			.map((champion, index) => ({
				id: `champion-${champion.championId}-${index}`,
				label: champion.championName,
				description: "Top Champion Splash",
				type: "image" as const,
				value: champion.splashArtUrl as string,
			}));
		const thematicOptions: BackgroundOption[] = [
			{
				id: "prestige-gold",
				label: "Prestige Gold",
				description: "Signature LoL gold glow",
				type: "gradient",
				value:
					"linear-gradient(135deg, rgba(10,20,40,0.98) 0%, rgba(20,35,60,0.9) 50%, rgba(200,170,110,0.32) 100%)",
			},
			{
				id: "hextech-night",
				label: "Hextech Nightfall",
				description: "Hextech blues with golden rim",
				type: "gradient",
				value:
					"linear-gradient(145deg, rgba(10,20,40,0.96) 0%, rgba(32,58,112,0.75) 55%, rgba(200,170,110,0.28) 100%)",
			},
			{
				id: "victory-dawn",
				label: "Victory Dawn",
				description: "Warm prestige horizon",
				type: "gradient",
				value:
					"linear-gradient(150deg, rgba(10,20,40,0.95) 0%, rgba(104,68,34,0.65) 60%, rgba(200,170,110,0.28) 100%)",
			},
			{
				id: "radar",
				label: "Playstyle Radar",
				description: "Show radar as background",
				type: "gradient",
				value:
					"linear-gradient(135deg, rgba(10,15,25,0.95) 0%, rgba(26,31,46,0.9) 100%)",
			},
		];
		return [...championOptions, ...thematicOptions];
	}, [playerData.topChampions]);
	useEffect(() => {
		if (!backgroundOptions.length) {
			setSelectedBackground("prestige-gold");
			return;
		}
		if (!backgroundOptions.some((option) => option.id === selectedBackground)) {
			setSelectedBackground(backgroundOptions[0].id);
		}
	}, [backgroundOptions, selectedBackground]);
	const selectedBackgroundOption = useMemo<BackgroundOption | undefined>(() => {
		return backgroundOptions.find((option) => option.id === selectedBackground);
	}, [backgroundOptions, selectedBackground]);
	const backgroundStyle = useMemo(() => {
		if (!selectedBackgroundOption) {
			return {
				backgroundColor: "#050505",
			};
		}
		if (selectedBackgroundOption.type === "color") {
			return {
				backgroundColor: selectedBackgroundOption.value,
			};
		}
		if (selectedBackgroundOption.type === "gradient") {
			return {
				backgroundImage: selectedBackgroundOption.value,
				backgroundColor: "#050505",
			};
		}
		return {
			backgroundImage: `url(${selectedBackgroundOption.value})`,
			backgroundSize: "cover",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			backgroundColor: "#050505",
		};
	}, [selectedBackgroundOption]);
	const radarData = useMemo<MetricDatum[]>(
		() =>
			METRIC_DEFINITIONS.map((definition) => ({
				...definition,
				value: Number(playerData.derivedMetrics?.[definition.key] ?? 0),
			})),
		[playerData.derivedMetrics],
	);
	const renderRadarIconTick = ({
		x,
		y,
		cx,
		cy,
		payload,
	}: {
		x: number;
		y: number;
		cx: number;
		cy: number;
		payload: { value: string };
	}) => {
		const datum = radarData.find((metric) => metric.label === payload.value);
		if (!datum) {
			return null;
		}
		const Icon = datum.icon;
		const dx = x - cx;
		const dy = y - cy;
		const distance = Math.sqrt(dx * dx + dy * dy) || 1;
		const offset = 28;
		const offsetX = x + (dx / distance) * offset;
		const offsetY = y + (dy / distance) * offset;
		return (
			<g transform={`translate(${offsetX - 10}, ${offsetY - 10})`}>
				<Icon className="h-5 w-5 text-white/75" />
			</g>
		);
	};
	const statBlocks = useMemo(() => {
		const items: Array<{ label: string; value: string }> = [];
		if (showWinRate) {
			items.push({
				label: "Win Rate",
				value: `${Math.round(playerData.winRate)}%`,
			});
		}
		if (showGamesPlayed) {
			items.push({
				label: "Games Played",
				value: `${playerData.totalGames}`,
			});
		}
		if (showAverageKda) {
			items.push({
				label: "Average KDA",
				value: playerData.avgKDA.toFixed(2),
			});
		}
		return items;
	}, [
		playerData.avgKDA,
		playerData.totalGames,
		playerData.winRate,
		showAverageKda,
		showGamesPlayed,
		showWinRate,
	]);
	const handleSelectBackground = useCallback(
		(optionId: string) => {
			resetShareCard();
			setSelectedBackground(optionId);
		},
		[resetShareCard],
	);
	const handlePreviousBackground = useCallback(() => {
		const currentIndex = backgroundOptions.findIndex(
			(option) => option.id === selectedBackground,
		);
		if (currentIndex > 0) {
			handleSelectBackground(backgroundOptions[currentIndex - 1].id);
		}
	}, [backgroundOptions, selectedBackground, handleSelectBackground]);
	const handleNextBackground = useCallback(() => {
		const currentIndex = backgroundOptions.findIndex(
			(option) => option.id === selectedBackground,
		);
		if (currentIndex < backgroundOptions.length - 1) {
			handleSelectBackground(backgroundOptions[currentIndex + 1].id);
		}
	}, [backgroundOptions, selectedBackground, handleSelectBackground]);
	const currentBackgroundIndex = backgroundOptions.findIndex(
		(option) => option.id === selectedBackground,
	);
	const canGoPrevious = currentBackgroundIndex > 0;
	const canGoNext = currentBackgroundIndex < backgroundOptions.length - 1;
	const handleDownload = async () => {
		if (!cardRef.current) {
			toast.error("Card preview is not ready yet.");
			return;
		}
		try {
			toast("Preparing share card...");
			const dataUrl = await generateShareCardJpeg();
			const anchor = document.createElement("a");
			const slug =
				playerData.riotId
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, "") || "rewind";
			anchor.download = `rift-rewind-${slug}-share-card.png`;
			anchor.href = dataUrl;
			anchor.click();
			toast.success("Share card downloaded!");
		} catch (error) {
			console.error(error);
			toast.error("Failed to create image. Try again.");
		}
	};
	const handlePrepareShareCard = useCallback(
		async (options?: { silent?: boolean }) => {
			if (!cardRef.current) {
				if (!options?.silent) {
					toast.error("Card preview is not ready yet.");
				}
				return;
			}
			try {
				setIsGeneratingShareCard(true);
				if (!options?.silent) {
					toast("Preparing share card...");
				}
				const dataUrl = await generateShareCardJpeg();
				const card = await uploadShareCard(dataUrl, trimmedShareCaption);
				if (!options?.silent) {
					toast.success("Share card ready!");
				}
				if (card) {
					setActiveTab("share");
				}
			} catch (error) {
				console.error(error);
				const message =
					error instanceof Error
						? error.message
						: "Failed to prepare share card";
				if (!options?.silent) {
					toast.error(message);
				}
			} finally {
				setIsGeneratingShareCard(false);
			}
		},
		[generateShareCardJpeg, trimmedShareCaption, uploadShareCard, setActiveTab],
	);
	const handleCopyShareText = async () => {
		const textToCopy = shareText;
		try {
			if (
				navigator.clipboard &&
				typeof navigator.clipboard.writeText === "function"
			) {
				await navigator.clipboard.writeText(textToCopy);
			} else {
				const textarea = document.createElement("textarea");
				textarea.value = textToCopy;
				textarea.style.position = "fixed";
				textarea.style.opacity = "0";
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}
			toast.success("Copied caption and link!");
		} catch (error) {
			console.error(error);
			toast.error("Unable to copy automatically. Please copy manually.");
		}
	};
	const handleShareToPlatform = async (platform: SharePlatform) => {
		const encodedText = encodeURIComponent(shareText);
		const encodedCaption = encodeURIComponent(trimmedShareCaption);
		const encodedUrl = encodeURIComponent(CANONICAL_SHARE_URL);

		switch (platform) {
			case "telegram": {
				const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedCaption || encodedUrl}`;
				window.open(shareUrl, "_blank", "noopener,noreferrer");
				break;
			}
			case "whatsapp": {
				const shareUrl = `https://wa.me/?text=${encodedText}`;
				window.open(shareUrl, "_blank", "noopener,noreferrer");
				break;
			}
			case "instagram": {
				toast.info(
					"Instagram requires manual upload. Copy the caption and share your JPEG in the app.",
				);
				window.open(
					"https://www.instagram.com/",
					"_blank",
					"noopener,noreferrer",
				);
				break;
			}
			default:
				break;
		}
	};
	useEffect(() => {
		if (activeTab !== "share" || shareBusy || isShareReady) {
			return;
		}
		void handlePrepareShareCard({ silent: true });
	}, [activeTab, shareBusy, isShareReady, handlePrepareShareCard]);
	const handleOpenChange = (value: boolean) => {
		setOpen(value);
	};
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant={triggerVariant}
					size={triggerSize}
					className={triggerButtonClassName}
				>
					{triggerContentIcon}
					{triggerLabel ?? "Share My Rewind"}
				</Button>
			</DialogTrigger>
			<DialogContent
				className="max-w-[95vw] max-h-[95vh] overflow-y-auto border border-[rgba(200,170,110,0.25)] bg-[#0A1428] text-white shadow-[0_25px_60px_rgba(8,12,22,0.65)] backdrop-blur-xl p-4 sm:p-6"
				style={{
					background:
						"linear-gradient(180deg, rgba(10,20,40,0.98) 0%, rgba(22,31,50,0.92) 65%, rgba(10,20,40,0.98) 100%)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="lol-heading text-xl sm:text-2xl text-[#C8AA6E]">
						Customize Your Share Card
					</DialogTitle>
					<DialogDescription className="lol-body text-xs sm:text-sm text-white/70">
						Tailor your recap, then generate a share-ready caption with quick
						links for your favorite platforms.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-6 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,640px)_1fr]">
					<div className="flex flex-col items-center w-full">
						<div className="relative w-full max-w-[640px] group">
							{/* Previous Background Button */}
							<button
								type="button"
								onClick={handlePreviousBackground}
								disabled={!canGoPrevious}
								className={cn(
									"absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[#0A1428]/90 border border-[#C8AA6E]/40 flex items-center justify-center transition-all backdrop-blur-sm",
									canGoPrevious
										? "opacity-0 group-hover:opacity-100 hover:bg-[#C8AA6E]/20 hover:border-[#C8AA6E] hover:scale-110"
										: "opacity-0 cursor-not-allowed",
								)}
							>
								<ChevronLeft className="h-6 w-6 text-[#C8AA6E]" />
							</button>

							{/* Next Background Button */}
							<button
								type="button"
								onClick={handleNextBackground}
								disabled={!canGoNext}
								className={cn(
									"absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[#0A1428]/90 border border-[#C8AA6E]/40 flex items-center justify-center transition-all backdrop-blur-sm",
									canGoNext
										? "opacity-0 group-hover:opacity-100 hover:bg-[#C8AA6E]/20 hover:border-[#C8AA6E] hover:scale-110"
										: "opacity-0 cursor-not-allowed",
								)}
							>
								<ChevronRight className="h-6 w-6 text-[#C8AA6E]" />
							</button>

							{/* Background Indicator */}
							<div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-[#0A1428]/90 border border-[#C8AA6E]/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
								<p className="lol-heading text-[0.6rem] text-[#C8AA6E] tracking-[0.2em] uppercase whitespace-nowrap">
									{selectedBackgroundOption?.label || "Background"}
								</p>
							</div>

							<div
								ref={cardRef}
								className="relative aspect-[640/388] w-full overflow-hidden rounded-2xl sm:rounded-[28px] border border-[rgba(200,170,110,0.28)] bg-[#0A1428] shadow-[0_25px_60px_rgba(8,12,22,0.65)] transition-all"
								style={backgroundStyle}
							>
								<div className="absolute inset-0 bg-gradient-to-br from-[#050912]/40 via-[#0A1428]/30 to-[#050912]/50" />
								<div
									className="absolute inset-0 opacity-40"
									style={{
										background:
											"radial-gradient(circle at 18% 20%, rgba(200,170,110,0.32) 0%, transparent 55%), radial-gradient(circle at 82% 18%, rgba(64,119,227,0.22) 0%, transparent 50%)",
									}}
								/>
								{selectedBackground === "radar" && (
									<div className="absolute inset-0 flex items-center justify-center opacity-25">
										<div className="h-full w-full scale-150">
											<ResponsiveContainer width="100%" height="100%">
												<RadarChart
													data={radarData}
													cx="50%"
													cy="50%"
													outerRadius="68%"
												>
													<PolarGrid
														stroke="rgba(255,255,255,0.45)"
														radialLines={false}
													/>
													<PolarAngleAxis
														dataKey="label"
														tick={renderRadarIconTick}
														tickLine={false}
														axisLine={false}
													/>
													<Radar
														name="Profile"
														dataKey="value"
														stroke="#C8AA6E"
														fill="#C8AA6E"
														fillOpacity={0.28}
														strokeWidth={1.5}
														isAnimationActive={false}
													/>
												</RadarChart>
											</ResponsiveContainer>
										</div>
									</div>
								)}
								<div className="relative flex h-full flex-col justify-between p-4 sm:p-6 md:p-9 text-white lol-body">
									<header className="space-y-2 sm:space-y-4">
										<p className="lol-subheading text-[0.5rem] sm:text-[0.65rem] tracking-[0.45em] text-[#C8AA6E]/70">
											Rift Rewind Chronicle
										</p>
										<div className="lol-accent-bar pl-2 sm:pl-4">
											<p className="lol-subheading text-[0.5rem] sm:text-[0.65rem] tracking-[0.5em] text-[#C8AA6E]/65">
												Summoner
											</p>
											<h2 className="lol-heading text-base sm:text-xl md:text-2xl lg:text-3xl text-white drop-shadow-[0_0_25px_rgba(10,20,40,0.65)] break-words">
												<span className="inline-block">{playerData.riotId}</span>
												<span className="ml-1 sm:ml-2 text-[#C8AA6E]/70 inline-block">
													#{playerData.tagLine}
												</span>
											</h2>
										</div>
									</header>
									<div className="space-y-3 sm:space-y-5">
										<div className="space-y-1 sm:space-y-2 text-left">
											<h3 className="lol-heading text-base sm:text-xl md:text-3xl lg:text-[2.4rem] text-white tracking-[0.15em] sm:tracking-[0.22em] drop-shadow-[0_0_35px_rgba(10,20,40,0.7)] break-words">
												{playerData.persona?.codename ||
													playerData.archetype?.name ||
													"Unknown"}
											</h3>
											<p className="text-[0.65rem] sm:text-xs md:text-sm leading-relaxed text-white/75 break-words">
												{playerData.persona?.description ||
													playerData.archetype?.description ||
													""}
											</p>
										</div>
										{!!statBlocks.length && (
											<div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
												{statBlocks.map((stat) => (
													<div
														key={stat.label}
														className="lol-card border-[rgba(200,170,110,0.3)] bg-[#0A1428]/70 p-1 sm:p-2 md:p-4 text-left shadow-[0_12px_20px_rgba(8,12,22,0.4)] min-w-0"
													>
														<p className="lol-subheading text-[0.35rem] sm:text-[0.5rem] md:text-[0.6rem] tracking-[0.2em] sm:tracking-[0.45em] text-[#C8AA6E]/70 truncate">
															{stat.label.replace(' ', '\u00A0')}
														</p>
														<p className="lol-heading text-xs sm:text-base md:text-xl lg:text-2xl text-white tracking-[0.02em] sm:tracking-[0.08em] break-words">
															{stat.value}
														</p>
													</div>
												))}
											</div>
										)}
									</div>
									<footer className="flex items-center justify-between gap-1 lol-subheading text-[0.4rem] sm:text-[0.5rem] md:text-[0.6rem] tracking-[0.3em] sm:tracking-[0.45em] text-[#C8AA6E]/70">
										<span className="uppercase whitespace-nowrap">
											Season{" "}
											{new Date(playerData.generatedAt).getFullYear() || 2025}
										</span>
										<span className="uppercase truncate min-w-0">
											{playerData.riotId.replace(/\s+/g, "")}
										</span>
									</footer>
								</div>
							</div>
						</div>

						{/* Background Carousel */}
						<div className="mt-4 sm:mt-6 w-full max-w-[640px] space-y-2">
							<h4 className="lol-heading text-xs sm:text-sm text-[#C8AA6E] tracking-[0.3em] uppercase text-center">
								Background
							</h4>
							<div className="relative overflow-hidden">
								<div className="flex gap-2 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#C8AA6E]/50 scrollbar-track-[#0A1428]/30">
									{backgroundOptions.map((option) => (
										<button
											key={option.id}
											type="button"
											onClick={() => handleSelectBackground(option.id)}
											className={cn(
												"group relative flex-shrink-0 w-32 sm:w-36 overflow-hidden rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#C8AA6E]/60 snap-start",
												selectedBackground === option.id
													? "border-[#C8AA6E] shadow-[0_8px_20px_rgba(200,170,110,0.25)] scale-105"
													: "border-[rgba(200,170,110,0.2)] hover:border-[#C8AA6E]/40 hover:scale-102",
											)}
										>
											<div
												className="relative h-20 sm:h-24 w-full overflow-hidden bg-[#050912]"
												style={
													option.type === "image"
														? {
																backgroundImage: `url(${option.value})`,
																backgroundSize: "cover",
																backgroundPosition: "center",
															}
														: option.type === "gradient"
															? { backgroundImage: option.value }
															: { backgroundColor: option.value }
												}
											>
												<div className="absolute inset-0 bg-gradient-to-br from-[#0A1428]/10 via-[#050912]/35 to-[#050912]/70" />
												{selectedBackground === option.id && (
													<div className="absolute inset-0 flex items-center justify-center bg-[#C8AA6E]/10">
														<div className="h-6 w-6 rounded-full bg-[#C8AA6E] flex items-center justify-center">
															<svg className="h-4 w-4 text-[#0A1428]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
															</svg>
														</div>
													</div>
												)}
											</div>
											<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A1428]/95 to-transparent p-2">
												<p className="lol-heading text-[0.6rem] sm:text-xs text-[#C8AA6E] text-center truncate">
													{option.label}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>

						<Button
							onClick={handleDownload}
							type="button"
							className="mt-4 sm:mt-6 w-full lol-heading bg-[#C8AA6E] text-[#0A1428] font-bold uppercase tracking-[0.2em] hover:bg-[#d7b977] border-[#C8AA6E]/60 shadow-[0_18px_40px_rgba(8,12,22,0.5)] transition-transform hover:-translate-y-0.5 focus-visible:ring-[#C8AA6E] text-sm sm:text-base"
							variant="hero"
						>
							<Download className="mr-2 h-4 w-4 text-[#0A1428]" />
							Download Image
						</Button>
						{onDownloadAll && (
							<Button
								type="button"
								onClick={onDownloadAll}
								className="mt-2 w-full lol-heading border-[#C8AA6E]/50 bg-transparent text-[#C8AA6E] font-bold uppercase tracking-[0.2em] hover:bg-[#C8AA6E]/10 text-sm sm:text-base"
								variant="outline"
								disabled={isDownloadingAll}
							>
								{isDownloadingAll ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8AA6E]" />
								) : (
									downloadAllButtonIcon
								)}
								{isDownloadingAll ? "Preparing..." : downloadAllButtonLabel}
							</Button>
						)}
					</div>
					<div className="space-y-6">
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<div className="space-y-2">
										<h4 className="lol-heading text-lg text-[#C8AA6E]">
											Share Caption
										</h4>
										<Textarea
											value={shareCaption}
											onChange={(event) => setShareCaption(event.target.value)}
											rows={6}
											className="resize-none border-[rgba(200,170,110,0.2)] bg-[#0A1428]/60 text-white"
										/>
										<p className="text-xs text-white/60">
											Personalize your message. We'll attach the Rift Rewind
											site automatically.
										</p>
									</div>
									<div className="space-y-2">
										<Label className="lol-heading text-xs tracking-[0.35em] text-[#C8AA6E]/80">
											Website Link
										</Label>
										<Input
											readOnly
											value={CANONICAL_SHARE_URL}
											className="border-[rgba(200,170,110,0.2)] bg-[#0A1428]/60 text-white"
										/>
									</div>
									<Button
										type="button"
										variant="hero"
										className="lol-heading w-full bg-[#C8AA6E] text-[#0A1428] uppercase tracking-[0.25em] text-sm"
										onClick={handleCopyShareText}
									>
										<Copy className="mr-2 h-4 w-4" />
										Copy Caption & Link
									</Button>
									<p className="text-xs text-white/60">
										Your share image refreshes automatically whenever you edit
										the caption or card design.
									</p>
									{shareBusy && (
										<p className="text-xs text-[#FACC15]">
											Updating the stored preview with your latest changes...
										</p>
									)}
								</section>
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<h4 className="lol-heading text-lg text-[#C8AA6E]">
										Share on Social
									</h4>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("telegram")}
										>
											<Send className="h-4 w-4" />
											Telegram
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("whatsapp")}
										>
											<MessageCircle className="h-4 w-4" />
											WhatsApp
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("instagram")}
										>
											<Instagram className="h-4 w-4" />
											Instagram
										</Button>
									</div>
									<p className="text-xs text-white/60">
										Use these quick links for messenger apps. Instagram opens
										the site so you can upload the JPEG manually.
									</p>
								</section>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
