/**
 * Deterministic pseudo-random helpers.
 *
 * Seed data must be identical on every reload (so dashboards, charts and
 * product pages stay stable across navigation), which rules out Math.random.
 * mulberry32 over an FNV-1a string hash gives us reproducible sequences.
 */

export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  private state: number;

  constructor(seed: string | number) {
    this.state = (typeof seed === 'number' ? seed : hashString(seed)) || 1;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min;
    const f = 10 ** decimals;
    return Math.round(v * f) / f;
  }

  bool(trueChance = 0.5): boolean {
    return this.next() < trueChance;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** `count` distinct members of `items` (or all of them, if fewer). */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0]);
    return out;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Weighted pick: `[value, weight]` pairs. */
  weighted<T>(pairs: readonly [T, number][]): T {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [v, w] of pairs) {
      r -= w;
      if (r <= 0) return v;
    }
    return pairs[pairs.length - 1][0];
  }
}

/** A stable id like `prd_8f2a1c`. */
export function makeId(prefix: string, seed: string): string {
  return `${prefix}_${hashString(seed).toString(36).padStart(6, '0').slice(0, 7)}`;
}

/** Days offset from the demo "now", as an ISO string. */
export const DEMO_NOW = new Date('2026-09-03T11:20:00.000Z');

export function daysAgo(days: number, hourJitter = 0): string {
  const d = new Date(DEMO_NOW.getTime() - days * 86400000 + hourJitter * 3600000);
  return d.toISOString();
}

export function daysAhead(days: number, hourJitter = 0): string {
  return daysAgo(-days, hourJitter);
}
