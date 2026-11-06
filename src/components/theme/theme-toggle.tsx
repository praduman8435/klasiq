"use client";

import { useEffect } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_COLOR = { dark: "#0b0e14", light: "#ffffff" } as const;

/**
 * Header theme switch. The icon shown is the theme you'd switch TO, and
 * which one shows is decided by CSS (`light:` variant) rather than React
 * state, so the server-rendered, CDN-cached header never mismatches the
 * visitor's saved theme. Where the browser supports view transitions the
 * new theme opens as a circle from the button; otherwise (or with reduced
 * motion) it switches instantly.
 */
export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  // A visitor who saved "light" also gets a light browser top bar.
  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[resolvedTheme]);
    }
  }, [resolvedTheme]);

  function apply(next: "dark" | "light") {
    const root = document.documentElement;
    root.dataset.theme = next;
    root.style.colorScheme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
    setTheme(next);
  }

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const current = document.documentElement.dataset.theme === "light" ? "light" : (resolvedTheme ?? "dark");
    const next = current === "light" ? "dark" : "light";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || reduceMotion) {
      apply(next);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => {
      flushSync(() => apply(next));
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        compact && "size-11 px-0 sm:px-0",
        "group flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm",
        className,
      )}
    >
      <span className="relative size-5" aria-hidden>
        <Sun className="absolute inset-0 size-5 transition-transform duration-500 ease-out group-hover:rotate-45 light:hidden" />
        <Moon className="absolute inset-0 hidden size-5 transition-transform duration-500 ease-out group-hover:-rotate-12 light:block" />
      </span>
      <span className={cn("light:hidden", compact && "sr-only")}>Light</span>
      <span className={cn("hidden light:inline", compact && "sr-only")}>Dark</span>
      <span className="sr-only"> theme</span>
    </button>
  );
}
