import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, ChevronRight, Filter, Heart, LayoutGrid, List, MessageSquare, Package,
  RotateCcw, Search as SearchIcon, ShieldCheck, ShoppingCart, SlidersHorizontal, Sparkles, Star,
  Store as StoreIcon, ThumbsUp, Truck, Zap, Play, Flag, CircleCheck, Info, Calendar, CreditCard, Tag,
} from 'lucide-react';
import * as api from '../lib/api';
import { useApp } from '../lib/store';
import type { Product } from '../lib/types';
import type { CatalogFilters, SortKey } from '../lib/api';
import { heroImage, bannerImage, productImage, mediaImage } from '../lib/images';
import {
  deliveryPromise, emiPerMonth, formatDate, money, numCompact, relativeTime, discountPct,
} from '../lib/format';
import {
  Alert, Avatar, Badge, Breadcrumbs, Button, Checkbox, DefinitionList, Drawer, EmptyState, Field,
  FilterChip, FilterGroup, IconButton, Input, Modal, Pagination, Panel, PanelHeader, Price,
  ProductCardSkeleton, ProgressBar, Rating, SectionHeading, Select, Tabs, Textarea,
  cx, useDeferred,
} from '../components/ui';
import { DealCountdown, ProductCard, ProductImage, Shelf, VendorCard } from '../components/marketplace';

const Wrap = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx('mx-auto max-w-[1560px] px-3 sm:px-5', className)}>{children}</div>
);

/* ─────────────────────────────── Homepage ───────────────────────────────── */

export function HomePage() {
  const { state } = useApp();
  const ready = useDeferred(220);
  const spotlight = useMemo(() => api.vendorSpotlight(), []);
  const dealGroups = useMemo(() => api.dealsByCategory(), []);
  const recentlyViewed = state.recentlyViewed.map((id) => api.productById.get(id)).filter(Boolean) as Product[];
  const flash = api.homeShelves.flashDeals;

  return (
    <Wrap className="py-4 space-y-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl">
        <img src={heroImage('mf-hero', '#12817A')} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="relative px-6 sm:px-10 py-10 sm:py-14 max-w-2xl">
          <Badge tone="ember" className="bg-ember-500 text-white border-ember-400">Forge Flash · 48 hours only</Badge>
          <h1 className="mt-3 text-3xl sm:text-[42px] font-extrabold text-white leading-[1.08]">
            Up to 45% off audio, wearables and computing
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-lg">
            Twelve verified sellers, one checkout. Free delivery over ₹499, 7-day returns and buyer
            protection on every order across the marketplace.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Button variant="accent" size="lg" to="/deals" iconRight={<ArrowRight className="size-4" />}>Shop the deals</Button>
            <Button size="lg" to="/categories" className="bg-white/10 text-white border-white/25 hover:bg-white/20">Browse categories</Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><Truck className="size-3.5 text-forge-300" /> Free delivery over ₹499</span>
            <span className="flex items-center gap-1.5"><RotateCcw className="size-3.5 text-forge-300" /> 7-day easy returns</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-forge-300" /> Buyer protection</span>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-2">
        {api.topCategories.map((c) => (
          <Link key={c.id} to={`/c/${c.slug}`} className="mf-card p-2.5 flex flex-col items-center gap-2 hover:shadow-card hover:border-forge-300 transition-all group">
            <span className="grid place-items-center size-11 rounded-lg text-white text-[15px] font-bold" style={{ background: c.tint }}>
              {c.name.slice(0, 1)}
            </span>
            <span className="text-[11px] font-medium text-ink-800 text-center leading-tight group-hover:text-forge-800">{c.name}</span>
          </Link>
        ))}
      </section>

      {!ready ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <Shelf
            title="Flash deals" subtitle="Limited stock at these prices" tone="deal"
            products={flash} viewAllTo="/deals" endsAt={flash[0]?.dealEndsAt}
          />
          <Shelf title="Recommended for you" subtitle={`Based on your recent activity, ${api.currentCustomer.name.split(' ')[0]}`} products={api.homeShelves.recommended} viewAllTo="/search?sort=relevance" />

          {/* Deals by category */}
          <section>
            <SectionHeading title="Deals by category" subtitle="The steepest discount in each department right now" action={<Link to="/deals" className="text-[13px] font-semibold text-forge-700 hover:underline">All deals →</Link>} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dealGroups.slice(0, 4).map((g) => (
                <Panel key={g.category.id} className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-[13px] font-semibold text-ink-950">{g.category.name}</p>
                    <Link to={`/c/${g.category.slug}`} className="text-xs text-forge-700 hover:underline">See all</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.products.map((p) => (
                      <Link key={p.id} to={`/p/${p.slug}`} className="group">
                        <ProductImage product={p} size={180} className="aspect-square w-full rounded-md border border-ink-200 group-hover:border-forge-400 transition-colors" />
                        <p className="mt-1.5 text-2xs text-ink-600 line-clamp-1">{p.shortTitle}</p>
                        <p className="text-xs font-bold text-emerald-700">{discountPct(p.price, p.mrp)}% off</p>
                      </Link>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </section>

          <Shelf title="Trending this week" subtitle="Most viewed across the marketplace" products={api.homeShelves.trending} viewAllTo="/search?sort=best_selling" />
          <Shelf title="Best sellers" products={api.homeShelves.bestSellers} viewAllTo="/search?sort=best_selling" />

          {/* Vendor spotlight */}
          <section>
            <SectionHeading title="Vendor spotlight" subtitle="Top-rated sellers on MarketForge this month" action={<Link to="/categories" className="text-[13px] font-semibold text-forge-700 hover:underline">All sellers →</Link>} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spotlight.slice(0, 3).map((s) => <VendorCard key={s.vendor.id} vendor={s.vendor} products={s.products} />)}
            </div>
          </section>

          <Shelf title="Top rated" subtitle="4.5★ and above with 50+ reviews" products={api.homeShelves.topRated} />

          {/* Popular brands */}
          <section>
            <SectionHeading title="Popular brands" />
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {api.brands.filter((b) => b.isFeatured).map((b) => (
                <Link key={b.id} to={`/search?q=${encodeURIComponent(b.name)}`} className="mf-card p-3 flex flex-col items-center gap-1.5 hover:border-forge-300 hover:shadow-card transition-all">
                  <span className="grid place-items-center size-10 rounded-lg text-white font-bold text-xs" style={{ background: b.tint }}>
                    {b.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[11px] font-semibold text-ink-900 text-center leading-tight">{b.name}</span>
                  <span className="text-2xs text-ink-500">{b.productCount} items</span>
                </Link>
              ))}
            </div>
          </section>

          <Shelf title="New arrivals" products={api.homeShelves.newArrivals} viewAllTo="/search?sort=newest" />
          {recentlyViewed.length > 0 && <Shelf title="Recently viewed" products={recentlyViewed} />}
        </>
      )}
    </Wrap>
  );
}

/* ────────────────────────── All categories page ─────────────────────────── */

export function CategoriesPage() {
  return (
    <Wrap className="py-5">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'All categories' }]} />
      <SectionHeading className="mt-3" title="Shop all categories" subtitle={`${api.products.length} listings across ${api.topCategories.length} departments and ${api.activeVendors.length} verified sellers`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {api.topCategories.map((c) => {
          const subs = api.subcategoriesOf(c.id);
          const items = api.productsInCategory(c.id);
          return (
            <Panel key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center size-11 rounded-lg text-white font-bold shrink-0" style={{ background: c.tint }}>{c.name.slice(0, 1)}</span>
                <div className="min-w-0">
                  <Link to={`/c/${c.slug}`} className="text-[15px] font-bold text-ink-950 hover:text-forge-800">{c.name}</Link>
                  <p className="text-xs text-ink-500 mt-0.5 leading-relaxed line-clamp-2">{c.description}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {subs.map((s) => (
                  <li key={s.id}>
                    <Link to={`/c/${c.slug}?sub=${s.slug}`} className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[13px] text-ink-700 hover:bg-ink-50 hover:text-forge-800">
                      <span className="truncate">{s.name}</span>
                      <ChevronRight className="size-3.5 text-ink-300 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
                <span className="text-xs text-ink-500 mf-tnum">{items.length} listings</span>
                <Link to={`/c/${c.slug}`} className="text-xs font-semibold text-forge-700 hover:underline">Browse →</Link>
              </div>
            </Panel>
          );
        })}
      </div>
    </Wrap>
  );
}

/* ─────────────────── Catalogue browsing (category/search) ───────────────── */

const PAGE_SIZE = 24;

function FilterPanelBody({
  filters, setFilters, results, categoryId,
}: { filters: CatalogFilters; setFilters: (f: CatalogFilters) => void; results: Product[]; categoryId?: string }) {
  const facets = api.facetCounts(results);
  const [minP, maxP] = api.priceBounds(results);
  const cat = categoryId ? api.categoryById.get(categoryId) : undefined;
  const root = cat?.parentId ? api.categoryById.get(cat.parentId) : cat;
  const attrs = root?.attributes.filter((a) => a.filterable && a.type === 'select') ?? [];
  const brandIds = Object.keys(facets.brands).sort((a, b) => facets.brands[b] - facets.brands[a]);
  const vendorIds = Object.keys(facets.vendors).sort((a, b) => facets.vendors[b] - facets.vendors[a]);

  const toggle = (key: 'brandIds' | 'vendorIds', id: string) => {
    const cur = filters[key] ?? [];
    setFilters({ ...filters, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };

  return (
    <div className="divide-y divide-ink-200/70">
      {root && api.subcategoriesOf(root.id).length > 0 && (
        <FilterGroup title="Subcategory">
          {api.subcategoriesOf(root.id).map((s) => (
            <Checkbox
              key={s.id} label={s.name} sublabel={`${api.productsInCategory(s.id).length} items`}
              checked={filters.categoryId === s.id}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.checked ? s.id : root.id })}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <Input type="number" prefix="₹" placeholder={String(minP)} value={filters.minPrice ?? ''} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })} />
          <span className="text-ink-400 text-xs">to</span>
          <Input type="number" prefix="₹" placeholder={String(maxP)} value={filters.maxPrice ?? ''} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[[0, 1000], [1000, 5000], [5000, 20000], [20000, 50000], [50000, 0]].map(([lo, hi]) => (
            <button
              key={`${lo}-${hi}`}
              onClick={() => setFilters({ ...filters, minPrice: lo || undefined, maxPrice: hi || undefined })}
              className={cx('rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                filters.minPrice === (lo || undefined) && filters.maxPrice === (hi || undefined)
                  ? 'border-forge-500 bg-forge-50 text-forge-800' : 'border-ink-200 text-ink-600 hover:border-ink-300')}
            >
              {hi ? `₹${numCompact(lo)} – ₹${numCompact(hi)}` : `Over ₹${numCompact(lo)}`}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Customer rating">
        {[4, 3, 2].map((r) => (
          <Checkbox
            key={r}
            label={<span className="inline-flex items-center gap-1.5"><Rating value={r} size="xs" showValue={false} /> {r}★ &amp; above</span>}
            sublabel={`${facets.ratings[r] ?? 0} items`}
            checked={filters.minRating === r}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.checked ? r : undefined })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Brand" count={filters.brandIds?.length}>
        <div className="max-h-52 overflow-y-auto mf-scroll space-y-2 pr-1">
          {brandIds.map((id) => (
            <Checkbox
              key={id} label={api.brandById.get(id)?.name ?? id} sublabel={`${facets.brands[id]} items`}
              checked={filters.brandIds?.includes(id) ?? false} onChange={() => toggle('brandIds', id)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Seller" count={filters.vendorIds?.length}>
        <div className="max-h-52 overflow-y-auto mf-scroll space-y-2 pr-1">
          {vendorIds.map((id) => {
            const v = api.vendorById.get(id);
            return (
              <Checkbox
                key={id}
                label={<span className="inline-flex items-center gap-1">{v?.name}{v && v.rating >= 4.6 && <BadgeCheck className="size-3 text-forge-600" />}</span>}
                sublabel={`${facets.vendors[id]} items · ${v?.rating}★`}
                checked={filters.vendorIds?.includes(id) ?? false} onChange={() => toggle('vendorIds', id)}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Discount">
        {[10, 25, 40, 50].map((d) => (
          <Checkbox key={d} label={`${d}% off or more`} checked={filters.minDiscount === d} onChange={(e) => setFilters({ ...filters, minDiscount: e.target.checked ? d : undefined })} />
        ))}
      </FilterGroup>

      <FilterGroup title="Delivery & availability">
        <Checkbox label="Get it tomorrow" checked={filters.maxDeliveryDays === 1} onChange={(e) => setFilters({ ...filters, maxDeliveryDays: e.target.checked ? 1 : undefined })} />
        <Checkbox label="Within 3 days" checked={filters.maxDeliveryDays === 3} onChange={(e) => setFilters({ ...filters, maxDeliveryDays: e.target.checked ? 3 : undefined })} />
        <Checkbox label="In stock only" checked={filters.inStockOnly ?? false} onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked || undefined })} />
        <Checkbox label="Deals only" checked={filters.dealsOnly ?? false} onChange={(e) => setFilters({ ...filters, dealsOnly: e.target.checked || undefined })} />
      </FilterGroup>

      {attrs.map((a) => (
        <FilterGroup key={a.key} title={a.label} defaultOpen={false}>
          {(a.options ?? []).map((opt) => {
            const cur = filters.attributes?.[a.key] ?? [];
            return (
              <Checkbox
                key={opt} label={opt} checked={cur.includes(opt)}
                onChange={() => setFilters({
                  ...filters,
                  attributes: { ...filters.attributes, [a.key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] },
                })}
              />
            );
          })}
        </FilterGroup>
      ))}
    </div>
  );
}

function CatalogView({
  title, subtitle, breadcrumbs, baseCategoryId, initialQuery, dealsOnly,
}: { title: string; subtitle?: string; breadcrumbs: { label: string; to?: string }[]; baseCategoryId?: string; initialQuery?: string; dealsOnly?: boolean }) {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<CatalogFilters>({ categoryId: baseCategoryId, query: initialQuery, dealsOnly });
  const [sort, setSort] = useState<SortKey>((params.get('sort') as SortKey) ?? 'relevance');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const ready = useDeferred(200);

  useEffect(() => {
    setFilters((f) => ({ ...f, categoryId: baseCategoryId, query: initialQuery, dealsOnly }));
    setPage(1);
  }, [baseCategoryId, initialQuery, dealsOnly]);

  const unfiltered = useMemo(
    () => api.searchCatalog({ categoryId: baseCategoryId, query: initialQuery, dealsOnly }, sort),
    [baseCategoryId, initialQuery, dealsOnly, sort],
  );
  const results = useMemo(() => api.searchCatalog(filters, sort), [filters, sort]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chips: { label: string; clear: () => void }[] = [];
  filters.brandIds?.forEach((id) => chips.push({ label: api.brandById.get(id)?.name ?? id, clear: () => setFilters({ ...filters, brandIds: filters.brandIds!.filter((x) => x !== id) }) }));
  filters.vendorIds?.forEach((id) => chips.push({ label: api.vendorById.get(id)?.name ?? id, clear: () => setFilters({ ...filters, vendorIds: filters.vendorIds!.filter((x) => x !== id) }) }));
  if (filters.minRating) chips.push({ label: `${filters.minRating}★ & above`, clear: () => setFilters({ ...filters, minRating: undefined }) });
  if (filters.minPrice || filters.maxPrice) chips.push({ label: `₹${numCompact(filters.minPrice ?? 0)} – ${filters.maxPrice ? `₹${numCompact(filters.maxPrice)}` : 'any'}`, clear: () => setFilters({ ...filters, minPrice: undefined, maxPrice: undefined }) });
  if (filters.minDiscount) chips.push({ label: `${filters.minDiscount}%+ off`, clear: () => setFilters({ ...filters, minDiscount: undefined }) });
  if (filters.maxDeliveryDays) chips.push({ label: filters.maxDeliveryDays === 1 ? 'Tomorrow delivery' : `Within ${filters.maxDeliveryDays} days`, clear: () => setFilters({ ...filters, maxDeliveryDays: undefined }) });
  if (filters.inStockOnly) chips.push({ label: 'In stock', clear: () => setFilters({ ...filters, inStockOnly: undefined }) });
  Object.entries(filters.attributes ?? {}).forEach(([k, vals]) => vals.forEach((v) => chips.push({ label: v, clear: () => setFilters({ ...filters, attributes: { ...filters.attributes, [k]: (filters.attributes![k]).filter((x) => x !== v) } }) })));
  if (filters.categoryId && filters.categoryId !== baseCategoryId) {
    chips.push({ label: api.categoryById.get(filters.categoryId)?.name ?? '', clear: () => setFilters({ ...filters, categoryId: baseCategoryId }) });
  }

  return (
    <Wrap className="py-4">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-[22px] font-bold text-ink-950 leading-tight">{title}</h1>
          <p className="text-[13px] text-ink-500 mt-1">
            {subtitle ?? `${results.length.toLocaleString('en-IN')} of ${unfiltered.length.toLocaleString('en-IN')} results`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="lg:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setDrawer(true)}>
            Filters{chips.length ? ` (${chips.length})` : ''}
          </Button>
          <Select
            className="h-8 w-[176px] text-[13px]" value={sort}
            onChange={(e) => { setSort(e.target.value as SortKey); setParams({ ...Object.fromEntries(params), sort: e.target.value }); }}
          >
            {api.SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>Sort: {o.label}</option>)}
          </Select>
          <div className="hidden sm:flex items-center rounded-md border border-ink-300 overflow-hidden h-8">
            <button onClick={() => setLayout('grid')} aria-label="Grid view" className={cx('grid place-items-center w-8 h-full', layout === 'grid' ? 'bg-forge-700 text-white' : 'text-ink-500 hover:bg-ink-50')}><LayoutGrid className="size-4" /></button>
            <button onClick={() => setLayout('list')} aria-label="List view" className={cx('grid place-items-center w-8 h-full border-l border-ink-200', layout === 'list' ? 'bg-forge-700 text-white' : 'text-ink-500 hover:bg-ink-50')}><List className="size-4" /></button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c, i) => <FilterChip key={`${c.label}-${i}`} label={c.label} onRemove={() => { c.clear(); setPage(1); }} />)}
          <button onClick={() => { setFilters({ categoryId: baseCategoryId, query: initialQuery, dealsOnly }); setPage(1); }} className="text-xs font-semibold text-forge-700 hover:underline ml-1">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-5 items-start">
        <aside className="hidden lg:block w-[248px] shrink-0 sticky top-[116px]">
          <Panel className="px-3.5 py-1 max-h-[calc(100vh-140px)] overflow-y-auto mf-scroll">
            <div className="flex items-center justify-between py-3 border-b border-ink-200/70">
              <span className="text-[13px] font-bold text-ink-950 flex items-center gap-1.5"><Filter className="size-3.5" /> Filters</span>
              {chips.length > 0 && <button onClick={() => setFilters({ categoryId: baseCategoryId, query: initialQuery, dealsOnly })} className="text-xs text-forge-700 hover:underline">Reset</button>}
            </div>
            <FilterPanelBody filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} results={unfiltered} categoryId={filters.categoryId ?? baseCategoryId} />
          </Panel>
        </aside>

        <div className="flex-1 min-w-0">
          {!ready ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title="No products match these filters"
                body="Try widening the price range, removing a brand filter, or searching for something more general."
                action={<Button variant="primary" size="sm" onClick={() => setFilters({ categoryId: baseCategoryId, query: initialQuery })}>Clear all filters</Button>}
                secondary={<Button size="sm" to="/categories">Browse categories</Button>}
              />
            </Panel>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {shown.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((p) => <ProductCard key={p.id} product={p} layout="list" />)}
            </div>
          )}

          {results.length > PAGE_SIZE && (
            <Panel className="mt-4">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} total={results.length} pageSize={PAGE_SIZE} />
            </Panel>
          )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" subtitle={`${results.length} results`} side="left"
        footer={<>
          <Button block onClick={() => setFilters({ categoryId: baseCategoryId, query: initialQuery, dealsOnly })}>Reset</Button>
          <Button block variant="primary" onClick={() => setDrawer(false)}>Show {results.length} results</Button>
        </>}
      >
        <FilterPanelBody filters={filters} setFilters={(f) => { setFilters(f); setPage(1); }} results={unfiltered} categoryId={filters.categoryId ?? baseCategoryId} />
      </Drawer>
    </Wrap>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const cat = api.categoryBySlug(slug);
  const subSlug = params.get('sub');
  const sub = subSlug ? api.categories.find((c) => c.slug === subSlug && c.parentId === cat?.id) : undefined;

  if (!cat) {
    return (
      <Wrap className="py-16">
        <EmptyState icon={<LayoutGrid className="size-5" />} title="Category not found" body="That department may have been renamed or archived." action={<Button variant="primary" to="/categories">All categories</Button>} />
      </Wrap>
    );
  }

  const target = sub ?? cat;
  return (
    <>
      <div className="relative overflow-hidden">
        <img src={heroImage(cat.slug, cat.tint)} alt="" className="absolute inset-0 size-full object-cover" />
        <Wrap className="relative py-7">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/60">Department</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">{target.name}</h1>
          <p className="mt-1.5 text-sm text-white/70 max-w-2xl leading-relaxed">{target.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {api.subcategoriesOf(cat.id).map((s) => (
              <Link
                key={s.id} to={`/c/${cat.slug}?sub=${s.slug}`}
                className={cx('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  s.id === target.id ? 'bg-white text-ink-950 border-white' : 'border-white/25 text-white/85 hover:bg-white/15')}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </Wrap>
      </div>
      <CatalogView
        key={target.id}
        title={target.name}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Categories', to: '/categories' }, ...(sub ? [{ label: cat.name, to: `/c/${cat.slug}` }] : []), { label: target.name }]}
        baseCategoryId={target.id}
      />
    </>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const catSlug = params.get('cat');
  const cat = catSlug ? api.categoryBySlug(catSlug) : undefined;
  const results = api.searchCatalog({ query: q, categoryId: cat?.id });

  return (
    <>
      {results.length > 0 && (
        <div className="bg-white border-b border-ink-200/80">
          <Wrap className="py-2.5 flex flex-wrap items-center gap-2 text-xs text-ink-600">
            <span className="font-medium">Related:</span>
            {api.popularSearches.slice(0, 6).map((s) => (
              <Link key={s} to={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-ink-200 px-2.5 py-1 hover:border-forge-300 hover:text-forge-800 transition-colors">{s}</Link>
            ))}
          </Wrap>
        </div>
      )}
      <CatalogView
        key={`${q}-${catSlug}`}
        title={q ? `Results for “${q}”` : 'All products'}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }, ...(q ? [{ label: q }] : [])]}
        initialQuery={q || undefined}
        baseCategoryId={cat?.id}
      />
    </>
  );
}

export function DealsPage() {
  return (
    <>
      <div className="bg-ink-950">
        <Wrap className="py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge tone="ember" className="bg-ember-500 text-white border-ember-400" icon={<Zap className="size-3" />}>Forge Flash</Badge>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">Today's deals</h1>
            <p className="mt-1 text-sm text-white/65">Every discount live across the marketplace right now.</p>
          </div>
          {api.homeShelves.flashDeals[0]?.dealEndsAt && (
            <div className="rounded-lg bg-white/10 px-4 py-3 border border-white/15">
              <p className="text-2xs uppercase tracking-wider text-white/60 mb-1">Flash sale ends in</p>
              <DealCountdown endsAt={api.homeShelves.flashDeals[0].dealEndsAt!} className="text-white" />
            </div>
          )}
        </Wrap>
      </div>
      <CatalogView title="Today's deals" breadcrumbs={[{ label: 'Home', to: '/' }, { label: "Today's deals" }]} dealsOnly />
    </>
  );
}

/* ──────────────────────────── Product detail ────────────────────────────── */

export function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted, dispatch, state, toast } = useApp();
  const product = api.productBySlug(slug);
  const [imageIdx, setImageIdx] = useState(0);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('overview');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [writeOpen, setWriteOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setVariantId(product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id);
      setImageIdx(0);
      setQty(1);
      dispatch({ type: 'viewed', productId: product.id });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <Wrap className="py-16">
        <EmptyState icon={<Package className="size-5" />} title="Product not found" body="This listing may have been archived by the seller or removed during moderation." action={<Button variant="primary" to="/">Back to home</Button>} />
      </Wrap>
    );
  }

  const vendor = api.vendorById.get(product.vendorId)!;
  const brand = api.brandById.get(product.brandId)!;
  const cat = api.categoryById.get(product.categoryId)!;
  const root = api.rootCategoryOf(product);
  const variant = product.variants.find((v) => v.id === variantId);
  const price = product.price + (variant?.priceDelta ?? 0);
  const mrp = product.mrp + (variant?.priceDelta ?? 0);
  const inv = api.inventoryByProduct.get(product.id);
  const stock = variant?.stock ?? inv?.available ?? 0;
  const reviews = api.reviewsByProduct.get(product.id) ?? [];
  const dist = api.ratingDistribution(reviews);
  const questions = api.productQuestions.filter((q) => q.productId === product.id);
  const fbt = api.frequentlyBoughtTogether(product);
  const related = api.relatedProducts(product);
  const saved = isWishlisted(product.id);
  const recentlyViewed = state.recentlyViewed.filter((id) => id !== product.id).map((id) => api.productById.get(id)).filter(Boolean) as Product[];
  const promise = new Date(Date.now() + product.deliveryDays * 86400000).toISOString();

  const filteredReviews = reviews.filter((r) =>
    reviewFilter === 'all' ? true
    : reviewFilter === 'media' ? r.media.length > 0
    : reviewFilter === 'verified' ? r.verifiedPurchase
    : r.rating === Number(reviewFilter),
  );
  const sortedReviews = reviewFilter === 'helpful'
    ? [...filteredReviews].sort((a, b) => b.helpfulCount - a.helpfulCount)
    : [...filteredReviews].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const buyNow = () => {
    addToCart(product, { variantId, quantity: qty, silent: true });
    navigate('/checkout');
  };

  return (
    <Wrap className="py-4">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: root.name, to: `/c/${root.slug}` },
        ...(cat.parentId ? [{ label: cat.name, to: `/c/${root.slug}?sub=${cat.slug}` }] : []),
        { label: product.shortTitle },
      ]} />

      <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)_320px]">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[116px] self-start">
          <Panel className="p-3">
            <div className="relative">
              <img
                src={productImage(product.imageKind, product.tint, product.imageSeeds[imageIdx], 800)}
                alt={`${product.title} — view ${imageIdx + 1}`}
                className="aspect-square w-full rounded-lg border border-ink-100"
              />
              {product.isDeal && <Badge tone="ember" className="absolute top-2.5 left-2.5" icon={<Zap className="size-3" />}>Flash deal</Badge>}
              <IconButton
                label={saved ? 'Remove from wishlist' : 'Save to wishlist'} size="md"
                className="absolute top-2 right-2 bg-white/95 border border-ink-200 shadow-xs"
                onClick={() => toggleWishlist(product)}
              >
                <Heart className={cx('size-4', saved ? 'fill-ember-500 text-ember-500' : 'text-ink-500')} />
              </IconButton>
            </div>
            <div className="mt-2.5 flex gap-2">
              {product.imageSeeds.map((seed, i) => (
                <button
                  key={seed} onClick={() => setImageIdx(i)} aria-label={`View ${i + 1}`}
                  className={cx('rounded-md border-2 overflow-hidden transition-colors', i === imageIdx ? 'border-forge-600' : 'border-ink-200 hover:border-ink-300')}
                >
                  <img src={productImage(product.imageKind, product.tint, seed, 120)} alt="" className="size-14" />
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: <RotateCcw className="size-4" />, label: product.returnWindowDays ? `${product.returnWindowDays}-day returns` : 'Non-returnable' },
                { icon: <ShieldCheck className="size-4" />, label: product.warrantyMonths ? `${product.warrantyMonths}-mo warranty` : 'No warranty' },
                { icon: <Truck className="size-4" />, label: product.freeShipping ? 'Free delivery' : 'Delivery ₹49' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1 text-ink-600">
                  <span className="text-forge-700">{f.icon}</span>
                  <span className="text-2xs leading-tight">{f.label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Main info */}
        <div className="min-w-0">
          <Link to={`/search?q=${encodeURIComponent(brand.name)}`} className="text-[13px] font-semibold text-forge-700 hover:underline">{brand.name}</Link>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold text-ink-950 leading-snug">{product.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button onClick={() => { setTab('reviews'); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-1.5 hover:underline">
              <Rating value={product.rating} size="sm" />
              <span className="text-[13px] text-forge-700">{product.ratingCount.toLocaleString('en-IN')} ratings · {reviews.length} reviews</span>
            </button>
            <span className="text-ink-300">|</span>
            <span className="text-[13px] text-ink-600">{numCompact(product.soldCount)}+ bought recently</span>
            {product.badges.map((b) => <Badge key={b} tone="forge">{b}</Badge>)}
          </div>

          <div className="mt-4 pt-4 border-t border-ink-200/70">
            <div className="flex flex-wrap items-end gap-3">
              <Price value={price} mrp={mrp} size="xl" />
              {discountPct(price, mrp) >= 20 && <Badge tone="ember">Lowest in 90 days</Badge>}
            </div>
            <p className="text-xs text-ink-500 mt-1">
              Inclusive of all taxes · {product.taxRatePct}% GST · Free delivery over ₹499
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3 py-2">
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500 flex items-center gap-1"><CreditCard className="size-3" /> EMI from</p>
                <p className="text-[13px] font-bold text-ink-950 mf-tnum mt-0.5">{money(emiPerMonth(price, 12))}/mo</p>
                <p className="text-2xs text-ink-500">12 months · no-cost on select cards</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-2xs font-semibold uppercase tracking-wide text-emerald-700 flex items-center gap-1"><Tag className="size-3" /> Bank offer</p>
                <p className="text-[13px] font-bold text-emerald-900 mt-0.5">10% off up to ₹2,000</p>
                <p className="text-2xs text-emerald-700">HDFC credit cards · code FORGE10</p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3 py-2">
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500 flex items-center gap-1"><Calendar className="size-3" /> Delivery</p>
                <p className="text-[13px] font-bold text-ink-950 mt-0.5">{deliveryPromise(promise)}</p>
                <p className="text-2xs text-ink-500">to {state.deliveryPin} · {product.fulfilment === 'marketforge' ? 'Fulfilled by MarketForge' : `Ships from ${vendor.homeCity}`}</p>
              </div>
            </div>
          </div>

          {product.variants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-ink-200/70">
              <p className="text-[13px] font-semibold text-ink-900">
                {product.variants[0].optionName}: <span className="font-normal text-ink-600">{variant?.optionValue}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id} onClick={() => setVariantId(v.id)} disabled={v.stock === 0}
                    className={cx('relative rounded-lg border px-3 py-2 text-left transition-colors min-w-[92px]',
                      v.id === variantId ? 'border-forge-600 bg-forge-50 ring-1 ring-forge-500/30' : 'border-ink-250 border-ink-200 hover:border-ink-400',
                      v.stock === 0 && 'opacity-45 cursor-not-allowed')}
                  >
                    {v.swatch && <span className="inline-block size-3 rounded-full border border-ink-300 mr-1.5 align-middle" style={{ background: v.swatch }} />}
                    <span className="text-[13px] font-medium text-ink-900">{v.optionValue}</span>
                    <span className="block text-2xs text-ink-500 mf-tnum mt-0.5">
                      {v.stock === 0 ? 'Out of stock' : money(product.price + v.priceDelta)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-ink-200/70">
            <h2 className="text-[15px] font-bold text-ink-950">About this product</h2>
            <ul className="mt-2 space-y-1.5">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-[13px] text-ink-700 leading-relaxed">
                  <CircleCheck className="size-4 text-forge-600 shrink-0 mt-0.5" />{h}
                </li>
              ))}
            </ul>
          </div>

          {/* Frequently bought together */}
          {fbt.length > 0 && (
            <Panel className="mt-5">
              <PanelHeader title="Frequently bought together" subtitle="Customers commonly pair these" />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {[product, ...fbt].map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      {i > 0 && <span className="text-lg text-ink-300 font-light">+</span>}
                      <Link to={`/p/${p.slug}`} className="w-[92px]">
                        <ProductImage product={p} size={160} className="aspect-square w-full rounded-md border border-ink-200" />
                        <p className="mt-1 text-2xs text-ink-600 line-clamp-2 leading-snug">{p.shortTitle}</p>
                        <p className="text-xs font-semibold text-ink-950 mf-tnum">{money(p.price)}</p>
                      </Link>
                    </div>
                  ))}
                  <div className="ml-auto text-right">
                    <p className="text-xs text-ink-500">Bundle total</p>
                    <p className="text-lg font-bold text-ink-950 mf-tnum">{money([product, ...fbt].reduce((s, p) => s + p.price, 0))}</p>
                    <Button
                      size="sm" variant="accent" className="mt-1.5"
                      onClick={() => { [product, ...fbt].forEach((p) => addToCart(p, { silent: true })); toast({ title: 'Bundle added to cart', body: `${fbt.length + 1} items`, variant: 'success', action: { label: 'View cart', to: '/cart' } }); }}
                    >
                      Add all {fbt.length + 1} to cart
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Tabs */}
          <Panel className="mt-5" id="reviews">
            <Tabs
              items={[
                { key: 'overview', label: 'Description' },
                { key: 'specs', label: 'Specifications' },
                { key: 'reviews', label: 'Reviews', count: reviews.length },
                { key: 'qa', label: 'Questions', count: questions.length },
                { key: 'shipping', label: 'Shipping & returns' },
              ]}
              value={tab} onChange={setTab} className="px-2 lg:px-4"
            />

            {tab === 'overview' && (
              <div className="p-4 space-y-5">
                <p className="text-[13px] text-ink-700 leading-relaxed">{product.description}</p>
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">What's in the box</h3>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {product.whatsIncluded.map((w) => (
                      <li key={w} className="flex gap-2 text-[13px] text-ink-700"><CircleCheck className="size-4 text-forge-600 shrink-0 mt-0.5" />{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Alert tone="info" title={`${product.warrantyMonths}-month manufacturer warranty`}>
                    Warranty runs from the invoice date and is honoured at authorised service centres. {vendor.name} coordinates claims for the first 30 days.
                  </Alert>
                  <Alert tone="success" title={product.returnWindowDays ? `${product.returnWindowDays}-day return window` : 'Non-returnable item'}>
                    {product.returnWindowDays
                      ? 'Free pickup for damaged or incorrect items. Change-of-mind returns must be unused with original packaging.'
                      : 'This category cannot be returned once delivered, in line with hygiene and food safety rules.'}
                  </Alert>
                </div>
              </div>
            )}

            {tab === 'specs' && (
              <div className="p-4 space-y-5">
                {product.specs.map((group) => (
                  <div key={group.group}>
                    <h3 className="text-[13px] font-bold text-ink-950 mb-2">{group.group}</h3>
                    <div className="rounded-lg border border-ink-200 overflow-hidden">
                      {group.rows.map((row, i) => (
                        <div key={row.label} className={cx('grid grid-cols-[minmax(120px,200px)_1fr] gap-3 px-3 py-2', i % 2 === 0 ? 'bg-ink-50/60' : 'bg-white')}>
                          <span className="text-xs text-ink-500">{row.label}</span>
                          <span className="text-[13px] text-ink-900">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">Logistics</h3>
                  <DefinitionList
                    columns={3}
                    items={[
                      { label: 'SKU', value: product.sku },
                      { label: 'Barcode (EAN)', value: product.barcode },
                      { label: 'HSN code', value: product.hsnCode },
                      { label: 'Weight', value: `${product.weightKg} kg` },
                      { label: 'Dimensions', value: `${product.dimensionsCm.l} × ${product.dimensionsCm.w} × ${product.dimensionsCm.h} cm` },
                      { label: 'Fulfilment', value: product.fulfilment === 'marketforge' ? 'MarketForge' : 'Seller' },
                    ]}
                  />
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="p-4">
                <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                  <div>
                    <div className="text-center pb-4 border-b border-ink-100">
                      <p className="text-4xl font-extrabold text-ink-950 mf-tnum">{product.rating.toFixed(1)}</p>
                      <Rating value={product.rating} size="md" showValue={false} className="mt-1 justify-center" />
                      <p className="mt-1 text-xs text-ink-500">{product.ratingCount.toLocaleString('en-IN')} global ratings</p>
                    </div>
                    <div className="py-3 space-y-1.5">
                      {dist.map((d) => (
                        <button key={d.star} onClick={() => setReviewFilter(String(d.star))} className="flex w-full items-center gap-2 group">
                          <span className="text-xs text-forge-700 group-hover:underline w-8 text-left mf-tnum">{d.star}★</span>
                          <span className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                            <span className="block h-full bg-amber-400" style={{ width: `${d.share}%` }} />
                          </span>
                          <span className="text-xs text-ink-500 w-9 text-right mf-tnum">{d.share.toFixed(0)}%</span>
                        </button>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-ink-100">
                      <p className="text-[13px] font-semibold text-ink-950">Review this product</p>
                      <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">Share your experience with other shoppers.</p>
                      <Button size="sm" block className="mt-2.5" onClick={() => setWriteOpen(true)}>Write a review</Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-ink-100">
                      <p className="text-[13px] font-semibold text-ink-950 mb-2">Seller rating</p>
                      <div className="space-y-2">
                        {[['Packaging', 4.6], ['Item accuracy', 4.7], ['Shipping speed', 4.3], ['Communication', 4.5]].map(([label, v]) => (
                          <ProgressBar key={label as string} label={label as string} value={(v as number) * 20} showValue={false} tone="forge" />
                        ))}
                      </div>
                      <Link to={`/store/${vendor.slug}`} className="mt-2 inline-block text-xs font-semibold text-forge-700 hover:underline">
                        See all {vendor.name} ratings →
                      </Link>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-ink-100">
                      {[
                        { key: 'all', label: 'All reviews' },
                        { key: 'helpful', label: 'Most helpful' },
                        { key: 'media', label: 'With photos' },
                        { key: 'verified', label: 'Verified only' },
                        { key: '5', label: '5 star' },
                        { key: '1', label: '1 star' },
                      ].map((f) => (
                        <button
                          key={f.key} onClick={() => setReviewFilter(f.key)}
                          className={cx('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            reviewFilter === f.key ? 'border-forge-500 bg-forge-50 text-forge-800' : 'border-ink-200 text-ink-600 hover:border-ink-300')}
                        >{f.label}</button>
                      ))}
                    </div>

                    {sortedReviews.length === 0 ? (
                      <EmptyState compact icon={<Star className="size-5" />} title="No reviews match this filter" body="Try another filter to see more customer feedback." />
                    ) : (
                      <ul className="divide-y divide-ink-100">
                        {sortedReviews.slice(0, 8).map((r) => (
                          <li key={r.id} className="py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={r.customerName} seed={r.avatarSeed} size="sm" />
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-ink-900">{r.customerName}</p>
                                <p className="text-2xs text-ink-500">{r.location} · {relativeTime(r.createdAt)}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Rating value={r.rating} size="xs" showValue={false} />
                              <span className="text-[13px] font-semibold text-ink-950">{r.title}</span>
                              {r.verifiedPurchase && <Badge tone="green" icon={<CircleCheck className="size-3" />}>Verified purchase</Badge>}
                              {r.variantLabel && <Badge tone="neutral">{r.variantLabel}</Badge>}
                            </div>
                            <p className="mt-1.5 text-[13px] text-ink-700 leading-relaxed">{r.body}</p>
                            {r.media.length > 0 && (
                              <div className="mt-2.5 flex gap-2">
                                {r.media.map((m) => (
                                  <div key={m.id} className="relative">
                                    <img src={mediaImage(m.seed, m.tint, 160)} alt={m.caption ?? 'Customer photo'} className="size-16 rounded-md border border-ink-200 object-cover" />
                                    {m.kind === 'video' && (
                                      <span className="absolute inset-0 grid place-items-center rounded-md bg-ink-950/35">
                                        <Play className="size-4 text-white fill-white" />
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {r.vendorResponse && (
                              <div className="mt-3 rounded-lg border-l-2 border-forge-500 bg-forge-50/50 px-3 py-2.5">
                                <p className="text-2xs font-semibold text-forge-800 flex items-center gap-1.5">
                                  <StoreIcon className="size-3" /> Response from {r.vendorResponse.author} · {relativeTime(r.vendorResponse.at)}
                                </p>
                                <p className="mt-1 text-xs text-ink-700 leading-relaxed">{r.vendorResponse.body}</p>
                              </div>
                            )}
                            <div className="mt-2.5 flex items-center gap-4">
                              <button
                                onClick={() => dispatch({ type: 'review/helpful', reviewId: r.id })}
                                className={cx('inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                                  state.helpfulReviews.includes(r.id) ? 'border-forge-400 bg-forge-50 text-forge-800' : 'border-ink-250 border-ink-200 text-ink-600 hover:border-ink-400')}
                              >
                                <ThumbsUp className="size-3" /> Helpful ({r.helpfulCount + (state.helpfulReviews.includes(r.id) ? 1 : 0)})
                              </button>
                              <button onClick={() => toast({ title: 'Review reported', body: 'Our moderation team will look at this within 24 hours.', variant: 'info' })} className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-red-600">
                                <Flag className="size-3" /> Report
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'qa' && (
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink-100">
                  <p className="text-[13px] text-ink-600">{questions.length} customer questions answered</p>
                  <Button size="sm" icon={<MessageSquare className="size-4" />} onClick={() => toast({ title: 'Question submitted', body: 'The seller usually replies within a day.', variant: 'success' })}>
                    Ask a question
                  </Button>
                </div>
                <ul className="divide-y divide-ink-100">
                  {questions.map((q) => (
                    <li key={q.id} className="py-4">
                      <p className="text-[13px] font-semibold text-ink-950 flex gap-2">
                        <span className="text-forge-700 shrink-0">Q:</span>{q.question}
                      </p>
                      <p className="text-2xs text-ink-500 mt-1 ml-5">Asked by {q.askedBy} · {relativeTime(q.askedAt)} · {q.votes} found this useful</p>
                      {q.answers.map((a) => (
                        <div key={a.id} className="mt-2.5 ml-5">
                          <p className="text-[13px] text-ink-700 leading-relaxed flex gap-2">
                            <span className="text-ink-400 font-semibold shrink-0">A:</span>{a.body}
                          </p>
                          <p className="text-2xs text-ink-500 mt-1 ml-5 flex items-center gap-1.5">
                            {a.authorType === 'vendor' && <Badge tone="forge">Seller</Badge>}
                            {a.author} · {relativeTime(a.at)} · {a.helpfulCount} helpful
                          </p>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'shipping' && (
              <div className="p-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">Shipping</h3>
                  <p className="text-[13px] text-ink-700 leading-relaxed">{api.storeByVendor.get(vendor.id)?.policies.shipping}</p>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">Returns</h3>
                  <p className="text-[13px] text-ink-700 leading-relaxed">{api.storeByVendor.get(vendor.id)?.policies.returns}</p>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">Warranty</h3>
                  <p className="text-[13px] text-ink-700 leading-relaxed">{api.storeByVendor.get(vendor.id)?.policies.warranty}</p>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-ink-950 mb-2">Delivery options to {state.deliveryPin}</h3>
                  <ul className="space-y-2">
                    {api.shippingMethods.filter((m) => m.isActive).slice(0, 3).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-ink-200 px-3 py-2">
                        <span>
                          <span className="block text-[13px] font-medium text-ink-900">{m.name}</span>
                          <span className="block text-2xs text-ink-500">{m.minDays === 0 ? 'Same day' : `${m.minDays}–${m.maxDays} days`}{m.supportsCod ? ' · COD available' : ''}</span>
                        </span>
                        <span className="text-[13px] font-semibold text-ink-950 mf-tnum">
                          {m.freeAbove && price >= m.freeAbove ? 'Free' : money(m.baseRate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Buy box */}
        <div className="lg:sticky lg:top-[116px] self-start space-y-3">
          <Panel className="p-4">
            <Price value={price} mrp={mrp} size="lg" />
            <p className="mt-2 text-[13px] text-ink-700">
              <span className="font-semibold text-emerald-700">{product.freeShipping ? 'FREE delivery' : `Delivery ${money(49)}`}</span>{' '}
              <span className="font-semibold text-ink-950">{deliveryPromise(promise)}</span>
            </p>
            <p className="text-xs text-ink-500 mt-1 flex items-start gap-1.5">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              Order within 6 hrs 12 mins for the earliest slot to {state.deliveryPin}
            </p>

            <p className={cx('mt-3 text-[15px] font-bold', stock === 0 ? 'text-red-600' : stock <= 8 ? 'text-amber-600' : 'text-emerald-700')}>
              {stock === 0 ? 'Currently unavailable' : stock <= 8 ? `Only ${stock} left in stock` : 'In stock'}
            </p>

            {stock > 0 && (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[13px] text-ink-600">Qty</label>
                  <Select className="h-9 w-[76px]" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                    {Array.from({ length: Math.min(10, stock) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </Select>
                  {qty > 1 && <span className="text-xs text-ink-500 mf-tnum">= {money(price * qty)}</span>}
                </div>
                <div className="mt-3 space-y-2">
                  <Button variant="accent" size="lg" block icon={<ShoppingCart className="size-4" />} onClick={() => addToCart(product, { variantId, quantity: qty })}>
                    Add to cart
                  </Button>
                  <Button variant="primary" size="lg" block onClick={buyNow}>Buy now</Button>
                  <Button size="md" block icon={<Heart className={cx('size-4', saved && 'fill-ember-500 text-ember-500')} />} onClick={() => toggleWishlist(product)}>
                    {saved ? 'Saved to wishlist' : 'Add to wishlist'}
                  </Button>
                </div>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-ink-100 space-y-2 text-xs">
              {[
                ['Sold by', <Link key="v" to={`/store/${vendor.slug}`} className="mf-link font-medium">{vendor.name}</Link>],
                ['Fulfilled by', product.fulfilment === 'marketforge' ? 'MarketForge' : vendor.name],
                ['Ships from', `${vendor.homeCity}, ${vendor.homeState}`],
                ['Payment', product.codAvailable ? 'Secure transaction · COD available' : 'Secure transaction · Prepaid only'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-start justify-between gap-3">
                  <span className="text-ink-500">{k}</span>
                  <span className="text-ink-900 text-right">{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center size-10 rounded-lg text-white font-bold text-xs shrink-0" style={{ background: vendor.tint }}>
                {vendor.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <Link to={`/store/${vendor.slug}`} className="text-[14px] font-bold text-ink-950 hover:text-forge-800 flex items-center gap-1">
                  {vendor.name}
                  {vendor.rating >= 4.6 && <BadgeCheck className="size-4 text-forge-600" />}
                </Link>
                <Rating value={vendor.rating} count={vendor.ratingCount} size="xs" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ['On-time ship', `${vendor.onTimeShipRate}%`],
                ['Fulfilment', `${vendor.fulfilmentRate}%`],
                ['Response', `${vendor.responseTimeHours}h`],
                ['Products', String(vendor.productCount)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md bg-ink-50 border border-ink-200/70 px-2 py-1.5">
                  <p className="text-2xs text-ink-500">{k}</p>
                  <p className="text-[13px] font-semibold text-ink-950 mf-tnum">{v}</p>
                </div>
              ))}
            </div>
            <Button size="sm" block className="mt-3" to={`/store/${vendor.slug}`}>Visit store</Button>
          </Panel>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Shelf title="Similar products" products={related} />
        <Shelf title="Customers also viewed" products={[...related].reverse()} />
        {recentlyViewed.length > 0 && <Shelf title="Recently viewed" products={recentlyViewed} />}
      </div>

      <WriteReviewModal open={writeOpen} onClose={() => setWriteOpen(false)} productTitle={product.shortTitle} />
    </Wrap>
  );
}

export function WriteReviewModal({
  open, onClose, productTitle,
}: { open: boolean; onClose: () => void; productTitle: string }) {
  const { toast } = useApp();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const submit = () => {
    toast({ title: 'Review submitted', body: 'Thanks — it will appear once moderation completes.', variant: 'success' });
    onClose();
    setRating(0); setTitle(''); setBody(''); setPhotos([]);
  };

  return (
    <Modal
      open={open} onClose={onClose} title="Write a review" subtitle={productTitle} size="md"
      footer={<>
        <Button size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" variant="primary" disabled={!rating || !body.trim()} onClick={submit}>Submit review</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="Overall rating" required>
          <div className="flex items-center gap-3">
            <Rating value={rating} size="lg" showValue={false} onChange={setRating} />
            <span className="text-[13px] text-ink-600">
              {['Select a rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
            </span>
          </div>
        </Field>
        <Field label="Headline">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum up your experience in a line" maxLength={80} />
        </Field>
        <Field label="Your review" required hint="What did you use it for? What worked, what did not?">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Share the details that would have helped you before buying…" />
        </Field>
        <Field label="Add photos or video" hint="Up to 5 images (JPG, PNG) or one video under 60 seconds">
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p} className="relative">
                <img src={mediaImage(`upload-${i}`, '#12817A', 88)} alt="" className="size-16 rounded-md border border-ink-200" />
                <button onClick={() => setPhotos(photos.filter((x) => x !== p))} className="absolute -top-1.5 -right-1.5 grid place-items-center size-5 rounded-full bg-ink-950 text-white text-xs">×</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                onClick={() => setPhotos([...photos, `photo-${photos.length + 1}.jpg`])}
                className="grid place-items-center size-16 rounded-md border-2 border-dashed border-ink-300 text-ink-400 hover:border-forge-400 hover:text-forge-600 transition-colors text-xs"
              >
                + Add
              </button>
            )}
          </div>
        </Field>
        <Alert tone="info">Reviews are published under your display name and marked Verified purchase when we can match them to an order.</Alert>
      </div>
    </Modal>
  );
}

/* ────────────────────────── Vendor storefront ───────────────────────────── */

export function VendorStorePage() {
  const { slug = '' } = useParams();
  const vendor = api.vendorBySlug(slug);
  const [tab, setTab] = useState('products');

  if (!vendor) {
    return (
      <Wrap className="py-16">
        <EmptyState icon={<StoreIcon className="size-5" />} title="Store not found" body="This seller may have been suspended or is no longer trading on MarketForge." action={<Button variant="primary" to="/">Back to home</Button>} />
      </Wrap>
    );
  }

  const store = api.storeByVendor.get(vendor.id);
  const items = api.vendorProducts(vendor.id).filter((p) => p.status === 'published');
  const reviews = api.vendorReviews(vendor.id);
  const dist = api.ratingDistribution(reviews);
  const ratings = api.sellerRatings.filter((r) => r.vendorId === vendor.id);
  const years = Math.max(1, Math.round((Date.now() - +new Date(vendor.joinedAt)) / (365 * 86400000)));

  return (
    <>
      <div className="relative">
        <img src={bannerImage(vendor.id, vendor.tint)} alt="" className="h-36 sm:h-48 w-full object-cover" />
        <Wrap>
          <div className="relative -mt-12 sm:-mt-14 pb-4">
            <div className="flex flex-wrap items-end gap-4">
              <span className="grid place-items-center size-20 sm:size-24 rounded-xl border-4 border-white shadow-pop text-white font-extrabold text-2xl shrink-0" style={{ background: vendor.tint }}>
                {vendor.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-ink-950">{vendor.name}</h1>
                  {vendor.badges.map((b) => <Badge key={b} tone="forge" icon={<BadgeCheck className="size-3" />}>{b}</Badge>)}
                </div>
                <p className="text-[13px] text-ink-600 mt-0.5">{vendor.tagline}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                  <Rating value={vendor.rating} count={vendor.ratingCount} size="xs" />
                  <span>{years} year{years > 1 ? 's' : ''} on MarketForge</span>
                  <span>{vendor.productCount} products</span>
                  <span>{numCompact(store?.metrics.followers ?? 0)} followers</span>
                  <span>{vendor.homeCity}, {vendor.homeState}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Button size="sm">Follow store</Button>
                <Button size="sm" variant="primary" icon={<MessageSquare className="size-4" />}>Contact seller</Button>
              </div>
            </div>
            {store?.announcement && (
              <Alert tone="info" className="mt-3" icon={<Sparkles className="size-4" />}>{store.announcement}</Alert>
            )}
          </div>
        </Wrap>
      </div>

      <Wrap className="pb-6">
        <Panel>
          <Tabs
            items={[
              { key: 'products', label: 'Products', count: items.length },
              { key: 'deals', label: 'Deals', count: items.filter((p) => p.isDeal).length },
              { key: 'reviews', label: 'Reviews', count: reviews.length },
              { key: 'about', label: 'About & policies' },
            ]}
            value={tab} onChange={setTab}
          />
          <div className="p-4">
            {tab === 'products' && (
              <>
                {store?.collections.map((col) => (
                  <div key={col.id} className="mb-5 last:mb-0">
                    <SectionHeading title={col.title} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {col.productIds.map((id) => {
                        const p = api.productById.get(id);
                        return p ? <ProductCard key={id} product={p} showVendor={false} /> : null;
                      })}
                    </div>
                  </div>
                ))}
                <SectionHeading title="All products" subtitle={`${items.length} live listings`} />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {items.map((p) => <ProductCard key={p.id} product={p} showVendor={false} />)}
                </div>
              </>
            )}

            {tab === 'deals' && (
              items.filter((p) => p.isDeal).length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {items.filter((p) => p.isDeal).map((p) => <ProductCard key={p.id} product={p} showVendor={false} />)}
                </div>
              ) : (
                <EmptyState compact icon={<Zap className="size-5" />} title="No active deals" body={`${vendor.name} has no discounted listings right now. Follow the store to hear about the next sale.`} action={<Button size="sm">Follow store</Button>} />
              )
            )}

            {tab === 'reviews' && (
              <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                <div>
                  <div className="rounded-lg border border-ink-200 p-4 text-center">
                    <p className="text-4xl font-extrabold text-ink-950 mf-tnum">{vendor.rating.toFixed(1)}</p>
                    <Rating value={vendor.rating} size="md" showValue={false} className="mt-1 justify-center" />
                    <p className="mt-1 text-xs text-ink-500">{vendor.ratingCount.toLocaleString('en-IN')} seller ratings</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {dist.map((d) => (
                      <div key={d.star} className="flex items-center gap-2">
                        <span className="text-xs text-ink-600 w-8 mf-tnum">{d.star}★</span>
                        <span className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden"><span className="block h-full bg-amber-400" style={{ width: `${d.share}%` }} /></span>
                        <span className="text-xs text-ink-500 w-9 text-right mf-tnum">{d.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg border border-ink-200 p-3">
                    <p className="text-[13px] font-semibold text-ink-950 mb-2">Seller scorecard</p>
                    <div className="space-y-2.5">
                      <ProgressBar label="Packaging" value={92} showValue tone="forge" />
                      <ProgressBar label="Item accuracy" value={95} showValue tone="forge" />
                      <ProgressBar label="Shipping speed" value={vendor.onTimeShipRate} showValue tone="forge" />
                      <ProgressBar label="Communication" value={89} showValue tone="forge" />
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-ink-100">
                  {ratings.map((r) => (
                    <li key={r.id} className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.customerName} size="sm" />
                        <div>
                          <p className="text-[13px] font-semibold text-ink-900">{r.customerName}</p>
                          <p className="text-2xs text-ink-500">{relativeTime(r.createdAt)} · Order verified</p>
                        </div>
                        <Rating value={r.overall} size="xs" className="ml-auto" />
                      </div>
                      <p className="mt-2 text-[13px] text-ink-700 leading-relaxed">{r.comment}</p>
                    </li>
                  ))}
                  {reviews.slice(0, 6).map((r) => (
                    <li key={r.id} className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.customerName} seed={r.avatarSeed} size="sm" />
                        <div>
                          <p className="text-[13px] font-semibold text-ink-900">{r.customerName}</p>
                          <p className="text-2xs text-ink-500">
                            on <Link to={`/p/${api.productById.get(r.productId)?.slug}`} className="mf-link">{api.productById.get(r.productId)?.shortTitle}</Link> · {relativeTime(r.createdAt)}
                          </p>
                        </div>
                        <Rating value={r.rating} size="xs" className="ml-auto" />
                      </div>
                      <p className="mt-2 text-[13px] text-ink-700 leading-relaxed line-clamp-3">{r.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'about' && (
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-[15px] font-bold text-ink-950">About {vendor.name}</h3>
                  <p className="mt-2 text-[13px] text-ink-700 leading-relaxed">{vendor.about}</p>
                  <DefinitionList
                    className="mt-4" columns={2}
                    items={[
                      { label: 'Legal name', value: vendor.legalName },
                      { label: 'On MarketForge since', value: formatDate(vendor.joinedAt) },
                      { label: 'Location', value: `${vendor.homeCity}, ${vendor.homeState}, ${vendor.country}` },
                      { label: 'Categories', value: vendor.categories.map((c) => api.categoryById.get(c)?.name).join(', ') },
                      { label: 'Contact', value: vendor.contactEmail },
                      { label: 'Avg. response time', value: `${vendor.responseTimeHours} hours` },
                    ]}
                  />
                </div>
                <div className="space-y-4">
                  {store && ([
                    ['Shipping policy', store.policies.shipping],
                    ['Return policy', store.policies.returns],
                    ['Warranty', store.policies.warranty],
                  ] as const).map(([t, b]) => (
                    <div key={t}>
                      <h4 className="text-[13px] font-bold text-ink-950">{t}</h4>
                      <p className="mt-1 text-[13px] text-ink-700 leading-relaxed">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </Wrap>
    </>
  );
}
