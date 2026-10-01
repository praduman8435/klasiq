import type { DesignPartKey, DesignSample } from "@/lib/uniform-design";
import { DEFAULT_PART_COLOUR } from "@/lib/uniform-design";
import { cn } from "@/lib/utils";

export type ChosenParts = Partial<Record<DesignPartKey, DesignSample>>;
export type PreviewView = "both" | "boy" | "girl";

const HAIR = "#211813";
const SHOE = "#121318";
const LINE = "rgba(0,0,0,0.28)";
const SOFT_LINE = "rgba(0,0,0,0.16)";
const MIRROR = "matrix(-1 0 0 1 240 0)";
/** The girl's shoulders and arms are the boy's upper body, slimmed. */
const SLIM = "matrix(0.92 0 0 1 9.6 0)";

/** The fill for one part: its sample's colour, a check/stripe pattern
 * from its two colours, or the part's default colour. */
function partFill(key: DesignPartKey, part: DesignSample | undefined, idPrefix: string) {
  if (!part || part.pattern === "PLAIN") return part?.colourHex ?? DEFAULT_PART_COLOUR[key];
  return `url(#${idPrefix}-${key})`;
}

function FabricPatterns({ parts, idPrefix, scale = 1 }: { parts: ChosenParts; idPrefix: string; scale?: number }) {
  return (
    <>
      {(Object.entries(parts) as [DesignPartKey, DesignSample | undefined][]).map(([key, part]) => {
        if (!part || part.pattern === "PLAIN") return null;
        const accent = part.accentHex ?? "#000000";
        const strength = part.accentHex ? 0.78 : 0.3;
        const id = `${idPrefix}-${key}`;
        if (part.pattern === "CHECK") {
          const s = 16 * scale;
          return (
            <pattern key={key} id={id} width={s} height={s} patternUnits="userSpaceOnUse">
              <rect width={s} height={s} fill={part.colourHex} />
              <rect y={s * 0.36} width={s} height={s * 0.28} fill={accent} opacity={strength * 0.55} />
              <rect x={s * 0.36} width={s * 0.28} height={s} fill={accent} opacity={strength * 0.55} />
              <rect y={s * 0.47} width={s} height={s * 0.06} fill={accent} opacity={strength} />
              <rect x={s * 0.47} width={s * 0.06} height={s} fill={accent} opacity={strength} />
            </pattern>
          );
        }
        const s = 10 * scale;
        return (
          <pattern
            key={key}
            id={id}
            width={s}
            height={s}
            patternUnits="userSpaceOnUse"
            patternTransform={key === "tie" ? "rotate(38)" : undefined}
          >
            <rect width={s} height={s} fill={part.colourHex} />
            <rect width={s * 0.34} height={s} fill={accent} opacity={strength} />
          </pattern>
        );
      })}
    </>
  );
}

/** Gradients shared by one figure: skin, side shading that gives cloth
 * its volume, a soft top light, hair and the buckle's metal. */
function FigureDefs({ p, parts }: { p: string; parts: ChosenParts }) {
  return (
    <defs>
      <FabricPatterns parts={parts} idPrefix={p} />
      <linearGradient id={`${p}-skin`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#a86f4d" />
        <stop offset="0.45" stopColor="#c99270" />
        <stop offset="1" stopColor="#a46b49" />
      </linearGradient>
      <linearGradient id={`${p}-shade`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.34" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0.05" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id={`${p}-light`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id={`${p}-hair`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#3b2a21" />
        <stop offset="1" stopColor={HAIR} />
      </linearGradient>
      <linearGradient id={`${p}-metal`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#eef0f3" />
        <stop offset="0.5" stopColor="#a7adb7" />
        <stop offset="1" stopColor="#d9dde3" />
      </linearGradient>
      <linearGradient id={`${p}-shoe`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#2a2d35" />
        <stop offset="1" stopColor={SHOE} />
      </linearGradient>
      <pattern id={`${p}-rib`} width="3" height="6" patternUnits="userSpaceOnUse">
        <rect width="1.2" height="6" fill="#000" opacity="0.18" />
      </pattern>
    </defs>
  );
}

/** A piece of cloth: its colour, then side shading and a soft top light. */
function Cloth({ d, fill, p, light = true }: { d: string; fill: string; p: string; light?: boolean }) {
  return (
    <>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${p}-shade)`} />
      {light && <path d={d} fill={`url(#${p}-light)`} />}
    </>
  );
}

// ---- shared shapes (left half; the right half is mirrored) ----------------
const ARM = "M60 140 C52 170 50 210 49 250 C48 285 48 315 50 336 L65 337 C66 315 68 286 70 252 C72 214 75 178 80 150 Z";
const HAND = "M49 333 C45 345 45 361 50 369 C55 376 64 373 66 363 C67 355 66 345 65 334 Z";
const EAR = "M88 60 C82 57 79 67 82 74 C84 78 87 79 89 76 Z";
const NECK = "M108 92 L108 116 C114 121 126 121 132 116 L132 92 Z";
const FACE = "M120 26 C140 26 152 42 152 62 C152 82 142 97 120 102 C98 97 88 82 88 62 C88 42 100 26 120 26 Z";

const SHIRT =
  "M86 116 C98 110 110 109 120 111 C130 109 142 110 154 116 L176 124 C183 128 186 136 187 146 L191 204 L171 210 L166 176 L165 270 L75 270 L74 176 L69 210 L49 204 L53 146 C54 136 57 128 64 124 Z";
const COLLAR = "M120 123 L106 107 L93 116 C95 126 99 135 104 143 Z";
const COLLAR_BAND = "M105 104 C112 111 128 111 135 104 L137 114 C128 121 112 121 103 114 Z";
const POCKET = "M134 150 L156 150 L156 174 C150 177 140 177 134 174 Z";
const TIE_KNOT = "M113 115 L127 115 L125 132 L115 132 Z";
const TIE_BLADE = "M115 132 L125 132 L134 232 L120 250 L106 232 Z";

const SWEATER =
  "M86 117 L106 115 L120 184 L134 115 L154 117 L176 126 C183 130 186 138 187 148 L195 330 L174 336 L166 182 L165 278 L75 278 L74 182 L66 336 L45 330 L53 148 C54 138 57 130 64 126 Z";

const BLAZER_PANEL = "M86 113 L104 111 L114 188 L120 197 L120 304 L71 306 C70 262 70 222 72 183 C66 161 63 141 64 126 Z";
const BLAZER_SLEEVE = "M64 126 C56 132 53 146 53 162 L46 336 L68 340 L74 186 C72 160 70 140 64 126 Z";
const LAPEL = "M104 111 L95 124 L103 146 L96 153 L114 188 Z";
const BADGE = "M138 140 L153 140 L153 152 C153 158 149 162 145.5 163.5 C142 162 138 158 138 152 Z";

function Head({ p, girl }: { p: string; girl: boolean }) {
  return (
    <>
      {girl && (
        <path
          d="M84 70 C78 36 98 16 120 16 C142 16 162 36 156 70 L159 118 C155 126 148 127 145 121 L146 78 C138 60 102 60 94 78 L95 121 C92 127 85 126 81 118 Z"
          fill={`url(#${p}-hair)`}
        />
      )}
      <path d={NECK} fill={`url(#${p}-skin)`} />
      <path d="M108 104 C114 110 126 110 132 104 L132 112 C126 117 114 117 108 112 Z" fill="rgba(0,0,0,0.18)" />
      <path d={EAR} fill="#b57c59" />
      <path d={EAR} fill="#b57c59" transform={MIRROR} />
      <path d={FACE} fill={`url(#${p}-skin)`} />
      {/* cheek warmth and jaw shadow */}
      <ellipse cx="103" cy="78" rx="7" ry="4.5" fill="#c97b68" opacity="0.22" />
      <ellipse cx="137" cy="78" rx="7" ry="4.5" fill="#c97b68" opacity="0.22" />
      <path d="M96 88 C104 98 136 98 144 88 C138 99 128 103 120 103 C112 103 102 99 96 88 Z" fill="rgba(0,0,0,0.1)" />

      {girl ? (
        <path
          d="M88 62 C87 36 102 21 120 21 C138 21 153 36 152 62 C149 47 140 37 124 35 L120 26 L116 35 C100 37 91 47 88 62 Z"
          fill={`url(#${p}-hair)`}
        />
      ) : (
        <path
          d="M86 64 C82 36 98 18 122 18 C146 18 160 34 155 64 C153 54 150 46 144 41 C133 46 112 45 97 38 C92 44 88 53 86 64 Z"
          fill={`url(#${p}-hair)`}
        />
      )}
      {!girl && <path d="M100 30 C112 26 132 26 146 34" stroke="#fff" strokeOpacity="0.08" strokeWidth="3" fill="none" />}

      {/* brows, eyes, nose, mouth — quiet, not cartoon */}
      <path d="M100 54 C104 51 109 50.5 113 52.5" stroke={HAIR} strokeWidth={girl ? 1.8 : 2.4} strokeLinecap="round" fill="none" />
      <path d="M127 52.5 C131 50.5 136 51 140 54" stroke={HAIR} strokeWidth={girl ? 1.8 : 2.4} strokeLinecap="round" fill="none" />
      <path d="M101 62 C104 59 109 59 112 62 C109 64.6 104 64.6 101 62 Z" fill="#2a1f1a" />
      <path d="M128 62 C131 59 136 59 139 62 C136 64.6 131 64.6 128 62 Z" fill="#2a1f1a" />
      <circle cx="107.6" cy="61.4" r="0.9" fill="#fff" opacity="0.7" />
      <circle cx="134.6" cy="61.4" r="0.9" fill="#fff" opacity="0.7" />
      <path d="M120 65 C119 70 117 75 116 78.5 C118.5 80.5 122 80.5 124.5 78.5" stroke="#8f5a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M112 87 C116 89.5 124 89.5 128 87" stroke={girl ? "#9a4e45" : "#8b4a3b"} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M114.5 90.5 C118 92.3 122 92.3 125.5 90.5" stroke="rgba(0,0,0,0.14)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  );
}

/** One plait falling in front of the shoulder: a woven rope of
 * crossing strands, tied with a ribbon bow near the end. */
function Plait({ mirror = false }: { mirror?: boolean }) {
  const links = Array.from({ length: 8 }, (_, i) => i);
  return (
    <g transform={mirror ? MIRROR : undefined}>
      <path d="M95 96 C92 130 91 170 92 204" stroke={HAIR} strokeWidth="11" strokeLinecap="round" fill="none" />
      {links.map((i) => {
        const cy = 106 + i * 12.5;
        const lean = i % 2 === 0 ? -32 : 32;
        return (
          <g key={i} transform={`rotate(${lean} ${93.5 - i * 0.2} ${cy})`}>
            <ellipse cx={93.5 - i * 0.2} cy={cy} rx="4.6" ry="8" fill={i % 2 === 0 ? "#30221b" : "#271c16"} />
            <path
              d={`M${91.5 - i * 0.2} ${cy - 5} C${93 - i * 0.2} ${cy - 2} ${93 - i * 0.2} ${cy + 2} ${91.5 - i * 0.2} ${cy + 5}`}
              stroke="#fff"
              strokeOpacity="0.1"
              strokeWidth="1"
              fill="none"
            />
          </g>
        );
      })}
      {/* ribbon bow */}
      <ellipse cx="86" cy="208" rx="7" ry="4" fill="#f2f3f5" transform="rotate(-22 86 208)" />
      <ellipse cx="99" cy="208" rx="7" ry="4" fill="#e6e8ec" transform="rotate(22 99 208)" />
      <path d="M90 210 L86 222 L91 219 Z M95 210 L99 222 L94 219 Z" fill="#dfe2e7" />
      <circle cx="92.5" cy="208.5" r="3" fill="#ffffff" />
      {/* the loose end of the plait */}
      <path d="M89.5 212 C88 220 89 228 92.5 234 C95.5 228 96.5 220 95.5 212 Z" fill={HAIR} />
    </g>
  );
}

function UpperBody({ parts, p, girl }: { parts: ChosenParts; p: string; girl: boolean }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const longSleeves = hasSweater || hasBlazer;
  const sleeveFill = hasBlazer ? fill("blazer") : fill("sweater");

  return (
    <g transform={girl ? SLIM : undefined}>
      {/* arms */}
      <path d={ARM} fill={`url(#${p}-skin)`} />
      <path d={ARM} fill={`url(#${p}-skin)`} transform={MIRROR} />
      <path d={HAND} fill={`url(#${p}-skin)`} />
      <path d={HAND} fill={`url(#${p}-skin)`} transform={MIRROR} />
      <path d="M53 352 C56 356 60 357 63 355" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none" />
      <path d="M53 352 C56 356 60 357 63 355" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none" transform={MIRROR} />

      {/* shirt */}
      <Cloth d={SHIRT} fill={fill("shirt")} p={p} />
      <path d="M49 204 L69 210 M171 210 L191 204" stroke={LINE} strokeWidth="1.4" />
      <path d="M74 176 L69 210 M166 176 L171 210" stroke={SOFT_LINE} strokeWidth="1.2" />
      <path d="M84 236 C88 248 90 258 88 268 M156 236 C152 248 150 258 152 268 M100 150 C104 158 106 166 106 176" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
      <path d="M120 121 V268 M116.5 123 V268" stroke={SOFT_LINE} strokeWidth="1.1" />
      {[150, 178, 206, 234, 260].map((y) => (
        <circle key={y} cx="118.3" cy={y} r="2.1" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
      ))}
      <path d={POCKET} fill="none" stroke={LINE} strokeWidth="1.2" />
      <path d="M134 156 L156 156" stroke={SOFT_LINE} strokeWidth="1" />
      <path d={COLLAR_BAND} fill={fill("shirt")} />
      <path d={COLLAR_BAND} fill="rgba(0,0,0,0.12)" />
      <path d={COLLAR} fill={fill("shirt")} stroke={LINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={COLLAR} fill={fill("shirt")} stroke={LINE} strokeWidth="1.2" strokeLinejoin="round" transform={MIRROR} />

      {/* tie */}
      {parts.tie && (
        <>
          <Cloth d={TIE_BLADE} fill={fill("tie")} p={p} light={false} />
          <path d="M120 134 V246" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          <Cloth d={TIE_KNOT} fill={fill("tie")} p={p} light={false} />
          <path d="M115 131 L125 131" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
        </>
      )}

      {/* belt (boy: on the waistband, under a sweater or blazer; girl: drawn with the skirt) */}
      {parts.belt && !girl && (
        <>
          <path d="M76 262 L164 262 L164 272 L76 272 Z" fill={fill("belt")} />
          <rect x="111" y="259" width="18" height="16" rx="2" fill={`url(#${p}-metal)`} />
          <rect x="114.5" y="262.5" width="11" height="9" rx="1" fill="rgba(0,0,0,0.25)" />
        </>
      )}

      {/* sweater (V-neck, ribbed hem and cuffs); under a blazer it shows in the V */}
      {hasSweater && (
        <>
          <Cloth d={SWEATER} fill={fill("sweater")} p={p} />
          <path d="M75 262 L165 262 L165 278 L75 278 Z" fill={`url(#${p}-rib)`} />
          <path d="M46 318 L66 324 L66 336 L45 330 Z" fill={`url(#${p}-rib)`} />
          <path d="M46 318 L66 324 L66 336 L45 330 Z" fill={`url(#${p}-rib)`} transform={MIRROR} />
          <path d="M106 115 L120 184 L134 115" stroke="rgba(0,0,0,0.3)" strokeWidth="4" fill="none" strokeLinejoin="round" />
          <path d="M106 115 L120 184 L134 115" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
        </>
      )}

      {/* blazer */}
      {hasBlazer && (
        <>
          <Cloth d={BLAZER_PANEL} fill={fill("blazer")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={BLAZER_PANEL} fill={fill("blazer")} p={p} />
          </g>
          <path d={LAPEL} fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <path d={LAPEL} fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" transform={MIRROR} />
          <path d="M120 197 V304" stroke={LINE} strokeWidth="1.3" />
          <path d="M78 262 L106 262 L106 270 L78 270 Z" fill="rgba(0,0,0,0.22)" />
          <path d="M78 262 L106 262 L106 270 L78 270 Z" fill="rgba(0,0,0,0.22)" transform={MIRROR} />
          <path d={BADGE} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" />
          <path d="M141.5 147 L145.5 151 L150 145" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" fill="none" />
          {[224, 258].map((y) => (
            <circle key={y} cx="120" cy={y} r="3" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          ))}
        </>
      )}

      {longSleeves && (
        <>
          <Cloth d={hasBlazer ? BLAZER_SLEEVE : "M64 126 C56 132 53 146 53 162 L45 330 L66 336 L74 182 C72 160 70 140 64 126 Z"} fill={sleeveFill} p={p} />
          <g transform={MIRROR}>
            <Cloth d={hasBlazer ? BLAZER_SLEEVE : "M64 126 C56 132 53 146 53 162 L45 330 L66 336 L74 182 C72 160 70 140 64 126 Z"} fill={sleeveFill} p={p} />
          </g>
          <path d="M58 240 C62 246 66 248 70 246" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
          <path d="M58 240 C62 246 66 248 70 246" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" transform={MIRROR} />
        </>
      )}

    </g>
  );
}

function BoyLower({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const LEG = "M76 266 L120 266 L120 312 C117 320 115 330 114 345 L112 538 L80 538 L76 400 C74 340 73 300 76 266 Z";
  const SHOE_PATH = "M80 532 L113 532 C115 540 116 550 114 556 C112 561 106 562 100 562 L66 562 C59 562 57 557 60 552 C63 545 70 538 80 532 Z";
  return (
    <>
      {parts.socks && (
        <>
          <path d="M81 526 L112 526 L112 536 L81 536 Z" fill={fill("socks")} />
          <path d="M81 526 L112 526 L112 536 L81 536 Z" fill={fill("socks")} transform={MIRROR} />
        </>
      )}
      <Cloth d={LEG} fill={fill("pant")} p={p} />
      <g transform={MIRROR}>
        <Cloth d={LEG} fill={fill("pant")} p={p} />
      </g>
      <path d="M76 262 L164 262 L164 276 L76 276 Z" fill={fill("pant")} />
      <path d="M76 262 L164 262 L164 276 L76 276 Z" fill="rgba(0,0,0,0.16)" />
      {[88, 104, 136, 152].map((x) => (
        <rect key={x} x={x} y="261" width="3.5" height="16" rx="1" fill="rgba(0,0,0,0.18)" />
      ))}
      <path d="M121 276 V314 M121 300 C126 302 128 307 128 314" stroke={LINE} strokeWidth="1.2" fill="none" />
      <path d="M95 330 L96 536" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
      <path d="M95 330 L96 536" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" transform={MIRROR} />
      <path d="M82 520 C92 524 102 524 112 520" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
      <path d="M82 520 C92 524 102 524 112 520" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" transform={MIRROR} />
      <path d={SHOE_PATH} fill={`url(#${p}-shoe)`} />
      <path d={SHOE_PATH} fill={`url(#${p}-shoe)`} transform={MIRROR} />
      <path d="M70 549 C79 544 92 542 102 543" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M70 549 C79 544 92 542 102 543" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.6" fill="none" strokeLinecap="round" transform={MIRROR} />
      <path d="M92 536 L106 535" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
    </>
  );
}

function GirlLower({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const LEG = "M88 400 L112 400 C112 430 111 460 110 490 L109 532 L92 532 L90 490 C89 460 88 430 88 400 Z";
  const SOCK = "M89 452 L111 452 L109 534 L92 534 Z";
  const SHOE_PATH = "M91 526 L111 526 C113 534 114 544 112 550 C110 555 104 556 98 556 L80 556 C74 556 72 551 75 546 C78 539 84 532 91 526 Z";
  // box pleats: lines from the waistband out to the hem
  const tops = [86, 98, 110, 122, 134, 146, 158];
  const bottom = (x: number) => 56 + ((x - 79) / 82) * 128;
  return (
    <>
      <path d={LEG} fill={`url(#${p}-skin)`} />
      <path d={LEG} fill={`url(#${p}-skin)`} transform={MIRROR} />
      <ellipse cx="99" cy="440" rx="6" ry="4" fill="rgba(0,0,0,0.1)" />
      <ellipse cx="141" cy="440" rx="6" ry="4" fill="rgba(0,0,0,0.1)" />
      <Cloth d={SOCK} fill={fill("socks")} p={p} light={false} />
      <g transform={MIRROR}>
        <Cloth d={SOCK} fill={fill("socks")} p={p} light={false} />
      </g>
      <path d="M89 452 L111 452 L110.6 462 L89.4 462 Z" fill={`url(#${p}-rib)`} />
      <path d="M89 452 L111 452 L110.6 462 L89.4 462 Z" fill={`url(#${p}-rib)`} transform={MIRROR} />
      <path d={SHOE_PATH} fill={`url(#${p}-shoe)`} />
      <path d={SHOE_PATH} fill={`url(#${p}-shoe)`} transform={MIRROR} />
      <path d="M86 534 L111 531" stroke={SHOE} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M86 534 L111 531" stroke={SHOE} strokeWidth="3.4" strokeLinecap="round" transform={MIRROR} />
      <circle cx="108" cy="531.5" r="1.6" fill={`url(#${p}-metal)`} />
      <circle cx="132" cy="531.5" r="1.6" fill={`url(#${p}-metal)`} />
      <path d="M80 548 C88 544 98 543 106 544" stroke="#fff" strokeOpacity="0.26" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M80 548 C88 544 98 543 106 544" stroke="#fff" strokeOpacity="0.26" strokeWidth="1.4" fill="none" strokeLinecap="round" transform={MIRROR} />

      {/* skirt */}
      <Cloth d="M79 264 L161 264 L184 404 C150 410 90 410 56 404 Z" fill={fill("skirt")} p={p} />
      {tops.slice(0, -1).map((x, i) =>
        i % 2 === 0 ? (
          <path
            key={x}
            d={`M${x} 266 L${tops[i + 1]} 266 L${bottom(tops[i + 1])} 406 L${bottom(x)} 406 Z`}
            fill="rgba(0,0,0,0.1)"
          />
        ) : null,
      )}
      {tops.map((x) => (
        <path key={x} d={`M${x} 266 L${bottom(x)} 406`} stroke={SOFT_LINE} strokeWidth="1.2" />
      ))}
      <path d="M79 254 L161 254 L161.6 266 L78.4 266 Z" fill={fill("skirt")} />
      <path d="M79 254 L161 254 L161.6 266 L78.4 266 Z" fill="rgba(0,0,0,0.18)" />
      {parts.belt && (
        <>
          <path d="M79 256 L161 256 L161.4 264 L78.6 264 Z" fill={fill("belt")} />
          <rect x="112" y="253" width="16" height="14" rx="2" fill={`url(#${p}-metal)`} />
          <rect x="115" y="256" width="10" height="8" rx="1" fill="rgba(0,0,0,0.25)" />
        </>
      )}
    </>
  );
}

function Figure({ parts, idPrefix, girl }: { parts: ChosenParts; idPrefix: string; girl: boolean }) {
  const p = idPrefix;
  return (
    <svg
      viewBox="0 0 240 600"
      role="img"
      aria-label={girl ? "Girl wearing the chosen uniform" : "Boy wearing the chosen uniform"}
      className="h-full w-auto max-w-full"
    >
      <FigureDefs p={p} parts={parts} />
      <ellipse cx="120" cy="566" rx="78" ry="9" fill="rgba(0,0,0,0.45)" />
      {girl ? <GirlLower parts={parts} p={p} /> : <BoyLower parts={parts} p={p} />}
      <UpperBody parts={parts} p={p} girl={girl} />
      <Head p={p} girl={girl} />
      {girl && (
        <>
          <Plait />
          <Plait mirror />
        </>
      )}
    </svg>
  );
}

/**
 * A boy and a girl in the chosen uniform, illustrated with real
 * proportions and fabric shading. Pure SVG with no hooks, so the
 * designer and the admin enquiry page share it; `idPrefix` keeps the
 * gradient and pattern ids unique when two previews share a page.
 */
export function UniformPreview({
  parts,
  idPrefix,
  view = "both",
  className,
}: {
  parts: ChosenParts;
  idPrefix: string;
  view?: PreviewView;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full items-end justify-center gap-2 sm:gap-6", className)}>
      {view !== "girl" && <Figure parts={parts} idPrefix={`${idPrefix}-b`} girl={false} />}
      {view !== "boy" && <Figure parts={parts} idPrefix={`${idPrefix}-g`} girl />}
    </div>
  );
}

/** A sample's swatch: its photo, or a square of cloth painted in its
 * colour and pattern, with a fine twill texture and a soft fold of light. */
export function SampleSwatch({ sample, className }: { sample: DesignSample; className?: string }) {
  if (sample.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an admin-uploaded photo from our own photo store
      <img src={sample.photoUrl} alt="" className={cn("object-cover", className)} />
    );
  }
  const id = `swatch-${sample.id}`;
  return (
    <svg viewBox="0 0 80 80" aria-hidden className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <FabricPatterns parts={{ shirt: sample }} idPrefix={id} scale={0.9} />
        <pattern id={`${id}-twill`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1" height="4" fill="#000" opacity="0.08" />
        </pattern>
        <linearGradient id={`${id}-fold`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.56" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" fill={partFill("shirt", sample, id)} />
      <rect width="80" height="80" fill={`url(#${id}-twill)`} />
      <rect width="80" height="80" fill={`url(#${id}-fold)`} />
    </svg>
  );
}
