import type { PlayerStats } from "@/lib/api";
import { Sparkles } from "lucide-react";

interface PersonaSlideProps {
	playerData: PlayerStats;
}

export const PersonaSlide = ({ playerData }: PersonaSlideProps) => {
	if (!playerData.persona || !playerData.element) return null;

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
			<div className="max-w-4xl w-full space-y-8 animate-fade-in relative z-10">
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
				<div className="lol-card p-12 border-[#C8AA6E] text-center space-y-8">
					<div className="space-y-6">
						<div className="space-y-2">
							<p className="lol-subheading text-gray-500 text-xs tracking-[0.25em]">
								YOU ARE
							</p>
							<h3 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
								{playerData.persona.codename}
							</h3>
						</div>

						<p className="text-xl md:text-2xl text-gray-300 lol-body leading-relaxed max-w-2xl mx-auto">
							{playerData.persona.description}
						</p>
					</div>

					{/* Rarity Badge */}
					<div className="flex items-center justify-center gap-2">
						<p className="lol-body text-lg text-[#C8AA6E]">
							You are special. Only{" "}
							<span className="font-bold">
								{Math.floor(Math.random() * 8) + 3}%
							</span>{" "}
							of players share the same persona.
						</p>
					</div>

					{/* Origin Badge */}
					<div className="pt-6 border-t border-[#C8AA6E]/20">
						<div className="inline-flex items-center gap-4 px-6 py-3 bg-[#C8AA6E]/5">
							<div className="text-center">
								<p className="lol-subheading text-[10px] text-gray-600">
									ARCHETYPE
								</p>
								<p className="text-sm text-[#C8AA6E] lol-body">
									{playerData.archetype.name}
								</p>
							</div>
							<span className="text-[#C8AA6E]/40">+</span>
							<div className="text-center">
								<p className="lol-subheading text-[10px] text-gray-600">
									ELEMENT
								</p>
								<p className="text-sm text-[#C8AA6E] lol-body">
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
