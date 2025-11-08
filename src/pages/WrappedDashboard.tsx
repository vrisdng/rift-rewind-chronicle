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

const SLIDE_DURATIONS: Record<string, number> = {
	intro: 3000,
};

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
			// 1. Keep the first slide (Intro)
			{
				id: "intro",
				narration: "Welcome back to the Rift—your legend continues.",
				content: <IntroSlide playerData={playerData} />,
			},
			// 2. Champion Mastery
			{
				id: "champions",
				narration: "Your best champions are ready for the spotlight.",
				content: <ChampionsSlide playerData={playerData} />,
			},
			// 3. Season Stats Slide
			{
				id: "stats",
				narration: "Let's see the numbers...",
				content: <StatsSlide playerData={playerData} />,
			},
			// 4. Your Playstyle (MetricsSlide)
			{
				id: "metrics",
				narration: "Here's your full combat profile.",
				content: <MetricsSlide playerData={playerData} />,
			},
		];

		// 5. Your Journey (PerformanceTrendSlide)
		if (playerData.performanceTrend && playerData.performanceTrend.length > 0) {
			configuredSlides.push({
				id: "performance-trend",
				narration: "Ride the highs and lows of your season.",
				content: <PerformanceTrendSlide playerData={playerData} />,
			});
		}

		// 6. Full Picture (StrengthsWeaknessesSlide)
		if (playerData.topStrengths && playerData.needsWork) {
			configuredSlides.push({
				id: "strengths-weaknesses",
				narration: "Every champion has strengths and tells—here are yours.",
				content: <StrengthsWeaknessesSlide playerData={playerData} />,
			});
		}

		// 7. Your Archetype
		configuredSlides.push({
			id: "archetype",
			narration: "Based on your gameplay and stats, you are...",
			content: <ArchetypeSlide playerData={playerData} />,
		});

		// 8. Your Element
		if (playerData.element) {
			configuredSlides.push({
				id: "element",
				narration: "Your energy reflects something deeper...",
				content: <ElementSlide playerData={playerData} />,
			});
		}

		// 9. Your Persona
		if (playerData.persona && playerData.element) {
			configuredSlides.push({
				id: "persona",
				narration: "Together, they form your true persona.",
				content: <PersonaSlide playerData={playerData} />,
			});
		}

		// 10. Your Pro Twin
		if (playerData.proComparison) {
			configuredSlides.push({
				id: "pro-comparison",
				narration: "How do you stack up against the pros?",
				content: <ProComparisonSlide playerData={playerData} />,
			});
		}

		// 11. Duelist Redemption (Watershed)
		if (playerData.watershedMoment) {
			configuredSlides.push({
				id: "watershed",
				narration: "Remember the moment everything shifted?",
				content: <WatershedSlide playerData={playerData} />,
			});
		}

		// 12. Hidden Insights
		if (playerData.insights?.surprising_insights) {
			configuredSlides.push({
				id: "insights",
				narration: "A few surprises the data uncovered.",
				content: <InsightsSlide playerData={playerData} />,
			});
		}

		// Story Arc (before finale)
		if (playerData.insights?.story_arc) {
			configuredSlides.push({
				id: "story-arc",
				narration: "Let's weave your 2024 Rift story.",
				content: <StoryArcSlide playerData={playerData} />,
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

		const displayDuration = SLIDE_DURATIONS[activeSlide.id] ?? NARRATION_DISPLAY_DURATION;

		const displayTimer = window.setTimeout(() => {
			setNarrationPhase("exiting");
		}, displayDuration);

		const exitTimer = window.setTimeout(() => {
			setNarrationPhase("hidden");
		}, displayDuration + NARRATION_FADE_DURATION);

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
					watchDrag: false,
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

			{/* Navigation Controls - constrained width to avoid chatbot overlap */}
			<div className="absolute bottom-4 left-4 right-20 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center justify-center gap-1 sm:gap-3 md:gap-6 sm:bottom-6 md:bottom-8">
				<Button
					variant="outline"
					size="icon"
					onClick={scrollPrev}
					disabled={current === 0}
					className="group relative h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-none bg-[rgba(10,20,40,0.85)] border-2 border-gold hover:border-gold-emphasis hover:bg-[rgba(10,20,40,0.95)] disabled:opacity-20 disabled:cursor-not-allowed disabled:border-gold/20 transition-all duration-300 overflow-hidden active:scale-95 flex-shrink-0"
					style={{
						clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)'
					}}
				>
					<div className="absolute inset-0 bg-gradient-to-br from-[#C8AA6E]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />
					<div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
						style={{
							boxShadow: '0 0 30px rgba(200, 170, 110, 0.4), inset 0 0 20px rgba(200, 170, 110, 0.1)'
						}}
					/>
					<ChevronLeft className="relative h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gold group-hover:text-gold-emphasis transition-colors duration-300 group-disabled:text-gold/30" />
				</Button>

				{/* Dots indicator - scrollable on mobile if too many */}
				<div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2.5 px-0.5 sm:px-2 md:px-4 overflow-x-auto max-w-[calc(100vw-13rem)] sm:max-w-none scrollbar-hide">
					{Array.from({ length: totalSlides }).map((_, index) => (
						<button
							key={index}
							onClick={() => api?.scrollTo(index)}
							className={cn(
								"h-1.5 transition-all duration-300 rounded-sm border touch-manipulation flex-shrink-0",
								current === index
									? "w-5 sm:w-8 md:w-10 bg-gold border-gold shadow-[0_0_10px_rgba(200,170,110,0.6)]"
									: "w-1.5 bg-gold/30 border-gold/50 hover:bg-gold/50 hover:border-gold/70 hover:shadow-[0_0_6px_rgba(200,170,110,0.3)] active:bg-gold/60",
							)}
						/>
					))}
				</div>

				<Button
					variant="outline"
					size="icon"
					onClick={scrollNext}
					disabled={current === totalSlides - 1}
					className="group relative h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-none bg-[rgba(10,20,40,0.85)] border-2 border-gold hover:border-gold-emphasis hover:bg-[rgba(10,20,40,0.95)] disabled:opacity-20 disabled:cursor-not-allowed disabled:border-gold/20 transition-all duration-300 overflow-hidden active:scale-95 flex-shrink-0"
					style={{
						clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)'
					}}
				>
					<div className="absolute inset-0 bg-gradient-to-br from-[#C8AA6E]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />
					<div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"
						style={{
							boxShadow: '0 0 30px rgba(200, 170, 110, 0.4), inset 0 0 20px rgba(200, 170, 110, 0.1)'
						}}
					/>
					<ChevronRight className="relative h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gold group-hover:text-gold-emphasis transition-colors duration-300 group-disabled:text-gold/30" />
				</Button>
			</div>
			<Chatbot 
				onNavigateToSlide={(slideId: string) => {
					const slideIndex = slides.findIndex(s => s.id === slideId);
					if (slideIndex !== -1 && api) {
						api.scrollTo(slideIndex);
					}
				}}
				availableSlides={slides.map(s => ({ id: s.id, narration: s.narration }))}
			/>
		</div>
	);
};

export default WrappedDashboard;
