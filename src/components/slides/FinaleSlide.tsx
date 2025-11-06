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
    <div
      className={cn(
        "lol-corners bg-card/40 border border-primary/40 backdrop-blur-sm p-8 text-left",
        className
      )}
    >
      <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
        {title}
      </p>
      {subtitle && (
        <p className="mt-2 text-xl font-semibold text-foreground">{subtitle}</p>
      )}
      <div className="mt-5 space-y-3 text-sm text-muted-foreground/90">
        {children}
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

  const topChampion = playerData.topChampions?.[0];

  return (
    <div
      ref={ref}
      style={{
        width: aspect.width,
        height: aspect.height,
      }}
      className="relative overflow-hidden rounded-[48px] border border-primary/30 bg-gradient-to-br from-[#030916] via-[#0d1a37] to-[#120a1c] text-foreground shadow-[0_0_60px_rgba(0,0,0,0.45)]"
    >
      {/* Champion Splash Art Background */}
      {topChampion?.splashArtUrl && (
        <div className="absolute inset-0">
          <img
            src={topChampion.splashArtUrl}
            alt={topChampion.championName}
            className="w-full h-full object-cover opacity-20"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#030916]/90 via-[#0d1a37]/85 to-[#120a1c]/90" />
        </div>
      )}

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
      <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
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
          <div className="grid grid-cols-3 gap-4">
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
            <div className="lol-card p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-[#C8AA6E] lol-body truncate">
                {playerData.topChampions[0]?.championName || "N/A"}
              </div>
              <div className="lol-subheading text-gray-600 text-xs mt-1">
                Main
              </div>
            </div>
          </div>

          {/* Archetype Badge */}
          <div className="flex justify-center">
            <div className="lol-card inline-flex items-center gap-3 px-6 py-3 border-[#C8AA6E]/40">
              <div className="flex h-12 w-12 items-center justify-center bg-[#C8AA6E]/10 rounded">
                <span className="text-2xl">{playerData.archetype.icon}</span>
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
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              disabled={isGenerating}
              onClick={handleShare}
              className="border-[#C8AA6E]/40 bg-transparent text-[#C8AA6E] hover:bg-[#C8AA6E]/10 hover:border-[#C8AA6E]/60 transition-all duration-300"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Share Results"}
            </Button>
            <Button
              size="lg"
              onClick={onContinue}
              className="bg-[#C8AA6E] text-[#0A1428] font-bold hover:bg-[#C8AA6E]/90 transition-all duration-300 lol-heading"
            >
              Continue
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
