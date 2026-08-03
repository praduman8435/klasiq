"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SchoolSearch } from "@/components/site/school-search";
import { NAV_CATEGORIES } from "@/server/queries/categories";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:hidden [&_svg:not([class*='size-'])]:size-5"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-left font-heading">Browse</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <SchoolSearch size="compact" />
          <nav aria-label="Categories" className="flex flex-col gap-1">
            {NAV_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/${category.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
              >
                {category.label}
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
