import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Brain, Lightbulb, Target } from "lucide-react";

interface InsightsSlideProps {
  playerData: PlayerStats;
}

export const InsightsSlide = ({ playerData }: InsightsSlideProps) => {
  if (!playerData.insights?.surprising_insights) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-start bg-[#0A1428] relative p-8 overflow-y-auto">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      <div className="max-w-5xl w-full space-y-12 animate-fade-in py-8 relative z-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-[#C8AA6E]" />
          <h2 className="text-5xl md:text-6xl font-bold text-[#C8AA6E] gold-glow">
            Hidden Insights
          </h2>
          <p className="text-xl text-gray-300">
            What the data reveals
          </p>
        </div>

        {/* Surprising Insights */}
        <div className="space-y-6">
          {playerData.insights.surprising_insights.map((insight, index) => (
            <Card
              key={index}
              className="p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E]/30 shadow-[0_0_40px_rgba(200,170,110,0.3)] hover:scale-102 transition-all"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C8AA6E]/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-[#C8AA6E]" />
                </div>
                <p className="text-xl text-gray-300 flex-1 leading-relaxed">
                  {insight}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Improvement Tips */}
        {playerData.insights.improvement_tips && playerData.insights.improvement_tips.length > 0 && (
          <>
            <div className="text-center space-y-2 pt-8">
              <Target className="w-12 h-12 mx-auto text-[#C8AA6E]" />
              <h3 className="text-3xl font-bold text-[#C8AA6E] gold-glow">
                Level Up
              </h3>
              <p className="text-lg text-gray-300">
                Tips to improve your game
              </p>
            </div>

            <div className="space-y-6">
              {playerData.insights.improvement_tips.map((tip, index) => (
                <Card
                  key={index}
                  className="p-8 bg-[#C8AA6E]/10 backdrop-blur-md border-2 border-[#C8AA6E]/40 shadow-[0_0_40px_rgba(200,170,110,0.3)] hover:scale-102 transition-all"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#C8AA6E]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-[#C8AA6E]">{index + 1}</span>
                    </div>
                    <p className="text-lg text-gray-300 flex-1 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
