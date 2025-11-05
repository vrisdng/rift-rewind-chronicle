import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface StoryArcSlideProps {
  playerData: PlayerStats;
}

export const StoryArcSlide = ({ playerData }: StoryArcSlideProps) => {
  if (!playerData.insights?.story_arc) return null;

  return (
    <div className="w-full h-screen flex flex-col overflow-y-auto items-center justify-start bg-[#0A1428] relative p-8">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      <div className="max-w-4xl w-full space-y-12 animate-fade-in my-auto relative z-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-[#C8AA6E]" />
          <h2 className="text-5xl md:text-6xl font-bold text-[#C8AA6E] gold-glow">
            {playerData.insights.title}
          </h2>
          <p className="text-xl text-gray-300">
            Your story
          </p>
        </div>

        {/* Story Content */}
        <Card className="p-12 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E]/30 shadow-[0_0_40px_rgba(200,170,110,0.3)]">
          <p className="text-2xl leading-relaxed text-gray-300 text-center">
            {playerData.insights.story_arc}
          </p>
        </Card>

        {/* Season Prediction */}
        {playerData.insights.season_prediction && (
          <Card className="p-8 bg-[#C8AA6E]/10 backdrop-blur-md border-2 border-[#C8AA6E]/40 shadow-[0_0_40px_rgba(200,170,110,0.3)]">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-[#C8AA6E]">
                2025 Prediction
              </h3>
              <p className="text-lg text-gray-300">
                {playerData.insights.season_prediction}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
