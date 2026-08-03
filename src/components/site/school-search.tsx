"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, School as SchoolIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SchoolResult = {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
};

export function SchoolSearch({
  size = "hero",
  placeholder = "Search your school...",
  className,
}: {
  size?: "hero" | "compact";
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // Nothing to fetch — the change handler already cleared results.
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/schools/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { schools: SchoolResult[] };
        setResults(data.schools);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSchool(school: SchoolResult) {
    setIsOpen(false);
    setQuery("");
    router.push(`/school/${school.slug}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        selectSchool(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            size === "hero" ? "left-4 size-5" : "left-3 size-4",
          )}
        />
        <Input
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-label="Search for your school"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setIsOpen(true);
            if (value.trim().length < 2) {
              setResults([]);
              setIsLoading(false);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-full border-2 bg-card shadow-sm",
            size === "hero"
              ? "h-14 pl-12 pr-4 text-base sm:h-16 sm:text-lg"
              : "h-9 pl-9 pr-3 text-sm",
          )}
        />
      </div>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border bg-popover shadow-lg"
        >
          {isLoading && (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching schools...
            </li>
          )}
          {!isLoading && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No schools found. You can still browse{" "}
              <a href="/uniforms" className="underline underline-offset-2">
                generic uniform essentials
              </a>
              .
            </li>
          )}
          {!isLoading &&
            results.map((school, index) => (
              <li key={school.slug} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSchool(school)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                    index === activeIndex ? "bg-muted" : "hover:bg-muted",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <SchoolIcon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {school.name}
                    </span>
                    {school.city && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {school.city}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
