/**
 * Minimal signed-session helper for the single-password auth gate.
 *
 * We don't have user accounts, so there's nothing to look up in a database —
 * the "session" is just an expiry timestamp signed with SESSION_SECRET so it
 * can't be forged or tampered with. Verification works the same way on the
 * Edge runtime (middleware) and the Node runtime (server actions), since it
 * only relies on the standard Web Crypto API.
 */

const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function createSessionToken(
  secret: string,
  ttlSeconds: number = THIRTY_DAYS_SECONDS
): Promise<string> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = String(expiresAt);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const key = await getKey(secret);
  const expectedSignature = toHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  );

  return timingSafeEqual(expectedSignature, signature);
}

export const SESSION_COOKIE_NAME = "daily_tracker_session";
export const SESSION_MAX_AGE = THIRTY_DAYS_SECONDS;
