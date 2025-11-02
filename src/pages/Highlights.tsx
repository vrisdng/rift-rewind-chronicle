import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Trophy, Zap, Skull } from "lucide-react";
import Chatbot from "@/components/ui/chatbot";

const Highlights = () => {
  const navigate = useNavigate();

  const moments = [
    { 
      icon: Trophy, 
      title: "Biggest Comeback", 
      description: "Down 12k gold, turned it around at 38 minutes",
      date: "August 15, 2025"
    },
    { 
      icon: Zap, 
      title: "Ahri Domination", 
      description: "15/2/8 KDA across 45 matches",
      date: "Season Peak"
    },
    { 
      icon: Skull, 
      title: "First Pentakill", 
      description: "Your first penta since 2022 on Yasuo",
      date: "November 3, 2025"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">Your Legendary Moments</h1>
        <p className="text-muted-foreground text-lg mb-12">The plays that defined your season</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {moments.map((moment, idx) => (
            <Card key={idx} className="p-6 card-glow hover:scale-105 transition-transform cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-magical flex items-center justify-center mb-4 mx-auto">
                <moment.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">{moment.title}</h3>
              <p className="text-muted-foreground text-center mb-2">{moment.description}</p>
              <p className="text-sm text-primary text-center">{moment.date}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/deep-insights")}>
            ← Back
          </Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/archetype")}>
            Continue to Evolution →
          </Button>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default Highlights;
