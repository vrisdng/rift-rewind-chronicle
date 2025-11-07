import { useCallback, useState } from "react";
import type {
	PlayerStats,
	ShareCardPayload,
	ShareCardPlayerSummary,
} from "@/lib/api";
import { createShareCard } from "@/lib/api";

export function buildShareCardSummary(
	playerData: PlayerStats,
): ShareCardPlayerSummary {
	return {
		puuid: playerData.puuid,
		riotId: playerData.riotId,
		tagLine: playerData.tagLine,
		totalGames: playerData.totalGames,
		winRate: playerData.winRate,
		archetype: {
			name: playerData.archetype.name,
			description: playerData.archetype.description,
		},
		insights: playerData.insights?.title
			? { title: playerData.insights.title }
			: null,
	};
}

export function useShareCardUpload(playerData: PlayerStats) {
	const [shareCard, setShareCard] = useState<ShareCardPayload | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const uploadShareCard = useCallback(
		async (cardDataUrl: string, caption: string) => {
			setIsUploading(true);
			setError(null);

			try {
				const summary = buildShareCardSummary(playerData);
				const result = await createShareCard({
					cardDataUrl,
					caption,
					player: summary,
				});
				setShareCard(result);
				return result;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create share card";
				setError(message);
				if (err instanceof Error) {
					throw err;
				}
				throw new Error(message);
			} finally {
				setIsUploading(false);
			}
		},
		[playerData],
	);

	const resetShareCard = useCallback(() => {
		setShareCard(null);
		setError(null);
	}, []);

	return {
		shareCard,
		isUploading,
		error,
		uploadShareCard,
		resetShareCard,
	};
}
