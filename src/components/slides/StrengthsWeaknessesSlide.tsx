import type { PlayerStats } from "@/lib/api";
import { StrengthsWeaknesses } from "@/components/ui/pro-comparison";

interface StrengthsWeaknessesSlideProps {
  playerData: PlayerStats;
}

export const StrengthsWeaknessesSlide = ({ playerData }: StrengthsWeaknessesSlideProps) => {
  if (!playerData.topStrengths || !playerData.needsWork) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-dark p-8">
      <div className="max-w-6xl w-full space-y-12 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-5xl md:text-6xl font-bold text-glow">
            The Full Picture
          </h2>
          <p className="text-xl text-muted-foreground">
            Your strengths and areas to improve
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
