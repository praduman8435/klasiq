import "dotenv/config";
import { vi } from "vitest";

// The suite creates and deletes real rows. .env may point at the live
// database, so refuse to run anywhere but a local one.
const databaseHost = new URL(process.env.DATABASE_URL ?? "postgresql://missing").hostname;
if (databaseHost !== "localhost" && databaseHost !== "127.0.0.1") {
  throw new Error(
    `Tests must run against a local database, but DATABASE_URL points at "${databaseHost}". ` +
      "Set DATABASE_URL (and DIRECT_URL) to your local Postgres before running npm test.",
  );
}

// Vitest doesn't understand the "react-server" export condition Next.js
// uses to swap "server-only" for a no-op in Server Component bundles — left
// unmocked, importing any server-only-marked module (e.g. src/server/
// geoapify.ts, src/lib/basket.ts) throws unconditionally in every test.
vi.mock("server-only", () => ({}));
