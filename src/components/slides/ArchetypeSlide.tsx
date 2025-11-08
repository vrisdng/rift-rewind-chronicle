import type { PlayerStats } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { getArchetypeIcon } from "@/lib/archetypeIcons";

interface ArchetypeSlideProps {
	playerData: PlayerStats;
}

export const ArchetypeSlide = ({ playerData }: ArchetypeSlideProps) => {
	const archetypeIcon = getArchetypeIcon(playerData.archetype.name);

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
			{/* Background Image */}
			<div 
				className="absolute inset-0 bg-cover bg-center bg-no-repeat "
				style={{ backgroundImage: 'url(/images/background-1.jpg)' }}
			/>
			{/* Dark Overlay */}
			<div className="absolute inset-0 bg-black/60" />
			
			<div className="max-w-4xl w-full space-y-8 animate-fade-in relative z-10">
				{/* Title */}
				<div className="text-center space-y-2">
					<h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
						Your Archetype
					</h2>
					<p className="lol-subheading text-gray-500 text-xs">
						Based On Your Gameplay And Stats
					</p>
				</div>

				{/* Archetype Card */}
				{/* Archetype Card */}
				<div className="lol-card p-12 border-[#C8AA6E] text-center space-y-6">
					<div className="flex justify-center">
						<img
							src={archetypeIcon}
							alt={playerData.archetype.name}
							className="w-20 h-20 object-contain"
						/>
					</div>
					<div className="space-y-4">
						<h3 className="lol-heading text-5xl md:text-6xl text-[#C8AA6E]">
							{playerData.archetype.name}
						</h3>
						<p className="text-xl md:text-2xl text-gray-300 lol-body leading-relaxed">
							{playerData.archetype.description}
						</p>
					</div>

					<div className="flex items-baseline justify-center gap-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-baseline gap-2 cursor-help">
										<span className="lol-subheading text-gray-500 text-3xl">
											Match Strength:
										</span>
										<span className="text-3xl font-bold text-[#C8AA6E] lol-body">
											{playerData.archetype.matchPercentage}%
										</span>
										<Info className="w-5 h-5 text-gray-500" />
									</div>
								</TooltipTrigger>
								<TooltipContent side="bottom" className="max-w-xs">
									<p className="text-xs">
										Our confidence score in matching you to this archetype based on your gameplay patterns and statistics.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</div>
		</div>
	);
};
