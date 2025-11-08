import type { PlayerStats } from "@/lib/api";
import { Lightbulb, Target } from "lucide-react";

interface InsightsSlideProps {
	playerData: PlayerStats;
}

export const InsightsSlide = ({ playerData }: InsightsSlideProps) => {
	if (!playerData.insights?.surprising_insights) return null;

	return (
		<div className="w-full h-screen flex flex-col lol-bg-subtle relative overflow-hidden">
			{/* Background Image */}
			<div 
				className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom-out"
				style={{ backgroundImage: 'url(/images/background-2.jpg)' }}
			/>
			{/* Dark Overlay */}
			<div className="absolute inset-0 bg-black/60" />
			
			<div className="w-full h-full overflow-y-auto px-4 sm:px-8 py-8 relative z-10">
				<div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in relative z-10 pb-8">
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

					{/* Improvement Tips */}
					{playerData.insights.improvement_tips &&
						playerData.insights.improvement_tips.length > 0 && (
							<div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
								<div className="text-center space-y-1">
									<Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-[#C8AA6E]" />
									<h3 className="lol-heading text-xl sm:text-2xl md:text-3xl text-[#C8AA6E] break-words">
										Level Up
									</h3>
									<p className="lol-subheading text-gray-500 text-xs sm:text-sm">
										Tips To Improve
									</p>
								</div>

								<div className="space-y-2 sm:space-y-3">
									{playerData.insights.improvement_tips.map((tip, index) => (
										<div
											key={index}
											className="lol-card p-3 sm:p-4 border-[#C8AA6E]/40 animate-slide-in-up"
											style={{ animationDelay: `${(index + 3) * 100}ms` }}
										>
											<div className="flex items-start gap-3 lol-accent-bar pl-3">
												<span className="text-base sm:text-lg font-bold text-[#C8AA6E] lol-heading flex-shrink-0">
													{index + 1}
												</span>
												<p className="text-sm sm:text-base text-gray-300 flex-1 lol-body break-words">
													{tip}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
				</div>
			</div>
		</div>
	);
};
