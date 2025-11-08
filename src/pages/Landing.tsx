import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Loader2, Globe } from "lucide-react";
import { useState } from "react";
import { analyzePlayerWithProgress, type PlayerStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { savePlayerSnapshot } from "@/lib/player-storage";
import { playClick, playIntroThenBgm } from "@/lib/sound";
import { motion, AnimatePresence } from "framer-motion";

// Riot API Routing Regions (matches backend regionMap)
const REGIONS = [
  { value: "americas", label: "Americas" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "sea", label: "Southeast Asia" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState("sea");
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [isZooming, setIsZooming] = useState(false);


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
        region,
        // Progress callback
        (update) => {
          setProgress(update.progress);
          setProgressStage(update.stage);
          setLoadingMessage(update.message);
        },
        // Complete callback
        (data, cached) => {
          setPlayerData(data);
          savePlayerSnapshot(data);
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

          // Check if it's a "not found" error
          const isNotFoundError = error && (
            error.toLowerCase().includes('not found') ||
            error.toLowerCase().includes('data not found') ||
            error.toLowerCase().includes('no results found')
          );

          toast({
            title: isNotFoundError ? "Summoner Not Found" : "Analysis Failed",
            description: isNotFoundError
              ? "Please check that your summoner name, tag, and region are correct."
              : error || "Could not analyze player. Please try again.",
            variant: "destructive",
          });
        }
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to analyze player:', error);
      const message = error instanceof Error ? error.message : "Could not analyze player. Please try again.";

      // Check if it's a "not found" error
      const isNotFoundError = message && (
        message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('data not found') ||
        message.toLowerCase().includes('no results found')
      );

      toast({
        title: isNotFoundError ? "Summoner Not Found" : "Analysis Failed",
        description: isNotFoundError
          ? "Please check that your summoner name, tag, and region are correct."
          : message,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden"
      initial={{ scale: 1, opacity: 1 }}
      animate={isZooming ? {
        scale: 5,
        opacity: 0,
        filter: "blur(20px)"
      } : {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)"
      }}
      transition={{
        duration: 0.8,
        ease: [0.6, 0.01, 0.05, 0.95] // Custom easing for fast acceleration
      }}
    >
      {/* Background Video - Full coverage */}
      <div className="fixed inset-0 w-full h-full bg-black">
        {/* Local video as background - muted and looping */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-0 animate-[fadeIn_3s_ease-in_3s_forwards]"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/League_of_Legends.mp4" type="video/mp4" />
        </video>
        {/* Minimal vignette overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 text-center overflow-x-hidden">
        <div className="animate-fade-in w-full max-w-5xl">
          {/* Main Heading */}
          <h1 className="mt-1 font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 uppercase tracking-tight leading-none">
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
          {!playerData && !isLoading && (
            <div className="w-full">
          {/* Summoner Search */}
          <div className="flex flex-col gap-3 w-full max-w-xl mx-auto mb-8 px-2 sm:px-0">
            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-center justify-center">
              <Input
                type="text"
                placeholder="Summoner Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-[#0A1428]/80 backdrop-blur-md border-2 border-[#C8AA6E]/30 text-white placeholder:text-gray-400 h-12 sm:h-14 text-base sm:text-lg font-semibold focus:border-[#C8AA6E] transition-colors flex-1 min-w-0"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              />
              <span className="text-xl sm:text-2xl text-[#C8AA6E] font-bold flex-shrink-0">#</span>
              <Input
                type="text"
                placeholder="TAG"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-[#0A1428]/80 backdrop-blur-md border-2 border-[#C8AA6E]/30 text-white placeholder:text-gray-400 h-12 sm:h-14 w-24 sm:w-32 text-base sm:text-lg font-semibold uppercase focus:border-[#C8AA6E] transition-colors flex-shrink-0"
                style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              />
            </div>

            {/* Region Selector */}
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="bg-[#0A1428]/80 backdrop-blur-md border-2 border-[#C8AA6E]/30 text-white h-12 sm:h-14 text-base sm:text-lg font-semibold focus:border-[#C8AA6E] transition-colors [&>span]:text-white w-full" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#C8AA6E]" />
                  <SelectValue placeholder="Select Region" className="text-white" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0A1428]/95 backdrop-blur-md border-2 border-[#C8AA6E]/40">
                {REGIONS.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="text-white hover:bg-[#C8AA6E]/20 focus:bg-[#C8AA6E]/20 cursor-pointer data-[state=checked]:text-white"
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={startAnalysis}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-[#0A1428] hover:bg-[#0D1B35] text-[#C8AA6E] font-black text-base sm:text-lg uppercase tracking-wider transition-all duration-300 border-2 border-[#C8AA6E] hover:shadow-[0_0_30px_rgba(200,170,110,0.5)] disabled:opacity-50"
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
                  Start Rewind
                </>
              )}
            </Button>
          </div>
          </div>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="w-full max-w-xl px-4 sm:px-0 mx-auto mb-8">
              <div className="p-4 sm:p-6 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E]/30" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                <div className="space-y-3 sm:space-y-4">
                  {/* Progress Bar */}
                  <div className="w-full bg-[#0A1428] h-3 overflow-hidden border border-[#C8AA6E]/40">
                    <div
                      className="bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] h-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(200,170,110,0.6)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Progress Text */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-gray-300 font-bold uppercase tracking-wide text-[0.65rem] sm:text-sm truncate flex-1 min-w-0">{progressStage}</span>
                    <span className="text-[#C8AA6E] font-black text-sm sm:text-base flex-shrink-0">{progress}%</span>
                  </div>

                  {/* Loading Message */}
                  {loadingMessage && (
                    <p className="text-[0.7rem] sm:text-sm text-gray-400 text-center font-medium break-words leading-relaxed">
                      {loadingMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Player Data Display */}
          {playerData && (
            <div className="mb-8 p-4 sm:p-8 bg-[#0A1428]/90 backdrop-blur-md border-2 border-[#C8AA6E] w-full max-w-2xl mx-2 sm:mx-auto shadow-[0_0_40px_rgba(200,170,110,0.3)]" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
              <h3 className="text-3xl font-black mb-2 text-white uppercase tracking-wide">
                {playerData.riotId} <span className="text-[#C8AA6E]">#{playerData.tagLine}</span>
              </h3>

              <Button
              size="lg"
              className="px-16 py-7 h-10 bg-[#C8AA6E] hover:bg-[#F0E6D2] text-[#0A1428] font-black text-2xl uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,170,110,0.8)] hover:scale-105"
              style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
              onClick={() => {
                try {
                  playClick();
                  playIntroThenBgm();
                }catch{
                  // swallow
                }
                // Trigger zoom animation
                setIsZooming(true);
                // Navigate after zoom animation completes
                setTimeout(() => {
                  navigate("dashboard", { state: { playerData } });
                }, 800); // Match framer-motion animation duration
              }}
            >
              Enter
            </Button>
            </div>


          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Landing;
