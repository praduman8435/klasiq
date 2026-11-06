import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Two-step sign-in for admins: standard TOTP (RFC 6238 — 6 digits,
 * 30-second steps, HMAC-SHA1), which every authenticator app speaks
 * (Google Authenticator, Microsoft Authenticator, Authy, 1Password...).
 * No dependency: it's ~20 lines of node:crypto.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
/** Accept the previous and next step too, for phone clocks a little off. */
const DRIFT_STEPS = 1;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A fresh 160-bit secret, base32 (what authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function currentTotpStep(now = Date.now()): number {
  return Math.floor(now / 1000 / STEP_SECONDS);
}

export function totpCode(secretBase32: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secretBase32)).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return binary.toString().padStart(DIGITS, "0");
}

/**
 * Returns the matching step (to store as "last used", so the same code
 * can never be replayed), or null. Only steps AFTER `lastUsedStep` count.
 */
export function verifyTotp(params: {
  secretBase32: string;
  code: string;
  lastUsedStep?: number | null;
  now?: number;
}): number | null {
  const code = params.code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const current = currentTotpStep(params.now);
  for (let step = current - DRIFT_STEPS; step <= current + DRIFT_STEPS; step++) {
    if (params.lastUsedStep != null && step <= params.lastUsedStep) continue;
    const expected = Buffer.from(totpCode(params.secretBase32, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

export function totpUri(params: { secretBase32: string; accountName: string; issuer: string }): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secretBase32,
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}

// --- Secret storage --------------------------------------------------------
//
// With ADMIN_MFA_ENCRYPTION_KEY set (any long random string — e.g.
// `openssl rand -base64 32`), secrets are stored AES-256-GCM encrypted, so
// a database dump alone can't mint codes. Without it they're stored as-is
// (still protected by RLS + database access), marked `plain:` so they keep
// working — and get encrypted the next time they're saved — once the key
// is added.

const ENC_PREFIX = "enc:v1:";
const PLAIN_PREFIX = "plain:";

function encryptionKey(): Buffer | null {
  const raw = process.env.ADMIN_MFA_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

export function sealTotpSecret(secretBase32: string): string {
  const key = encryptionKey();
  if (!key) return `${PLAIN_PREFIX}${secretBase32}`;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(secretBase32, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${Buffer.concat([iv, tag, data]).toString("base64url")}`;
}

/** Null when the stored value can't be read (e.g. the key was changed). */
export function openTotpSecret(stored: string): string | null {
  if (stored.startsWith(PLAIN_PREFIX)) return stored.slice(PLAIN_PREFIX.length);
  if (!stored.startsWith(ENC_PREFIX)) return null;
  const key = encryptionKey();
  if (!key) return null;
  try {
    const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
