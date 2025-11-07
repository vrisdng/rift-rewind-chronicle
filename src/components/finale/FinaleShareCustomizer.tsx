import { useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
	Copy,
	Download,
	Instagram,
	Loader2,
	MessageCircle,
	Send,
	Share2,
	Sparkles,
	Twitter,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "@/components/ui/sonner";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";
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
type SharePlatform = "x" | "telegram" | "whatsapp" | "instagram";

function buildDefaultShareCaption(playerData: PlayerStats): string {
	const title = playerData.insights?.title || "My League Year";

	return `${title}

${playerData.riotId}'s 2024 Season:
• ${playerData.totalGames} games • ${playerData.winRate.toFixed(1)}% WR
• ${playerData.archetype.name}
• ${playerData.archetype.description}

#RiftRewind #LeagueOfLegends`;
}

function buildShareText(caption: string): string {
	const trimmed = caption.trim();
	return trimmed.length ? `${trimmed}\n${CANONICAL_SHARE_URL}` : CANONICAL_SHARE_URL;
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
	const [showWinRate, setShowWinRate] = useState(true);
	const [showGamesPlayed, setShowGamesPlayed] = useState(true);
	const [showAverageKda, setShowAverageKda] = useState(true);
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
	const [canUseNativeShare, setCanUseNativeShare] = useState(false);
	useEffect(() => {
		if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
			setCanUseNativeShare(true);
		}
	}, []);
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

	// Use controlled state if provided, otherwise use internal state
	const open = controlledOpen ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;
	const {
		variant: triggerVariant = "hero",
		size: triggerSize = "lg",
		className: triggerClassName,
	} = triggerProps ?? {};
	const triggerContentIcon =
		triggerIcon ?? <Sparkles className="mr-2 h-5 w-5 text-[#0A1428]" />;
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
			backgroundColor: "#050505",
		};
	}, [selectedBackgroundOption]);
	const radarData = useMemo(
		() =>
			radarMetricKeys.map((metricKey) => ({
				metric: metricKey,
				label:
					metricKey.charAt(0).toUpperCase() +
					metricKey
						.slice(1)
						.replace(/([A-Z])/g, " $1")
						.trim(),
				value: playerData.derivedMetrics?.[metricKey] ?? 0,
			})),
		[playerData.derivedMetrics],
	);
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
	const handleToggleWinRate = (checked: boolean) => {
		resetShareCard();
		setShowWinRate(checked);
	};
	const handleToggleGamesPlayed = (checked: boolean) => {
		resetShareCard();
		setShowGamesPlayed(checked);
	};
	const handleToggleAverageKda = (checked: boolean) => {
		resetShareCard();
		setShowAverageKda(checked);
	};
	const handleSelectBackground = (optionId: string) => {
		resetShareCard();
		setSelectedBackground(optionId);
	};
	const handleDownload = async () => {
		if (!cardRef.current) {
			return;
		}
		try {
			toast("Preparing share card...");
			const dataUrl = await toPng(cardRef.current, {
				cacheBust: true,
				width: 640,
				height: 388,
				pixelRatio: 1,
				backgroundColor: "#050505",
			});
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
			toast.error("Failed to create PNG. Try again.");
		}
	};
	const handlePrepareShareCard = async () => {
		if (!cardRef.current) {
			toast.error("Card preview is not ready yet.");
			return;
		}
		try {
			setIsGeneratingShareCard(true);
			toast("Preparing share card...");
			const dataUrl = await toPng(cardRef.current, {
				cacheBust: true,
				width: 640,
				height: 388,
				pixelRatio: 1,
				backgroundColor: "#050505",
			});
			const card = await uploadShareCard(dataUrl, trimmedShareCaption);
			toast.success("Share card ready!");
			if (card) {
				// Ensure tab stays on share
				setActiveTab("share");
			}
		} catch (error) {
			console.error(error);
			const message =
				error instanceof Error ? error.message : "Failed to prepare share card";
			toast.error(message);
		} finally {
			setIsGeneratingShareCard(false);
		}
	};
	const handleCopyShareText = async () => {
		const textToCopy = shareText;
		try {
			if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
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
	const handleNativeShare = async () => {
		if (!canUseNativeShare) {
			toast.info("Native sharing is not available on this device.");
			return;
		}
		if (!isShareReady) {
			toast.info("Generate your share image first.");
			return;
		}
		try {
			await navigator.share({
				title: `${playerData.riotId}'s Rift Rewind`,
				text: shareText,
				url: CANONICAL_SHARE_URL,
			});
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				console.error(error);
				toast.error("Sharing was interrupted. Try again.");
			}
		}
	};
	const handleShareToPlatform = (platform: SharePlatform) => {
		if (!isShareReady && platform !== "instagram") {
			toast.info("Generate your share image first.");
			return;
		}

		const encodedText = encodeURIComponent(shareText);
		const encodedCaption = encodeURIComponent(trimmedShareCaption);
		const encodedUrl = encodeURIComponent(CANONICAL_SHARE_URL);

		switch (platform) {
			case "x": {
				const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
				window.open(shareUrl, "_blank", "noopener,noreferrer");
				break;
			}
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
					"Instagram requires manual upload. Copy the caption and share your PNG in the app.",
				);
				window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
				break;
			}
			default:
				break;
		}
	};
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
				className="max-w-[95vw] max-h-[95vh] overflow-y-auto border border-[rgba(200,170,110,0.25)] bg-[#0A1428] text-white shadow-[0_25px_60px_rgba(8,12,22,0.65)] backdrop-blur-xl"
				style={{
					background:
						"linear-gradient(180deg, rgba(10,20,40,0.98) 0%, rgba(22,31,50,0.92) 65%, rgba(10,20,40,0.98) 100%)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="lol-heading text-2xl text-[#C8AA6E]">
						Customize Your Share Card
					</DialogTitle>
					<DialogDescription className="lol-body text-sm text-white/70">
						Tailor your recap, then generate a share-ready caption with quick
						links for your favorite platforms.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,640px)_1fr]">
					<div className="flex flex-col items-center">
						<div className="relative w-[640px]">
							<div
								ref={cardRef}
								className="relative h-[388px] w-[640px] overflow-hidden rounded-[28px] border border-[rgba(200,170,110,0.28)] bg-[#0A1428] shadow-[0_25px_60px_rgba(8,12,22,0.65)] transition-all"
								style={backgroundStyle}
							>
								<div className="absolute inset-0 bg-gradient-to-br from-[#050912]/85 via-[#0A1428]/75 to-[#050912]/95" />
								<div
									className="absolute inset-0 opacity-60"
									style={{
										background:
											"radial-gradient(circle at 18% 20%, rgba(200,170,110,0.32) 0%, transparent 55%), radial-gradient(circle at 82% 18%, rgba(64,119,227,0.22) 0%, transparent 50%)",
									}}
								/>
								{selectedBackground === "radar" && (
									<div className="absolute inset-0 flex items-center justify-center opacity-20">
										<div className="h-full w-full scale-150">
											<ResponsiveContainer width="100%" height="100%">
												<RadarChart data={radarData} outerRadius={120}>
													<PolarGrid stroke="rgba(255,255,255,0.4)" />
													<PolarAngleAxis
														dataKey="label"
														tick={{
															fill: "rgba(255,255,255,0.6)",
															fontSize: 14,
														}}
													/>
													<PolarRadiusAxis
														angle={30}
														domain={[0, 100]}
														stroke="rgba(255,255,255,0.4)"
													/>
													<Radar
														name="Profile"
														dataKey="value"
														stroke="hsl(var(--primary))"
														fill="hsl(var(--primary))"
														fillOpacity={0.5}
														strokeWidth={2}
													/>
												</RadarChart>
											</ResponsiveContainer>
										</div>
									</div>
								)}
								<div className="relative flex h-full flex-col justify-between p-9 text-white lol-body">
									<header className="space-y-4">
										<p className="lol-subheading text-[0.65rem] tracking-[0.45em] text-[#C8AA6E]/70">
											Rift Rewind Chronicle
										</p>
										<div className="lol-accent-bar pl-4">
											<p className="lol-subheading text-[0.65rem] tracking-[0.5em] text-[#C8AA6E]/65">
												Summoner
											</p>
											<h2 className="lol-heading text-3xl text-white drop-shadow-[0_0_25px_rgba(10,20,40,0.65)]">
												{playerData.riotId}
												<span className="ml-2 text-[#C8AA6E]/70">
													#{playerData.tagLine}
												</span>
											</h2>
										</div>
									</header>
									<div className="space-y-5">
										<div className="space-y-2 text-left">
											<p className="lol-subheading text-[0.7rem] tracking-[0.45em] text-[#C8AA6E]/65">
												Archetype
											</p>
											<h3 className="lol-heading text-[2.4rem] text-white tracking-[0.22em] drop-shadow-[0_0_35px_rgba(10,20,40,0.7)]">
												{playerData.archetype.name}
											</h3>
											<p className="text-sm leading-relaxed text-white/75">
												{playerData.archetype.description}
											</p>
										</div>
										{!!statBlocks.length && (
											<div className="grid grid-cols-3 gap-3">
												{statBlocks.map((stat) => (
													<div
														key={stat.label}
														className="lol-card border-[rgba(200,170,110,0.3)] bg-[#0A1428]/70 p-4 text-left shadow-[0_12px_20px_rgba(8,12,22,0.4)]"
													>
														<p className="lol-subheading text-[0.6rem] tracking-[0.45em] text-[#C8AA6E]/70">
															{stat.label}
														</p>
														<p className="lol-heading text-2xl text-white tracking-[0.08em]">
															{stat.value}
														</p>
													</div>
												))}
											</div>
										)}
									</div>
									<footer className="flex items-center justify-between lol-subheading text-[0.6rem] tracking-[0.45em] text-[#C8AA6E]/70">
										<span className="uppercase">
											Season{" "}
											{new Date(playerData.generatedAt).getFullYear() || 2025}
										</span>
										<span className="uppercase">
											{playerData.riotId.replace(/\s+/g, "")}
										</span>
									</footer>
								</div>
							</div>
						</div>
						<Button
							onClick={handleDownload}
							type="button"
							className="mt-6 w-full lol-heading bg-[#C8AA6E] text-[#0A1428] font-bold uppercase tracking-[0.2em] hover:bg-[#d7b977] border-[#C8AA6E]/60 shadow-[0_18px_40px_rgba(8,12,22,0.5)] transition-transform hover:-translate-y-0.5 focus-visible:ring-[#C8AA6E]"
							variant="hero"
						>
							<Download className="mr-2 h-4 w-4 text-[#0A1428]" />
							Download PNG
						</Button>
						{onDownloadAll && (
							<Button
								type="button"
								onClick={onDownloadAll}
								className="mt-2 w-full lol-heading border-[#C8AA6E]/50 bg-transparent text-[#C8AA6E] font-bold uppercase tracking-[0.2em] hover:bg-[#C8AA6E]/10"
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
						<Tabs
							value={activeTab}
							onValueChange={(value) =>
								setActiveTab(value as "customize" | "share")
							}
						>
							<TabsList className="w-full justify-start rounded-xl border border-[rgba(200,170,110,0.25)] bg-[#0A1428]/70 p-1 text-white/70">
								<TabsTrigger
									value="customize"
									className="lol-heading flex-1 rounded-lg text-xs tracking-[0.35em] uppercase data-[state=active]:bg-[#C8AA6E]/20 data-[state=active]:text-white"
								>
									Customize Card
								</TabsTrigger>
								<TabsTrigger
									value="share"
									className="lol-heading flex-1 rounded-lg text-xs tracking-[0.35em] uppercase data-[state=active]:bg-[#C8AA6E]/20 data-[state=active]:text-white"
								>
									Share
								</TabsTrigger>
							</TabsList>
							<TabsContent value="customize" className="mt-4 space-y-6">
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<h4 className="lol-heading text-lg text-[#C8AA6E]">
										Display Options
									</h4>
									<div className="space-y-4">
										<div className="flex items-center justify-between rounded-xl border border-[rgba(200,170,110,0.18)] bg-[#0A1428]/60 px-4 py-3 backdrop-blur-sm">
											<div>
												<Label
													htmlFor="show-winrate"
													className="lol-heading text-xs tracking-[0.35em] text-[#C8AA6E]/80"
												>
													Win Rate
												</Label>
												<p className="text-[0.7rem] text-white/60">
													Show your season win percentage.
												</p>
											</div>
											<Switch
												id="show-winrate"
												checked={showWinRate}
												onCheckedChange={handleToggleWinRate}
											/>
										</div>
										<div className="flex items-center justify-between rounded-xl border border-[rgba(200,170,110,0.18)] bg-[#0A1428]/60 px-4 py-3 backdrop-blur-sm">
											<div>
												<Label
													htmlFor="show-games"
													className="lol-heading text-xs tracking-[0.35em] text-[#C8AA6E]/80"
												>
													Games Played
												</Label>
												<p className="text-[0.7rem] text-white/60">
													Highlight your total matches played.
												</p>
											</div>
											<Switch
												id="show-games"
												checked={showGamesPlayed}
												onCheckedChange={handleToggleGamesPlayed}
											/>
										</div>
										<div className="flex items-center justify-between rounded-xl border border-[rgba(200,170,110,0.18)] bg-[#0A1428]/60 px-4 py-3 backdrop-blur-sm">
											<div>
												<Label
													htmlFor="show-kda"
													className="lol-heading text-xs tracking-[0.35em] text-[#C8AA6E]/80"
												>
													Average KDA
												</Label>
												<p className="text-[0.7rem] text-white/60">
													Include your average kill/death/assist ratio.
												</p>
											</div>
											<Switch
												id="show-kda"
												checked={showAverageKda}
												onCheckedChange={handleToggleAverageKda}
											/>
										</div>
									</div>
								</section>
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<h4 className="lol-heading text-lg text-[#C8AA6E]">
										Background
									</h4>
									<p className="text-sm text-white/65">
										Choose between your top champion splash art or stock
										backdrops.
									</p>
									<div className="grid grid-cols-2 gap-4">
										{backgroundOptions.map((option) => (
											<button
												key={option.id}
												type="button"
												onClick={() => handleSelectBackground(option.id)}
												className={cn(
													"group relative overflow-hidden rounded-xl border border-[rgba(200,170,110,0.2)] bg-[#0A1428]/60 p-[1px] transition-all focus:outline-none focus:ring-2 focus:ring-[#C8AA6E]/60",
													selectedBackground === option.id
														? "border-[#C8AA6E]/60 shadow-[0_12px_30px_rgba(200,170,110,0.18)]"
														: "hover:border-[#C8AA6E]/40",
												)}
											>
												<div
													className="relative h-24 w-full overflow-hidden rounded-[10px] bg-[#050912]"
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
												</div>
												<div className="p-3 text-left">
													<p className="lol-heading text-sm text-[#C8AA6E]">
														{option.label}
													</p>
													{option.description && (
														<p className="text-[0.7rem] text-white/65">
															{option.description}
														</p>
													)}
												</div>
											</button>
										))}
									</div>
								</section>
							</TabsContent>
							<TabsContent value="share" className="mt-4 space-y-6">
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
											Personalize your message. We’ll attach the Rift Rewind
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
									{shareCard && !isShareReady && (
										<p className="text-xs text-[#FACC15]">
											Caption or design changed. Regenerate to update your
											share link.
										</p>
									)}
								</section>
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<div className="flex flex-wrap gap-3">
										<Button
											type="button"
											variant="hero"
											className="lol-heading flex-1 min-w-[160px] bg-[#C8AA6E] text-[#0A1428] uppercase tracking-[0.25em]"
											onClick={handleCopyShareText}
										>
											<Copy className="mr-2 h-4 w-4" />
											Copy Caption
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex-1 min-w-[200px] uppercase tracking-[0.25em] border-[#C8AA6E]/50 text-[#C8AA6E]"
											onClick={handlePrepareShareCard}
											disabled={shareBusy}
										>
											{shareBusy ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Share2 className="mr-2 h-4 w-4" />
											)}
											{isShareReady ? "Regenerate Image" : "Generate Share Image"}
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex-1 min-w-[180px] uppercase tracking-[0.25em] border-[#C8AA6E]/50 text-[#C8AA6E]"
											onClick={handleNativeShare}
											disabled={!canUseNativeShare || shareBusy || !isShareReady}
										>
											<Send className="mr-2 h-4 w-4" />
											Share via Device
										</Button>
									</div>
									{shareCard && (
										<div className="rounded-xl border border-[rgba(200,170,110,0.2)] bg-[#0A1428]/60 p-4">
											<p className="lol-heading text-xs tracking-[0.35em] text-[#C8AA6E]/80 uppercase">
												Stored Preview
											</p>
											<div className="mt-3 overflow-hidden rounded-lg border border-[rgba(200,170,110,0.2)] bg-[#050912]/80">
												<img
													src={shareCard.imageUrl}
													alt="Rift Rewind share card preview"
													className="w-full object-contain"
												/>
											</div>
											<p className="mt-2 text-[0.65rem] text-white/55">
												Ready for sharing — saved{" "}
												{new Date(shareCard.createdAt).toLocaleString()}
											</p>
										</div>
									)}
								</section>
								<section className="space-y-4 rounded-2xl lol-card border-[rgba(200,170,110,0.25)] bg-[#0A1428]/85 p-6 shadow-[0_15px_30px_rgba(8,12,22,0.45)]">
									<h4 className="lol-heading text-lg text-[#C8AA6E]">
										Share on Social
									</h4>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("x")}
											disabled={!isShareReady || shareBusy}
										>
											<Twitter className="h-4 w-4" />
											X
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("telegram")}
											disabled={!isShareReady || shareBusy}
										>
											<Send className="h-4 w-4" />
											Telegram
										</Button>
										<Button
											type="button"
											variant="outline"
											className="lol-heading flex items-center justify-center gap-2 border-[#C8AA6E]/40 text-[#C8AA6E]"
											onClick={() => handleShareToPlatform("whatsapp")}
											disabled={!isShareReady || shareBusy}
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
									{!isShareReady && (
										<p className="text-xs text-white/60">
											Generate your share image to unlock quick-share buttons.
										</p>
									)}
								</section>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
