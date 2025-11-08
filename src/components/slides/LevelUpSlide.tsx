import type { PlayerStats } from "@/lib/api";
import { Target } from "lucide-react";

interface LevelUpSlideProps {
	playerData: PlayerStats;
}

export const LevelUpSlide = ({ playerData }: LevelUpSlideProps) => {
	if (!playerData.insights?.improvement_tips || playerData.insights.improvement_tips.length === 0) {
		return null;
	}

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
					<Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-[#C8AA6E]" />
					<h2 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E] break-words">
						Level Up
					</h2>
					<p className="lol-subheading text-gray-500 text-xs sm:text-sm">
						Tips To Improve
					</p>
				</div>

				{/* Improvement Tips */}
				<div className="space-y-2 sm:space-y-3">
					{playerData.insights.improvement_tips.map((tip, index) => (
						<div
							key={index}
							className="lol-card p-3 sm:p-4 border-[#C8AA6E]/40 animate-slide-in-up"
							style={{ animationDelay: `${index * 100}ms` }}
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
		</div>
	);
};
