import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { COACHES } from "../../shared/coaches";
import type { PlayerStats } from "@/lib/api";

const Coaches = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [playerData, setPlayerData] = useState<PlayerStats | null>(null);

	useEffect(() => {
		const data = location.state?.playerData as PlayerStats | undefined;
		if (!data) {
			navigate("/");
			return;
		}
		setPlayerData(data);
	}, [location.state, navigate]);

	if (!playerData) {
		return null;
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#050914]">
			<div className="absolute inset-0 bg-[url('/images/background-1.jpg')] bg-cover bg-top opacity-30" />
			<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-[#050914]" />

			<div className="relative z-10 px-4 py-10 sm:px-8 lg:px-12">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
					<header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
						<div className="flex items-center gap-3 text-sm uppercase tracking-wide text-[#C8AA6E]">
							<Users className="h-4 w-4" />
							Rift Rewind Training Lab
						</div>
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div className="space-y-2 text-white">
								<h1 className="text-3xl font-bold md:text-4xl">
									Specialized Coaches
								</h1>
								<p className="text-sm text-white/70 md:text-base">
									Choose the AI mentor that matches the skill you want to level up
									next. Each coach has a distinct personality, focus area, and way
									of pushing you beyond your comfort zone.
								</p>
								<p className="text-xs uppercase tracking-wide text-white/50">
									Player: {playerData.riotId}
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button
									variant="outline"
									className="border-white/30 text-white hover:bg-white/10"
									onClick={() => navigate("/dashboard", { state: { playerData } })}
								>
									Return to Recap
								</Button>
								<Button
									className="bg-[#C8AA6E] text-[#0A1428] font-semibold hover:bg-[#d8b87a]"
									onClick={() => navigate("/")}
								>
									Start Fresh
								</Button>
							</div>
						</div>
					</header>

					<section className="grid gap-6 md:grid-cols-2">
						{COACHES.map((coach) => (
							<Card
								key={coach.id}
								className="group relative overflow-hidden border-white/10 bg-white/5 shadow-xl transition hover:border-[#C8AA6E]/60"
							>
								<div
									className={`pointer-events-none absolute inset-0 opacity-30 blur-3xl transition group-hover:opacity-60 ${coach.backgroundGlow}`}
								/>
								<CardHeader className="relative z-10 space-y-4">
									<div className="flex items-center gap-4">
										<div className="h-16 w-16 overflow-hidden rounded-full border border-white/20 shadow-lg">
											<img
												src={coach.avatar}
												alt={coach.name}
												className="h-full w-full object-cover"
											/>
										</div>
										<div>
											<p className="text-xs uppercase tracking-wide text-white/70">
												{coach.title}
											</p>
											<h3 className="text-xl font-semibold text-white">
												{coach.name}
											</h3>
											<p className="text-sm text-white/60">{coach.nickname}</p>
										</div>
									</div>
									<blockquote className="text-sm italic text-white/80">
										“{coach.signatureQuote}”
									</blockquote>
								</CardHeader>
								<CardContent className="relative z-10 space-y-4">
									<p className="text-sm text-white/80">{coach.shortDescription}</p>
									<Button
										className="flex w-full items-center justify-center gap-2 bg-white/90 text-[#0A1428] font-semibold transition group-hover:bg-white"
										onClick={() =>
											navigate(`/coaches/${coach.id}`, {
												state: { playerData },
											})
										}
									>
										Meet Your Coach
										<Sparkles className="h-4 w-4" />
									</Button>
								</CardContent>
							</Card>
						))}
					</section>
				</div>
			</div>
		</div>
	);
};

export default Coaches;
