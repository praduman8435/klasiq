import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").max(254).toLowerCase(),
  // Capped so a giant body can't be used to burn CPU in scrypt.
  password: z.string().min(1, "Password is required.").max(200),
  /** Authenticator-app code — only needed once two-step sign-in is on. */
  code: z.string().trim().max(10).optional(),
});
