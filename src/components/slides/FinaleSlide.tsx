import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ChampionStats, PlayerStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, ArrowRight, Loader2 } from "lucide-react";
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

const RecapCardSection = ({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-hextech relative overflow-hidden p-4 sm:p-8">
      {/* Animated hextech background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 hexagon bg-primary animate-hextech-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 hexagon bg-accent animate-hextech-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 hexagon bg-primary animate-hextech-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-36 h-36 hexagon bg-accent animate-hextech-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="text-center space-y-8 sm:space-y-12 animate-fade-in max-w-3xl relative z-10 w-full px-4 overflow-y-auto max-h-screen py-8">
        {/* Trophy Icon with hextech styling */}
        <div className="relative">
          <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 mx-auto hexagon bg-gradient-gold opacity-30 animate-hextech-pulse blur-xl" />
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto hexagon bg-gradient-gold flex items-center justify-center border-4 border-accent shine-effect">
            <Trophy className="w-20 h-20 sm:w-24 sm:h-24 text-background drop-shadow-[0_0_20px_rgba(200,150,0,0.8)]" />
          </div>
        </div>

        {/* Title with LoL styling */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-hextech tracking-wider uppercase">
            Victory
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 uppercase tracking-widest break-words px-4">
            {playerData.riotId}'s Season Complete
          </p>
        </div>

        {/* Stats Summary with hextech styling */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 py-4 sm:py-8">
          <div className="space-y-1 sm:space-y-2 lol-corners p-3 sm:p-4 md:p-6 bg-card/40 backdrop-blur-sm border border-primary/30">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-hextech">{playerData.totalGames}</div>
            <div className="text-muted-foreground uppercase tracking-wider text-xs sm:text-sm">Battles</div>
          </div>
          <div className="space-y-1 sm:space-y-2 lol-corners p-3 sm:p-4 md:p-6 bg-card/40 backdrop-blur-sm border border-accent/30">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-glow-gold text-accent">{playerData.winRate.toFixed(0)}%</div>
            <div className="text-muted-foreground uppercase tracking-wider text-xs sm:text-sm">Victory</div>
          </div>
          <div className="space-y-1 sm:space-y-2 lol-corners p-3 sm:p-4 md:p-6 bg-card/40 backdrop-blur-sm border border-primary/30">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-hextech truncate">{playerData.topChampions[0]?.championName || "N/A"}</div>
            <div className="text-muted-foreground uppercase tracking-wider text-xs sm:text-sm">Main</div>
          </div>
        </div>

        {/* Archetype Badge with hextech styling */}
        <div className="inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 md:px-10 py-4 sm:py-5 lol-corners bg-card/60 backdrop-blur-sm border border-primary/40 shine-effect max-w-full">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 hexagon bg-gradient-hextech flex items-center justify-center flex-shrink-0">
            <span className="text-2xl sm:text-3xl">{playerData.archetype.icon}</span>
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Class</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate">{playerData.archetype.name}</p>
          </div>
        </div>

        {/* CTA Buttons with LoL styling */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-8 w-full max-w-md mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="lol-corners bg-card/80 backdrop-blur-sm border-primary/40 hover:bg-card hover:border-primary/60 text-primary w-full sm:w-auto"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Share Results
          </Button>
          <Button
            onClick={onContinue}
            variant="outline"
            size="lg"
            className="lol-corners bg-card/80 backdrop-blur-sm border-primary/40 hover:bg-card hover:border-primary/60 text-primary w-full sm:w-auto"
          >
            Continue
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-widest">
          Rift Rewind Chronicle
        </p>
      </div>
    </div>
  );
};

interface RecapCardProps {
  aspect: ShareAspect;
  playerData: PlayerStats;
  signatureTrio: ChampionStats[];
  statRelics: StatRelicBadge[];
  legendaryMoment: LegendaryMomentCopy;
  leagueTwin: LeagueTwinCopy;
}

const RecapCard = (
  {
    aspect,
    playerData,
    signatureTrio,
    statRelics,
    legendaryMoment,
    leagueTwin,
  }: RecapCardProps,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const isWide = aspect.orientation !== "portrait";
  const seasonStamp =
    formatDateLabel(playerData.generatedAt) ??
    format(new Date(), "MMMM d, yyyy");

  const headerWinRate = `${Math.round(playerData.winRate)}%`;
  const headerGames = `${playerData.totalGames} games`;
  const roleLabel = playerData.mainRole || "Flex";

  return (
    <div
      ref={ref}
      style={{
        width: aspect.width,
        height: aspect.height,
      }}
      className="relative overflow-hidden rounded-[48px] border border-primary/30 bg-gradient-to-br from-[#030916] via-[#0d1a37] to-[#120a1c] text-foreground shadow-[0_0_60px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute inset-0 opacity-25">
        <div className="absolute -top-16 -left-16 h-48 w-48 hexagon bg-primary/20 blur-2xl" />
        <div className="absolute top-1/3 right-12 h-40 w-40 hexagon bg-accent/20 blur-xl" />
        <div className="absolute bottom-12 left-1/4 h-32 w-32 hexagon bg-primary/15 blur-xl" />
      </div>
      <div className="relative z-10 flex h-full flex-col gap-12 p-16 text-white">
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.55em] text-primary/70">
              Rift Rewind Chronicle
            </p>
            <h2 className="text-5xl font-black uppercase tracking-widest text-hextech">
              {playerData.riotId}
            </h2>
            <p className="text-sm uppercase tracking-[0.45em] text-muted-foreground/80">
              Season Recap — {seasonStamp}
            </p>
          </div>
          <div className="lol-corners bg-white/10 px-6 py-5 text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Win Rate
            </p>
            <p className="text-3xl font-bold text-glow-gold">{headerWinRate}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              {headerGames}
            </p>
          </div>
        </div>

        {isWide ? (
          <div className="flex flex-1 gap-8">
            <div className="flex flex-1 flex-col gap-8">
              <RecapCardSection
                title="Archetype + Element"
                subtitle={`${playerData.archetype.icon} ${playerData.archetype.name}`}
              >
                <p className="text-base text-foreground">
                  {playerData.archetype.description}
                </p>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  <span>Element</span>
                  <div className="h-px flex-1 bg-primary/30" />
                  <span>{roleLabel}</span>
                </div>
              </RecapCardSection>

              <RecapCardSection title="Signature Trio">
                <div className="grid grid-cols-3 gap-3">
                  {signatureTrio.map((champion, index) => (
                    <div
                      key={`${champion.championId}-${index}`}
                      className="lol-corners bg-background/30 border border-primary/30 px-4 py-5 text-center"
                    >
                      <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
                        #{index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {champion.championName}
                      </p>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {champion.winRate ? `${champion.winRate.toFixed(0)}% WR` : "—"}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {champion.games} games
                      </p>
                    </div>
                  ))}
                </div>
              </RecapCardSection>

              <RecapCardSection title="Stat Relics">
                <div className="grid grid-cols-1 gap-3">
                  {statRelics.map((relic, index) => (
                    <div
                      key={`${relic.label}-${index}`}
                      className="rounded-md bg-background/30 px-4 py-3 text-left text-sm"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-semibold text-foreground">
                          {relic.label}
                        </div>
                        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                          {relic.value}
                        </div>
                      </div>
                      {relic.description && (
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {relic.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </RecapCardSection>
            </div>

            <div className="flex flex-1 flex-col gap-8">
              <RecapCardSection
                title="Legendary Moment"
                subtitle={legendaryMoment.title}
              >
                <p className="text-sm text-foreground/90">
                  {legendaryMoment.description}
                </p>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  {legendaryMoment.date}
                </p>
              </RecapCardSection>

              <RecapCardSection title="League Twin" subtitle={leagueTwin.name}>
                <p className="text-sm font-medium text-foreground/90">
                  {leagueTwin.subtitle}
                </p>
                <p className="text-sm text-muted-foreground/90">
                  {leagueTwin.description}
                </p>
                {typeof leagueTwin.similarity === "number" && (
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    {leagueTwin.similarity}% alignment
                  </p>
                )}
              </RecapCardSection>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-8">
            <RecapCardSection
              title="Archetype + Element"
              subtitle={`${playerData.archetype.icon} ${playerData.archetype.name}`}
            >
              <p className="text-base text-foreground">
                {playerData.archetype.description}
              </p>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                <span>Element</span>
                <div className="h-px flex-1 bg-primary/30" />
                <span>{roleLabel}</span>
              </div>
            </RecapCardSection>

            <RecapCardSection title="Signature Trio">
              <div className="grid grid-cols-3 gap-3">
                {signatureTrio.map((champion, index) => (
                  <div
                    key={`${champion.championId}-${index}`}
                    className="lol-corners bg-background/30 border border-primary/30 px-4 py-5 text-center"
                  >
                    <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
                      #{index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {champion.championName}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      {champion.winRate ? `${champion.winRate.toFixed(0)}% WR` : "—"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      {champion.games} games
                    </p>
                  </div>
                ))}
              </div>
            </RecapCardSection>

            <RecapCardSection title="Stat Relics">
              <div className="grid grid-cols-1 gap-3">
                {statRelics.map((relic, index) => (
                  <div
                    key={`${relic.label}-${index}`}
                    className="rounded-md bg-background/30 px-4 py-3 text-left text-sm"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-semibold text-foreground">
                        {relic.label}
                      </div>
                      <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                        {relic.value}
                      </div>
                    </div>
                    {relic.description && (
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        {relic.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </RecapCardSection>

            <RecapCardSection
              title="Legendary Moment"
              subtitle={legendaryMoment.title}
            >
              <p className="text-sm text-foreground/90">
                {legendaryMoment.description}
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                {legendaryMoment.date}
              </p>
            </RecapCardSection>

            <RecapCardSection title="League Twin" subtitle={leagueTwin.name}>
              <p className="text-sm font-medium text-foreground/90">
                {leagueTwin.subtitle}
              </p>
              <p className="text-sm text-muted-foreground/90">
                {leagueTwin.description}
              </p>
              {typeof leagueTwin.similarity === "number" && (
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  {leagueTwin.similarity}% alignment
                </p>
              )}
            </RecapCardSection>
          </div>
        )}

        <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-muted-foreground/80">
          <span>Share Your Legacy</span>
          <span>#{playerData.riotId.replace(/\s+/g, "")}</span>
        </div>
      </div>
    </div>
  );
};

const ExportableRecapCard = forwardRef<HTMLDivElement, RecapCardProps>(RecapCard);
ExportableRecapCard.displayName = "RecapCard";

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
      champions.push({ ...PLACEHOLDER_CHAMPION, championId: -champions.length - 1 });
    }
    return champions;
  }, [playerData.topChampions]);

  const statRelics = useMemo<StatRelicBadge[]>(() => {
    if (playerData.topStrengths && playerData.topStrengths.length) {
      return playerData.topStrengths.slice(0, 5).map((strength) => ({
        label: strength.metric,
        value: `${Math.round(strength.value)}%`,
        description: strength.description,
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
            ? formatDateLabel(playerData.currentStreak.startDate) ?? format(new Date(), "MMMM d, yyyy")
            : format(new Date(), "MMMM d, yyyy")),
        description:
          playerData.currentStreak.type === "win"
            ? "Closed the split on an unstoppable hot streak."
            : "Weathered adversity and kept queuing up.",
      };
    }

    return {
      title: "Season Complete",
      date: formatDateLabel(playerData.generatedAt) ?? format(new Date(), "MMMM d, yyyy"),
      description: `${playerData.totalGames} games. ${playerData.wins} wins. Countless memories.`,
    };
  }, [playerData.currentStreak, playerData.generatedAt, playerData.totalGames, playerData.watershedMoment, playerData.wins]);

  const leagueTwin = useMemo<LeagueTwinCopy>(() => {
    const pro = playerData.proComparison?.primary;
    if (pro) {
      const subtitleParts = [pro.team, pro.region, pro.role].filter(Boolean);
      return {
        name: pro.name,
        subtitle: subtitleParts.join(" • ") || "Pro Stage Doppelgänger",
        description:
          playerData.proComparison?.description ||
          playerData.playfulComparison ||
          "Your climb mirrors a decorated Rift veteran.",
        similarity: Math.round(playerData.proComparison?.similarity ?? 0),
      };
    }

    if (playerData.playfulComparison) {
      return {
        name: playerData.playfulComparison,
        subtitle: "Playstyle Match",
        description: "The Rift says you're cut from the same cloth.",
      };
    }

    return {
      name: "Rift Original",
      subtitle: "Forged Your Own Path",
      description: "No exact twin located — your style is unmistakably yours.",
    };
  }, [playerData.playfulComparison, playerData.proComparison]);

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
              <span className="text-2xl sm:text-3xl">{playerData.archetype.icon}</span>
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
            <Button
              variant="outline"
              size="lg"
              disabled={isGenerating}
              onClick={handleShare}
              className="lol-corners w-full border-primary/40 bg-card/80 text-primary backdrop-blur-sm hover:border-primary/60 hover:bg-card sm:w-auto"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              ) : (
                <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              )}
              {isGenerating ? "Generating..." : "Share Results"}
            </Button>
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

      <div
        aria-hidden="true"
        className="fixed left-[-9999px] top-0 flex select-none flex-col gap-10 opacity-0 pointer-events-none"
      >
        {SHARE_ASPECTS.map((aspect) => (
          <ExportableRecapCard
            key={aspect.id}
            aspect={aspect}
            playerData={playerData}
            signatureTrio={signatureTrio}
            statRelics={statRelics}
            legendaryMoment={legendaryMoment}
            leagueTwin={leagueTwin}
            ref={(node) => {
              cardRefs.current[aspect.id] = node;
            }}
          />
        ))}
      </div>
    </>
  );
};
