"use client";

import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import { SchoolCard, type SchoolCardData } from "@/components/school/school-card";

/** Groups only once there are enough schools for letters to help. */
const GROUP_FROM = 12;

/** The full school list with an instant filter — every school is on the
 * page already, so typing narrows it without waiting on the network. */
export function SchoolDirectory({ schools }: { schools: (SchoolCardData & { id: string })[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const needle = deferred.trim().toLowerCase();
  const visible = needle
    ? schools.filter((s) => s.name.toLowerCase().includes(needle) || s.city?.toLowerCase().includes(needle))
    : schools;

  const groups =
    !needle && schools.length >= GROUP_FROM
      ? Object.entries(
          visible.reduce<Record<string, typeof visible>>((acc, school) => {
            const letter = /[a-z]/i.test(school.name[0] ?? "") ? school.name[0]!.toUpperCase() : "#";
            (acc[letter] ??= []).push(school);
            return acc;
          }, {}),
        ).sort(([a], [b]) => a.localeCompare(b))
      : [["", visible] as const];

  return (
    <div className="mt-5">
      <label className="relative block">
        <span className="sr-only">Filter schools by name or town</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your school's name…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-13 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {needle
          ? `${visible.length} ${visible.length === 1 ? "school" : "schools"} found`
          : `${schools.length} ${schools.length === 1 ? "school" : "schools"}`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-muted px-4 py-5 text-sm text-muted-foreground">
          No school matches &ldquo;{query.trim()}&rdquo;. Try a shorter part of the name.
        </p>
      ) : (
        groups.map(([letter, list]) => (
          <section key={letter || "all"} aria-label={letter ? `Schools starting with ${letter}` : undefined} className="mt-3">
            {letter && <h2 className="sticky top-28 z-10 bg-background py-2 text-sm font-bold text-muted-foreground md:top-16">{letter}</h2>}
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {list.map((school) => (
                <li key={school.id}>
                  <SchoolCard school={school} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
