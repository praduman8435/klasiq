/**
 * What a new admin password must meet. Length beats complexity rules
 * (NIST SP 800-63B): at least 12 characters, not a well-known password,
 * and not built from the admin's own email.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;
export const ADMIN_PASSWORD_MAX_LENGTH = 200;

const COMMON = new Set([
  "123456789012", "password1234", "passwordpassword", "qwertyuiop12", "qwerty123456", "111111111111",
  "123123123123", "iloveyou1234", "adminadmin12", "admin1234567", "administrator", "welcome12345",
  "letmein12345", "klasiq123456", "klasiqklasiq", "milan1234567", "shubham12345", "abcdefghijkl",
  "1234567890ab", "password@123", "Password@123", "india1234567", "000000000000",
]);

/** Null when acceptable, otherwise the reason (shown to the admin). */
export function adminPasswordProblem(password: string, email: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters — a short phrase is easiest to remember.`;
  }
  if (password.length > ADMIN_PASSWORD_MAX_LENGTH) return "That password is too long.";
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password) || /^(0123456789|1234567890)+/.test(password)) {
    return "That password is too common. Pick something only you would think of.";
  }
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && lower.includes(local)) return "Don't use your email name in your password.";
  return null;
}
