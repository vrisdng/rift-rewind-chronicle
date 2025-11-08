import type { PlayerStats } from "@/lib/api";

interface ArchetypeSlideProps {
	playerData: PlayerStats;
}

export const ArchetypeSlide = ({ playerData }: ArchetypeSlideProps) => {
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
				<div className="lol-card p-12 border-[#C8AA6E] text-center space-y-6">
					<div className="flex justify-center">
						<div className="w-32 h-32 rounded-full bg-[#C8AA6E]/10 flex items-center justify-center">
							<span className="text-7xl">{playerData.archetype.icon}</span>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="lol-heading text-5xl md:text-6xl text-[#C8AA6E]">
							{playerData.archetype.name}
						</h3>
						<p className="text-xl md:text-2xl text-gray-300 lol-body leading-relaxed">
							{playerData.archetype.description}
						</p>
					</div>

					<div className="flex items-baseline justify-center gap-2 pt-4">
						<span className="lol-subheading text-gray-500 text-xs">
							Match Strength:
						</span>
						<span className="text-3xl font-bold text-[#C8AA6E] lol-body">
							{playerData.archetype.matchPercentage}%
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
