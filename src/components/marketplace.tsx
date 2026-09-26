/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { Heart, ShoppingCart, Truck, BadgeCheck, Zap, Store as StoreIcon } from 'lucide-react';
import type { Product, SeriesPoint, Vendor } from '../lib/types';
import * as api from '../lib/api';
import { useApp } from '../lib/store';
import { productImage } from '../lib/images';
import { countdown, deliveryPromise, money, moneyCompact, numCompact } from '../lib/format';
import { Badge, Button, IconButton, Panel, PanelHeader, Price, Rating, cx, Tooltip } from './ui';

/* ───────────────────────────── Product cards ────────────────────────────── */

export function ProductImage({
  product, size = 480, className, alt,
}: { product: Pick<Product, 'imageKind' | 'tint' | 'imageSeeds' | 'title'>; size?: number; className?: string; alt?: string }) {
  return (
    <img
      src={productImage(product.imageKind, product.tint, product.imageSeeds[0], size)}
      alt={alt ?? product.title}
      loading="lazy"
      className={cx('object-cover', className)}
    />
  );
}

export function ProductCard({
  product, layout = 'grid', showVendor = true, className,
}: { product: Product; layout?: 'grid' | 'list' | 'compact'; showVendor?: boolean; className?: string }) {
  const { addToCart, toggleWishlist, isWishlisted } = useApp();
  const vendor = api.vendorById.get(product.vendorId);
  const brand = api.brandById.get(product.brandId);
  const stock = api.inventoryByProduct.get(product.id)?.available ?? 0;
  const saved = isWishlisted(product.id);
  const href = `/p/${product.slug}`;

  if (layout === 'compact') {
    return (
      <Link to={href} className={cx('flex items-center gap-3 rounded-lg p-2 hover:bg-ink-50 transition-colors group', className)}>
        <ProductImage product={product} size={120} className="size-14 rounded-md border border-ink-200 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-900 line-clamp-2 leading-snug group-hover:text-forge-800">{product.shortTitle}</p>
          <div className="mt-1 flex items-center gap-2">
            <Price value={product.price} size="sm" inline />
            <Rating value={product.rating} size="xs" showValue={false} />
          </div>
        </div>
      </Link>
    );
  }

  if (layout === 'list') {
    return (
      <div className={cx('mf-card p-3 sm:p-4 flex gap-4 hover:shadow-card transition-shadow', className)}>
        <Link to={href} className="shrink-0">
          <ProductImage product={product} size={320} className="size-32 sm:size-40 rounded-md border border-ink-200" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{brand?.name}</p>
              <Link to={href} className="block text-[15px] font-semibold text-ink-950 hover:text-forge-800 leading-snug mt-0.5">{product.title}</Link>
            </div>
            <IconButton
              label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              variant="secondary" size="sm" onClick={() => toggleWishlist(product)}
            >
              <Heart className={cx('size-4', saved && 'fill-ember-500 text-ember-500')} />
            </IconButton>
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <Rating value={product.rating} count={product.ratingCount} size="xs" />
            <span className="text-xs text-ink-500">{numCompact(product.soldCount)} sold</span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {product.highlights.slice(0, 3).map((h) => (
              <li key={h} className="text-xs text-ink-600 flex gap-1.5 leading-relaxed"><span className="text-ink-300">•</span><span className="line-clamp-1">{h}</span></li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Price value={product.price} mrp={product.mrp} size="lg" />
              <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <Truck className="size-3.5" />
                {product.freeShipping ? 'Free delivery' : 'Delivery ₹49'} · {deliveryPromise(new Date(Date.now() + product.deliveryDays * 86400000).toISOString())}
              </p>
              {showVendor && vendor && (
                <p className="text-xs text-ink-500 mt-1">
                  Sold by <Link to={`/store/${vendor.slug}`} className="mf-link font-medium">{vendor.name}</Link>
                  {vendor.fulfilledByMarketForge && <Badge tone="forge" className="ml-1.5">Fulfilled by MarketForge</Badge>}
                </p>
              )}
            </div>
            <Button variant="accent" size="sm" icon={<ShoppingCart className="size-4" />} disabled={stock === 0} onClick={() => addToCart(product)}>
              {stock === 0 ? 'Out of stock' : 'Add to cart'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('mf-card group flex flex-col overflow-hidden hover:shadow-card transition-shadow', className)}>
      <div className="relative">
        <Link to={href} className="block bg-white">
          <ProductImage product={product} size={400} className="aspect-square w-full" />
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isDeal && <Badge tone="ember" icon={<Zap className="size-3" />}>Flash deal</Badge>}
          {product.badges.slice(0, 1).map((b) => <Badge key={b} tone="forge">{b}</Badge>)}
          {stock > 0 && stock <= 8 && <Badge tone="red">Only {stock} left</Badge>}
        </div>
        <IconButton
          label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          size="sm"
          className="absolute top-1.5 right-1.5 bg-white/95 border border-ink-200 shadow-xs hover:bg-white"
          onClick={() => toggleWishlist(product)}
        >
          <Heart className={cx('size-4', saved ? 'fill-ember-500 text-ember-500' : 'text-ink-500')} />
        </IconButton>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{brand?.name}</p>
        <Link to={href} className="mt-0.5 text-[13px] font-medium text-ink-900 hover:text-forge-800 line-clamp-2 leading-snug min-h-[34px]">
          {product.shortTitle}
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Rating value={product.rating} size="xs" showValue={false} />
          <span className="text-2xs text-ink-500 mf-tnum">{numCompact(product.ratingCount)}</span>
        </div>
        <div className="mt-2">
          <Price value={product.price} mrp={product.mrp} />
        </div>
        <p className="mt-1 text-2xs text-ink-500 truncate">
          {product.freeShipping ? 'Free delivery' : 'Delivery ₹49'} · {product.deliveryDays === 1 ? 'Tomorrow' : `${product.deliveryDays} days`}
        </p>
        {showVendor && vendor && (
          <Link to={`/store/${vendor.slug}`} className="mt-1.5 flex items-center gap-1 text-2xs text-ink-500 hover:text-forge-700 truncate">
            <StoreIcon className="size-3 shrink-0" /> {vendor.name}
            {vendor.rating >= 4.6 && <BadgeCheck className="size-3 text-forge-600 shrink-0" />}
          </Link>
        )}
        <div className="mt-auto pt-2.5">
          <Button variant="accent" size="sm" block disabled={stock === 0} onClick={() => addToCart(product)}>
            {stock === 0 ? 'Out of stock' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────── Shelves ──────────────────────────────── */

export function Shelf({
  title, subtitle, products, viewAllTo, tone = 'plain', endsAt,
}: { title: string; subtitle?: string; products: Product[]; viewAllTo?: string; tone?: 'plain' | 'deal'; endsAt?: string }) {
  if (!products.length) return null;
  return (
    <section className={cx('rounded-xl border', tone === 'deal' ? 'border-ember-200 bg-ember-50/40' : 'border-ink-200/80 bg-white')}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-ink-200/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-950 flex items-center gap-2">
              {tone === 'deal' && <Zap className="size-4 text-ember-500" />}
              {title}
            </h2>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {endsAt && <DealCountdown endsAt={endsAt} />}
        </div>
        {viewAllTo && <Link to={viewAllTo} className="text-[13px] font-semibold text-forge-700 hover:underline whitespace-nowrap">See all →</Link>}
      </div>
      <div className="p-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x">
          {products.map((p) => (
            <div key={p.id} className="w-[172px] sm:w-[196px] shrink-0 snap-start">
              <ProductCard product={p} showVendor={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DealCountdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const { h, m, s, done } = countdown(endsAt, now);
  if (done) return <Badge tone="slate" className={className}>Deal ended</Badge>;
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-semibold text-ember-800', className)}>
      <span className="text-ink-500 font-medium">Ends in</span>
      {[h, m, s].map((v, i) => (
        <span key={i} className="rounded bg-ink-950 px-1.5 py-0.5 text-white mf-tnum">{v}</span>
      ))}
    </span>
  );
}

export function VendorCard({ vendor, products }: { vendor: Vendor; products: Product[] }) {
  return (
    <Panel className="overflow-hidden">
      <div className="h-16" style={{ background: `linear-gradient(120deg, ${vendor.tint}, ${vendor.tint}99)` }} />
      <div className="px-4 pb-4 -mt-6">
        <div className="flex items-end gap-3">
          <span
            className="grid place-items-center size-12 rounded-lg border-2 border-white shadow-sm text-white font-bold text-sm shrink-0"
            style={{ background: vendor.tint }}
          >
            {vendor.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 pb-0.5">
            <Link to={`/store/${vendor.slug}`} className="block text-[15px] font-bold text-ink-950 hover:text-forge-800 truncate">{vendor.name}</Link>
            <div className="flex items-center gap-2">
              <Rating value={vendor.rating} size="xs" />
              <span className="text-2xs text-ink-500">{vendor.productCount} products</span>
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-ink-600 line-clamp-2 leading-relaxed">{vendor.tagline}</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {products.slice(0, 4).map((p) => (
            <Link key={p.id} to={`/p/${p.slug}`} title={p.title}>
              <ProductImage product={p} size={120} className="aspect-square w-full rounded-md border border-ink-200 hover:border-forge-400 transition-colors" />
            </Link>
          ))}
        </div>
        <Button size="sm" block className="mt-3" to={`/store/${vendor.slug}`}>Visit store</Button>
      </div>
    </Panel>
  );
}

/* ───────────────────────────────── Charts ───────────────────────────────── */

const CHART_COLORS = ['#12817A', '#F03E0B', '#4C5FD7', '#B45309', '#0E7490', '#9D174D', '#15803D', '#7C3AED', '#C2410C', '#1D4ED8', '#0F766E'];

const axisProps = {
  stroke: '#B0B9C9',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((p: any) => (
          <p key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-sm" style={{ background: p.color ?? p.fill }} />
            <span className="text-ink-600">{p.name}</span>
            <span className="ml-auto font-semibold text-ink-950 mf-tnum">{formatter ? formatter(p.value) : p.value.toLocaleString('en-IN')}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function ChartCard({
  title, subtitle, actions, children, height = 240, footer, className,
}: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; height?: number; footer?: ReactNode; className?: string }) {
  return (
    <Panel className={className}>
      <PanelHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="p-3 pr-4" style={{ height }}>{children}</div>
      {footer && <div className="px-4 py-3 border-t border-ink-100">{footer}</div>}
    </Panel>
  );
}

export function TrendChart({
  data, metrics, currency, stacked,
}: { data: SeriesPoint[]; metrics: { key: string; label: string; color?: string }[]; currency?: boolean; stacked?: boolean }) {
  const fmt = currency ? (v: number) => moneyCompact(v) : (v: number) => numCompact(v);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <defs>
          {metrics.map((m, i) => (
            <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color ?? CHART_COLORS[i]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={m.color ?? CHART_COLORS[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axisProps} tickFormatter={fmt} width={54} />
        <RTooltip content={<ChartTooltip formatter={fmt} />} />
        {metrics.length > 1 && <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />}
        {metrics.map((m, i) => (
          <Area
            key={m.key} type="monotone" dataKey={m.key} name={m.label}
            stackId={stacked ? '1' : undefined}
            stroke={m.color ?? CHART_COLORS[i]} strokeWidth={2}
            fill={`url(#grad-${m.key})`} dot={false} activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data, metrics, currency, horizontal, xKey = 'label',
}: { data: any[]; metrics: { key: string; label: string; color?: string }[]; currency?: boolean; horizontal?: boolean; xKey?: string }) {
  const fmt = currency ? (v: number) => moneyCompact(v) : (v: number) => numCompact(v);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 8, left: horizontal ? 8 : -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={fmt} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...axisProps} tickFormatter={fmt} width={54} />
          </>
        )}
        <RTooltip content={<ChartTooltip formatter={fmt} />} cursor={{ fill: '#F6F7F9' }} />
        {metrics.length > 1 && <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />}
        {metrics.map((m, i) => (
          <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color ?? CHART_COLORS[i]} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 18 : 34} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LinesChart({
  data, metrics, percent,
}: { data: SeriesPoint[]; metrics: { key: string; label: string; color?: string }[]; percent?: boolean }) {
  const fmt = percent ? (v: number) => `${v}%` : (v: number) => numCompact(v);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axisProps} tickFormatter={fmt} width={48} />
        <RTooltip content={<ChartTooltip formatter={fmt} />} />
        {metrics.length > 1 && <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />}
        {metrics.map((m, i) => (
          <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color ?? CHART_COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 3.5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data, currency, centerLabel, centerValue,
}: { data: { name: string; value: number; color?: string }[]; currency?: boolean; centerLabel?: string; centerValue?: string }) {
  const fmt = currency ? (v: number) => moneyCompact(v) : (v: number) => numCompact(v);
  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} strokeWidth={0}>
            {data.map((d, i) => <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <RTooltip content={<ChartTooltip formatter={fmt} />} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -mt-4">
          <p className="text-lg font-bold text-ink-950 mf-tnum">{centerValue}</p>
          {centerLabel && <p className="text-2xs text-ink-500 uppercase tracking-wide">{centerLabel}</p>}
        </div>
      )}
    </div>
  );
}

/** Small labelled list used beside charts (top products, top categories). */
export function RankList({
  items,
}: { items: { label: string; sublabel?: string; value: string; share?: number; to?: string; tint?: string }[] }) {
  const max = Math.max(...items.map((i) => i.share ?? 0), 1);
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((it, i) => (
        <li key={it.label + i} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-4 text-xs font-semibold text-ink-400 mf-tnum shrink-0">{i + 1}</span>
          <div className="min-w-0 flex-1">
            {it.to
              ? <Link to={it.to} className="block text-[13px] font-medium text-ink-900 hover:text-forge-800 truncate">{it.label}</Link>
              : <p className="text-[13px] font-medium text-ink-900 truncate">{it.label}</p>}
            {it.sublabel && <p className="text-2xs text-ink-500 truncate">{it.sublabel}</p>}
            {it.share != null && (
              <div className="mt-1.5 h-1 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(it.share / max) * 100}%`, background: it.tint ?? '#12817A' }} />
              </div>
            )}
          </div>
          <span className="text-[13px] font-semibold text-ink-950 mf-tnum shrink-0">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────── Reusable analytics helpers ─────────────────────── */

export function useSeries(seed: string, days: number, metrics: { key: string; base: number; growth: number; noise: number }[]) {
  return useMemo(() => api.buildSeries(seed, days, metrics), [seed, days, JSON.stringify(metrics)]);
}

export function MoneyCell({ value, bold }: { value: number; bold?: boolean }) {
  return <span className={cx('mf-tnum', bold ? 'font-semibold text-ink-950' : 'text-ink-800')}>{money(value)}</span>;
}

export function DeltaPill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <Tooltip label={`${up ? 'Up' : 'Down'} ${Math.abs(value).toFixed(1)}% vs previous period`}>
      <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold mf-tnum', up ? 'text-emerald-700' : 'text-red-600')}>
        {up ? '▲' : '▼'}{Math.abs(value).toFixed(1)}%
      </span>
    </Tooltip>
  );
}
