/**
 * Repository layer.
 *
 * Everything the UI needs is read through these functions. They are synchronous
 * today because the data is local, but the signatures are the ones a real
 * backend would expose — swapping the body for `fetch` keeps the UI unchanged.
 */

import { Rng, DEMO_NOW } from './rng';
import * as db from './data/seed';
import { categories, topCategories, brands, faqs, deliveryPartners, shippingMethods, shippingZones, warehouses, helpTopics } from './data/taxonomy';
import type {
  Order, Product, Review, SearchSuggestion, SeriesPoint, Vendor,
} from './types';

export { categories, topCategories, brands, faqs, deliveryPartners, shippingMethods, shippingZones, warehouses, helpTopics };
export const {
  vendors, vendorById, activeVendors, vendorVerifications, verificationByVendor,
  products, productById, publishedProducts, pp, inventory, inventoryByProduct, stockMovements, alertTypeFor,
  customers, customerById, currentCustomer, addresses, paymentMethods, users, loginEvents,
  orders, orderById, orderItems, myOrders, payments, shipments,
  returns, returnById, refunds, reviews, reviewsByProduct, sellerRatings, productQuestions,
  promotions, coupons, giftCards, commissions, payouts,
  disputes, supportTickets, notifications, auditLogs, wishlists, vendorStores, storeByVendor,
} = db;

export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const brandById = new Map(brands.map((b) => [b.id, b]));

/* ─────────────────────────── Catalog queries ────────────────────────────── */

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug && c.parentId === null)
    ?? categories.find((c) => c.slug === slug);
}

export function subcategoriesOf(categoryId: string) {
  return categories.filter((c) => c.parentId === categoryId).sort((a, b) => a.order - b.order);
}

/** Root category for a product (walks up one level if needed). */
export function rootCategoryOf(product: Product) {
  const cat = categoryById.get(product.categoryId);
  if (!cat) return topCategories[0];
  return cat.parentId ? categoryById.get(cat.parentId) ?? cat : cat;
}

export function productBySlug(slug: string) {
  return products.find((p) => p.slug === slug) ?? productById.get(slug);
}

export function productsInCategory(categoryId: string) {
  return publishedProducts.filter(
    (p) => p.categoryId === categoryId || p.categoryId.startsWith(`${categoryId}_`),
  );
}

export interface CatalogFilters {
  categoryId?: string;
  query?: string;
  brandIds?: string[];
  vendorIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  minDiscount?: number;
  maxDeliveryDays?: number;
  dealsOnly?: boolean;
  attributes?: Record<string, string[]>;
}

export type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'best_selling' | 'discount';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Customer Rating' },
  { key: 'newest', label: 'Newest Arrivals' },
  { key: 'best_selling', label: 'Best Selling' },
  { key: 'discount', label: 'Discount' },
];

function matchesQuery(p: Product, q: string) {
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const brand = brandById.get(p.brandId)?.name ?? '';
  const vendor = vendorById.get(p.vendorId)?.name ?? '';
  const cat = categoryById.get(p.categoryId)?.name ?? '';
  const hay = `${p.title} ${brand} ${vendor} ${cat} ${p.tags.join(' ')}`.toLowerCase();
  return needle.split(/\s+/).every((token) => hay.includes(token));
}

export function searchCatalog(filters: CatalogFilters, sort: SortKey = 'relevance'): Product[] {
  let list = publishedProducts;
  if (filters.categoryId) list = list.filter((p) => p.categoryId === filters.categoryId || p.categoryId.startsWith(`${filters.categoryId}_`));
  if (filters.query) list = list.filter((p) => matchesQuery(p, filters.query!));
  if (filters.brandIds?.length) list = list.filter((p) => filters.brandIds!.includes(p.brandId));
  if (filters.vendorIds?.length) list = list.filter((p) => filters.vendorIds!.includes(p.vendorId));
  if (filters.minPrice != null) list = list.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice != null) list = list.filter((p) => p.price <= filters.maxPrice!);
  if (filters.minRating) list = list.filter((p) => p.rating >= filters.minRating!);
  if (filters.inStockOnly) list = list.filter((p) => (inventoryByProduct.get(p.id)?.available ?? 0) > 0);
  if (filters.minDiscount) list = list.filter((p) => ((p.mrp - p.price) / p.mrp) * 100 >= filters.minDiscount!);
  if (filters.maxDeliveryDays) list = list.filter((p) => p.deliveryDays <= filters.maxDeliveryDays!);
  if (filters.dealsOnly) list = list.filter((p) => p.isDeal);
  if (filters.attributes) {
    for (const [key, values] of Object.entries(filters.attributes)) {
      if (values.length) list = list.filter((p) => values.includes(String(p.attributes[key])));
    }
  }

  const sorted = [...list];
  switch (sort) {
    case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
    case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
    case 'rating': sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount); break;
    case 'newest': sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    case 'best_selling': sorted.sort((a, b) => b.soldCount - a.soldCount); break;
    case 'discount': sorted.sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp); break;
    default:
      sorted.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.soldCount * b.rating - a.soldCount * a.rating);
  }
  return sorted;
}

/** Price bounds for the filter panel, given the non-price filters. */
export function priceBounds(list: Product[]): [number, number] {
  if (!list.length) return [0, 100000];
  const prices = list.map((p) => p.price);
  return [Math.min(...prices), Math.max(...prices)];
}

export function facetCounts(list: Product[]) {
  const count = <T extends string>(get: (p: Product) => T) =>
    list.reduce<Record<string, number>>((acc, p) => {
      const k = get(p);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  return {
    brands: count((p) => p.brandId),
    vendors: count((p) => p.vendorId),
    ratings: list.reduce<Record<number, number>>((acc, p) => {
      [4, 3, 2].forEach((r) => { if (p.rating >= r) acc[r] = (acc[r] ?? 0) + 1; });
      return acc;
    }, {}),
  };
}

/* ─────────────────────────── Homepage shelves ───────────────────────────── */

const shelfRng = new Rng('shelves');

export const homeShelves = {
  flashDeals: publishedProducts.filter((p) => p.isDeal).slice(0, 12),
  trending: [...publishedProducts].sort((a, b) => b.viewCount30d - a.viewCount30d).slice(0, 12),
  bestSellers: [...publishedProducts].sort((a, b) => b.soldCount - a.soldCount).slice(0, 12),
  topRated: [...publishedProducts].filter((p) => p.reviewCount > 5).sort((a, b) => b.rating - a.rating).slice(0, 12),
  newArrivals: [...publishedProducts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 12),
  recommended: shelfRng.shuffle(publishedProducts.filter((p) => p.rating >= 4.2)).slice(0, 12),
  featured: publishedProducts.filter((p) => p.isFeatured).slice(0, 12),
};

export function dealsByCategory() {
  return topCategories.slice(0, 8).map((c) => ({
    category: c,
    products: productsInCategory(c.id).filter((p) => p.mrp > p.price).sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp).slice(0, 4),
  })).filter((g) => g.products.length > 0);
}

export function vendorSpotlight() {
  return [...activeVendors].sort((a, b) => b.rating - a.rating).slice(0, 6).map((v) => ({
    vendor: v,
    store: storeByVendor.get(v.id),
    products: products.filter((p) => p.vendorId === v.id && p.status === 'published').slice(0, 4),
  }));
}

export function relatedProducts(product: Product, limit = 8) {
  const sameCat = publishedProducts.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
  const sameBrand = publishedProducts.filter((p) => p.id !== product.id && p.brandId === product.brandId && p.categoryId !== product.categoryId);
  return [...sameCat, ...sameBrand].slice(0, limit);
}

export function frequentlyBoughtTogether(product: Product) {
  const rng = new Rng(`fbt:${product.id}`);
  const pool = publishedProducts.filter((p) => p.id !== product.id && p.price < product.price * 0.7);
  return rng.sample(pool, 2);
}

/* ──────────────────────────────── Search ────────────────────────────────── */

export const popularSearches = [
  'noise cancelling headphones', 'laptop under 80000', 'air fryer', 'running shoes',
  'sunscreen spf 50', 'mechanical keyboard', 'coffee beans', 'yoga mat', '5g phone', 'dash cam',
];

export function suggest(query: string, limit = 9): SearchSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const out: SearchSuggestion[] = [];

  categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 2).forEach((c) =>
    out.push({ kind: 'category', label: c.name, sublabel: `in ${c.parentId ? categoryById.get(c.parentId)?.name : 'All categories'}`, href: `/c/${c.slug}` }));

  brands.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 2).forEach((b) =>
    out.push({ kind: 'brand', label: b.name, sublabel: `${b.productCount} listings · ${b.origin}`, href: `/search?q=${encodeURIComponent(b.name)}` }));

  activeVendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 2).forEach((v) =>
    out.push({ kind: 'vendor', label: v.name, sublabel: `Seller · ${v.rating}★ · ${v.productCount} products`, href: `/store/${v.slug}` }));

  publishedProducts.filter((p) => matchesQuery(p, q)).slice(0, 5).forEach((p) =>
    out.push({ kind: 'product', label: p.title, sublabel: `${brandById.get(p.brandId)?.name} · ₹${p.price.toLocaleString('en-IN')}`, href: `/p/${p.slug}` }));

  popularSearches.filter((s) => s.includes(q)).slice(0, 2).forEach((s) =>
    out.push({ kind: 'query', label: s, href: `/search?q=${encodeURIComponent(s)}` }));

  return out.slice(0, limit);
}

/* ───────────────────────────── Vendor scope ─────────────────────────────── */

export function vendorBySlug(slug: string) {
  return vendors.find((v) => v.slug === slug) ?? vendorById.get(slug);
}

export function vendorProducts(vendorId: string) {
  return products.filter((p) => p.vendorId === vendorId);
}

export function vendorInventory(vendorId: string) {
  return inventory.filter((i) => i.vendorId === vendorId);
}

/** Orders reduced to only the line items belonging to one vendor. */
export function vendorOrders(vendorId: string): { order: Order; items: Order['items']; subtotal: number; commission: number }[] {
  return orders
    .map((o) => {
      const items = o.items.filter((i) => i.vendorId === vendorId);
      return {
        order: o,
        items,
        subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
        commission: items.reduce((s, i) => s + i.commissionAmount, 0),
      };
    })
    .filter((g) => g.items.length > 0);
}

export function vendorReviews(vendorId: string) {
  return reviews.filter((r) => r.vendorId === vendorId);
}

export function vendorReturns(vendorId: string) {
  return returns.filter((r) => r.vendorId === vendorId);
}

export function vendorPayouts(vendorId: string) {
  return payouts.filter((p) => p.vendorId === vendorId).sort((a, b) => +new Date(b.periodEnd) - +new Date(a.periodEnd));
}

export function vendorCustomers(vendorId: string) {
  const map = new Map<string, { customerId: string; orders: number; spend: number; lastOrderAt: string }>();
  vendorOrders(vendorId).forEach(({ order, subtotal }) => {
    const cur = map.get(order.customerId) ?? { customerId: order.customerId, orders: 0, spend: 0, lastOrderAt: order.placedAt };
    cur.orders += 1;
    cur.spend += subtotal;
    if (+new Date(order.placedAt) > +new Date(cur.lastOrderAt)) cur.lastOrderAt = order.placedAt;
    map.set(order.customerId, cur);
  });
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export function ratingDistribution(list: Review[]) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  list.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
  const total = list.length || 1;
  return [5, 4, 3, 2, 1].map((star) => ({ star, count: dist[star] ?? 0, share: ((dist[star] ?? 0) / total) * 100 }));
}

/* ──────────────────────────── Customer scope ────────────────────────────── */

export function customerOrders(customerId: string) {
  return orders.filter((o) => o.customerId === customerId);
}
export function customerReturns(customerId: string) {
  return returns.filter((r) => r.customerId === customerId);
}
export function customerReviews(customerId: string) {
  return reviews.filter((r) => r.customerId === customerId);
}

/* ─────────────────────────────── Analytics ──────────────────────────────── */

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'custom', label: 'Custom', days: 180 },
];

export function daysForRange(range: RangeKey) {
  return RANGE_OPTIONS.find((r) => r.key === range)?.days ?? 30;
}

/** Deterministic time series with weekly seasonality and a growth trend. */
export function buildSeries(
  seed: string,
  days: number,
  metrics: { key: string; base: number; growth: number; noise: number }[],
): SeriesPoint[] {
  const rng = new Rng(`series:${seed}:${days}`);
  const step = days > 90 ? 7 : 1;
  const points: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i -= step) {
    const date = new Date(DEMO_NOW.getTime() - i * 86400000);
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.18 : dow === 1 ? 0.92 : 1;
    const progress = (days - i) / days;
    const row: SeriesPoint = {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-IN', step > 1 ? { day: 'numeric', month: 'short' } : days > 30 ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric' }),
    };
    metrics.forEach((m) => {
      const trend = m.base * (1 + m.growth * progress);
      const jitter = 1 + (rng.next() - 0.5) * m.noise;
      row[m.key] = Math.max(0, Math.round(trend * weekend * jitter * (step > 1 ? step : 1)));
    });
    points.push(row);
  }
  return points;
}

export function platformKpis(range: RangeKey = '30d') {
  const days = daysForRange(range);
  const rng = new Rng(`kpi:${range}`);
  const scale = days / 30;
  const gmv = Math.round(184_200_000 * scale * rng.float(0.95, 1.05, 3));
  const commissionRate = 0.114;
  return {
    gmv,
    revenue: Math.round(gmv * commissionRate),
    commission: Math.round(gmv * commissionRate * 0.86),
    orders: Math.round(48_200 * scale),
    aov: Math.round(gmv / Math.max(1, Math.round(48_200 * scale))),
    customers: customers.length * 214,
    newCustomers: Math.round(9_400 * scale),
    repeatRate: 42.8,
    vendors: activeVendors.length,
    pendingVendors: vendors.filter((v) => ['submitted', 'under_review'].includes(v.status)).length,
    products: products.length * 92,
    pendingProducts: products.filter((p) => p.status === 'pending_approval').length + 12,
    refunds: Math.round(gmv * 0.021),
    returnRate: 3.4,
    cancellationRate: 1.8,
    conversionRate: 3.42,
    disputesOpen: disputes.filter((d) => !['resolved', 'closed'].includes(d.status)).length,
    ticketsOpen: supportTickets.filter((t) => ['open', 'pending'].includes(t.status)).length,
    deltas: { gmv: 18.4, revenue: 22.1, orders: 12.6, aov: 5.2, customers: 8.9, refunds: -3.1, conversionRate: 0.4 },
  };
}

export function vendorKpis(vendorId: string, range: RangeKey = '30d') {
  const v = vendorById.get(vendorId)!;
  const days = daysForRange(range);
  const scale = days / 30;
  const groups = vendorOrders(vendorId);
  const revenue = Math.round(groups.reduce((s, g) => s + g.subtotal, 0) * (scale / 5));
  const commission = Math.round(groups.reduce((s, g) => s + g.commission, 0) * (scale / 5));
  const vendorReturnList = vendorReturns(vendorId);
  const pending = vendorPayouts(vendorId).filter((p) => p.status !== 'paid').reduce((s, p) => s + p.netAmount, 0);
  return {
    grossSales: revenue,
    netRevenue: revenue - commission,
    commission,
    orders: Math.round(groups.length * (scale / 5)) || groups.length,
    unitsSold: groups.reduce((s, g) => s + g.items.reduce((n, i) => n + i.quantity, 0), 0),
    products: vendorProducts(vendorId).length,
    liveProducts: vendorProducts(vendorId).filter((p) => p.status === 'published').length,
    customers: vendorCustomers(vendorId).length,
    rating: v.rating,
    ratingCount: v.ratingCount,
    returns: vendorReturnList.length,
    returnRate: v.returnRate,
    pendingPayout: pending,
    conversionRate: storeByVendor.get(vendorId)?.metrics.conversionRate ?? 3.1,
    fulfilmentRate: v.fulfilmentRate,
    onTimeShipRate: v.onTimeShipRate,
    deltas: { grossSales: 14.2, orders: 9.4, rating: 0.2, returns: -1.6, conversionRate: 0.6, pendingPayout: 4.1 },
  };
}

export function categoryPerformance() {
  return topCategories.map((c) => {
    const rng = new Rng(`catperf:${c.id}`);
    const list = productsInCategory(c.id);
    const gmv = list.reduce((s, p) => s + p.price * p.soldCount, 0);
    return {
      category: c,
      gmv,
      orders: list.reduce((s, p) => s + p.soldCount, 0),
      products: list.length,
      aov: Math.round(gmv / Math.max(1, list.reduce((s, p) => s + p.soldCount, 0))),
      growth: rng.float(-8, 46, 1),
      returnRate: rng.float(0.8, 9.2, 1),
      conversion: rng.float(1.2, 6.4, 2),
    };
  }).sort((a, b) => b.gmv - a.gmv);
}

export function vendorLeaderboard(): (Vendor & { gmv: number; growth: number })[] {
  return activeVendors
    .map((v) => {
      const rng = new Rng(`vlb:${v.id}`);
      return { ...v, gmv: v.grossSales, growth: rng.float(-6, 52, 1) };
    })
    .sort((a, b) => b.gmv - a.gmv);
}

export function topProducts(vendorId?: string, limit = 8) {
  const list = vendorId ? vendorProducts(vendorId) : publishedProducts;
  return [...list]
    .map((p) => ({ product: p, revenue: p.price * p.soldCount, units: p.soldCount }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/* ───────────────────────────── Notifications ────────────────────────────── */

export function notificationsFor(audience: 'customer' | 'vendor' | 'admin') {
  return notifications.filter((n) => n.audience === audience);
}

/* ─────────────────────────── Pricing utilities ──────────────────────────── */

export function couponByCode(code: string) {
  return coupons.find((c) => c.code.toLowerCase() === code.toLowerCase().trim());
}

export function giftCardByCode(code: string) {
  return giftCards.find((g) => g.code.toLowerCase() === code.toLowerCase().trim());
}

/** Effective commission for a product, resolving product → category → vendor → global. */
export function effectiveCommission(product: Product) {
  const active = commissions.filter((c) => c.status === 'active');
  const rootCat = rootCategoryOf(product);
  const candidates = [
    active.find((c) => c.scope === 'product' && c.scopeId === product.id),
    active.find((c) => c.scope === 'vendor' && c.scopeId === product.vendorId),
    active.find((c) => c.scope === 'category' && (c.scopeId === product.categoryId || c.scopeId === rootCat?.id)),
    active.find((c) => c.scope === 'global'),
  ].filter(Boolean);
  return candidates[0]!;
}
