import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Trophy, Users } from "lucide-react";

const Finale = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 animate-fade-in">
        <div className="w-32 h-32 rounded-full bg-gradient-magical flex items-center justify-center mx-auto mb-8 card-glow animate-pulse-glow">
          <Trophy className="w-16 h-16" />
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-glow">
          Your Legacy
          <br />
          <span className="bg-gradient-magical bg-clip-text text-transparent">
            Awaits
          </span>
        </h1>

        <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          You played <span className="text-primary font-bold">1,230 matches</span> — but your real journey begins in 2026.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" className="text-lg px-12 py-6 h-auto">
            <Trophy className="w-5 h-5 mr-2" />
            Set Next Season Goals
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-12 py-6 h-auto" onClick={() => navigate("/social")}>
            <Users className="w-5 h-5 mr-2" />
            Compare With Friends
          </Button>
        </div>

        <div className="mt-12">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Start
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Finale;
