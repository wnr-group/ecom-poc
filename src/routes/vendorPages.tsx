import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowUpFromLine, Boxes, Check, ClipboardList, Download, Eye, MessageSquare,
  Package, Pencil, Percent, Plus, Printer, RotateCcw, Send, Star, Trash2,
  TrendingUp, Truck, Upload, Users, Wallet, X, CircleAlert, FileText, ShieldCheck,
} from 'lucide-react';
import * as api from '../lib/api';
import { useApp } from '../lib/store';
import type { Product, ProductStatus, VendorOrderStatus } from '../lib/types';
import type { RangeKey } from '../lib/api';
import { productImage } from '../lib/images';
import {
  fileSize, formatDate, formatDateTime, money, moneyCompact, numCompact, relativeTime, titleCase,
} from '../lib/format';
import {
  Alert, Avatar, Badge, Button, Checkbox, ConfirmDialog, DataTable, DefinitionList, Drawer,
  EmptyState, Field, FileDrop, IconButton, Input, KpiRow, Modal, Pagination, Panel, PanelHeader,
  ProgressBar, Radio, Rating, SearchInput, SegmentedControl, Select, StatCard, StatusBadge, Stepper,
  Switch, Tabs, Textarea, Timeline, cx,
} from '../components/ui';
import { ChartCard, DonutChart, LinesChart, RankList, TrendChart } from '../components/marketplace';
import { MoneyLine, PortalPage } from '../components/layout';

const VENDOR_ID = 'ven_techworld';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7d' }, { key: '30d', label: '30d' }, { key: '90d', label: '90d' },
];

function Head({
  title, subtitle, actions,
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950">{title}</h1>
        {subtitle && <p className="text-[13px] text-ink-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────────────────────── Products ─────────────────────────────────── */

const PRODUCT_TABS: { key: string; label: string; match: (p: Product) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'published', label: 'Published', match: (p) => p.status === 'published' },
  { key: 'pending_approval', label: 'Pending approval', match: (p) => p.status === 'pending_approval' },
  { key: 'draft', label: 'Drafts', match: (p) => p.status === 'draft' },
  { key: 'out_of_stock', label: 'Out of stock', match: (p) => p.status === 'out_of_stock' },
  { key: 'rejected', label: 'Rejected', match: (p) => p.status === 'rejected' },
  { key: 'archived', label: 'Archived', match: (p) => p.status === 'archived' },
];

export function VendorProducts() {
  const { toast } = useApp();
  const all = api.vendorProducts(VENDOR_ID);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const navigate = useNavigate();

  const rows = all
    .filter(PRODUCT_TABS.find((t) => t.key === tab)!.match)
    .filter((p) => !query.trim() || `${p.title} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PortalPage>
      <Head
        title="Products" subtitle={`${all.length} listings · ${all.filter((p) => p.status === 'published').length} live on the marketplace`}
        actions={<>
          <Button size="sm" icon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Bulk import</Button>
          <Button size="sm" icon={<Download className="size-4" />} onClick={() => toast({ title: 'Export started', body: `${rows.length} rows · CSV will download shortly`, variant: 'success' })}>Export</Button>
          <Button size="sm" variant="primary" icon={<Plus className="size-4" />} to="/vendor/products/new">Add product</Button>
        </>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Live listings" value={all.filter((p) => p.status === 'published').length} icon={<Package className="size-4" />} tone="green" hint="Visible in search" />
          <StatCard label="In moderation" value={all.filter((p) => p.status === 'pending_approval').length} icon={<ShieldCheck className="size-4" />} tone="amber" hint="Avg 2-day review" />
          <StatCard label="Out of stock" value={all.filter((p) => p.status === 'out_of_stock').length} icon={<CircleAlert className="size-4" />} tone="red" hint="Losing impressions" />
          <StatCard label="Catalogue value" value={moneyCompact(all.reduce((s, p) => s + p.price * (api.inventoryByProduct.get(p.id)?.available ?? 0), 0))} icon={<Boxes className="size-4" />} tone="forge" hint="Stock on hand at retail" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs items={PRODUCT_TABS.map((t) => ({ key: t.key, label: t.label, count: all.filter(t.match).length }))} value={tab} onChange={setTab} />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search by title or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select className="h-9 w-[150px]"><option>All categories</option>{api.topCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
          <Select className="h-9 w-[140px]"><option>All brands</option>{api.brands.slice(0, 8).map((b) => <option key={b.id}>{b.name}</option>)}</Select>
          {selected.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-ink-500 mf-tnum">{selected.length} selected</span>
              <Button size="xs" onClick={() => { toast({ title: `${selected.length} products submitted for approval`, variant: 'success' }); setSelected([]); }}>Submit for approval</Button>
              <Button size="xs" onClick={() => { toast({ title: `${selected.length} products archived`, variant: 'info' }); setSelected([]); }}>Archive</Button>
            </div>
          )}
        </div>
        <DataTable
          rows={rows} keyOf={(p) => p.id} selectable selected={selected} onSelect={setSelected}
          onRowClick={(p) => navigate(`/vendor/products/${p.id}`)}
          empty={<EmptyState icon={<Package className="size-5" />} title="No products here" body="Add a listing or change the filter above." action={<Button size="sm" variant="primary" to="/vendor/products/new">Add product</Button>} />}
          columns={[
            {
              key: 'product', header: 'Product', sortValue: (p) => p.title,
              render: (p) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={productImage(p.imageKind, p.tint, p.imageSeeds[0], 80)} alt="" className="size-9 rounded border border-ink-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-950 line-clamp-1">{p.shortTitle}</p>
                    <p className="text-2xs text-ink-500 mf-tnum">{p.sku} · {api.brandById.get(p.brandId)?.name}</p>
                  </div>
                </div>
              ),
            },
            { key: 'cat', header: 'Category', render: (p) => api.categoryById.get(p.categoryId)?.name, hideBelow: 'lg' },
            { key: 'price', header: 'Price', align: 'right', sortValue: (p) => p.price, render: (p) => <span className="font-semibold mf-tnum">{money(p.price)}</span> },
            { key: 'stock', header: 'Stock', align: 'right', sortValue: (p) => api.inventoryByProduct.get(p.id)?.available ?? 0, render: (p) => {
              const a = api.inventoryByProduct.get(p.id)?.available ?? 0;
              return <span className={cx('font-semibold mf-tnum', a === 0 ? 'text-red-600' : a < 20 ? 'text-amber-600' : 'text-ink-800')}>{a}</span>;
            } },
            { key: 'sold', header: 'Sold', align: 'right', sortValue: (p) => p.soldCount, render: (p) => <span className="mf-tnum">{numCompact(p.soldCount)}</span>, hideBelow: 'md' },
            { key: 'rating', header: 'Rating', align: 'right', render: (p) => <Rating value={p.rating} size="xs" />, hideBelow: 'md' },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            {
              key: 'actions', header: '', align: 'right',
              render: (p) => (
                <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <IconButton label="Preview" size="xs" variant="ghost" onClick={() => window.open(`/p/${p.slug}`, '_blank')}><Eye className="size-3.5" /></IconButton>
                  <IconButton label="Edit" size="xs" variant="ghost" onClick={() => navigate(`/vendor/products/${p.id}`)}><Pencil className="size-3.5" /></IconButton>
                  <IconButton label="Delete" size="xs" variant="ghost" onClick={() => setDeleting(p)}><Trash2 className="size-3.5" /></IconButton>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        open={importOpen} onClose={() => setImportOpen(false)} title="Bulk import products" size="lg"
        subtitle="Upload a CSV or XLSX matching the MarketForge catalogue template"
        footer={<>
          <Button size="sm" onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={() => { setImportOpen(false); toast({ title: 'Import queued', body: '248 rows validating — you will be notified when done', variant: 'success' }); }}>Start import</Button>
        </>}
      >
        <div className="space-y-3">
          <Alert tone="info" title="Before you upload">
            Every row needs a SKU, title, category, price and MRP. Rows that fail validation are returned as an error CSV with the reason on each line.
          </Alert>
          <FileDrop label="Drop your CSV or XLSX here" hint="Up to 5,000 rows · 20 MB max" accept=".csv,.xlsx" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={<Download className="size-4" />}>Download template</Button>
            <Button size="sm" variant="ghost" icon={<FileText className="size-4" />}>Field reference</Button>
          </div>
          <div>
            <p className="mf-label">Recent imports</p>
            <DataTable
              dense
              rows={[
                { id: 'imp1', file: 'techworld-catalogue-aug.csv', rows: 412, ok: 408, at: '28 Aug 2026', status: 'completed' },
                { id: 'imp2', file: 'audio-price-update.csv', rows: 96, ok: 96, at: '19 Aug 2026', status: 'completed' },
                { id: 'imp3', file: 'kestrel-launch-skus.xlsx', rows: 24, ok: 19, at: '11 Aug 2026', status: 'failed' },
              ]}
              keyOf={(r) => r.id}
              columns={[
                { key: 'file', header: 'File', render: (r) => <span className="font-medium">{r.file}</span> },
                { key: 'rows', header: 'Rows', align: 'right', render: (r) => <span className="mf-tnum">{r.rows}</span> },
                { key: 'ok', header: 'Imported', align: 'right', render: (r) => <span className="mf-tnum">{r.ok}</span> },
                { key: 'at', header: 'When', render: (r) => <span className="text-ink-500">{r.at}</span>, hideBelow: 'sm' },
                { key: 'status', header: 'Status', align: 'right', render: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)} title="Delete this listing?"
        body={<>This removes <span className="font-semibold">{deleting?.shortTitle}</span> from the marketplace. Existing orders are unaffected, but the listing and its reviews will no longer be visible.</>}
        confirmLabel="Delete listing"
        onConfirm={() => { toast({ title: 'Listing deleted', body: deleting?.shortTitle, variant: 'info' }); setDeleting(null); }}
      />
    </PortalPage>
  );
}

export function VendorProductForm() {
  const { id } = useParams();
  const { toast, dispatch } = useApp();
  const navigate = useNavigate();
  const existing = id && id !== 'new' ? api.productById.get(id) : undefined;
  const [tab, setTab] = useState('basics');
  const [form, setForm] = useState({
    title: existing?.title ?? '',
    sku: existing?.sku ?? '',
    brandId: existing?.brandId ?? api.brands[0].id,
    categoryId: existing?.categoryId ?? api.categories[1].id,
    price: existing?.price ?? 0,
    mrp: existing?.mrp ?? 0,
    description: existing?.description ?? '',
    status: (existing?.status ?? 'draft') as ProductStatus,
    weightKg: existing?.weightKg ?? 0.5,
    barcode: existing?.barcode ?? '',
    hsnCode: existing?.hsnCode ?? '',
    warrantyMonths: existing?.warrantyMonths ?? 12,
    returnWindowDays: existing?.returnWindowDays ?? 7,
    freeShipping: existing?.freeShipping ?? true,
    codAvailable: existing?.codAvailable ?? true,
  });
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const save = (status: ProductStatus) => {
    if (existing) dispatch({ type: 'product/patch', productId: existing.id, patch: { ...form, status } });
    toast({
      title: status === 'pending_approval' ? 'Submitted for approval' : 'Draft saved',
      body: status === 'pending_approval' ? 'Catalogue review usually completes within 2 business days.' : form.title || 'Untitled listing',
      variant: 'success',
    });
    navigate('/vendor/products');
  };

  return (
    <PortalPage>
      <Head
        title={existing ? 'Edit product' : 'Add a product'}
        subtitle={existing ? `${existing.sku} · last updated ${relativeTime(existing.updatedAt)}` : 'Listings go live after catalogue review'}
        actions={<>
          <Button size="sm" to="/vendor/products">Cancel</Button>
          <Button size="sm" onClick={() => save('draft')}>Save draft</Button>
          <Button size="sm" variant="primary" disabled={!form.title || !form.price} onClick={() => save('pending_approval')}>Submit for approval</Button>
        </>}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <Panel>
          <Tabs
            items={[
              { key: 'basics', label: 'Basics' },
              { key: 'pricing', label: 'Pricing & tax' },
              { key: 'variants', label: 'Variants', count: existing?.variants.length },
              { key: 'media', label: 'Images' },
              { key: 'logistics', label: 'Logistics' },
              { key: 'attributes', label: 'Attributes' },
            ]}
            value={tab} onChange={setTab}
          />
          <div className="p-4">
            {tab === 'basics' && (
              <div className="space-y-3">
                <Field label="Product title" required hint="Include brand, model and the key spec buyers search for">
                  <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Auralis Vox 700 Wireless Over-Ear Headphones" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Brand" required>
                    <Select value={form.brandId} onChange={(e) => set({ brandId: e.target.value })}>
                      {api.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Category" required>
                    <Select value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                      {api.topCategories.map((c) => (
                        <optgroup key={c.id} label={c.name}>
                          {api.subcategoriesOf(c.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </optgroup>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Description" required hint="Plain text. Avoid promotional claims — they are rejected in moderation.">
                  <Textarea rows={6} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe materials, build, what is included and who it is for…" />
                </Field>
                <Field label="Key features" hint="One per line, up to 5 — these appear as bullets on the product page">
                  <Textarea rows={4} defaultValue={existing?.highlights.join('\n')} placeholder={'Hybrid active noise cancellation\nUp to 48 hours playback\nMultipoint pairing'} />
                </Field>
              </div>
            )}

            {tab === 'pricing' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Selling price" required><Input type="number" prefix="₹" value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} /></Field>
                  <Field label="MRP" required><Input type="number" prefix="₹" value={form.mrp} onChange={(e) => set({ mrp: Number(e.target.value) })} /></Field>
                  <Field label="Discount shown">
                    <Input readOnly value={form.mrp > form.price ? `${Math.round(((form.mrp - form.price) / form.mrp) * 100)}%` : '—'} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="GST rate"><Select defaultValue="18">{[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
                  <Field label="HSN code"><Input value={form.hsnCode} onChange={(e) => set({ hsnCode: e.target.value })} /></Field>
                  <Field label="Barcode (EAN)"><Input value={form.barcode} onChange={(e) => set({ barcode: e.target.value })} /></Field>
                </div>
                <Panel className="p-3.5 bg-ink-50/60">
                  <p className="text-[13px] font-semibold text-ink-950">Commission & payout preview</p>
                  <div className="mt-2">
                    <MoneyLine label="Selling price" value={form.price} />
                    <MoneyLine label={`Platform commission (${api.vendorById.get(VENDOR_ID)?.commissionRate}%)`} value={Math.round((form.price * (api.vendorById.get(VENDOR_ID)?.commissionRate ?? 10)) / 100)} tone="debit" />
                    <MoneyLine label="Payment gateway fee (1.9%)" value={Math.round(form.price * 0.019)} tone="debit" />
                    <MoneyLine label="Estimated payout per unit" value={Math.round(form.price * (1 - (api.vendorById.get(VENDOR_ID)?.commissionRate ?? 10) / 100 - 0.019))} bold />
                  </div>
                </Panel>
              </div>
            )}

            {tab === 'variants' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-ink-600">Variants let buyers pick a size, colour or configuration on one listing.</p>
                  <Button size="sm" icon={<Plus className="size-4" />}>Add variant</Button>
                </div>
                <DataTable
                  rows={existing?.variants ?? []} keyOf={(v) => v.id} dense
                  empty={<EmptyState compact icon={<Boxes className="size-5" />} title="No variants" body="This listing is sold as a single configuration." action={<Button size="sm">Add variant</Button>} />}
                  columns={[
                    { key: 'opt', header: 'Option', render: (v) => <span className="font-medium">{v.optionName}: {v.optionValue}</span> },
                    { key: 'sku', header: 'SKU', render: (v) => <span className="mf-tnum text-ink-600">{v.sku}</span> },
                    { key: 'delta', header: 'Price delta', align: 'right', render: (v) => <span className="mf-tnum">{v.priceDelta ? money(v.priceDelta) : '—'}</span> },
                    { key: 'price', header: 'Final price', align: 'right', render: (v) => <span className="font-semibold mf-tnum">{money(form.price + v.priceDelta)}</span> },
                    { key: 'stock', header: 'Stock', align: 'right', render: (v) => <span className={cx('mf-tnum', v.stock === 0 && 'text-red-600')}>{v.stock}</span> },
                    { key: 'def', header: 'Default', align: 'right', render: (v) => v.isDefault ? <Badge tone="forge">Default</Badge> : null },
                  ]}
                />
              </div>
            )}

            {tab === 'media' && (
              <div className="space-y-3">
                <Alert tone="warning" title="Image rules">
                  Pure white background, product filling 85% of the frame, minimum 1000×1000px. No text, watermarks or promotional overlays — these are the most common rejection reason.
                </Alert>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(existing?.imageSeeds ?? []).map((seed, i) => (
                    <div key={seed} className="relative group">
                      <img src={productImage(existing!.imageKind, existing!.tint, seed, 200)} alt="" className="aspect-square w-full rounded-md border border-ink-200" />
                      {i === 0 && <Badge tone="forge" className="absolute top-1.5 left-1.5">Primary</Badge>}
                      <button className="absolute top-1 right-1 grid place-items-center size-5 rounded-full bg-ink-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <FileDrop label="Add image" hint="PNG or JPG" accept="image/*" />
                </div>
              </div>
            )}

            {tab === 'logistics' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Weight (kg)"><Input type="number" step="0.01" value={form.weightKg} onChange={(e) => set({ weightKg: Number(e.target.value) })} /></Field>
                  <Field label="Length (cm)"><Input type="number" defaultValue={existing?.dimensionsCm.l ?? 20} /></Field>
                  <Field label="Width (cm)"><Input type="number" defaultValue={existing?.dimensionsCm.w ?? 15} /></Field>
                  <Field label="Height (cm)"><Input type="number" defaultValue={existing?.dimensionsCm.h ?? 8} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Warranty (months)"><Input type="number" value={form.warrantyMonths} onChange={(e) => set({ warrantyMonths: Number(e.target.value) })} /></Field>
                  <Field label="Return window (days)"><Input type="number" value={form.returnWindowDays} onChange={(e) => set({ returnWindowDays: Number(e.target.value) })} /></Field>
                  <Field label="Dispatch warehouse">
                    <Select>{api.warehouses.map((w) => <option key={w.id}>{w.name}</option>)}</Select>
                  </Field>
                </div>
                <div className="space-y-2.5 pt-1">
                  <Switch checked={form.freeShipping} onChange={(v) => set({ freeShipping: v })} label="Offer free delivery on this listing" />
                  <Switch checked={form.codAvailable} onChange={(v) => set({ codAvailable: v })} label="Allow Cash on Delivery" />
                </div>
              </div>
            )}

            {tab === 'attributes' && (
              <div className="space-y-3">
                <p className="text-[13px] text-ink-600">
                  Category attributes power the filters buyers use. Filling them all improves search placement.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(api.categoryById.get(api.rootCategoryOf({ categoryId: form.categoryId } as Product)?.id ?? '')?.attributes ?? []).map((a) => (
                    <Field key={a.key} label={a.label + (a.unit ? ` (${a.unit})` : '')}>
                      {a.type === 'select' ? (
                        <Select defaultValue={String(existing?.attributes[a.key] ?? '')}>
                          <option value="">Not specified</option>
                          {(a.options ?? []).map((o) => <option key={o}>{o}</option>)}
                        </Select>
                      ) : a.type === 'boolean' ? (
                        <Select defaultValue={String(existing?.attributes[a.key] ?? 'false')}><option value="true">Yes</option><option value="false">No</option></Select>
                      ) : (
                        <Input type="number" defaultValue={String(existing?.attributes[a.key] ?? '')} />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel className="p-4">
            <p className="text-[13px] font-bold text-ink-950">Listing status</p>
            <div className="mt-2"><StatusBadge status={form.status} /></div>
            {existing?.moderation?.reason && (
              <Alert tone="danger" className="mt-3" title="Rejected in moderation">{existing.moderation.reason}</Alert>
            )}
            <div className="mt-3 pt-3 border-t border-ink-100">
              <DefinitionList items={[
                { label: 'SKU', value: <Input className="h-8 mt-1" value={form.sku} onChange={(e) => set({ sku: e.target.value })} /> },
                ...(existing ? [
                  { label: 'Created', value: formatDate(existing.createdAt) },
                  { label: 'Last updated', value: relativeTime(existing.updatedAt) },
                  { label: 'Views (30d)', value: numCompact(existing.viewCount30d) },
                  { label: 'Units sold', value: numCompact(existing.soldCount) },
                ] : []),
              ]} />
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="text-[13px] font-bold text-ink-950">Listing quality</p>
            <div className="mt-3 space-y-2.5">
              <ProgressBar label="Completeness" value={form.title && form.description ? 86 : 42} showValue tone="forge" />
              <ProgressBar label="Image quality" value={existing ? 92 : 0} showValue tone="green" />
              <ProgressBar label="Attribute coverage" value={existing ? 74 : 10} showValue tone="amber" />
            </div>
            <ul className="mt-3 space-y-1.5 text-2xs text-ink-600">
              {['Add at least 4 images', 'Fill every filterable attribute', 'Keep the title under 120 characters', 'Include the warranty period'].map((t) => (
                <li key={t} className="flex gap-1.5"><Check className="size-3 text-emerald-600 shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </PortalPage>
  );
}

/* ───────────────────────────── Inventory ───────────────────────────────── */

export function VendorInventory() {
  const { toast } = useApp();
  const inv = api.vendorInventory(VENDOR_ID);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [adjusting, setAdjusting] = useState<typeof inv[number] | null>(null);
  const [delta, setDelta] = useState(0);
  const [historyFor, setHistoryFor] = useState<typeof inv[number] | null>(null);

  const alerts = {
    low_stock: inv.filter((i) => api.alertTypeFor(i) === 'low_stock'),
    out_of_stock: inv.filter((i) => api.alertTypeFor(i) === 'out_of_stock'),
    overstock: inv.filter((i) => api.alertTypeFor(i) === 'overstock'),
  };
  const rows = (tab === 'all' ? inv : alerts[tab as keyof typeof alerts] ?? inv)
    .filter((i) => !query.trim() || `${i.sku} ${api.productById.get(i.productId)?.title}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PortalPage>
      <Head
        title="Inventory" subtitle={`${inv.length} SKUs across ${new Set(inv.map((i) => i.warehouseId)).size} warehouses`}
        actions={<>
          <Button size="sm" icon={<Download className="size-4" />}>Export stock file</Button>
          <Button size="sm" variant="primary" icon={<ArrowDownToLine className="size-4" />} onClick={() => toast({ title: 'Restock sheet generated', body: `${alerts.low_stock.length + alerts.out_of_stock.length} SKUs below reorder point`, variant: 'success' })}>Generate restock sheet</Button>
        </>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Units on hand" value={numCompact(inv.reduce((s, i) => s + i.available, 0))} icon={<Boxes className="size-4" />} tone="forge" hint={`${numCompact(inv.reduce((s, i) => s + i.reserved, 0))} reserved for open orders`} />
          <StatCard label="Stock value at cost" value={moneyCompact(inv.reduce((s, i) => s + i.available * i.unitCost, 0))} icon={<Wallet className="size-4" />} hint="Excludes incoming" />
          <StatCard label="Low stock" value={alerts.low_stock.length} icon={<CircleAlert className="size-4" />} tone="amber" hint="At or below reorder point" />
          <StatCard label="Out of stock" value={alerts.out_of_stock.length} icon={<X className="size-4" />} tone="red" hint="Not converting" />
        </div>
      </KpiRow>

      {alerts.out_of_stock.length > 0 && (
        <Alert tone="danger" className="mt-3" title={`${alerts.out_of_stock.length} SKUs are unavailable to buyers`}>
          Out-of-stock listings lose search placement. Restock or mark them archived so they stop consuming impressions.
        </Alert>
      )}

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All SKUs', count: inv.length },
            { key: 'low_stock', label: 'Low stock', count: alerts.low_stock.length },
            { key: 'out_of_stock', label: 'Out of stock', count: alerts.out_of_stock.length },
            { key: 'overstock', label: 'Overstock', count: alerts.overstock.length },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search SKU or product" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select className="h-9 w-[190px]"><option>All warehouses</option>{api.warehouses.map((w) => <option key={w.id}>{w.name}</option>)}</Select>
        </div>
        <DataTable
          rows={rows} keyOf={(i) => i.id}
          empty={<EmptyState icon={<Boxes className="size-5" />} title="Nothing to show" body="No SKUs match this filter." />}
          columns={[
            { key: 'sku', header: 'SKU', render: (i) => <span className="font-medium mf-tnum">{i.sku}</span>, sortValue: (i) => i.sku },
            { key: 'product', header: 'Product', render: (i) => <span className="line-clamp-1">{api.productById.get(i.productId)?.shortTitle}</span>, hideBelow: 'md' },
            { key: 'wh', header: 'Warehouse', render: (i) => api.warehouses.find((w) => w.id === i.warehouseId)?.code, hideBelow: 'lg' },
            { key: 'avail', header: 'Available', align: 'right', sortValue: (i) => i.available, render: (i) => <span className={cx('font-semibold mf-tnum', i.available === 0 ? 'text-red-600' : i.available <= i.reorderPoint ? 'text-amber-600' : 'text-ink-900')}>{i.available}</span> },
            { key: 'res', header: 'Reserved', align: 'right', render: (i) => <span className="mf-tnum text-ink-500">{i.reserved}</span>, hideBelow: 'sm' },
            { key: 'inc', header: 'Incoming', align: 'right', render: (i) => <span className="mf-tnum text-ink-500">{i.incoming || '—'}</span>, hideBelow: 'md' },
            { key: 'rop', header: 'Reorder at', align: 'right', render: (i) => <span className="mf-tnum text-ink-500">{i.reorderPoint}</span>, hideBelow: 'lg' },
            { key: 'cost', header: 'Unit cost', align: 'right', render: (i) => <span className="mf-tnum">{money(i.unitCost)}</span>, hideBelow: 'lg' },
            { key: 'alert', header: 'Alert', render: (i) => { const a = api.alertTypeFor(i); return a ? <StatusBadge status={a} /> : <span className="text-2xs text-ink-400">Healthy</span>; } },
            {
              key: 'actions', header: '', align: 'right',
              render: (i) => (
                <div className="flex items-center justify-end gap-1">
                  <Button size="xs" onClick={() => { setAdjusting(i); setDelta(0); }}>Adjust</Button>
                  <Button size="xs" variant="ghost" onClick={() => setHistoryFor(i)}>History</Button>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal
        open={!!adjusting} onClose={() => setAdjusting(null)} title="Adjust stock" subtitle={adjusting?.sku} size="sm"
        footer={<>
          <Button size="sm" onClick={() => setAdjusting(null)}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!delta} onClick={() => { toast({ title: 'Stock adjusted', body: `${adjusting?.sku} · ${delta > 0 ? '+' : ''}${delta} units`, variant: 'success' }); setAdjusting(null); }}>Apply adjustment</Button>
        </>}
      >
        <div className="space-y-3">
          <DefinitionList columns={2} items={[
            { label: 'Current available', value: <span className="mf-tnum">{adjusting?.available}</span> },
            { label: 'Reserved', value: <span className="mf-tnum">{adjusting?.reserved}</span> },
          ]} />
          <Field label="Adjustment type">
            <Select><option>Restock (goods received)</option><option>Cycle count correction</option><option>Damage write-off</option><option>Transfer out</option></Select>
          </Field>
          <Field label="Quantity change" required hint="Use a negative number to reduce stock">
            <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
          </Field>
          <Field label="Reference"><Input placeholder="PO-4821" /></Field>
          <Field label="Note"><Textarea rows={2} placeholder="Why is this adjustment being made?" /></Field>
          {!!delta && (
            <Alert tone="info">New available quantity will be <span className="font-semibold mf-tnum">{(adjusting?.available ?? 0) + delta}</span> units.</Alert>
          )}
        </div>
      </Modal>

      <Drawer
        open={!!historyFor} onClose={() => setHistoryFor(null)} width="max-w-lg"
        title="Inventory history" subtitle={`${historyFor?.sku} · ${api.productById.get(historyFor?.productId ?? '')?.shortTitle}`}
      >
        <DataTable
          dense rows={api.stockMovements.filter((m) => m.inventoryId === historyFor?.id)} keyOf={(m) => m.id}
          empty={<EmptyState compact icon={<Boxes className="size-5" />} title="No movements recorded" />}
          columns={[
            { key: 'at', header: 'When', render: (m) => <span className="mf-tnum text-ink-600">{formatDate(m.at)}</span> },
            { key: 'type', header: 'Type', render: (m) => <Badge tone={m.delta > 0 ? 'green' : 'red'}>{titleCase(m.type)}</Badge> },
            { key: 'delta', header: 'Change', align: 'right', render: (m) => <span className={cx('font-semibold mf-tnum', m.delta > 0 ? 'text-emerald-700' : 'text-red-600')}>{m.delta > 0 ? '+' : ''}{m.delta}</span> },
            { key: 'bal', header: 'Balance', align: 'right', render: (m) => <span className="mf-tnum">{m.balanceAfter}</span> },
            { key: 'actor', header: 'By', render: (m) => <span className="text-2xs text-ink-500">{m.actor}</span> },
          ]}
        />
      </Drawer>
    </PortalPage>
  );
}

/* ─────────────────────────── Vendor orders ─────────────────────────────── */

const VENDOR_ORDER_TABS: { key: string; label: string; statuses: VendorOrderStatus[] }[] = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'new', label: 'New', statuses: ['new'] },
  { key: 'accepted', label: 'Accepted', statuses: ['accepted', 'processing'] },
  { key: 'packed', label: 'Packed', statuses: ['packed', 'ready_for_pickup'] },
  { key: 'shipped', label: 'Shipped', statuses: ['shipped'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { key: 'returns', label: 'Returns', statuses: ['return_requested', 'returned'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'rejected'] },
];

export function VendorOrders() {
  const { toast } = useApp();
  const groups = api.vendorOrders(VENDOR_ID);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<typeof groups[number] | null>(null);
  const pageSize = 15;

  const filtered = groups
    .filter((g) => { const t = VENDOR_ORDER_TABS.find((x) => x.key === tab)!; return !t.statuses.length || g.items.some((i) => t.statuses.includes(i.vendorStatus)); })
    .filter((g) => !query.trim() || g.order.number.toLowerCase().includes(query.toLowerCase()) || g.items.some((i) => i.title.toLowerCase().includes(query.toLowerCase())));
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize);

  const advance = (label: string) => { toast({ title: label, body: 'Buyer notified and tracking updated.', variant: 'success' }); setDetail(null); };

  return (
    <PortalPage>
      <Head
        title="Orders" subtitle={`${groups.length} orders containing your products`}
        actions={<>
          <Button size="sm" icon={<Printer className="size-4" />} onClick={() => toast({ title: 'Packing slips queued', body: '12 slips ready to print', variant: 'success' })}>Print packing slips</Button>
          <Button size="sm" icon={<Download className="size-4" />}>Export orders</Button>
        </>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Awaiting acceptance" value={groups.filter((g) => g.items.some((i) => i.vendorStatus === 'new')).length} icon={<ClipboardList className="size-4" />} tone="amber" hint="Accept within 12 hours" />
          <StatCard label="Ready to ship" value={groups.filter((g) => g.items.some((i) => ['packed', 'ready_for_pickup'].includes(i.vendorStatus))).length} icon={<Truck className="size-4" />} tone="blue" hint="Carrier pickup pending" />
          <StatCard label="In transit" value={groups.filter((g) => g.items.some((i) => i.vendorStatus === 'shipped')).length} icon={<Truck className="size-4" />} tone="forge" hint="With the carrier" />
          <StatCard label="Order value" value={moneyCompact(filtered.reduce((s, g) => s + g.subtotal, 0))} icon={<Wallet className="size-4" />} tone="green" hint="Current filter" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={VENDOR_ORDER_TABS.map((t) => ({
            key: t.key, label: t.label,
            count: t.statuses.length ? groups.filter((g) => g.items.some((i) => t.statuses.includes(i.vendorStatus))).length : groups.length,
          }))}
          value={tab} onChange={(k) => { setTab(k); setPage(1); }}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search order number or product" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <DataTable
          rows={shown} keyOf={(g) => g.order.id} onRowClick={setDetail}
          empty={<EmptyState icon={<ClipboardList className="size-5" />} title="No orders in this view" body="Try another tab or clear the search." />}
          columns={[
            { key: 'num', header: 'Order', render: (g) => <span className="font-medium mf-tnum">{g.order.number}</span> },
            { key: 'date', header: 'Placed', render: (g) => <span className="text-ink-600">{formatDate(g.order.placedAt)}</span>, sortValue: (g) => g.order.placedAt, hideBelow: 'sm' },
            {
              key: 'items', header: 'Items',
              render: (g) => (
                <div className="flex items-center gap-2 min-w-0">
                  <img src={productImage(g.items[0].imageKind, g.items[0].tint, g.items[0].imageSeed, 60)} alt="" className="size-8 rounded border border-ink-200 shrink-0" />
                  <span className="line-clamp-1">{g.items[0].title}{g.items.length > 1 ? ` +${g.items.length - 1} more` : ''}</span>
                </div>
              ),
            },
            { key: 'customer', header: 'Customer', render: (g) => api.customerById.get(g.order.customerId)?.name ?? '—', hideBelow: 'lg' },
            { key: 'qty', header: 'Qty', align: 'right', render: (g) => <span className="mf-tnum">{g.items.reduce((s, i) => s + i.quantity, 0)}</span>, hideBelow: 'md' },
            { key: 'value', header: 'Value', align: 'right', sortValue: (g) => g.subtotal, render: (g) => <span className="font-semibold mf-tnum">{money(g.subtotal)}</span> },
            { key: 'comm', header: 'Commission', align: 'right', render: (g) => <span className="mf-tnum text-red-600">−{money(g.commission)}</span>, hideBelow: 'lg' },
            { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.items[0].vendorStatus} /> },
          ]}
          footer={
            <tr>
              <td className="px-3 py-2 text-2xs text-ink-500" colSpan={5}>Page total</td>
              <td className="px-3 py-2 text-right text-[13px] font-bold mf-tnum">{money(shown.reduce((s, g) => s + g.subtotal, 0))}</td>
              <td colSpan={3} />
            </tr>
          }
        />
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(filtered.length / pageSize))} onChange={setPage} total={filtered.length} pageSize={pageSize} />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-xl"
        title={detail ? `Order ${detail.order.number}` : ''} subtitle={detail ? `${formatDateTime(detail.order.placedAt)} · ${titleCase(detail.order.deliveryMethod)} delivery` : ''}
        footer={detail ? (
          detail.items[0].vendorStatus === 'new' ? <>
            <Button size="sm" variant="primary" block icon={<Check className="size-4" />} onClick={() => advance('Order accepted')}>Accept order</Button>
            <Button size="sm" variant="danger" onClick={() => advance('Order rejected')}>Reject</Button>
          </> : <>
            <Button size="sm" variant="primary" block onClick={() => advance('Status updated')}>Move to next status</Button>
            <Button size="sm" icon={<Printer className="size-4" />} onClick={() => advance('Packing slip printed')}>Packing slip</Button>
          </>
        ) : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.items[0].vendorStatus} />
              <Badge tone="neutral">{detail.order.payment.methodLabel}</Badge>
              {detail.order.payment.method === 'cod' && <Badge tone="amber">Collect {money(detail.order.totals.grandTotal)} on delivery</Badge>}
            </div>

            <div>
              <p className="mf-label">Your items in this order</p>
              <div className="rounded-lg border border-ink-200 divide-y divide-ink-100">
                {detail.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-3">
                    <img src={productImage(i.imageKind, i.tint, i.imageSeed, 100)} alt="" className="size-12 rounded border border-ink-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink-900 line-clamp-1">{i.title}</p>
                      <p className="text-2xs text-ink-500 mf-tnum">{i.sku}{i.variantLabel ? ` · ${i.variantLabel}` : ''} · Qty {i.quantity}</p>
                    </div>
                    <span className="text-[13px] font-semibold mf-tnum">{money(i.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mf-label">Settlement</p>
              <Panel className="p-3 bg-ink-50/60">
                <MoneyLine label="Item subtotal" value={detail.subtotal} />
                <MoneyLine label={`Commission (${detail.items[0].commissionRate}%)`} value={detail.commission} tone="debit" />
                <MoneyLine label="Shipping recovered" value={detail.order.totals.shipping} tone="credit" />
                <MoneyLine label="Net to you" value={detail.subtotal - detail.commission + detail.order.totals.shipping} bold />
              </Panel>
            </div>

            <div>
              <p className="mf-label">Ship to</p>
              <Panel className="p-3">
                <p className="text-[13px] font-semibold text-ink-950">{detail.order.shippingAddress.fullName}</p>
                <p className="text-xs text-ink-600 leading-relaxed mt-0.5">
                  {detail.order.shippingAddress.line1}<br />
                  {detail.order.shippingAddress.line2 && <>{detail.order.shippingAddress.line2}<br /></>}
                  {detail.order.shippingAddress.city}, {detail.order.shippingAddress.state} {detail.order.shippingAddress.postalCode}
                </p>
                <p className="text-xs text-ink-500 mt-1.5 mf-tnum">{detail.order.shippingAddress.phone}</p>
                {detail.order.shippingAddress.deliveryNotes && (
                  <p className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-2xs text-amber-900">{detail.order.shippingAddress.deliveryNotes}</p>
                )}
              </Panel>
            </div>

            <div>
              <p className="mf-label">Order timeline</p>
              <Timeline steps={detail.order.timeline.filter((t) => t.state !== 'upcoming').map((t) => ({ ...t, at: formatDateTime(t.at) }))} />
            </div>
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ─────────────────────────── Vendor customers ──────────────────────────── */

export function VendorCustomers() {
  const rows = api.vendorCustomers(VENDOR_ID);
  const [query, setQuery] = useState('');
  const filtered = rows.filter((r) => !query.trim() || (api.customerById.get(r.customerId)?.name ?? '').toLowerCase().includes(query.toLowerCase()));

  return (
    <PortalPage>
      <Head title="Customers" subtitle={`${rows.length} buyers have ordered from your store`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export list</Button>} />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Total customers" value={rows.length} icon={<Users className="size-4" />} tone="forge" />
          <StatCard label="Repeat buyers" value={rows.filter((r) => r.orders > 1).length} icon={<RotateCcw className="size-4" />} tone="green" hint={`${Math.round((rows.filter((r) => r.orders > 1).length / Math.max(1, rows.length)) * 100)}% of customers`} />
          <StatCard label="Avg. spend" value={money(rows.reduce((s, r) => s + r.spend, 0) / Math.max(1, rows.length))} icon={<Wallet className="size-4" />} />
          <StatCard label="Top customer value" value={moneyCompact(rows[0]?.spend ?? 0)} icon={<Star className="size-4" />} tone="amber" hint={api.customerById.get(rows[0]?.customerId ?? '')?.name} />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <PanelHeader title="Customer list" subtitle="Ranked by spend with your store" />
        <div className="px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search customer" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <DataTable
          rows={filtered.slice(0, 40)} keyOf={(r) => r.customerId}
          empty={<EmptyState icon={<Users className="size-5" />} title="No customers found" />}
          columns={[
            {
              key: 'name', header: 'Customer',
              render: (r) => {
                const c = api.customerById.get(r.customerId);
                return (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c?.name ?? '?'} seed={r.customerId} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink-950">{c?.name}</p>
                      <p className="text-2xs text-ink-500 truncate">{c?.city}, {c?.state}</p>
                    </div>
                  </div>
                );
              },
            },
            { key: 'tier', header: 'Tier', render: (r) => <Badge tone={api.customerById.get(r.customerId)?.tier === 'prime' ? 'violet' : api.customerById.get(r.customerId)?.tier === 'plus' ? 'blue' : 'neutral'}>{titleCase(api.customerById.get(r.customerId)?.tier ?? '')}</Badge>, hideBelow: 'md' },
            { key: 'orders', header: 'Orders', align: 'right', sortValue: (r) => r.orders, render: (r) => <span className="mf-tnum">{r.orders}</span> },
            { key: 'spend', header: 'Spend', align: 'right', sortValue: (r) => r.spend, render: (r) => <span className="font-semibold mf-tnum">{money(r.spend)}</span> },
            { key: 'aov', header: 'AOV', align: 'right', render: (r) => <span className="mf-tnum">{money(r.spend / r.orders)}</span>, hideBelow: 'lg' },
            { key: 'last', header: 'Last order', align: 'right', render: (r) => <span className="text-ink-500">{relativeTime(r.lastOrderAt)}</span>, hideBelow: 'sm' },
          ]}
        />
      </Panel>
    </PortalPage>
  );
}

/* ──────────────────────────── Vendor reviews ───────────────────────────── */

export function VendorReviews() {
  const { toast } = useApp();
  const reviews = api.vendorReviews(VENDOR_ID);
  const dist = api.ratingDistribution(reviews);
  const vendor = api.vendorById.get(VENDOR_ID)!;
  const [tab, setTab] = useState('all');
  const [replyTo, setReplyTo] = useState<typeof reviews[number] | null>(null);
  const [reply, setReply] = useState('');
  const trend = api.buildSeries('review-trend', 90, [{ key: 'rating', base: 44, growth: 0.06, noise: 0.08 }]).map((p) => ({ ...p, rating: Number((Number(p.rating) / 10).toFixed(1)) }));

  const rows = reviews.filter((r) =>
    tab === 'all' ? true
    : tab === 'unanswered' ? !r.vendorResponse && r.rating <= 3
    : tab === 'critical' ? r.rating <= 2
    : tab === 'flagged' ? r.status === 'flagged' || r.reported
    : true);

  return (
    <PortalPage>
      <Head title="Reviews" subtitle={`${reviews.length} product reviews · seller rating ${vendor.rating}★ from ${numCompact(vendor.ratingCount)} ratings`} />

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
        <div className="space-y-3">
          <Panel className="p-4 text-center">
            <p className="text-4xl font-extrabold text-ink-950 mf-tnum">{vendor.rating.toFixed(1)}</p>
            <Rating value={vendor.rating} size="md" showValue={false} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-ink-500">{numCompact(vendor.ratingCount)} seller ratings</p>
            <div className="mt-3 pt-3 border-t border-ink-100 space-y-1.5">
              {dist.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-xs text-ink-600 w-7 mf-tnum">{d.star}★</span>
                  <span className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden"><span className="block h-full bg-amber-400" style={{ width: `${d.share}%` }} /></span>
                  <span className="text-xs text-ink-500 w-8 text-right mf-tnum">{d.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="text-[13px] font-bold text-ink-950">Seller scorecard</p>
            <div className="mt-3 space-y-2.5">
              <ProgressBar label="Packaging" value={92} showValue tone="forge" />
              <ProgressBar label="Item accuracy" value={95} showValue tone="forge" />
              <ProgressBar label="Shipping speed" value={vendor.onTimeShipRate} showValue tone="green" />
              <ProgressBar label="Communication" value={89} showValue tone="forge" />
            </div>
          </Panel>

          <ChartCard title="Rating trend" subtitle="Rolling 90 days" height={160}>
            <LinesChart data={trend} metrics={[{ key: 'rating', label: 'Avg rating' }]} />
          </ChartCard>
        </div>

        <Panel>
          <Tabs
            items={[
              { key: 'all', label: 'All reviews', count: reviews.length },
              { key: 'unanswered', label: 'Need a reply', count: reviews.filter((r) => !r.vendorResponse && r.rating <= 3).length },
              { key: 'critical', label: '1–2 star', count: reviews.filter((r) => r.rating <= 2).length },
              { key: 'flagged', label: 'Reported', count: reviews.filter((r) => r.status === 'flagged' || r.reported).length },
            ]}
            value={tab} onChange={setTab}
          />
          {rows.length === 0 ? (
            <EmptyState icon={<Star className="size-5" />} title="Nothing here" body="No reviews match this filter — that is usually good news." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {rows.slice(0, 20).map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.customerName} seed={r.avatarSeed} size="sm" />
                      <div>
                        <p className="text-[13px] font-semibold text-ink-900">{r.customerName}</p>
                        <p className="text-2xs text-ink-500">{r.location} · {relativeTime(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Rating value={r.rating} size="xs" />
                      {r.verifiedPurchase && <Badge tone="green">Verified</Badge>}
                      {r.status === 'flagged' && <Badge tone="red">Reported</Badge>}
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold text-ink-950">{r.title}</p>
                  <p className="mt-1 text-[13px] text-ink-700 leading-relaxed">{r.body}</p>
                  <p className="mt-1.5 text-2xs text-ink-500">
                    on <Link to={`/p/${api.productById.get(r.productId)?.slug}`} className="mf-link">{api.productById.get(r.productId)?.shortTitle}</Link>
                    {r.variantLabel ? ` · ${r.variantLabel}` : ''} · {r.helpfulCount} found helpful
                  </p>
                  {r.vendorResponse ? (
                    <div className="mt-3 rounded-lg border-l-2 border-forge-500 bg-forge-50/50 px-3 py-2.5">
                      <p className="text-2xs font-semibold text-forge-800">Your reply · {relativeTime(r.vendorResponse.at)}</p>
                      <p className="mt-1 text-xs text-ink-700 leading-relaxed">{r.vendorResponse.body}</p>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex gap-2">
                      <Button size="xs" variant="primary" icon={<MessageSquare className="size-3" />} onClick={() => { setReplyTo(r); setReply(''); }}>Reply publicly</Button>
                      {r.rating <= 2 && <Button size="xs" onClick={() => toast({ title: 'Escalated to MarketForge', body: 'Support will review this review against policy.', variant: 'info' })}>Report review</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Modal
        open={!!replyTo} onClose={() => setReplyTo(null)} title="Reply to review" subtitle={replyTo ? `${replyTo.customerName} · ${replyTo.rating}★` : ''}
        footer={<>
          <Button size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!reply.trim()} icon={<Send className="size-3.5" />} onClick={() => { setReplyTo(null); toast({ title: 'Reply published', body: 'Your response is now visible on the product page.', variant: 'success' }); }}>Publish reply</Button>
        </>}
      >
        <div className="space-y-3">
          <Panel className="p-3 bg-ink-50/60">
            <p className="text-[13px] font-semibold text-ink-950">{replyTo?.title}</p>
            <p className="mt-1 text-xs text-ink-600 leading-relaxed">{replyTo?.body}</p>
          </Panel>
          <Field label="Your public reply" required hint="Replies are visible to every shopper. Acknowledge the issue and say what you will do.">
            <Textarea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank you for the detail — we have raised this with our packing team and would like to make it right…" />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {['Offer a replacement', 'Offer a refund', 'Apologise for delay'].map((t) => (
              <button key={t} onClick={() => setReply(`${reply}${reply ? ' ' : ''}${t === 'Offer a replacement' ? 'We would like to send a replacement at no cost — our support team will contact you today.' : t === 'Offer a refund' ? 'We have asked our support team to process a full refund for you.' : 'We are sorry about the delay — this shipment missed our usual dispatch window.'}`)} className="rounded-full border border-ink-200 px-2.5 py-1 text-2xs text-ink-600 hover:border-forge-300 hover:text-forge-800">{t}</button>
            ))}
          </div>
        </div>
      </Modal>
    </PortalPage>
  );
}

/* ────────────────────────── Vendor promotions ──────────────────────────── */

export function VendorPromotions() {
  const { toast } = useApp();
  const mine = api.promotions.filter((p) => p.vendorId === VENDOR_ID || p.ownerType === 'platform');
  const [creating, setCreating] = useState(false);

  return (
    <PortalPage>
      <Head
        title="Promotions" subtitle="Your campaigns plus platform events your listings are eligible for"
        actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Create promotion</Button>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Active campaigns" value={mine.filter((p) => p.status === 'active').length} icon={<Percent className="size-4" />} tone="green" />
          <StatCard label="Redemptions" value={numCompact(mine.reduce((s, p) => s + p.metrics.redemptions, 0))} icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Promo revenue" value={moneyCompact(mine.reduce((s, p) => s + p.metrics.revenue, 0))} icon={<Wallet className="size-4" />} tone="blue" />
          <StatCard label="Avg. uplift" value={`${(mine.reduce((s, p) => s + p.metrics.uplift, 0) / Math.max(1, mine.length)).toFixed(1)}%`} icon={<TrendingUp className="size-4" />} tone="amber" hint="vs baseline sales" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <PanelHeader title="Campaigns" subtitle={`${mine.length} promotions`} />
        <DataTable
          rows={mine} keyOf={(p) => p.id}
          columns={[
            {
              key: 'name', header: 'Campaign',
              render: (p) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: p.tint }} />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-950 line-clamp-1">{p.name}</p>
                    <p className="text-2xs text-ink-500 line-clamp-1">{p.description}</p>
                  </div>
                </div>
              ),
            },
            { key: 'type', header: 'Type', render: (p) => <Badge tone="neutral">{titleCase(p.type)}</Badge>, hideBelow: 'md' },
            { key: 'owner', header: 'Owner', render: (p) => <Badge tone={p.ownerType === 'platform' ? 'violet' : 'forge'}>{p.ownerType === 'platform' ? 'MarketForge' : 'You'}</Badge>, hideBelow: 'lg' },
            { key: 'window', header: 'Window', render: (p) => <span className="text-ink-600 mf-tnum">{formatDate(p.startsAt)} – {formatDate(p.endsAt)}</span>, hideBelow: 'lg' },
            { key: 'redeem', header: 'Redemptions', align: 'right', render: (p) => <span className="mf-tnum">{numCompact(p.metrics.redemptions)}</span>, hideBelow: 'sm' },
            { key: 'revenue', header: 'Revenue', align: 'right', sortValue: (p) => p.metrics.revenue, render: (p) => <span className="font-semibold mf-tnum">{moneyCompact(p.metrics.revenue)}</span> },
            { key: 'uplift', header: 'Uplift', align: 'right', render: (p) => <span className="mf-tnum text-emerald-700 font-semibold">+{p.metrics.uplift}%</span>, hideBelow: 'md' },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            {
              key: 'actions', header: '', align: 'right',
              render: (p) => p.ownerType === 'vendor' ? (
                <Button size="xs" onClick={() => toast({ title: p.status === 'active' ? 'Campaign paused' : 'Campaign resumed', variant: 'info' })}>
                  {p.status === 'active' ? 'Pause' : 'Resume'}
                </Button>
              ) : <span className="text-2xs text-ink-400">Auto-enrolled</span>,
            },
          ]}
        />
      </Panel>

      <Modal
        open={creating} onClose={() => setCreating(false)} title="Create a promotion" size="lg"
        subtitle="Discounts apply on top of your listing price and are funded by you"
        footer={<>
          <Button size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={() => { setCreating(false); toast({ title: 'Promotion scheduled', body: 'It will go live at the start date.', variant: 'success' }); }}>Schedule promotion</Button>
        </>}
      >
        <div className="space-y-3">
          <Field label="Campaign name" required><Input placeholder="TechWorld Audio Week" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Promotion type" required>
              <Select>{['Percentage discount', 'Fixed amount off', 'Buy X get Y', 'Free shipping', 'Flash sale'].map((t) => <option key={t}>{t}</option>)}</Select>
            </Field>
            <Field label="Discount value" required><Input type="number" prefix="%" defaultValue={15} /></Field>
            <Field label="Starts" required><Input type="date" defaultValue="2026-09-05" /></Field>
            <Field label="Ends" required><Input type="date" defaultValue="2026-09-12" /></Field>
          </div>
          <Field label="Applies to" required>
            <div className="space-y-2">
              <Radio name="scope" defaultChecked label="All my listings" sublabel={`${api.vendorProducts(VENDOR_ID).length} products`} />
              <Radio name="scope" label="Specific categories" sublabel="Pick departments to include" />
              <Radio name="scope" label="Selected products" sublabel="Choose individual listings" />
            </div>
          </Field>
          <Alert tone="warning" title="Cost to you">
            Discounts are deducted from your settlement before commission. A 15% discount on a ₹10,000 listing reduces your payout by about ₹1,500.
          </Alert>
        </div>
      </Modal>
    </PortalPage>
  );
}

/* ─────────────────────────── Vendor payouts ────────────────────────────── */

export function VendorPayouts() {
  const { toast } = useApp();
  const payouts = api.vendorPayouts(VENDOR_ID);
  const pending = payouts.filter((p) => p.status !== 'paid');
  const [detail, setDetail] = useState<typeof payouts[number] | null>(null);
  const series = api.buildSeries('payout-trend', 90, [{ key: 'net', base: 62000, growth: 0.3, noise: 0.25 }]);

  return (
    <PortalPage>
      <Head
        title="Payouts" subtitle="Weekly settlement cycles · closed every Sunday, paid the following Wednesday"
        actions={<>
          <Button size="sm" icon={<Download className="size-4" />}>Download statements</Button>
          <Button size="sm" variant="primary" icon={<FileText className="size-4" />} onClick={() => toast({ title: 'Tax invoice generated', body: 'FY 2026-27 commission invoice ready', variant: 'success' })}>Tax invoice</Button>
        </>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Pending payout" value={moneyCompact(pending.reduce((s, p) => s + p.netAmount, 0))} icon={<Wallet className="size-4" />} tone="amber" hint={`${pending.length} cycles awaiting settlement`} />
          <StatCard label="Paid (last 8 cycles)" value={moneyCompact(payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0))} icon={<ArrowUpFromLine className="size-4" />} tone="green" />
          <StatCard label="Commission paid" value={moneyCompact(payouts.reduce((s, p) => s + p.commission, 0))} icon={<Percent className="size-4" />} tone="red" hint={`At ${api.vendorById.get(VENDOR_ID)?.commissionRate}% effective rate`} />
          <StatCard label="Refunds deducted" value={moneyCompact(payouts.reduce((s, p) => s + p.refunds, 0))} icon={<RotateCcw className="size-4" />} tone="neutral" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Net payout trend" subtitle="Last 90 days" height={230}>
          <TrendChart data={series} metrics={[{ key: 'net', label: 'Net payout' }]} currency />
        </ChartCard>
        <Panel>
          <PanelHeader title="Next payout" subtitle={pending[0] ? `Scheduled ${formatDate(pending[0].scheduledFor)}` : 'Nothing pending'} />
          {pending[0] && (
            <div className="p-4">
              <MoneyLine label="Gross sales" value={pending[0].grossSales} />
              <MoneyLine label="Platform commission" value={pending[0].commission} tone="debit" />
              <MoneyLine label="Tax collected at source" value={pending[0].tax} tone="debit" />
              <MoneyLine label="Shipping fees" value={pending[0].shippingFees} tone="debit" />
              <MoneyLine label="Refunds" value={pending[0].refunds} tone="debit" />
              {pending[0].adjustments !== 0 && <MoneyLine label="Adjustments" value={pending[0].adjustments} tone={pending[0].adjustments > 0 ? 'credit' : 'debit'} />}
              <MoneyLine label="Net payout" value={pending[0].netAmount} bold />
              <div className="mt-3 pt-3 border-t border-ink-100">
                <DefinitionList items={[
                  { label: 'Method', value: titleCase(pending[0].method) },
                  { label: 'Bank account', value: api.verificationByVendor.get(VENDOR_ID)?.bank.accountNumberMasked },
                  { label: 'Orders in cycle', value: <span className="mf-tnum">{pending[0].orderCount}</span> },
                ]} />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-3">
        <PanelHeader title="Payout history" subtitle={`${payouts.length} settlement cycles`} />
        <DataTable
          rows={payouts} keyOf={(p) => p.id} onRowClick={setDetail}
          columns={[
            { key: 'ref', header: 'Payout ID', render: (p) => <span className="font-medium mf-tnum">{p.reference}</span> },
            { key: 'period', header: 'Period', render: (p) => <span className="mf-tnum text-ink-600">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span> },
            { key: 'orders', header: 'Orders', align: 'right', render: (p) => <span className="mf-tnum">{p.orderCount}</span>, hideBelow: 'md' },
            { key: 'gross', header: 'Gross', align: 'right', sortValue: (p) => p.grossSales, render: (p) => <span className="mf-tnum">{money(p.grossSales)}</span>, hideBelow: 'sm' },
            { key: 'comm', header: 'Commission', align: 'right', render: (p) => <span className="mf-tnum text-red-600">−{money(p.commission)}</span>, hideBelow: 'lg' },
            { key: 'net', header: 'Net payout', align: 'right', sortValue: (p) => p.netAmount, render: (p) => <span className="font-semibold mf-tnum">{money(p.netAmount)}</span> },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            { key: 'paid', header: 'Paid on', align: 'right', render: (p) => <span className="text-ink-500">{p.paidAt ? formatDate(p.paidAt) : '—'}</span>, hideBelow: 'sm' },
          ]}
        />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-lg"
        title={detail ? `Payout ${detail.reference}` : ''}
        subtitle={detail ? `${formatDate(detail.periodStart)} – ${formatDate(detail.periodEnd)} · ${detail.orderCount} orders` : ''}
        footer={<Button size="sm" block icon={<Download className="size-4" />} onClick={() => toast({ title: 'Statement downloaded', body: `${detail?.reference}.pdf`, variant: 'success' })}>Download statement</Button>}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2"><StatusBadge status={detail.status} /><Badge tone="neutral">{titleCase(detail.method)}</Badge></div>
            <Panel className="p-3.5">
              <MoneyLine label="Gross sales" value={detail.grossSales} />
              <MoneyLine label="Platform commission" value={detail.commission} tone="debit" />
              <MoneyLine label="Tax collected at source" value={detail.tax} tone="debit" />
              <MoneyLine label="Shipping fees" value={detail.shippingFees} tone="debit" />
              <MoneyLine label="Refunds" value={detail.refunds} tone="debit" />
              {detail.adjustments !== 0 && <MoneyLine label="Adjustments" value={detail.adjustments} tone={detail.adjustments > 0 ? 'credit' : 'debit'} />}
              <MoneyLine label="Net payout" value={detail.netAmount} bold />
            </Panel>
            <DefinitionList columns={2} items={[
              { label: 'Cycle closed', value: formatDate(detail.periodEnd) },
              { label: 'Scheduled for', value: formatDate(detail.scheduledFor) },
              { label: 'Paid at', value: detail.paidAt ? formatDateTime(detail.paidAt) : 'Not yet paid' },
              { label: 'Effective commission', value: `${((detail.commission / Math.max(1, detail.grossSales)) * 100).toFixed(1)}%` },
            ]} />
            {detail.status === 'on_hold' && (
              <Alert tone="warning" title="Payout on hold">
                An open dispute above the reserve threshold is holding this cycle. It releases automatically once the dispute is resolved.
              </Alert>
            )}
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ────────────────────────── Vendor analytics ───────────────────────────── */

export function VendorAnalytics() {
  const [range, setRange] = useState<RangeKey>('30d');
  const days = api.daysForRange(range);
  const k = api.vendorKpis(VENDOR_ID, range);
  const sales = api.buildSeries(`va-sales-${range}`, days, [
    { key: 'revenue', base: 148000, growth: 0.42, noise: 0.28 },
    { key: 'orders', base: 42, growth: 0.3, noise: 0.32 },
  ]);
  const funnel = api.buildSeries(`va-funnel-${range}`, days, [
    { key: 'views', base: 4200, growth: 0.4, noise: 0.2 },
    { key: 'addToCart', base: 380, growth: 0.44, noise: 0.24 },
    { key: 'purchases', base: 42, growth: 0.3, noise: 0.3 },
  ]);
  const conv = api.buildSeries(`va-conv-${range}`, days, [{ key: 'rate', base: 32, growth: 0.2, noise: 0.15 }])
    .map((p) => ({ ...p, rate: Number((Number(p.rate) / 10).toFixed(2)) }));
  const top = api.topProducts(VENDOR_ID, 8);
  const products = api.vendorProducts(VENDOR_ID);

  return (
    <PortalPage>
      <Head
        title="Analytics" subtitle={`Performance for ${api.vendorById.get(VENDOR_ID)?.name}`}
        actions={<><SegmentedControl options={RANGES} value={range} onChange={setRange} /><Button size="sm" icon={<Download className="size-4" />}>Export</Button></>}
      />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Gross sales" value={moneyCompact(k.grossSales)} delta={k.deltas.grossSales} icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Orders" value={numCompact(k.orders)} delta={k.deltas.orders} icon={<ClipboardList className="size-4" />} tone="blue" />
          <StatCard label="Units sold" value={numCompact(k.unitsSold)} delta={7.4} icon={<Package className="size-4" />} />
          <StatCard label="Conversion" value={`${k.conversionRate}%`} delta={k.deltas.conversionRate} icon={<Percent className="size-4" />} tone="violet" />
          <StatCard label="Return rate" value={`${k.returnRate}%`} delta={k.deltas.returns} icon={<RotateCcw className="size-4" />} tone="red" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Sales performance" subtitle={`Revenue and orders · last ${days} days`} height={260}>
          <TrendChart data={sales} metrics={[{ key: 'revenue', label: 'Revenue' }, { key: 'orders', label: 'Orders', color: '#F03E0B' }]} currency />
        </ChartCard>
        <ChartCard title="Conversion rate" subtitle="Sessions to purchase" height={260}>
          <LinesChart data={conv} metrics={[{ key: 'rate', label: 'Conversion %' }]} percent />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Traffic funnel" subtitle="Views, add-to-cart and purchases" height={240}>
          <TrendChart data={funnel} metrics={[{ key: 'views', label: 'Views' }, { key: 'addToCart', label: 'Add to cart', color: '#4C5FD7' }, { key: 'purchases', label: 'Purchases', color: '#12817A' }]} />
        </ChartCard>
        <ChartCard title="Revenue by category" subtitle="Your catalogue mix" height={240}>
          <DonutChart
            data={api.topCategories.map((c) => ({
              name: c.name,
              value: products.filter((p) => p.categoryId.startsWith(c.id)).reduce((s, p) => s + p.price * p.soldCount, 0),
              color: c.tint,
            })).filter((d) => d.value > 0)}
            currency
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Top products by revenue" />
          <RankList items={top.map((t) => ({
            label: t.product.shortTitle,
            sublabel: `${numCompact(t.units)} units · ${numCompact(t.product.viewCount30d)} views`,
            value: moneyCompact(t.revenue), share: t.revenue, to: `/p/${t.product.slug}`, tint: t.product.tint,
          }))} />
        </Panel>
        <Panel>
          <PanelHeader title="Listing performance" subtitle="Views versus conversion" />
          <DataTable
            dense rows={products.slice(0, 10)} keyOf={(p) => p.id}
            columns={[
              { key: 'p', header: 'Product', render: (p) => <span className="line-clamp-1">{p.shortTitle}</span> },
              { key: 'views', header: 'Views', align: 'right', sortValue: (p) => p.viewCount30d, render: (p) => <span className="mf-tnum">{numCompact(p.viewCount30d)}</span> },
              { key: 'sold', header: 'Sold', align: 'right', render: (p) => <span className="mf-tnum">{numCompact(p.soldCount)}</span> },
              { key: 'cr', header: 'CR', align: 'right', render: (p) => <span className="mf-tnum">{((p.soldCount / Math.max(1, p.viewCount30d)) * 100).toFixed(1)}%</span> },
              { key: 'rating', header: 'Rating', align: 'right', render: (p) => <Rating value={p.rating} size="xs" />, hideBelow: 'md' },
            ]}
          />
        </Panel>
      </div>
    </PortalPage>
  );
}

/* ──────────────────────── Vendor store settings ────────────────────────── */

export function VendorStorePage() {
  const { toast } = useApp();
  const vendor = api.vendorById.get(VENDOR_ID)!;
  const store = api.storeByVendor.get(VENDOR_ID)!;
  const [tab, setTab] = useState('profile');

  return (
    <PortalPage>
      <Head
        title="Store" subtitle={`marketforge.com/store/${vendor.slug}`}
        actions={<>
          <Button size="sm" icon={<Eye className="size-4" />} onClick={() => window.open(`/store/${vendor.slug}`, '_blank')}>View storefront</Button>
          <Button size="sm" variant="primary" onClick={() => toast({ title: 'Store settings saved', variant: 'success' })}>Save changes</Button>
        </>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Store visits (30d)" value={numCompact(store.metrics.storeVisits30d)} icon={<Eye className="size-4" />} tone="forge" delta={12.4} />
          <StatCard label="Followers" value={numCompact(store.metrics.followers)} icon={<Users className="size-4" />} tone="blue" delta={6.1} />
          <StatCard label="Store conversion" value={`${store.metrics.conversionRate}%`} icon={<Percent className="size-4" />} tone="violet" delta={0.4} />
          <StatCard label="Seller rating" value={vendor.rating.toFixed(1)} icon={<Star className="size-4" />} tone="amber" hint={`${numCompact(vendor.ratingCount)} ratings`} />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[{ key: 'profile', label: 'Store profile' }, { key: 'collections', label: 'Collections', count: store.collections.length }, { key: 'policies', label: 'Policies' }, { key: 'branding', label: 'Branding' }]}
          value={tab} onChange={setTab}
        />
        <div className="p-4">
          {tab === 'profile' && (
            <div className="grid gap-3 sm:grid-cols-2 max-w-4xl">
              <Field label="Display name" required><Input defaultValue={vendor.name} /></Field>
              <Field label="Store URL" hint="Changing this breaks existing links"><Input prefix="/" defaultValue={vendor.slug} /></Field>
              <Field label="Tagline" className="sm:col-span-2"><Input defaultValue={vendor.tagline} /></Field>
              <Field label="About your store" className="sm:col-span-2" hint="Shown on the About tab of your storefront">
                <Textarea rows={5} defaultValue={vendor.about} />
              </Field>
              <Field label="Store announcement" className="sm:col-span-2" hint="A single banner line shown at the top of your storefront">
                <Input defaultValue={store.announcement ?? ''} placeholder="Dispatching same day on orders before 4pm" />
              </Field>
              <Field label="Support email"><Input defaultValue={vendor.contactEmail} /></Field>
              <Field label="Support phone"><Input defaultValue={vendor.contactPhone} /></Field>
              <Field label="Website"><Input defaultValue={store.socials.website} /></Field>
              <Field label="Instagram"><Input defaultValue={store.socials.instagram} /></Field>
            </div>
          )}

          {tab === 'collections' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-600">Collections group listings into shelves on your storefront.</p>
                <Button size="sm" icon={<Plus className="size-4" />}>New collection</Button>
              </div>
              {store.collections.map((col) => (
                <Panel key={col.id} className="p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-950">{col.title}</p>
                      <p className="text-2xs text-ink-500">{col.productIds.length} products</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="xs">Edit</Button>
                      <Button size="xs" variant="ghost">Remove</Button>
                    </div>
                  </div>
                  <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
                    {col.productIds.map((id) => {
                      const p = api.productById.get(id);
                      return p ? <img key={id} src={productImage(p.imageKind, p.tint, p.imageSeeds[0], 100)} alt={p.title} title={p.title} className="size-14 rounded border border-ink-200 shrink-0" /> : null;
                    })}
                  </div>
                </Panel>
              ))}
            </div>
          )}

          {tab === 'policies' && (
            <div className="space-y-3 max-w-3xl">
              <Field label="Shipping policy" required><Textarea rows={4} defaultValue={store.policies.shipping} /></Field>
              <Field label="Return policy" required><Textarea rows={4} defaultValue={store.policies.returns} /></Field>
              <Field label="Warranty policy" required><Textarea rows={4} defaultValue={store.policies.warranty} /></Field>
              <Alert tone="info">Your policies must meet or exceed the MarketForge marketplace minimums. Stricter-than-policy terms are not enforceable against buyers.</Alert>
            </div>
          )}

          {tab === 'branding' && (
            <div className="space-y-4 max-w-2xl">
              <Field label="Store logo" hint="Square, at least 512×512px, PNG with transparency">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-16 rounded-lg text-white font-bold text-lg" style={{ background: vendor.tint }}>TW</span>
                  <Button size="sm" icon={<Upload className="size-4" />}>Replace logo</Button>
                </div>
              </Field>
              <Field label="Store banner" hint="1200×280px recommended">
                <FileDrop label="Upload a banner image" hint="PNG or JPG · 2 MB max" accept="image/*" />
              </Field>
              <Field label="Accent colour">
                <div className="flex items-center gap-2">
                  {['#1D4ED8', '#12817A', '#F03E0B', '#9D174D', '#7C3AED', '#B45309'].map((c) => (
                    <button key={c} className={cx('size-8 rounded-md border-2', c === vendor.tint ? 'border-ink-950' : 'border-transparent')} style={{ background: c }} aria-label={c} />
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>
      </Panel>
    </PortalPage>
  );
}

/* ────────────────────────── Vendor settings ────────────────────────────── */

export function VendorSettings() {
  const { toast } = useApp();
  const vendor = api.vendorById.get(VENDOR_ID)!;
  const verify = api.verificationByVendor.get(VENDOR_ID)!;
  const [tab, setTab] = useState('business');
  const [notifs, setNotifs] = useState({ orders: true, inventory: true, reviews: true, payouts: true, marketing: false });

  return (
    <PortalPage>
      <Head title="Settings" subtitle="Business details, banking, users and notifications" actions={<Button size="sm" variant="primary" onClick={() => toast({ title: 'Settings saved', variant: 'success' })}>Save changes</Button>} />

      <Panel>
        <Tabs
          items={[
            { key: 'business', label: 'Business' },
            { key: 'bank', label: 'Bank & tax' },
            { key: 'documents', label: 'Documents', count: verify.documents.length },
            { key: 'users', label: 'Users & roles' },
            { key: 'notifications', label: 'Notifications' },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="p-4">
          {tab === 'business' && (
            <div className="grid gap-3 sm:grid-cols-2 max-w-4xl">
              <Field label="Legal business name" required><Input defaultValue={verify.business.legalName} /></Field>
              <Field label="Display name" required><Input defaultValue={verify.business.displayName} /></Field>
              <Field label="Entity type"><Select defaultValue={verify.business.entityType}>{['sole_proprietor', 'partnership', 'llp', 'private_limited'].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
              <Field label="Registration number"><Input defaultValue={verify.business.registrationNumber} /></Field>
              <Field label="Incorporation year"><Input type="number" defaultValue={verify.business.incorporationYear} /></Field>
              <Field label="Employee count"><Select defaultValue={verify.business.employeeCount}>{['1-10', '11-50', '51-200', '201-500'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
              <Field label="Registered address" className="sm:col-span-2">
                <Textarea rows={3} defaultValue={`${verify.address.line1}\n${verify.address.line2 ?? ''}\n${verify.address.city}, ${verify.address.state} ${verify.address.postalCode}`} />
              </Field>
              <Field label="Contact name"><Input defaultValue={vendor.contactName} /></Field>
              <Field label="Contact email"><Input defaultValue={vendor.contactEmail} /></Field>
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-4 max-w-3xl">
              <Alert tone="success" icon={<ShieldCheck className="size-4" />} title="Bank account verified">
                Payouts settle to this account. Changing bank details triggers a fresh penny-drop verification and pauses payouts for one cycle.
              </Alert>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account holder"><Input defaultValue={verify.bank.accountHolder} /></Field>
                <Field label="Bank name"><Input defaultValue={verify.bank.bankName} /></Field>
                <Field label="Account number"><Input defaultValue={verify.bank.accountNumberMasked} /></Field>
                <Field label="IFSC / routing"><Input defaultValue={verify.bank.ifscOrRouting} /></Field>
                <Field label="Branch" className="sm:col-span-2"><Input defaultValue={verify.bank.branch} /></Field>
              </div>
              <div className="pt-3 border-t border-ink-100 grid gap-3 sm:grid-cols-2">
                <Field label="GSTIN"><Input defaultValue={verify.tax.gstin} /></Field>
                <Field label="PAN"><Input defaultValue={verify.tax.panOrEin} /></Field>
                <Field label="Tax scheme"><Select defaultValue={verify.tax.taxScheme}>{['regular', 'composition', 'exempt'].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
                <Field label="Payout method"><Select defaultValue="bank_transfer">{['bank_transfer', 'upi', 'wire'].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-3">
              <DataTable
                rows={verify.documents} keyOf={(d) => d.id}
                columns={[
                  { key: 'type', header: 'Document', render: (d) => <span className="font-medium">{titleCase(d.type)}</span> },
                  { key: 'file', header: 'File', render: (d) => <span className="text-ink-600">{d.fileName}</span>, hideBelow: 'md' },
                  { key: 'size', header: 'Size', align: 'right', render: (d) => <span className="mf-tnum text-ink-500">{fileSize(d.sizeKb)}</span>, hideBelow: 'lg' },
                  { key: 'up', header: 'Uploaded', render: (d) => <span className="text-ink-500">{formatDate(d.uploadedAt)}</span>, hideBelow: 'sm' },
                  { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
                  { key: 'actions', header: '', align: 'right', render: () => <Button size="xs">Replace</Button> },
                ]}
              />
              <FileDrop label="Upload a new document" hint="PDF, JPG or PNG · 10 MB max" accept=".pdf,image/*" />
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-600">Invite teammates and control what they can access in the vendor portal.</p>
                <Button size="sm" variant="primary" icon={<Plus className="size-4" />}>Invite user</Button>
              </div>
              <DataTable
                rows={[
                  { id: 'u1', name: 'Ananya Rao', email: 'ananya@techworld.in', role: 'Owner', status: 'active', last: 'Just now' },
                  { id: 'u2', name: 'Nikhil Verma', email: 'nikhil@techworld.in', role: 'Operations', status: 'active', last: '2 hours ago' },
                  { id: 'u3', name: 'Shruti Bose', email: 'shruti@techworld.in', role: 'Catalogue', status: 'active', last: 'Yesterday' },
                  { id: 'u4', name: 'Arjun Mehta', email: 'arjun@techworld.in', role: 'Finance', status: 'invited', last: '—' },
                ]}
                keyOf={(u) => u.id}
                columns={[
                  { key: 'user', header: 'User', render: (u) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="sm" />
                      <div><p className="font-medium text-ink-950">{u.name}</p><p className="text-2xs text-ink-500">{u.email}</p></div>
                    </div>
                  ) },
                  { key: 'role', header: 'Role', render: (u) => <Badge tone={u.role === 'Owner' ? 'forge' : 'neutral'}>{u.role}</Badge> },
                  { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status === 'invited' ? 'pending' : 'active'} /> },
                  { key: 'last', header: 'Last active', align: 'right', render: (u) => <span className="text-ink-500">{u.last}</span>, hideBelow: 'sm' },
                  { key: 'a', header: '', align: 'right', render: (u) => u.role !== 'Owner' ? <Button size="xs" variant="ghost">Remove</Button> : null },
                ]}
              />
            </div>
          )}

          {tab === 'notifications' && (
            <div className="divide-y divide-ink-100 max-w-2xl">
              {([
                ['orders', 'New orders', 'Email and push when an order needs acceptance'],
                ['inventory', 'Inventory alerts', 'When a SKU hits its reorder point or sells out'],
                ['reviews', 'New reviews', 'Any review of 3 stars or below, immediately'],
                ['payouts', 'Payout events', 'Cycle closed, scheduled, paid or held'],
                ['marketing', 'MarketForge news', 'Programme changes, events and seller webinars'],
              ] as const).map(([key, label, desc]) => (
                <div key={key} className="flex items-center justify-between gap-3 py-3.5">
                  <div><p className="text-[13px] font-semibold text-ink-950">{label}</p><p className="text-xs text-ink-500 mt-0.5">{desc}</p></div>
                  <Switch checked={notifs[key]} onChange={(v) => setNotifs({ ...notifs, [key]: v })} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </PortalPage>
  );
}

/* ───────────────────────── Vendor onboarding ───────────────────────────── */

const ONBOARD_STEPS = [
  { key: 'business', label: 'Business info' },
  { key: 'owner', label: 'Owner info' },
  { key: 'address', label: 'Address' },
  { key: 'tax', label: 'Tax' },
  { key: 'bank', label: 'Bank' },
  { key: 'documents', label: 'Documents' },
  { key: 'categories', label: 'Categories' },
  { key: 'store', label: 'Store setup' },
  { key: 'review', label: 'Verification' },
];

export function VendorOnboarding() {
  const { toast } = useApp();
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<string[]>(['cat_electronics']);
  const [docs, setDocs] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const next = () => setStep((s) => Math.min(ONBOARD_STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  if (submitted) {
    return (
      <PortalPage>
        <div className="mx-auto max-w-2xl">
          <Panel className="overflow-hidden">
            <div className="bg-forge-50 border-b border-forge-200 px-6 py-8 text-center">
              <span className="grid place-items-center size-12 rounded-full bg-forge-700 text-white mx-auto"><Check className="size-6" /></span>
              <h1 className="mt-3 text-xl font-bold text-forge-950">Application submitted</h1>
              <p className="mt-1.5 text-[13px] text-forge-800">Reference SEL-2026-4821 · you will hear from us within 2 business days</p>
            </div>
            <div className="p-5">
              <p className="mf-label">What happens next</p>
              <Timeline steps={[
                { id: '1', label: 'Application submitted', detail: 'We have everything we need to start', state: 'done', at: 'Just now' },
                { id: '2', label: 'Compliance review', detail: 'Business registration, GST and bank verification', state: 'current', at: 'Within 2 business days' },
                { id: '3', label: 'Category approval', detail: 'Regulated categories need an extra check', state: 'upcoming' },
                { id: '4', label: 'Store activation', detail: 'Your storefront goes live and you can list products', state: 'upcoming' },
              ]} />
              <Alert tone="info" className="mt-4" title="You can start preparing now">
                Draft your listings while verification runs. They stay in Draft until your store is approved, then you can submit them for catalogue review in one action.
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" to="/vendor">Go to dashboard</Button>
                <Button to="/vendor/products/new">Draft a listing</Button>
              </div>
            </div>
          </Panel>
        </div>
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <div className="mx-auto max-w-4xl">
        <Head title="Become a MarketForge seller" subtitle="Nine steps, about 15 minutes. Progress saves as you go." />

        <Panel className="p-3 mb-3">
          <Stepper steps={ONBOARD_STEPS} current={step} onStepClick={setStep} />
        </Panel>

        <Panel>
          <PanelHeader title={`Step ${step + 1} of ${ONBOARD_STEPS.length} · ${ONBOARD_STEPS[step].label}`} />
          <div className="p-4">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Legal business name" required hint="Exactly as on your registration certificate"><Input placeholder="Techworld Retail Pvt. Ltd." /></Field>
                <Field label="Store display name" required hint="What buyers see"><Input placeholder="TechWorld" /></Field>
                <Field label="Entity type" required><Select>{['Sole proprietor', 'Partnership', 'LLP', 'Private limited'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Registration number" required><Input placeholder="U12345KA2019PTC123456" /></Field>
                <Field label="Year of incorporation" required><Input type="number" placeholder="2019" /></Field>
                <Field label="Annual revenue band"><Select>{['₹50L - ₹2Cr', '₹2Cr - ₹10Cr', '₹10Cr - ₹50Cr', '₹50Cr+'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Website" className="sm:col-span-2"><Input placeholder="https://www.techworld.in" /></Field>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required><Input placeholder="Ananya Rao" /></Field>
                <Field label="Date of birth" required><Input type="date" /></Field>
                <Field label="Email" required><Input type="email" placeholder="ananya@techworld.in" /></Field>
                <Field label="Mobile" required><Input placeholder="+91 98450 11002" /></Field>
                <Field label="ID type" required><Select>{['National ID', 'Passport', 'Driving licence'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="ID number" required><Input placeholder="XXXX XXXX 1234" /></Field>
                <Alert tone="info" className="sm:col-span-2">The owner or an authorised director must complete this section. We verify identity against the business registration.</Alert>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Address line 1" required className="sm:col-span-2"><Input placeholder="Prestige Tech Park, Tower C" /></Field>
                <Field label="Address line 2" className="sm:col-span-2"><Input placeholder="Kadubeesanahalli" /></Field>
                <Field label="City" required><Input placeholder="Bengaluru" /></Field>
                <Field label="State" required><Input placeholder="Karnataka" /></Field>
                <Field label="Pin code" required><Input placeholder="560103" /></Field>
                <Field label="Country" required><Select><option>India</option></Select></Field>
                <Field label="Pickup warehouse address" className="sm:col-span-2" hint="Where carriers collect your parcels — can be the same as above">
                  <Textarea rows={3} placeholder="Warehouse address for carrier pickups" />
                </Field>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3 max-w-2xl">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="GSTIN" required hint="15 characters"><Input placeholder="29AABCT1234A1Z5" /></Field>
                  <Field label="PAN" required><Input placeholder="AABCT1234A" /></Field>
                  <Field label="Tax scheme" required><Select>{['Regular', 'Composition', 'Exempt'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                  <Field label="TAN (optional)"><Input placeholder="BLRT12345A" /></Field>
                </div>
                <Alert tone="warning" title="GST is mandatory for most categories">
                  Books and a few unbranded grocery categories can sell without GST. Everything else requires an active GSTIN registered to the same legal entity.
                </Alert>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-3 max-w-2xl">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Account holder name" required hint="Must match the legal business name"><Input placeholder="Techworld Retail Pvt. Ltd." /></Field>
                  <Field label="Bank name" required><Input placeholder="HDFC Bank" /></Field>
                  <Field label="Account number" required><Input placeholder="50100123456789" /></Field>
                  <Field label="Re-enter account number" required><Input /></Field>
                  <Field label="IFSC code" required><Input placeholder="HDFC0001234" /></Field>
                  <Field label="Branch" required><Input placeholder="Bengaluru — MG Road" /></Field>
                </div>
                <Alert tone="info" title="Penny-drop verification">
                  We deposit ₹1 and match the account holder name returned by your bank. Mismatches are the most common reason applications are rejected.
                </Alert>
              </div>
            )}
            {step === 5 && (
              <div className="space-y-3">
                <p className="text-[13px] text-ink-600">Upload clear scans or photos. Each file can be up to 10 MB.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Certificate of incorporation', 'Or partnership deed / proprietor declaration'],
                    ['GST registration certificate', 'Must be active and match the legal name'],
                    ['Cancelled cheque or bank statement', 'Showing account number and holder name'],
                    ['Owner or director ID', 'PAN plus one address proof'],
                  ].map(([label, hint]) => (
                    <Field key={label} label={label} hint={hint} required>
                      <FileDrop label="Choose a file" hint="PDF, JPG or PNG" accept=".pdf,image/*" multiple={false} files={docs.filter((d) => d.startsWith(label.slice(0, 6)))} onFiles={(names) => setDocs([...docs, `${label.slice(0, 6)}-${names[0]}`])} />
                    </Field>
                  ))}
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="space-y-3">
                <p className="text-[13px] text-ink-600">Pick the departments you want to sell in. Regulated categories need extra approval.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {api.topCategories.map((c) => (
                    <label key={c.id} className={cx('flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors', cats.includes(c.id) ? 'border-forge-500 bg-forge-50/60' : 'border-ink-200 hover:border-ink-300')}>
                      <input type="checkbox" className="mt-0.5 size-4 accent-forge-700" checked={cats.includes(c.id)} onChange={(e) => setCats(e.target.checked ? [...cats, c.id] : cats.filter((x) => x !== c.id))} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-ink-950">{c.name}</span>
                          {['beauty', 'grocery'].includes(c.slug) && <Badge tone="amber">Extra approval</Badge>}
                        </span>
                        <span className="block text-2xs text-ink-500 mt-0.5">Commission from {api.commissions.find((cm) => cm.scopeId === c.id)?.ratePct ?? 12}%</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {step === 7 && (
              <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
                <Field label="Store URL" required hint="marketforge.com/store/…"><Input prefix="/" placeholder="techworld" /></Field>
                <Field label="Store tagline" required><Input placeholder="Consumer electronics, honestly priced" /></Field>
                <Field label="About your store" className="sm:col-span-2" required><Textarea rows={4} placeholder="Who you are, what you sell, and how you handle orders…" /></Field>
                <Field label="Dispatch time" required><Select>{['Same day', '1 business day', '2 business days', '3+ business days'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Return window" required><Select>{['7 days', '10 days', '14 days', '30 days'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Fulfilment model" className="sm:col-span-2" required>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Radio name="ff" defaultChecked label="Self-fulfilled" sublabel="You pack and hand over to our carriers" />
                    <Radio name="ff" label="Fulfilled by MarketForge" sublabel="Send stock to our FCs, we handle the rest" />
                  </div>
                </Field>
              </div>
            )}
            {step === 8 && (
              <div className="space-y-3">
                <Alert tone="success" title="Everything looks complete">
                  Review the summary below, then submit. You can still edit business details after submission, but bank and tax changes restart verification.
                </Alert>
                <DefinitionList columns={2} items={[
                  { label: 'Legal name', value: 'Techworld Retail Pvt. Ltd.' },
                  { label: 'Display name', value: 'TechWorld' },
                  { label: 'GSTIN', value: '29AABCT1234A1Z5' },
                  { label: 'Bank', value: 'HDFC Bank · XXXXXX4821' },
                  { label: 'Categories', value: cats.map((c) => api.categoryById.get(c)?.name).join(', ') || 'None selected' },
                  { label: 'Documents', value: `${docs.length} of 4 uploaded` },
                  { label: 'Fulfilment', value: 'Self-fulfilled' },
                  { label: 'Return window', value: '7 days' },
                ]} />
                <Checkbox label="I confirm the information provided is accurate and I accept the MarketForge Seller Agreement, commission schedule and policy handbook." />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-ink-200/70 bg-ink-50/50">
            <Button size="sm" disabled={step === 0} onClick={back}>Back</Button>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Progress saved', body: 'Come back any time to finish.', variant: 'success' })}>Save and exit</Button>
              {step < ONBOARD_STEPS.length - 1 ? (
                <Button size="sm" variant="primary" onClick={next}>Continue</Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setSubmitted(true)}>Submit application</Button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </PortalPage>
  );
}
