import type { PlayerStats } from "@/lib/api";
import { MetricsRadar } from "@/components/ui/metrics-radar";
import { MetricProgress } from "@/components/ui/metric-progress";
import cloudIcon from "@/assets/element-icons/cloud.svg";
import infernoIcon from "@/assets/element-icons/inferno.svg";
import oceanIcon from "@/assets/element-icons/ocean.svg";
import terraIcon from "@/assets/element-icons/terra.svg";
import voidIcon from "@/assets/element-icons/void.png";

interface MetricsSlideProps {
	playerData: PlayerStats;
}

const elementIcons: Record<string, string> = {
	Gale: cloudIcon,
	Inferno: infernoIcon,
	Tide: oceanIcon,
	Terra: terraIcon,
	Void: voidIcon,
};

export const MetricsSlide = ({ playerData }: MetricsSlideProps) => {
	const elementIcon = elementIcons[playerData.element.name];
	return (
		<div className="w-full h-screen flex flex-col items-center justify-start lol-bg-subtle relative overflow-hidden">
			{/* Background Image */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat "
				style={{ backgroundImage: 'url(/images/background-1.jpg)' }}
			/>
			{/* Dark Overlay */}
			<div className="absolute inset-0 bg-black/60" />

			{/* Scrollable Content */}
			<div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10">
				<div className="max-w-6xl w-full space-y-6 sm:space-y-8 animate-fade-in mx-auto p-4 sm:p-6 md:p-8 py-8 sm:py-12">
				{/* Title */}
				<div className="text-center space-y-2">
					<h2 className="lol-heading text-4xl sm:text-5xl md:text-6xl text-[#C8AA6E]">
						Your Playstyle
					</h2>
					<p className="lol-subheading text-gray-500 text-xs">
						{playerData.persona.codename}
					</p>
				</div>

				{/* Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Radar Chart */}
					<MetricsRadar metrics={playerData.derivedMetrics} title="" />

					{/* Key Metrics */}
					<div className="lol-card p-6 space-y-4">
						<h3 className="lol-subheading text-[#C8AA6E] text-xs mb-3 lol-accent-bar pl-4">
							Key Metrics
						</h3>
						<div className="space-y-4">
							<MetricProgress
								label="Early Game Strength"
								value={playerData.derivedMetrics.earlyGameStrength}
								description="Your effectiveness in the first 15 minutes"
							/>
							<MetricProgress
								label="Late Game Scaling"
								value={playerData.derivedMetrics.lateGameScaling}
								description="Your impact in the late game"
							/>
							<MetricProgress
								label="Consistency"
								value={playerData.derivedMetrics.consistency}
								description="How reliably you perform across games"
							/>
							<MetricProgress
								label="Champion Pool Depth"
								value={playerData.derivedMetrics.championPoolDepth}
								description="Effectiveness across different champions"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
		</div>
	);
};
