"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  School as SchoolIcon,
  Shirt,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ADMIN_BRAND_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/server/actions/admin/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/schools", label: "Schools", icon: SchoolIcon, exact: false },
  { href: "/admin/products", label: "Products", icon: Shirt, exact: false },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { href: "/admin/categories", label: "Categories", icon: Tags, exact: false },
] as const;

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isNavActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    if (isPending) return;
    startTransition(async () => {
      await adminLogout();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2"
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden />
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-secondary/20 lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="border-b px-5 py-5">
          <p className="font-heading text-lg font-semibold">{ADMIN_BRAND_NAME}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{adminName}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="border-t p-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 [&_svg:not([class*='size-'])]:size-5"
                aria-label="Open admin menu"
              />
            }
          >
            <Menu aria-hidden />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs">
            <SheetHeader>
              <SheetTitle className="text-left font-heading">{ADMIN_BRAND_NAME}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <p className="text-sm text-muted-foreground">{adminName}</p>
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              <LogoutButton />
            </div>
          </SheetContent>
        </Sheet>
        <p className="font-heading text-base font-semibold">{ADMIN_BRAND_NAME}</p>
        <span className="size-11" aria-hidden />
      </header>

      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
