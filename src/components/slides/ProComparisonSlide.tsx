import type { PlayerStats } from "@/lib/api";
import { ProComparison } from "@/components/ui/pro-comparison";

interface ProComparisonSlideProps {
  playerData: PlayerStats;
}

export const ProComparisonSlide = ({ playerData }: ProComparisonSlideProps) => {
  if (!playerData.proComparison) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center lol-bg-subtle relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom-in"
        style={{ backgroundImage: 'url(/images/background.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="w-full h-full overflow-y-auto py-8 px-4 sm:px-8 relative z-10">
        <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in relative z-10">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
              Your Pro Twin
            </h2>
            <p className="lol-subheading text-gray-500 text-xs">
              You Play Like A Pro
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
    </div>
  );
};
