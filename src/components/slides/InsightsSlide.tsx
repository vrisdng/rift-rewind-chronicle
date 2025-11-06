import type { PlayerStats } from "@/lib/api";
import { Lightbulb, Target } from "lucide-react";

interface InsightsSlideProps {
	playerData: PlayerStats;
}

export const InsightsSlide = ({ playerData }: InsightsSlideProps) => {
	if (!playerData.insights?.surprising_insights) return null;

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative p-8 overflow-hidden">
			<div className="max-w-5xl w-full space-y-4 animate-fade-in relative z-10">
				{/* Title */}
				<div className="text-center space-y-1">
					<h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
						Hidden Insights
					</h2>
					<p className="lol-subheading text-gray-500 text-xs">
						What The Data Reveals
					</p>
				</div>

				{/* Surprising Insights */}
				<div className="space-y-2">
					{playerData.insights.surprising_insights.map((insight, index) => (
						<div
							key={index}
							className="lol-card p-3 animate-slide-in-up"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className="flex items-start gap-3 lol-accent-bar pl-3">
								<div className="flex-shrink-0">
									<Lightbulb className="w-4 h-4 text-[#C8AA6E]" />
								</div>
								<p className="text-sm text-gray-300 flex-1 leading-relaxed lol-body">
									{insight}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Improvement Tips */}
				{playerData.insights.improvement_tips &&
					playerData.insights.improvement_tips.length > 0 && (
						<div className="space-y-3 pt-2">
							<div className="text-center space-y-1">
								<Target className="w-8 h-8 mx-auto text-[#C8AA6E]" />
								<h3 className="lol-heading text-2xl md:text-3xl text-[#C8AA6E]">
									Level Up
								</h3>
								<p className="lol-subheading text-gray-500 text-xs">
									Tips To Improve
								</p>
							</div>

							<div className="space-y-2">
								{playerData.insights.improvement_tips.map((tip, index) => (
									<div
										key={index}
										className="lol-card p-3 border-[#C8AA6E]/40 animate-slide-in-up"
										style={{ animationDelay: `${(index + 3) * 100}ms` }}
									>
										<div className="flex items-start gap-3 lol-accent-bar pl-3">
											<span className="text-lg font-bold text-[#C8AA6E] lol-heading flex-shrink-0">
												{index + 1}
											</span>
											<p className="text-sm text-gray-300 flex-1 lol-body">
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
	);
};
