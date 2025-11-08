import type { PlayerStats } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Minus, Trophy, Target } from "lucide-react";

interface PerformanceTrendSlideProps {
  playerData: PlayerStats;
}

export const PerformanceTrendSlide = ({ playerData }: PerformanceTrendSlideProps) => {
  if (!playerData.performanceTrend || playerData.performanceTrend.length === 0) return null;

  // Calculate performance insights
  const scores = playerData.performanceTrend.map(d => d.performanceScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const latestScore = scores[scores.length - 1];
  const firstScore = scores[0];
  const overallTrend = latestScore - firstScore;
  
  // Find best and worst periods
  const maxIndex = scores.indexOf(maxScore);
  const minIndex = scores.indexOf(minScore);
  const bestPeriod = playerData.performanceTrend[maxIndex];
  const worstPeriod = playerData.performanceTrend[minIndex];

  // Determine trend direction
  const getTrendIcon = () => {
    if (overallTrend > 5) return { icon: TrendingUp, color: "text-green-400", label: "Improving" };
    if (overallTrend < -5) return { icon: TrendingDown, color: "text-red-400", label: "Declining" };
    return { icon: Minus, color: "text-yellow-400", label: "Stable" };
  };

  const trend = getTrendIcon();
  const TrendIcon = trend.icon;

  return (
    <div className=" w-full h-screen flex flex-col items-center lol-bg-subtle relative overflow-auto">
      <div className="w-full h-full overflow-y-auto py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto w-full space-y-6 animate-fade-in relative z-10">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
              Your Journey
            </h2>
            <p className="lol-subheading text-gray-500 text-xs">
              Performance Throughout The Year
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="lol-card p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${trend.color}`} />
                <p className="text-xs text-gray-500 lol-subheading">Trend</p>
              </div>
              <p className={`text-lg sm:text-xl font-bold lol-heading ${trend.color}`}>
                {trend.label}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {overallTrend > 0 ? '+' : ''}{overallTrend.toFixed(0)} pts
              </p>
            </div>

            <div className="lol-card p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8AA6E]" />
                <p className="text-xs text-gray-500 lol-subheading">Average</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-[#C8AA6E] lol-heading">
                {avgScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Score</p>
            </div>

            <div className="lol-card p-3 sm:p-4 text-center border-green-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <p className="text-xs text-gray-500 lol-subheading">Peak</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-400 lol-heading">
                {maxScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(bestPeriod.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="lol-card p-3 sm:p-4 text-center border-red-500/20">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                <p className="text-xs text-gray-500 lol-subheading">Valley</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-400 lol-heading">
                {minScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(worstPeriod.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="lol-card p-4 sm:p-6 md:p-8">
            <div className="h-64 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={playerData.performanceTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8AA6E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C8AA6E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                    domain={[0, 100]}
                    label={{ value: 'Performance Score', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A1428',
                      border: '1px solid rgba(200, 170, 110, 0.3)',
                      borderRadius: '8px',
                      fontFamily: 'Spiegel, sans-serif',
                      padding: '12px',
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                    formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
                  />
                  <ReferenceLine 
                    y={avgScore} 
                    stroke="#C8AA6E" 
                    strokeDasharray="5 5" 
                    strokeOpacity={0.5}
                    label={{ 
                      value: `Avg: ${avgScore.toFixed(0)}`, 
                      position: 'right', 
                      fill: '#C8AA6E',
                      fontSize: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="performanceScore"
                    stroke="#C8AA6E"
                    strokeWidth={3}
                    fill="url(#colorScore)"
                    dot={{ fill: '#C8AA6E', r: 3, strokeWidth: 2, stroke: '#0A1428' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#C8AA6E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Insight Text */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#0A1428]/50 rounded-lg border border-[#C8AA6E]/20">
              <p className="text-xs sm:text-sm text-gray-300 lol-body leading-relaxed">
                {overallTrend > 10 ? (
                  <> <span className="text-green-400 font-semibold">Strong upward trend!</span> You've improved by {overallTrend.toFixed(0)} points since the start. Your peak performance of {maxScore.toFixed(0)} shows what you're capable of when you're in the zone.</>
                ) : overallTrend < -10 ? (
                  <> <span className="text-red-400 font-semibold">You've hit some bumps,</span> dropping {Math.abs(overallTrend).toFixed(0)} points from your start. But remember—your peak of {maxScore.toFixed(0)} proves you have what it takes. Time to bounce back!</>
                ) : (
                  <> <span className="text-yellow-400 font-semibold">Steady performance</span> throughout the year. You're averaging {avgScore.toFixed(0)} with a peak of {maxScore.toFixed(0)}. Consistency is key, but there's room to push higher!</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
