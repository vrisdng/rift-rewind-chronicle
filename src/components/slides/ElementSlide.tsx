import type { PlayerStats } from "@/lib/api";

interface ElementSlideProps {
	playerData: PlayerStats;
}

export const ElementSlide = ({ playerData }: ElementSlideProps) => {
	if (!playerData.element) return null;

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
			<div className="max-w-4xl w-full space-y-8 animate-fade-in relative z-10">
				{/* Title */}
				<div className="text-center space-y-2">
					<h2 className="lol-heading text-4xl md:text-5xl lg:text-6xl text-[#C8AA6E]">
						Your Element
					</h2>
					<p className="lol-subheading text-gray-500 text-xs">
						The Energy Behind Your Playstyle
					</p>
				</div>

				{/* Element Card */}
				<div className="lol-card p-12 border-[#C8AA6E] text-center space-y-6">
					<div className="flex justify-center">
						<div className="w-32 h-32 rounded-full bg-[#C8AA6E]/10 flex items-center justify-center">
							<span className="text-7xl">{playerData.element.icon}</span>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="lol-heading text-5xl md:text-6xl text-[#C8AA6E]">
							{playerData.element.name}
						</h3>
						<p className="text-xl md:text-2xl text-gray-300 lol-body leading-relaxed">
							Your energy reflects that of{" "}
							{playerData.element.name.toLowerCase()}
						</p>
						<p className="text-lg text-gray-400 italic">
							{playerData.element.description}
						</p>
					</div>

					<div className="flex flex-wrap justify-center gap-3 pt-4">
						{playerData.element.keywords.map((keyword) => (
							<span
								key={keyword}
								className="px-4 py-2 bg-[#C8AA6E]/20 border border-[#C8AA6E]/40 text-[#C8AA6E] lol-subheading text-xs tracking-[0.25em]"
							>
								{keyword}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
