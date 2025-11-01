import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Brain, Lightbulb, Target } from "lucide-react";

interface InsightsSlideProps {
  playerData: PlayerStats;
}

export const InsightsSlide = ({ playerData }: InsightsSlideProps) => {
  if (!playerData.insights?.surprising_insights) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-start bg-gradient-dark p-8 overflow-y-auto">
      <div className="max-w-5xl w-full space-y-12 animate-fade-in py-8">
        {/* Title */}
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-5xl md:text-6xl font-bold text-glow">
            Hidden Insights
          </h2>
          <p className="text-xl text-muted-foreground">
            What the data reveals
          </p>
        </div>

        {/* Surprising Insights */}
        <div className="space-y-6">
          {playerData.insights.surprising_insights.map((insight, index) => (
            <Card
              key={index}
              className="p-8 card-glow hover:scale-102 transition-all"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xl text-muted-foreground flex-1 leading-relaxed">
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
              <Target className="w-12 h-12 mx-auto text-accent" />
              <h3 className="text-3xl font-bold text-glow">
                Level Up
              </h3>
              <p className="text-lg text-muted-foreground">
                Tips to improve your game
              </p>
            </div>

            <div className="space-y-6">
              {playerData.insights.improvement_tips.map((tip, index) => (
                <Card
                  key={index}
                  className="p-8 card-glow border-accent/30 bg-accent/5 hover:scale-102 transition-all"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent">{index + 1}</span>
                    </div>
                    <p className="text-lg text-muted-foreground flex-1 leading-relaxed">
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
