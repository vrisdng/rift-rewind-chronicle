import type { PlayerStats } from "@/lib/api";
import { ProComparison } from "@/components/ui/pro-comparison";

interface ProComparisonSlideProps {
  playerData: PlayerStats;
}

export const ProComparisonSlide = ({ playerData }: ProComparisonSlideProps) => {
  if (!playerData.proComparison) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-dark p-8">
      <div className="max-w-6xl w-full space-y-12 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-5xl md:text-6xl font-bold text-glow">
            Your Pro Twin
          </h2>
          <p className="text-xl text-muted-foreground">
            You play like a pro
          </p>
        </div>

        {/* Pro Comparison */}
        <ProComparison
          primary={playerData.proComparison.primary}
          secondary={playerData.proComparison.secondary}
          similarity={playerData.proComparison.similarity}
          description={playerData.proComparison.description}
          playfulComparison={playerData.playfulComparison}
        />
      </div>
    </div>
  );
};
