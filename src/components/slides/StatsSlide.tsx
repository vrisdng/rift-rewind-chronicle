import type { PlayerStats } from "@/lib/api";
import { Trophy, Sword, Eye, Target } from "lucide-react";

interface StatsSlideProps {
  playerData: PlayerStats;
}

export const StatsSlide = ({ playerData }: StatsSlideProps) => {
  const stats = [
    {
      icon: Target,
      value: playerData.totalGames,
      label: "Total Matches",
      color: "primary",
      isGold: false,
    },
    {
      icon: Trophy,
      value: `${playerData.winRate.toFixed(1)}%`,
      label: "Win Rate",
      color: "accent",
      isGold: true,
    },
    {
      icon: Sword,
      value: playerData.avgKDA.toFixed(2),
      label: "Average KDA",
      color: "primary",
      isGold: false,
    },
    {
      icon: Eye,
      value: Math.round(playerData.avgVisionScore),
      label: "Vision Score",
      color: "primary",
      isGold: false,
    },
  ];

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0A1428] relative overflow-hidden p-4 sm:p-8">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      {/* Gold decorative hexagons */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 hexagon bg-[#C8AA6E] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-64 h-64 hexagon bg-[#C8AA6E] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl w-full space-y-8 sm:space-y-12 animate-fade-in relative z-10 px-4">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#C8AA6E] gold-glow tracking-wide uppercase">
            Season Stats
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 uppercase tracking-widest">
            Your 2024 Performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-4 sm:p-6 md:p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 ${stat.isGold ? 'border-[#C8AA6E]' : 'border-[#C8AA6E]/30'} hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(200,170,110,0.3)]`}
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)', animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 hexagon bg-[#C8AA6E]/20 flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#C8AA6E] drop-shadow-lg`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-bold text-[#C8AA6E] ${stat.isGold ? 'gold-glow' : 'drop-shadow-[0_0_20px_rgba(200,170,110,0.6)]'} truncate`}>
                    {stat.value}
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base md:text-lg uppercase tracking-wider truncate font-bold">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Role with gold championship styling */}
        <div className="text-center">
          <p className="text-gray-400 text-base sm:text-lg mb-2 uppercase tracking-widest font-bold">
            Primary Position
          </p>
          <div className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[#C8AA6E]/10 backdrop-blur-sm border-2 border-[#C8AA6E]/40 max-w-full" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
            <p className="text-2xl sm:text-3xl font-bold text-[#C8AA6E] uppercase tracking-wider truncate px-4">
              {playerData.mainRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
