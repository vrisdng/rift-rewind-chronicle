import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Target } from "lucide-react";

const GrowthMap = () => {
  const navigate = useNavigate();

  const tips = [
    "Improve warding by 12% to reach top 10% of your rank",
    "Try reducing champ pool to 5 mains — improves climb efficiency",
    "Focus on early game aggression in first 10 minutes"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">Your Progress Curve</h1>
        <p className="text-muted-foreground text-lg mb-12">Track your climb through the season</p>

        <Card className="p-8 card-glow mb-12">
          <h2 className="text-2xl font-bold mb-6">2025 Journey</h2>
          <div className="h-64 bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20">
            <p className="text-muted-foreground">Progress Chart (Months vs Rank/KDA)</p>
          </div>
        </Card>

        <Card className="p-8 card-glow mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Next Year Focus</h2>
          </div>
          <div className="space-y-4">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                <Target className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <p className="text-lg">{tip}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/archetype")}>
            ← Back
          </Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/social")}>
            Continue to Social →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GrowthMap;
