"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, Loader2, School as SchoolIcon, Search } from "lucide-react";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SearchSuggestions } from "@/server/queries/search";

type SchoolResult = SearchSuggestions["schools"][number];

type MenuRect = { top: number; left: number; width: number };

type Option =
  | { kind: "category"; category: SearchSuggestions["categories"][number] }
  | { kind: "school"; school: SchoolResult }
  | { kind: "product"; product: SearchSuggestions["products"][number] }
  | { kind: "all"; query: string };

const EMPTY: SearchSuggestions = { categories: [], schools: [], products: [] };

function optionHref(option: Option): string {
  switch (option.kind) {
    case "category":
      return `/${option.category.slug}`;
    case "school":
      return `/school/${option.school.slug}`;
    case "product":
      return `/product/${option.product.slug}`;
    case "all":
      return `/search?q=${encodeURIComponent(option.query)}`;
  }
}

function optionKey(option: Option): string {
  switch (option.kind) {
    case "category":
      return `c-${option.category.slug}`;
    case "school":
      return `s-${option.school.slug}`;
    case "product":
      return `p-${option.product.slug}`;
    case "all":
      return "all";
  }
}

const GROUP_LABEL = { category: "Categories", school: "Schools", product: "Products" } as const;

/**
 * The storefront search box. With `withProducts` (the header) it suggests
 * everything as you type — categories, schools and products with their
 * price — and Enter searches the whole shop. Without it (the school
 * finder), it suggests schools only.
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
  const [results, setResults] = useState<SearchSuggestions>(EMPTY);
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
        const url = withProducts
          ? `/api/search/suggest?q=${encodeURIComponent(trimmed)}`
          : `/api/schools/search?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(
          withProducts ? (data as SearchSuggestions) : { ...EMPTY, schools: (data as { schools: SchoolResult[] }).schools },
        );
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults(EMPTY);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, withProducts]);

  const searched = trimmed.length >= 2;
  const options: Option[] = [
    ...(searched ? results.categories.map((category) => ({ kind: "category" as const, category })) : []),
    ...(searched ? results.schools.map((school) => ({ kind: "school" as const, school })) : []),
    ...(searched ? results.products.map((product) => ({ kind: "product" as const, product })) : []),
    ...(withProducts && trimmed ? [{ kind: "all" as const, query: trimmed }] : []),
  ];
  const nothingFound = searched && !isLoading && options.every((option) => option.kind === "all");
  const showDropdown = isOpen && (withProducts ? trimmed.length > 0 : searched);

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
    setResults(EMPTY);
    router.push(optionHref(option));
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
      if (withProducts && trimmed) return choose({ kind: "all", query: trimmed });
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

  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;

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
        aria-activedescendant={activeOption ? `${listId}-${optionKey(activeOption)}` : undefined}
        aria-label={withProducts ? "Search products, categories and schools" : "Search for your school"}
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
            setResults(EMPTY);
            setIsLoading(false);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? (withProducts ? "Search shirts, jeans, shoes, schools…" : "Type your school's name…")}
        className={cn(
          "w-full min-w-0 appearance-none text-foreground outline-none transition-[box-shadow,background-color,border-color] placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden",
          size === "hero" && "h-13 rounded-2xl border border-border bg-card pl-12 pr-4 text-base",
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
            className="fixed z-50 max-h-[min(28rem,65vh)] overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-popover py-1.5 shadow-[0_16px_40px_-12px_oklch(0_0_0/0.7)]"
          >
            {searched && isLoading && options.length <= 1 && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Searching…
              </li>
            )}
            {options.map((option, index) => {
              const previous = options[index - 1];
              const groupLabel = option.kind !== "all" && previous?.kind !== option.kind ? GROUP_LABEL[option.kind] : null;
              return (
                <SuggestionRow
                  key={optionKey(option)}
                  id={`${listId}-${optionKey(option)}`}
                  option={option}
                  active={index === activeIndex}
                  groupLabel={groupLabel}
                  divided={option.kind === "all" && index > 0}
                  onChoose={() => choose(option)}
                />
              );
            })}
            {nothingFound && (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                {withProducts
                  ? "No quick matches. Press Enter to search everything."
                  : "No school found with that name. Try a shorter part of the name, or call the store."}
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}

function SuggestionRow({
  id,
  option,
  active,
  groupLabel,
  divided,
  onChoose,
}: {
  id: string;
  option: Option;
  active: boolean;
  groupLabel: string | null;
  divided: boolean;
  onChoose: () => void;
}) {
  return (
    <>
      {groupLabel && (
        <li role="presentation" className="px-4 pb-1 pt-2.5 text-xs font-semibold text-muted-foreground">
          {groupLabel}
        </li>
      )}
      <li id={id} role="option" aria-selected={active} className={cn(divided && "mt-1 border-t border-border pt-1")}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onChoose}
          className={cn(
            "flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
            active ? "bg-secondary" : "hover:bg-muted",
          )}
        >
          <OptionBody option={option} />
        </button>
      </li>
    </>
  );
}

function OptionBody({ option }: { option: Option }) {
  switch (option.kind) {
    case "category": {
      const Icon = getCategoryIcon(option.category.slug, option.category.icon);
      return (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/85">
            {/* A fixed, module-level lucide icon picked by key, never a component defined during render. */}
            {/* eslint-disable-next-line react-hooks/static-components */}
            <Icon className="size-4.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{option.category.name}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </>
      );
    }
    case "school":
      return (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/85">
            <SchoolIcon className="size-4.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 font-medium">{option.school.name}</span>
            {option.school.city && <span className="block truncate text-xs text-muted-foreground">{option.school.city}</span>}
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </>
      );
    case "product":
      return (
        <>
          <ProductThumbnail
            imageUrl={option.product.imageUrl}
            alt=""
            categorySlug={option.product.category.slug}
            categoryIcon={option.product.category.icon}
            compact
            className="size-10 shrink-0 rounded-lg"
          />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 font-medium">{option.product.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {option.product.schoolName ?? option.product.category.name}
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold tabular-nums">{formatPaise(option.product.fromPriceInPaise)}</span>
        </>
      );
    case "all":
      return (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Search className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate">
            See all results for <span className="font-semibold">&ldquo;{option.query}&rdquo;</span>
          </span>
        </>
      );
  }
}
