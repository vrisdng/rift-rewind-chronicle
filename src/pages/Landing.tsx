import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { useState,  } from "react";
import { analyzePlayerWithProgress, type PlayerStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("NA1");
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");


  const startAnalysis = async () => {
    if (!gameName || !tagLine) {
      toast({
        title: "Missing Information",
        description: "Please enter both game name and tag line",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setProgressStage("");
    setLoadingMessage("Starting analysis...");

    try {
      await analyzePlayerWithProgress(
        gameName,
        tagLine,
        "sg2",
        // Progress callback
        (update) => {
          setProgress(update.progress);
          setProgressStage(update.stage);
          setLoadingMessage(update.message);
        },
        // Complete callback
        (data, cached) => {
          setPlayerData(data);
          setIsLoading(false);

          toast({
            title: cached ? "Data Retrieved" : "Analysis Complete!",
            description: cached
              ? "Using cached analysis data"
              : `Analyzed ${data.totalGames} matches successfully`,
          });
        },
        // Error callback
        (error) => {
          setIsLoading(false);
          console.error('Failed to analyze player:', error);
          toast({
            title: "Analysis Failed",
            description: error || "Could not analyze player. Please try again.",
            variant: "destructive",
          });
        }
      );
    } catch (error: any) {
      setIsLoading(false);
      console.error('Failed to analyze player:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze player. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Video - Full coverage */}
      <div className="fixed inset-0 w-full h-full bg-black">
        {/* YouTube embed as background - muted and looping */}
        <iframe
          className="absolute inset-0 w-full h-full pointer-events-none border-0"
          style={{
            width: '100vw',
            height: '100vh',
            transform: 'scale', // Zoom to remove black bars
            objectFit: 'cover'
          }}
          src="https://www.youtube.com/embed/xBCBOoHyeSU?autoplay=1&mute=1&loop=1&playlist=xBCBOoHyeSU&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&vq=hd1080"
          title="Background video"
          allow="autoplay; encrypted-media"
        />
        {/* Minimal vignette overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="animate-fade-in max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#C8AA6E]/10 border-2 border-[#C8AA6E]/40 mb-8 backdrop-blur-sm" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
            <Sparkles className="w-4 h-4 text-[#C8AA6E]" />
            <span className="text-sm font-bold uppercase tracking-wider text-[#C8AA6E]">Season 2025</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 uppercase tracking-tight leading-none">
            <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Rift{" "}
            </span>
            <span className="text-[#C8AA6E] drop-shadow-[0_0_40px_rgba(200,170,110,0.6)]" style={{ fontStyle: 'italic' }}>
              Rewind
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-200 mb-16 max-w-2xl mx-auto font-medium tracking-wide drop-shadow-lg">
            Your year on the Rift. Every win. Every play. Every legend forged.
          </p>

          {/* Summoner Search */}
          <div className="flex flex-col gap-3 max-w-xl mx-auto mb-8">
            <div className="flex gap-3 items-center">
              <Input
                type="text"
                placeholder="Summoner Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-[#0A1428]/80 backdrop-blur-md border-2 border-[#C8AA6E]/30 text-white placeholder:text-gray-400 h-14 text-lg font-semibold focus:border-[#C8AA6E] transition-colors"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              />
              <span className="text-2xl text-[#C8AA6E] font-bold">#</span>
              <Input
                type="text"
                placeholder="TAG"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-[#0A1428]/80 backdrop-blur-md border-2 border-[#C8AA6E]/30 text-white placeholder:text-gray-400 h-14 w-32 text-lg font-semibold uppercase focus:border-[#C8AA6E] transition-colors"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              />
            </div>
            <Button
              onClick={startAnalysis}
              disabled={isLoading}
              className="w-full h-14 bg-[#C8AA6E] hover:bg-[#D4B982] text-[#0A1428] font-black text-lg uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,170,110,0.5)] disabled:opacity-50"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {loadingMessage || 'Analyzing...'}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Start Chronicle
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="max-w-xl mx-auto mb-8 p-6 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E]/30" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-[#0A1428] h-3 overflow-hidden border border-[#C8AA6E]/40">
                  <div
                    className="bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] h-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(200,170,110,0.6)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Progress Text */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-bold uppercase tracking-wide">{progressStage}</span>
                  <span className="text-[#C8AA6E] font-black text-base">{progress}%</span>
                </div>

                {/* Loading Message */}
                {loadingMessage && (
                  <p className="text-sm text-gray-400 text-center font-medium">
                    {loadingMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Player Data Display */}
          {playerData && (
            <div className="mb-8 p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E] max-w-2xl mx-auto shadow-[0_0_40px_rgba(200,170,110,0.3)]" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
              <h3 className="text-3xl font-black mb-2 text-white uppercase tracking-wide">
                {playerData.riotId} <span className="text-[#C8AA6E]">#{playerData.tagLine}</span>
              </h3>
              <p className="text-gray-300 mb-6 text-lg font-semibold">
                {playerData.archetype.icon} {playerData.archetype.name}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-[#0A1428]/60 border border-[#C8AA6E]/30">
                  <div className="text-4xl font-black text-[#C8AA6E]">{playerData.totalGames}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Games Played</div>
                </div>
                <div className="text-center p-4 bg-[#0A1428]/60 border border-[#C8AA6E]/30">
                  <div className="text-4xl font-black text-[#C8AA6E]">{playerData.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Victory Rate</div>
                </div>
              </div>

              {/* Top Champions */}
              <div>
                <h4 className="text-lg font-black mb-3 uppercase tracking-wider text-[#C8AA6E]">Champion Mastery</h4>
                <div className="space-y-3">
                  {playerData.topChampions.slice(0, 3).map((champ, idx) => (
                    <div key={champ.championName} className="flex justify-between items-center p-3 bg-[#0A1428]/40 border-l-4 border-[#C8AA6E]">
                      <div className="flex items-center gap-3">
                        <span className="text-[#C8AA6E] font-black text-xl">#{idx + 1}</span>
                        <span className="font-bold text-white text-base">{champ.championName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#C8AA6E] font-black text-lg">{champ.winRate.toFixed(0)}%</span>
                        <span className="text-gray-400 ml-2 text-sm font-semibold">({champ.games})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {playerData && (
            <Button
              size="lg"
              className="px-16 py-7 h-auto bg-[#C8AA6E] hover:bg-[#F0E6D2] text-[#0A1428] font-black text-2xl uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,170,110,0.8)] hover:scale-105"
              style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
              onClick={() => navigate("/dashboard", { state: { playerData } })}
            >
              Enter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;
