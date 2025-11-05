import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { MetricProgress } from "@/components/ui/metric-progress";

interface MetricsSlideProps {
  playerData: PlayerStats;
}

export const MetricsSlide = ({ playerData }: MetricsSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0A1428] relative p-8 overflow-y-auto">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      <div className="max-w-6xl w-full space-y-12 animate-fade-in py-8 relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-5xl md:text-6xl font-bold text-[#C8AA6E] gold-glow">
            Your Playstyle
          </h2>
          <p className="text-xl text-gray-300">
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
          <Card className="p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E]/30 shadow-[0_0_40px_rgba(200,170,110,0.3)]">
            <h3 className="text-2xl font-semibold mb-6 text-[#C8AA6E]">Key Metrics</h3>
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
        <Card className="p-8 bg-[#C8AA6E]/10 backdrop-blur-md border-2 border-[#C8AA6E]/40 shadow-[0_0_40px_rgba(200,170,110,0.3)]">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{playerData.archetype.icon}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 text-[#C8AA6E]">
                {playerData.archetype.name}
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                {playerData.archetype.description}
              </p>
              <div className="mt-4">
                <span className="text-sm text-gray-400 font-bold">Match Strength: </span>
                <span className="text-xl font-bold text-[#C8AA6E]">
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
