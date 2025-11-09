import express from "express";
import cors from "cors";
import { getClient } from "./lib/riot.ts";
import { analyzePlayer, getCachedPlayerStats } from "./lib/playerAnalyzer.ts";
import {
	createFriendGroup,
	getFriendGroup,
	createShareCard,
	getShareCardBySlug,
	getShareCardPublicUrl,
	getShareCardsBucket,
	getSupabaseClient,
} from "./lib/supabaseClient.ts";
import {
	invokeBedrockClaude,
	invokeBedrockClaudeStream,
} from "./lib/bedrockClient.ts";
import { buildChatbotSystemPrompt } from "./prompts/chatbot-system-prompt.ts";
import {
	AnalyzePlayerRequest,
	CreateGroupRequest,
	ProgressUpdate,
	CreateShareCardRequest,
	CreateShareCardResponse,
	GetShareCardResponse,
	ShareCardPayload,
	DBShareCard,
} from "./types/index.ts";
import { generateShareableTextFromSummary } from "./lib/insightGenerator.ts";
import { nanoid } from "nanoid";
import { computeDuoSynergy } from "./lib/duoSynergy.ts";

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse navigation actions from AI response
 * Format: "NAVIGATE: /path1 | Label 1 | /path2 | Label 2"
 * Returns array of { label, path } and cleaned text (without NAVIGATE lines)
 */
function parseNavigationActions(text: string): {
	actions: Array<{ label: string; path: string }>;
	cleanedText: string;
} {
	const navigationActions: Array<{ label: string; path: string }> = [];

	// Match lines starting with "NAVIGATE:"
	const navigateRegex = /NAVIGATE:\s*(.+)/gi;
	const matches = text.match(navigateRegex);

	if (!matches) return { actions: navigationActions, cleanedText: text };

	for (const match of matches) {
		// Extract content after "NAVIGATE:"
		const content = match.replace(/NAVIGATE:\s*/i, "").trim();

		// Split by | to get path/label pairs
		const parts = content.split("|").map((p) => p.trim());

		// Parse pairs: /path | Label | /path2 | Label2
		for (let i = 0; i < parts.length - 1; i += 2) {
			const path = parts[i];
			const label = parts[i + 1];

			if (path && label && path.startsWith("/")) {
				navigationActions.push({ label, path });
			}
		}
	}

	// Remove NAVIGATE lines from text (including surrounding newlines)
	const cleanedText = text.replace(/\n*NAVIGATE:\s*(.+)\n*/gi, "\n").trim();

	return { actions: navigationActions, cleanedText };
}

const MAX_SHARE_CARD_BYTES = 12 * 1024 * 1024; // 12MB safety limit
const SHARE_CARD_LANDING_BASE_URL = (
	process.env.SHARE_CARD_LANDING_BASE_URL ||
	"https://rift-rewind-chronicle.vercel.app/share"
).replace(/\/$/, "");
const SHARE_CARD_PREVIEW_FALLBACK_IMAGE =
	process.env.SHARE_CARD_PREVIEW_FALLBACK_IMAGE;
const SHARE_CARD_PREVIEW_CACHE_SECONDS = Math.max(
	60,
	Number(process.env.SHARE_CARD_PREVIEW_CACHE_SECONDS || 300),
);
const SHARE_CARD_PREVIEW_DEFAULT_DESCRIPTION =
	"Relive this summoner's Rift Rewind Chronicle and craft your own wrap-up.";

function buildSlug(riotId: string): string {
	const normalized = riotId
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 30);
	return `${normalized || "summoner"}-${nanoid(6)}`;
}

function buildShareCardPayload(card: DBShareCard): ShareCardPayload {
	return {
		slug: card.slug,
		imageUrl: getShareCardPublicUrl(card.image_path),
		caption: card.caption ?? "",
		player: {
			riotId: card.player_riot_id,
			tagLine: card.player_tag_line,
		},
		createdAt: card.created_at ?? new Date().toISOString(),
	};
}

function buildShareCardLandingUrl(slug: string): string {
	const base =
		SHARE_CARD_LANDING_BASE_URL ||
		"https://rift-rewind-chronicle.vercel.app/share";
	return `${base}/${slug}`;
}

function escapeHtml(value?: string | null): string {
	if (!value) return "";
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function truncate(text: string, limit: number): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function renderShareCardPreview(meta: {
	title: string;
	description: string;
	canonicalUrl: string;
	imageUrl?: string;
}): string {
	const safeTitle = escapeHtml(meta.title);
	const safeDescription = escapeHtml(meta.description);
	const safeCanonical = escapeHtml(meta.canonicalUrl);
	const safeImage = meta.imageUrl ? escapeHtml(meta.imageUrl) : "";
	const imageTags = safeImage
		? `\n<meta property="og:image" content="${safeImage}" />\n<meta property="og:image:secure_url" content="${safeImage}" />\n<meta name="twitter:image" content="${safeImage}" />`
		: "";

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <link rel="canonical" href="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Rift Rewind Chronicle" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />${imageTags}
</head>
<body style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background:#050914; color:#f8f8f8; margin:0;">
  <main style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px; text-align:center; gap:16px;">
    <h1 style="font-size:1.75rem;">${safeTitle}</h1>
    <p style="max-width:640px; line-height:1.6; opacity:0.85;">${safeDescription}</p>
    <a href="${safeCanonical}" style="display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:999px; background:#C8AA6E; color:#050914; text-decoration:none; font-weight:600;">View full share card</a>
  </main>
  <script>window.location.replace(${JSON.stringify(meta.canonicalUrl)});</script>
</body>
</html>`;
}

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
	"http://localhost:8080",
	"http://localhost:3000",
	"https://rift-rewind-chronicle.vercel.app",
	"https://rift-rewind-chronicle.onrender.com",
];

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin))
				return callback(null, true);
			return callback(new Error("Not allowed by CORS"));
		},
		credentials: true,
	}),
);
app.use(express.json({ limit: "15mb" })); // Increase limit for base64 image uploads

// ==================== PLAYER ANALYSIS ====================

/**
 * POST /api/analyze-stream
 * Analyze a player with SSE (Server-Sent Events) for real-time progress updates
 */
app.post("/api/analyze-stream", async (req, res) => {
	try {
		const {
			riotId,
			tagLine,
			region = "sg2",
			forceRegenerateInsights = false,
		} = req.body as AnalyzePlayerRequest & {
			forceRegenerateInsights?: boolean;
		};

		if (!riotId || !tagLine) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: riotId and tagLine",
			});
		}

		// Set SSE headers
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.setHeader("X-Accel-Buffering", "no"); // Important for Nginx/Render

		// Helper to send SSE messages
		const sendEvent = (event: string, data: any) => {
			res.write(`event: ${event}\n`);
			res.write(`data: ${JSON.stringify(data)}\n\n`);
		};

		console.log(`📊 Starting streaming analysis for ${riotId}#${tagLine}`);

		try {
			// Check cache first (unless forcing regeneration)
			if (!forceRegenerateInsights) {
				const cached = await getCachedPlayerStats(riotId, tagLine);
				if (cached) {
					console.log(`✅ Returning cached data for ${riotId}#${tagLine}`);
					sendEvent("complete", { data: cached, cached: true });
					res.end();
					return;
				}
			}

			// Analyze with progress callback
			const playerStats = await analyzePlayer(
				riotId,
				tagLine,
				region,
				(update: ProgressUpdate) => {
					console.log(
						`📈 Progress: ${update.stage} - ${update.message} (${update.progress}%)`,
					);
					sendEvent("progress", update);
				},
				forceRegenerateInsights,
			);

			console.log(`✅ Analysis complete for ${riotId}#${tagLine}`);
			sendEvent("complete", { data: playerStats, cached: false });
			res.end();
		} catch (error: any) {
			console.error("Error during streaming analysis:", error);
			sendEvent("error", {
				message: error.message || "Failed to analyze player",
			});
			res.end();
		}
	} catch (error: any) {
		console.error("Error setting up streaming:", error);
		res.status(500).json({
			success: false,
			error: error.message || "Failed to start analysis",
		});
	}
});

/**
 * GET /api/player/:riotId/:tagLine
 * Get cached player data
 */
app.get("/api/player/:riotId/:tagLine", async (req, res) => {
	try {
		const { riotId, tagLine } = req.params;

		const playerStats = await getCachedPlayerStats(riotId, tagLine);

		if (!playerStats) {
			return res.status(404).json({
				success: false,
				error: "Player not found. Please analyze first.",
			});
		}

		res.json({
			success: true,
			data: playerStats,
		});
	} catch (error: any) {
		console.error("Error fetching player:", error);
		res.status(500).json({
			success: false,
			error: error.message || "Failed to fetch player data",
		});
	}
});

/**
 * POST /api/duo-synergy
 * Build duo synergy profile for two Riot IDs
 */
app.post("/api/duo-synergy", async (req, res) => {
	try {
		const { playerA, playerB } = req.body || {};

		if (!playerA || !playerB) {
			return res.status(400).json({
				success: false,
				error: "Both playerA and playerB are required.",
			});
		}

		// Check if using mock demo accounts
		const isMockRequest =
			(playerA.riotId === "Racchanvris" && playerA.tagLine === "VN8" && playerB.riotId === "hhjj4" && playerB.tagLine === "6983") ||
			(playerA.riotId === "hhjj4" && playerA.tagLine === "6983" && playerB.riotId === "Racchanvris" && playerB.tagLine === "VN8");

		let data;
		if (isMockRequest) {
			// Use mock data for testing
			const { getMockDuoSynergy } = await import("./lib/duoSynergy.ts");
			data = getMockDuoSynergy(playerA, playerB);
			console.log(`[MOCK] Duo synergy returned for demo accounts: ${playerA.riotId}#${playerA.tagLine} + ${playerB.riotId}#${playerB.tagLine}`);
		} else {
			// Real computation
			data = await computeDuoSynergy(playerA, playerB);
		}

		res.json({
			success: true,
			data,
		});
	} catch (error: any) {
		console.error("Error computing duo synergy:", error);
		const message = error.message || "Failed to compute duo synergy";
		const isClientError = /required|No shared matches|analyze/i.test(message);
		res.status(isClientError ? 400 : 500).json({
			success: false,
			error: message,
		});
	}
});

// ==================== SHARE CARDS ====================

/**
 * POST /api/share-cards
 * Upload shareable cards (JPEG) to Supabase Storage and persist metadata
 */
app.post("/api/share-cards", async (req, res) => {
	const body = req.body as CreateShareCardRequest;
	try {
		const { cardDataUrl, caption, player } = body;

		if (!cardDataUrl || typeof cardDataUrl !== "string") {
			const response: CreateShareCardResponse = {
				success: false,
				error: "Missing cardDataUrl",
			};
			return res.status(400).json(response);
		}

		if (!player || !player.riotId || !player.tagLine) {
			const response: CreateShareCardResponse = {
				success: false,
				error: "Player information is required",
			};
			return res.status(400).json(response);
		}

		const [prefix, base64Data] = cardDataUrl.split(",");
		const mimeMatch = prefix?.match(/^data:(image\/png|image\/jpeg)/);
		const mimeType = mimeMatch?.[1];
		if (!mimeType || !base64Data) {
			const response: CreateShareCardResponse = {
				success: false,
				error: "cardDataUrl must be a PNG or JPEG data URL",
			};
			return res.status(400).json(response);
		}

		const buffer = Buffer.from(base64Data, "base64");

		if (!buffer.length) {
			const response: CreateShareCardResponse = {
				success: false,
				error: "cardDataUrl is empty",
			};
			return res.status(400).json(response);
		}

		if (buffer.length > MAX_SHARE_CARD_BYTES) {
			const maxSizeMb = Math.round(MAX_SHARE_CARD_BYTES / (1024 * 1024));
			const response: CreateShareCardResponse = {
				success: false,
				error: `Share card image exceeds ${maxSizeMb}MB limit`,
			};
			return res.status(413).json(response);
		}

		const supabase = getSupabaseClient();
		const bucketId = getShareCardsBucket();
		const slug = buildSlug(player.riotId);
		const fileExtension = mimeType === "image/png" ? "png" : "jpeg";
		const filePath = `${slug}.${fileExtension}`;

		const { error: uploadError } = await supabase.storage
			.from(bucketId)
			.upload(filePath, buffer, {
				contentType: mimeType,
				upsert: false,
			});

		if (uploadError) {
			console.error("Error uploading share card:", uploadError);
			const response: CreateShareCardResponse = {
				success: false,
				error: "Failed to store share card",
			};
			return res.status(500).json(response);
		}

		const finalCaption =
			caption?.trim() && caption.trim().length > 0
				? caption.trim()
				: generateShareableTextFromSummary(player);

		try {
			const cardRecord = await createShareCard({
				slug,
				player_puuid: player.puuid ?? null,
				player_riot_id: player.riotId,
				player_tag_line: player.tagLine,
				caption: finalCaption,
				image_path: filePath,
				player_snapshot: player,
			});

			const payload = buildShareCardPayload(cardRecord);
			const response: CreateShareCardResponse = {
				success: true,
				data: payload,
			};
			return res.json(response);
		} catch (error: any) {
			console.error("Error creating share card record:", error);
			// Best-effort cleanup to avoid orphaned files
			await supabase.storage.from(bucketId).remove([filePath]);
			const response: CreateShareCardResponse = {
				success: false,
				error: "Failed to save share card",
			};
			return res.status(500).json(response);
		}
	} catch (error: any) {
		console.error("Unexpected error creating share card:", error);
		const response: CreateShareCardResponse = {
			success: false,
			error: error.message || "Unexpected error",
		};
		return res.status(500).json(response);
	}
});

/**
 * GET /api/share-cards/:slug
 * Fetch share card metadata for landing page rendering
 */
app.get("/api/share-cards/:slug", async (req, res) => {
	try {
		const { slug } = req.params;
		if (!slug) {
			const response: GetShareCardResponse = {
				success: false,
				error: "Slug is required",
			};
			return res.status(400).json(response);
		}

		const cardRecord = await getShareCardBySlug(slug);

		if (!cardRecord) {
			const response: GetShareCardResponse = {
				success: false,
				error: "Share card not found",
			};
			return res.status(404).json(response);
		}

		const payload = buildShareCardPayload(cardRecord);
		const response: GetShareCardResponse = {
			success: true,
			data: payload,
		};

		return res.json(response);
	} catch (error: any) {
		console.error("Error fetching share card:", error);
		const response: GetShareCardResponse = {
			success: false,
			error: error.message || "Failed to fetch share card",
		};
		return res.status(500).json(response);
	}
});

/**
 * GET /share/:slug/preview
 * Server-rendered social preview with OpenGraph and Twitter cards
 */
app.get("/share/:slug/preview", async (req, res) => {
	const { slug } = req.params;

	if (!slug) {
		const html = renderShareCardPreview({
			title: "Rift Rewind Chronicle",
			description: "Share card slug is required.",
			canonicalUrl:
				SHARE_CARD_LANDING_BASE_URL ||
				"https://rift-rewind-chronicle.vercel.app/share",
			imageUrl: SHARE_CARD_PREVIEW_FALLBACK_IMAGE,
		});
		res
			.status(400)
			.set("Content-Type", "text/html; charset=utf-8")
			.set("Cache-Control", "public, max-age=60")
			.send(html);
		return;
	}

	try {
		const cardRecord = await getShareCardBySlug(slug);

		if (!cardRecord) {
			const html = renderShareCardPreview({
				title: "Share card unavailable | Rift Rewind Chronicle",
				description:
					"This share card may have expired or been removed. Generate your own Rift Rewind recap to share with friends.",
				canonicalUrl:
					SHARE_CARD_LANDING_BASE_URL ||
					"https://rift-rewind-chronicle.vercel.app/share",
				imageUrl: SHARE_CARD_PREVIEW_FALLBACK_IMAGE,
			});
			res
				.status(404)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "public, max-age=60")
				.send(html);
			return;
		}

		const payload = buildShareCardPayload(cardRecord);
		const summonerLabel = payload.player.riotId
			? `${payload.player.riotId}${payload.player.tagLine ? `#${payload.player.tagLine}` : ""}`
			: "Rift Rewind Summoner";
		const title = `${summonerLabel}'s Rift Rewind Chronicle`;
		const descriptionSource =
			(payload.caption || "").trim() || SHARE_CARD_PREVIEW_DEFAULT_DESCRIPTION;
		const description = truncate(descriptionSource, 240);
		const canonicalUrl = buildShareCardLandingUrl(payload.slug);

		const html = renderShareCardPreview({
			title,
			description,
			canonicalUrl,
			imageUrl: payload.imageUrl,
		});

		res
			.status(200)
			.set("Content-Type", "text/html; charset=utf-8")
			.set(
				"Cache-Control",
				`public, max-age=${SHARE_CARD_PREVIEW_CACHE_SECONDS}`,
			)
			.send(html);
	} catch (error) {
		console.error("Error rendering share card preview:", error);
		const html = renderShareCardPreview({
			title: "Rift Rewind Chronicle",
			description:
				"We hit a snag generating this preview. Please try again in a moment.",
			canonicalUrl:
				SHARE_CARD_LANDING_BASE_URL ||
				"https://rift-rewind-chronicle.vercel.app/share",
			imageUrl: SHARE_CARD_PREVIEW_FALLBACK_IMAGE,
		});
		res
			.status(500)
			.set("Content-Type", "text/html; charset=utf-8")
			.set("Cache-Control", "no-store")
			.send(html);
	}
});

// ==================== FRIEND GROUPS ====================

/**
 * POST /api/group
 * Create a friend group for comparative analysis
 */
app.post("/api/group", async (req, res) => {
	try {
		const { name, players } = req.body as CreateGroupRequest;

		if (!name || !players || players.length < 2) {
			return res.status(400).json({
				success: false,
				error: "Group name and at least 2 players required",
			});
		}

		// Analyze all players first
		const puuids: string[] = [];

		for (const player of players) {
			const stats = await getCachedPlayerStats(player.riotId, player.tagLine);
			if (stats) {
				puuids.push(stats.puuid);
			} else {
				// Need to analyze first
				const analyzed = await analyzePlayer(player.riotId, player.tagLine);
				puuids.push(analyzed.puuid);
			}
		}

		// Create group
		const groupId = await createFriendGroup(name, puuids);

		res.json({
			success: true,
			groupId,
		});
	} catch (error: any) {
		console.error("Error creating group:", error);
		res.status(500).json({
			success: false,
			error: error.message || "Failed to create group",
		});
	}
});

/**
 * GET /api/group/:groupId
 * Get friend group with member stats
 */
app.get("/api/group/:groupId", async (req, res) => {
	try {
		const { groupId } = req.params;

		const group = await getFriendGroup(groupId);

		if (!group) {
			return res.status(404).json({
				success: false,
				error: "Group not found",
			});
		}

		res.json({
			success: true,
			data: group,
		});
	} catch (error: any) {
		console.error("Error fetching group:", error);
		res.status(500).json({
			success: false,
			error: error.message || "Failed to fetch group",
		});
	}
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
	console.log(
		`\n🚀 Rift Rewind API server running on http://localhost:${PORT}`,
	);
	console.log(`\n📊 Configuration:`);
	console.log(
		`  ✅ Riot API Key: ${!!process.env.RIOT_API_KEY ? "Configured" : "❌ Missing"}`,
	);
	console.log(
		`  ✅ Supabase: ${!!process.env.SUPABASE_URL ? "Configured" : "❌ Missing"}`,
	);
	console.log(
		`  ✅ AWS Bedrock: ${!!process.env.AWS_ACCESS_KEY_ID ? "Configured" : "❌ Missing (using mocks)"}`,
	);
	const hasXConfig =
		!!process.env.X_API_KEY &&
		!!process.env.X_API_SECRET &&
		!!process.env.X_CALLBACK_URL;
	console.log(
		`  ✅ X API: ${hasXConfig ? "Configured" : "❌ Missing (X login disabled)"}`,
	);
});

// ==================== CHAT STREAMING ====================

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{role, content}> }
 * Streams LLM response as NDJSON (newline-delimited JSON)
 */
app.post("/api/chat", async (req, res) => {
	try {
		const {
			message,
			history = [],
			playerContext,
			availableSlides = [],
		} = req.body as {
			message: string;
			history?: Array<{ role: "user" | "assistant"; content: string }>;
			playerContext?: any; // PlayerStats with insights
			availableSlides?: Array<{ id: string; narration: string }>;
		};

		if (!message) {
			return res.status(400).json({ success: false, error: "Missing message" });
		}

		console.log(`💬 Chat request: "${message.substring(0, 50)}..."`);
		console.log(
			`👤 Player context:`,
			playerContext
				? `${playerContext.riotId}#${playerContext.tagLine} (${playerContext.totalGames} games)`
				: "None",
		);
		console.log(`🎬 Available slides: ${availableSlides.length}`);

		// Set headers for NDJSON streaming
		res.set({
			"Content-Type": "application/x-ndjson",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		});
		res.flushHeaders();

		// Build system prompt using dedicated prompt builder
		const systemPrompt = buildChatbotSystemPrompt(playerContext, availableSlides);
		console.log(
			`📋 System prompt built with ${systemPrompt.length} chars, has player data: ${!!playerContext}, slides: ${availableSlides.length}`,
		);

		// Trim history to last 10 messages to avoid token limit issues
		const recentHistory = (history || [])
			.filter((msg: any) => msg.content && msg.content.trim().length > 0)
			.slice(-10);

		// Build messages array with only conversation history + current message
		// Don't include system prompt here - it will be passed as a separate parameter
		const messages: Array<{ role: "user" | "assistant"; content: string }> = [
			...recentHistory,
			{ role: "user", content: message },
		];

		console.log(`🔄 [API] Invoking Bedrock stream with ${messages.length} messages and system prompt`);

		// Accumulate full response to parse navigation actions
		let fullResponse = "";
		let streamedText = ""; // Track what we've already sent to client

		await invokeBedrockClaudeStream(
			messages,
			// onChunk: Stream each token to client
			(text: string) => {
				console.log(`📤 [API] Streaming chunk (${text.length} chars)`);
				fullResponse += text;
				streamedText += text;
				res.write(JSON.stringify({ delta: text }) + "\n");
			},
			// onComplete: Parse navigation actions and send done
			() => {
				console.log(`✅ [API] Stream complete, full response length: ${fullResponse.length}`);
				
				// Parse slide navigation from NAVIGATE_SLIDE lines
				const navigatePattern = /NAVIGATE_SLIDE:\s*\{([^}]+)\}/g;
				const navigationActions: Array<{ slideId: string; label: string; description?: string }> = [];
				let match;
				
				while ((match = navigatePattern.exec(fullResponse)) !== null) {
					try {
						const actionJson = `{${match[1]}}`;
						const action = JSON.parse(actionJson);
						navigationActions.push(action);
						console.log(`🧭 [API] Found slide navigation action:`, action);
					} catch (parseErr) {
						console.warn(`⚠️ [API] Failed to parse slide navigation action:`, match[0]);
					}
				}

				// Remove NAVIGATE_SLIDE lines from response
				if (navigationActions.length > 0) {
					const cleanedResponse = fullResponse.replace(/NAVIGATE_SLIDE:\s*\{[^}]+\}\n?/g, "").trim();
					console.log(`🧹 [API] Cleaned response, removed ${navigationActions.length} NAVIGATE_SLIDE lines`);
					res.write(JSON.stringify({ replaceText: cleanedResponse }) + "\n");
					res.write(JSON.stringify({ navigationActions }) + "\n");
				}

				res.write(JSON.stringify({ done: true }) + "\n");
				res.end();
				console.log(`🏁 [API] Response stream ended`);
			},
			// onError: Handle streaming errors
			(error: Error) => {
				console.error(`❌ [API] Stream error:`, error.message);
				console.error(`❌ [API] Error stack:`, error.stack);
				res.write(JSON.stringify({ error: error.message }) + "\n");
				res.end();
			},
			// Pass system prompt as separate parameter (5th argument)
			systemPrompt
		);
	} catch (error: any) {
		console.error("❌ [API] Error in /api/chat:", error);
		console.error("❌ [API] Error stack:", error.stack);
		if (!res.headersSent) {
			res.status(500).json({ success: false, error: error.message });
		} else {
			res.write(JSON.stringify({ error: error.message }) + "\n");
			res.end();
		}
	}
});
