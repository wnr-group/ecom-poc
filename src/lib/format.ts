import { DEMO_NOW } from './rng';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});
const plainNum = new Intl.NumberFormat('en-IN');

/** ₹1,24,999 — the marketplace's display currency. */
export function money(value: number, opts?: { paise?: boolean }): string {
  return opts?.paise ? inrPaise.format(value) : inr.format(Math.round(value));
}

/** ₹1.2L / ₹18.4Cr — for KPI tiles where space is tight. */
export function moneyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function num(value: number): string {
  return plainNum.format(Math.round(value));
}

export function numCompact(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}K`;
  return String(Math.round(value));
}

export function pct(value: number, decimals = 1): string {
  return `${value >= 0 ? '' : '-'}${Math.abs(value).toFixed(decimals)}%`;
}

export function discountPct(price: number, mrp: number): number {
  if (mrp <= 0 || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateShortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dayNameFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}
export function formatDateShort(iso: string): string {
  return dateShortFmt.format(new Date(iso));
}
export function formatDayName(iso: string): string {
  return dayNameFmt.format(new Date(iso));
}
export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}
export function formatDateTime(iso: string): string {
  return `${dateFmt.format(new Date(iso))}, ${timeFmt.format(new Date(iso))}`;
}

/** "3 days ago" / "in 2 days", relative to the demo clock. */
export function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - DEMO_NOW.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const future = diffMs > 0;
  const wrap = (v: string) => (future ? `in ${v}` : `${v} ago`);
  if (mins < 1) return 'just now';
  if (mins < 60) return wrap(`${mins}m`);
  const hours = Math.round(mins / 60);
  if (hours < 24) return wrap(`${hours}h`);
  const days = Math.round(hours / 24);
  if (days < 7) return wrap(`${days} day${days === 1 ? '' : 's'}`);
  const weeks = Math.round(days / 7);
  if (days < 30) return wrap(`${weeks} week${weeks === 1 ? '' : 's'}`);
  const months = Math.round(days / 30);
  if (days < 365) return wrap(`${months} month${months === 1 ? '' : 's'}`);
  return wrap(`${Math.round(days / 365)}y`);
}

/** "Delivery by Fri, 5 Sep" style promise line. */
export function deliveryPromise(iso: string): string {
  const target = new Date(iso);
  const days = Math.ceil((target.getTime() - DEMO_NOW.getTime()) / 86400000);
  if (days <= 0) return 'Delivered';
  if (days === 1) return 'Tomorrow';
  return formatDayName(iso);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** snake_case / kebab-case → Title Case. */
export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bCod\b/, 'COD')
    .replace(/\bUpi\b/, 'UPI')
    .replace(/\bSku\b/, 'SKU')
    .replace(/\bGmv\b/, 'GMV')
    .replace(/\bRma\b/, 'RMA');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Bytes-ish display for mock uploads. */
export function fileSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

/** Countdown parts for flash deals. */
export function countdown(iso: string, fromMs = Date.now()): { h: string; m: string; s: string; done: boolean } {
  const diff = new Date(iso).getTime() - fromMs;
  if (diff <= 0) return { h: '00', m: '00', s: '00', done: true };
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return { h: p(Math.min(h, 99)), m: p(m), s: p(s), done: false };
}

/** Rough EMI for the product page finance block. */
export function emiPerMonth(price: number, months: number, annualRatePct = 14): number {
  const r = annualRatePct / 100 / 12;
  return Math.round((price * r) / (1 - Math.pow(1 + r, -months)));
}
