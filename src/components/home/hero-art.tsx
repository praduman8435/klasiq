import { cn } from "@/lib/utils";

/**
 * The homepage hero's drawing: a school shirt with a striped tie, a
 * school bag, a kurti and a school shoe, drawn flat in the brand colours
 * in black, red and grey for the red hero. Decorative only — the headline says what we sell.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 280" aria-hidden className={cn("h-auto", className)} fill="none">
      <defs>
        <pattern id="hero-tie-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="10" height="10" fill="oklch(0.16 0.02 260)" />
          <rect width="4" height="10" fill="oklch(0.56 0.2 25)" />
        </pattern>
      </defs>

      {/* backdrop */}
      <circle cx="190" cy="140" r="128" fill="white" fillOpacity="0.08" />
      <circle cx="190" cy="140" r="92" fill="white" fillOpacity="0.07" />

      {/* kurti, behind on the left */}
      <g transform="translate(18 58) rotate(-8)">
        <path
          d="M42 8 L62 8 Q66 22 76 22 Q86 22 90 8 L110 8 L136 36 L120 52 L112 44 L118 150 L34 150 L40 44 L32 52 L16 36 Z"
          fill="oklch(0.3 0.015 260)"
        />
        <path d="M62 8 Q66 30 76 30 Q86 30 90 8" stroke="oklch(0.85 0.01 260)" strokeWidth="4" />
        <path d="M40 122 H116" stroke="oklch(0.85 0.01 260)" strokeWidth="5" strokeDasharray="2 7" strokeLinecap="round" />
        <path d="M76 34 V100" stroke="oklch(0.42 0.015 260)" strokeWidth="2" />
      </g>

      {/* school bag, behind on the right */}
      <g transform="translate(214 70) rotate(7)">
        <path d="M30 18 Q30 0 52 0 Q74 0 74 18" stroke="oklch(0.25 0.015 260)" strokeWidth="7" strokeLinecap="round" />
        <rect x="4" y="14" width="96" height="128" rx="26" fill="oklch(0.6 0.012 260)" />
        <rect x="18" y="72" width="68" height="54" rx="14" fill="oklch(0.5 0.012 260)" />
        <rect x="18" y="86" width="68" height="4" fill="oklch(0.38 0.012 260)" />
        <circle cx="52" cy="46" r="7" fill="oklch(0.38 0.012 260)" />
      </g>

      {/* shadow under the shirt */}
      <ellipse cx="170" cy="256" rx="104" ry="10" fill="oklch(0.12 0.02 260)" fillOpacity="0.35" />

      {/* folded school shirt */}
      <g transform="translate(96 62)">
        <rect x="0" y="12" width="150" height="178" rx="16" fill="white" />
        <path d="M0 40 H150" stroke="oklch(0.9 0.005 260)" strokeWidth="2" />
        {/* collar */}
        <path d="M36 12 L75 12 L58 52 Z" fill="oklch(0.94 0.004 260)" stroke="oklch(0.84 0.008 260)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M114 12 L75 12 L92 52 Z" fill="oklch(0.94 0.004 260)" stroke="oklch(0.84 0.008 260)" strokeWidth="2" strokeLinejoin="round" />
        {/* tie */}
        <path d="M67 16 H83 L80 34 H70 Z" fill="oklch(0.16 0.02 260)" />
        <path d="M70 34 H80 L90 130 L75 150 L60 130 Z" fill="url(#hero-tie-stripes)" />
        {/* pocket with the school badge */}
        <rect x="100" y="70" width="34" height="34" rx="6" stroke="oklch(0.84 0.008 260)" strokeWidth="2" />
        <path d="M108 78 H126 V90 Q126 98 117 101 Q108 98 108 90 Z" fill="oklch(0.56 0.2 25)" />
        <path d="M113 87 L116 90 L121 84" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* buttons */}
        <circle cx="30" cy="100" r="3" fill="oklch(0.84 0.008 260)" />
        <circle cx="30" cy="140" r="3" fill="oklch(0.84 0.008 260)" />
      </g>

      {/* school shoe, in front */}
      <g transform="translate(42 206)">
        <path
          d="M6 36 Q4 8 34 6 L70 4 Q84 4 92 16 L128 26 Q146 31 144 44 L144 48 L6 48 Z"
          fill="oklch(0.16 0.02 260)"
        />
        <path d="M6 44 H144 V50 Q144 54 140 54 H10 Q6 54 6 50 Z" fill="oklch(0.1 0.015 260)" />
        <path d="M58 12 L80 20 M54 20 L76 27" stroke="white" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
        <path d="M22 16 Q30 12 40 12" stroke="white" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* little sparkles */}
      <path d="M298 40 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="white" fillOpacity="0.85" />
      <path d="M40 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="white" fillOpacity="0.7" />
    </svg>
  );
}
