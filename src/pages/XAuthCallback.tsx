import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { completeXAuthSession } from "@/lib/api";
import { X_AUTH_STORAGE_KEY, type StoredXSession } from "@/lib/x-auth";
import { Loader2, Twitter } from "lucide-react";

const XAuthCallback = () => {
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
	const [message, setMessage] = useState("Connecting to X...");

	useEffect(() => {
		const oauthToken = searchParams.get("oauth_token");
		const oauthVerifier = searchParams.get("oauth_verifier");

		if (!oauthToken || !oauthVerifier) {
			setStatus("error");
			setMessage("Missing credentials from X. Please try connecting again.");
			return;
		}

		const finalize = async () => {
			try {
				const session = await completeXAuthSession(oauthToken, oauthVerifier);
				const payload: StoredXSession = {
					oauthToken: session.oauthToken,
					oauthTokenSecret: session.oauthTokenSecret,
					screenName: session.screenName,
					userId: session.userId,
				};
				window.localStorage.setItem(X_AUTH_STORAGE_KEY, JSON.stringify(payload));

				if (window.opener && window.opener !== window) {
					window.opener.postMessage(
						{ type: "X_AUTH_SUCCESS", payload },
						window.location.origin,
					);
				}

				setStatus("success");
				setMessage(
					session.screenName
						? `Connected as @${session.screenName}`
						: "X account connected",
				);

				setTimeout(() => {
					if (window.opener && window.opener !== window) {
						window.close();
					} else {
						window.location.replace("/");
					}
				}, 1500);
			} catch (error) {
				const err = error instanceof Error ? error.message : "Failed to connect to X";
				setStatus("error");
				setMessage(err);
			}
		};

		void finalize();
	}, [searchParams]);

	const isPending = status === "pending";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#050912] px-4 text-center text-white">
			<div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
				<div className="mb-4 flex items-center justify-center gap-2 text-[#C8AA6E]">
					<Twitter className="h-6 w-6" />
					<p className="lol-heading tracking-[0.3em] uppercase">X Login</p>
				</div>
				{isPending && <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-white" />}
				<p className="text-lg font-semibold">{message}</p>
				{status === "success" && (
					<p className="mt-3 text-sm text-white/70">
						This window will close automatically. You can return to your recap.
					</p>
				)}
				{status === "error" && (
					<p className="mt-3 text-sm text-red-300">
						Close this tab and start the connection again from Rift Rewind.
					</p>
				)}
			</div>
		</div>
	);
};

export default XAuthCallback;
