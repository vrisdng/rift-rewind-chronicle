import type { PlayerStats } from "@/lib/api";

interface StoryArcSlideProps {
  playerData: PlayerStats;
}

export const StoryArcSlide = ({ playerData }: StoryArcSlideProps) => {
  if (!playerData.insights?.story_arc) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center lol-bg-subtle relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: 'url(/images/background-2.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="w-full h-full overflow-y-auto py-8 px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in relative z-10">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E] break-words">
              {playerData.insights.title}
            </h2>
            <p className="lol-subheading text-gray-500 text-xs">
              Your Season Story
            </p>
          </div>

          {/* Story Content */}
          <div className="lol-card p-4 sm:p-6 border-[#C8AA6E]">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-300 text-center lol-body break-words">
              {playerData.insights.story_arc}
            </p>
          </div>

          {/* Season Prediction */}
          {playerData.insights.season_prediction && (
            <div className="lol-card p-4 sm:p-5 border-[#C8AA6E]/60 mb-8">
              <div className="text-center space-y-2 lol-accent-bar pl-4">
                <h3 className="lol-subheading text-[#C8AA6E] text-xs">
                  2025 Prediction
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 lol-body break-words">
                  {playerData.insights.season_prediction}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
