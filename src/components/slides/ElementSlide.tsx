import type { PlayerStats } from "@/lib/api";
import cloudIcon from "@/assets/element-icons/cloud.svg";
import infernoIcon from "@/assets/element-icons/inferno.svg";
import oceanIcon from "@/assets/element-icons/ocean.svg";
import terraIcon from "@/assets/element-icons/terra.svg";
import voidIcon from "@/assets/element-icons/void.png";
import { getElementFilter } from "@/lib/elementFilters";

interface ElementSlideProps {
	playerData: PlayerStats;
}

const elementIcons: Record<string, string> = {
	Gale: cloudIcon,
	Inferno: infernoIcon,
	Tide: oceanIcon,
	Terra: terraIcon,
	Void: voidIcon,
};

export const ElementSlide = ({ playerData }: ElementSlideProps) => {
	if (!playerData.element) return null;

	const elementIcon = elementIcons[playerData.element.name];
	const videoFilter = getElementFilter(playerData.element.name);

	return (
		<div className="w-full h-screen flex flex-col items-center justify-center lol-bg-subtle relative overflow-hidden p-8">
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
						<div className="w-32 h-32 rounded-full bg-[#C8AA6E]/10 flex items-center justify-center p-6">
							<img
								src={elementIcon}
								alt={playerData.element.name}
								className="w-full h-full object-contain"
							/>
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
