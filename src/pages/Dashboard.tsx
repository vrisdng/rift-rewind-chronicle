import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Sword, Eye, Target } from "lucide-react";

const Dashboard = () => {
  const stats = {
    totalMatches: 247,
    winRate: 56.3,
    kills: 1842,
    assists: 2156,
    csPerMin: 7.2,
    visionScore: 42,
    pentakills: 3,
    rank: "Diamond II"
  };

  const topChampions = [
    { name: "Ahri", matches: 45, winRate: 62 },
    { name: "Zed", matches: 38, winRate: 58 },
    { name: "Yasuo", matches: 32, winRate: 53 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-dark">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-magical flex items-center justify-center card-glow">
              <Trophy className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 text-glow">Your 2025 Season</h1>
              <p className="text-muted-foreground text-lg">The journey that defined your climb</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-3xl font-bold bg-gradient-magical bg-clip-text text-transparent">
                {stats.rank}
              </div>
              <p className="text-muted-foreground">Current Rank</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8">Your 2025 in Numbers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 card-glow hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalMatches}</div>
                <p className="text-muted-foreground">Total Matches</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-glow hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.winRate}%</div>
                <p className="text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-glow hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sword className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.kills}</div>
                <p className="text-muted-foreground">Total Kills</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-glow hover:scale-105 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.visionScore}</div>
                <p className="text-muted-foreground">Avg Vision Score</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Champions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Champion Essence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topChampions.map((champion, index) => (
              <Card key={champion.name} className="p-6 card-glow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold bg-gradient-magical bg-clip-text text-transparent">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{champion.name}</h3>
                    <p className="text-muted-foreground">{champion.matches} matches</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-bold">{champion.winRate}%</span>
                  </div>
                  <Progress value={champion.winRate} className="h-2" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Journey Timeline Placeholder */}
        <Card className="p-8 card-glow mb-8">
          <h2 className="text-2xl font-bold mb-4">The Journey</h2>
          <p className="text-muted-foreground mb-6">
            Your climb through the ranks — from your first match to reaching Diamond II
          </p>
          <div className="h-32 bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20">
            <p className="text-muted-foreground">Timeline visualization coming soon</p>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => window.location.href = "/deep-insights"}
          >
            Continue to Deep Insights →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
