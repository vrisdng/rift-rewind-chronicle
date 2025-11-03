import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Award, Link2 } from "lucide-react";
import Chatbot from "@/components/ui/chatbot";

const SocialComparisons = () => {
  const navigate = useNavigate();

  const friends = [
    { name: "ShadowKnight", games: 312, tag: "Drama King" },
    { name: "MidOrFeed", games: 287, tag: "Vision Bot" },
    { name: "TopLaneBully", games: 245, tag: "CS Farmer" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">How You Stack Up</h1>
        <p className="text-muted-foreground text-lg mb-12">Compare with friends and pros</p>

        <Card className="p-8 card-glow mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Friend Leaderboard</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {friends.map((friend, idx) => (
              <Card key={idx} className="p-6 min-w-[200px] text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold">{idx + 1}</span>
                </div>
                <h3 className="font-bold mb-1">{friend.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{friend.games} games</p>
                <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">{friend.tag}</span>
              </Card>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-8 card-glow">
            <div className="flex items-center gap-3 mb-4">
              <Link2 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Best Duo Synergy</h2>
            </div>
            <div className="h-48 bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20">
              <p className="text-muted-foreground">Synergy Graph</p>
            </div>
          </Card>

          <Card className="p-8 card-glow">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold">Pro Comparison</h2>
            </div>
            <p className="text-lg leading-relaxed">
              Your early game stats are closest to <span className="text-primary font-bold">Canyon's</span> — 
              <span className="text-accent font-bold"> 87% similarity</span>.
            </p>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/growth-map")}>
            ← Back
          </Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/shareable")}>
            Continue to Share →
          </Button>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default SocialComparisons;
