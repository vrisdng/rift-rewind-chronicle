import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Share2, Download, Image } from "lucide-react";
import Chatbot from "@/components/ui/chatbot";

const ShareableMoments = () => {
  const navigate = useNavigate();

  const templates = [
    { name: "Champion Focus", theme: "Dark Mode" },
    { name: "Rank Journey", theme: "Frost Theme" },
    { name: "Duo Power", theme: "Infernal Theme" },
    { name: "Annual Summary", theme: "Dark Mode" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4 text-glow">Show Off Your Season</h1>
        <p className="text-muted-foreground text-lg mb-12">Generate and share your highlights</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {templates.map((template, idx) => (
            <Card key={idx} className="p-6 card-glow">
              <div className="aspect-video bg-gradient-magical/10 rounded-lg flex items-center justify-center border border-primary/20 mb-4">
                <Image className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{template.theme}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="hero" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 card-glow mb-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Popular Captions</h2>
          <div className="space-y-3">
            <p className="text-lg italic">"2025: The Year I Mastered the Rift."</p>
            <p className="text-lg italic">"137 wins, 4 pentas, and countless wards later."</p>
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/social")}>
            ← Back
          </Button>
          <Button variant="hero" size="lg" onClick={() => navigate("/finale")}>
            Continue to Finale →
          </Button>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default ShareableMoments;
