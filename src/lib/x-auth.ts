export const X_AUTH_STORAGE_KEY = "rift-rewind-x-auth";

export interface StoredXSession {
	oauthToken: string;
	oauthTokenSecret: string;
	screenName: string;
	userId: string;
}
