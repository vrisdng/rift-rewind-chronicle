import crypto from 'crypto';
import type { XAccessTokenPayload, XPostTweetRequest } from '../types/application.ts';

const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_CALLBACK_URL = process.env.X_CALLBACK_URL;

const REQUEST_TOKEN_TTL_MS = 15 * 60 * 1000;
const REQUEST_TOKEN_STORE = new Map<string, { secret: string; createdAt: number }>();

const TWITTER_API_BASE = 'https://api.twitter.com';
const TWITTER_UPLOAD_BASE = 'https://upload.twitter.com';

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!*()']/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function getXConfig() {
  if (!X_API_KEY || !X_API_SECRET) {
    throw new Error('X API is not configured. Set X_API_KEY and X_API_SECRET in server/.env');
  }
  if (!X_CALLBACK_URL) {
    throw new Error('X_CALLBACK_URL is missing in server/.env');
  }
  return {
    apiKey: X_API_KEY,
    apiSecret: X_API_SECRET,
    callbackUrl: X_CALLBACK_URL,
  };
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

interface OAuthHeaderOptions {
  method: 'GET' | 'POST';
  url: string;
  token?: string;
  tokenSecret?: string;
  includeCallback?: boolean;
  includeVerifier?: string;
  params?: Record<string, string>;
}

interface XApiError {
  code?: number;
  message?: string;
}

interface XStatusResponse {
  id_str?: string;
  user?: {
    screen_name?: string;
  };
}

function buildOAuthHeader(options: OAuthHeaderOptions): string {
  const {
    method,
    url,
    token,
    tokenSecret = '',
    includeCallback = false,
    includeVerifier,
    params = {},
  } = options;

  const { apiKey, apiSecret, callbackUrl } = getXConfig();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };

  if (token) {
    oauthParams.oauth_token = token;
  }

  if (includeCallback) {
    oauthParams.oauth_callback = callbackUrl;
  }

  if (includeVerifier) {
    oauthParams.oauth_verifier = includeVerifier;
  }

  const signaturePayload: Record<string, string> = {
    ...oauthParams,
    ...params,
  };

  const signatureBaseString = Object.keys(signaturePayload)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(signaturePayload[key])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(signatureBaseString),
  ].join('&');

  const signingKey = `${percentEncode(apiSecret)}&${tokenSecret ? percentEncode(tokenSecret) : ''}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  if (includeVerifier) {
    headerParams.oauth_verifier = includeVerifier;
  }

  const header = 'OAuth ' + Object.keys(headerParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
    .join(', ');

  return header;
}

function storeRequestToken(token: string, secret: string) {
  REQUEST_TOKEN_STORE.set(token, { secret, createdAt: Date.now() });
}

function consumeRequestTokenSecret(token: string): string | null {
  const entry = REQUEST_TOKEN_STORE.get(token);
  if (!entry) {
    return null;
  }
  REQUEST_TOKEN_STORE.delete(token);
  if (Date.now() - entry.createdAt > REQUEST_TOKEN_TTL_MS) {
    return null;
  }
  return entry.secret;
}

function cleanupExpiredRequestTokens() {
  const now = Date.now();
  for (const [token, entry] of REQUEST_TOKEN_STORE.entries()) {
    if (now - entry.createdAt > REQUEST_TOKEN_TTL_MS) {
      REQUEST_TOKEN_STORE.delete(token);
    }
  }
}

function parseFormResponse(text: string): Record<string, string> {
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function extractImageData(cardDataUrl: string): {
  base64: string;
  size: number;
  mimeType: 'image/png' | 'image/jpeg';
} {
  const [prefix, base64] = cardDataUrl.split(',');
  const mimeMatch = prefix?.match(/^data:(image\/png|image\/jpeg)/);
  const mimeType = mimeMatch?.[1] as 'image/png' | 'image/jpeg' | undefined;

  if (!mimeType || !base64) {
    throw new Error('cardDataUrl must be a PNG or JPEG data URL');
  }

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new Error('cardDataUrl was empty');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Images must be 5MB or smaller for X uploads');
  }

  return { base64, size: buffer.length, mimeType };
}

function normalizeCaption(caption: string): { text: string; truncated: boolean } {
  const trimmed = caption.trim();
  if (!trimmed) {
    throw new Error('Caption is required to post on X');
  }
  if (trimmed.length <= 280) {
    return { text: trimmed, truncated: false };
  }
  return {
    text: `${trimmed.slice(0, 277)}...`,
    truncated: true,
  };
}

async function signedPost(
  url: string,
  params: Record<string, string>,
  token: string,
  tokenSecret: string,
) {
  const authorization = buildOAuthHeader({
    method: 'POST',
    url,
    token,
    tokenSecret,
    params,
  });

  const body = new URLSearchParams(params);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let details = await response.text();
    try {
      if (contentType.includes('application/json')) {
        const json = JSON.parse(details) as { errors?: XApiError[] };
        if (Array.isArray(json.errors) && json.errors.length) {
          details = json.errors
            .map((error) => error?.message)
            .filter((message): message is string => Boolean(message))
            .join(', ');
        }
      }
    } catch {
      // fallthrough
    }
    throw new Error(details || `X API request failed (${response.status})`);
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return parseFormResponse(text);
}

export async function requestXAuthToken() {
  cleanupExpiredRequestTokens();

  const url = `${TWITTER_API_BASE}/oauth/request_token`;
  const authorization = buildOAuthHeader({
    method: 'POST',
    url,
    includeCallback: true,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authorization },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Failed to contact X for request token');
  }

  const payload = parseFormResponse(text);
  if (payload.oauth_callback_confirmed !== 'true') {
    throw new Error('X did not confirm the callback URL');
  }

  const oauthToken = payload.oauth_token;
  const oauthTokenSecret = payload.oauth_token_secret;
  if (!oauthToken || !oauthTokenSecret) {
    throw new Error('X response did not include oauth_token or oauth_token_secret');
  }

  storeRequestToken(oauthToken, oauthTokenSecret);

  return {
    authUrl: `${TWITTER_API_BASE}/oauth/authenticate?oauth_token=${oauthToken}`,
    oauthToken,
  };
}

export async function exchangeXAccessToken(
  oauthToken: string,
  oauthVerifier: string,
): Promise<XAccessTokenPayload> {
  const tokenSecret = consumeRequestTokenSecret(oauthToken);
  if (!tokenSecret) {
    throw new Error('OAuth token expired or is unknown. Start the login flow again.');
  }

  const url = `${TWITTER_API_BASE}/oauth/access_token`;
  const authorization = buildOAuthHeader({
    method: 'POST',
    url,
    token: oauthToken,
    tokenSecret,
    includeVerifier: oauthVerifier,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authorization },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Failed to finalize X login');
  }

  const payload = parseFormResponse(text);
  const accessToken = payload.oauth_token;
  const accessTokenSecret = payload.oauth_token_secret;
  if (!accessToken || !accessTokenSecret) {
    throw new Error('X did not return access tokens');
  }

  return {
    oauthToken: accessToken,
    oauthTokenSecret: accessTokenSecret,
    screenName: payload.screen_name ?? '',
    userId: payload.user_id ?? '',
  };
}

async function uploadMediaToX(base64: string, token: string, tokenSecret: string) {
  const url = `${TWITTER_UPLOAD_BASE}/1.1/media/upload.json`;
  const json = await signedPost(
    url,
    { media_data: base64 },
    token,
    tokenSecret,
  );

  if (!json.media_id_string) {
    throw new Error('X failed to return a media_id');
  }

  return {
    mediaId: json.media_id_string as string,
  };
}

async function publishStatusToX(
  status: string,
  mediaId: string,
  token: string,
  tokenSecret: string,
): Promise<XStatusResponse> {
  const url = `${TWITTER_API_BASE}/1.1/statuses/update.json`;
  return signedPost(
    url,
    { status, media_ids: mediaId },
    token,
    tokenSecret,
  ) as Promise<XStatusResponse>;
}

export async function postTweetWithImage(payload: XPostTweetRequest): Promise<{
  tweetId: string;
  tweetUrl: string;
  truncated: boolean;
}> {
  const { base64 } = extractImageData(payload.cardDataUrl);
  const { text, truncated } = normalizeCaption(payload.caption);

  const media = await uploadMediaToX(base64, payload.oauthToken, payload.oauthTokenSecret);
  const statusResponse = await publishStatusToX(
    text,
    media.mediaId,
    payload.oauthToken,
    payload.oauthTokenSecret,
  );

  if (!statusResponse.id_str) {
    throw new Error('X did not return tweet metadata');
  }

  const screenName = statusResponse.user?.screen_name;

  return {
    tweetId: statusResponse.id_str,
    tweetUrl: screenName
      ? `https://x.com/${screenName}/status/${statusResponse.id_str}`
      : `https://x.com/i/web/status/${statusResponse.id_str}`,
    truncated,
  };
}
