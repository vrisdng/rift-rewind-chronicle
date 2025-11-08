import type { PlayerStats } from "@/lib/api";
import { ArrowUp } from "lucide-react";

interface WatershedSlideProps {
  playerData: PlayerStats;
}

export const WatershedSlide = ({ playerData }: WatershedSlideProps) => {
  if (!playerData.watershedMoment) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: 'url(/images/background-1.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="max-w-5xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl sm:text-5xl md:text-6xl text-[#C8AA6E]">
            Power Spike
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            Your Turning Point
          </p>
        </div>

        {/* Watershed Content */}
        <div className="lol-card p-8 border-[#C8AA6E]">
          <div className="space-y-6">
            {/* Description */}
            <p className="text-lg sm:text-xl text-center leading-relaxed text-gray-200 lol-body">
              {playerData.watershedMoment.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Before */}
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-500 lol-body">
                  {playerData.watershedMoment.beforeAverage.toFixed(1)}
                </div>
                <div className="lol-subheading text-gray-600 text-xs">Before</div>
              </div>

              {/* Improvement Arrow */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#C8AA6E] flex items-center justify-center">
                  <ArrowUp className="w-8 h-8 text-[#0A1428]" />
                </div>
                <div className="mt-2 text-xl font-bold text-[#C8AA6E] lol-body">
                  +{playerData.watershedMoment.improvement.toFixed(1)}
                </div>
              </div>

              {/* After */}
              <div className="space-y-2">
                <div className="text-4xl font-bold text-[#C8AA6E] lol-body">
                  {playerData.watershedMoment.afterAverage.toFixed(1)}
                </div>
                <div className="lol-subheading text-gray-600 text-xs">After</div>
              </div>
            </div>

            {/* Match Details */}
            <div className="text-center pt-4 border-t border-gray-800">
              <div className="lol-body text-gray-400 text-sm mb-1">
                <span className="text-[#C8AA6E] font-bold">{playerData.watershedMoment.championName}</span>
                <span className="mx-2">•</span>
                <span>{new Date(playerData.watershedMoment.gameDate).toLocaleDateString()}</span>
              </div>
              <div className={`text-xs lol-subheading ${playerData.watershedMoment.result ? 'text-[#C8AA6E]' : 'text-gray-500'}`}>
                {playerData.watershedMoment.result ? 'VICTORY' : 'DEFEAT'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
