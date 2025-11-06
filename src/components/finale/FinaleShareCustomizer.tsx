import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { PlayerStats } from "@/lib/api";
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
import { cn } from "@/lib/utils";
import { Download, Loader2, Sparkles } from "lucide-react";
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
}
const radarMetricKeys: Array<keyof PlayerStats["derivedMetrics"]> = [
	"vision",
	"farming",
	"roaming",
	"aggression",
	"teamfighting",
];
export const FinaleShareCustomizer = ({
	playerData,
	triggerLabel,
	triggerIcon,
	triggerProps,
	onDownloadAll,
	isDownloadingAll = false,
	downloadAllLabel,
	downloadAllIcon,
}: FinaleShareCustomizerProps) => {
	const [open, setOpen] = useState(false);
	const [showWinRate, setShowWinRate] = useState(true);
	const [showGamesPlayed, setShowGamesPlayed] = useState(true);
	const [showAverageKda, setShowAverageKda] = useState(true);
	const [selectedBackground, setSelectedBackground] = useState<string>("navy");
	const cardRef = useRef<HTMLDivElement | null>(null);
	const {
		variant: triggerVariant = "hero",
		size: triggerSize = "lg",
		className: triggerClassName,
	} = triggerProps ?? {};
	const triggerContentIcon = triggerIcon ?? (
		<Sparkles className="mr-2 h-5 w-5" />
	);
	const triggerButtonClassName = cn(
		"text-lg px-12 py-6 h-auto",
		triggerClassName,
	);
	const downloadAllButtonLabel = downloadAllLabel ?? "Download Recap Cards";
	const downloadAllButtonIcon = downloadAllIcon ?? (
		<Sparkles className="mr-2 h-4 w-4" />
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
		const colorOptions: BackgroundOption[] = [
			{
				id: "navy",
				label: "Navy Nebula",
				description: "Deep navy gradient",
				type: "gradient",
				value: "linear-gradient(135deg, #081129 0%, #0f213f 60%, #050715 100%)",
			},
			{
				id: "black",
				label: "Midnight Black",
				description: "Pure black finish",
				type: "color",
				value: "#050505",
			},
			{
				id: "radar",
				label: "Playstyle Radar",
				description: "Show radar as background",
				type: "gradient",
				value: "linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)",
			},
		];
		const placeholderOptions: BackgroundOption[] = [
			{
				id: "placeholder-aurora",
				label: "Arcane Aurora",
				description: "Violet & teal glow",

				type: "gradient",
				value:
					"linear-gradient(140deg, rgba(33,16,70,0.92) 0%, rgba(17,62,95,0.88) 100%)",
			},
			{
				id: "placeholder-sunrise",
				label: "Piltover Sunrise",
				description: "Warm horizon",
				type: "gradient",
				value:
					"linear-gradient(145deg, rgba(25,13,33,0.96) 0%, rgba(104,68,34,0.85) 100%)",
			},
		];
		return [...championOptions, ...colorOptions, ...placeholderOptions];
	}, [playerData.topChampions]);
	useEffect(() => {
		if (!backgroundOptions.length) {
			setSelectedBackground("navy");
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
			<DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						Customize Your Share Card
					</DialogTitle>
					<DialogDescription>
						Tailor the details you want to highlight before downloading a
						share-ready PNG.
					</DialogDescription>
				</DialogHeader>
				<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,640px)_1fr]">
					<div className="flex flex-col items-center">
						<div className="relative w-[640px]">
							<div
								ref={cardRef}
								className="relative h-[388px] w-[640px] overflow-hidden rounded-[24px] border border-white/10 shadow-2xl transition-all"
								style={backgroundStyle}
							>
								<div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/70" />
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
								<div className="relative flex h-full flex-col justify-between p-8 text-white">
									<header className="space-y-3">
										<p className="text-xs uppercase tracking-[0.45em] text-white/70">
											Rift Rewind Chronicle
										</p>
										<div>
											<p className="text-sm uppercase tracking-[0.35em] text-primary/80">
												Summoner
											</p>
											<h2 className="text-2xl font-semibold">
												{playerData.riotId}
												<span className="text-white/70">
													#{playerData.tagLine}
												</span>
											</h2>
										</div>
									</header>
									<div className="space-y-4">
										<div className="space-y-2 text-left">
											<p className="text-sm uppercase tracking-[0.45em] text-white/60">
												Archetype
											</p>
											<h3 className="text-4xl font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.55)]">
												{playerData.archetype.name}
											</h3>
											<p className="text-base text-white/75">
												{playerData.archetype.description}
											</p>
										</div>
										{!!statBlocks.length && (
											<div className="grid grid-cols-3 gap-3">
												{statBlocks.map((stat) => (
													<div
														key={stat.label}
														className="rounded-lg border border-white/20 bg-transparent p-3 text-left backdrop-blur-sm"
													>
														<p className="text-xs uppercase tracking-[0.35em] text-white/70">
															{stat.label}
														</p>
														<p className="text-2xl font-semibold text-white">
															{stat.value}
														</p>
													</div>
												))}
											</div>
										)}
									</div>
									<footer className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
										<span>
											Season{" "}
											{new Date(playerData.generatedAt).getFullYear() || 2025}
										</span>
										<span>{playerData.riotId.replace(/\s+/g, "")}</span>
									</footer>
								</div>
							</div>
						</div>
						<Button
							onClick={handleDownload}
							type="button"
							className="mt-6 w-full"
							variant="hero"
						>
							<Download className="mr-2 h-4 w-4" />
							Download PNG
						</Button>
						{onDownloadAll && (
							<Button
								type="button"
								onClick={onDownloadAll}
								className="mt-2 w-full"
								variant="outline"
								disabled={isDownloadingAll}
							>
								{isDownloadingAll ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									downloadAllButtonIcon
								)}
								{isDownloadingAll ? "Preparing..." : downloadAllButtonLabel}
							</Button>
						)}
					</div>
					<div className="space-y-8">
						<section className="space-y-4 rounded-2xl border border-border bg-background/60 p-6 backdrop-blur">
							<h4 className="text-lg font-semibold">Display Options</h4>
							<div className="space-y-4">
								<div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3">
									<div>
										<Label
											htmlFor="show-winrate"
											className="text-sm font-medium"
										>
											Win Rate
										</Label>
										<p className="text-xs text-muted-foreground">
											Show your season win percentage.
										</p>
									</div>
									<Switch
										id="show-winrate"
										checked={showWinRate}
										onCheckedChange={setShowWinRate}
									/>
								</div>
								<div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3">
									<div>
										<Label htmlFor="show-games" className="text-sm font-medium">
											Games Played
										</Label>
										<p className="text-xs text-muted-foreground">
											Highlight your total matches played.
										</p>
									</div>
									<Switch
										id="show-games"
										checked={showGamesPlayed}
										onCheckedChange={setShowGamesPlayed}
									/>
								</div>
								<div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3">
									<div>
										<Label htmlFor="show-kda" className="text-sm font-medium">
											Average KDA
										</Label>
										<p className="text-xs text-muted-foreground">
											Include your average kill/death/assist ratio.
										</p>
									</div>
									<Switch
										id="show-kda"
										checked={showAverageKda}
										onCheckedChange={setShowAverageKda}
									/>
								</div>
							</div>
						</section>
						<section className="space-y-4 rounded-2xl border border-border bg-background/60 p-6 backdrop-blur">
							<h4 className="text-lg font-semibold">Background</h4>
							<p className="text-sm text-muted-foreground">
								Choose between your top champion splash art or stock backdrops.
							</p>
							<div className="grid grid-cols-2 gap-4">
								{backgroundOptions.map((option) => (
									<button
										key={option.id}
										type="button"
										onClick={() => setSelectedBackground(option.id)}
										className={cn(
											"group relative overflow-hidden rounded-xl border border-transparent p-[1px] transition-all focus:outline-none focus:ring-2 focus:ring-primary",
											selectedBackground === option.id
												? "border-primary shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
												: "hover:border-primary/30",
										)}
									>
										<div
											className="relative h-24 w-full overflow-hidden rounded-[10px] bg-black"
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
											<div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/20 to-black/60" />
										</div>
										<div className="p-3 text-left">
											<p className="text-sm font-medium text-foreground">
												{option.label}
											</p>
											{option.description && (
												<p className="text-xs text-muted-foreground">
													{option.description}
												</p>
											)}
										</div>
									</button>
								))}
							</div>
						</section>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
