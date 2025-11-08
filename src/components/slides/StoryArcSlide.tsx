import type { PlayerStats } from "@/lib/api";

interface StoryArcSlideProps {
  playerData: PlayerStats;
}

export const StoryArcSlide = ({ playerData }: StoryArcSlideProps) => {
  if (!playerData.insights?.season_prediction) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: 'url(/images/background-2.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="max-w-4xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
            Looking Ahead
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            2026 Prediction
          </p>
        </div>

        {/* Season Prediction */}
        <div className="lol-card p-6 sm:p-8 border-[#C8AA6E]">
          <div className="text-center space-y-4">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-300 lol-body break-words">
              {playerData.insights.season_prediction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
