/**
 * The application's public base URL. The production domain has not been
 * finalized — nothing in this codebase should hard-code an assumed domain
 * (e.g. a guessed "klasiq.in"/"klasiq.com"). Set SITE_URL once it's known
 * (deployment config, not committed here) and every consumer — metadata,
 * sitemap, robots.txt, and Phase 4's QR code generation — picks it up
 * automatically. Falls back to localhost so local development keeps
 * working with zero configuration.
 */
function resolveSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  // On Vercel, fall back to the project's production domain (set by the
  // platform at build and run time) so sitemap/robots/links are never
  // pointed at localhost on a live deployment that forgot SITE_URL.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
