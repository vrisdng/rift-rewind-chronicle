import type { PlayerStats } from "@/lib/api";

interface ChampionsSlideProps {
  playerData: PlayerStats;
}

export const ChampionsSlide = ({ playerData }: ChampionsSlideProps) => {
  const topChampions = playerData.topChampions.slice(0, 3);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
      <div className="max-w-6xl w-full space-y-8 animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="lol-heading text-4xl sm:text-5xl md:text-6xl text-[#C8AA6E]">
            Champion Mastery
          </h2>
          <p className="lol-subheading text-gray-500 text-xs">
            Your Top Legends
          </p>
        </div>

        {/* Champions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topChampions.map((champion, index) => (
            <div
              key={champion.championName}
              className={`lol-card p-5 relative group animate-slide-in-up overflow-hidden ${index === 0 ? 'border-[#C8AA6E]' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Splash Art - Always visible */}
              {champion.splashArtUrl && (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={champion.splashArtUrl}
                    alt={champion.championName}
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110"
                    loading="lazy"
                    style={{ transition: 'all 0.5s ease-in-out' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/80 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 space-y-3">
                {/* Rank & Name */}
                <div className="flex items-center gap-3 lol-accent-bar pl-3">
                  <div className={`text-4xl font-bold lol-heading ${index === 0 ? 'text-[#C8AA6E]' : 'text-gray-600'}`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white lol-body truncate">
                      {champion.championName}
                    </h3>
                    <p className="lol-subheading text-gray-500 text-xs">{champion.games} Matches</p>
                  </div>
                </div>

                {/* Win Rate Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="lol-subheading text-gray-500 text-xs">Victory Rate</span>
                    <span className="text-xl font-bold text-[#C8AA6E] lol-body">
                      {champion.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 bg-[#161f32] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] transition-all duration-1000"
                      style={{ width: `${champion.winRate}%` }}
                    />
                  </div>
                </div>

                {/* KDA Stats */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <div className="text-xl font-bold text-[#C8AA6E] lol-body">{champion.avgKills.toFixed(1)}</div>
                    <div className="lol-subheading text-gray-600 text-xs">K</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-400 lol-body">{champion.avgDeaths.toFixed(1)}</div>
                    <div className="lol-subheading text-gray-600 text-xs">D</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#C8AA6E] lol-body">{champion.avgAssists.toFixed(1)}</div>
                    <div className="lol-subheading text-gray-600 text-xs">A</div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs lol-body text-gray-400 pt-1 border-t border-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CS</span>
                    <span className="font-semibold">{champion.avgCS.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DMG</span>
                    <span className="font-semibold">{(champion.avgDamage / 1000).toFixed(1)}k</span>
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
