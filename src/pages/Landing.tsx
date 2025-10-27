import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";
import magicOrb from "@/assets/magic-orb.png";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { analyzePlayer, type PlayerStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("NA1");
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

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
    setLoadingMessage("Searching for player...");

    try {
      const result = await analyzePlayer(gameName, tagLine, "sg2");

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to analyze player");
      }

      setPlayerData(result.data);

      toast({
        title: result.cached ? "Data Retrieved" : "Analysis Complete!",
        description: result.cached
          ? "Using cached analysis data"
          : `Analyzed ${result.data.totalGames} matches successfully`,
      });

    } catch (error: any) {
      console.error('Failed to analyze player:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
      </div>

      {/* Floating Orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-30 animate-float">
        <img src={magicOrb} alt="" className="w-full h-full animate-pulse-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">2025 Season Review</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-glow">
            Your League Story
            <br />
            <span className="bg-gradient-magical bg-clip-text text-transparent">
              Awaits
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Dive into your year — the stats, the stories, the moments that defined your climb.
          </p>

          {/* Summoner Search */}
          <div className="flex flex-col gap-2 max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Game Name..."
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-background/50 backdrop-blur-sm"
              />
              <span className="flex items-center text-muted-foreground">#</span>
              <Input
                type="text"
                placeholder="Tag (e.g. NA1)"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-background/50 backdrop-blur-sm w-32"
              />
            </div>
            <Button
              variant="secondary"
              onClick={startAnalysis}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingMessage || 'Analyzing...'}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze My Year
                </>
              )}
            </Button>
          </div>

          {/* Player Data Display */}
          {playerData && (
            <div className="mb-8 p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/30 max-w-md mx-auto">
              <h3 className="text-2xl font-bold mb-2">
                {playerData.riotId} #{playerData.tagLine}
              </h3>
              <p className="text-muted-foreground mb-4">
                {playerData.archetype.icon} {playerData.archetype.name}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{playerData.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{playerData.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>

              {/* Top Champions */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Top Champions</h4>
                <div className="space-y-2">
                  {playerData.topChampions.slice(0, 3).map((champ) => (
                    <div key={champ.championName} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{champ.championName}</span>
                      <div className="text-right">
                        <span className="text-primary">{champ.winRate.toFixed(0)}% WR</span>
                        <span className="text-muted-foreground ml-2">({champ.games}g)</span>
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
              variant="hero"
              size="lg"
              className="text-lg px-12 py-6 h-auto animate-pulse-glow"
              onClick={() => navigate("/dashboard", { state: { playerData } })}
            >
            Reveal My Year
          </Button>
          )}

          {/* Additional Info */}
          <p className="mt-8 text-sm text-muted-foreground">
            Experience your journey like never before
          </p>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default Landing;
