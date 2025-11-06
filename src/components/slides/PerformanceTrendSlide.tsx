import type { PlayerStats } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PerformanceTrendSlideProps {
  playerData: PlayerStats;
}

export const PerformanceTrendSlide = ({ playerData }: PerformanceTrendSlideProps) => {
  if (!playerData.performanceTrend || playerData.performanceTrend.length === 0) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
            Your Journey
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            Performance Throughout The Year
          </p>
        </div>

        {/* Chart */}
        <div className="lol-card p-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={playerData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short' })}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A1428',
                    border: '1px solid rgba(200, 170, 110, 0.3)',
                    borderRadius: '4px',
                    fontFamily: 'Spiegel, sans-serif',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="performanceScore"
                  stroke="#C8AA6E"
                  strokeWidth={3}
                  dot={{ fill: '#C8AA6E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
