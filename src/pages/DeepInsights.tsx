import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { Brain, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlayerStats } from "@/lib/api";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import Chatbot from '@/components/ui/chatbot';

const DeepInsights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const data = location.state?.playerData;
    if (!data) {
      navigate("/");
    } else {
      setPlayerData(data);
    }
  }, [location.state, navigate]);

  if (!playerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deep insights...</p>
        </div>
      </div>
    );
  }

  const { insights, archetype, derivedMetrics } = playerData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">Know Thy Playstyle</h1>
        <p className="text-muted-foreground text-lg mb-12">Deep analysis of your 2025 performance</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <MetricsRadar metrics={derivedMetrics} title="Playstyle Profile" />

          {/* AI Insight */}
          <Card className="p-8 card-glow">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">AI Archetype Analysis</h2>
            </div>
            <p className="text-lg leading-relaxed mb-6">
              {insights?.archetype_explanation ||
                `You play as a <span className="text-primary font-bold">${archetype.name}</span> — patient, vision-focused, with a knack for comeback fights.`}
            </p>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 card-glow border-primary/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">Surprising Insights</h3>
            </div>
            <div className="space-y-3">
              {insights?.surprising_insights?.map((insight, index) => (
                <p key={index} className="text-muted-foreground">{insight}</p>
              ))}
            </div>
          </Card>

          <Card className="p-6 card-glow border-accent/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-bold">Improvement Tips</h3>
            </div>
            <div className="space-y-3">
              {insights?.improvement_tips?.map((tip, index) => (
                <p key={index} className="text-muted-foreground">{tip}</p>
              ))}
            </div>
          </Card>
        </div>

        {/* Season Prediction */}
        {insights?.season_prediction && (
          <Card className="p-8 card-glow mb-12 bg-gradient-magical/10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">2026 Season Prediction</h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {insights.season_prediction}
            </p>
          </Card>
        )}

        <Button variant="hero" size="lg" onClick={() => navigate("/highlights", { state: { playerData } })}>
          Continue to Highlights →
        </Button>
        <Chatbot />
      </div>
    </div>
  );
};

export default DeepInsights;