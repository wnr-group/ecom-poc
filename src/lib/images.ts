import type { ImageKind } from './types';
import { Rng, hashString } from './rng';

/**
 * Product imagery is generated as inline SVG data URIs.
 *
 * A marketplace mock needs ~200 distinct product shots. Remote image hosts are
 * unreliable (rate limits, offline demos, broken thumbnails on a sales call),
 * so instead we render "studio shots": a tinted seamless backdrop, a contact
 * shadow, and a vector silhouette per category. Same seed → same image, so
 * grids never reshuffle between renders.
 */

/* ── colour helpers ──────────────────────────────────────────────────────── */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Mix `hex` toward white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return toHex([r + (target - r) * t, g + (target - g) * t, b + (target - b) * t]);
}

/* ── shape library ───────────────────────────────────────────────────────── */

interface Palette {
  accent: string;
  accentDark: string;
  accentLight: string;
  body: string;
  bodyDark: string;
  bodyLight: string;
  metal: string;
  glass: string;
}

type ShapeFn = (p: Palette, r: Rng) => string;

const SHAPES: Record<ImageKind, ShapeFn> = {
  laptop: (p) => `
    <path d="M118 232 L282 232 L306 268 L94 268 Z" fill="${p.bodyDark}"/>
    <path d="M118 232 L282 232 L292 250 L108 250 Z" fill="${p.body}"/>
    <rect x="128" y="118" width="144" height="116" rx="7" fill="${p.bodyDark}"/>
    <rect x="135" y="125" width="130" height="98" rx="3" fill="${p.glass}"/>
    <path d="M135 125 h130 v98 h-130 z" fill="url(#screenGlow)"/>
    <rect x="145" y="140" width="52" height="6" rx="3" fill="${p.accent}" opacity=".9"/>
    <rect x="145" y="154" width="86" height="4" rx="2" fill="${p.accentLight}" opacity=".65"/>
    <rect x="145" y="165" width="66" height="4" rx="2" fill="${p.accentLight}" opacity=".45"/>
    <rect x="145" y="182" width="106" height="28" rx="4" fill="${p.accent}" opacity=".18"/>
    <rect x="176" y="256" width="48" height="5" rx="2.5" fill="${p.bodyLight}" opacity=".8"/>`,

  phone: (p) => `
    <rect x="152" y="82" width="96" height="196" rx="18" fill="${p.bodyDark}"/>
    <rect x="158" y="88" width="84" height="184" rx="14" fill="${p.glass}"/>
    <rect x="158" y="88" width="84" height="184" rx="14" fill="url(#screenGlow)"/>
    <rect x="186" y="94" width="28" height="6" rx="3" fill="${p.bodyDark}"/>
    <rect x="168" y="118" width="46" height="7" rx="3.5" fill="${p.accent}"/>
    <rect x="168" y="134" width="64" height="5" rx="2.5" fill="${p.accentLight}" opacity=".7"/>
    <rect x="168" y="152" width="64" height="46" rx="6" fill="${p.accent}" opacity=".22"/>
    <rect x="168" y="206" width="30" height="30" rx="8" fill="${p.accent}" opacity=".5"/>
    <rect x="204" y="206" width="30" height="30" rx="8" fill="${p.accent}" opacity=".28"/>
    <rect x="176" y="252" width="48" height="5" rx="2.5" fill="${p.accentLight}" opacity=".6"/>
    <rect x="248" y="126" width="4" height="26" rx="2" fill="${p.metal}"/>`,

  headphone: (p) => `
    <path d="M124 196 v-32 a76 76 0 0 1 152 0 v32" fill="none" stroke="${p.bodyDark}" stroke-width="16" stroke-linecap="round"/>
    <path d="M132 190 v-26 a68 68 0 0 1 136 0 v26" fill="none" stroke="${p.accent}" stroke-width="4" opacity=".45"/>
    <rect x="104" y="184" width="44" height="72" rx="20" fill="${p.body}"/>
    <rect x="252" y="184" width="44" height="72" rx="20" fill="${p.body}"/>
    <rect x="112" y="194" width="28" height="52" rx="14" fill="${p.accent}" opacity=".9"/>
    <rect x="260" y="194" width="28" height="52" rx="14" fill="${p.accent}" opacity=".9"/>
    <circle cx="126" cy="220" r="6" fill="${p.bodyDark}" opacity=".55"/>
    <circle cx="274" cy="220" r="6" fill="${p.bodyDark}" opacity=".55"/>`,

  watch: (p) => `
    <rect x="176" y="76" width="48" height="72" rx="16" fill="${p.metal}"/>
    <rect x="176" y="252" width="48" height="72" rx="16" fill="${p.metal}"/>
    <rect x="146" y="132" width="108" height="136" rx="30" fill="${p.bodyDark}"/>
    <rect x="154" y="140" width="92" height="120" rx="24" fill="${p.glass}"/>
    <rect x="154" y="140" width="92" height="120" rx="24" fill="url(#screenGlow)"/>
    <text x="200" y="196" font-family="Inter,sans-serif" font-size="34" font-weight="700" fill="${p.accentLight}" text-anchor="middle">9:41</text>
    <rect x="170" y="212" width="60" height="5" rx="2.5" fill="${p.accent}"/>
    <circle cx="200" cy="238" r="12" fill="none" stroke="${p.accent}" stroke-width="3.5" opacity=".8"/>
    <rect x="252" y="176" width="7" height="22" rx="3.5" fill="${p.metal}"/>`,

  camera: (p) => `
    <rect x="96" y="146" width="208" height="128" rx="16" fill="${p.bodyDark}"/>
    <rect x="150" y="124" width="72" height="26" rx="8" fill="${p.bodyDark}"/>
    <rect x="96" y="146" width="208" height="26" rx="12" fill="${p.body}" opacity=".22"/>
    <circle cx="196" cy="212" r="52" fill="${p.metal}"/>
    <circle cx="196" cy="212" r="42" fill="${p.bodyDark}"/>
    <circle cx="196" cy="212" r="30" fill="${p.glass}"/>
    <circle cx="196" cy="212" r="30" fill="url(#screenGlow)"/>
    <circle cx="186" cy="200" r="9" fill="${p.accentLight}" opacity=".6"/>
    <circle cx="272" cy="170" r="8" fill="${p.accent}"/>
    <rect x="238" y="196" width="42" height="14" rx="7" fill="${p.body}" opacity=".3"/>`,

  tv: (p) => `
    <rect x="62" y="104" width="276" height="164" rx="8" fill="${p.bodyDark}"/>
    <rect x="70" y="112" width="260" height="148" rx="4" fill="${p.glass}"/>
    <rect x="70" y="112" width="260" height="148" rx="4" fill="url(#screenGlow)"/>
    <path d="M70 220 L140 160 L196 200 L252 148 L330 214 v46 H70 Z" fill="${p.accent}" opacity=".35"/>
    <circle cx="118" cy="146" r="16" fill="${p.accentLight}" opacity=".55"/>
    <rect x="176" y="268" width="48" height="26" fill="${p.metal}"/>
    <rect x="128" y="292" width="144" height="10" rx="5" fill="${p.bodyDark}"/>`,

  speaker: (p, r) => `
    <rect x="146" y="86" width="108" height="222" rx="26" fill="${p.bodyDark}"/>
    <rect x="156" y="96" width="88" height="150" rx="18" fill="${p.body}" opacity=".18"/>
    ${Array.from({ length: 24 }, (_, i) => {
      const cx = 172 + (i % 6) * 14;
      const cy = 114 + Math.floor(i / 6) * 22;
      return `<circle cx="${cx}" cy="${cy}" r="3.4" fill="${p.metal}" opacity=".7"/>`;
    }).join('')}
    <circle cx="200" cy="268" r="22" fill="${p.accent}" opacity=".85"/>
    <circle cx="200" cy="268" r="9" fill="${p.bodyDark}"/>
    <rect x="${168 + r.int(0, 2)}" y="236" width="64" height="5" rx="2.5" fill="${p.accentLight}" opacity=".7"/>`,

  apparel: (p) => `
    <path d="M148 96 L120 112 L96 168 L130 184 L136 168 L136 300 h128 V168 l6 16 34 -16 -24 -56 -28 -16 -16 22 h-44 z"
      fill="${p.body}" stroke="${p.bodyDark}" stroke-width="3"/>
    <path d="M164 96 h72 l-16 22 h-40 z" fill="${p.bodyDark}" opacity=".2"/>
    <path d="M136 240 h128 v18 H136 z" fill="${p.accent}" opacity=".8"/>
    <circle cx="200" cy="196" r="20" fill="${p.accent}" opacity=".22"/>
    <path d="M190 196 l8 8 14 -16" fill="none" stroke="${p.accent}" stroke-width="4" stroke-linecap="round"/>`,

  shoe: (p) => `
    <path d="M78 250 q6 -34 40 -40 l32 -6 24 -34 26 6 -8 26 32 4 q52 8 76 34 q14 14 8 30 H86 q-10 -8 -8 -20 z"
      fill="${p.body}" stroke="${p.bodyDark}" stroke-width="3"/>
    <path d="M78 262 h238 q4 20 -14 20 H90 q-14 0 -12 -20 z" fill="${p.bodyDark}"/>
    <path d="M150 210 q28 6 44 26" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linecap="round"/>
    <path d="M166 190 q30 8 48 30" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linecap="round" opacity=".6"/>
    <path d="M244 216 q30 6 44 24" fill="none" stroke="${p.accentLight}" stroke-width="5" stroke-linecap="round"/>`,

  bag: (p) => `
    <path d="M160 132 v-14 a40 40 0 0 1 80 0 v14" fill="none" stroke="${p.bodyDark}" stroke-width="10" stroke-linecap="round"/>
    <path d="M112 132 h176 l16 156 a14 14 0 0 1 -14 16 H110 a14 14 0 0 1 -14 -16 z" fill="${p.body}" stroke="${p.bodyDark}" stroke-width="3"/>
    <rect x="96" y="184" width="208" height="34" fill="${p.accent}" opacity=".85"/>
    <rect x="182" y="196" width="36" height="26" rx="5" fill="${p.metal}"/>
    <rect x="190" y="204" width="20" height="4" rx="2" fill="${p.bodyDark}" opacity=".5"/>`,

  cosmetic: (p) => `
    <rect x="164" y="120" width="72" height="164" rx="12" fill="${p.glass}" opacity=".92"/>
    <rect x="164" y="120" width="72" height="164" rx="12" fill="url(#screenGlow)"/>
    <rect x="164" y="196" width="72" height="88" rx="12" fill="${p.accent}" opacity=".8"/>
    <rect x="182" y="86" width="36" height="38" rx="6" fill="${p.bodyDark}"/>
    <rect x="190" y="74" width="20" height="16" rx="4" fill="${p.metal}"/>
    <rect x="176" y="216" width="48" height="6" rx="3" fill="#fff" opacity=".75"/>
    <rect x="176" y="230" width="32" height="4" rx="2" fill="#fff" opacity=".5"/>
    <rect x="172" y="132" width="10" height="48" rx="5" fill="#fff" opacity=".35"/>`,

  bottle: (p) => `
    <path d="M172 112 h56 v18 q22 12 22 40 v104 a20 20 0 0 1 -20 20 h-60 a20 20 0 0 1 -20 -20 V170 q0 -28 22 -40 z"
      fill="${p.metal}" stroke="${p.bodyDark}" stroke-width="3"/>
    <path d="M172 196 h56 v78 a20 20 0 0 1 -20 20 h-16 a20 20 0 0 1 -20 -20 z" fill="${p.accent}" opacity=".85"/>
    <rect x="176" y="84" width="48" height="30" rx="8" fill="${p.bodyDark}"/>
    <rect x="184" y="216" width="32" height="6" rx="3" fill="#fff" opacity=".7"/>
    <rect x="160" y="164" width="9" height="86" rx="4.5" fill="#fff" opacity=".3"/>`,

  book: (p) => `
    <path d="M112 96 h168 a10 10 0 0 1 10 10 v198 a10 10 0 0 1 -10 10 H112 z" fill="${p.accent}"/>
    <path d="M112 96 h22 v218 h-22 z" fill="${p.accentDark}"/>
    <path d="M290 106 l14 8 v192 l-14 8 z" fill="${p.bodyLight}"/>
    <rect x="152" y="140" width="112" height="8" rx="4" fill="#fff" opacity=".92"/>
    <rect x="152" y="158" width="82" height="8" rx="4" fill="#fff" opacity=".7"/>
    <rect x="152" y="248" width="60" height="6" rx="3" fill="#fff" opacity=".55"/>
    <circle cx="208" cy="204" r="24" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>`,

  ball: (p) => `
    <circle cx="200" cy="200" r="94" fill="${p.body}" stroke="${p.bodyDark}" stroke-width="3"/>
    <circle cx="200" cy="200" r="94" fill="url(#sphereShade)"/>
    <path d="M200 106 q40 44 0 188 q-40 -44 0 -188 z" fill="${p.accent}" opacity=".85"/>
    <path d="M106 200 q94 -40 188 0 q-94 40 -188 0 z" fill="${p.accentDark}" opacity=".55"/>
    <circle cx="200" cy="200" r="16" fill="${p.bodyDark}" opacity=".18"/>`,

  lamp: (p) => `
    <rect x="140" y="292" width="120" height="14" rx="7" fill="${p.bodyDark}"/>
    <path d="M200 292 v-96" stroke="${p.metal}" stroke-width="10" stroke-linecap="round"/>
    <path d="M200 200 q0 -60 56 -74" stroke="${p.metal}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M222 118 l68 -22 22 58 -68 22 z" fill="${p.accent}"/>
    <ellipse cx="278" cy="184" rx="52" ry="16" fill="${p.accentLight}" opacity=".35"/>
    <circle cx="256" cy="146" r="10" fill="#FFF6E5"/>`,

  cookware: (p) => `
    <ellipse cx="188" cy="222" rx="92" ry="30" fill="${p.bodyDark}"/>
    <path d="M96 216 a92 30 0 0 0 184 0 v-6 a92 30 0 0 1 -184 0 z" fill="${p.bodyDark}"/>
    <ellipse cx="188" cy="208" rx="92" ry="30" fill="${p.metal}"/>
    <ellipse cx="188" cy="208" rx="74" ry="22" fill="${p.accent}" opacity=".28"/>
    <path d="M278 202 h44 a14 14 0 0 1 0 28 h-44" fill="none" stroke="${p.bodyDark}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="188" cy="204" rx="34" ry="10" fill="#fff" opacity=".25"/>`,

  chair: (p) => `
    <path d="M148 96 h104 a16 16 0 0 1 16 16 v92 a16 16 0 0 1 -16 16 H148 a16 16 0 0 1 -16 -16 v-92 a16 16 0 0 1 16 -16 z" fill="${p.accent}"/>
    <rect x="128" y="216" width="144" height="30" rx="12" fill="${p.bodyDark}"/>
    <path d="M200 246 v34" stroke="${p.metal}" stroke-width="12"/>
    <path d="M144 306 l56 -26 56 26" fill="none" stroke="${p.metal}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="140" cy="310" r="9" fill="${p.bodyDark}"/>
    <circle cx="260" cy="310" r="9" fill="${p.bodyDark}"/>
    <rect x="148" y="120" width="72" height="6" rx="3" fill="#fff" opacity=".35"/>`,

  toy: (p) => `
    <rect x="150" y="110" width="100" height="80" rx="16" fill="${p.accent}"/>
    <circle cx="178" cy="146" r="12" fill="#fff"/><circle cx="222" cy="146" r="12" fill="#fff"/>
    <circle cx="178" cy="148" r="5" fill="${p.bodyDark}"/><circle cx="222" cy="148" r="5" fill="${p.bodyDark}"/>
    <path d="M180 170 q20 12 40 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="162" y="198" width="76" height="66" rx="12" fill="${p.metal}"/>
    <rect x="120" y="206" width="36" height="16" rx="8" fill="${p.accentDark}"/>
    <rect x="244" y="206" width="36" height="16" rx="8" fill="${p.accentDark}"/>
    <rect x="172" y="268" width="20" height="34" rx="8" fill="${p.bodyDark}"/>
    <rect x="208" y="268" width="20" height="34" rx="8" fill="${p.bodyDark}"/>
    <rect x="188" y="92" width="8" height="22" rx="4" fill="${p.bodyDark}"/><circle cx="192" cy="88" r="7" fill="${p.accentLight}"/>`,

  carpart: (p) => `
    <circle cx="200" cy="200" r="96" fill="${p.bodyDark}"/>
    <circle cx="200" cy="200" r="96" fill="url(#sphereShade)"/>
    <circle cx="200" cy="200" r="62" fill="${p.metal}"/>
    <circle cx="200" cy="200" r="20" fill="${p.accent}"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return `<path d="M200 200 L${(200 + Math.cos(a) * 58).toFixed(1)} ${(200 + Math.sin(a) * 58).toFixed(1)}" stroke="${p.bodyDark}" stroke-width="14" stroke-linecap="round" opacity=".85"/>`;
    }).join('')}
    <circle cx="200" cy="200" r="79" fill="none" stroke="${p.accentDark}" stroke-width="6" opacity=".5"/>`,

  grocery: (p) => `
    <path d="M138 128 h124 l-10 176 a12 12 0 0 1 -12 11 H160 a12 12 0 0 1 -12 -11 z" fill="${p.body}" stroke="${p.bodyDark}" stroke-width="3"/>
    <path d="M138 128 h124 l-3 46 H141 z" fill="${p.accent}"/>
    <rect x="166" y="96" width="68" height="34" rx="6" fill="${p.bodyDark}"/>
    <rect x="160" y="196" width="80" height="8" rx="4" fill="${p.accentDark}" opacity=".8"/>
    <rect x="160" y="214" width="54" height="6" rx="3" fill="${p.bodyDark}" opacity=".35"/>
    <circle cx="200" cy="256" r="26" fill="${p.accent}" opacity=".26"/>
    <path d="M188 256 q12 -18 24 0 q-12 18 -24 0z" fill="${p.accentDark}" opacity=".7"/>`,

  console: (p) => `
    <path d="M118 176 h164 a54 54 0 0 1 46 78 l-12 22 a26 26 0 0 1 -40 6 l-26 -22 h-100 l-26 22 a26 26 0 0 1 -40 -6 l-12 -22 a54 54 0 0 1 46 -78 z"
      fill="${p.bodyDark}"/>
    <rect x="140" y="200" width="12" height="38" rx="6" fill="${p.accentLight}"/>
    <rect x="127" y="213" width="38" height="12" rx="6" fill="${p.accentLight}"/>
    <circle cx="256" cy="204" r="9" fill="${p.accent}"/><circle cx="278" cy="222" r="9" fill="${p.accent}"/>
    <circle cx="234" cy="222" r="9" fill="${p.accent}"/><circle cx="256" cy="240" r="9" fill="${p.accent}"/>
    <circle cx="182" cy="248" r="14" fill="${p.metal}"/><circle cx="222" cy="248" r="14" fill="${p.metal}"/>
    <rect x="184" y="182" width="32" height="8" rx="4" fill="${p.metal}" opacity=".7"/>`,
};

/* ── composition ─────────────────────────────────────────────────────────── */

function buildSvg(kind: ImageKind, tint: string, seed: string, size: number): string {
  const rng = new Rng(`${seed}:${kind}`);
  const palette: Palette = {
    accent: tint,
    accentDark: shade(tint, -0.25),
    accentLight: shade(tint, 0.45),
    body: '#E4E9F0',
    bodyDark: '#2B3547',
    bodyLight: '#F4F6FA',
    metal: '#BCC5D3',
    glass: '#1A2333',
  };
  const bgA = shade(tint, 0.9);
  const bgB = shade(tint, 0.72);
  const rotate = rng.float(-3, 3, 1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.72">
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="${shade(tint, -0.2)}" stop-opacity="0.16"/>
    </radialGradient>
    <linearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.55"/><stop offset="1" stop-color="#0B1220" stop-opacity="0.15"/>
    </linearGradient>
    <radialGradient id="sphereShade" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="1" stop-color="#0B1220" stop-opacity="0.28"/>
    </radialGradient>
    <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#0B1220" stop-opacity="0.28"/><stop offset="1" stop-color="#0B1220" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#vig)"/>
  <circle cx="${118 + rng.int(0, 24)}" cy="${86 + rng.int(0, 18)}" r="${52 + rng.int(0, 22)}" fill="#FFFFFF" opacity="0.34"/>
  <ellipse cx="200" cy="322" rx="118" ry="26" fill="url(#floor)"/>
  <g transform="rotate(${rotate} 200 200)">${SHAPES[kind](palette, rng)}</g>
</svg>`;
}

const cache = new Map<string, string>();

/** Data URI for a product "studio shot". */
export function productImage(kind: ImageKind, tint: string, seed: string, size = 480): string {
  const key = `${kind}|${tint}|${seed}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildSvg(kind, tint, seed, size))}`;
  cache.set(key, uri);
  return uri;
}

/** Softly-abstract image used for review photos / dispute evidence thumbnails. */
export function mediaImage(seed: string, tint: string, size = 200): string {
  const rng = new Rng(seed);
  const blobs = Array.from({ length: 5 }, (_, i) => {
    const cx = rng.int(20, 180);
    const cy = rng.int(20, 180);
    const r = rng.int(30, 78);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${shade(tint, i % 2 ? 0.5 : -0.15)}" opacity="${rng.float(0.28, 0.62, 2)}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
    <rect width="200" height="200" fill="${shade(tint, 0.82)}"/>${blobs}
    <rect width="200" height="200" fill="none" stroke="${shade(tint, -0.3)}" stroke-opacity=".12" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Deterministic avatar background from a seed — pairs with `initials()`. */
const AVATAR_TINTS = [
  '#12817A', '#F03E0B', '#4C5FD7', '#B0348C', '#0E7490', '#B45309',
  '#15803D', '#7C3AED', '#C2410C', '#1D4ED8', '#0F766E', '#9D174D',
];

export function avatarTint(seed: string): string {
  return AVATAR_TINTS[hashString(seed) % AVATAR_TINTS.length];
}

/** Vendor storefront banner — layered geometry in the vendor's tint. */
export function bannerImage(seed: string, tint: string): string {
  const rng = new Rng(`banner:${seed}`);
  const bars = Array.from({ length: 9 }, (_, i) => {
    const x = i * 140 + rng.int(-30, 30);
    const w = rng.int(40, 120);
    return `<rect x="${x}" y="${rng.int(-40, 60)}" width="${w}" height="360" rx="${w / 2}" fill="#FFFFFF" opacity="${rng.float(0.03, 0.1, 3)}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 280" width="1200" height="280" preserveAspectRatio="none">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(tint, -0.45)}"/><stop offset="0.55" stop-color="${tint}"/><stop offset="1" stop-color="${shade(tint, -0.2)}"/>
    </linearGradient></defs>
    <rect width="1200" height="280" fill="url(#g)"/>${bars}
    <circle cx="1010" cy="60" r="150" fill="#FFFFFF" opacity="0.06"/>
    <circle cx="180" cy="250" r="120" fill="#0B1220" opacity="0.12"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Wide editorial hero / category banner artwork. */
export function heroImage(seed: string, tint: string): string {
  const rng = new Rng(`hero:${seed}`);
  const rings = Array.from({ length: 6 }, (_, i) =>
    `<circle cx="${880 + rng.int(-60, 60)}" cy="${200 + rng.int(-40, 40)}" r="${60 + i * 46}" fill="none" stroke="#FFFFFF" stroke-opacity="${(0.14 - i * 0.018).toFixed(3)}" stroke-width="2"/>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" width="1200" height="420" preserveAspectRatio="none">
    <defs><linearGradient id="hg" x1="0" y1="0.1" x2="1" y2="1">
      <stop offset="0" stop-color="#0D1420"/><stop offset="0.5" stop-color="${shade(tint, -0.55)}"/><stop offset="1" stop-color="${tint}"/>
    </linearGradient></defs>
    <rect width="1200" height="420" fill="url(#hg)"/>${rings}
    <path d="M0 420 L360 150 L560 300 L820 90 L1200 340 V420 Z" fill="#FFFFFF" opacity="0.05"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
