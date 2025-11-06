import type { PlayerStats } from "@/lib/api";

interface IntroSlideProps {
  playerData: PlayerStats;
}

export const IntroSlide = ({ playerData }: IntroSlideProps) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden">
      {/* Minimal accent decoration - not distracting */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8AA6E]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8AA6E]/30 to-transparent" />

      <div className="text-center space-y-12 animate-fade-in relative z-10 max-w-4xl mx-auto w-full px-8">
        {/* Year - Beaufort font, italic, bold */}
        <div className="space-y-4">
          <h1 className="lol-heading text-7xl sm:text-8xl md:text-9xl text-[#C8AA6E]" style={{ textShadow: '0 0 60px rgba(200, 170, 110, 0.4)' }}>
            2025
          </h1>
          <p className="lol-subheading text-gray-400">
            Season Rewind
          </p>
        </div>

        {/* Player info */}
        <div className="space-y-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white lol-body">
            {playerData.riotId}
            <span className="text-[#C8AA6E]">#{playerData.tagLine}</span>
          </h2>

          {/* Archetype - Clean card matching LoL website */}
          <div className="inline-flex items-center gap-4 px-8 py-4 lol-card">
            <span className="text-4xl">{playerData.archetype.icon}</span>
            <div className="text-left lol-accent-bar pl-4">
              <p className="lol-subheading text-gray-500 text-xs mb-1">Class</p>
              <p className="text-xl font-bold text-[#C8AA6E] lol-body">{playerData.archetype.name}</p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-white lol-body mb-2">{playerData.totalGames}</div>
            <div className="lol-subheading text-gray-500 text-xs">Battles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#C8AA6E] lol-body mb-2">{playerData.winRate.toFixed(0)}%</div>
            <div className="lol-subheading text-gray-500 text-xs">Victory</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white lol-body mb-2 truncate">{playerData.topChampions[0]?.championName || "—"}</div>
            <div className="lol-subheading text-gray-500 text-xs">Champion</div>
          </div>
        </div>
      </div>
    </div>
  );
};
