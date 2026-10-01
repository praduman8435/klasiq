import type { DesignPartKey, DesignSample } from "@/lib/uniform-design";
import { DEFAULT_PART_COLOUR } from "@/lib/uniform-design";
import { cn } from "@/lib/utils";

export type ChosenParts = Partial<Record<DesignPartKey, DesignSample>>;

const SKIN = "#c68d6a";
const SKIN_SHADE = "#a8714f";
const HAIR = "#1f1a17";
const SHOE = "#15171c";
const LINE = "rgba(0,0,0,0.22)";

/** The fill for one part: its sample's colour, or a check/stripe pattern
 * drawn from its two colours, or the part's default colour. */
function partFill(key: DesignPartKey, part: DesignSample | undefined, idPrefix: string) {
  if (!part || part.pattern === "PLAIN") return part?.colourHex ?? DEFAULT_PART_COLOUR[key];
  return `url(#${idPrefix}-${key})`;
}

function PatternDefs({ parts, idPrefix }: { parts: ChosenParts; idPrefix: string }) {
  return (
    <defs>
      {(Object.entries(parts) as [DesignPartKey, DesignSample | undefined][]).map(([key, part]) => {
        if (!part || part.pattern === "PLAIN") return null;
        const accent = part.accentHex ?? "#000000";
        const accentOpacity = part.accentHex ? 0.75 : 0.3;
        const id = `${idPrefix}-${key}`;
        if (part.pattern === "CHECK") {
          return (
            <pattern key={key} id={id} width="14" height="14" patternUnits="userSpaceOnUse">
              <rect width="14" height="14" fill={part.colourHex} />
              <rect y="5" width="14" height="4" fill={accent} opacity={accentOpacity * 0.7} />
              <rect x="5" width="4" height="14" fill={accent} opacity={accentOpacity * 0.7} />
              <rect y="6.5" width="14" height="1" fill={accent} opacity={accentOpacity} />
              <rect x="6.5" width="1" height="14" fill={accent} opacity={accentOpacity} />
            </pattern>
          );
        }
        return (
          <pattern
            key={key}
            id={id}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform={key === "tie" ? "rotate(40)" : undefined}
          >
            <rect width="10" height="10" fill={part.colourHex} />
            <rect width="3.5" height="10" fill={accent} opacity={accentOpacity} />
          </pattern>
        );
      })}
    </defs>
  );
}

/**
 * A boy and a girl in the chosen uniform, drawn flat. Pure SVG with no
 * hooks, so the designer and the admin enquiry page share it; `idPrefix`
 * keeps pattern ids unique when two previews are on one page.
 */
export function UniformPreview({
  parts,
  idPrefix,
  className,
}: {
  parts: ChosenParts;
  idPrefix: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <Figure parts={parts} idPrefix={`${idPrefix}-b`} girl={false} />
      <Figure parts={parts} idPrefix={`${idPrefix}-g`} girl />
    </div>
  );
}

function Figure({ parts, idPrefix, girl }: { parts: ChosenParts; idPrefix: string; girl: boolean }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], idPrefix);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const longSleeves = hasSweater || hasBlazer;
  const outerFill = hasBlazer ? fill("blazer") : fill("sweater");

  return (
    <svg viewBox="0 0 200 400" role="img" aria-label={girl ? "Girl in the chosen uniform" : "Boy in the chosen uniform"} className="h-auto w-full">
      <PatternDefs parts={parts} idPrefix={idPrefix} />
      <ellipse cx="100" cy="386" rx="66" ry="7" fill="rgba(0,0,0,0.3)" />

      {/* hair behind the head (girl's plaits) */}
      {girl && (
        <>
          <circle cx="68" cy="66" r="11" fill={HAIR} />
          <circle cx="132" cy="66" r="11" fill={HAIR} />
          <path d="M66 74 L60 104 L72 100 Z" fill={HAIR} />
          <path d="M134 74 L140 104 L128 100 Z" fill={HAIR} />
        </>
      )}

      {/* arms (covered by long sleeves when there's a sweater or blazer) */}
      <path d="M44 128 L36 212 Q36 220 44 220 L50 220 L56 140 Z" fill={SKIN} />
      <path d="M156 128 L164 212 Q164 220 156 220 L150 220 L144 140 Z" fill={SKIN} />
      <circle cx="43" cy="222" r="8" fill={SKIN} />
      <circle cx="157" cy="222" r="8" fill={SKIN} />

      {/* legs */}
      {girl ? (
        <>
          <rect x="70" y="290" width="14" height="70" fill={SKIN} />
          <rect x="116" y="290" width="14" height="70" fill={SKIN} />
          <rect x="69" y="326" width="16" height="36" rx="2" fill={fill("socks")} />
          <rect x="115" y="326" width="16" height="36" rx="2" fill={fill("socks")} />
          <path d="M64 360 H88 V368 Q88 375 81 375 H59 Q54 375 57 368 Z" fill={SHOE} />
          <path d="M112 360 H136 L143 368 Q146 375 141 375 H119 Q112 375 112 368 Z" fill={SHOE} />
        </>
      ) : (
        <>
          <path d="M56 208 L144 208 L140 364 L106 364 L100 250 L94 364 L60 364 Z" fill={fill("pant")} />
          <path d="M78 214 L76 362 M122 214 L124 362" stroke={LINE} strokeWidth="1.5" fill="none" />
          <rect x="62" y="356" width="32" height="8" fill={fill("socks")} />
          <rect x="106" y="356" width="32" height="8" fill={fill("socks")} />
          <path d="M58 364 H96 V371 Q96 379 88 379 H52 Q47 379 50 372 Z" fill={SHOE} />
          <path d="M104 364 H142 L150 372 Q153 379 148 379 H112 Q104 379 104 371 Z" fill={SHOE} />
        </>
      )}

      {/* shirt */}
      <path d="M62 88 Q100 80 138 88 L146 150 L144 210 L56 210 L54 150 Z" fill={fill("shirt")} />
      <path d="M62 88 L40 128 L56 140 L66 116 Z" fill={fill("shirt")} />
      <path d="M138 88 L160 128 L144 140 L134 116 Z" fill={fill("shirt")} />
      <path d="M100 100 V208" stroke={LINE} strokeWidth="1.5" />
      <rect x="116" y="118" width="16" height="16" rx="2" fill="none" stroke={LINE} strokeWidth="1.5" />
      <path d="M86 84 L100 100 L82 103 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M114 84 L100 100 L118 103 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />

      {/* skirt goes over the shirt's hem */}
      {girl && (
        <>
          <path d="M58 202 L142 202 L160 296 L40 296 Z" fill={fill("skirt")} />
          <path d="M80 204 L71 294 M100 204 L100 294 M120 204 L129 294" stroke={LINE} strokeWidth="1.5" />
        </>
      )}

      {/* tie */}
      {parts.tie && (
        <>
          <path d="M95 98 H105 L103 108 H97 Z" fill={fill("tie")} />
          <path d="M97 108 H103 L110 166 L100 178 L90 166 Z" fill={fill("tie")} />
        </>
      )}

      {/* belt */}
      {parts.belt && (
        <>
          <rect x="56" y={girl ? 198 : 202} width="88" height="8" fill={fill("belt")} />
          <rect x="94" y={girl ? 197 : 201} width="12" height="10" rx="1.5" fill="#c9ccd4" />
        </>
      )}

      {/* sweater (V-neck); under a blazer it shows in the blazer's V */}
      {hasSweater && (
        <>
          <path d="M62 90 L88 90 L100 130 L112 90 L138 90 L146 150 L144 210 L56 210 L54 150 Z" fill={fill("sweater")} />
          <rect x="56" y="200" width="88" height="10" fill="rgba(0,0,0,0.18)" />
        </>
      )}

      {/* blazer */}
      {hasBlazer && (
        <>
          <path d="M62 88 L92 96 L100 152 L100 214 L54 214 L54 150 Z" fill={fill("blazer")} />
          <path d="M138 88 L108 96 L100 152 L100 214 L146 214 L146 150 Z" fill={fill("blazer")} />
          <path d="M86 86 L99 132 L82 114 Z" fill="rgba(0,0,0,0.22)" />
          <path d="M114 86 L101 132 L118 114 Z" fill="rgba(0,0,0,0.22)" />
          <path d="M100 152 V214" stroke={LINE} strokeWidth="1.5" />
          <circle cx="104" cy="168" r="2.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="104" cy="188" r="2.5" fill="rgba(255,255,255,0.7)" />
          <path d="M66 122 H84 V136 Q75 142 66 136 Z" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
        </>
      )}

      {/* long sleeves */}
      {longSleeves && (
        <>
          <path d="M62 90 L40 130 L35 212 L52 214 L58 142 Z" fill={outerFill} />
          <path d="M138 90 L160 130 L165 212 L148 214 L142 142 Z" fill={outerFill} />
        </>
      )}

      {/* head */}
      <rect x="92" y="72" width="16" height="16" fill={SKIN_SHADE} />
      <circle cx="100" cy="50" r="26" fill={SKIN} />
      {girl ? (
        <path d="M73 54 Q70 20 100 20 Q130 20 127 54 Q124 34 104 32 Q92 40 76 40 Q74 46 73 54Z" fill={HAIR} />
      ) : (
        <path d="M74 50 Q73 21 100 21 Q127 21 126 50 Q121 34 100 34 Q81 34 74 50Z" fill={HAIR} />
      )}
      <circle cx="91" cy="52" r="2.4" fill={HAIR} />
      <circle cx="109" cy="52" r="2.4" fill={HAIR} />
      <path d="M93 62 Q100 67 107 62" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A sample's swatch: its photo, or a square painted in its colour and
 * pattern when there's no photo yet. */
export function SampleSwatch({ sample, className }: { sample: DesignSample; className?: string }) {
  if (sample.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an admin-uploaded photo from our own photo store
      <img src={sample.photoUrl} alt="" className={cn("object-cover", className)} />
    );
  }
  const id = `swatch-${sample.id}`;
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className} preserveAspectRatio="xMidYMid slice">
      <PatternDefs parts={{ shirt: sample }} idPrefix={id} />
      <rect width="40" height="40" fill={partFill("shirt", sample, id)} />
    </svg>
  );
}
