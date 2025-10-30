import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface StoryArcSlideProps {
  playerData: PlayerStats;
}

export const StoryArcSlide = ({ playerData }: StoryArcSlideProps) => {
  if (!playerData.insights?.story_arc) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-dark p-8">
      <div className="max-w-4xl w-full space-y-12 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-5xl md:text-6xl font-bold text-glow">
            {playerData.insights.title}
          </h2>
          <p className="text-xl text-muted-foreground">
            Your story
          </p>
        </div>

        {/* Story Content */}
        <Card className="p-12 card-glow bg-background/50 backdrop-blur-sm">
          <p className="text-2xl leading-relaxed text-muted-foreground text-center">
            {playerData.insights.story_arc}
          </p>
        </Card>

        {/* Season Prediction */}
        {playerData.insights.season_prediction && (
          <Card className="p-8 card-glow border-accent/30 bg-accent/5">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-accent">
                2025 Prediction
              </h3>
              <p className="text-lg text-muted-foreground">
                {playerData.insights.season_prediction}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
