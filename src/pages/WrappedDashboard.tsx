import { useLocation, useNavigate } from "react-router-dom";
import {
	useEffect,
	useState,
	useCallback,
	useMemo,
	useLayoutEffect,
} from "react";
import type { PlayerStats } from "@/lib/api";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Chatbot from "@/components/ui/chatbot";

// Import individual slides
import { IntroSlide } from "@/components/slides/IntroSlide";
import { ArchetypeSlide } from "@/components/slides/ArchetypeSlide";
import { ElementSlide } from "@/components/slides/ElementSlide";
import { PersonaSlide } from "@/components/slides/PersonaSlide";
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

type SlideConfig = {
	id: string;
	narration: string;
	content: JSX.Element;
};

type NarrationPhase = "hidden" | "entering" | "exiting";

const NARRATION_DISPLAY_DURATION = 1400;
const NARRATION_FADE_DURATION = 400;

const WrappedDashboard = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);
	const [narrationPhase, setNarrationPhase] =
		useState<NarrationPhase>("hidden");
	const [narrationText, setNarrationText] = useState("");

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

	const slides = useMemo<SlideConfig[]>(() => {
		if (!playerData) {
			return [];
		}

		const configuredSlides: SlideConfig[] = [
			{
				id: "intro",
				narration: "Welcome back to the Rift—your legend continues.",
				content: <IntroSlide playerData={playerData} />,
			},
			{
				id: "archetype",
				narration: "Based on your gameplay and stats, you are...",
				content: <ArchetypeSlide playerData={playerData} />,
			},
		];

		if (playerData.element) {
			configuredSlides.push({
				id: "element",
				narration: "Your energy reflects something deeper...",
				content: <ElementSlide playerData={playerData} />,
			});
		}

		if (playerData.persona && playerData.element) {
			configuredSlides.push({
				id: "persona",
				narration: "Together, they form your true persona.",
				content: <PersonaSlide playerData={playerData} />,
			});
		}

		configuredSlides.push(
			{
				id: "stats",
				narration: "Let's see the numbers...",
				content: <StatsSlide playerData={playerData} />,
			},
			{
				id: "champions",
				narration: "Your best champions are ready for the spotlight.",
				content: <ChampionsSlide playerData={playerData} />,
			},
		);

		if (playerData.proComparison) {
			configuredSlides.push({
				id: "pro-comparison",
				narration: "How do you stack up against the pros?",
				content: <ProComparisonSlide playerData={playerData} />,
			});
		}

		if (playerData.topStrengths && playerData.needsWork) {
			configuredSlides.push({
				id: "strengths-weaknesses",
				narration: "Every champion has strengths and tells—here are yours.",
				content: <StrengthsWeaknessesSlide playerData={playerData} />,
			});
		}

		if (playerData.performanceTrend && playerData.performanceTrend.length > 0) {
			configuredSlides.push({
				id: "performance-trend",
				narration: "Ride the highs and lows of your season.",
				content: <PerformanceTrendSlide playerData={playerData} />,
			});
		}

		if (playerData.watershedMoment) {
			configuredSlides.push({
				id: "watershed",
				narration: "Remember the moment everything shifted?",
				content: <WatershedSlide playerData={playerData} />,
			});
		}

		configuredSlides.push({
			id: "metrics",
			narration: "Here's your full combat profile.",
			content: <MetricsSlide playerData={playerData} />,
		});

		if (playerData.insights?.story_arc) {
			configuredSlides.push({
				id: "story-arc",
				narration: "Let's weave your 2024 Rift story.",
				content: <StoryArcSlide playerData={playerData} />,
			});
		}

		if (playerData.insights?.surprising_insights) {
			configuredSlides.push({
				id: "insights",
				narration: "A few surprises the data uncovered.",
				content: <InsightsSlide playerData={playerData} />,
			});
		}

		configuredSlides.push({
			id: "finale",
			narration: "Ready for the encore?",
			content: (
				<FinaleSlide
					playerData={playerData}
					onContinue={() =>
						navigate("/deep-insights", { state: { playerData } })
					}
				/>
			),
		});

		return configuredSlides;
	}, [playerData, navigate]);

	useLayoutEffect(() => {
		if (!slides.length) {
			setNarrationPhase("hidden");
			setNarrationText("");
			return;
		}

		const activeSlide = slides[current];
		if (!activeSlide) {
			return;
		}

		setNarrationText(activeSlide.narration);
		setNarrationPhase("entering");

		const displayTimer = window.setTimeout(() => {
			setNarrationPhase("exiting");
		}, NARRATION_DISPLAY_DURATION);

		const exitTimer = window.setTimeout(() => {
			setNarrationPhase("hidden");
		}, NARRATION_DISPLAY_DURATION + NARRATION_FADE_DURATION);

		return () => {
			window.clearTimeout(displayTimer);
			window.clearTimeout(exitTimer);
		};
	}, [current, slides]);

	const totalSlides = count || slides.length;

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
				<div className="relative h-full w-full">
					<div
						className={cn(
							"h-full transition-all duration-500",
							narrationPhase !== "hidden"
								? "opacity-0 translate-y-4 pointer-events-none"
								: "opacity-100 translate-y-0",
						)}
					>
						<CarouselContent className="h-full">
							{slides.map((slide) => (
								<CarouselItem key={slide.id}>{slide.content}</CarouselItem>
							))}
						</CarouselContent>
					</div>

					{narrationPhase !== "hidden" && narrationText && (
						<div className="absolute inset-0 z-40 flex items-center justify-center bg-black text-center">
							<p
								className={cn(
									"px-8 text-3xl text-gold lol-heading tracking-[0.25em]",
									narrationPhase === "exiting"
										? "animate-fade-out-down"
										: "animate-fade-in-up",
								)}
							>
								{narrationText}
							</p>
						</div>
					)}
				</div>
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
					{Array.from({ length: totalSlides }).map((_, index) => (
						<button
							key={index}
							onClick={() => api?.scrollTo(index)}
							className={cn(
								"h-2 rounded-full transition-all",
								current === index
									? "w-8 bg-primary"
									: "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
							)}
						/>
					))}
				</div>

				<Button
					variant="outline"
					size="icon"
					onClick={scrollNext}
					disabled={current === totalSlides - 1}
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
