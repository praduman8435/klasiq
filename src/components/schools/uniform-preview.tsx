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
function partFill(
  key: DesignPartKey,
  part: DesignSample | undefined,
  idPrefix: string,
) {
  if (!part || part.pattern === "PLAIN")
    return part?.colourHex ?? DEFAULT_PART_COLOUR[key];
  return `url(#${idPrefix}-${key})`;
}

function FabricPatterns({
  parts,
  idPrefix,
  scale = 1,
}: {
  parts: ChosenParts;
  idPrefix: string;
  scale?: number;
}) {
  return (
    <>
      {(
        Object.entries(parts) as [DesignPartKey, DesignSample | undefined][]
      ).map(([key, part]) => {
        if (!part || part.pattern === "PLAIN") return null;
        const accent = part.accentHex ?? "#000000";
        const strength = part.accentHex ? 0.78 : 0.3;
        const id = `${idPrefix}-${key}`;
        if (part.pattern === "CHECK") {
          const s = 16 * scale;
          return (
            <pattern
              key={key}
              id={id}
              width={s}
              height={s}
              patternUnits="userSpaceOnUse"
            >
              <rect width={s} height={s} fill={part.colourHex} />
              <rect
                y={s * 0.36}
                width={s}
                height={s * 0.28}
                fill={accent}
                opacity={strength * 0.55}
              />
              <rect
                x={s * 0.36}
                width={s * 0.28}
                height={s}
                fill={accent}
                opacity={strength * 0.55}
              />
              <rect
                y={s * 0.47}
                width={s}
                height={s * 0.06}
                fill={accent}
                opacity={strength}
              />
              <rect
                x={s * 0.47}
                width={s * 0.06}
                height={s}
                fill={accent}
                opacity={strength}
              />
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
            <rect
              width={s * 0.34}
              height={s}
              fill={accent}
              opacity={strength}
            />
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
      <pattern
        id={`${p}-rib`}
        width="3"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="1.2" height="6" fill="#000" opacity="0.18" />
      </pattern>
    </defs>
  );
}

/** What a child wears when a part is set to None: a plain vest or banyan
 * (no shirt), plain knee-length base shorts (no pant or skirt), bare
 * feet (no shoes). Soft heather greys, so it never reads as a chosen
 * uniform piece. */
const BASE_TOP = "#d6d9de";
const BASE_SHORTS = "#80858f";

/** A piece of cloth: its colour, then side shading and a soft top light. */
function Cloth({
  d,
  fill,
  p,
  light = true,
}: {
  d: string;
  fill: string;
  p: string;
  light?: boolean;
}) {
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

/** Shared face gradients: soft side shading, cheek warmth, iris, lips. */
function FaceDefs({ p }: { p: string }) {
  return (
    <defs>
      <radialGradient id={`${p}-face-shade`} cx="0.5" cy="0.42" r="0.62">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#5a2e1a" stopOpacity="0.22" />
      </radialGradient>
      <radialGradient id={`${p}-blush`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#e07a6a" stopOpacity="0.32" />
        <stop offset="1" stopColor="#e07a6a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-iris`} cx="0.45" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#7a4a2c" />
        <stop offset="0.7" stopColor="#3d2416" />
        <stop offset="1" stopColor="#24150d" />
      </radialGradient>
      <linearGradient id={`${p}-neck`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#8a5236" stopOpacity="0.5" />
        <stop offset="0.35" stopColor="#8a5236" stopOpacity="0.12" />
        <stop offset="1" stopColor="#8a5236" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${p}-hair-sheen`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function Eye({ cx, p, girl, flip = false }: { cx: number; p: string; girl: boolean; flip?: boolean }) {
  // drawn for the viewer-left eye (outer corner on the left), mirrored around
  // its own centre for the right eye
  const t = flip ? `matrix(-1 0 0 1 ${cx * 2} 0)` : undefined;
  return (
    <g transform={t}>
      {/* white of the eye, almond shaped */}
      <path d={`M${cx - 7} 62.6 C${cx - 4.6} 58.6 ${cx + 4.4} 58.4 ${cx + 7} 62 C${cx + 4.6} 65.6 ${cx - 4.4} 66 ${cx - 7} 62.6 Z`} fill="#f7f2ee" />
      {/* iris and pupil, looking slightly forward */}
      <circle cx={cx + 0.4} cy="62.2" r="3.5" fill={`url(#${p}-iris)`} />
      <circle cx={cx + 0.4} cy="62.2" r="1.6" fill="#120b07" />
      <circle cx={cx + 1.5} cy="60.9" r="1" fill="#fff" />
      <circle cx={cx - 0.9} cy="63.6" r="0.45" fill="#fff" opacity="0.7" />
      {/* the upper lid hides the top of the iris */}
      <path d={`M${cx - 7.4} 62.6 C${cx - 4.8} 57.8 ${cx + 4.6} 57.4 ${cx + 7.4} 61.8 C${cx + 4.6} 59.6 ${cx - 4.4} 59.6 ${cx - 7.4} 62.6 Z`} fill={HAIR} />
      {girl && <path d={`M${cx - 6.8} 61.8 C${cx - 7.8} 61.2 ${cx - 8.4} 60.6 ${cx - 8.8} 59.8`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" fill="none" />}
      {/* lower lid and lid crease */}
      <path d={`M${cx - 5.6} 64.8 C${cx - 2} 66.4 ${cx + 2.6} 66.2 ${cx + 5.8} 63.8`} stroke="#9c6446" strokeOpacity="0.45" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d={`M${cx - 6} 58.4 C${cx - 3} 55.6 ${cx + 3.4} 55.4 ${cx + 6.4} 57.8`} stroke="#9c6446" strokeOpacity="0.4" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

function FaceFeatures({ p, girl }: { p: string; girl: boolean }) {
  return (
    <>
      {/* brows: tapered, softly arched */}
      <path
        d={girl ? "M99.6 54 C103.4 50.4 109 49.6 114.2 51.4 C109.4 51 104 51.8 100.4 54.8 Z" : "M99 54.4 C103 50.6 109.6 49.6 115 51.4 L114.6 53.2 C109.4 52.2 104 52.8 99.8 55.6 Z"}
        fill={HAIR}
      />
      <path
        d={girl ? "M99.6 54 C103.4 50.4 109 49.6 114.2 51.4 C109.4 51 104 51.8 100.4 54.8 Z" : "M99 54.4 C103 50.6 109.6 49.6 115 51.4 L114.6 53.2 C109.4 52.2 104 52.8 99.8 55.6 Z"}
        fill={HAIR}
        transform={MIRROR}
      />
      <Eye cx={107.4} p={p} girl={girl} />
      <Eye cx={132.6} p={p} girl={girl} flip />
      {/* nose: a soft side shadow and the tip */}
      <path d="M118.6 63 C117.6 69 116.4 73.6 115.6 76.4 C117 77.4 118.2 77.2 119 76.4" stroke="#b07454" strokeOpacity="0.55" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M115.8 78.6 C117.6 80.2 122.4 80.2 124.2 78.6" stroke="#9a5f42" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="120" cy="77.6" rx="3" ry="1.6" fill="#fff" opacity="0.08" />
      {/* a friendly closed-mouth smile */}
      {girl ? (
        <>
          <path d="M112.4 86.4 C115.6 85.4 118 85.8 120 86.6 C122 85.8 124.4 85.4 127.6 86.4 C125.6 87.6 122.8 88 120 88 C117.2 88 114.4 87.6 112.4 86.4 Z" fill="#c26a5e" />
          <path d="M112.6 86.6 C115.4 88 117.6 88.6 120 88.6 C122.4 88.6 124.6 88 127.4 86.6 C125.8 90.4 123 91.8 120 91.8 C117 91.8 114.2 90.4 112.6 86.6 Z" fill="#cf7a6c" />
          <path d="M112.4 86.4 C116 88.6 124 88.6 127.6 86.4" stroke="#8c3e35" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M117.2 89.8 C118.8 90.4 121.2 90.4 122.8 89.8" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M111.4 85.6 L112.6 86.6 M128.6 85.6 L127.4 86.6" stroke="#8c3e35" strokeOpacity="0.5" strokeWidth="0.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M111.8 85.6 C115.4 89.6 124.6 89.6 128.2 85.6" stroke="#8a4636" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M115.6 90.6 C118.2 91.8 121.8 91.8 124.4 90.6" stroke="#9a5a44" strokeOpacity="0.4" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M110.8 84.6 C111.4 85.2 111.8 85.8 111.8 86.4 M129.2 84.6 C128.6 85.2 128.2 85.8 128.2 86.4" stroke="#8a4636" strokeOpacity="0.5" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* gentle cheek warmth */}
      <ellipse cx="102.5" cy="76" rx="8" ry="5" fill={`url(#${p}-blush)`} opacity={girl ? 1 : 0.55} />
      <ellipse cx="137.5" cy="76" rx="8" ry="5" fill={`url(#${p}-blush)`} opacity={girl ? 1 : 0.55} />
    </>
  );
}

const EAR = "M91 58 C85 55 82 65 85 72 C87 76 90 77 92 74 Z";
const EAR_INNER = "M89.6 61.6 C87 61 86 66 87.6 70";

function Neck({ p, x1, x2 }: { p: string; x1: number; x2: number }) {
  return (
    <>
      <path d={`M${x1} 88 L${x1} 116 C${x1 + 5} 121 ${x2 - 5} 121 ${x2} 116 L${x2} 88 Z`} fill={`url(#${p}-skin)`} />
      {/* soft shadow under the jaw, fading down the neck */}
      <path d={`M${x1} 92 C${x1 + 4} 102 ${x2 - 4} 102 ${x2} 92 L${x2} 116 C${x2 - 5} 121 ${x1 + 5} 121 ${x1} 116 Z`} fill={`url(#${p}-neck)`} />
    </>
  );
}

function BoyHead({ p }: { p: string }) {
  return (
    <>
      <FaceDefs p={p} />
      <Neck p={p} x1={110} x2={130} />
      <path d={EAR} fill="#c58d6b" />
      <path d={EAR} fill="#c58d6b" transform={MIRROR} />
      <path d={EAR_INNER} stroke="#9c6446" strokeOpacity="0.5" strokeWidth="1" fill="none" />
      <path d={EAR_INNER} stroke="#9c6446" strokeOpacity="0.5" strokeWidth="1" fill="none" transform={MIRROR} />
      {/* face: a defined, gently squared jaw */}
      <path
        d="M120 22 C139 22 150 37 150 57 C150 72 147 83 139 91 C133 97 126 100.5 120 100.5 C114 100.5 107 97 101 91 C93 83 90 72 90 57 C90 37 101 22 120 22 Z"
        fill={`url(#${p}-skin)`}
      />
      <path
        d="M120 22 C139 22 150 37 150 57 C150 72 147 83 139 91 C133 97 126 100.5 120 100.5 C114 100.5 107 97 101 91 C93 83 90 72 90 57 C90 37 101 22 120 22 Z"
        fill={`url(#${p}-face-shade)`}
      />
      <FaceFeatures p={p} girl={false} />
      {/* hair: short tapered sides, textured top swept to one side */}
      <path
        d="M89 60 C85 36 100 16 124 15 C146 14 160 31 154 58 C153 50 151 44 148 40 C147 34 140 30 131 30 C122 32 112 33 104 31 C98 37 93 46 92 56 Z"
        fill={`url(#${p}-hair)`}
      />
      <path
        d="M92 46 C96 30 112 20 132 21 C146 22 155 31 156 42 C150 34 142 31 133 31 C124 37 111 41 98 41 C96 42 94 44 92 46 Z"
        fill="#2b1e18"
      />
      <path d="M100 39 C110 36 122 32 131 30 C125 34 117 38 108 41 Z" fill="#3a2a22" />
      <path d="M101 26 C112 19 130 18 145 25" stroke={`url(#${p}-hair-sheen)`} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M106 33 C116 28 128 27 140 30 M112 37 C120 34 128 33 136 34" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M91 50 C89.6 56 89.6 61 90.4 65 M149 50 C150.4 56 150.4 61 149.6 65" stroke={HAIR} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
    </>
  );
}

function GirlHeadBack({ p }: { p: string }) {
  // long hair falling behind the shoulders, with a little volume
  return (
    <path
      d="M84 66 C77 28 96 9 120 9 C144 9 163 28 156 66 L161 150 C163 186 163 214 159 238 C151 247 138 247 132 237 L136 122 L104 122 L108 237 C102 247 89 247 81 238 C77 214 77 186 79 150 Z"
      fill={`url(#${p}-hair)`}
    />
  );
}

function GirlHead({ p }: { p: string }) {
  return (
    <>
      <FaceDefs p={p} />
      <Neck p={p} x1={111} x2={129} />
      {/* face: soft oval */}
      <path
        d="M120 24 C138 24 149 38 149 57 C149 73 145 84 136 92 C131 97 125 99.6 120 99.6 C115 99.6 109 97 104 92 C95 84 91 73 91 57 C91 38 102 24 120 24 Z"
        fill={`url(#${p}-skin)`}
      />
      <path
        d="M120 24 C138 24 149 38 149 57 C149 73 145 84 136 92 C131 97 125 99.6 120 99.6 C115 99.6 109 97 104 92 C95 84 91 73 91 57 C91 38 102 24 120 24 Z"
        fill={`url(#${p}-face-shade)`}
      />
      <FaceFeatures p={p} girl />
      {/* soft side part: the hair sweeps from the part over the forehead */}
      <path
        d="M88 70 C84 38 98 16 122 16 C144 16 158 34 153 68 C151 52 145 42 136 36 C128 31 120 30 112 32 C104 36 96 46 92 58 Z"
        fill={`url(#${p}-hair)`}
      />
      <path d="M112 31 C104 34 96 43 92 56 C96 49 103 42 112 38 C120 34 129 33 136 35 C129 31 120 30 112 31 Z" fill="#2c1f19" />
      {/* face-framing strands down both sides */}
      <path d="M91 56 C86 82 88 110 95 130 C93 106 93 84 97 62 Z" fill={HAIR} />
      <path d="M150 54 C156 90 157 130 153 172 C151 192 147 206 142 214 C145 190 147 150 144 112 C142 90 144 70 150 54 Z" fill="#2a1d17" />
      {/* shine */}
      <path d="M104 24 C115 18 131 18 143 25" stroke={`url(#${p}-hair-sheen)`} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M150 84 C152 112 152 140 149 168" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.4" fill="none" />
    </>
  );
}

// ---- boy --------------------------------------------------------------------
const B_SHIRT =
  "M84 118 C96 112 108 110 120 112 C132 110 144 112 156 118 L174 125 C180 128 183 136 184 146 L188 206 L170 211 L165 180 L162 280 L78 280 L75 180 L70 211 L52 206 L56 146 C57 136 60 128 66 125 Z";
const B_SHIRT_BODY =
  "M84 118 C96 112 108 110 120 112 C132 110 144 112 156 118 L170 124 L165 180 L162 280 L78 280 L75 180 L70 124 Z";
const B_ARM_LEFT =
  "M54 202 C50 232 48 264 49 298 C50 322 52 340 55 354 L68 354 C67 338 67 320 68 298 C69 264 71 234 72 208 Z";
const B_HAND_LEFT =
  "M54 350 C50 362 52 378 59 383 C66 386 72 378 71 368 C71 362 70 356 68 350 Z";
const B_SWEATER_BODY =
  "M84 119 L106 117 L120 186 L134 117 L156 119 L170 125 L165 186 L163 286 L77 286 L75 186 L70 125 Z";
const B_BLAZER_PANEL =
  "M84 115 L104 113 L114 190 L120 199 L120 314 L72 316 C71 270 71 230 73 186 C67 164 64 144 66 128 Z";
const B_SLEEVE_LEFT =
  "M66 126 C58 132 56 146 56 162 L49 346 L70 350 L75 188 C73 160 70 140 66 126 Z";

function Boy({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const LEG_LEFT =
    "M78 280 L120 280 L120 320 C116 328 114 338 113 352 L110 588 L80 588 C78 520 76 440 76 382 C75 332 76 302 78 280 Z";
  const LEG_RIGHT =
    "M120 280 L162 280 C165 302 166 332 165 382 C164 432 168 502 172 586 L142 588 C138 520 132 442 128 382 C126 352 124 332 121 320 Z";
  const SHOE_LEFT =
    "M80 582 L112 582 C114 590 115 598 113 603 C111 607 105 608 99 608 L66 608 C59 608 57 603 60 598 C63 591 70 586 80 582 Z";
  const SHOE_RIGHT =
    "M142 582 L172 581 C181 585 188 591 190 597 C192 603 188 607 182 607 L146 608 C140 608 138 600 140 592 Z";

  return (
    <>
      <ellipse cx="124" cy="610" rx="80" ry="9" fill="rgba(0,0,0,0.45)" />
      {/* A healthy build, matching the girl: the body is drawn a little
          fuller than the slim base shapes; the head keeps its size. */}
      <g transform="matrix(1.06 0 0 1 -7.2 0)">
      {/* legs */}
      {parts.socks && (
        <>
          <path d="M81 574 L112 574 L112 586 L81 586 Z" fill={fill("socks")} />
          <path
            d="M141 574 L171 573 L172 585 L142 586 Z"
            fill={fill("socks")}
          />
        </>
      )}
      {parts.pant ? (
        <>
          <Cloth d={LEG_LEFT} fill={fill("pant")} p={p} />
          <Cloth d={LEG_RIGHT} fill={fill("pant")} p={p} />
          <path
            d="M95 340 L95 584 M146 342 C148 420 152 500 157 584"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.3"
            fill="none"
          />
          <path
            d="M128 384 C132 392 136 396 140 398"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M82 566 C92 570 102 570 112 566 M142 566 C152 570 162 570 171 565"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
          />
        </>
      ) : (
        <>
          <path
            d="M84 398 L110 398 C110 440 109 500 108 540 L107 588 L88 588 L86 540 C85 500 84 440 84 398 Z"
            fill={`url(#${p}-skin)`}
          />
          <path
            d="M130 398 L156 398 C158 440 160 500 162 540 L166 586 L148 588 L144 540 C140 500 134 440 130 398 Z"
            fill={`url(#${p}-skin)`}
          />
          <ellipse cx="97" cy="452" rx="6" ry="4" fill="rgba(0,0,0,0.07)" />
          <ellipse cx="144" cy="452" rx="6" ry="4" fill="rgba(0,0,0,0.07)" />
          <Cloth
            d="M78 276 L162 276 C164 300 165 332 165 372 L166 404 L130 406 L121 326 L119 326 L110 406 L76 404 L76 372 C75 332 76 302 78 276 Z"
            fill={BASE_SHORTS}
            p={p}
          />
          <path
            d="M78 276 L162 276 L162 286 L78 286 Z"
            fill="rgba(0,0,0,0.14)"
          />
        </>
      )}
      {parts.shoes ? (
        <>
          <Cloth d={SHOE_LEFT} fill={fill("shoes")} p={p} />
          <Cloth d={SHOE_RIGHT} fill={fill("shoes")} p={p} />
          <path
            d="M70 597 C79 592 92 590 102 591 M150 594 C160 590 174 591 184 597"
            stroke="#fff"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M88 584 L108 584 C110 592 110 600 107 604 C104 607 98 607 92 606 L78 605 C72 604 71 599 75 595 C79 591 84 587 88 584 Z"
            fill={`url(#${p}-skin)`}
          />
          <path
            d="M148 584 L165 584 C171 588 176 593 177 598 C178 603 174 606 168 606 L152 606 C147 606 146 600 147 593 Z"
            fill={`url(#${p}-skin)`}
          />
        </>
      )}

      {/* relaxed arms and both hands (a long sleeve covers the arms) */}
      {!hasSweater && !hasBlazer && (
        <>
          <path d={B_ARM_LEFT} fill={`url(#${p}-skin)`} />
          <path d={B_ARM_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
        </>
      )}
      <path d={B_HAND_LEFT} fill={`url(#${p}-skin)`} />
      <path d={B_HAND_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
      <path
        d="M57 366 C60 370 64 371 67 369"
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="1.1"
        fill="none"
      />
      <path
        d="M57 366 C60 370 64 371 67 369"
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="1.1"
        fill="none"
        transform={MIRROR}
      />

      {parts.shirt ? (
        <>
          {/* shirt */}
          <Cloth
            d={hasSweater || hasBlazer ? B_SHIRT_BODY : B_SHIRT}
            fill={fill("shirt")}
            p={p}
          />
          {!hasSweater && !hasBlazer && (
            <path
              d="M52 206 L70 211 M170 211 L188 206"
              stroke={LINE}
              strokeWidth="1.4"
            />
          )}
          <path
            d="M84 242 C88 254 90 264 88 278 M156 242 C152 254 150 264 152 278"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M120 121 V278 M116.5 123 V278"
            stroke={SOFT_LINE}
            strokeWidth="1.1"
          />
          {[150, 178, 206, 234, 262].map((y) => (
            <circle
              key={y}
              cx="118.3"
              cy={y}
              r="2"
              fill="rgba(255,255,255,0.75)"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="0.6"
            />
          ))}
          <path
            d="M134 150 L155 150 L155 173 C149 176 140 176 134 173 Z"
            fill="none"
            stroke={LINE}
            strokeWidth="1.1"
          />
          <path
            d="M105 104 C112 111 128 111 135 104 L137 114 C128 121 112 121 103 114 Z"
            fill={fill("shirt")}
          />
          <path
            d="M105 104 C112 111 128 111 135 104 L137 114 C128 121 112 121 103 114 Z"
            fill="rgba(0,0,0,0.12)"
          />
          <path
            d="M120 123 L106 107 L93 116 C95 126 99 135 104 143 Z"
            fill={fill("shirt")}
            stroke={LINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path
            d="M120 123 L106 107 L93 116 C95 126 99 135 104 143 Z"
            fill={fill("shirt")}
            stroke={LINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
            transform={MIRROR}
          />
        </>
      ) : (
        <>
          {/* no shirt: skin, then a plain vest */}
          <path d={B_SHIRT_BODY} fill={`url(#${p}-skin)`} />
          {!hasSweater && !hasBlazer && (
            <>
              <path
                d="M70 122 C60 128 56 146 55 168 L53 208 L72 212 L75 180 C74 160 73 140 72 124 Z"
                fill={`url(#${p}-skin)`}
              />
              <path
                d="M70 122 C60 128 56 146 55 168 L53 208 L72 212 L75 180 C74 160 73 140 72 124 Z"
                fill={`url(#${p}-skin)`}
                transform={MIRROR}
              />
            </>
          )}
          <Cloth
            d="M90 116 C94 128 104 140 120 140 C136 140 146 128 150 116 L160 121 C161 140 162 160 163 182 L162 280 L78 280 L77 182 C78 160 79 140 80 121 Z"
            fill={BASE_TOP}
            p={p}
          />
        </>
      )}
      {parts.pant ? (
        <>
          {/* waistband, belt loops, fly, pocket opening (the hand is in it) */}
          <path d="M78 274 L162 274 L162 288 L78 288 Z" fill={fill("pant")} />
          <path
            d="M78 274 L162 274 L162 288 L78 288 Z"
            fill="rgba(0,0,0,0.16)"
          />
          {[90, 106, 134, 150].map((x) => (
            <rect
              key={x}
              x={x}
              y="273"
              width="3.4"
              height="16"
              rx="1"
              fill="rgba(0,0,0,0.2)"
            />
          ))}
          <path
            d="M121 288 V326 M121 312 C126 314 128 319 128 326"
            stroke={LINE}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M148 290 C152 300 156 310 160 318"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1.6"
            fill="none"
          />
        </>
      ) : null}
      {parts.belt && (
        <>
          <path d="M78 275 L162 275 L162 285 L78 285 Z" fill={fill("belt")} />
          <rect
            x="111"
            y="272"
            width="18"
            height="16"
            rx="2"
            fill={`url(#${p}-metal)`}
          />
          <rect
            x="114.5"
            y="275.5"
            width="11"
            height="9"
            rx="1"
            fill="rgba(0,0,0,0.25)"
          />
        </>
      )}

      {/* tie */}
      {parts.tie && (
        <>
          <Cloth
            d="M115 132 L125 132 L134 236 L120 254 L106 236 Z"
            fill={fill("tie")}
            p={p}
            light={false}
          />
          <path d="M120 134 V250" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          <Cloth
            d="M113 115 L127 115 L125 132 L115 132 Z"
            fill={fill("tie")}
            p={p}
            light={false}
          />
        </>
      )}

      {hasSweater && (
        <>
          <Cloth d={B_SWEATER_BODY} fill={fill("sweater")} p={p} />
          <Cloth d={B_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={B_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          </g>
          <path
            d="M77 272 L163 272 L163 286 L77 286 Z"
            fill={`url(#${p}-rib)`}
          />
          <path d="M49 334 L69 338 L69 348 L49 344 Z" fill={`url(#${p}-rib)`} />
          <path
            d="M49 334 L69 338 L69 348 L49 344 Z"
            fill={`url(#${p}-rib)`}
            transform={MIRROR}
          />
          <path
            d="M106 117 L120 186 L134 117"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="4"
            fill="none"
            strokeLinejoin="round"
          />
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
          <path
            d="M104 113 L95 126 L103 148 L96 155 L114 190 Z"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />
          <path
            d="M104 113 L95 126 L103 148 L96 155 L114 190 Z"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
            transform={MIRROR}
          />
          <path d="M120 199 V314" stroke={LINE} strokeWidth="1.3" />
          <path
            d="M78 270 L106 270 L106 278 L78 278 Z M134 270 L162 270 L162 278 L134 278 Z"
            fill="rgba(0,0,0,0.22)"
          />
          <path
            d="M138 142 L153 142 L153 154 C153 160 149 164 145.5 165.5 C142 164 138 160 138 154 Z"
            fill="rgba(255,255,255,0.14)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.1"
          />
          <path
            d="M141.5 149 L145.5 153 L150 147"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.1"
            fill="none"
          />
          {[226, 262].map((y) => (
            <circle
              key={y}
              cx="120"
              cy={y}
              r="3"
              fill="rgba(0,0,0,0.4)"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.8"
            />
          ))}
          <path
            d="M58 248 C62 254 66 256 70 254"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
          />
        </>
      )}

      {hasSweater && !hasBlazer && (
        <>
          <path
            d="M56 248 C60 254 64 256 68 254"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M56 248 C60 254 64 256 68 254"
            stroke={SOFT_LINE}
            strokeWidth="1.2"
            fill="none"
            transform={MIRROR}
          />
        </>
      )}

      </g>
      <BoyHead p={p} />
    </>
  );
}

// ---- girl -------------------------------------------------------------------
const G_SHIRT =
  "M90 120 C100 114 110 112 120 114 C130 112 140 114 150 120 L166 127 C172 130 175 138 176 148 L180 204 L163 209 L158 180 L155 268 L85 268 L82 180 L77 209 L60 204 L64 148 C65 138 68 130 74 127 Z";
const G_SHIRT_BODY =
  "M90 120 C100 114 110 112 120 114 C130 112 140 114 150 120 L162 126 L158 180 L155 268 L85 268 L82 180 L78 126 Z";
const G_ARM_LEFT =
  "M62 200 C58 230 57 260 58 292 C59 314 61 332 63 344 L75 344 C74 330 74 314 75 292 C76 260 78 232 79 206 Z";
const G_HAND_LEFT =
  "M62 340 C58 351 60 366 66 370 C72 373 78 366 77 357 C77 351 76 346 75 340 Z";
const G_SWEATER_BODY =
  "M90 121 L108 119 L120 182 L132 119 L150 121 L162 127 L158 186 L156 274 L84 274 L82 186 L78 127 Z";
const G_BLAZER_PANEL =
  "M90 117 L106 115 L115 186 L120 194 L120 300 L80 302 C79 262 79 228 81 186 C75 166 72 146 74 130 Z";
const G_SLEEVE_LEFT =
  "M74 128 C66 134 64 148 64 164 L58 338 L77 342 L82 190 C80 162 78 142 74 128 Z";

function Girl({ parts, p }: { parts: ChosenParts; p: string }) {
  const fill = (key: DesignPartKey) => partFill(key, parts[key], p);
  const hasSweater = Boolean(parts.sweater);
  const hasBlazer = Boolean(parts.blazer);
  const LEG_LEFT =
    "M92 404 L114 404 C114 448 113 498 112 540 L110 588 L94 588 L92 540 C91 498 91 448 92 404 Z";
  const LEG_RIGHT =
    "M126 404 L148 404 C150 448 152 498 154 540 L158 586 L142 588 L138 540 C134 498 128 448 126 404 Z";
  const SOCK_LEFT =
    "M91.6 470 L113.4 470 C113 500 112.5 528 112 548 L110 590 L94 590 L92.4 548 C92 528 91.7 500 91.6 470 Z";
  const SOCK_RIGHT =
    "M130 470 L151 470 C152 500 153 528 154.6 548 L158.6 588 L142 590 L138.4 548 C136 528 133 500 130 470 Z";
  const SHOE_LEFT =
    "M93 582 L111 582 C113 590 114 598 112 602 C110 606 104 607 98 607 L82 607 C76 607 74 602 77 597 C80 590 86 585 93 582 Z";
  const SHOE_RIGHT =
    "M142 582 L158 581 C166 585 172 591 174 597 C176 603 172 606 166 606 L146 607 C140 607 139 600 140 592 Z";
  const tops = [90, 100, 110, 120, 130, 140, 150];
  const bottom = (x: number) => 62 + ((x - 86) / 68) * 116;

  return (
    <>
      <ellipse cx="122" cy="610" rx="66" ry="8" fill="rgba(0,0,0,0.45)" />
      <GirlHeadBack p={p} />
      {/* A healthy, ordinary build: the body is drawn about 10% fuller
          than the slim base shapes, while the head and hair keep their size. */}
      <g transform="matrix(1.1 0 0 1 -12 0)">
      {/* legs, socks, shoes */}
      <path d={LEG_LEFT} fill={`url(#${p}-skin)`} />
      <path d={LEG_RIGHT} fill={`url(#${p}-skin)`} />
      {parts.socks && (
        <>
          <Cloth d={SOCK_LEFT} fill={fill("socks")} p={p} light={false} />
          <Cloth d={SOCK_RIGHT} fill={fill("socks")} p={p} light={false} />
          <path
            d="M91.6 470 L113.4 470 L113.3 478 L91.7 478 Z M130 470 L151 470 L151.4 478 L131 478 Z"
            fill={`url(#${p}-rib)`}
          />
        </>
      )}
      {parts.shoes ? (
        <>
          <Cloth d={SHOE_LEFT} fill={fill("shoes")} p={p} />
          <Cloth d={SHOE_RIGHT} fill={fill("shoes")} p={p} />
          <path
            d="M90 590 L111 588 M141 589 L162 588"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.4"
          />
          <path
            d="M82 597 C90 593 100 592 107 593 M148 595 C156 592 166 593 171 597"
            stroke="#fff"
            strokeOpacity="0.26"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M95 584 L110 584 C112 592 112 599 109 603 C106 606 100 606 95 605 L84 604 C79 603 78 599 81 595 C85 591 90 587 95 584 Z"
            fill={`url(#${p}-skin)`}
          />
          <path
            d="M143 584 L157 584 C163 588 167 593 168 598 C169 602 165 605 160 605 L147 605 C143 605 142 599 143 593 Z"
            fill={`url(#${p}-skin)`}
          />
        </>
      )}

      {/* arms */}
      {!hasSweater && !hasBlazer && (
        <>
          <path d={G_ARM_LEFT} fill={`url(#${p}-skin)`} />
          <path d={G_ARM_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />
        </>
      )}
      <path d={G_HAND_LEFT} fill={`url(#${p}-skin)`} />
      <path d={G_HAND_LEFT} fill={`url(#${p}-skin)`} transform={MIRROR} />

      {parts.shirt ? (
        <>
          {/* shirt */}
          <Cloth
            d={hasSweater || hasBlazer ? G_SHIRT_BODY : G_SHIRT}
            fill={fill("shirt")}
            p={p}
          />
          {!hasSweater && !hasBlazer && (
            <path
              d="M60 204 L77 209 M163 209 L180 204"
              stroke={LINE}
              strokeWidth="1.3"
            />
          )}
          <path d="M120 122 V266" stroke={SOFT_LINE} strokeWidth="1.1" />
          {[148, 174, 200, 226].map((y) => (
            <circle
              key={y}
              cx="118.6"
              cy={y}
              r="1.8"
              fill="rgba(255,255,255,0.75)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="0.5"
            />
          ))}
          <path
            d="M107 106 C113 112 127 112 133 106 L135 115 C127 121 113 121 105 115 Z"
            fill={fill("shirt")}
          />
          <path
            d="M107 106 C113 112 127 112 133 106 L135 115 C127 121 113 121 105 115 Z"
            fill="rgba(0,0,0,0.12)"
          />
          <path
            d="M120 124 L108 109 L96 117 C98 126 101 134 105 141 Z"
            fill={fill("shirt")}
            stroke={LINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path
            d="M120 124 L108 109 L96 117 C98 126 101 134 105 141 Z"
            fill={fill("shirt")}
            stroke={LINE}
            strokeWidth="1.1"
            strokeLinejoin="round"
            transform={MIRROR}
          />
        </>
      ) : (
        <>
          {/* no shirt: skin, then a plain vest top */}
          <path d={G_SHIRT_BODY} fill={`url(#${p}-skin)`} />
          {!hasSweater && !hasBlazer && (
            <>
              <path
                d="M78 124 C68 130 64 148 63 170 L60 206 L78 210 L82 180 C81 160 80 142 80 126 Z"
                fill={`url(#${p}-skin)`}
              />
              <path
                d="M78 124 C68 130 64 148 63 170 L60 206 L78 210 L82 180 C81 160 80 142 80 126 Z"
                fill={`url(#${p}-skin)`}
                transform={MIRROR}
              />
            </>
          )}
          <Cloth
            d="M95 117 C99 127 108 133 120 133 C132 133 141 127 145 117 L156 122 C157 140 158 160 158 180 L155 268 L85 268 L82 180 C82 160 83 140 84 122 Z"
            fill={BASE_TOP}
            p={p}
          />
        </>
      )}
      {parts.tie && (
        <>
          <Cloth
            d="M116 131 L124 131 L131 222 L120 238 L109 222 Z"
            fill={fill("tie")}
            p={p}
            light={false}
          />
          <Cloth
            d="M114.5 116 L125.5 116 L124 131 L116 131 Z"
            fill={fill("tie")}
            p={p}
            light={false}
          />
        </>
      )}

      {hasSweater && (
        <>
          <Cloth d={G_SWEATER_BODY} fill={fill("sweater")} p={p} />
          <Cloth d={G_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          <g transform={MIRROR}>
            <Cloth d={G_SLEEVE_LEFT} fill={fill("sweater")} p={p} />
          </g>
          <path
            d="M84 262 L156 262 L156 274 L84 274 Z"
            fill={`url(#${p}-rib)`}
          />
          <path d="M58 326 L77 330 L77 340 L58 336 Z" fill={`url(#${p}-rib)`} />
          <path
            d="M58 326 L77 330 L77 340 L58 336 Z"
            fill={`url(#${p}-rib)`}
            transform={MIRROR}
          />
          <path
            d="M108 119 L120 182 L132 119"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="3.6"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      )}

      {parts.skirt ? (
        <>
          {/* skirt */}
          <Cloth
            d="M86 268 L154 268 L178 410 C140 416 100 416 62 410 Z"
            fill={fill("skirt")}
            p={p}
          />
          {tops
            .slice(0, -1)
            .map((x, i) =>
              i % 2 === 0 ? (
                <path
                  key={x}
                  d={`M${x} 270 L${tops[i + 1]} 270 L${bottom(tops[i + 1])} 412 L${bottom(x)} 412 Z`}
                  fill="rgba(0,0,0,0.11)"
                />
              ) : null,
            )}
          {tops.map((x) => (
            <path
              key={x}
              d={`M${x} 270 L${bottom(x)} 412`}
              stroke={SOFT_LINE}
              strokeWidth="1.1"
            />
          ))}
          <path
            d="M86 258 L154 258 L154.6 270 L85.4 270 Z"
            fill={fill("skirt")}
          />
          <path
            d="M86 258 L154 258 L154.6 270 L85.4 270 Z"
            fill="rgba(0,0,0,0.18)"
          />
        </>
      ) : (
        <>
          <Cloth
            d="M86 258 L154 258 C156 290 158 330 158 372 L159 406 L126 408 L121 300 L119 300 L114 408 L81 406 L82 372 C82 330 84 290 86 258 Z"
            fill={BASE_SHORTS}
            p={p}
          />
          <path
            d="M86 258 L154 258 L154.4 268 L85.6 268 Z"
            fill="rgba(0,0,0,0.14)"
          />
        </>
      )}
      {parts.belt && (
        <>
          <path
            d="M86 260 L154 260 L154.4 268 L85.6 268 Z"
            fill={fill("belt")}
          />
          <rect
            x="112"
            y="257"
            width="16"
            height="14"
            rx="2"
            fill={`url(#${p}-metal)`}
          />
          <rect
            x="115"
            y="260"
            width="10"
            height="8"
            rx="1"
            fill="rgba(0,0,0,0.25)"
          />
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
          <path
            d="M106 115 L98 127 L105 147 L99 153 L115 186 Z"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />
          <path
            d="M106 115 L98 127 L105 147 L99 153 L115 186 Z"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
            transform={MIRROR}
          />
          <path d="M120 194 V300" stroke={LINE} strokeWidth="1.2" />
          <path
            d="M84 262 L106 262 L106 269 L84 269 Z M134 262 L156 262 L156 269 L134 269 Z"
            fill="rgba(0,0,0,0.22)"
          />
          <path
            d="M136 140 L149 140 L149 150 C149 155 146 159 142.5 160.5 C139 159 136 155 136 150 Z"
            fill="rgba(255,255,255,0.14)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1"
          />
          {[214, 244].map((y) => (
            <circle
              key={y}
              cx="120"
              cy={y}
              r="2.7"
              fill="rgba(0,0,0,0.4)"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.8"
            />
          ))}
        </>
      )}

      </g>
      <GirlHead p={p} />
    </>
  );
}

function Figure({
  parts,
  idPrefix,
  girl,
}: {
  parts: ChosenParts;
  idPrefix: string;
  girl: boolean;
}) {
  return (
    <svg
      viewBox="0 0 240 624"
      role="img"
      aria-label={
        girl
          ? "Girl wearing the chosen uniform"
          : "Boy wearing the chosen uniform"
      }
      className="h-full w-auto max-w-full"
    >
      <FigureDefs p={idPrefix} parts={parts} />
      {girl ? (
        <Girl parts={parts} p={idPrefix} />
      ) : (
        <Boy parts={parts} p={idPrefix} />
      )}
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
    <div
      className={cn(
        "flex h-full items-end justify-center gap-1 sm:gap-6",
        className,
      )}
    >
      {view !== "girl" && (
        <Figure parts={parts} idPrefix={`${idPrefix}-b`} girl={false} />
      )}
      {view !== "boy" && (
        <Figure parts={parts} idPrefix={`${idPrefix}-g`} girl />
      )}
    </div>
  );
}

/** A sample's swatch: its photo, or a square of cloth painted in its
 * colour and pattern, with a fine twill texture and a soft fold of light. */
export function SampleSwatch({
  sample,
  className,
}: {
  sample: DesignSample;
  className?: string;
}) {
  if (sample.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an admin-uploaded photo from our own photo store
      <img
        src={sample.photoUrl}
        alt=""
        className={cn("object-cover", className)}
      />
    );
  }
  const id = `swatch-${sample.id}`;
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <FabricPatterns parts={{ shirt: sample }} idPrefix={id} scale={0.9} />
        <pattern
          id={`${id}-twill`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
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
