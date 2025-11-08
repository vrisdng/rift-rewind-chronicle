import type { PlayerStats } from "@/lib/api";
import { Sparkles } from "lucide-react";
import { getElementFilter } from "@/lib/elementFilters";

interface PersonaSlideProps {
	playerData: PlayerStats;
}

export const PersonaSlide = ({ playerData }: PersonaSlideProps) => {
	if (!playerData.persona || !playerData.element) return null;

	const videoFilter = getElementFilter(playerData.element.name);

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden">
			{/* Video Background with Element-based Color Filter */}
			<div className="absolute inset-0 w-full h-full bg-black">
				<video
					className="absolute inset-0 w-full h-full object-cover pointer-events-none"
					style={{
						width: '177.77777778vh', // 16:9 aspect ratio
						height: '56.25vw', // 16:9 aspect ratio
						minWidth: '100%',
						minHeight: '100%',
						position: 'absolute',
						top: '40%',
						left: '50%',
						transform: 'translate(-50%, -50%) scale(1.2)',
						filter: videoFilter,
					}}
					autoPlay
					muted
					loop
					playsInline
				>
					<source src="/videos/Fire Burning Hot Sparks Rising Background Free Video.mp4" type="video/mp4" />
				</video>
			</div>
			{/* Dark Overlay for readability */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Centered Content */}
			<div className="max-w-4xl w-full space-y-6 sm:space-y-8 animate-fade-in relative z-10 p-4 sm:p-6 md:p-8">
				{/* Title */}
				<div className="text-center space-y-2">
					<div className="flex items-center justify-center gap-3 mb-2">
						<h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
							Your Persona
						</h2>
					</div>
					<p className="lol-subheading text-gray-500 text-xs">
						Who are you in the Rift?
					</p>
				</div>

				{/* Persona Card */}
				<div className="lol-card p-6 sm:p-8 md:p-12 border-[#C8AA6E] text-center space-y-6 sm:space-y-8">
					<div className="space-y-4 sm:space-y-6">
						<div className="space-y-2">
							<p className="lol-subheading text-gray-500 text-xs tracking-[0.25em]">
								YOU ARE
							</p>
							<h3 className="lol-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E] break-words">
								{playerData.persona.codename}
							</h3>
						</div>

						<p className="text-base sm:text-xl md:text-2xl text-gray-300 lol-body leading-relaxed max-w-2xl mx-auto">
							{playerData.persona.description}
						</p>
					</div>

					{/* Rarity Badge */}
					<div className="flex items-center justify-center gap-2 px-2">
						<p className="lol-body text-sm sm:text-base md:text-lg text-[#C8AA6E] text-center">
							You are special. Only{" "}
							<span className="font-bold">
								{Math.floor(Math.random() * 8) + 3}%
							</span>{" "}
							of players share the same persona.
						</p>
					</div>

					{/* Origin Badge */}
					<div className="pt-4 sm:pt-6 border-t border-[#C8AA6E]/20">
						<div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-[#C8AA6E]/5">
							<div className="text-center">
								<p className="lol-subheading text-[10px] text-gray-600">
									ARCHETYPE
								</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#C8AA6E] lol-body whitespace-nowrap">
									{playerData.archetype.name}
								</p>
							</div>
							<span className="text-[#C8AA6E]/40 hidden sm:inline text-lg md:text-xl">+</span>
							<div className="text-center">
								<p className="lol-subheading text-[10px] text-gray-600">
									ELEMENT
								</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#C8AA6E] lol-body whitespace-nowrap">
									{playerData.element.name}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
