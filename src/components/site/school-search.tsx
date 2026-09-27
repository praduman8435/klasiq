"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, School as SchoolIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SchoolResult = {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
};

type MenuRect = { top: number; left: number; width: number };

type Option = { kind: "school"; school: SchoolResult } | { kind: "products"; query: string };

/**
 * The storefront search box. Schools always come first — typing two
 * letters of a school's name shows it — and with `withProducts` (the
 * header) the last row, and Enter, search the whole catalogue instead, so
 * one box finds both "Children Sr. Sec. School" and "black shoes".
 *
 * The dropdown portals to `document.body` and is positioned from the
 * input's live rect: rendered in-tree, it lost to later horizontally
 * scrolling rows (their own compositing layers) no matter the z-index.
 */
export function SchoolSearch({
  size = "hero",
  withProducts = false,
  placeholder,
  className,
  autoFocus = false,
  onNavigate,
}: {
  size?: "hero" | "compact" | "header";
  withProducts?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Called after a result is chosen (the menu drawer closes itself). */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { schools: SchoolResult[] };
        setResults(data.schools);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed]);

  const options: Option[] = [
    ...(trimmed.length >= 2 ? results.map((school) => ({ kind: "school" as const, school })) : []),
    ...(withProducts && trimmed ? [{ kind: "products" as const, query: trimmed }] : []),
  ];
  const showDropdown = isOpen && (withProducts ? trimmed.length > 0 : trimmed.length >= 2);

  useEffect(() => {
    if (!showDropdown) return;

    function updateRect() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [showDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choose(option: Option) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(option.kind === "school" ? `/school/${option.school.slug}` : `/search?q=${encodeURIComponent(option.query)}`);
    onNavigate?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = options[activeIndex];
      if (active) return choose(active);
      if (withProducts && trimmed) return choose({ kind: "products", query: trimmed });
      if (options.length === 1) return choose(options[0]);
      return;
    }
    if (!isOpen || options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    }
  }

  const schoolsSearched = trimmed.length >= 2 && !isLoading;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "hero" ? "left-4 size-5" : "left-3 size-4.5",
        )}
      />
      <input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={withProducts ? "Search for a school or a product" : "Search for your school"}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setIsOpen(true);
          setActiveIndex(-1);
          if (value.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? (withProducts ? "Search school, uniform, shoes…" : "Type your school's name…")}
        className={cn(
          "w-full min-w-0 appearance-none text-foreground outline-none transition-[box-shadow,background-color,border-color] placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden",
          size === "hero" && "h-13 rounded-2xl border border-border bg-card pl-12 pr-4 text-base shadow-[0_1px_2px_oklch(0.2_0.03_268/0.06)]",
          size === "compact" && "h-11 rounded-xl border border-border bg-card pl-10 pr-3 text-base",
          size === "header" &&
            "h-10 rounded-xl border border-transparent bg-muted pl-10 pr-3 text-base focus-visible:border-primary/40 focus-visible:bg-card",
        )}
      />

      {showDropdown &&
        menuRect &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label="Search suggestions"
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="fixed z-50 max-h-[min(24rem,60vh)] overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-popover py-1.5 shadow-[0_12px_32px_-8px_oklch(0.2_0.03_268/0.25)]"
          >
            {trimmed.length >= 2 && isLoading && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Finding schools…
              </li>
            )}
            {schoolsSearched && results.length > 0 && (
              <li role="presentation" className="px-4 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                Schools
              </li>
            )}
            {options.map((option, index) => (
              <li key={option.kind === "school" ? option.school.slug : "products"} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    index === activeIndex ? "bg-secondary" : "hover:bg-muted",
                    option.kind === "products" && results.length > 0 && "border-t border-border",
                  )}
                >
                  {option.kind === "school" ? (
                    <>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <SchoolIcon className="size-4.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-medium text-foreground">{option.school.name}</span>
                        {option.school.city && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.school.city}</span>
                        )}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </>
                  ) : (
                    <>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                        <Search className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        See products for <span className="font-semibold">&ldquo;{option.query}&rdquo;</span>
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
            {schoolsSearched && results.length === 0 && !withProducts && (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No school found with that name. Try a shorter part of the name, or call the store.
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
