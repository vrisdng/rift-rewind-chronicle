import type { PlayerStats } from "@/lib/api";
import { Lightbulb } from "lucide-react";

interface HiddenInsightsSlideProps {
	playerData: PlayerStats;
}

export const HiddenInsightsSlide = ({ playerData }: HiddenInsightsSlideProps) => {
	if (!playerData.insights?.surprising_insights) return null;

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-4 sm:p-8">
			{/* Background Image */}
			<div 
				className="absolute inset-0 bg-cover bg-center bg-no-repeat "
				style={{ backgroundImage: 'url(/images/background-2.jpg)' }}
			/>
			{/* Dark Overlay */}
			<div className="absolute inset-0 bg-black/60" />
			
			<div className="max-w-5xl w-full space-y-4 sm:space-y-6 animate-fade-in relative z-10">
				{/* Title */}
				<div className="text-center space-y-1">
					<h2 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E] break-words">
						Hidden Insights
					</h2>
					<p className="lol-subheading text-gray-500 text-xs sm:text-sm">
						What The Data Reveals
					</p>
				</div>

				{/* Surprising Insights */}
				<div className="space-y-2 sm:space-y-3">
					{playerData.insights.surprising_insights.map((insight, index) => (
						<div
							key={index}
							className="lol-card p-3 sm:p-4 animate-slide-in-up"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className="flex items-start gap-3 lol-accent-bar pl-3">
								<div className="flex-shrink-0">
									<Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-[#C8AA6E]" />
								</div>
								<p className="text-sm sm:text-base text-gray-300 flex-1 leading-relaxed lol-body break-words">
									{insight}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
