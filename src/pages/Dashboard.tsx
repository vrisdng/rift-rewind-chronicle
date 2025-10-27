import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Sword, Eye, Target, TrendingUp, Sparkles, Zap, Brain, Crosshair } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { PlayerStats } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { MetricProgress } from "@/components/ui/metric-progress";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const data = location.state?.playerData;
    if (!data) {
      // No data, redirect to landing
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
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalMatches: playerData.totalGames,
    winRate: playerData.winRate,
    kills: Math.round(playerData.avgKills * playerData.totalGames),
    assists: Math.round(playerData.avgAssists * playerData.totalGames),
    avgKDA: playerData.avgKDA,
    visionScore: Math.round(playerData.avgVisionScore),
    archetype: playerData.archetype.name,
  };

  const topChampions = playerData.topChampions.slice(0, 3);

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
              <h1 className="text-4xl font-bold mb-2 text-glow">
                {playerData.insights?.title || "Your 2024 Season"}
              </h1>
              <p className="text-muted-foreground text-lg">
                {playerData.riotId}#{playerData.tagLine} • {playerData.mainRole}
              </p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-3xl font-bold bg-gradient-magical bg-clip-text text-transparent flex items-center gap-2 justify-end">
                <span>{stats.archetype}</span>
                <span>{playerData.archetype.icon}</span>
              </div>
              <p className="text-muted-foreground">Your Archetype</p>
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
                <div className="text-3xl font-bold">{stats.avgKDA.toFixed(2)}</div>
                <p className="text-muted-foreground">Average KDA</p>
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
                <p className="text-muted-foreground">Vision Score</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Champions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Champion Essence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topChampions.map((champion, index) => (
              <Card key={champion.championName} className="p-6 card-glow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold bg-gradient-magical bg-clip-text text-transparent">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{champion.championName}</h3>
                    <p className="text-muted-foreground">{champion.games} games</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-bold">{champion.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={champion.winRate} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <div className="font-bold text-primary">{champion.avgKills.toFixed(1)}</div>
                      <div className="text-muted-foreground">K</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-400">{champion.avgDeaths.toFixed(1)}</div>
                      <div className="text-muted-foreground">D</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">{champion.avgAssists.toFixed(1)}</div>
                      <div className="text-muted-foreground">A</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Trend */}
        {playerData.performanceTrend && playerData.performanceTrend.length > 0 && (
          <Card className="p-8 card-glow mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Performance Over Time
            </h2>
            <p className="text-muted-foreground mb-6">
              Your weekly performance score throughout 2024
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={playerData.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short' })}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="performanceScore"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Watershed Moment */}
        {playerData.watershedMoment && (
          <Card className="p-8 card-glow mb-8 border-2 border-primary/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Your Watershed Moment
                </h2>
                <p className="text-lg mb-4">{playerData.watershedMoment.description}</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {playerData.watershedMoment.beforeAverage.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Before</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      +{playerData.watershedMoment.improvement.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Improvement</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {playerData.watershedMoment.afterAverage.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">After</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Player Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <MetricsRadar 
            metrics={playerData.derivedMetrics}
            title="Your Playstyle Radar"
          />
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-6">
              <MetricProgress
                label="Early Game Strength"
                value={playerData.derivedMetrics.earlyGameStrength}
                description="Your effectiveness in the first 15 minutes"
              />
              <MetricProgress
                label="Late Game Scaling"
                value={playerData.derivedMetrics.lateGameScaling}
                description="Your impact in the late game"
              />
              <MetricProgress
                label="Consistency"
                value={playerData.derivedMetrics.consistency}
                description="How reliably you perform across games"
              />
              <MetricProgress
                label="Champion Pool Depth"
                value={playerData.derivedMetrics.championPoolDepth}
                description="Effectiveness across different champions"
              />
            </div>
          </Card>
        </div>

        {/* AI Story Arc */}
        {playerData.insights?.story_arc && (
          <Card className="p-8 card-glow mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Year in Review</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {playerData.insights.story_arc}
            </p>
          </Card>
        )}

        {/* Surprising Insights */}
        {playerData.insights?.surprising_insights && (
          <Card className="p-8 card-glow mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Surprising Insights
            </h2>
            <ul className="space-y-4">
              {playerData.insights.surprising_insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Crosshair className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                  <p className="text-muted-foreground">{insight}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

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
