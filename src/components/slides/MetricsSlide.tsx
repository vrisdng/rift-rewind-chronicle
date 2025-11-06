import type { PlayerStats } from "@/lib/api";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { MetricProgress } from "@/components/ui/metric-progress";

interface MetricsSlideProps {
  playerData: PlayerStats;
}

export const MetricsSlide = ({ playerData }: MetricsSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative p-8 overflow-hidden">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl sm:text-5xl md:text-6xl text-[#C8AA6E]">
            Your Playstyle
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            {playerData.archetype.name}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <MetricsRadar
            metrics={playerData.derivedMetrics}
            title=""
          />

          {/* Key Metrics */}
          <div className="lol-card p-6 space-y-4">
            <h3 className="lol-subheading text-[#C8AA6E] text-xs mb-3 lol-accent-bar pl-4">Key Metrics</h3>
            <div className="space-y-4">
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
          </div>
        </div>

        {/* Archetype Explanation - Compact */}
        <div className="lol-card p-6 border-[#C8AA6E]">
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">{playerData.archetype.icon}</div>
            <div className="flex-1 lol-accent-bar pl-4">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="text-xl font-bold text-[#C8AA6E] lol-body">
                  {playerData.archetype.name}
                </h3>
                <div className="flex items-baseline gap-2 flex-shrink-0">
                  <span className="lol-subheading text-gray-500 text-xs">Match:</span>
                  <span className="text-lg font-bold text-[#C8AA6E] lol-body">
                    {playerData.archetype.matchPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed lol-body">
                {playerData.archetype.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
