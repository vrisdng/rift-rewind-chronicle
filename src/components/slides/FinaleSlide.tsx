import type { PlayerStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, ArrowRight } from "lucide-react";

interface FinaleSlideProps {
  playerData: PlayerStats;
  onContinue: () => void;
}

export const FinaleSlide = ({ playerData, onContinue }: FinaleSlideProps) => {
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
            size="lg"
            onClick={onContinue}
            className="lol-corners bg-gradient-gold hover:opacity-90 text-background font-bold uppercase tracking-wider border-2 border-accent/50 w-full sm:w-auto"
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
