import Link from "next/link";
import { MapPin, PackageSearch, Phone, School as SchoolIcon } from "lucide-react";
import { BrandWordmark } from "@/components/site/brand-wordmark";
import { BRAND, STORE_CONTACT, getBackedByLine } from "@/lib/constants";

const ROW =
  "inline-flex min-h-11 items-center gap-2.5 rounded-lg text-sm font-semibold transition-colors hover:text-deal focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring";

const ICON_TILE = "flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-deal";

/**
 * A quiet close (after the kirana shop's footer): the store's name and
 * line, then the few things people need — call, directions, track an
 * order, find a school. Contact details come only from `STORE_CONTACT`.
 * Search lives in the sticky header, so it isn't repeated here.
 */
export function SiteFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1.4fr_1fr] sm:px-6 sm:py-10">
        <div>
          <BrandWordmark />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{BRAND.description}</p>
          <p className="mt-2 max-w-sm text-xs text-muted-foreground">{getBackedByLine()}</p>
        </div>

        <ul className="flex flex-col">
          <li>
            <a href={STORE_CONTACT.phoneHref} aria-label={`Call ${storeName} at ${STORE_CONTACT.phone}`} className={ROW}>
              <span className={ICON_TILE}>
                <Phone className="size-4" aria-hidden />
              </span>
              <span className="tabular-nums">{STORE_CONTACT.phone}</span>
            </a>
          </li>
          <li>
            <a
              href={STORE_CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Get directions to ${storeName} (opens in a new tab)`}
              className={ROW}
            >
              <span className={ICON_TILE}>
                <MapPin className="size-4" aria-hidden />
              </span>
              Get directions
            </a>
          </li>
          <li>
            <Link href="/track" className={ROW}>
              <span className={ICON_TILE}>
                <PackageSearch className="size-4" aria-hidden />
              </span>
              Track an order
            </Link>
          </li>
          <li>
            <Link href="/schools" className={ROW}>
              <span className={ICON_TILE}>
                <SchoolIcon className="size-4" aria-hidden />
              </span>
              Find your school
            </Link>
          </li>
        </ul>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-6 text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </p>
    </footer>
  );
}
