import type { PlayerStats } from "@/lib/api";
import { Trophy } from "lucide-react";

interface IntroSlideProps {
  playerData: PlayerStats;
}

export const IntroSlide = ({ playerData }: IntroSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0A1428] relative overflow-hidden p-4 sm:p-8">
      {/* Gradient overlay similar to Landing page */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      {/* Gold decorative hexagons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 hexagon bg-[#C8AA6E] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 hexagon bg-[#C8AA6E] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-10 w-24 h-24 hexagon bg-[#C8AA6E] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="text-center space-y-6 sm:space-y-8 animate-fade-in relative z-10 max-w-4xl mx-auto w-full px-4">
        {/* Icon with gold championship styling */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
          <div className="absolute inset-0 hexagon bg-[#C8AA6E]/30 opacity-30 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 hexagon bg-background/40 backdrop-blur-sm flex items-center justify-center border-2 border-[#C8AA6E]">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-[#C8AA6E] drop-shadow-[0_0_20px_rgba(200,170,110,0.8)]" />
          </div>
        </div>

        {/* Year with gold glow */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-[#C8AA6E] gold-glow tracking-wider">
            2024
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 font-semibold tracking-wide uppercase drop-shadow-lg">
            Season Rewind
          </p>
        </div>

        {/* Player info */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] break-words px-4">
            {playerData.riotId}<span className="text-[#C8AA6E]">#{playerData.tagLine}</span>
          </h2>

          {/* Archetype - Gold championship badge */}
          <div className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#C8AA6E]/10 border-2 border-[#C8AA6E]/40 backdrop-blur-sm max-w-full" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
            <span className="text-3xl sm:text-4xl">{playerData.archetype.icon}</span>
            <div className="text-left">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Class</p>
              <p className="text-lg sm:text-xl font-bold text-[#C8AA6E] truncate max-w-[200px] sm:max-w-none">{playerData.archetype.name}</p>
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2">
          <p className="text-gray-400 text-xs sm:text-sm animate-pulse uppercase tracking-wider">
            → Continue
          </p>
        </div>
      </div>
    </div>
  );
};
