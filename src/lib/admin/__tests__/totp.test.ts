import { afterEach, describe, expect, it, vi } from "vitest";
import {
  base32Decode,
  base32Encode,
  currentTotpStep,
  generateTotpSecret,
  openTotpSecret,
  sealTotpSecret,
  totpCode,
  totpUri,
  verifyTotp,
} from "@/lib/admin/totp";

// RFC 6238 Appendix B (SHA1 seed "12345678901234567890"); apps show the
// last 6 of the 8 digits listed there.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

afterEach(() => vi.unstubAllEnvs());

describe("TOTP", () => {
  it("matches the RFC 6238 test vectors", () => {
    expect(totpCode(RFC_SECRET, currentTotpStep(59_000))).toBe("287082");
    expect(totpCode(RFC_SECRET, currentTotpStep(1_111_111_109_000))).toBe("081804");
    expect(totpCode(RFC_SECRET, currentTotpStep(1_234_567_890_000))).toBe("005924");
    expect(totpCode(RFC_SECRET, currentTotpStep(2_000_000_000_000))).toBe("279037");
  });

  it("round-trips base32", () => {
    const bytes = Buffer.from([0, 1, 2, 250, 255, 7, 99]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
    expect(generateTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("accepts the current code and one step of clock drift, nothing older", () => {
    const now = 1_700_000_000_000;
    const step = currentTotpStep(now);
    expect(verifyTotp({ secretBase32: RFC_SECRET, code: totpCode(RFC_SECRET, step), now })).toBe(step);
    expect(verifyTotp({ secretBase32: RFC_SECRET, code: totpCode(RFC_SECRET, step - 1), now })).toBe(step - 1);
    expect(verifyTotp({ secretBase32: RFC_SECRET, code: totpCode(RFC_SECRET, step - 3), now })).toBeNull();
    expect(verifyTotp({ secretBase32: RFC_SECRET, code: "12345", now })).toBeNull();
  });

  it("never accepts the same code twice", () => {
    const now = 1_700_000_000_000;
    const step = currentTotpStep(now);
    const code = totpCode(RFC_SECRET, step);
    expect(verifyTotp({ secretBase32: RFC_SECRET, code, lastUsedStep: step, now })).toBeNull();
  });

  it("builds an otpauth link authenticator apps understand", () => {
    expect(totpUri({ secretBase32: "ABC", accountName: "a@b.c", issuer: "Klasiq" })).toBe(
      "otpauth://totp/Klasiq%3Aa%40b.c?secret=ABC&issuer=Klasiq&algorithm=SHA1&digits=6&period=30",
    );
  });
});

describe("TOTP secret storage", () => {
  it("encrypts with ADMIN_MFA_ENCRYPTION_KEY and refuses the wrong key", () => {
    vi.stubEnv("ADMIN_MFA_ENCRYPTION_KEY", "key-one");
    const sealed = sealTotpSecret("SECRETBASE32");
    expect(sealed.startsWith("enc:v1:")).toBe(true);
    expect(sealed).not.toContain("SECRETBASE32");
    expect(openTotpSecret(sealed)).toBe("SECRETBASE32");
    vi.stubEnv("ADMIN_MFA_ENCRYPTION_KEY", "key-two");
    expect(openTotpSecret(sealed)).toBeNull();
  });

  it("still works without a key", () => {
    vi.stubEnv("ADMIN_MFA_ENCRYPTION_KEY", "");
    expect(openTotpSecret(sealTotpSecret("SECRETBASE32"))).toBe("SECRETBASE32");
  });
});
