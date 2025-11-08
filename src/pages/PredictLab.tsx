import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Activity, Brain, Sparkles, Wand2, Target, ChevronLeft } from "lucide-react";
import type { PlayerStats } from "@/lib/api";
import { loadPlayerSnapshot } from "@/lib/player-storage";

const DEFAULT_BASE_WR = 0.51;
const DEFAULT_BASELINE_STATS = {
  csPerMin: 6.5,
  deaths: 5,
  vision: 1.2,
  killParticipation: 60,
  sessions: 3,
};

type SliderKey = keyof typeof DEFAULT_BASELINE_STATS;

type Stats = Record<SliderKey, number>;

const sliderConfig: Record<SliderKey, {
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  takeaway: string;
}> = {
  csPerMin: {
    label: "CS / min",
    min: 5,
    max: 9,
    step: 0.05,
    format: (value: number) => value.toFixed(1),
    takeaway: "Consistency → macro control → WR boost",
  },
  deaths: {
    label: "Deaths / game",
    min: 3,
    max: 10,
    step: 0.1,
    format: (value: number) => value.toFixed(1),
    takeaway: "Risk management keeps LP safe",
  },
  vision: {
    label: "Vision / min",
    min: 0.6,
    max: 2,
    step: 0.05,
    format: (value: number) => value.toFixed(2),
    takeaway: "Awareness → map control",
  },
  killParticipation: {
    label: "Kill participation",
    min: 40,
    max: 80,
    step: 1,
    format: (value: number) => `${Math.round(value)}%`,
    takeaway: "Team synergy amplifies every roam",
  },
  sessions: {
    label: "Session length",
    min: 1,
    max: 6,
    step: 1,
    format: (value: number) => `${Math.round(value)} games`,
    takeaway: "Mental endurance > autopilot",
  },
};

const presets: { label: string; description: string; values: Stats }[] = [
  {
    label: "Aggro Mid",
    description: "Fight every skirmish",
    values: { csPerMin: 7.4, deaths: 6.8, vision: 0.9, killParticipation: 74, sessions: 4 },
  },
  {
    label: "Vision-Master Support",
    description: "Eyes everywhere",
    values: { csPerMin: 5.6, deaths: 4.3, vision: 1.8, killParticipation: 68, sessions: 3 },
  },
  {
    label: "Clutch ADC",
    description: "Farming focus, low deaths",
    values: { csPerMin: 8.2, deaths: 4.1, vision: 1.3, killParticipation: 65, sessions: 2 },
  },
];

type Archetype = {
  name: string;
  element: "inferno" | "tide" | "gale" | "terra";
  description: string;
  shiftScore: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const computePredictedWR = (stats: Stats, baseline: Stats, baseWR: number) => {
  const wr =
    baseWR +
    0.03 * (stats.csPerMin - baseline.csPerMin) -
    0.02 * (stats.deaths - baseline.deaths) +
    0.015 * (stats.vision - baseline.vision) +
    0.01 * (stats.killParticipation - baseline.killParticipation);
  return clamp(wr, 0.35, 0.75);
};

const computeMonthlyLP = (wr: number, sessions: number) => {
  const games = sessions * 30;
  const netGames = games * (2 * wr - 1);
  return Math.round(netGames * 15);
};

const normalize = (value: number, min: number, max: number) => clamp((value - min) / (max - min), 0, 1);

const evaluateArchetype = (stats: Stats): Archetype => {
  const macro = normalize(stats.csPerMin, 5, 9);
  const survival = normalize(10 - stats.deaths, 0, 7);
  const vision = normalize(stats.vision, 0.6, 2);
  const teamwork = normalize(stats.killParticipation, 40, 80);
  const aggression = normalize(stats.killParticipation + stats.deaths * 2, 46, 92);

  if (vision > 0.75 && survival > 0.55) {
    return {
      name: "Strategist Tide",
      element: "tide",
      description: "Calm, map-aware, and always two wards ahead.",
      shiftScore: (vision + survival) / 2,
    };
  }

  if (macro > 0.75 && survival > 0.65) {
    return {
      name: "Duelist Terra",
      element: "terra",
      description: "Disciplined farming machine with clutch positioning.",
      shiftScore: (macro + survival) / 2,
    };
  }

  if (aggression > 0.7) {
    return {
      name: "Gambler Inferno",
      element: "inferno",
      description: "Plays on the edge and thrives in chaos.",
      shiftScore: aggression,
    };
  }

  if (teamwork > 0.7) {
    return {
      name: "Stormbinder Gale",
      element: "gale",
      description: "Rotations, roams, and synchronized engages.",
      shiftScore: teamwork,
    };
  }

  return {
    name: "Balanced Zephyr",
    element: "gale",
    description: "Steady fundamentals ready to spike.",
    shiftScore: 0.5,
  };
};

const generateCommentary = (key: SliderKey, stats: Stats, baseline: Stats) => {
  const deltaCs = stats.csPerMin - baseline.csPerMin;
  const deltaDeaths = baseline.deaths - stats.deaths;
  const deltaVision = stats.vision - baseline.vision;
  const deltaKP = stats.killParticipation - baseline.killParticipation;

  switch (key) {
    case "csPerMin": {
      const wrBump = (deltaCs * 3).toFixed(1);
      return deltaCs >= 0
        ? `You're farming like a pro — +${deltaCs.toFixed(1)} CS/min adds ~${wrBump}% WR. Keep it up!`
        : `Missed waves cost wins — recover ${Math.abs(deltaCs).toFixed(1)} CS/min for ~${Math.abs(wrBump)}% WR back.`;
    }
    case "deaths": {
      const wrBump = (deltaDeaths * 2).toFixed(1);
      return deltaDeaths >= 0
        ? `Clutch discipline: ${deltaDeaths.toFixed(1)} fewer deaths ≈ +${wrBump}% WR.`
        : `Careful — ${Math.abs(deltaDeaths).toFixed(1)} extra deaths pushes you toward Chaos Agent territory.`;
    }
    case "vision": {
      const wrBump = (deltaVision * 1.5).toFixed(1);
      return deltaVision >= 0
        ? `Eyes on the map — +${deltaVision.toFixed(2)} vision/min lights up ~${wrBump}% WR.`
        : `Dark map, dark outcomes. Recover ${Math.abs(deltaVision).toFixed(2)} vision/min to steady fights.`;
    }
    case "killParticipation": {
      const wrBump = ((deltaKP) * 1).toFixed(1);
      return deltaKP >= 0
        ? `Teamfight magnet — +${Math.abs(deltaKP).toFixed(0)}% KP fuels about +${wrBump}% WR.`
        : `Join one more fight per game to match high-elo impact.`;
    }
    case "sessions": {
      return stats.sessions <= 3
        ? `Smart queuing — you peak around game ${stats.sessions}. Reset often to protect LP.`
        : `Your WR drops after game 4 — build breaks or duo to keep focus.`;
    }
    default:
      return "Micro adjustments compound into macro gains.";
  }
};

const elementStyles: Record<Archetype["element"], { gradient: string; glow: string }> = {
  inferno: {
    gradient: "from-orange-500/70 via-rose-500/40 to-yellow-300/30",
    glow: "rgba(248,113,113,0.5)",
  },
  tide: {
    gradient: "from-cyan-400/70 via-blue-500/40 to-emerald-400/30",
    glow: "rgba(34,211,238,0.5)",
  },
  gale: {
    gradient: "from-indigo-400/70 via-sky-500/40 to-violet-400/30",
    glow: "rgba(129,140,248,0.5)",
  },
  terra: {
    gradient: "from-amber-400/70 via-green-500/40 to-lime-300/30",
    glow: "rgba(251,191,36,0.5)",
  },
};

const mapPlayerToBaseline = (player: PlayerStats) => {
  const minutesPerGame = player.avgGameDuration > 0 ? player.avgGameDuration / 60 : 30;
  const safeMinutes = minutesPerGame > 0 ? minutesPerGame : 30;

  const csPerMin = player.avgCS > 0 ? player.avgCS / safeMinutes : DEFAULT_BASELINE_STATS.csPerMin;
  const visionPerMin = player.avgVisionScore > 0 ? player.avgVisionScore / safeMinutes : DEFAULT_BASELINE_STATS.vision;
  const rawKP = ((player.avgKills + player.avgAssists) / 22) * 100;
  const sessionsEstimate = Math.round(Math.max(player.totalGames / 40, sliderConfig.sessions.min));

  const stats: Stats = {
    csPerMin: clamp(parseFloat(csPerMin.toFixed(2)), sliderConfig.csPerMin.min, sliderConfig.csPerMin.max),
    deaths: clamp(parseFloat(player.avgDeaths.toFixed(2)), sliderConfig.deaths.min, sliderConfig.deaths.max),
    vision: clamp(parseFloat(visionPerMin.toFixed(2)), sliderConfig.vision.min, sliderConfig.vision.max),
    killParticipation: clamp(parseFloat(rawKP.toFixed(1)), sliderConfig.killParticipation.min, sliderConfig.killParticipation.max),
    sessions: clamp(sessionsEstimate, sliderConfig.sessions.min, sliderConfig.sessions.max),
  };

  const baseWR = clamp(player.winRate / 100, 0.35, 0.75);

  return { stats, baseWR };
};

const PredictLab = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [baselineStats, setBaselineStats] = useState<Stats>(DEFAULT_BASELINE_STATS);
  const [baseWR, setBaseWR] = useState(DEFAULT_BASE_WR);
  const [stats, setStats] = useState<Stats>(DEFAULT_BASELINE_STATS);
  const [lastChanged, setLastChanged] = useState<SliderKey>("csPerMin");
  const [milestones, setMilestones] = useState({ two: false, five: false });
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const data =
      (location.state?.playerData as PlayerStats | undefined) ?? loadPlayerSnapshot() ?? null;

    if (!data) {
      navigate("/");
      return;
    }

    setPlayerData(data);
    const derived = mapPlayerToBaseline(data);
    setBaselineStats(derived.stats);
    setStats(derived.stats);
    setLastChanged("csPerMin");
    setBaseWR(derived.baseWR);
  }, [location.state, navigate]);

  const predictedWR = useMemo(
    () => computePredictedWR(stats, baselineStats, baseWR),
    [stats, baselineStats, baseWR],
  );
  const predictedWRPercent = useMemo(() => Math.round(predictedWR * 1000) / 10, [predictedWR]);
  const deltaWRPercent = predictedWRPercent - Math.round(baseWR * 1000) / 10;
  const expectedLP = useMemo(() => computeMonthlyLP(predictedWR, stats.sessions), [predictedWR, stats.sessions]);
  const archetype = useMemo(() => evaluateArchetype(stats), [stats]);
  const baseArchetype = useMemo(() => evaluateArchetype(baselineStats), [baselineStats]);
  const commentary = useMemo(
    () => generateCommentary(lastChanged, stats, baselineStats),
    [lastChanged, stats, baselineStats],
  );

  const contributions = useMemo(
    () => [
      { label: "CS mastery", value: 0.03 * (stats.csPerMin - baselineStats.csPerMin) * 100 },
      { label: "Risk control", value: -0.02 * (stats.deaths - baselineStats.deaths) * 100 },
      { label: "Vision score", value: 0.015 * (stats.vision - baselineStats.vision) * 100 },
      { label: "Team impact", value: 0.01 * (stats.killParticipation - baselineStats.killParticipation) * 100 },
    ],
    [stats, baselineStats],
  );

  const similarAvg = useMemo(() => {
    const control = normalize(stats.vision, 0.6, 2);
    const stability = normalize(7 - (stats.deaths - 3), 0, 7);
    const macro = normalize(stats.csPerMin, 5, 9);
    return Math.round(clamp(46 + control * 6 + macro * 5 + stability * 4, 44, 66));
  }, [stats]);

  const intensity = clamp((predictedWR - baseWR) * 4 + 0.4, 0.3, 1);
  const orbDimFactor = clamp(1 - (stats.deaths - 3) / 10, 0.4, 1);

  const handleSliderChange = (key: SliderKey, value: number[]) => {
    const raw = value[0];
    const nextValue = key === "sessions" ? Math.round(raw) : parseFloat(raw.toFixed(2));
    setStats((prev) => ({ ...prev, [key]: nextValue }));
    setLastChanged(key);
  };

  const playDoublePing = useCallback(() => {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      const now = ctx.currentTime;

      [0, 0.2].forEach((offset, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(index === 0 ? 900 : 1250, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.2, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.3);
      });
    } catch (error) {
      // Ignore audio errors when autoplay is blocked
    }
  }, []);

  useEffect(() => {
    if (deltaWRPercent >= 5 && !milestones.five) {
      setMilestones({ two: true, five: true });
      playDoublePing();
    } else if (deltaWRPercent >= 2 && !milestones.two) {
      setMilestones((prev) => ({ ...prev, two: true }));
      playDoublePing();
    } else if (deltaWRPercent < 2 && (milestones.two || milestones.five)) {
      setMilestones({ two: false, five: false });
    }
  }, [deltaWRPercent, milestones, playDoublePing]);

  const applyPreset = (values: Stats) => {
    setStats({ ...values });
    setLastChanged("csPerMin");
  };

  if (!playerData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050910] text-white">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#C8AA6E]" />
          <p className="text-sm uppercase tracking-[0.4em] text-white/60">Linking to backend</p>
          <p className="text-white/80">Calibrating your Predict Lab...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050910] text-white">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-[#C8AA6E] hover:text-[#F0E6D2] hover:bg-[#0A1428]/50 transition-colors uppercase tracking-widest text-xs font-semibold"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 20% 20%, rgba(120, 99, 255, ${intensity}), transparent 55%), radial-gradient(circle at 80% 0%, rgba(56, 189, 248, ${intensity}), transparent 60%), linear-gradient(120deg, rgba(10,20,40,0.95), rgba(8,12,30,0.9))`,
        }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-10 top-20 h-56 w-56 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-16 h-64 w-64 animate-[spin_18s_linear_infinite] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-1/3 h-32 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-12 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#C8AA6E]">Predict Lab</p>
            <h1 className="font-display text-4xl font-black uppercase sm:text-5xl">
              What-If Slider Playground
            </h1>
            <p className="mt-2 max-w-2xl text-base text-white/80">
              Tweak your routine, watch your element orb react, and see how micro habits ripple into win rate, LP, and identity.
            </p>
            <p className="mt-1 text-sm uppercase tracking-[0.3em] text-white/50">
              Linked to {playerData.riotId}#{playerData.tagLine} • {playerData.totalGames} games analyzed
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-black/50">
              <CardHeader className="flex flex-col gap-2 border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                  <Wand2 className="h-5 w-5 text-[#C8AA6E]" /> Preset Scenarios
                </CardTitle>
                <p className="text-sm text-white/70">Load a fantasy training card to feel how different playstyles flex your element.</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 pt-4">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    className={cn(
                      "w-full flex-1 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#C8AA6E]/70 hover:bg-[#C8AA6E]/10",
                    )}
                    onClick={() => applyPreset(preset.values)}
                  >
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#C8AA6E]">{preset.label}</p>
                    <p className="text-sm text-white/80">{preset.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/60">
              <CardHeader>
                <CardTitle className="text-xl uppercase tracking-[0.3em] text-white">Habit sliders</CardTitle>
                <p className="text-sm text-white/70">Every slider nudges the predictive model and your archetype meter in real time.</p>
              </CardHeader>
              <CardContent className="space-y-7">
                {(Object.keys(sliderConfig) as SliderKey[]).map((key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
                          {sliderConfig[key].label}
                        </p>
                        <p className="text-xs text-white/50">{sliderConfig[key].takeaway}</p>
                      </div>
                      <span className="text-xl font-bold text-[#C8AA6E]">
                        {sliderConfig[key].format(stats[key])}
                      </span>
                    </div>
                    <Slider
                      value={[stats[key]]}
                      min={sliderConfig[key].min}
                      max={sliderConfig[key].max}
                      step={sliderConfig[key].step}
                      onValueChange={(value) => handleSliderChange(key, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-black/60">
              <CardContent className="flex flex-col gap-6 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.5em] text-white/60">Expected WR</p>
                    <div className="mt-1 flex flex-col items-start gap-2">
                      <span className="text-5xl font-black text-white">{predictedWRPercent.toFixed(1)}%</span>
                      <Badge
                        variant="outline"
                        className="border-[#C8AA6E]/60 px-3 py-1 text-xs text-[#C8AA6E]/90"
                      >
                        {deltaWRPercent >= 0 ? "+" : ""}
                        {deltaWRPercent.toFixed(1)}% vs base
                      </Badge>
                    </div>
                    <p className="text-sm text-white/60">Average similar players: {similarAvg}% WR</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.5em] text-white/60">Expected LP / month</p>
                    <p className={cn("text-3xl font-bold", expectedLP >= 0 ? "text-emerald-300" : "text-rose-300")}>{expectedLP >= 0 ? "+" : ""}{expectedLP}</p>
                    <p className="text-xs text-white/50">Assuming {stats.sessions} games/day streaks</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 text-center">
                  <div
                    className={cn(
                      "relative flex h-44 w-44 items-center justify-center rounded-full border border-white/20 transition",
                      stats.deaths > 7 ? "animate-pulse" : "", 
                    )}
                    style={{
                      opacity: orbDimFactor,
                      boxShadow: `0 0 ${40 + intensity * 50}px ${elementStyles[archetype.element].glow}`,
                      transform: `scale(${1 + intensity * 0.12})`,
                    }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full blur-3xl",
                        `bg-gradient-to-br ${elementStyles[archetype.element].gradient}`,
                      )}
                    />
                    <div className="relative z-10 text-center">
                      <p className="text-xs uppercase tracking-[0.5em] text-white/70">Element</p>
                      <p className="text-2xl font-bold">{archetype.name}</p>
                      <p className="text-xs text-white/70">Orb intensity {Math.round(intensity * 100)}%</p>
                    </div>
                  </div>
                  <p className="max-w-sm text-sm text-white/70">{archetype.description}</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.5em] text-white/60">Archetype morph</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <span>{baseArchetype.name}</span>
                    <span className="text-white/60">→</span>
                    <span className="text-[#C8AA6E]">{archetype.name}</span>
                    <span className="text-xs text-emerald-300">{(archetype.shiftScore * 100).toFixed(0)}% alignment</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C8AA6E] via-emerald-300 to-sky-300"
                      style={{ width: `${clamp(archetype.shiftScore * 100, 8, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60">As deaths drop and KP stabilizes, your identity shifts toward {archetype.name} territory.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.5em] text-white/60">Milestones</p>
                  <div className="flex flex-wrap gap-3">
                    <Badge className={cn("px-3 py-1 text-xs", milestones.two ? "border-emerald-300 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-transparent text-white/60")}>+2% WR → Silver to Gold potential</Badge>
                    <Badge className={cn("px-3 py-1 text-xs", milestones.five ? "border-sky-300 bg-sky-300/10 text-sky-200" : "border-white/10 bg-transparent text-white/60")}>+5% WR → Master-tier fundamentals</Badge>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.5em] text-white/60">Model contributions</p>
                  {contributions.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <span>{item.label}</span>
                        <span className={item.value >= 0 ? "text-emerald-300" : "text-rose-300"}>
                          {item.value >= 0 ? "+" : ""}
                          {item.value.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/10">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.value >= 0 ? "bg-gradient-to-r from-emerald-400 to-sky-400" : "bg-gradient-to-r from-rose-400 to-orange-400",
                          )}
                          style={{ width: `${clamp(Math.abs(item.value) * 5, 3, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border-white/10 bg-black/50">
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-[#C8AA6E]">
              <Sparkles className="h-5 w-5" />
              <p className="text-sm uppercase tracking-[0.4em]">AI Coach</p>
            </div>
            <p className="flex-1 text-lg text-white/90">{commentary}</p>
            <div className="flex gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1"><Brain className="h-4 w-4" /> Mental</div>
              <div className="flex items-center gap-1"><Activity className="h-4 w-4" /> Mechanics</div>
              <div className="flex items-center gap-1"><Target className="h-4 w-4" /> Focus</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictLab;
