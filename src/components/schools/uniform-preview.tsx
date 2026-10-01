import type { DesignPartKey, DesignSample } from "@/lib/uniform-design";
import { DEFAULT_PART_COLOUR } from "@/lib/uniform-design";
import { cn } from "@/lib/utils";

export type ChosenParts = Partial<Record<DesignPartKey, DesignSample>>;
export type PreviewView = "both" | "boy" | "girl";

const HAIR = "#1c1411";
const SHOE = "#121318";
const LINE = "rgba(0,0,0,0.28)";
const SOFT_LINE = "rgba(0,0,0,0.16)";
const MIRROR = "matrix(-1 0 0 1 240 0)";

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
        <stop offset="0" stopColor="#c08a68" />
        <stop offset="0.45" stopColor="#ddae8f" />
        <stop offset="1" stopColor="#bb8462" />
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
// ---------------------------------------------------------------------------
// Figures. Fashion-illustration proportions (about 8 heads), front view,
// weight on the viewer-left leg, both arms relaxed with both hands showing.
// Torsos and arms are symmetric; the legs carry the pose.
// ---------------------------------------------------------------------------

function FaceFeatures({ girl }: { girl: boolean }) {
  return (
    <>
      {/* brows */}
      <path
        d={girl ? "M101 54.5 C105 51.5 110 51 114 52.5" : "M100 55 C104.5 52 110 51.5 114.5 53"}
        stroke={HAIR}
        strokeWidth={girl ? 1.7 : 2.6}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={girl ? "M126 52.5 C130 51 135 51.5 139 54.5" : "M125.5 53 C130 51.5 135.5 52 140 55"}
        stroke={HAIR}
        strokeWidth={girl ? 1.7 : 2.6}
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes: white, iris, lid line, catch-light */}
      {[
        { cx: 107.5, d: "M101 63 C104 59.6 111 59.6 114 63 C111 65.8 104 65.8 101 63 Z" },
        { cx: 132.5, d: "M126 63 C129 59.6 136 59.6 139 63 C136 65.8 129 65.8 126 63 Z" },
      ].map((eye) => (
        <g key={eye.cx}>
          <path d={eye.d} fill="#f6f1ec" />
          <circle cx={eye.cx} cy="62.6" r="2.7" fill="#3a2418" />
          <circle cx={eye.cx} cy="62.6" r="1.3" fill="#120c09" />
          <circle cx={eye.cx + 0.9} cy="61.6" r="0.75" fill="#fff" />
          <path
            d={eye.d.split(" C")[0] + " C" + eye.d.split(" C")[1]}
            stroke={HAIR}
            strokeWidth={girl ? 1.9 : 1.3}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      {girl && (
        <>
          <path d="M101.2 62.6 L98.2 60.2 M138.8 62.6 L141.8 60.2" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {/* nose */}
      <path d="M120 64 C119.3 70.5 118 75 116.6 78.4" stroke="#b77d5c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M116.4 79.2 C118.4 80.8 121.6 80.8 123.6 79.2" stroke="#a46a4b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* mouth */}
      {girl ? (
        <>
          <path d="M112.6 86.6 C115.5 85 118 85.4 120 86.2 C122 85.4 124.5 85 127.4 86.6 C124.5 89.8 115.5 89.8 112.6 86.6 Z" fill="#c0665c" />
          <path d="M113.4 87 C116 88.6 124 88.6 126.6 87" stroke="#8f3f37" strokeWidth="0.9" fill="none" />
          <path d="M117 88.6 C118.6 89.2 121.4 89.2 123 88.6" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
        </>
      ) : (
        <>
          <path d="M112.5 86.6 C116 89.4 124 89.4 127.5 86.6" stroke="#93503f" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M115.5 90.2 C118.5 91.6 121.5 91.6 124.5 90.2" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* cheeks */}
      <ellipse cx="103" cy="77" rx="6.5" ry="4" fill="#d9786a" opacity={girl ? 0.28 : 0.14} />
      <ellipse cx="137" cy="77" rx="6.5" ry="4" fill="#d9786a" opacity={girl ? 0.28 : 0.14} />
    </>
  );
}

const EAR = "M91 58 C85 55 82 65 85 72 C87 76 90 77 92 74 Z";

function BoyHead({ p }: { p: string }) {
  return (
    <>
      <path d="M110 90 L110 116 C115 121 125 121 130 116 L130 90 Z" fill={`url(#${p}-skin)`} />
      <path d="M110 100 C115 107 125 107 130 100 L130 109 C125 114 115 114 110 109 Z" fill="rgba(0,0,0,0.18)" />
      <path d={EAR} fill="#c58d6b" />
      <path d={EAR} fill="#c58d6b" transform={MIRROR} />
      <path
        d="M120 22 C139 22 150 37 150 58 C150 74 146 86 136 94 C130 99 125 101 120 101 C115 101 110 99 104 94 C94 86 90 74 90 58 C90 37 101 22 120 22 Z"
        fill={`url(#${p}-skin)`}
      />
      <path d="M96 86 C104 97 136 97 144 86 C138 98 129 102 120 102 C111 102 102 98 96 86 Z" fill="rgba(0,0,0,0.09)" />
      <FaceFeatures girl={false} />
      {/* textured, swept fringe */}
      <path
        d="M88 62 C82 32 100 12 124 13 C148 14 160 32 154 60 C152 49 148 42 143 38 C141 45 132 47 124 43 C119 51 107 53 97 46 C93 50 90 55 88 62 Z"
        fill={`url(#${p}-hair)`}
      />
      <path d="M96 47 C100 33 116 26 140 30 C130 33 121 38 115 47 C108 45 101 45 96 47 Z" fill="#2c1f19" />
      <path d="M104 24 C116 18 132 18 146 26 M100 32 C112 25 128 24 142 30" stroke="#fff" strokeOpacity="0.09" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M150 50 C152 56 152 62 151 66 M90 50 C88 56 88 62 89 66" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function GirlHeadBack({ p }: { p: string }) {
  // long hair falling behind the shoulders
  return (
    <path
      d="M86 66 C79 30 97 11 120 11 C143 11 161 30 154 66 L160 150 C162 186 162 214 158 238 C150 246 138 246 132 236 L136 122 L104 122 L108 236 C102 246 90 246 82 238 C78 214 78 186 80 150 Z"
      fill={`url(#${p}-hair)`}
    />
  );
}

function GirlHead({ p }: { p: string }) {
  return (
    <>
      <path d="M111 90 L111 116 C115 120 125 120 129 116 L129 90 Z" fill={`url(#${p}-skin)`} />
      <path d="M111 100 C115 106 125 106 129 100 L129 108 C125 113 115 113 111 108 Z" fill="rgba(0,0,0,0.16)" />
      <path
        d="M120 24 C138 24 149 38 149 58 C149 75 144 86 134 94 C129 98 124 100 120 100 C116 100 111 98 106 94 C96 86 91 75 91 58 C91 38 102 24 120 24 Z"
        fill={`url(#${p}-skin)`}
      />
      <path d="M98 86 C106 96 134 96 142 86 C136 97 128 101 120 101 C112 101 104 97 98 86 Z" fill="rgba(0,0,0,0.07)" />
      <FaceFeatures girl />
      {/* centre parting and face-framing strands */}
      <path
        d="M89 66 C86 36 101 19 120 19 C139 19 154 36 151 66 C148 50 140 39 123 35 L120 24 L117 35 C100 39 92 50 89 66 Z"
        fill={`url(#${p}-hair)`}
      />
      <path d="M92 58 C88 84 90 108 96 126 C92 104 92 84 96 62 Z" fill={HAIR} />
      <path d="M148 58 C154 92 156 132 152 176 C150 194 146 206 141 214 C144 190 146 150 142 112 C140 90 142 72 148 58 Z" fill="#2a1d17" />
      <path d="M118 22 C108 26 100 36 96 50 M124 22 C134 26 142 36 146 52" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.6" fill="none" />
      <path d="M150 80 C152 110 152 140 149 170" stroke="#fff" strokeOpacity="0.08" strokeWidth="1.4" fill="none" />
    </>
  );
}

// ---- boy --------------------------------------------------------------------
const B_SHIRT =
  "M84 118 C96 112 108 110 120 112 C132 110 144 112 156 118 L174 125 C180 128 183 136 184 146 L188 206 L170 211 L165 180 L162 280 L78 280 L75 180 L70 211 L52 206 L56 146 C57 136 60 128 66 125 Z";
const B_SHIRT_BODY = "M84 118 C96 112 108 110 120 112 C132 110 144 112 156 118 L170 124 L165 180 L162 280 L78 280 L75 180 L70 124 Z";
const B_ARM_LEFT = "M54 202 C50 232 48 264 49 298 C50 322 52 340 55 354 L68 354 C67 338 67 320 68 298 C69 264 71 234 72 208 Z";
const B_HAND_LEFT = "M54 350 C50 362 52 378 59 383 C66 386 72 378 71 368 C71 362 70 356 68 350 Z";
const B_SWEATER_BODY = "M84 119 L106 117 L120 186 L134 117 L156 119 L170 125 L165 186 L163 286 L77 286 L75 186 L70 125 Z";
const B_BLAZER_PANEL = "M84 115 L104 113 L114 190 L120 199 L120 314 L72 316 C71 270 71 230 73 186 C67 164 64 144 66 128 Z";
const B_SLEEVE_LEFT = "M66 126 C58 132 56 146 56 162 L49 346 L70 350 L75 188 C73 160 70 140 66 126 Z";

function Boy({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const LEG_LEFT = "M78 280 L120 280 L120 320 C116 328 114 338 113 352 L110 588 L80 588 C78 520 76 440 76 382 C75 332 76 302 78 280 Z";
  const LEG_RIGHT = "M120 280 L162 280 C165 302 166 332 165 382 C164 432 168 502 172 586 L142 588 C138 520 132 442 128 382 C126 352 124 332 121 320 Z";
  const SHOE_LEFT = "M80 582 L112 582 C114 590 115 598 113 603 C111 607 105 608 99 608 L66 608 C59 608 57 603 60 598 C63 591 70 586 80 582 Z";
  const SHOE_RIGHT = "M142 582 L172 581 C181 585 188 591 190 597 C192 603 188 607 182 607 L146 608 C140 608 138 600 140 592 Z";

  return (
    <>
      <ellipse cx="124" cy="610" rx="80" ry="9" fill="rgba(0,0,0,0.45)" />
      {/* legs */}
      {parts.socks && (
        <>
          <path d="M81 574 L112 574 L112 586 L81 586 Z" fill={fill("socks")} />
          <path d="M141 574 L171 573 L172 585 L142 586 Z" fill={fill("socks")} />
        </>
      )}
      <Cloth d={LEG_LEFT} fill={fill("pant")} p={p} />
      <Cloth d={LEG_RIGHT} fill={fill("pant")} p={p} />
      <path d="M95 340 L95 584 M146 342 C148 420 152 500 157 584" stroke="rgba(255,255,255,0.1)" strokeWidth="1.3" fill="none" />
      <path d="M128 384 C132 392 136 396 140 398" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
      <path d="M82 566 C92 570 102 570 112 566 M142 566 C152 570 162 570 171 565" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
      <path d={SHOE_LEFT} fill={`url(#${p}-shoe)`} />
      <path d={SHOE_RIGHT} fill={`url(#${p}-shoe)`} />
      <path d="M70 597 C79 592 92 590 102 591 M150 594 C160 590 174 591 184 597" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* relaxed arms and both hands (a long sleeve covers the arms) */}
      {!hasSweater && !hasBlazer && (
        <>
          <path d={B_ARM_LEFT} fill={`url(#${p}-skin)`} />
          <path d={B_ARM_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
        </>
      )}
      <path d={B_HAND_LEFT} fill={`url(#${p}-skin)`} />
      <path d={B_HAND_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
      <path d="M57 366 C60 370 64 371 67 369" stroke="rgba(0,0,0,0.16)" strokeWidth="1.1" fill="none" />
      <path d="M57 366 C60 370 64 371 67 369" stroke="rgba(0,0,0,0.16)" strokeWidth="1.1" fill="none" transform={MIRROR} />

      {/* shirt */}
      <Cloth d={hasSweater || hasBlazer ? B_SHIRT_BODY : B_SHIRT} fill={fill("shirt")} p={p} />
      {!hasSweater && !hasBlazer && <path d="M52 206 L70 211 M170 211 L188 206" stroke={LINE} strokeWidth="1.4" />}
      <path d="M84 242 C88 254 90 264 88 278 M156 242 C152 254 150 264 152 278" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
      <path d="M120 121 V278 M116.5 123 V278" stroke={SOFT_LINE} strokeWidth="1.1" />
      {[150, 178, 206, 234, 262].map((y) => (
        <circle key={y} cx="118.3" cy={y} r="2" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
      ))}
      <path d="M134 150 L155 150 L155 173 C149 176 140 176 134 173 Z" fill="none" stroke={LINE} strokeWidth="1.1" />
      <path d="M105 104 C112 111 128 111 135 104 L137 114 C128 121 112 121 103 114 Z" fill={fill("shirt")} />
      <path d="M105 104 C112 111 128 111 135 104 L137 114 C128 121 112 121 103 114 Z" fill="rgba(0,0,0,0.12)" />
      <path d="M120 123 L106 107 L93 116 C95 126 99 135 104 143 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M120 123 L106 107 L93 116 C95 126 99 135 104 143 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" transform={MIRROR} />

      {/* waistband, belt loops, fly, pocket opening (the hand is in it) */}
      <path d="M78 274 L162 274 L162 288 L78 288 Z" fill={fill("pant")} />
      <path d="M78 274 L162 274 L162 288 L78 288 Z" fill="rgba(0,0,0,0.16)" />
      {[90, 106, 134, 150].map((x) => (
        <rect key={x} x={x} y="273" width="3.4" height="16" rx="1" fill="rgba(0,0,0,0.2)" />
      ))}
      <path d="M121 288 V326 M121 312 C126 314 128 319 128 326" stroke={LINE} strokeWidth="1.2" fill="none" />
      <path d="M148 290 C152 300 156 310 160 318" stroke="rgba(0,0,0,0.4)" strokeWidth="1.6" fill="none" />
      {parts.belt && (
        <>
          <path d="M78 275 L162 275 L162 285 L78 285 Z" fill={fill("belt")} />
          <rect x="111" y="272" width="18" height="16" rx="2" fill={`url(#${p}-metal)`} />
          <rect x="114.5" y="275.5" width="11" height="9" rx="1" fill="rgba(0,0,0,0.25)" />
        </>
      )}

      {/* tie */}
      {parts.tie && (
        <>
          <Cloth d="M115 132 L125 132 L134 236 L120 254 L106 236 Z" fill={fill("tie")} p={p} light={false} />
          <path d="M120 134 V250" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          <Cloth d="M113 115 L127 115 L125 132 L115 132 Z" fill={fill("tie")} p={p} light={false} />
        </>
      )}

      {hasSweater && (
        <>
          <Cloth d={B_SWEATER_BODY} fill={fill("sweater")} p={p} />
          <Cloth d={B_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={B_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          </g>
          <path d="M77 272 L163 272 L163 286 L77 286 Z" fill={`url(#${p}-rib)`} />
          <path d="M49 334 L69 338 L69 348 L49 344 Z" fill={`url(#${p}-rib)`} />
          <path d="M49 334 L69 338 L69 348 L49 344 Z" fill={`url(#${p}-rib)`} transform={MIRROR} />
          <path d="M106 117 L120 186 L134 117" stroke="rgba(0,0,0,0.3)" strokeWidth="4" fill="none" strokeLinejoin="round" />
        </>
      )}

      {hasBlazer && (
        <>
          <Cloth d={B_BLAZER_PANEL} fill={fill("blazer")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={B_BLAZER_PANEL} fill={fill("blazer")} p={p} />
          </g>
          <Cloth d={B_SLEEVE_LEFT} fill={fill("blazer")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={B_SLEEVE_LEFT} fill={fill("blazer")} p={p} />
          </g>
          <path d="M104 113 L95 126 L103 148 L96 155 L114 190 Z" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <path d="M104 113 L95 126 L103 148 L96 155 L114 190 Z" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" transform={MIRROR} />
          <path d="M120 199 V314" stroke={LINE} strokeWidth="1.3" />
          <path d="M78 270 L106 270 L106 278 L78 278 Z M134 270 L162 270 L162 278 L134 278 Z" fill="rgba(0,0,0,0.22)" />
          <path d="M138 142 L153 142 L153 154 C153 160 149 164 145.5 165.5 C142 164 138 160 138 154 Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" />
          <path d="M141.5 149 L145.5 153 L150 147" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" fill="none" />
          {[226, 262].map((y) => (
            <circle key={y} cx="120" cy={y} r="3" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
          ))}
          <path d="M58 248 C62 254 66 256 70 254" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
        </>
      )}

      {hasSweater && !hasBlazer && (
        <>
          <path d="M56 248 C60 254 64 256 68 254" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" />
          <path d="M56 248 C60 254 64 256 68 254" stroke={SOFT_LINE} strokeWidth="1.2" fill="none" transform={MIRROR} />
        </>
      )}

      <BoyHead p={p} />
    </>
  );
}

// ---- girl -------------------------------------------------------------------
const G_SHIRT =
  "M90 120 C100 114 110 112 120 114 C130 112 140 114 150 120 L166 127 C172 130 175 138 176 148 L180 204 L163 209 L158 180 L155 268 L85 268 L82 180 L77 209 L60 204 L64 148 C65 138 68 130 74 127 Z";
const G_SHIRT_BODY = "M90 120 C100 114 110 112 120 114 C130 112 140 114 150 120 L162 126 L158 180 L155 268 L85 268 L82 180 L78 126 Z";
const G_ARM_LEFT = "M62 200 C58 230 57 260 58 292 C59 314 61 332 63 344 L75 344 C74 330 74 314 75 292 C76 260 78 232 79 206 Z";
const G_HAND_LEFT = "M62 340 C58 351 60 366 66 370 C72 373 78 366 77 357 C77 351 76 346 75 340 Z";
const G_SWEATER_BODY = "M90 121 L108 119 L120 182 L132 119 L150 121 L162 127 L158 186 L156 274 L84 274 L82 186 L78 127 Z";
const G_BLAZER_PANEL = "M90 117 L106 115 L115 186 L120 194 L120 300 L80 302 C79 262 79 228 81 186 C75 166 72 146 74 130 Z";
const G_SLEEVE_LEFT = "M74 128 C66 134 64 148 64 164 L58 338 L77 342 L82 190 C80 162 78 142 74 128 Z";

function Girl({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const LEG_LEFT = "M92 404 L114 404 C114 448 113 498 112 540 L110 588 L94 588 L92 540 C91 498 91 448 92 404 Z";
  const LEG_RIGHT = "M126 404 L148 404 C150 448 152 498 154 540 L158 586 L142 588 L138 540 C134 498 128 448 126 404 Z";
  const SOCK_LEFT = "M91.6 470 L113.4 470 C113 500 112.5 528 112 548 L110 590 L94 590 L92.4 548 C92 528 91.7 500 91.6 470 Z";
  const SOCK_RIGHT = "M130 470 L151 470 C152 500 153 528 154.6 548 L158.6 588 L142 590 L138.4 548 C136 528 133 500 130 470 Z";
  const SHOE_LEFT = "M93 582 L111 582 C113 590 114 598 112 602 C110 606 104 607 98 607 L82 607 C76 607 74 602 77 597 C80 590 86 585 93 582 Z";
  const SHOE_RIGHT = "M142 582 L158 581 C166 585 172 591 174 597 C176 603 172 606 166 606 L146 607 C140 607 139 600 140 592 Z";
  const tops = [90, 100, 110, 120, 130, 140, 150];
  const bottom = (x: number) => 62 + ((x - 86) / 68) * 116;

  return (
    <>
      <ellipse cx="122" cy="610" rx="66" ry="8" fill="rgba(0,0,0,0.45)" />
      <GirlHeadBack p={p} />
      {/* legs, socks, shoes */}
      <path d={LEG_LEFT} fill={`url(#${p}-skin)`} />
      <path d={LEG_RIGHT} fill={`url(#${p}-skin)`} />
      {parts.socks && (
        <>
          <Cloth d={SOCK_LEFT} fill={fill("socks")} p={p} light={false} />
          <Cloth d={SOCK_RIGHT} fill={fill("socks")} p={p} light={false} />
          <path d="M91.6 470 L113.4 470 L113.3 478 L91.7 478 Z M130 470 L151 470 L151.4 478 L131 478 Z" fill={`url(#${p}-rib)`} />
        </>
      )}
      <path d={SHOE_LEFT} fill={`url(#${p}-shoe)`} />
      <path d={SHOE_RIGHT} fill={`url(#${p}-shoe)`} />
      <path d="M90 590 L111 588 M141 589 L162 588" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" />
      <path d="M82 597 C90 593 100 592 107 593 M148 595 C156 592 166 593 171 597" stroke="#fff" strokeOpacity="0.26" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* arms */}
      {!hasSweater && !hasBlazer && (
        <>
          <path d={G_ARM_LEFT} fill={`url(#${p}-skin)`} />
          <path d={G_ARM_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
        </>
      )}
      <path d={G_HAND_LEFT} fill={`url(#${p}-skin)`} />
      <path d={G_HAND_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />

      {/* shirt */}
      <Cloth d={hasSweater || hasBlazer ? G_SHIRT_BODY : G_SHIRT} fill={fill("shirt")} p={p} />
      {!hasSweater && !hasBlazer && <path d="M60 204 L77 209 M163 209 L180 204" stroke={LINE} strokeWidth="1.3" />}
      <path d="M120 122 V266" stroke={SOFT_LINE} strokeWidth="1.1" />
      {[148, 174, 200, 226].map((y) => (
        <circle key={y} cx="118.6" cy={y} r="1.8" fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
      ))}
      <path d="M107 106 C113 112 127 112 133 106 L135 115 C127 121 113 121 105 115 Z" fill={fill("shirt")} />
      <path d="M107 106 C113 112 127 112 133 106 L135 115 C127 121 113 121 105 115 Z" fill="rgba(0,0,0,0.12)" />
      <path d="M120 124 L108 109 L96 117 C98 126 101 134 105 141 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M120 124 L108 109 L96 117 C98 126 101 134 105 141 Z" fill={fill("shirt")} stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" transform={MIRROR} />

      {parts.tie && (
        <>
          <Cloth d="M116 131 L124 131 L131 222 L120 238 L109 222 Z" fill={fill("tie")} p={p} light={false} />
          <Cloth d="M114.5 116 L125.5 116 L124 131 L116 131 Z" fill={fill("tie")} p={p} light={false} />
        </>
      )}

      {hasSweater && (
        <>
          <Cloth d={G_SWEATER_BODY} fill={fill("sweater")} p={p} />
          <Cloth d={G_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={G_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          </g>
          <path d="M84 262 L156 262 L156 274 L84 274 Z" fill={`url(#${p}-rib)`} />
          <path d="M58 326 L77 330 L77 340 L58 336 Z" fill={`url(#${p}-rib)`} />
          <path d="M58 326 L77 330 L77 340 L58 336 Z" fill={`url(#${p}-rib)`} transform={MIRROR} />
          <path d="M108 119 L120 182 L132 119" stroke="rgba(0,0,0,0.3)" strokeWidth="3.6" fill="none" strokeLinejoin="round" />
        </>
      )}

      {/* skirt */}
      <Cloth d="M86 268 L154 268 L178 410 C140 416 100 416 62 410 Z" fill={fill("skirt")} p={p} />
      {tops.slice(0, -1).map((x, i) =>
        i % 2 === 0 ? (
          <path key={x} d={`M${x} 270 L${tops[i + 1]} 270 L${bottom(tops[i + 1])} 412 L${bottom(x)} 412 Z`} fill="rgba(0,0,0,0.11)" />
        ) : null,
      )}
      {tops.map((x) => (
        <path key={x} d={`M${x} 270 L${bottom(x)} 412`} stroke={SOFT_LINE} strokeWidth="1.1" />
      ))}
      <path d="M86 258 L154 258 L154.6 270 L85.4 270 Z" fill={fill("skirt")} />
      <path d="M86 258 L154 258 L154.6 270 L85.4 270 Z" fill="rgba(0,0,0,0.18)" />
      {parts.belt && (
        <>
          <path d="M86 260 L154 260 L154.4 268 L85.6 268 Z" fill={fill("belt")} />
          <rect x="112" y="257" width="16" height="14" rx="2" fill={`url(#${p}-metal)`} />
          <rect x="115" y="260" width="10" height="8" rx="1" fill="rgba(0,0,0,0.25)" />
        </>
      )}

      {hasBlazer && (
        <>
          <Cloth d={G_BLAZER_PANEL} fill={fill("blazer")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={G_BLAZER_PANEL} fill={fill("blazer")} p={p} />
          </g>
          <Cloth d={G_SLEEVE_LEFT} fill={fill("blazer")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={G_SLEEVE_LEFT} fill={fill("blazer")} p={p} />
          </g>
          <path d="M106 115 L98 127 L105 147 L99 153 L115 186 Z" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <path d="M106 115 L98 127 L105 147 L99 153 L115 186 Z" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" transform={MIRROR} />
          <path d="M120 194 V300" stroke={LINE} strokeWidth="1.2" />
          <path d="M84 262 L106 262 L106 269 L84 269 Z M134 262 L156 262 L156 269 L134 269 Z" fill="rgba(0,0,0,0.22)" />
          <path d="M136 140 L149 140 L149 150 C149 155 146 159 142.5 160.5 C139 159 136 155 136 150 Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
          {[214, 244].map((y) => (
            <circle key={y} cx="120" cy={y} r="2.7" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
          ))}
        </>
      )}

      <GirlHead p={p} />
    </>
  );
}

function Figure({ parts, idPrefix, girl }: { parts: ChosenParts; idPrefix: string; girl: boolean }) {
  return (
    <svg
      viewBox="0 0 240 624"
      role="img"
      aria-label={girl ? "Girl wearing the chosen uniform" : "Boy wearing the chosen uniform"}
      className="h-full w-auto max-w-full"
    >
      <FigureDefs p={idPrefix} parts={parts} />
      {girl ? <Girl parts={parts} p={idPrefix} /> : <Boy parts={parts} p={idPrefix} />}
    </svg>
  );
}

/**
 * A boy and a girl in the chosen uniform: fashion-illustration
 * proportions, a natural stance, and cloth shaded for volume. Pure SVG with
 * no hooks, so the designer and the admin enquiry page share it;
 * `idPrefix` keeps gradient and pattern ids unique per preview.
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
    <div className={cn("flex h-full items-end justify-center gap-1 sm:gap-6", className)}>
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
