import Link from "next/link";
import { getHeaderCategories } from "@/server/queries/categories";
import { CategoryNavLink } from "@/components/site/category-nav-link";
import { BRAND, STORE_CONTACT, getBackedByLine } from "@/lib/constants";

/**
 * Phase 3.6.7 Part 1 — the footer's "Shop" links reuse the EXACT same
 * `getHeaderCategories()` call the header nav uses (see
 * src/components/site/header.tsx), never a second, independent
 * category list — this is the one other place a hardcoded
 * `NAV_CATEGORIES` reference was found during this phase's audit.
 *
 * Phase 3.7 Part 7 (homepage redesign) — the dark-first theme on "/" is
 * applied once, at the `(site)` layout level, so this component just
 * uses semantic tokens as always.
 */
export async function SiteFooter({ storeName }: { storeName: string }) {
  const categories = await getHeaderCategories();

  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-base font-semibold">{storeName}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {BRAND.description}
            </p>
            <p className="mt-2 max-w-xs text-xs text-muted-foreground">
              {getBackedByLine()}
            </p>
            <p className="mt-2 max-w-xs text-xs text-muted-foreground">
              <a href={STORE_CONTACT.phoneHref} className="underline underline-offset-2 hover:text-foreground">
                {STORE_CONTACT.phone}
              </a>
              {" · "}
              <a
                href={STORE_CONTACT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Get Directions
              </a>
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Shop</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {categories.map((category) => (
                <li key={category.slug}>
                  <CategoryNavLink
                    slug={category.slug}
                    name={category.name}
                    className="transition-colors hover:text-foreground"
                    activeClassName="text-foreground font-medium"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Find your school
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Scan the QR code at your school, or{" "}
              <Link href="/" className="underline underline-offset-2">
                search for it here
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="mt-8 border-t pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {storeName}. All product names, sizes
          and prices shown for demo schools are illustrative.
        </p>
      </div>
    </footer>
  );
}
