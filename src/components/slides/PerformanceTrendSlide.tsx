import type { PlayerStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface PerformanceTrendSlideProps {
  playerData: PlayerStats;
}

export const PerformanceTrendSlide = ({ playerData }: PerformanceTrendSlideProps) => {
  if (!playerData.performanceTrend || playerData.performanceTrend.length === 0) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-dark p-8">
      <div className="max-w-6xl w-full space-y-12 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <TrendingUp className="w-12 h-12 text-primary" />
            <h2 className="text-5xl md:text-6xl font-bold text-glow">
              Your Journey
            </h2>
          </div>
          <p className="text-xl text-muted-foreground">
            Performance throughout the year
          </p>
        </div>

        {/* Chart */}
        <Card className="p-8 card-glow">
          <div className="h-96">
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
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
