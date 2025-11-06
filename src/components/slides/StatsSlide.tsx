import type { PlayerStats } from "@/lib/api";

interface StatsSlideProps {
  playerData: PlayerStats;
}

export const StatsSlide = ({ playerData }: StatsSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      <div className="max-w-5xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl sm:text-5xl md:text-6xl text-[#C8AA6E]">
            Season Stats
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            Your 2025 Performance
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="lol-card p-5 text-center animate-slide-in-up" style={{ animationDelay: '0ms' }}>
            <div className="text-4xl font-bold text-white lol-body mb-1">{playerData.totalGames}</div>
            <div className="lol-subheading text-gray-500 text-xs">Battles</div>
          </div>

          <div className="lol-card p-5 text-center border-[#C8AA6E] animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <div className="text-4xl font-bold text-[#C8AA6E] lol-body mb-1">{playerData.winRate.toFixed(1)}%</div>
            <div className="lol-subheading text-gray-500 text-xs">Victory</div>
          </div>

          <div className="lol-card p-5 text-center animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <div className="text-4xl font-bold text-white lol-body mb-1">{playerData.avgKDA.toFixed(2)}</div>
            <div className="lol-subheading text-gray-500 text-xs">KDA</div>
          </div>

          <div className="lol-card p-5 text-center animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <div className="text-4xl font-bold text-white lol-body mb-1">{Math.round(playerData.avgVisionScore)}</div>
            <div className="lol-subheading text-gray-500 text-xs">Vision</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Combat Stats */}
          <div className="lol-card p-5 space-y-3 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
            <h3 className="lol-subheading text-[#C8AA6E] text-xs mb-3 lol-accent-bar pl-4">Combat Stats</h3>
            <div className="space-y-2 lol-body text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Kills</span>
                <span className="text-[#C8AA6E] font-bold">{playerData.avgKills.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Deaths</span>
                <span className="text-gray-400 font-bold">{playerData.avgDeaths.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Assists</span>
                <span className="text-[#C8AA6E] font-bold">{playerData.avgAssists.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <span className="text-gray-500">CS per Game</span>
                <span className="text-white font-bold">{playerData.avgCS.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Streaks */}
          <div className="lol-card p-5 space-y-3 animate-slide-in-up" style={{ animationDelay: '500ms' }}>
            <h3 className="lol-subheading text-[#C8AA6E] text-xs mb-3 lol-accent-bar pl-4">Best Streaks</h3>
            <div className="space-y-2 lol-body text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Longest Win Streak</span>
                <span className="text-[#C8AA6E] font-bold">{playerData.longestWinStreak}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current Streak</span>
                <span className={`font-bold ${playerData.currentStreak.type === 'win' ? 'text-[#C8AA6E]' : 'text-gray-400'}`}>
                  {playerData.currentStreak.length} {playerData.currentStreak.type === 'win' ? 'W' : 'L'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <span className="text-gray-500">Main Role</span>
                <span className="text-white font-bold uppercase">{playerData.mainRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
