import { randomInt } from "node:crypto";

// Crockford-ish alphabet with 0/O/1/I/L removed — a shop assistant reading
// this back over the phone shouldn't have to guess which letter someone said.
const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const SUFFIX_LENGTH = 5;

function randomSuffix(): string {
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    suffix += ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)];
  }
  return suffix;
}

function datePart(date: Date): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/**
 * Generates a human-friendly, WhatsApp/phone-readable order number like
 * ORD-20260804-K7M3P. Deliberately NOT derived from a "count + 1" — that
 * pattern silently breaks under concurrent inserts (two orders can read the
 * same count before either commits). Uniqueness is guaranteed by the
 * database's UNIQUE constraint on Order.orderNumber, not by this function:
 * the caller (place-order.ts) retries with a fresh call on a collision.
 * With a 30-character alphabet and 5 random characters, a same-day
 * collision needs >24 million orders before it becomes likely — the retry
 * loop exists to make even that safe, not because it's expected to fire.
 */
export function generateOrderNumber(date: Date): string {
  return `ORD-${datePart(date)}-${randomSuffix()}`;
}

const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{5}$/;

export function isValidOrderNumberFormat(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}
