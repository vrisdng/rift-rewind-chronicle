import type { PlayerStats } from "@/lib/api";

interface ChampionsSlideProps {
  playerData: PlayerStats;
}

export const ChampionsSlide = ({ playerData }: ChampionsSlideProps) => {
  const topChampions = playerData.topChampions.slice(0, 3);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0A1428] relative overflow-hidden p-4 sm:p-8">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      {/* Gold hexagonal pattern background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none hidden md:block">
        <div className="grid grid-cols-6 gap-8 p-8">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-16 h-16 hexagon bg-[#C8AA6E] animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      <div className="max-w-5xl w-full space-y-8 sm:space-y-12 animate-fade-in relative z-10 px-4 overflow-y-auto max-h-screen py-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#C8AA6E] gold-glow tracking-wide uppercase">
            Champion Mastery
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 uppercase tracking-widest">
            Your Top Legends
          </p>
        </div>

        {/* Champions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {topChampions.map((champion, index) => (
            <div
              key={champion.championName}
              className={`relative overflow-hidden p-4 sm:p-6 md:p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 ${index === 0 ? 'border-[#C8AA6E]' : 'border-[#C8AA6E]/30'} hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(200,170,110,0.3)]`}
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)', animationDelay: `${index * 100}ms` }}
            >
              {/* Background Splash Art */}
              {champion.splashArtUrl && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={champion.splashArtUrl}
                    alt={champion.championName}
                    className="w-full h-full object-cover opacity-20"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10">
                {/* Rank Badge with hexagon */}
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 hexagon flex items-center justify-center ${index === 0 ? 'bg-gradient-to-br from-[#C8AA6E] to-[#F0E6D2]' : 'bg-[#C8AA6E]/30'}`}>
                      <span className="text-2xl sm:text-3xl font-bold text-background">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl sm:text-2xl font-bold text-[#C8AA6E] ${index === 0 ? 'gold-glow' : 'drop-shadow-[0_0_20px_rgba(200,170,110,0.6)]'} truncate`}>
                      {champion.championName}
                    </h3>
                    <p className="text-gray-400 uppercase tracking-wider text-xs sm:text-sm font-bold">{champion.games} Matches</p>
                  </div>
                </div>

                {/* Win Rate with gold bar */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400 uppercase tracking-wider font-bold">Victory Rate</span>
                    <span className={`font-bold text-base sm:text-lg text-[#C8AA6E]`}>
                      {champion.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 sm:h-3 bg-[#0A1428] overflow-hidden border border-[#C8AA6E]/40">
                    <div
                      className={`h-full bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] shadow-[0_0_20px_rgba(200,170,110,0.6)] transition-all duration-1000`}
                      style={{ width: `${champion.winRate}%` }}
                    />
                  </div>
                </div>

                {/* KDA with gold styling */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#C8AA6E]">{champion.avgKills.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">K</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-destructive">{champion.avgDeaths.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">D</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#C8AA6E]">{champion.avgAssists.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">A</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
