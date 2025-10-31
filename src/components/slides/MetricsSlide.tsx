import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { MetricProgress } from "@/components/ui/metric-progress";

interface MetricsSlideProps {
  playerData: PlayerStats;
}

export const MetricsSlide = ({ playerData }: MetricsSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-dark p-8 overflow-y-auto">
      <div className="max-w-6xl w-full space-y-12 animate-fade-in py-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-5xl md:text-6xl font-bold text-glow">
            Your Playstyle
          </h2>
          <p className="text-xl text-muted-foreground">
            {playerData.archetype.name}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
            <MetricsRadar
              metrics={playerData.derivedMetrics}
              title=""
            />

          {/* Key Metrics */}
          <Card className="p-8 card-glow">
            <h3 className="text-2xl font-semibold mb-6">Key Metrics</h3>
            <div className="space-y-6">
              <MetricProgress
                label="Early Game Strength"
                value={playerData.derivedMetrics.earlyGameStrength}
                description="Your effectiveness in the first 15 minutes"
              />
              <MetricProgress
                label="Late Game Scaling"
                value={playerData.derivedMetrics.lateGameScaling}
                description="Your impact in the late game"
              />
              <MetricProgress
                label="Consistency"
                value={playerData.derivedMetrics.consistency}
                description="How reliably you perform across games"
              />
              <MetricProgress
                label="Champion Pool Depth"
                value={playerData.derivedMetrics.championPoolDepth}
                description="Effectiveness across different champions"
              />
            </div>
          </Card>
        </div>

        {/* Archetype Explanation */}
        <Card className="p-8 card-glow bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{playerData.archetype.icon}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">
                {playerData.archetype.name}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {playerData.archetype.description}
              </p>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">Match Strength: </span>
                <span className="text-xl font-bold text-primary">
                  {playerData.archetype.matchPercentage}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
