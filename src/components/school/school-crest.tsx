"use client";

import { useState } from "react";
import type { SchoolCardData } from "@/components/school/school-card";
import { cn } from "@/lib/utils";

const CREST_COLOURS = [
  "fill-[oklch(0.56_0.2_25)]",
  "fill-[oklch(0.42_0.16_25)]",
  "fill-[oklch(0.42_0.015_260)]",
  "fill-[oklch(0.32_0.015_260)]",
  "fill-[oklch(0.52_0.012_260)]",
];

/** "Children Sr. Sec. School" → "CS": first letters of the first two
 * words that aren't abbreviation dots. */
function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

function crestColour(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CREST_COLOURS[hash % CREST_COLOURS.length];
}

/** A school's crest: its logo when the shop has added one, otherwise a
 * shield with its initials in a colour of its own. */
export function SchoolCrest({ school, className }: { school: Pick<SchoolCardData, "name" | "logoUrl">; className?: string }) {
  const [logoFailed, setLogoFailed] = useState(false);
  if (school.logoUrl && !logoFailed) {
    return (
      <span className={cn("flex items-center justify-center overflow-hidden rounded-xl bg-card", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- school logos are small admin-provided URLs */}
        <img
          // The image can fail before hydration, when onError is not attached yet.
          ref={(node) => {
            if (node && node.complete && node.naturalWidth === 0) setLogoFailed(true);
          }}
          src={school.logoUrl}
          alt=""
          onError={() => setLogoFailed(true)}
          className="size-full object-contain"
        />
      </span>
    );
  }
  return (
    <svg viewBox="0 0 48 56" aria-hidden className={cn("shrink-0", className)}>
      <path d="M24 2 L45 9 V27 Q45 45 24 54 Q3 45 3 27 V9 Z" className={crestColour(school.name)} />
      <path d="M24 7 L40 12.5 V27 Q40 41 24 48.5 Q8 41 8 27 V12.5 Z" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        className="fill-white font-sans"
      >
        {initials(school.name)}
      </text>
    </svg>
  );
}
