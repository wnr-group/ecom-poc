/* eslint-disable react-refresh/only-export-components */
/**
 * MarketForge design system.
 *
 * One module so spacing, radii, focus states and status colours stay in sync
 * across the customer storefront, the vendor portal and the admin console.
 */
import {
  createContext, useContext, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy,
  Info, Loader2, Search, Star, TriangleAlert, X, CircleCheck, CircleX, Upload, ArrowUpDown,
} from 'lucide-react';
import { initials, money, titleCase } from '../lib/format';
import { avatarTint } from '../lib/images';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ─────────────────────────────── Button ─────────────────────────────────── */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-forge-700 text-white hover:bg-forge-800 active:bg-forge-900 border border-forge-800/60 shadow-xs',
  accent: 'bg-ember-500 text-white hover:bg-ember-600 active:bg-ember-700 border border-ember-600/60 shadow-xs',
  secondary: 'bg-white text-ink-800 border border-ink-300 hover:bg-ink-50 active:bg-ink-100 shadow-xs',
  ghost: 'text-ink-700 hover:bg-ink-100 active:bg-ink-200 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-700/60 shadow-xs',
  subtle: 'bg-forge-50 text-forge-800 border border-forge-200 hover:bg-forge-100',
  link: 'text-forge-700 hover:text-forge-900 hover:underline underline-offset-2 border border-transparent',
};

const BTN_SIZE: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  to?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'secondary', size = 'md', loading, block, to, icon, iconRight,
  className, children, disabled, ...rest
}: ButtonProps) {
  const cls = cx(
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    BTN_VARIANT[variant], BTN_SIZE[size], block && 'w-full', className,
  );
  const inner = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </>
  );
  if (to && !disabled) return <Link to={to} className={cls}>{inner}</Link>;
  return <button className={cls} disabled={disabled || loading} {...rest}>{inner}</button>;
}

export function IconButton({
  label, size = 'md', variant = 'ghost', className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: ButtonSize; variant?: ButtonVariant }) {
  const box = { xs: 'size-7', sm: 'size-8', md: 'size-9', lg: 'size-10' }[size];
  return (
    <button
      aria-label={label} title={label}
      className={cx('inline-flex items-center justify-center rounded-md transition-colors', BTN_VARIANT[variant], box, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────── Inputs ────────────────────────────────── */

const FIELD = 'w-full rounded-md border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition-shadow hover:border-ink-400 focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400';

export function Field({
  label, hint, error, required, children, className,
}: { label?: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && (
        <label className="mf-label">
          {label}
          {required && <span className="text-ember-600 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><TriangleAlert className="size-3" />{error}</p>
        : hint ? <p className="mf-hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, prefix, ...rest }: InputHTMLAttributes<HTMLInputElement> & { prefix?: string }) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500 pointer-events-none">{prefix}</span>
        <input className={cx(FIELD, 'h-9 pl-7', className)} {...rest} />
      </div>
    );
  }
  return <input className={cx(FIELD, 'h-9', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(FIELD, 'py-2 min-h-[84px] leading-relaxed', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(FIELD, 'h-9 pr-9 appearance-none cursor-pointer', className)} {...rest}>{children}</select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-500 pointer-events-none" />
    </div>
  );
}

export function Checkbox({
  label, sublabel, className, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; sublabel?: ReactNode }) {
  return (
    <label className={cx('flex items-start gap-2.5 cursor-pointer group', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-ink-300 text-forge-700 focus:ring-forge-500/30 focus:ring-2 cursor-pointer accent-forge-700"
        {...rest}
      />
      {label && (
        <span className="min-w-0">
          <span className="block text-[13px] text-ink-800 group-hover:text-ink-950 leading-snug">{label}</span>
          {sublabel && <span className="block text-xs text-ink-500 mt-0.5">{sublabel}</span>}
        </span>
      )}
    </label>
  );
}

export function Radio({
  label, sublabel, right, className, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; sublabel?: ReactNode; right?: ReactNode }) {
  return (
    <label className={cx(
      'flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors',
      rest.checked ? 'border-forge-500 bg-forge-50/60 ring-1 ring-forge-500/30' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/60',
      className,
    )}>
      <input type="radio" className="mt-0.5 size-4 shrink-0 border-ink-300 accent-forge-700 cursor-pointer" {...rest} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink-900 leading-snug">{label}</span>
        {sublabel && <span className="block text-xs text-ink-500 mt-1 leading-relaxed">{sublabel}</span>}
      </span>
      {right && <span className="shrink-0 text-sm font-semibold text-ink-900 mf-tnum">{right}</span>}
    </label>
  );
}

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cx('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400 pointer-events-none" />
      <input className={cx(FIELD, 'h-9 pl-9')} {...rest} />
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 rounded-full transition-colors shrink-0', checked ? 'bg-forge-600' : 'bg-ink-300')}
      >
        <span className={cx('absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      {label && <span className="text-[13px] text-ink-800">{label}</span>}
    </label>
  );
}

/* ──────────────────────────── Badges & status ───────────────────────────── */

type BadgeTone = 'neutral' | 'forge' | 'ember' | 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  forge: 'bg-forge-50 text-forge-800 border-forge-200',
  ember: 'bg-ember-50 text-ember-800 border-ember-200',
  green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  violet: 'bg-violet-50 text-violet-800 border-violet-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Badge({
  tone = 'neutral', children, className, dot, icon,
}: { tone?: BadgeTone; children: ReactNode; className?: string; dot?: boolean; icon?: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap', TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {icon}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  // order / vendor order
  pending: 'amber', new: 'blue', confirmed: 'blue', accepted: 'blue', processing: 'violet',
  packed: 'violet', ready_for_pickup: 'violet', shipped: 'forge', out_for_delivery: 'forge',
  in_transit: 'forge', delivered: 'green', cancelled: 'red', rejected: 'red',
  returned: 'slate', return_requested: 'amber', partially_returned: 'slate', label_created: 'neutral',
  exception: 'red', picked_up: 'forge',
  // product
  draft: 'neutral', pending_approval: 'amber', published: 'green', out_of_stock: 'red', archived: 'slate',
  // vendor
  submitted: 'blue', under_review: 'amber', approved: 'green', suspended: 'red',
  // returns
  requested: 'amber', pickup_scheduled: 'blue', inspection: 'violet', refund_initiated: 'forge', refunded: 'green',
  // payouts / payments / refunds
  scheduled: 'blue', paid: 'green', on_hold: 'amber', failed: 'red', completed: 'green',
  captured: 'green', authorized: 'blue', partially_refunded: 'amber',
  // promos & coupons
  active: 'green', expired: 'slate', paused: 'amber', disabled: 'slate',
  // disputes / tickets
  open: 'red', waiting_customer: 'amber', waiting_vendor: 'amber', resolved: 'green', closed: 'slate',
  solved: 'green',
  // generic
  verified: 'green', info: 'blue', success: 'green', warning: 'amber', critical: 'red', low: 'neutral',
  normal: 'blue', medium: 'amber', high: 'red', urgent: 'red', onboarding: 'blue',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot className={className}>{titleCase(status)}</Badge>;
}

export function Avatar({
  name, seed, size = 'md', src, className,
}: { name: string; seed?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; src?: string; className?: string }) {
  const box = { xs: 'size-6 text-2xs', sm: 'size-8 text-xs', md: 'size-9 text-[13px]', lg: 'size-12 text-sm', xl: 'size-16 text-lg' }[size];
  const tint = avatarTint(seed ?? name);
  return src ? (
    <img src={src} alt={name} className={cx('rounded-full object-cover shrink-0', box, className)} />
  ) : (
    <span
      className={cx('inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none', box, className)}
      style={{ background: `linear-gradient(140deg, ${tint}, ${tint}cc)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Rating({
  value, count, size = 'sm', showValue = true, className, onChange,
}: { value: number; count?: number; size?: 'xs' | 'sm' | 'md' | 'lg'; showValue?: boolean; className?: string; onChange?: (v: number) => void }) {
  const px = { xs: 'size-3', sm: 'size-3.5', md: 'size-4', lg: 'size-7' }[size];
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className={cx('inline-flex items-center gap-1', className)}>
      <span className={cx('inline-flex', onChange && 'gap-0.5')} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = shown >= i - 0.25;
          const half = !filled && shown >= i - 0.75;
          const star = (
            <Star
              className={cx(px, filled ? 'fill-amber-400 text-amber-400' : half ? 'fill-amber-400/50 text-amber-400' : 'fill-ink-200 text-ink-300')}
            />
          );
          return onChange ? (
            <button key={i} type="button" aria-label={`${i} star${i > 1 ? 's' : ''}`} onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} className="transition-transform hover:scale-110">
              {star}
            </button>
          ) : <span key={i}>{star}</span>;
        })}
      </span>
      {showValue && <span className="text-[13px] font-semibold text-ink-800 mf-tnum">{value.toFixed(1)}</span>}
      {count != null && <span className="text-xs text-ink-500 mf-tnum">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}

export function Price({
  value, mrp, size = 'md', className, inline,
}: { value: number; mrp?: number; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; inline?: boolean }) {
  const main = { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-3xl' }[size];
  const sub = { sm: 'text-2xs', md: 'text-xs', lg: 'text-sm', xl: 'text-base' }[size];
  const off = mrp && mrp > value ? Math.round(((mrp - value) / mrp) * 100) : 0;
  return (
    <span className={cx(inline ? 'inline-flex items-baseline gap-1.5' : 'flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5', className)}>
      <span className={cx('font-semibold text-ink-950 mf-tnum tracking-tight', main)}>{money(value)}</span>
      {off > 0 && (
        <>
          <span className={cx('text-ink-400 line-through mf-tnum', sub)}>{money(mrp!)}</span>
          <span className={cx('font-semibold text-emerald-700 mf-tnum', sub)}>{off}% off</span>
        </>
      )}
    </span>
  );
}

/* ──────────────────────────── Surfaces & layout ─────────────────────────── */

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('bg-white border border-ink-200/80 rounded-lg shadow-xs', className)} {...rest}>{children}</div>;
}

export function PanelHeader({
  title, subtitle, actions, className, icon,
}: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 px-4 py-3 border-b border-ink-200/70', className)}>
      <div className="min-w-0 flex items-start gap-2.5">
        {icon && <span className="mt-0.5 text-ink-400">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink-950 leading-tight truncate">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageHeader({
  title, subtitle, actions, breadcrumbs, tabs, className,
}: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; breadcrumbs?: ReactNode; tabs?: ReactNode; className?: string }) {
  return (
    <div className={cx('bg-white border-b border-ink-200/80', className)}>
      <div className="px-5 lg:px-7 pt-4 pb-3">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-[22px] font-bold text-ink-950 leading-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-ink-500 mt-1 max-w-3xl leading-relaxed">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      {tabs}
    </div>
  );
}

export function SectionHeading({
  title, subtitle, action, className,
}: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-end justify-between gap-4 mb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink-950 leading-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-ink-500 flex-wrap">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 text-ink-300" />}
          {item.to && i < items.length - 1
            ? <Link to={item.to} className="hover:text-forge-700 hover:underline underline-offset-2">{item.label}</Link>
            : <span className={i === items.length - 1 ? 'text-ink-800 font-medium' : ''}>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ──────────────────────────────── Tabs ──────────────────────────────────── */

export interface TabItem { key: string; label: string; count?: number; icon?: ReactNode }

export function Tabs({
  items, value, onChange, className, variant = 'underline',
}: { items: TabItem[]; value: string; onChange: (k: string) => void; className?: string; variant?: 'underline' | 'pill' }) {
  if (variant === 'pill') {
    return (
      <div className={cx('inline-flex items-center gap-1 p-0.5 bg-ink-100 rounded-lg', className)}>
        {items.map((t) => (
          <button
            key={t.key} onClick={() => onChange(t.key)}
            className={cx('inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-[13px] font-medium transition-colors',
              value === t.key ? 'bg-white text-ink-950 shadow-xs' : 'text-ink-600 hover:text-ink-900')}
          >
            {t.icon}{t.label}
            {t.count != null && <span className="text-2xs text-ink-500 mf-tnum">{t.count}</span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cx('flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-ink-200/80 px-5 lg:px-7', className)}>
      {items.map((t) => (
        <button
          key={t.key} onClick={() => onChange(t.key)}
          className={cx('relative inline-flex items-center gap-2 px-3 h-10 text-[13px] font-medium whitespace-nowrap transition-colors',
            value === t.key ? 'text-forge-800' : 'text-ink-600 hover:text-ink-900')}
        >
          {t.icon}{t.label}
          {t.count != null && (
            <span className={cx('rounded px-1.5 py-0.5 text-2xs mf-tnum font-semibold',
              value === t.key ? 'bg-forge-100 text-forge-800' : 'bg-ink-100 text-ink-600')}>{t.count}</span>
          )}
          {value === t.key && <span className="absolute inset-x-1 -bottom-px h-0.5 bg-forge-700 rounded-full" />}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options, value, onChange, size = 'sm',
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; size?: 'xs' | 'sm' }) {
  return (
    <div className={cx('inline-flex items-center rounded-md border border-ink-300 bg-white overflow-hidden', size === 'xs' ? 'h-7' : 'h-8')}>
      {options.map((o, i) => (
        <button
          key={o.key} onClick={() => onChange(o.key)}
          className={cx('px-2.5 h-full text-xs font-medium transition-colors',
            i > 0 && 'border-l border-ink-200',
            value === o.key ? 'bg-forge-700 text-white' : 'text-ink-600 hover:bg-ink-50')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────── Table ────────────────────────────────── */

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortValue?: (row: T) => string | number;
  hideBelow?: 'sm' | 'md' | 'lg';
  sticky?: boolean;
}

export function DataTable<T>({
  columns, rows, keyOf, empty, onRowClick, dense, className, footer, selectable, selected, onSelect,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  className?: string;
  footer?: ReactNode;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a), bv = col.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [rows, sort, columns]);

  const allSelected = selectable && rows.length > 0 && selected?.length === rows.length;
  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  const pad = dense ? 'px-3 py-1.5' : 'px-3 py-2.5';

  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className={cx('overflow-x-auto mf-scroll', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/70">
            {selectable && (
              <th className={cx('w-9', pad)}>
                <input
                  type="checkbox" checked={allSelected} aria-label="Select all"
                  onChange={(e) => onSelect?.(e.target.checked ? rows.map(keyOf) : [])}
                  className="size-4 rounded border-ink-300 accent-forge-700 cursor-pointer"
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cx(
                  'text-2xs font-semibold uppercase tracking-wider text-ink-500 whitespace-nowrap', pad,
                  c.align === 'right' && 'text-right', c.align === 'center' && 'text-center',
                  c.hideBelow && hide[c.hideBelow],
                  c.sticky && 'sticky left-0 bg-ink-50/70 z-10',
                )}
              >
                {c.sortValue ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-ink-800 transition-colors"
                    onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                  >
                    {c.header}
                    <ArrowUpDown className={cx('size-3', sort?.key === c.key ? 'text-forge-700' : 'text-ink-300')} />
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const id = keyOf(row);
            const isSel = selected?.includes(id);
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  'border-b border-ink-100 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-forge-50/40',
                  isSel && 'bg-forge-50/60',
                )}
              >
                {selectable && (
                  <td className={pad} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox" checked={isSel} aria-label={`Select ${id}`}
                      onChange={(e) => onSelect?.(e.target.checked ? [...(selected ?? []), id] : (selected ?? []).filter((s) => s !== id))}
                      className="size-4 rounded border-ink-300 accent-forge-700 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx('text-[13px] text-ink-800 align-middle', pad,
                      c.align === 'right' && 'text-right', c.align === 'center' && 'text-center',
                      c.hideBelow && hide[c.hideBelow],
                      c.sticky && 'sticky left-0 bg-white z-10')}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {footer && <tfoot className="bg-ink-50/70 border-t border-ink-200 font-medium">{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Pagination({
  page, pageCount, onChange, total, pageSize, onPageSizeChange,
}: { page: number; pageCount: number; onChange: (p: number) => void; total?: number; pageSize?: number; onPageSizeChange?: (n: number) => void }) {
  if (pageCount <= 1 && !onPageSizeChange) return null;
  const window = 5;
  let start = Math.max(1, page - Math.floor(window / 2));
  const end = Math.min(pageCount, start + window - 1);
  start = Math.max(1, end - window + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-ink-200/70">
      <p className="text-xs text-ink-500 mf-tnum">
        {total != null && pageSize
          ? `Showing ${Math.min(total, (page - 1) * pageSize + 1)}–${Math.min(total, page * pageSize)} of ${total.toLocaleString('en-IN')}`
          : `Page ${page} of ${pageCount}`}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && pageSize && (
          <Select className="h-8 w-[92px] text-xs" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </Select>
        )}
        <div className="flex items-center gap-0.5">
          <IconButton label="First page" size="sm" variant="secondary" disabled={page === 1} onClick={() => onChange(1)}><ChevronsLeft className="size-4" /></IconButton>
          <IconButton label="Previous page" size="sm" variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft className="size-4" /></IconButton>
          {pages.map((p) => (
            <button
              key={p} onClick={() => onChange(p)}
              className={cx('size-8 rounded-md text-[13px] font-medium mf-tnum transition-colors',
                p === page ? 'bg-forge-700 text-white' : 'text-ink-700 hover:bg-ink-100')}
            >{p}</button>
          ))}
          <IconButton label="Next page" size="sm" variant="secondary" disabled={page === pageCount} onClick={() => onChange(page + 1)}><ChevronRight className="size-4" /></IconButton>
          <IconButton label="Last page" size="sm" variant="secondary" disabled={page === pageCount} onClick={() => onChange(pageCount)}><ChevronsRight className="size-4" /></IconButton>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Overlays: modal, drawer, menu ──────────────────── */

function useEscape(onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, active]);
}

export function Modal({
  open, onClose, title, subtitle, children, footer, size = 'md',
}: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEscape(onClose, open);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cx('relative w-full bg-white shadow-overlay rounded-t-xl sm:rounded-xl animate-scale-in flex flex-col max-h-[92vh]', w)}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-200/70">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-950">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-500 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}><X className="size-4" /></IconButton>
        </div>
        <div className="px-5 py-4 overflow-y-auto mf-scroll">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-ink-200/70 bg-ink-50/50 flex items-center justify-end gap-2 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open, onClose, title, subtitle, children, footer, side = 'right', width = 'max-w-md',
}: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; side?: 'left' | 'right'; width?: string }) {
  useEscape(onClose, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog" aria-modal="true"
        className={cx('absolute top-0 bottom-0 bg-white shadow-overlay flex flex-col w-full', width,
          side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left')}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-200/70">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-950">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}><X className="size-4" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto mf-scroll px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-ink-200/70 bg-ink-50/50 flex items-center gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', variant = 'danger', loading,
}: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: ReactNode; confirmLabel?: string; variant?: ButtonVariant; loading?: boolean }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" variant={variant} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </>}
    >
      <div className="text-[13px] text-ink-700 leading-relaxed">{body}</div>
    </Modal>
  );
}

export function Dropdown({
  trigger, children, align = 'right', className, width = 'w-56',
}: { trigger: ReactNode; children: ReactNode | ((close: () => void) => ReactNode); align?: 'left' | 'right'; className?: string; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className={cx('relative', className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cx('absolute z-50 mt-1.5 rounded-lg border border-ink-200 bg-white shadow-pop py-1 animate-slide-up', width, align === 'right' ? 'right-0' : 'left-0')}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children, icon, to, onClick, danger, shortcut, active,
}: { children: ReactNode; icon?: ReactNode; to?: string; onClick?: () => void; danger?: boolean; shortcut?: string; active?: boolean }) {
  const cls = cx(
    'flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-left transition-colors',
    danger ? 'text-red-700 hover:bg-red-50' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
    active && 'bg-forge-50 text-forge-800 font-medium',
  );
  const inner = <>{icon && <span className="text-ink-400 shrink-0">{icon}</span>}<span className="flex-1 truncate">{children}</span>{shortcut && <kbd className="text-2xs text-ink-400">{shortcut}</kbd>}</>;
  return to ? <Link to={to} className={cls} onClick={onClick}>{inner}</Link> : <button type="button" className={cls} onClick={onClick}>{inner}</button>;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pt-2 pb-1 text-2xs font-semibold uppercase tracking-wider text-ink-400">{children}</p>;
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-ink-150 bg-ink-100" />;
}

/* ──────────────────────────────── Toaster ───────────────────────────────── */

export function Toaster({ toasts, onDismiss }: { toasts: { id: string; title: string; body?: string; variant: string; action?: { label: string; to: string } }[]; onDismiss: (id: string) => void }) {
  const icons: Record<string, ReactNode> = {
    success: <CircleCheck className="size-4 text-emerald-600" />,
    error: <CircleX className="size-4 text-red-600" />,
    warning: <TriangleAlert className="size-4 text-amber-600" />,
    info: <Info className="size-4 text-blue-600" />,
  };
  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] no-print">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white shadow-pop px-3.5 py-3 animate-toast-in">
          <span className="mt-0.5 shrink-0">{icons[t.variant] ?? icons.info}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink-950 leading-snug">{t.title}</p>
            {t.body && <p className="text-xs text-ink-600 mt-0.5 line-clamp-2 leading-relaxed">{t.body}</p>}
            {t.action && <Link to={t.action.to} className="inline-block mt-1.5 text-xs font-semibold text-forge-700 hover:underline" onClick={() => onDismiss(t.id)}>{t.action.label} →</Link>}
          </div>
          <IconButton label="Dismiss" size="xs" onClick={() => onDismiss(t.id)}><X className="size-3.5" /></IconButton>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────── Empty, loading and error states ──────────────────── */

export function EmptyState({
  icon, title, body, action, secondary, compact,
}: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode; secondary?: ReactNode; compact?: boolean }) {
  return (
    <div className={cx('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6')}>
      {icon && (
        <div className="mb-3 grid place-items-center size-12 rounded-xl bg-ink-100 text-ink-400 border border-ink-200">{icon}</div>
      )}
      <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
      {body && <p className="mt-1.5 text-[13px] text-ink-500 max-w-sm leading-relaxed">{body}</p>}
      {(action || secondary) && <div className="mt-4 flex items-center gap-2">{action}{secondary}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('mf-skeleton', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="mf-card p-3">
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="h-3 w-16 mt-3" />
      <Skeleton className="h-3.5 w-full mt-2" />
      <Skeleton className="h-3.5 w-3/4 mt-1.5" />
      <Skeleton className="h-4 w-20 mt-3" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-ink-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-3 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cx('h-3.5', c === 0 ? 'w-40' : c === cols - 1 ? 'w-16 ml-auto' : 'w-24')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mounts children after a short delay so skeletons are actually visible. */
export function useDeferred(ms = 320) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ready;
}

/* ─────────────────────────── Data presentation ──────────────────────────── */

export function StatCard({
  label, value, delta, deltaLabel, icon, hint, tone = 'neutral', footer, onClick,
}: {
  label: string; value: ReactNode; delta?: number; deltaLabel?: string; icon?: ReactNode;
  hint?: string; tone?: BadgeTone; footer?: ReactNode; onClick?: () => void;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      onClick={onClick}
      className={cx('bg-white border border-ink-200/80 rounded-lg p-4 shadow-xs transition-shadow', onClick && 'cursor-pointer hover:shadow-card')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</p>
        {icon && <span className={cx('grid place-items-center size-7 rounded-md border', TONE[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-[26px] font-bold text-ink-950 leading-none mf-tnum tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 min-h-[18px]">
        {delta != null && (
          <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold mf-tnum', positive ? 'text-emerald-700' : 'text-red-600')}>
            {positive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {(deltaLabel || hint) && <span className="text-xs text-ink-500 truncate">{deltaLabel ?? hint}</span>}
      </div>
      {footer && <div className="mt-3 pt-3 border-t border-ink-100">{footer}</div>}
    </div>
  );
}

export function KpiRow({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 | 6 }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-2 lg:grid-cols-5', 6: 'sm:grid-cols-3 lg:grid-cols-6' };
  return <div className={cx('grid grid-cols-1 gap-3', map[cols])}>{children}</div>;
}

export function DefinitionList({
  items, columns = 1, className,
}: { items: { label: ReactNode; value: ReactNode }[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-3', columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-3' : '', className)}>
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-xs text-ink-500">{it.label}</dt>
          <dd className="text-[13px] text-ink-900 font-medium mt-0.5 break-words">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({
  value, tone = 'forge', className, label, showValue,
}: { value: number; tone?: 'forge' | 'ember' | 'green' | 'amber' | 'red'; className?: string; label?: string; showValue?: boolean }) {
  const bar = { forge: 'bg-forge-600', ember: 'bg-ember-500', green: 'bg-emerald-600', amber: 'bg-amber-500', red: 'bg-red-500' }[tone];
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-ink-600">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-ink-800 mf-tnum">{value.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full bg-ink-150 bg-ink-100 overflow-hidden">
        <div className={cx('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export interface TimelineStep {
  id: string;
  label: string;
  detail?: string;
  at?: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
  location?: string;
  actor?: string;
}

export function Timeline({ steps, orientation = 'vertical' }: { steps: TimelineStep[]; orientation?: 'vertical' | 'horizontal' }) {
  if (orientation === 'horizontal') {
    return (
      <ol className="flex items-start overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <li key={s.id} className="flex-1 min-w-[104px] relative">
            <div className="flex items-center">
              <span className={cx('grid place-items-center size-7 rounded-full border-2 shrink-0 z-10 bg-white',
                s.state === 'done' ? 'border-forge-600 bg-forge-600 text-white'
                : s.state === 'current' ? 'border-forge-600 text-forge-700 ring-4 ring-forge-100'
                : s.state === 'failed' ? 'border-red-500 bg-red-500 text-white' : 'border-ink-200 text-ink-300')}>
                {s.state === 'done' ? <Check className="size-3.5" /> : s.state === 'failed' ? <X className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              {i < steps.length - 1 && <span className={cx('h-0.5 flex-1', s.state === 'done' ? 'bg-forge-600' : 'bg-ink-200')} />}
            </div>
            <div className="pr-3 mt-2">
              <p className={cx('text-xs font-semibold leading-snug', s.state === 'upcoming' ? 'text-ink-400' : 'text-ink-900')}>{s.label}</p>
              {s.at && <p className="text-2xs text-ink-500 mt-0.5">{s.at}</p>}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-3 pb-4 last:pb-0">
          <div className="flex flex-col items-center shrink-0">
            <span className={cx('grid place-items-center size-6 rounded-full border-2 bg-white',
              s.state === 'done' ? 'border-forge-600 bg-forge-600 text-white'
              : s.state === 'current' ? 'border-forge-600 text-forge-700 ring-4 ring-forge-100'
              : s.state === 'failed' ? 'border-red-500 bg-red-500 text-white' : 'border-ink-200 text-ink-300')}>
              {s.state === 'done' ? <Check className="size-3" /> : s.state === 'failed' ? <X className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            {i < steps.length - 1 && <span className={cx('w-0.5 flex-1 mt-1', s.state === 'done' ? 'bg-forge-600' : 'bg-ink-200')} />}
          </div>
          <div className="min-w-0 flex-1 -mt-0.5 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className={cx('text-[13px] font-semibold', s.state === 'upcoming' ? 'text-ink-400' : 'text-ink-950')}>{s.label}</p>
              {s.at && <p className="text-xs text-ink-500 mf-tnum">{s.at}</p>}
            </div>
            {s.detail && <p className={cx('text-xs mt-0.5 leading-relaxed', s.state === 'upcoming' ? 'text-ink-400' : 'text-ink-600')}>{s.detail}</p>}
            {(s.location || s.actor) && (
              <p className="text-2xs text-ink-400 mt-1">{[s.actor, s.location].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Stepper({
  steps, current, onStepClick,
}: { steps: { key: string; label: string; description?: string }[]; current: number; onStepClick?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s.key} className="flex items-center gap-1 shrink-0">
            <button
              type="button" disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className={cx('flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors',
                onStepClick && i <= current && 'hover:bg-ink-100 cursor-pointer',
                active && 'bg-forge-50')}
            >
              <span className={cx('grid place-items-center size-5 rounded-full text-2xs font-bold shrink-0',
                done ? 'bg-forge-600 text-white' : active ? 'bg-forge-700 text-white' : 'bg-ink-200 text-ink-500')}>
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cx('text-xs font-medium whitespace-nowrap', active ? 'text-forge-800' : done ? 'text-ink-700' : 'text-ink-400')}>{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="size-3.5 text-ink-300 shrink-0" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Alert({
  tone = 'info', title, children, action, className, icon,
}: { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string; icon?: ReactNode }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
  }[tone];
  const defaultIcon = { info: <Info className="size-4" />, success: <CircleCheck className="size-4" />, warning: <TriangleAlert className="size-4" />, danger: <TriangleAlert className="size-4" /> }[tone];
  return (
    <div className={cx('flex items-start gap-3 rounded-lg border px-3.5 py-3', styles, className)}>
      <span className="mt-0.5 shrink-0 opacity-80">{icon ?? defaultIcon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-[13px] font-semibold leading-snug">{title}</p>}
        {children && <div className={cx('text-xs leading-relaxed opacity-90', Boolean(title) && 'mt-1')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  const id = useId();
  return (
    <span className="relative inline-flex group">
      <span aria-describedby={id}>{children}</span>
      <span
        id={id} role="tooltip"
        className={cx('pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-md bg-ink-950 px-2 py-1 text-2xs text-white opacity-0 transition-opacity group-hover:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5')}
      >
        {label}
      </span>
    </span>
  );
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}
      className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-forge-700 transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function FileDrop({
  label, hint, accept, onFiles, files, multiple = true,
}: { label: string; hint?: string; accept?: string; onFiles?: (names: string[]) => void; files?: string[]; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles?.(Array.from(list).map((f) => f.name));
  };
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        className={cx('flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors',
          over ? 'border-forge-500 bg-forge-50' : 'border-ink-250 border-ink-200 hover:border-ink-300 hover:bg-ink-50/60')}
      >
        <Upload className="size-5 text-ink-400" />
        <p className="text-[13px] font-medium text-ink-800">{label}</p>
        {hint && <p className="text-xs text-ink-500">{hint}</p>}
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>
      {!!files?.length && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-md border border-ink-200 bg-ink-50/60 px-2.5 py-1.5 text-xs text-ink-700">
              <Check className="size-3.5 text-emerald-600 shrink-0" />
              <span className="truncate flex-1">{f}</span>
              <Badge tone="green">Uploaded</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ──────────────────────── Filter chips & panel bits ─────────────────────── */

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-forge-200 bg-forge-50 pl-2.5 pr-1 py-1 text-xs font-medium text-forge-800">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="grid place-items-center size-4 rounded-full hover:bg-forge-200/70 transition-colors">
        <X className="size-3" />
      </button>
    </span>
  );
}

export function FilterGroup({
  title, children, defaultOpen = true, count,
}: { title: string; children: ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink-200/70 last:border-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 py-3 text-left group">
        <span className="text-[13px] font-semibold text-ink-900">{title}</span>
        <span className="flex items-center gap-1.5">
          {count ? <span className="text-2xs text-forge-700 font-semibold mf-tnum">{count}</span> : null}
          <ChevronDown className={cx('size-4 text-ink-400 transition-transform group-hover:text-ink-600', open && 'rotate-180')} />
        </span>
      </button>
      {open && <div className="pb-3.5 space-y-2">{children}</div>}
    </div>
  );
}

/* ──────────────────────────── Misc primitives ───────────────────────────── */

export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * Math.round((ref.current.clientWidth || 600) * 0.8), behavior: 'smooth' });
  return (
    <div className="relative group">
      <div ref={ref} className={cx('flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1', className)}>{children}</div>
      <button
        onClick={() => scroll(-1)} aria-label="Scroll left"
        className="hidden lg:grid place-items-center absolute -left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white shadow-pop border border-ink-200 text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-forge-700 z-10"
      ><ChevronLeft className="size-4" /></button>
      <button
        onClick={() => scroll(1)} aria-label="Scroll right"
        className="hidden lg:grid place-items-center absolute -right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white shadow-pop border border-ink-200 text-ink-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-forge-700 z-10"
      ><ChevronRight className="size-4" /></button>
    </div>
  );
}

/** Tiny sparkline for table rows. */
export function Sparkline({ points, tone = 'forge', className }: { points: number[]; tone?: 'forge' | 'ember' | 'red' | 'green'; className?: string }) {
  const stroke = { forge: '#12817A', ember: '#F03E0B', red: '#DC2626', green: '#059669' }[tone];
  const max = Math.max(...points, 1), min = Math.min(...points, 0);
  const w = 72, h = 22;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * w},${h - ((p - min) / (max - min || 1)) * h}`).join(' ');
  return (
    <svg width={w} height={h} className={className} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ScrollTopCtx = createContext(0);
export const useScrollDepth = () => useContext(ScrollTopCtx);
