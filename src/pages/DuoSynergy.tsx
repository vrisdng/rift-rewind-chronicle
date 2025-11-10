import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
	Activity,
	Brain,
	Compass,
	Droplets,
	Flame,
	Goal,
	Loader2,
	Shield,
	Sparkles,
	Target,
	Wind,
	type LucideIcon,
} from "lucide-react";
import {
	RadarChart,
	ResponsiveContainer,
	Radar,
	PolarGrid,
	PolarAngleAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
	type DuoSynergyProfile,
	type DuoBondType,
	type PlayerStats,
	type ProgressUpdate,
	analyzePlayerWithProgress,
	fetchDuoSynergy,
	getPlayer,
} from "@/lib/api";
import { loadPlayerSnapshot } from "@/lib/player-storage";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUESTION_OPTIONS = {
	midFights: "Why do we lose mid-game fights?",
	closeGames: "How do we close out early leads?",
	tilt: "How do we stop the tilt chain after one of us dies?",
} as const;

const TRAIT_DIMENSIONS = [
	"Durability",
	"Burst",
	"Utility",
	"Control",
	"Mobility",
] as const;

const bondVisuals: Record<
	DuoBondType,
	{ icon: LucideIcon; fallbackAura: string }
> = {
	inferno: { icon: Flame, fallbackAura: "from-orange-500/20 via-red-500/10 to-transparent" },
	tide: { icon: Droplets, fallbackAura: "from-sky-500/20 via-cyan-500/10 to-transparent" },
	terra: { icon: Shield, fallbackAura: "from-emerald-500/15 via-lime-500/5 to-transparent" },
	gale: { icon: Wind, fallbackAura: "from-fuchsia-500/20 via-blue-500/10 to-transparent" },
};

const parseHandle = (input: string) => {
	const trimmed = input.trim();
	const [gameNameRaw = "", tagRaw = ""] = trimmed.split("#");
	const gameName = gameNameRaw.trim();
	const tagLine = (tagRaw || "NA1").trim().toUpperCase();
	return {
		gameName,
		tagLine,
		display: `${gameName}${tagLine ? `#${tagLine}` : ""}`,
	};
};

const formatPercent = (value: number, digits = 0) =>
	`${(value * 100).toFixed(digits)}%`;

const formatSigned = (value: number, unit = "") => {
	const sign = value > 0 ? "+" : "";
	return `${sign}${value}${unit}`;
};

const DuoSynergy = () => {
	const navigate = useNavigate();
	const snapshot = loadPlayerSnapshot();
	const { toast } = useToast();
	const playerAHandle = snapshot
		? `${snapshot.riotId}${snapshot.tagLine ? `#${snapshot.tagLine}` : ""}`
		: "";
	const sessionRegion = snapshot?.region || "sea";
	const [partnerHandle, setPartnerHandle] = useState("");
	const [partnerProgress, setPartnerProgress] = useState<ProgressUpdate | null>(null);
	const [analysis, setAnalysis] = useState<DuoSynergyProfile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [questionKey, setQuestionKey] =
		useState<keyof typeof QUESTION_OPTIONS>("midFights");
	const [adviceRevealed, setAdviceRevealed] = useState(false);

	const bondTheme = analysis
		? bondVisuals[analysis.bond.type]
		: bondVisuals.inferno;
	const BondIcon = bondTheme.icon;

	const triangleData = useMemo(() => {
		if (!analysis) return [];
		return [
			{ axis: "Mechanics ΔWR", value: Math.round(analysis.bond.triangle.mechanics * 100) },
			{ axis: "Coordination", value: Math.round(analysis.bond.triangle.coordination * 100) },
			{ axis: "Discipline", value: Math.round(analysis.bond.triangle.discipline * 100) },
		];
	}, [analysis]);

	const tacticalMetrics = useMemo(() => {
		if (!analysis) return [];
		return [
			{
				label: "Co-kill ratio",
				value: analysis.tactical.coKill,
				description: "Kills where both contributed.",
			},
			{
				label: "Objective overlap",
				value: analysis.tactical.objectiveOverlap,
				description: "Joint dragons/barons/control plays.",
			},
			{
				label: "Lead conversion",
				value: analysis.tactical.leadConversion,
				description: "How efficiently you close out.",
			},
		];
	}, [analysis]);

	const ensurePartnerReady = async (
		riotId: string,
		tagLine: string,
	): Promise<PlayerStats> => {
		const cached = await getPlayer(riotId, tagLine);
		if (cached.success && cached.data) {
			return cached.data;
		}

		toast({
			title: "Fetching duo partner",
			description: `Pulling matches for ${riotId}#${tagLine}...`,
		});

		return new Promise<PlayerStats>((resolve, reject) => {
			setPartnerProgress({
				stage: "queued",
				message: "Contacting Riot API...",
				progress: 5,
			});
			analyzePlayerWithProgress(
				riotId,
				tagLine,
				sessionRegion,
				(update) => setPartnerProgress(update),
				(data) => {
					setPartnerProgress(null);
					resolve(data);
				},
				(errorMessage) => {
					setPartnerProgress(null);
					reject(
						new Error(errorMessage || "Failed to analyze duo partner."),
					);
				},
			).catch((error) => {
				setPartnerProgress(null);
				reject(error);
			});
		});
	};

	const handleAnalyze = async () => {
		if (!snapshot) {
			toast({
				title: "Player missing",
				description: "Analyze your own profile first from the landing page.",
				variant: "destructive",
			});
			return;
		}

		if (!partnerHandle.trim()) {
			toast({
				title: "Missing duo info",
				description: "Enter both Riot IDs to compute synergy.",
				variant: "destructive",
			});
			return;
		}

		const handleB = parseHandle(partnerHandle);

		if (!handleB.gameName) {
			toast({
				title: "Invalid Riot ID",
				description: "Use format GameName#TAG",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await ensurePartnerReady(handleB.gameName, handleB.tagLine);

			const data = await fetchDuoSynergy({
				playerA: {
					riotId: snapshot.riotId,
					tagLine: snapshot.tagLine,
					region: sessionRegion,
				},
				playerB: {
					riotId: handleB.gameName,
					tagLine: handleB.tagLine,
					region: sessionRegion,
				},
			});
			setAnalysis(data);
			setAdviceRevealed(false);
			toast({
				title: "Synergy generated",
				description: `${playerAHandle || snapshot.riotId} + ${handleB.display}`,
			});
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to compute duo synergy.";
			setError(message);
			toast({
				title: "Synergy failed",
				description: message,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
			setPartnerProgress(null);
		}
	};

	return (
		<div className="min-h-screen bg-[#030712] text-white">
			<div className="relative bg-gradient-to-b from-[#050914] via-[#070b1a] to-[#030712]">
				<div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at top, rgba(200,170,110,0.15), transparent 45%)" }} />
				<main className="relative z-10 mx-auto max-w-6xl px-4 py-16 space-y-8">
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							className="text-white hover:text-white hover:bg-white/10"
							onClick={() => navigate(-1)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
					</div>
					<header className="space-y-4 text-center">
						<Badge className="bg-[#C8AA6E]/20 text-[#C8AA6E] border border-[#C8AA6E]/50">
							Duo Synergy AI
						</Badge>
						<h1 className="text-4xl md:text-5xl font-semibold">
							Find Your Duo Bond
						</h1>
						<p className="text-white/70 max-w-3xl mx-auto">
							Plug in another player&apos;s Riot ID and let the backend crunch every shared match to map ΔWR, tactical overlap, champion style fit, and even mental curves.
						</p>
					</header>

					<section className="grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
						<div
							className={cn(
								"relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-2xl bg-gradient-to-br",
								analysis ? analysis.bond.aura : bondTheme.fallbackAura,
							)}
						>
							<div className="absolute inset-0 opacity-30 blur-3xl pointer-events-none" />
							{analysis ? (
								<div className="relative space-y-6">
									<div className="flex items-center gap-3">
										<div className="rounded-full bg-black/40 p-3 border border-white/20">
											<BondIcon className="h-6 w-6 text-[#C8AA6E]" />
										</div>
										<div>
											<p className="text-sm uppercase tracking-[0.2em] text-white/70">
												{analysis.bond.label}
											</p>
											<p className="text-2xl font-semibold">
												{analysis.bond.nickname}
											</p>
											<p className="text-white/70 text-sm">
												{analysis.bond.description}
											</p>
										</div>
									</div>

									<div>
										<div className="flex items-center justify-between text-sm uppercase text-white/70">
											<span>Bond Bar</span>
											<span className="font-semibold text-white">
												{analysis.bond.score}
											</span>
										</div>
										<div className="mt-2 h-3 w-full rounded-full bg-white/20 overflow-hidden">
											<div
												className="h-full rounded-full bg-[#C8AA6E]"
												style={{ width: `${analysis.bond.score}%` }}
											/>
										</div>
										<p className="text-xs text-white/60 mt-2">
											Weighted mix of ΔWR mechanics, coordination, discipline, and comeback resilience.
										</p>
									</div>

									<div className="grid grid-cols-3 gap-4 text-center">
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
											<p className="text-sm text-white/60">Duo WR</p>
											<p className="text-2xl font-semibold">
												{formatPercent(analysis.statistical.wrDuo, 0)}
											</p>
										</div>
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
											<p className="text-sm text-white/60">ΔWR vs solo</p>
											<p className="text-2xl font-semibold">
												{formatPercent(analysis.statistical.deltaWR, 1)}
											</p>
										</div>
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
											<p className="text-sm text-white/60">Confidence</p>
											<p className="text-2xl font-semibold">
												{formatPercent(analysis.statistical.sampleConfidence, 0)}
											</p>
											<p className="text-xs text-white/60">
												{analysis.statistical.sampleSize} duo games
											</p>
										</div>
									</div>

									<div className="rounded-2xl bg-black/20 border border-white/10 p-4 flex flex-col gap-1 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-white/60">
												{analysis.playerA.identity.display}
											</span>
											<span className="font-semibold">
												{analysis.playerA.role}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-white/60">
												{analysis.playerB.identity.display}
											</span>
											<span className="font-semibold">
												{analysis.playerB.role}
											</span>
										</div>
										<p className="text-xs text-white/60 mt-2">
											Expected WR formula: WR<sub>duo</sub> - (1 - (1 - WR<sub>A</sub>)·(1 - WR<sub>B</sub>))
										</p>
									</div>
								</div>
							) : (
								<div className="relative space-y-4 text-center">
									<p className="text-lg font-semibold">Awaiting Bond</p>
									<p className="text-white/70 text-sm">
										Run a duo scan to unlock your bond score, triangle, and AI commentary.
									</p>
								</div>
							)}
						</div>

						<Card className="border-white/10 bg-white/[0.02] backdrop-blur">
							<CardHeader>
								<CardTitle>Duo Inputs</CardTitle>
								<p className="text-sm text-white/70">
									Player one comes from your last analysis. Add your duo partner&apos;s Riot ID (we&apos;ll reuse your region automatically) and we&apos;ll pull Riot API data.
								</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label className="text-xs uppercase text-white/60">
										Player One (you)
									</label>
									<Input
										value={playerAHandle}
										readOnly
										disabled={!snapshot}
										className={cn(
											"bg-black/40 border-white/10",
											!snapshot && "opacity-60",
										)}
										placeholder="Analyze yourself first"
									/>
									<p className="text-xs text-white/50">
										Locked to your latest analysis session. Re-run it to update.
									</p>
								</div>
								<div className="space-y-2">
									<label className="text-xs uppercase text-white/60">
										Duo Partner
									</label>
									<Input
										value={partnerHandle}
										onChange={(event) => setPartnerHandle(event.target.value)}
										className="bg-black/40 border-white/10"
										placeholder="ThreshSensei#NA1"
									/>
									<p className="text-xs text-white/50">
										Region locks to your session ({sessionRegion.toUpperCase()}).
									</p>
								</div>
								{partnerProgress && (
									<div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2 text-xs text-white/70">
										<div className="flex items-center justify-between uppercase text-[11px] tracking-wide text-white/50">
											<span>{partnerProgress.stage}</span>
											<span>{Math.round(partnerProgress.progress ?? 0)}%</span>
										</div>
										<Progress
											value={partnerProgress.progress}
											className="h-2 bg-white/10"
										/>
										<p className="text-white/60">{partnerProgress.message}</p>
									</div>
								)}
								<Button
									className="w-full bg-[#C8AA6E] text-black font-semibold hover:bg-[#d7bd8f]"
									onClick={handleAnalyze}
									disabled={isLoading || !snapshot}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Forging...
										</>
									) : (
										"Forge Synergy"
									)}
								</Button>
								{error && (
									<p className="text-sm text-rose-400">{error}</p>
								)}
							</CardContent>
						</Card>
					</section>

					{analysis ? (
						<>
							<section className="grid gap-6 lg:grid-cols-2">
								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Target className="h-5 w-5 text-[#C8AA6E]" />
											Statistical Synergy
										</CardTitle>
										<p className="text-sm text-white/70">
											ΔWR adjusted by sample confidence plus per-match deltas vs each solo baseline.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-3 gap-3 text-center text-sm">
											<div className="rounded-xl bg-black/30 border border-white/10 p-3">
												<p className="text-white/60">Solo WR A</p>
												<p className="text-xl font-semibold">
													{formatPercent(analysis.playerA.soloWinRate, 0)}
												</p>
											</div>
											<div className="rounded-xl bg-black/30 border border-white/10 p-3">
												<p className="text-white/60">Solo WR B</p>
												<p className="text-xl font-semibold">
													{formatPercent(analysis.playerB.soloWinRate, 0)}
												</p>
											</div>
											<div className="rounded-xl bg-black/30 border border-white/10 p-3">
												<p className="text-white/60">Expected WR</p>
												<p className="text-xl font-semibold">
													{formatPercent(analysis.statistical.baselineWR, 0)}
												</p>
											</div>
										</div>

										<table className="w-full text-sm">
											<thead className="text-white/60">
												<tr className="text-left">
													<th className="pb-2">Metric</th>
													<th className="pb-2">{analysis.playerA.identity.short}</th>
													<th className="pb-2">{analysis.playerB.identity.short}</th>
												</tr>
											</thead>
											<tbody className="text-white/80">
												{[
													{
														label: "CS delta",
														values: analysis.statistical.perMatch.cs,
													},
													{
														label: "Death delta",
														values: analysis.statistical.perMatch.deaths,
													},
													{
														label: "Objective delta",
														values: analysis.statistical.perMatch.objectives,
													},
												].map((row) => (
													<tr key={row.label}>
														<td className="py-2 text-white/60">{row.label}</td>
														<td
															className={cn(
																"py-2 font-semibold",
																row.values.a >= 0
																	? "text-emerald-400"
																	: "text-rose-400",
															)}
														>
															{formatSigned(row.values.a)}
														</td>
														<td
															className={cn(
																"py-2 font-semibold",
																row.values.b >= 0
																	? "text-emerald-400"
																	: "text-rose-400",
															)}
														>
															{formatSigned(row.values.b)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
										<p className="text-xs text-white/60">
											Objective delta reflects dragons/barons taken together beyond each player&apos;s solo average (vision + control proxy).
										</p>
									</CardContent>
								</Card>

								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Activity className="h-5 w-5 text-[#C8AA6E]" />
											Synergy Triangle
										</CardTitle>
										<p className="text-sm text-white/70">
											Mechanics (ΔWR), coordination (co-kill/objectives), and discipline (deaths/vision) define the bond type.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="h-64">
											<ResponsiveContainer width="100%" height="100%">
												<RadarChart data={triangleData}>
													<PolarGrid stroke="rgba(255,255,255,0.2)" />
													<PolarAngleAxis
														dataKey="axis"
														tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
													/>
													<Radar
														dataKey="value"
														stroke="#C8AA6E"
														fill="#C8AA6E"
														fillOpacity={0.35}
													/>
												</RadarChart>
											</ResponsiveContainer>
										</div>
										<div className="grid grid-cols-3 gap-3 text-center text-sm">
											{triangleData.map((entry) => (
												<div key={entry.axis}>
													<p className="text-white/60">{entry.axis}</p>
													<p className="text-xl font-semibold">{entry.value}</p>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</section>

							<section className="grid gap-6 lg:grid-cols-2">
								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Compass className="h-5 w-5 text-[#C8AA6E]" />
											Tactical Synergy
										</CardTitle>
										<p className="text-sm text-white/70">
											Fight overlap, objective timing, and roam synchronization.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										{tacticalMetrics.map((metric) => (
											<div key={metric.label}>
												<div className="flex items-center justify-between text-sm">
													<div>
														<p>{metric.label}</p>
														<p className="text-white/60">{metric.description}</p>
													</div>
													<span className="font-semibold">
														{formatPercent(metric.value, 0)}
													</span>
												</div>
												<Progress
													value={metric.value * 100}
													className="mt-2 h-2 bg-white/10"
												/>
											</div>
										))}
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4 flex items-center justify-between">
											<div>
												<p className="text-sm text-white/60">Roam sync gap</p>
												<p className="text-2xl font-semibold">
													{analysis.tactical.roamSyncSeconds.toFixed(1)}s
												</p>
											</div>
											<p className="text-sm text-white/70 max-w-xs">
												Average arrival difference when collapsing on mid-late fights. Target &lt; 3s.
											</p>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Sparkles className="h-5 w-5 text-[#C8AA6E]" />
											Style Synergy
										</CardTitle>
										<p className="text-sm text-white/70">
											Champion trait vectors (tags, damage, range, CC) drive similarity and complementarity.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-3 text-center text-sm">
											<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
												<p className="text-white/60">Cosine similarity</p>
												<p className="text-2xl font-semibold">
													{formatPercent(analysis.style.similarity, 0)}
												</p>
											</div>
											<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
												<p className="text-white/60">Complementarity</p>
												<p className="text-2xl font-semibold">
													{formatPercent(analysis.style.complementarity, 0)}
												</p>
											</div>
										</div>
										<p className="text-white/70">{analysis.style.pairingStory}</p>
										<div className="flex flex-wrap gap-2">
											{analysis.style.tags.map((tag) => (
												<Badge
													key={tag}
													className="bg-white/10 border border-white/20 text-white"
												>
													{tag}
												</Badge>
											))}
										</div>
										<div className="grid grid-cols-5 gap-2 text-center text-xs text-white/60">
											{TRAIT_DIMENSIONS.map((dimension, index) => (
												<div
													key={dimension}
													className="rounded-xl bg-black/40 border border-white/10 p-3"
												>
													<p>{dimension}</p>
													<p className="text-white font-semibold">
														{(
															(analysis.playerA.traitVector[index] +
																analysis.playerB.traitVector[index]) /
															2
														).toFixed(2)}
													</p>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</section>

							<section className="grid gap-6 lg:grid-cols-2">
								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Brain className="h-5 w-5 text-[#C8AA6E]" />
											Psychological / Behavioural
										</CardTitle>
										<p className="text-sm text-white/70">
											Session fatigue, tilt propagation, and momentum factors.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
											<p className="text-sm text-white/60">Fatigue curve</p>
											<p className="text-lg font-semibold">
												Drop {formatPercent(analysis.psychological.fatigueDrop, 0)} WR after 5 games
											</p>
											<p className="text-sm text-white/70">
												{analysis.psychological.sharedCurveNote}
											</p>
										</div>
										<div className="grid grid-cols-2 gap-3 text-center text-sm">
											<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
												<p className="text-white/60">Tilt propagation</p>
												<p className="text-2xl font-semibold">
													{formatPercent(analysis.psychological.tiltPropagation, 0)}
												</p>
												<p className="text-xs text-white/60">
													Portion of WR drop after A&apos;s death impacting B.
												</p>
											</div>
											<div className="rounded-2xl bg-black/30 border border-white/10 p-4">
												<p className="text-white/60">Momentum factor</p>
												<p className="text-2xl font-semibold">
													{formatPercent(analysis.psychological.momentumFactor, 0)}
												</p>
												<p className="text-xs text-white/60">
													WR after first win stays at{" "}
													{formatPercent(analysis.psychological.afterWinWR, 0)}.
												</p>
											</div>
										</div>
										<div className="rounded-2xl bg-black/30 border border-white/10 p-4 text-sm">
											<p className="text-white/60">Momentum swing</p>
											<p className="font-semibold">
												First win pushes duo to{" "}
												{formatPercent(analysis.psychological.afterWinWR, 0)}. First loss dips to{" "}
												{formatPercent(analysis.psychological.afterLossWR, 0)} — stop bleed with synced resets.
											</p>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader className="space-y-2">
										<CardTitle className="flex items-center gap-2 text-lg">
											<Goal className="h-5 w-5 text-[#C8AA6E]" />
											Champion Pairings & Advice
										</CardTitle>
										<p className="text-sm text-white/70">
											Champion pairs pulled from actual shared matches.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid md:grid-cols-2 gap-3">
											<div>
												<p className="text-sm text-white/60 mb-2">Best pulls</p>
												<div className="space-y-2">
													{analysis.ai.bestCombos.map((combo) => (
														<div
															key={`${combo.a}-${combo.b}`}
															className="flex items-center justify-between rounded-xl bg-black/30 border border-emerald-500/20 px-3 py-2 text-sm"
														>
															<span>
																{combo.a} + {combo.b}
															</span>
															<span className="text-emerald-400 font-semibold">
																{formatPercent(combo.wr, 0)}
															</span>
														</div>
													))}
												</div>
											</div>
											<div>
												<p className="text-sm text-white/60 mb-2">Risky today</p>
												<div className="space-y-2">
													{analysis.ai.worstCombos.map((combo) => (
														<div
															key={`${combo.a}-${combo.b}-w`}
															className="flex items-center justify-between rounded-xl bg-black/30 border border-rose-500/20 px-3 py-2 text-sm"
														>
															<span>
																{combo.a} + {combo.b}
															</span>
															<span className="text-rose-400 font-semibold">
																{formatPercent(combo.wr, 0)}
															</span>
														</div>
													))}
												</div>
											</div>
										</div>
										<Button
											variant="secondary"
											className="bg-white/10 border border-white/20 hover:bg-white/20"
											onClick={() => setAdviceRevealed(true)}
										>
											Next Match Advice
										</Button>
										{adviceRevealed && (
											<p className="text-sm text-white/80">
												{analysis.ai.nextMatchAdvice}
											</p>
										)}
									</CardContent>
								</Card>
							</section>

							<section className="grid gap-6 lg:grid-cols-2">
								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Droplets className="h-5 w-5 text-[#C8AA6E]" />
											AI Reasoning Layer
										</CardTitle>
										<p className="text-sm text-white/70">
											Metrics stream into a JSON block for the LLM to narrate your duo like a coach.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<pre className="bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white/80 overflow-auto">
											{JSON.stringify(analysis.ai.payload, null, 2)}
										</pre>
										<p className="text-sm text-white/80">{analysis.ai.summary}</p>
									</CardContent>
								</Card>

								<Card className="bg-white/[0.02] border-white/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2 text-lg">
											<Brain className="h-5 w-5 text-[#C8AA6E]" />
											AI Duo Commentary Mode
										</CardTitle>
										<p className="text-sm text-white/70">
											Pick a burning question — the AI reads your duo timeline and replies in coach tone.
										</p>
									</CardHeader>
									<CardContent className="space-y-4">
										<Select
											value={questionKey}
											onValueChange={(value: keyof typeof QUESTION_OPTIONS) =>
												setQuestionKey(value)
											}
										>
											<SelectTrigger className="bg-black/30 border-white/10 text-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="bg-[#0b0f1c] border-white/10 text-white">
												{Object.entries(QUESTION_OPTIONS).map(([key, label]) => (
													<SelectItem key={key} value={key}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
											{analysis.ai.commentary[questionKey] ||
												"Ask a question above to get instant duo guidance."}
										</div>
									</CardContent>
								</Card>
							</section>
						</>
					) : (
						<Card className="bg-white/[0.02] border-white/10">
							<CardContent className="py-12 text-center space-y-2">
								<p className="text-lg font-semibold">No duo selected</p>
								<p className="text-white/70">
									Run a duo analysis to unlock tactical, style, and psychological layers.
								</p>
							</CardContent>
						</Card>
					)}
				</main>
			</div>
		</div>
	);
};

export default DuoSynergy;
