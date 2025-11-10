import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
	Sparkles,
	ArrowLeft,
	MessageSquare,
	RefreshCcw,
	Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { fetchCoachAdvice } from "@/lib/api";
import type { PlayerStats } from "@/lib/api";
import {
	COACHES_BY_ID,
	MOCK_PLAYER_METRICS,
	formatCoachMetricValue,
} from "../../shared/coaches";
import type {
	CoachAdviceContent,
	CoachChampionSummary,
	CoachId,
	PlayerMetricsPayload,
} from "../../shared/coaches";

const FALLBACK_QUESTION = "What should I focus on next?";

const CoachTrainingRoom = () => {
	const { coachId } = useParams<{ coachId: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const { toast } = useToast();

	const coach = coachId ? COACHES_BY_ID[coachId as CoachId] : undefined;
	const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
	const [questionInput, setQuestionInput] = useState(FALLBACK_QUESTION);
	const [advice, setAdvice] = useState<CoachAdviceContent | null>(null);
	const [source, setSource] = useState<"ai" | "mock" | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [metricsPayload, setMetricsPayload] =
		useState<PlayerMetricsPayload | null>(null);
	const [bootstrapped, setBootstrapped] = useState(false);

	useEffect(() => {
		const data = location.state?.playerData as PlayerStats | undefined;
		if (!data) {
			navigate("/");
			return;
		}
		setPlayerData(data);
	}, [location.state, navigate]);

	const requestAdvice = useCallback(
		async ({
			question,
			followUp = false,
		}: {
			question: string;
			followUp?: boolean;
		}) => {
			if (!coach || !playerData) return;
			const trimmed =
				question.trim() ||
				`Give me a sharper plan for ${coach.focusArea}, please.`;
			const payload = buildCoachPayloadFromPlayer(playerData, coach.id, trimmed);
			setMetricsPayload(payload);

			try {
				if (followUp) {
					setIsSubmitting(true);
				} else {
					setIsLoading(true);
					setAdvice(null);
					setSource(null);
				}
				setError(null);
				const response = await fetchCoachAdvice(coach.id, payload);
				setAdvice(response.content);
				setSource(response.source ?? "ai");
				if (followUp) {
					toast({
						title: `${coach.title} answered`,
						description: "Fresh guidance uploaded to your training room.",
					});
				}
			} catch (err: any) {
				const message =
					err?.message ||
					"Your coach is recalibrating. Please try again in a moment.";
				setError(message);
				toast({
					title: "Coach unavailable",
					description: message,
					variant: "destructive",
				});
			} finally {
				if (followUp) {
					setIsSubmitting(false);
				} else {
					setIsLoading(false);
				}
			}
		},
		[coach, playerData, toast],
	);

	useEffect(() => {
		if (!coach || !playerData || bootstrapped) return;
		const initialQuestion = `What should I focus on to improve my ${coach.focusArea}?`;
		setQuestionInput(initialQuestion);
		setBootstrapped(true);
		requestAdvice({ question: initialQuestion });
	}, [bootstrapped, coach, playerData, requestAdvice]);

	const handleAskCoach = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!coach) return;
		const sanitized =
			questionInput.trim() ||
			`What is the smartest adjustment for my ${coach.focusArea}?`;
		setQuestionInput(sanitized);
		await requestAdvice({ question: sanitized, followUp: true });
	};

	const username = playerData?.riotId || "Summoner";
	const snapshotPayload = useMemo(() => {
		if (metricsPayload) return metricsPayload;
		if (!coach || !playerData) return null;
		return buildCoachPayloadFromPlayer(
			playerData,
			coach.id,
			questionInput || FALLBACK_QUESTION,
		);
	}, [coach, metricsPayload, playerData, questionInput]);

	const statHighlights = useMemo(() => {
		const statKeys = coach?.statKeys ?? [];
		if (!snapshotPayload) {
			return statKeys.map((stat) => ({
				key: stat.key,
				label: stat.label,
				value: formatCoachMetricValue(undefined, stat.format),
				comment: "",
			}));
		}
		const annotations =
			advice?.statAnnotations?.length
				? advice.statAnnotations
				: statKeys.map((stat) => ({
						key: stat.key,
						label: stat.label,
						comment: "",
					}));
		return annotations.map((annotation) => {
			const statConfig = statKeys.find((stat) => stat.key === annotation.key);
			const rawValue =
				snapshotPayload.metrics[
					annotation.key as keyof typeof snapshotPayload.metrics
				];
			return {
				key: annotation.key,
				label: annotation.label || statConfig?.label || annotation.key,
				value: formatCoachMetricValue(rawValue, statConfig?.format),
				comment: annotation.comment?.trim() || "",
			};
		});
	}, [advice?.statAnnotations, coach, snapshotPayload]);

	const playerSituations = useMemo(
		() => buildSituationsFromPlayer(playerData),
		[playerData],
	);

	const resolvedChampionNotes = useMemo(() => {
		if (advice?.championNotes?.length) {
			return advice.championNotes;
		}
		const fallback = mapTopChampions(playerData);
		const verdicts = ["Signature Pick", "Reliable Flex", "Specialist"];
		return fallback.slice(0, 3).map((champ, index) => ({
			champion: champ.name,
			verdict: verdicts[index] || "Comfort",
			focus: `${champ.description || "Comfort pick"} (${champ.csPerMin.toFixed(1)} CS/min, ${Math.round(champ.winRate * 100)}% WR)`,
		}));
	}, [advice?.championNotes, playerData]);

	const resolvedStrengths = useMemo(() => {
		if (advice?.strengths?.length) {
			return advice.strengths;
		}
		return statHighlights.slice(0, 2).map((highlight) => ({
			label: highlight.label,
			detail: highlight.comment
				? `${highlight.comment} (${highlight.value}).`
				: `Current value: ${highlight.value}.`,
		}));
	}, [advice?.strengths, statHighlights]);

	const resolvedWeaknesses = useMemo(() => {
		if (advice?.weaknesses?.length) {
			return advice.weaknesses;
		}
		const fallbackSituations =
			playerSituations.length > 0 ? playerSituations : MOCK_PLAYER_METRICS.situations;
		return fallbackSituations.slice(0, 2).map((situation) => ({
			label: situation,
			detail: `${coach.name} flags this pattern as a ${coach.focusArea.toLowerCase()} leak.`,
			actionables: [
				`Pause the VOD the next time "${situation}" appears and label the mistake.`,
				`Write the correct ${coach.focusArea.toLowerCase()} response and rehearse it once in practice tool.`,
				`Track the next three games to confirm the fix holds.`,
			],
		}));
	}, [advice?.weaknesses, coach.focusArea, coach.name, playerSituations]);

	const resolvedCourses = useMemo(() => {
		if (advice?.courses?.length) {
			return advice.courses;
		}
		const fallbackSituations =
			playerSituations.length > 0 ? playerSituations : MOCK_PLAYER_METRICS.situations;
		return fallbackSituations.slice(0, 3).map((situation, index) => ({
			title: `${coach.nickname} Drill ${index + 1}`,
			situation,
			assignment: `Queue a custom and recreate "${situation}" three times while focusing on ${coach.focusArea.toLowerCase()}.`,
		}));
	}, [advice?.courses, coach.focusArea, coach.nickname, playerSituations]);

	if (!coach) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-[#050914] px-4 text-center text-white">
				<p className="text-sm uppercase tracking-wide text-[#C8AA6E]">
					Specialized Coaches
				</p>
				<h1 className="mt-3 text-3xl font-bold">Coach not found</h1>
				<p className="mt-2 max-w-md text-white/70">
					The training room you were trying to reach doesn&apos;t exist yet. Pick
					another mentor and keep the grind going.
				</p>
				<Button
					className="mt-6 bg-[#C8AA6E] text-[#0A1428] font-semibold hover:bg-[#d8b87a]"
					onClick={() => navigate("/")}
				>
					Return Home
				</Button>
			</div>
		);
	}

	if (!playerData) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-[#050914] px-4 text-center text-white">
				<p className="text-sm uppercase tracking-wide text-[#C8AA6E]">
					Specialized Coaches
				</p>
				<h1 className="mt-3 text-3xl font-bold">Loading recap data...</h1>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#050914]">
			<div className="absolute inset-0 bg-[url('/images/background-1.jpg')] bg-cover bg-center opacity-20" />
			<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-[#050914]" />

			<div className="relative z-10 px-4 py-10 sm:px-8 lg:px-12">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
					<header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div className="flex items-center gap-3 text-sm text-white/70">
								<Button
									variant="ghost"
									className="text-white hover:bg-white/10"
									onClick={() =>
										navigate("/coaches", {
											state: { playerData },
										})
									}
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Coaches
								</Button>
								<Badge className="bg-white/10 text-white/80">
									Specialization: {coach.focusArea}
								</Badge>
							</div>
							{source && (
								<Badge
									variant="outline"
									className={
										source === "mock"
											? "border-amber-200/60 text-amber-100"
											: "border-emerald-200/60 text-emerald-100"
									}
								>
									{source === "mock" ? "Preview Response" : "Live AI Response"}
								</Badge>
							)}
						</div>
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex items-center gap-4">
								<div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/30 shadow-lg">
									<img
										src={coach.avatar}
										alt={coach.name}
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="space-y-1 text-white">
									<p className="text-xs uppercase tracking-wide text-white/60">
										{coach.title}
									</p>
									<h1 className="text-2xl font-bold md:text-3xl">
										{coach.name} Training Room
									</h1>
									<p className="text-sm text-white/70">
										Coaching session for {username}
									</p>
								</div>
							</div>
							<blockquote className="max-w-xl text-sm italic text-white/60">
								“{coach.signatureQuote}”
							</blockquote>
						</div>
					</header>

					{error && (
						<Card className="border-rose-400/40 bg-rose-500/10 text-rose-100">
							<CardContent className="flex flex-col gap-4 p-4">
								<div>
									<p className="text-sm font-semibold uppercase tracking-wide">
										Coach paused
									</p>
									<p className="text-sm text-rose-100/80">{error}</p>
								</div>
								<div className="flex gap-3">
									<Button
										variant="outline"
										className="border-rose-200/60 text-rose-100 hover:bg-rose-400/20"
										onClick={() => requestAdvice({ question: questionInput })}
									>
										<RefreshCcw className="mr-2 h-4 w-4" />
										Try Again
									</Button>
									<Button
										variant="ghost"
										className="text-white/80"
										onClick={() =>
											navigate("/coaches", {
												state: { playerData },
											})
										}
									>
										Choose Another Coach
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					<Card className="border-white/10 bg-white/5">
						<CardHeader>
							<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
								Ask Your Coach
							</p>
							<p className="text-sm text-white/70">
								Type a question to get an in-character reply with farming
								analysis, lanes, and drills.
							</p>
						</CardHeader>
						<CardContent>
							<form className="space-y-4" onSubmit={handleAskCoach}>
								<Textarea
									value={questionInput}
									onChange={(event) => setQuestionInput(event.target.value)}
									placeholder="Ask about cannon ratios, tempo recalls, or a matchup script..."
									className="min-h-[120px] border-white/10 bg-black/40 text-white placeholder:text-white/40"
								/>
								<Button
									type="submit"
									disabled={isSubmitting}
									className="flex w-full items-center justify-center gap-2 bg-[#C8AA6E] text-[#0A1428] font-semibold hover:bg-[#d8b87a]"
								>
									{isSubmitting ? (
										<>
											<RefreshCcw className="h-4 w-4 animate-spin" />
											Thinking...
										</>
									) : (
										<>
											<MessageSquare className="h-4 w-4" />
											Ask Your Coach
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
						<div className="space-y-6">
							<Card className="border-white/10 bg-white/5">
								<CardHeader className="space-y-3">
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#C8AA6E]">
										<Sparkles className="h-4 w-4" />
										Your Performance Summary
									</div>
									{isLoading && !advice ? (
										<div className="space-y-3">
											<Skeleton className="h-4 w-full bg-white/10" />
											<Skeleton className="h-4 w-3/4 bg-white/10" />
										</div>
									) : (
										<p className="text-base text-white/90">
											{advice?.summary}
										</p>
									)}
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-xs uppercase tracking-wide text-white/60">
										Coach&apos;s Feedback
									</p>
									{isLoading && !advice ? (
										<div className="space-y-2">
											<Skeleton className="h-3 w-full bg-white/10" />
											<Skeleton className="h-3 w-4/5 bg-white/10" />
										</div>
									) : (
										<p className="text-sm text-white/80">{advice?.feedback}</p>
									)}
								</CardContent>
							</Card>

							<Card className="border-white/10 bg-white/5">
								<CardHeader>
									<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
										Farming Stat Showcase
									</p>
									<p className="text-sm text-white/70">
										Live stats pulled from {username}&apos;s recap.
									</p>
								</CardHeader>
								<CardContent className="space-y-3">
									{isLoading && !advice ? (
										<div className="space-y-2">
											<Skeleton className="h-4 w-full bg-white/10" />
											<Skeleton className="h-4 w-11/12 bg-white/10" />
											<Skeleton className="h-4 w-10/12 bg-white/10" />
										</div>
									) : (
										<div className="space-y-3">
											{statHighlights.map((stat) => (
												<div
													key={`${stat.key}-${stat.label}`}
													className="rounded-2xl border border-white/10 bg-black/30 p-4"
												>
													<div className="flex items-center justify-between text-white">
														<p className="text-xs uppercase tracking-wide text-white/60">
															{stat.label}
														</p>
														<p className="text-2xl font-semibold">
															{stat.value}
														</p>
													</div>
													{stat.comment && (
														<p className="mt-2 text-sm text-white/75">
															{stat.comment}
														</p>
													)}
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>

							<Card className="border-white/10 bg-white/5">
								<CardHeader>
									<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
										Strengths & Weaknesses
									</p>
									<p className="text-sm text-white/70">
										Honest praise and critique tailored to your username.
									</p>
								</CardHeader>
								<CardContent>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-3">
											<p className="text-xs uppercase tracking-wide text-emerald-200/80">
												Strengths
											</p>
											{resolvedStrengths.length === 0 && (
												<p className="text-sm text-white/60">
													Waiting on coach insights...
												</p>
											)}
											{resolvedStrengths.map((strength) => (
												<div
													key={strength.label}
													className="rounded-2xl border border-white/10 bg-emerald-500/10 p-4"
												>
													<p className="text-sm font-semibold text-white">
														{strength.label}
													</p>
													<p className="text-xs text-white/70">
														{strength.detail}
													</p>
												</div>
											))}
										</div>
										<div className="space-y-3">
											<p className="text-xs uppercase tracking-wide text-rose-200/80">
												Weaknesses
											</p>
											{resolvedWeaknesses.length === 0 && (
												<p className="text-sm text-white/60">
													Waiting on coach insights...
												</p>
											)}
											{resolvedWeaknesses.map((weakness) => (
												<div
													key={weakness.label}
													className="rounded-2xl border border-white/10 bg-rose-500/10 p-4"
												>
													<p className="text-sm font-semibold text-white">
														{weakness.label}
													</p>
													<p className="text-xs text-white/70">
														{weakness.detail}
													</p>
													<ul className="mt-3 space-y-1 text-xs text-white/80">
														{weakness.actionables.map((tip, index) => (
															<li key={`${weakness.label}-tip-${index}`}>
																• {tip}
															</li>
														))}
													</ul>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border-white/10 bg-white/5">
								<CardHeader className="space-y-3">
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#C8AA6E]">
										<Target className="h-4 w-4" />
										Advice & Training Focus
									</div>
									{isLoading && !advice ? (
										<div className="space-y-2">
											<Skeleton className="h-3 w-full bg-white/10" />
											<Skeleton className="h-3 w-5/6 bg-white/10" />
										</div>
									) : (
										<p className="text-sm text-white/80">{advice?.advice}</p>
									)}
								</CardHeader>
							</Card>

							<Card className="border-white/10 bg-white/5">
								<CardHeader>
									<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
										Situation-Based Courses
									</p>
									<p className="text-sm text-white/70">
										Queue these whenever the listed scenario keeps repeating.
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{resolvedCourses.map((course) => (
										<div
											key={course.title}
											className="rounded-2xl border border-white/10 bg-black/30 p-4"
										>
											<p className="text-sm font-semibold text-white">
												{course.title}
											</p>
											<p className="text-xs uppercase tracking-wide text-white/50">
												{course.situation}
											</p>
											<p className="mt-2 text-sm text-white/75">
												{course.assignment}
											</p>
										</div>
									))}
									{advice?.signOff && (
										<p className="text-xs italic text-white/60">
											{advice.signOff}
										</p>
									)}
								</CardContent>
							</Card>
						</div>

						<div className="space-y-6">
							<Card className="border-white/10 bg-white/5">
								<CardHeader>
									<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
										Champion Commentary
									</p>
									<p className="text-sm text-white/70">
										The Analyst scouts your top picks and leaves notes.
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{isLoading && !advice ? (
										<div className="space-y-2">
											<Skeleton className="h-12 w-full bg-white/10" />
											<Skeleton className="h-12 w-full bg-white/10" />
										</div>
									) : resolvedChampionNotes.length ? (
										resolvedChampionNotes.map((note) => (
											<div
												key={`${note.champion}-${note.verdict}`}
												className="rounded-2xl border border-white/10 bg-black/30 p-4"
											>
												<div className="flex items-center justify-between">
													<p className="text-sm font-semibold text-white">
														{note.champion}
													</p>
													<Badge className="bg-white/10 text-white/80">
														{note.verdict}
													</Badge>
												</div>
												<p className="mt-2 text-sm text-white/75">{note.focus}</p>
											</div>
										))
									) : (
										<p className="text-sm text-white/70">
											Coach needs a few more games to scout your champion pool.
										</p>
									)}
								</CardContent>
							</Card>

							<MetricsRadar
								metrics={playerData.derivedMetrics || {}}
								title={`Performance Profile — ${username}`}
								className="border-white/10 bg-white/5"
							/>

							<Card className="border-white/10 bg-white/5">
								<CardHeader>
									<p className="text-xs uppercase tracking-wide text-[#C8AA6E]">
										Your Farming Benchmarks
									</p>
									<p className="text-sm text-white/70">
										Data synced from {username}&apos;s recap.
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-4">
										{coach.statKeys.map((stat) => (
											<div
												key={`${coach.id}-${stat.key}`}
												className="rounded-2xl border border-white/10 bg-black/30 p-4"
											>
												<p className="text-xs uppercase tracking-wide text-white/60">
													{stat.label}
												</p>
												<p className="text-3xl font-semibold text-white">
													{formatCoachMetricValue(
														snapshotPayload?.metrics[stat.key],
														stat.format,
													)}
												</p>
												<p className="text-xs text-white/60">{stat.helper}</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CoachTrainingRoom;

function buildCoachPayloadFromPlayer(
	player: PlayerStats,
	coachId: CoachId,
	question: string,
): PlayerMetricsPayload {
	const fallback = MOCK_PLAYER_METRICS;
	const avgGameMinutes = Math.max(1, (player.avgGameDuration || 1800) / 60);
	const metrics = { ...fallback.metrics };

	metrics.gamesAnalyzed = player.totalGames || metrics.gamesAnalyzed;
	metrics.winRate =
		typeof player.winRate === "number"
			? Number((player.winRate / 100).toFixed(2))
			: metrics.winRate;
	metrics.csPerMin =
		player.avgCS > 0 ? Number((player.avgCS / avgGameMinutes).toFixed(2)) : metrics.csPerMin;
	metrics.csAt10 = Math.round(metrics.csPerMin * 10);
	metrics.csAt15 = Math.round(metrics.csPerMin * 15);
	metrics.goldPerMin =
		typeof player.derivedMetrics?.farming === "number"
			? Math.round(300 + player.derivedMetrics.farming * 1.8)
			: metrics.goldPerMin;
	metrics.deathsPerGame = player.avgDeaths || metrics.deathsPerGame;
	metrics.earlyDeathsPerGame = Number((metrics.deathsPerGame * 0.35).toFixed(2));
	metrics.killParticipation =
		typeof player.derivedMetrics?.teamfighting === "number"
			? Math.min(1, Number((player.derivedMetrics.teamfighting / 100).toFixed(2)))
			: metrics.killParticipation;
	metrics.visionScorePerMin =
		player.avgVisionScore > 0
			? Number((player.avgVisionScore / avgGameMinutes).toFixed(2))
			: metrics.visionScorePerMin;
	metrics.controlWardsPerGame =
		typeof player.derivedMetrics?.vision === "number"
			? Number((0.6 + player.derivedMetrics.vision / 180).toFixed(2))
			: metrics.controlWardsPerGame;
	metrics.teamfightDmgShare =
		typeof player.derivedMetrics?.teamfighting === "number"
			? Math.min(1, Number((player.derivedMetrics.teamfighting / 100).toFixed(2)))
			: metrics.teamfightDmgShare;
	metrics.teamfightKP =
		typeof player.derivedMetrics?.teamfighting === "number"
			? Math.min(1, Number((0.5 + player.derivedMetrics.teamfighting / 200).toFixed(2)))
			: metrics.teamfightKP;
	metrics.lateGameWinRate =
		typeof player.derivedMetrics?.lateGameScaling === "number"
			? Number((player.derivedMetrics.lateGameScaling / 100).toFixed(2))
			: metrics.lateGameWinRate;
	metrics.earlyGameWinRate =
		typeof player.derivedMetrics?.earlyGameStrength === "number"
			? Number((player.derivedMetrics.earlyGameStrength / 100).toFixed(2))
			: metrics.earlyGameWinRate;

	const topChampions = mapTopChampions(player);
	const situations = buildSituationsFromPlayer(player);

	return {
		...fallback,
		coachId,
		playerName: player.riotId,
		persona: player.persona?.codename || player.archetype?.name || player.riotId,
		role: player.mainRole || fallback.role,
		rank: fallback.rank,
		metrics,
		trends: { ...fallback.trends },
		benchmarks: {
			...fallback.benchmarks,
			role: player.mainRole || fallback.benchmarks.role,
		},
		topChampions: topChampions.length ? topChampions : fallback.topChampions,
		situations: situations.length ? situations : [...fallback.situations],
		question: question || fallback.question || FALLBACK_QUESTION,
	};
}

function mapTopChampions(player: PlayerStats | null): CoachChampionSummary[] {
	const sourceChamps = player?.topChampions?.length
		? player.topChampions
		: MOCK_PLAYER_METRICS.topChampions || [];
	const avgGameMinutes = Math.max(1, ((player?.avgGameDuration || 1800) / 60));
	return sourceChamps.slice(0, 3).map((champion) => {
		const name =
			"championName" in champion ? champion.championName : (champion.name || "Champion");
		const games = "games" in champion ? champion.games : 0;
		const cs = "avgCS" in champion ? champion.avgCS : champion.csPerMin * avgGameMinutes;
		const kills = "avgKills" in champion ? champion.avgKills : 0;
		const deaths = "avgDeaths" in champion ? champion.avgDeaths : 0;
		const assists = "avgAssists" in champion ? champion.avgAssists : 0;
		const winRate =
			"winRate" in champion
				? typeof champion.winRate === "number" && champion.winRate > 1
					? champion.winRate / 100
					: champion.winRate
				: 0.5;

		return {
			name,
			games,
			csPerMin: cs ? Number((cs / avgGameMinutes).toFixed(2)) : 0,
			winRate: Number(winRate.toFixed(2)),
			description: `${kills.toFixed(1)}/${deaths.toFixed(1)}/${assists.toFixed(
				1,
			)} avg. ${cs?.toFixed(0) ?? "—"} CS.`,
		};
	});
}

function buildSituationsFromPlayer(player: PlayerStats | null): string[] {
	if (!player) return [];
	const weaknessNotes =
		player.needsWork?.map(
			(weakness) => weakness.suggestion || `Tighten ${weakness.metric}`,
		) ?? [];
	const insightTips = player.insights?.improvement_tips ?? [];
	const combined = [...weaknessNotes, ...insightTips];
	const unique = Array.from(
		new Set(combined.map((entry) => entry?.trim()).filter(Boolean)),
	) as string[];
	return unique;
}
