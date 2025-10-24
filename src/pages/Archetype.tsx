import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";

const Archetype = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">How You've Changed</h1>
        <p className="text-muted-foreground text-lg mb-12">Your evolution throughout 2025</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 card-glow">
            <h2 className="text-2xl font-bold mb-6">Early Year (Jan-Jun)</h2>
            <div className="aspect-square bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20 mb-4">
              <p className="text-muted-foreground">Playstyle Radar</p>
            </div>
            <p className="text-center text-muted-foreground">Patient scaling mage player</p>
          </Card>

          <Card className="p-8 card-glow">
            <h2 className="text-2xl font-bold mb-6">Late Year (Jul-Dec)</h2>
            <div className="aspect-square bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20 mb-4">
              <p className="text-muted-foreground">Playstyle Radar</p>
            </div>
            <p className="text-center text-muted-foreground">Fearless early-game duelist</p>
          </Card>
        </div>

        <Card className="p-8 card-glow mb-12">
          <div className="flex items-center gap-4 mb-4 justify-center">
            <Swords className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Your Champion Spirit</h2>
          </div>
          <p className="text-xl text-center leading-relaxed">
            Your 2025 energy: <span className="text-primary font-bold">Fiora</span> — calculated, precise, and unyielding.
          </p>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/highlights")}>
            ← Back
          </Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/growth-map")}>
            Continue to Growth →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Archetype;
