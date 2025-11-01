import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Zap, Sparkles, ArrowUp } from "lucide-react";

interface WatershedSlideProps {
  playerData: PlayerStats;
}

export const WatershedSlide = ({ playerData }: WatershedSlideProps) => {
  if (!playerData.watershedMoment) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-gold relative overflow-hidden p-4 sm:p-8">
      {/* Hexagonal pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-48 h-48 hexagon bg-accent animate-hextech-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 hexagon bg-accent animate-hextech-pulse" style={{ animationDelay: '0.7s' }} />
      </div>

      <div className="max-w-5xl w-full space-y-8 sm:space-y-12 animate-fade-in relative z-10 px-4 overflow-y-auto max-h-screen py-8">
        {/* Title */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 hexagon bg-accent/30 flex items-center justify-center animate-hextech-pulse">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-accent drop-shadow-[0_0_20px_rgba(200,150,0,0.8)]" />
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-glow-gold text-accent tracking-wide uppercase">
            Power Spike
          </h2>
          <p className="text-lg sm:text-xl text-foreground/80 uppercase tracking-widest">
            Your Turning Point
          </p>
        </div>

        {/* Watershed Content */}
        <Card className="p-6 sm:p-8 md:p-12 card-glow-gold lol-corners border-2 border-accent/40 bg-background/90 backdrop-blur-sm shine-effect">
          <div className="space-y-6 sm:space-y-8">
            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-center leading-relaxed text-foreground/90">
              {playerData.watershedMoment.description}
            </p>

            {/* Stats with hextech styling */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 text-center">
              {/* Before */}
              <div className="space-y-2 sm:space-y-3 lol-corners p-3 sm:p-4 md:p-6 bg-destructive/10 border border-destructive/30">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-destructive">
                  {playerData.watershedMoment.beforeAverage.toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm md:text-lg text-muted-foreground uppercase tracking-wider">Before</div>
              </div>

              {/* Improvement Arrow with hexagon */}
              <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 hexagon bg-gradient-gold flex items-center justify-center animate-hextech-pulse">
                  <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-background" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow-gold text-accent">
                  +{playerData.watershedMoment.improvement.toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Growth</div>
              </div>

              {/* After */}
              <div className="space-y-2 sm:space-y-3 lol-corners p-3 sm:p-4 md:p-6 bg-primary/10 border border-primary/30">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                  {playerData.watershedMoment.afterAverage.toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm md:text-lg text-muted-foreground uppercase tracking-wider">After</div>
              </div>
            </div>

            {/* Date with hextech styling */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 lol-corners bg-accent/20 border border-accent/40 max-w-full">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                <span className="text-sm sm:text-base text-foreground/80 font-semibold uppercase tracking-wider truncate">
                  {new Date(playerData.watershedMoment.gameDate).toLocaleDateString('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
