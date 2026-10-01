"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  MapPin,
  Menu,
  PackageSearch,
  Palette,
  Phone,
  School as SchoolIcon,
  ShoppingBag,
  X,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandWordmark } from "@/components/site/brand-wordmark";
import { getCategoryIcon } from "@/lib/category-icons";
import { STORE_CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ROW =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring";

function RowIcon({ icon: Icon, active = false }: { icon: LucideIcon; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80",
      )}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden />
    </span>
  );
}

/**
 * The drawer behind the header's ☰, after the kirana shop's: deliberately
 * plain, the way a shopping app's menu is. The wordmark and a close button,
 * one list of categories (the current one in red), then schools, your
 * orders and khata, the bag, and how to reach the store.
 */
export function MobileNav({
  categories,
  bagCount,
  serviceableAreaNote,
}: {
  categories: { slug: string; name: string; icon: string | null }[];
  bagCount: number;
  serviceableAreaNote: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const onSchools = pathname === "/schools" || pathname.startsWith("/school/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="gap-0 overflow-y-auto overscroll-contain border-r-0 bg-card p-0 data-[side=left]:w-[88vw] data-[side=left]:max-w-xs"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <SheetTitle>
            <BrandWordmark />
          </SheetTitle>
          <SheetClose
            render={
              <button
                type="button"
                className="-mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
              />
            }
          >
            <X className="size-5" strokeWidth={2.25} aria-hidden />
            <span className="sr-only">Close menu</span>
          </SheetClose>
        </div>

        <nav aria-labelledby="drawer-categories-heading" className="px-2 pt-3">
          <h2 id="drawer-categories-heading" className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
            Categories
          </h2>
          <ul>
            {categories.map((category) => {
              const isCurrent = pathname === `/${category.slug}`;
              return (
                <li key={category.slug}>
                  <Link
                    href={`/${category.slug}`}
                    onClick={close}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(ROW, isCurrent && "bg-secondary")}
                  >
                    <RowIcon icon={getCategoryIcon(category.slug || category.name, category.icon)} active={isCurrent} />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-4 my-3 border-t border-border" />

        <ul className="px-2">
          <li>
            <Link
              href="/schools"
              onClick={close}
              aria-current={pathname === "/schools" ? "page" : undefined}
              className={cn(ROW, onSchools && "bg-secondary")}
            >
              <RowIcon icon={SchoolIcon} active={onSchools} />
              <span className="flex-1">Find your school</span>
            </Link>
          </li>
          <li>
            <Link
              href="/for-schools"
              onClick={close}
              aria-current={pathname.startsWith("/for-schools") ? "page" : undefined}
              className={cn(ROW, pathname.startsWith("/for-schools") && "bg-secondary")}
            >
              <RowIcon icon={Palette} active={pathname.startsWith("/for-schools")} />
              <span className="flex-1">For schools: design your uniform</span>
            </Link>
          </li>
          <li>
            <Link href="/track" onClick={close} className={ROW}>
              <RowIcon icon={PackageSearch} />
              <span className="flex-1">Track order</span>
            </Link>
          </li>
          <li>
            <Link href="/track/khata" onClick={close} className={ROW}>
              <RowIcon icon={BookOpen} />
              <span className="flex-1">Mera Khata</span>
            </Link>
          </li>
          <li>
            <Link href="/bag" onClick={close} className={ROW}>
              <RowIcon icon={ShoppingBag} />
              <span className="flex-1">
                Your bag
                <span className="sr-only">
                  {bagCount > 0 ? `, ${bagCount} item${bagCount === 1 ? "" : "s"}` : ", empty"}
                </span>
              </span>
              {bagCount > 0 && (
                <span
                  aria-hidden
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-primary-foreground"
                >
                  {bagCount > 99 ? "99+" : bagCount}
                </span>
              )}
            </Link>
          </li>
          <li>
            <a href={STORE_CONTACT.phoneHref} aria-label={`Call the store, ${STORE_CONTACT.phone}`} className={ROW}>
              <RowIcon icon={Phone} />
              <span className="flex-1">Call the store</span>
            </a>
          </li>
          <li>
            <a href={STORE_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className={ROW}>
              <RowIcon icon={MapPin} />
              <span className="flex-1">Get directions</span>
            </a>
          </li>
        </ul>

        <p className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 text-xs leading-relaxed text-muted-foreground">
          {serviceableAreaNote}
        </p>
      </SheetContent>
    </Sheet>
  );
}
