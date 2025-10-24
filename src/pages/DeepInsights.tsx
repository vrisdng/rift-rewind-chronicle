import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, TrendingUp, TrendingDown } from "lucide-react";

const DeepInsights = () => {
  const navigate = useNavigate();

  const strengths = [
    { label: "Objective Control", percentile: 95 },
    { label: "Vision Score", percentile: 88 },
  ];

  const weaknesses = [
    { label: "Lane Harassment", percentile: 20 },
    { label: "Early Game Gold", percentile: 35 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">Know Thy Playstyle</h1>
        <p className="text-muted-foreground text-lg mb-12">Deep analysis of your 2025 performance</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Radar Chart Placeholder */}
          <Card className="p-8 card-glow">
            <h2 className="text-2xl font-bold mb-6">Playstyle Profile</h2>
            <div className="aspect-square bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20">
              <p className="text-muted-foreground">Radar Chart</p>
            </div>
          </Card>

          {/* AI Insight */}
          <Card className="p-8 card-glow">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">AI Analysis</h2>
            </div>
            <p className="text-lg leading-relaxed mb-6">
              You play as a <span className="text-primary font-bold">Calculated Strategist</span> — patient, 
              vision-focused, with a knack for comeback fights. Compared to last year, your early game 
              aggression rose by <span className="text-accent font-bold">18%</span>.
            </p>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 card-glow border-primary/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">Strengths</h3>
            </div>
            <div className="space-y-3">
              {strengths.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="text-primary font-bold">Top {100 - s.percentile}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 card-glow border-accent/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-bold">Needs Work</h3>
            </div>
            <div className="space-y-3">
              {weaknesses.map(w => (
                <div key={w.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{w.label}</span>
                    <span className="text-accent font-bold">Bottom {w.percentile}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Button variant="hero" size="lg" onClick={() => navigate("/highlights")}>
          Continue to Highlights →
        </Button>
      </div>
    </div>
  );
};

export default DeepInsights;
