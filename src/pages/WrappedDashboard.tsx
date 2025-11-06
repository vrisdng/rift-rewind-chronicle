import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import type { PlayerStats } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Chatbot from "@/components/ui/chatbot";

// Import individual slides
import { IntroSlide } from "@/components/slides/IntroSlide";
import { StatsSlide } from "@/components/slides/StatsSlide";
import { ChampionsSlide } from "@/components/slides/ChampionsSlide";
import { ProComparisonSlide } from "@/components/slides/ProComparisonSlide";
import { StrengthsWeaknessesSlide } from "@/components/slides/StrengthsWeaknessesSlide";
import { PerformanceTrendSlide } from "@/components/slides/PerformanceTrendSlide";
import { WatershedSlide } from "@/components/slides/WatershedSlide";
import { MetricsSlide } from "@/components/slides/MetricsSlide";
import { StoryArcSlide } from "@/components/slides/StoryArcSlide";
import { InsightsSlide } from "@/components/slides/InsightsSlide";
import { FinaleSlide } from "@/components/slides/FinaleSlide";

const WrappedDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const data = location.state?.playerData;
    if (!data) {
      navigate("/");
    } else {
      setPlayerData(data);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollPrev, scrollNext]);

  if (!playerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wrapped...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-y-hidden bg-background">
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="h-full">
          {/* Slide 1: Intro */}
          <CarouselItem>
            <IntroSlide playerData={playerData} />
          </CarouselItem>

          {/* Slide 2: Stats Overview */}
          <CarouselItem>
            <StatsSlide playerData={playerData} />
          </CarouselItem>

          {/* Slide 3: Top Champions */}
          <CarouselItem>
            <ChampionsSlide playerData={playerData} />
          </CarouselItem>

          {/* Slide 4: Pro Comparison (conditional) */}
          {playerData.proComparison && (
            <CarouselItem>
              <ProComparisonSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 5: Strengths & Weaknesses (conditional) */}
          {playerData.topStrengths && playerData.needsWork && (
            <CarouselItem>
              <StrengthsWeaknessesSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 6: Performance Trend (conditional) */}
          {playerData.performanceTrend && playerData.performanceTrend.length > 0 && (
            <CarouselItem>
              <PerformanceTrendSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 7: Watershed Moment (conditional) */}
          {playerData.watershedMoment && (
            <CarouselItem>
              <WatershedSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 8: Metrics Radar */}
          <CarouselItem>
            <MetricsSlide playerData={playerData} />
          </CarouselItem>

          {/* Slide 9: AI Story Arc (conditional) */}
          {playerData.insights?.story_arc && (
            <CarouselItem>
              <StoryArcSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 10: Surprising Insights (conditional) */}
          {playerData.insights?.surprising_insights && (
            <CarouselItem>
              <InsightsSlide playerData={playerData} />
            </CarouselItem>
          )}

          {/* Slide 11: Finale */}
          <CarouselItem>
            <FinaleSlide playerData={playerData} onContinue={() => navigate("/deep-insights", { state: { playerData } })} />
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={current === 0}
          className="rounded-full bg-background/80 backdrop-blur-sm border-border/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dots indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                current === index
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={current === count - 1}
          className="rounded-full bg-background/80 backdrop-blur-sm border-border/50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Chatbot />
    </div>
  );
};

export default WrappedDashboard;
