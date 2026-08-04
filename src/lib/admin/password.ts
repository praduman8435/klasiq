import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Password hashing via Node's built-in scrypt — a proven, memory-hard KDF
 * (OWASP-acceptable alongside bcrypt/argon2), with zero new dependencies.
 * Stored form is `salt:hash`, both hex-encoded. Never store or log a
 * plaintext password anywhere.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(plainPassword, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Constant-time comparison via timingSafeEqual — never a plain `===` on
 * derived key bytes, which would leak timing information about how many
 * leading bytes matched.
 */
export async function verifyPassword(params: {
  plainPassword: string;
  storedHash: string;
}): Promise<boolean> {
  const { plainPassword, storedHash } = params;
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(plainPassword, salt, expected.length)) as Buffer;

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
