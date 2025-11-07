import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchShareCard, CANONICAL_SHARE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Copy, Loader2 } from "lucide-react";

const buildShareText = (caption: string) => {
	const trimmed = caption.trim();
	return trimmed.length ? `${trimmed}\n${CANONICAL_SHARE_URL}` : CANONICAL_SHARE_URL;
};

const ShareCardLanding = () => {
	const navigate = useNavigate();
	const { slug } = useParams<{ slug: string }>();

	useEffect(() => {
		if (!slug) {
			navigate("/");
		}
	}, [slug, navigate]);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["share-card", slug],
		enabled: Boolean(slug),
		queryFn: async () => {
			if (!slug) {
				throw new Error("Share card not found");
			}
			return fetchShareCard(slug);
		},
	});

	const shareText = useMemo(() => {
		if (!data) {
			return CANONICAL_SHARE_URL;
		}
		return buildShareText(data.caption);
	}, [data]);

	const handleCopy = async () => {
		try {
			if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
				await navigator.clipboard.writeText(shareText);
			} else {
				const textarea = document.createElement("textarea");
				textarea.value = shareText;
				textarea.style.position = "fixed";
				textarea.style.opacity = "0";
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}
			toast.success("Copied caption and link!");
		} catch (copyError) {
			console.error(copyError);
			toast.error("Unable to copy automatically. Select the text and copy manually.");
		}
	};

	const handleExplore = () => {
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-background px-6 py-16">
			<div className="mx-auto flex max-w-4xl flex-col items-center gap-10 text-center">
				<header className="space-y-3">
					<h1 className="text-4xl font-bold text-glow sm:text-5xl">
						Rift Rewind Chronicle
					</h1>
					<p className="text-muted-foreground text-lg">
						Relive this summoner&apos;s season and discover your own Rift Rewind.
					</p>
				</header>
				{isLoading && (
					<div className="flex flex-col items-center gap-4 rounded-3xl border border-border/40 bg-card/60 px-12 py-16">
						<Loader2 className="h-8 w-8 animate-spin text-[#C8AA6E]" />
						<p className="text-muted-foreground">Summoning share card...</p>
					</div>
				)}
				{isError && (
					<div className="max-w-lg space-y-4 rounded-3xl border border-destructive/50 bg-destructive/10 px-8 py-10 text-left">
						<h2 className="text-xl font-semibold text-destructive">Card not found</h2>
						<p className="text-sm text-destructive/80">
							{error instanceof Error
								? error.message
								: "We couldn’t find this share card. It may have expired."}
						</p>
						<Button variant="hero" onClick={handleExplore} className="mt-4">
							Back to Home
						</Button>
					</div>
				)}
				{data && !isError && (
					<>
						<div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[rgba(200,170,110,0.25)] bg-[#0A1428]/80 shadow-[0_25px_60px_rgba(8,12,22,0.45)]">
							<img
								src={data.imageUrl}
								alt="Rift Rewind share card"
								className="w-full object-cover"
							/>
						</div>
						<blockquote className="w-full max-w-2xl rounded-2xl border border-[rgba(200,170,110,0.25)] bg-[#0A1428]/60 p-6 text-left text-white/90">
							<p className="whitespace-pre-line text-base leading-relaxed">
								{data.caption}
							</p>
							<footer className="mt-4 text-sm uppercase tracking-[0.3em] text-[#C8AA6E]/70">
								{data.player.riotId
									? `${data.player.riotId}${data.player.tagLine ? `#${data.player.tagLine}` : ""}`
									: "Rift Rewind Summoner"}
							</footer>
						</blockquote>
						<div className="flex flex-wrap justify-center gap-4">
							<Button variant="hero" size="lg" onClick={handleExplore}>
								Check Your Rift Rewind
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="border-[#C8AA6E]/60 text-[#C8AA6E]"
								onClick={handleCopy}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy Caption & Link
							</Button>
						</div>
						<div className="text-sm text-muted-foreground">
							<a
								href={CANONICAL_SHARE_URL}
								target="_blank"
								rel="noreferrer"
								className="underline-offset-4 hover:underline"
							>
								{CANONICAL_SHARE_URL}
							</a>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default ShareCardLanding;
