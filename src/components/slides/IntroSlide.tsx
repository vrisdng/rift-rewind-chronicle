import type { PlayerStats } from "@/lib/api";
import { Trophy } from "lucide-react";

interface IntroSlideProps {
  playerData: PlayerStats;
}

export const IntroSlide = ({ playerData }: IntroSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-hextech relative overflow-hidden p-4 sm:p-8">
      {/* Hextech pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 hexagon bg-primary animate-hextech-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 hexagon bg-primary animate-hextech-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-10 w-24 h-24 hexagon bg-accent animate-hextech-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="text-center space-y-6 sm:space-y-8 animate-fade-in relative z-10 max-w-4xl mx-auto w-full px-4">
        {/* Icon with hextech styling */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
          <div className="absolute inset-0 hexagon bg-gradient-hextech opacity-30 animate-hextech-pulse" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 hexagon bg-background/40 backdrop-blur-sm flex items-center justify-center border-2 border-primary">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary drop-shadow-[0_0_10px_rgba(0,180,230,0.8)]" />
          </div>
        </div>

        {/* Year with hextech glow */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-hextech tracking-wider">
            2024
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-foreground/80 font-semibold tracking-wide uppercase">
            Season Rewind
          </p>
        </div>

        {/* Player info */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow break-words px-4">
            {playerData.riotId}<span className="text-foreground/50">#{playerData.tagLine}</span>
          </h2>

          {/* Archetype - LoL styled badge */}
          <div className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 lol-corners bg-card/80 backdrop-blur-sm border border-primary/40 shine-effect max-w-full">
            <span className="text-3xl sm:text-4xl">{playerData.archetype.icon}</span>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Class</p>
              <p className="text-lg sm:text-xl font-bold text-primary truncate max-w-[200px] sm:max-w-none">{playerData.archetype.name}</p>
            </div>
          </div>
        </div>

        {/* Swipe hint with hextech styling */}
        <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2">
          <p className="text-muted-foreground text-xs sm:text-sm animate-pulse uppercase tracking-wider">
            → Continue
          </p>
        </div>
      </div>
    </div>
  );
};
