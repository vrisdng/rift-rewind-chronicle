import type { PlayerStats } from "@/lib/api";
import { StrengthsWeaknesses } from "@/components/ui/pro-comparison";

interface StrengthsWeaknessesSlideProps {
  playerData: PlayerStats;
}

export const StrengthsWeaknessesSlide = ({ playerData }: StrengthsWeaknessesSlideProps) => {
  if (!playerData.topStrengths || !playerData.needsWork) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: 'url(/images/background-2.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="max-w-6xl w-full space-y-5 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
            The Full Picture
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            Your Strengths And Areas To Improve
          </p>
        </div>

        {/* Strengths & Weaknesses */}
        <StrengthsWeaknesses
          topStrengths={playerData.topStrengths}
          needsWork={playerData.needsWork}
        />
      </div>
    </div>
  );
};
