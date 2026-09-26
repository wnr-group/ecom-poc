import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Ban, Boxes, Building2, Check, ChevronRight, ClipboardList, Download, Eye, FileText,
  Flag, GripVertical, LifeBuoy, MessageSquare, Package, Pencil, Percent, Plus, RotateCcw, Send, ShieldCheck, Sparkles, Star, Store, Tags, Trash2, TrendingUp, Truck, Users, Wallet, X,
  CircleAlert, ScrollText, Settings as Receipt, Layers,
} from 'lucide-react';
import * as api from '../lib/api';
import { useApp, ROLE_LABELS } from '../lib/store';
import type { Category, Dispute, Product, SupportTicket, Vendor } from '../lib/types';
import type { RangeKey } from '../lib/api';
import { mediaImage, productImage } from '../lib/images';
import {
  formatDate, formatDateTime, money, moneyCompact, numCompact, relativeTime, titleCase,
} from '../lib/format';
import {
  Alert, Avatar, Badge, Button, Checkbox, DataTable, DefinitionList, Drawer,
  EmptyState, Field, IconButton, Input, KpiRow, Modal, Pagination, Panel, PanelHeader, ProgressBar,
  Radio, Rating, SearchInput, SegmentedControl, Select, StatCard, StatusBadge, Switch, Tabs,
  Textarea, Timeline, cx,
} from '../components/ui';
import { BarsChart, ChartCard, DonutChart, LinesChart, RankList, TrendChart } from '../components/marketplace';
import { MoneyLine, PortalPage } from '../components/layout';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7d' }, { key: '30d', label: '30d' }, { key: '90d', label: '90d' },
];

function Head({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
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

/* ────────────────────────────── Vendors ─────────────────────────────────── */

export function AdminVendors() {
  const { toast, dispatch, state } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<{ vendor: Vendor; kind: 'approve' | 'reject' | 'suspend' | 'reactivate' } | null>(null);
  const [reason, setReason] = useState('');

  const statusOf = (v: Vendor) => (state.vendorStatusOverrides[v.id] ?? v.status) as Vendor['status'];
  const rows = api.vendors
    .filter((v) => tab === 'all' ? true : tab === 'pending' ? ['submitted', 'under_review'].includes(statusOf(v)) : statusOf(v) === tab)
    .filter((v) => !query.trim() || `${v.name} ${v.legalName} ${v.homeCity}`.toLowerCase().includes(query.toLowerCase()));

  const count = (key: string) => api.vendors.filter((v) => key === 'all' ? true : key === 'pending' ? ['submitted', 'under_review'].includes(statusOf(v)) : statusOf(v) === key).length;

  const commit = () => {
    if (!action) return;
    const next = action.kind === 'approve' ? 'approved' : action.kind === 'reject' ? 'rejected' : action.kind === 'suspend' ? 'suspended' : 'approved';
    dispatch({ type: 'vendor/status', vendorId: action.vendor.id, status: next });
    toast({ title: `${action.vendor.name} ${next}`, body: reason || 'Audit log entry created.', variant: action.kind === 'reject' || action.kind === 'suspend' ? 'warning' : 'success' });
    setAction(null); setReason('');
  };

  return (
    <PortalPage>
      <Head
        title="Vendors" subtitle={`${api.vendors.length} sellers · ${count('pending')} awaiting decision`}
        actions={<><Button size="sm" icon={<Download className="size-4" />}>Export</Button><Button size="sm" variant="primary" icon={<Plus className="size-4" />}>Invite vendor</Button></>}
      />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Active" value={count('approved')} icon={<Store className="size-4" />} tone="green" />
          <StatCard label="Pending review" value={count('pending')} icon={<CircleAlert className="size-4" />} tone="amber" hint="2-day SLA" />
          <StatCard label="Suspended" value={count('suspended')} icon={<Ban className="size-4" />} tone="red" />
          <StatCard label="Rejected" value={count('rejected')} icon={<X className="size-4" />} tone="neutral" />
          <StatCard label="Marketplace GMV" value={moneyCompact(api.vendors.reduce((s, v) => s + v.grossSales, 0))} icon={<TrendingUp className="size-4" />} tone="forge" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All', count: count('all') },
            { key: 'pending', label: 'Pending', count: count('pending') },
            { key: 'approved', label: 'Approved', count: count('approved') },
            { key: 'suspended', label: 'Suspended', count: count('suspended') },
            { key: 'rejected', label: 'Rejected', count: count('rejected') },
            { key: 'draft', label: 'Draft', count: count('draft') },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search name, legal entity or city" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select className="h-9 w-[160px]"><option>All categories</option>{api.topCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
          <Select className="h-9 w-[150px]"><option>All states</option>{[...new Set(api.vendors.map((v) => v.homeState))].map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
        <DataTable
          rows={rows} keyOf={(v) => v.id} onRowClick={(v) => navigate(`/admin/vendors/${v.id}`)}
          empty={<EmptyState icon={<Building2 className="size-5" />} title="No vendors match" body="Adjust the filters or search term." />}
          columns={[
            {
              key: 'vendor', header: 'Vendor', sortValue: (v) => v.name,
              render: (v) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid place-items-center size-8 rounded text-white text-[10px] font-bold shrink-0" style={{ background: v.tint }}>{v.name.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink-950 line-clamp-1">{v.name}</p>
                    <p className="text-2xs text-ink-500 line-clamp-1">{v.legalName}</p>
                  </div>
                </div>
              ),
            },
            { key: 'loc', header: 'Location', render: (v) => `${v.homeCity}, ${v.homeState}`, hideBelow: 'lg' },
            { key: 'products', header: 'Products', align: 'right', sortValue: (v) => v.productCount, render: (v) => <span className="mf-tnum">{v.productCount}</span>, hideBelow: 'md' },
            { key: 'gmv', header: 'GMV', align: 'right', sortValue: (v) => v.grossSales, render: (v) => <span className="font-semibold mf-tnum">{moneyCompact(v.grossSales)}</span> },
            { key: 'rating', header: 'Rating', align: 'right', render: (v) => <Rating value={v.rating} size="xs" />, hideBelow: 'md' },
            { key: 'comm', header: 'Commission', align: 'right', render: (v) => <span className="mf-tnum">{v.commissionRate}%</span>, hideBelow: 'lg' },
            { key: 'joined', header: 'Joined', render: (v) => <span className="text-ink-500">{formatDate(v.joinedAt)}</span>, hideBelow: 'lg' },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge status={statusOf(v)} /> },
            {
              key: 'actions', header: '', align: 'right',
              render: (v) => {
                const st = statusOf(v);
                return (
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {['submitted', 'under_review'].includes(st) && <>
                      <Button size="xs" variant="primary" onClick={() => setAction({ vendor: v, kind: 'approve' })}>Approve</Button>
                      <Button size="xs" onClick={() => setAction({ vendor: v, kind: 'reject' })}>Reject</Button>
                    </>}
                    {st === 'approved' && <Button size="xs" onClick={() => setAction({ vendor: v, kind: 'suspend' })}>Suspend</Button>}
                    {st === 'suspended' && <Button size="xs" variant="primary" onClick={() => setAction({ vendor: v, kind: 'reactivate' })}>Reactivate</Button>}
                    <IconButton label="View" size="xs" variant="ghost" onClick={() => navigate(`/admin/vendors/${v.id}`)}><ChevronRight className="size-4" /></IconButton>
                  </div>
                );
              },
            },
          ]}
        />
      </Panel>

      <Modal
        open={!!action} onClose={() => setAction(null)} size="md"
        title={action ? `${titleCase(action.kind)} ${action.vendor.name}?` : ''}
        subtitle={action?.vendor.legalName}
        footer={<>
          <Button size="sm" onClick={() => setAction(null)}>Cancel</Button>
          <Button size="sm" variant={action?.kind === 'approve' || action?.kind === 'reactivate' ? 'primary' : 'danger'} onClick={commit}>
            Confirm {action?.kind}
          </Button>
        </>}
      >
        {action && (
          <div className="space-y-3">
            {action.kind === 'approve' && (
              <>
                <Alert tone="success" title="This vendor goes live immediately">
                  Their storefront becomes public and they can submit listings for catalogue review.
                </Alert>
                <Field label="Commission rate" required hint="Overrides the category and global schedule">
                  <Input type="number" prefix="%" defaultValue={action.vendor.commissionRate} />
                </Field>
                <Field label="Approved categories">
                  <div className="space-y-1.5">
                    {action.vendor.categories.map((c) => <Checkbox key={c} defaultChecked label={api.categoryById.get(c)?.name ?? c} />)}
                  </div>
                </Field>
              </>
            )}
            {(action.kind === 'reject' || action.kind === 'suspend') && (
              <>
                <Alert tone="danger" title={action.kind === 'suspend' ? 'Listings are hidden immediately' : 'The applicant is notified by email'}>
                  {action.kind === 'suspend'
                    ? 'All listings are delisted, open orders must still be fulfilled, and payouts are held pending review.'
                    : 'They can correct the issues and reapply after 7 days.'}
                </Alert>
                <Field label="Reason" required hint="Shared with the vendor and written to the audit log">
                  <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="">Select a reason…</option>
                    {(action.kind === 'suspend'
                      ? ['Counterfeit complaint rate above threshold', 'Chronic late dispatch', 'Policy violation — prohibited items', 'Unresolved disputes above limit', 'Fraudulent order activity']
                      : ['Bank account name mismatch', 'Expired or invalid GST certificate', 'Incomplete documentation', 'Business not verifiable', 'Restricted category without licence']
                    ).map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </Field>
                <Field label="Internal note"><Textarea rows={3} placeholder="Context for the audit trail…" /></Field>
              </>
            )}
            {action.kind === 'reactivate' && (
              <Alert tone="success" title="Reactivating restores the storefront">
                Listings return to their previous status and held payouts release on the next cycle.
              </Alert>
            )}
          </div>
        )}
      </Modal>
    </PortalPage>
  );
}

export function AdminVendorDetail() {
  const { id = '' } = useParams();
  const { toast } = useApp();
  const vendor = api.vendorById.get(id);
  const [tab, setTab] = useState('overview');

  if (!vendor) {
    return <PortalPage><Panel><EmptyState icon={<Building2 className="size-5" />} title="Vendor not found" action={<Button variant="primary" to="/admin/vendors">All vendors</Button>} /></Panel></PortalPage>;
  }

  const verify = api.verificationByVendor.get(vendor.id)!;
  const products = api.vendorProducts(vendor.id);
  const orders = api.vendorOrders(vendor.id);
  const payouts = api.vendorPayouts(vendor.id);
  const reviews = api.vendorReviews(vendor.id);
  const returns = api.vendorReturns(vendor.id);
  const series = api.buildSeries(`vd-${vendor.id}`, 90, [{ key: 'gmv', base: 92000, growth: 0.34, noise: 0.28 }]);

  return (
    <PortalPage>
      <Link to="/admin/vendors" className="inline-flex items-center gap-1.5 text-[13px] text-ink-600 hover:text-forge-800 mb-3">
        <ArrowLeft className="size-4" /> All vendors
      </Link>

      <Panel className="p-4 mb-3">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid place-items-center size-14 rounded-xl text-white font-extrabold text-lg shrink-0" style={{ background: vendor.tint }}>
            {vendor.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-ink-950">{vendor.name}</h1>
              <StatusBadge status={vendor.status} />
              {vendor.badges.map((b) => <Badge key={b} tone="forge">{b}</Badge>)}
            </div>
            <p className="text-[13px] text-ink-500 mt-0.5">{vendor.legalName} · {vendor.homeCity}, {vendor.homeState} · seller since {formatDate(vendor.joinedAt)}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
              <Rating value={vendor.rating} count={vendor.ratingCount} size="xs" />
              <span>{vendor.contactName} · {vendor.contactEmail}</span>
              <span className="mf-tnum">{vendor.contactPhone}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={<Eye className="size-4" />} onClick={() => window.open(`/store/${vendor.slug}`, '_blank')}>Storefront</Button>
            <Button size="sm" icon={<MessageSquare className="size-4" />}>Message</Button>
            {vendor.status === 'approved' && <Button size="sm" variant="danger" onClick={() => toast({ title: 'Suspension flow opened', variant: 'warning' })}>Suspend</Button>}
          </div>
        </div>
      </Panel>

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="GMV" value={moneyCompact(vendor.grossSales)} icon={<TrendingUp className="size-4" />} tone="forge" delta={18.2} />
          <StatCard label="Orders" value={numCompact(vendor.orderCount)} icon={<ClipboardList className="size-4" />} tone="blue" />
          <StatCard label="Products" value={vendor.productCount} icon={<Package className="size-4" />} hint={`${products.filter((p) => p.status === 'published').length} live`} />
          <StatCard label="Return rate" value={`${vendor.returnRate}%`} icon={<RotateCcw className="size-4" />} tone={vendor.returnRate > 5 ? 'red' : 'green'} />
          <StatCard label="Commission" value={`${vendor.commissionRate}%`} icon={<Percent className="size-4" />} tone="violet" hint="Negotiated rate" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'overview', label: 'Overview' },
            { key: 'verification', label: 'Verification' },
            { key: 'products', label: 'Products', count: products.length },
            { key: 'orders', label: 'Orders', count: orders.length },
            { key: 'payouts', label: 'Payouts', count: payouts.length },
            { key: 'reviews', label: 'Reviews', count: reviews.length },
            { key: 'returns', label: 'Returns', count: returns.length },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="p-4">
          {tab === 'overview' && (
            <div className="grid gap-3 lg:grid-cols-3">
              <ChartCard className="lg:col-span-2" title="GMV trend" subtitle="Last 90 days" height={230}>
                <TrendChart data={series} metrics={[{ key: 'gmv', label: 'GMV' }]} currency />
              </ChartCard>
              <Panel>
                <PanelHeader title="Performance scorecard" />
                <div className="p-4 space-y-3">
                  <ProgressBar label="Fulfilment rate" value={vendor.fulfilmentRate} showValue tone="green" />
                  <ProgressBar label="On-time shipping" value={vendor.onTimeShipRate} showValue tone={vendor.onTimeShipRate > 95 ? 'green' : 'amber'} />
                  <ProgressBar label="Cancellation rate" value={vendor.cancellationRate * 10} showValue tone="red" />
                  <ProgressBar label="Return rate" value={vendor.returnRate * 10} showValue tone="amber" />
                  <div className="pt-2 border-t border-ink-100">
                    <DefinitionList items={[
                      { label: 'Avg. response time', value: `${vendor.responseTimeHours} hours` },
                      { label: 'Fulfilment model', value: vendor.fulfilledByMarketForge ? 'Fulfilled by MarketForge' : 'Self-fulfilled' },
                      { label: 'Categories', value: vendor.categories.map((c) => api.categoryById.get(c)?.name).join(', ') },
                    ]} />
                  </div>
                </div>
              </Panel>
              <Panel className="lg:col-span-3">
                <PanelHeader title="About" />
                <p className="px-4 py-3 text-[13px] text-ink-700 leading-relaxed">{vendor.about}</p>
              </Panel>
            </div>
          )}

          {tab === 'verification' && (
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel>
                <PanelHeader title="Onboarding progress" subtitle={`${verify.steps.filter((s) => s.state === 'complete').length} of 9 steps complete`} />
                <div className="p-4">
                  <Timeline steps={verify.steps.map((s) => ({
                    id: s.key, label: s.label, detail: s.note,
                    at: s.completedAt ? formatDate(s.completedAt) : undefined,
                    state: s.state === 'complete' ? 'done' : s.state === 'action_required' ? 'failed' : s.state === 'in_progress' ? 'current' : 'upcoming',
                  }))} />
                </div>
              </Panel>
              <div className="space-y-3">
                {verify.rejectionReason && <Alert tone="danger" title="Application rejected">{verify.rejectionReason}</Alert>}
                <Panel>
                  <PanelHeader title="Business & tax" />
                  <div className="p-4">
                    <DefinitionList columns={2} items={[
                      { label: 'Legal name', value: verify.business.legalName },
                      { label: 'Entity type', value: titleCase(verify.business.entityType) },
                      { label: 'Registration no.', value: <span className="mf-tnum">{verify.business.registrationNumber}</span> },
                      { label: 'Incorporated', value: String(verify.business.incorporationYear) },
                      { label: 'GSTIN', value: <span className="mf-tnum">{verify.tax.gstin}</span> },
                      { label: 'PAN', value: <span className="mf-tnum">{verify.tax.panOrEin}</span> },
                      { label: 'Tax scheme', value: titleCase(verify.tax.taxScheme) },
                      { label: 'Revenue band', value: verify.business.annualRevenueBand },
                    ]} />
                  </div>
                </Panel>
                <Panel>
                  <PanelHeader title="Bank account" actions={verify.bank.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>} />
                  <div className="p-4">
                    <DefinitionList columns={2} items={[
                      { label: 'Account holder', value: verify.bank.accountHolder },
                      { label: 'Bank', value: verify.bank.bankName },
                      { label: 'Account number', value: <span className="mf-tnum">{verify.bank.accountNumberMasked}</span> },
                      { label: 'IFSC', value: <span className="mf-tnum">{verify.bank.ifscOrRouting}</span> },
                    ]} />
                  </div>
                </Panel>
                <Panel>
                  <PanelHeader title="Documents" subtitle={`${verify.documents.length} uploaded`} />
                  <DataTable
                    dense rows={verify.documents} keyOf={(d) => d.id}
                    columns={[
                      { key: 't', header: 'Type', render: (d) => titleCase(d.type) },
                      { key: 'f', header: 'File', render: (d) => <span className="text-ink-600 line-clamp-1">{d.fileName}</span>, hideBelow: 'md' },
                      { key: 's', header: 'Status', align: 'right', render: (d) => <StatusBadge status={d.status} /> },
                      { key: 'a', header: '', align: 'right', render: () => <Button size="xs" variant="ghost">View</Button> },
                    ]}
                  />
                </Panel>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <DataTable
              rows={products} keyOf={(p) => p.id}
              columns={[
                { key: 'p', header: 'Product', render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <img src={productImage(p.imageKind, p.tint, p.imageSeeds[0], 80)} alt="" className="size-8 rounded border border-ink-200 shrink-0" />
                    <span className="line-clamp-1 font-medium">{p.shortTitle}</span>
                  </div>
                ) },
                { key: 'sku', header: 'SKU', render: (p) => <span className="mf-tnum text-ink-600">{p.sku}</span>, hideBelow: 'lg' },
                { key: 'price', header: 'Price', align: 'right', render: (p) => <span className="mf-tnum">{money(p.price)}</span> },
                { key: 'sold', header: 'Sold', align: 'right', render: (p) => <span className="mf-tnum">{numCompact(p.soldCount)}</span>, hideBelow: 'md' },
                { key: 'rating', header: 'Rating', align: 'right', render: (p) => <Rating value={p.rating} size="xs" />, hideBelow: 'md' },
                { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
              ]}
            />
          )}

          {tab === 'orders' && (
            <DataTable
              rows={orders.slice(0, 25)} keyOf={(g) => g.order.id}
              columns={[
                { key: 'n', header: 'Order', render: (g) => <span className="font-medium mf-tnum">{g.order.number}</span> },
                { key: 'd', header: 'Placed', render: (g) => formatDate(g.order.placedAt), hideBelow: 'sm' },
                { key: 'c', header: 'Customer', render: (g) => api.customerById.get(g.order.customerId)?.name, hideBelow: 'lg' },
                { key: 'i', header: 'Items', align: 'right', render: (g) => <span className="mf-tnum">{g.items.length}</span>, hideBelow: 'md' },
                { key: 'v', header: 'Value', align: 'right', render: (g) => <span className="font-semibold mf-tnum">{money(g.subtotal)}</span> },
                { key: 'cm', header: 'Commission', align: 'right', render: (g) => <span className="mf-tnum text-forge-700">{money(g.commission)}</span>, hideBelow: 'lg' },
                { key: 's', header: 'Status', render: (g) => <StatusBadge status={g.items[0].vendorStatus} /> },
              ]}
            />
          )}

          {tab === 'payouts' && (
            <DataTable
              rows={payouts} keyOf={(p) => p.id}
              columns={[
                { key: 'r', header: 'Payout ID', render: (p) => <span className="font-medium mf-tnum">{p.reference}</span> },
                { key: 'p', header: 'Period', render: (p) => <span className="mf-tnum text-ink-600">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span>, hideBelow: 'sm' },
                { key: 'g', header: 'Gross', align: 'right', render: (p) => <span className="mf-tnum">{money(p.grossSales)}</span>, hideBelow: 'md' },
                { key: 'c', header: 'Commission', align: 'right', render: (p) => <span className="mf-tnum text-forge-700">{money(p.commission)}</span>, hideBelow: 'lg' },
                { key: 'n', header: 'Net', align: 'right', render: (p) => <span className="font-semibold mf-tnum">{money(p.netAmount)}</span> },
                { key: 's', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
              ]}
            />
          )}

          {tab === 'reviews' && (
            <ul className="divide-y divide-ink-100 -mx-4 -my-4">
              {reviews.slice(0, 12).map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.customerName} seed={r.avatarSeed} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900">{r.customerName}</p>
                      <p className="text-2xs text-ink-500">on {api.productById.get(r.productId)?.shortTitle} · {relativeTime(r.createdAt)}</p>
                    </div>
                    <Rating value={r.rating} size="xs" className="ml-auto" />
                    {r.status === 'flagged' && <Badge tone="red">Flagged</Badge>}
                  </div>
                  <p className="mt-2 text-[13px] text-ink-700 leading-relaxed line-clamp-2">{r.body}</p>
                </li>
              ))}
            </ul>
          )}

          {tab === 'returns' && (
            <DataTable
              rows={returns} keyOf={(r) => r.id}
              columns={[
                { key: 'rma', header: 'RMA', render: (r) => <span className="font-medium mf-tnum">{r.rma}</span> },
                { key: 'p', header: 'Product', render: (r) => <span className="line-clamp-1">{r.productTitle}</span>, hideBelow: 'md' },
                { key: 'reason', header: 'Reason', render: (r) => r.reason, hideBelow: 'lg' },
                { key: 'amt', header: 'Refund', align: 'right', render: (r) => <span className="mf-tnum">{money(r.refundAmount)}</span> },
                { key: 's', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'd', header: 'Requested', align: 'right', render: (r) => <span className="text-ink-500">{formatDate(r.requestedAt)}</span>, hideBelow: 'sm' },
              ]}
            />
          )}
        </div>
      </Panel>
    </PortalPage>
  );
}

/* ───────────────────────────── Customers ────────────────────────────────── */

export function AdminCustomers() {
  const { toast } = useApp();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<typeof api.customers[number] | null>(null);
  const pageSize = 20;

  const rows = api.customers
    .filter((c) => tab === 'all' ? true : tab === 'suspended' ? c.status === 'suspended' : c.tier === tab)
    .filter((c) => !query.trim() || `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(query.toLowerCase()));
  const shown = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PortalPage>
      <Head title="Customers" subtitle={`${api.customers.length} registered shoppers`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export</Button>} />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Total customers" value={numCompact(api.customers.length * 214)} icon={<Users className="size-4" />} tone="forge" delta={8.9} />
          <StatCard label="Prime members" value={api.customers.filter((c) => c.tier === 'prime').length} icon={<Star className="size-4" />} tone="violet" hint={`${Math.round((api.customers.filter((c) => c.tier === 'prime').length / api.customers.length) * 100)}% of base`} />
          <StatCard label="Avg. lifetime value" value={money(api.customers.reduce((s, c) => s + c.lifetimeValue, 0) / api.customers.length)} icon={<Wallet className="size-4" />} tone="green" />
          <StatCard label="Suspended" value={api.customers.filter((c) => c.status === 'suspended').length} icon={<Ban className="size-4" />} tone="red" hint="Return abuse or fraud" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All', count: api.customers.length },
            { key: 'prime', label: 'Prime', count: api.customers.filter((c) => c.tier === 'prime').length },
            { key: 'plus', label: 'Plus', count: api.customers.filter((c) => c.tier === 'plus').length },
            { key: 'standard', label: 'Standard', count: api.customers.filter((c) => c.tier === 'standard').length },
            { key: 'suspended', label: 'Suspended', count: api.customers.filter((c) => c.status === 'suspended').length },
          ]}
          value={tab} onChange={(k) => { setTab(k); setPage(1); }}
        />
        <div className="px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-80" placeholder="Search name, email or city" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        <DataTable
          rows={shown} keyOf={(c) => c.id} onRowClick={setDetail}
          empty={<EmptyState icon={<Users className="size-5" />} title="No customers match" />}
          columns={[
            {
              key: 'c', header: 'Customer', sortValue: (c) => c.name,
              render: (c) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={c.name} seed={c.id} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-950">{c.name}</p>
                    <p className="text-2xs text-ink-500 truncate">{c.email}</p>
                  </div>
                </div>
              ),
            },
            { key: 'loc', header: 'Location', render: (c) => `${c.city}, ${c.state}`, hideBelow: 'lg' },
            { key: 'tier', header: 'Tier', render: (c) => <Badge tone={c.tier === 'prime' ? 'violet' : c.tier === 'plus' ? 'blue' : 'neutral'}>{titleCase(c.tier)}</Badge>, hideBelow: 'md' },
            { key: 'orders', header: 'Orders', align: 'right', sortValue: (c) => c.orderCount, render: (c) => <span className="mf-tnum">{c.orderCount}</span> },
            { key: 'ltv', header: 'Lifetime value', align: 'right', sortValue: (c) => c.lifetimeValue, render: (c) => <span className="font-semibold mf-tnum">{money(c.lifetimeValue)}</span> },
            { key: 'returns', header: 'Returns', align: 'right', render: (c) => <span className={cx('mf-tnum', c.returnCount > 3 && 'text-amber-600 font-semibold')}>{c.returnCount}</span>, hideBelow: 'md' },
            { key: 'joined', header: 'Joined', render: (c) => <span className="text-ink-500">{formatDate(c.joinedAt)}</span>, hideBelow: 'lg' },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
          ]}
        />
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} onChange={setPage} total={rows.length} pageSize={pageSize} />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-lg"
        title={detail?.name ?? ''} subtitle={detail ? `${detail.email} · customer since ${formatDate(detail.joinedAt)}` : ''}
        footer={detail ? (
          detail.status === 'active'
            ? <Button size="sm" variant="danger" block icon={<Ban className="size-4" />} onClick={() => { toast({ title: `${detail.name} suspended`, body: 'Account access revoked and open orders flagged.', variant: 'warning' }); setDetail(null); }}>Suspend account</Button>
            : <Button size="sm" variant="primary" block onClick={() => { toast({ title: `${detail.name} reactivated`, variant: 'success' }); setDetail(null); }}>Reactivate account</Button>
        ) : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.name} seed={detail.id} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={detail.tier === 'prime' ? 'violet' : 'neutral'}>{titleCase(detail.tier)}</Badge>
                  <StatusBadge status={detail.status} />
                </div>
                <p className="text-xs text-ink-500 mt-1.5 mf-tnum">{detail.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[['Orders', String(detail.orderCount)], ['Lifetime value', moneyCompact(detail.lifetimeValue)], ['Returns', String(detail.returnCount)]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-ink-200 px-3 py-2">
                  <p className="text-2xs text-ink-500">{k}</p>
                  <p className="text-[15px] font-bold text-ink-950 mf-tnum">{v}</p>
                </div>
              ))}
            </div>

            {detail.returnCount > 3 && (
              <Alert tone="warning" title="Elevated return rate">
                {detail.returnCount} returns across {detail.orderCount} orders. Review for return abuse before approving further free pickups.
              </Alert>
            )}

            <DefinitionList columns={2} items={[
              { label: 'Location', value: `${detail.city}, ${detail.state}` },
              { label: 'Currency', value: detail.currency },
              { label: 'Reviews written', value: String(detail.reviewCount) },
              { label: 'Marketing opt-in', value: detail.marketingOptIn ? 'Yes' : 'No' },
            ]} />

            <div>
              <p className="mf-label">Recent orders</p>
              <DataTable
                dense rows={api.customerOrders(detail.id).slice(0, 5)} keyOf={(o) => o.id}
                empty={<EmptyState compact icon={<ClipboardList className="size-5" />} title="No orders yet" />}
                columns={[
                  { key: 'n', header: 'Order', render: (o) => <span className="mf-tnum font-medium">{o.number}</span> },
                  { key: 'd', header: 'Date', render: (o) => formatDate(o.placedAt) },
                  { key: 'v', header: 'Value', align: 'right', render: (o) => <span className="mf-tnum">{money(o.totals.grandTotal)}</span> },
                  { key: 's', header: 'Status', align: 'right', render: (o) => <StatusBadge status={o.status} /> },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ───────────────────── Product moderation & catalogue ───────────────────── */

export function AdminProducts() {
  const { toast } = useApp();
  const [tab, setTab] = useState('pending_approval');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<Product | null>(null);
  const [note, setNote] = useState('');

  const rows = api.products
    .filter((p) => tab === 'all' ? true : tab === 'flagged' ? (p.moderation?.flags.length ?? 0) > 0 : p.status === tab)
    .filter((p) => !query.trim() || `${p.title} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));

  const count = (key: string) => api.products.filter((p) => key === 'all' ? true : key === 'flagged' ? (p.moderation?.flags.length ?? 0) > 0 : p.status === key).length;

  return (
    <PortalPage>
      <Head
        title="Product moderation" subtitle={`${count('pending_approval')} listings awaiting review · ${count('flagged')} flagged by automated checks`}
        actions={<><Button size="sm" icon={<Download className="size-4" />}>Export queue</Button><Button size="sm" to="/admin/categories" icon={<Layers className="size-4" />}>Manage categories</Button></>}
      />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="In queue" value={count('pending_approval')} icon={<CircleAlert className="size-4" />} tone="amber" hint="Median review 4 hours" />
          <StatCard label="Flagged" value={count('flagged')} icon={<Flag className="size-4" />} tone="red" hint="Price outliers, imagery" />
          <StatCard label="Published" value={count('published')} icon={<Check className="size-4" />} tone="green" />
          <StatCard label="Rejected" value={count('rejected')} icon={<X className="size-4" />} tone="neutral" />
          <StatCard label="Featured" value={api.products.filter((p) => p.isFeatured).length} icon={<Sparkles className="size-4" />} tone="violet" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'pending_approval', label: 'Moderation queue', count: count('pending_approval') },
            { key: 'flagged', label: 'Flagged', count: count('flagged') },
            { key: 'published', label: 'Published', count: count('published') },
            { key: 'rejected', label: 'Rejected', count: count('rejected') },
            { key: 'out_of_stock', label: 'Out of stock', count: count('out_of_stock') },
            { key: 'all', label: 'All listings', count: count('all') },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search title or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select className="h-9 w-[160px]"><option>All vendors</option>{api.activeVendors.map((v) => <option key={v.id}>{v.name}</option>)}</Select>
          <Select className="h-9 w-[160px]"><option>All categories</option>{api.topCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
          {selected.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-ink-500 mf-tnum">{selected.length} selected</span>
              <Button size="xs" variant="primary" onClick={() => { toast({ title: `${selected.length} listings approved`, body: 'Now live on the marketplace.', variant: 'success' }); setSelected([]); }}>Approve all</Button>
              <Button size="xs" variant="danger" onClick={() => { toast({ title: `${selected.length} listings rejected`, variant: 'warning' }); setSelected([]); }}>Reject all</Button>
            </div>
          )}
        </div>
        <DataTable
          rows={rows} keyOf={(p) => p.id} selectable selected={selected} onSelect={setSelected} onRowClick={setReview}
          empty={<EmptyState icon={<Package className="size-5" />} title="Queue is clear" body="Nothing is waiting for review in this view." />}
          columns={[
            {
              key: 'p', header: 'Listing',
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
            { key: 'v', header: 'Vendor', render: (p) => <Link to={`/admin/vendors/${p.vendorId}`} className="mf-link" onClick={(e) => e.stopPropagation()}>{api.vendorById.get(p.vendorId)?.name}</Link>, hideBelow: 'md' },
            { key: 'c', header: 'Category', render: (p) => api.categoryById.get(p.categoryId)?.name, hideBelow: 'lg' },
            { key: 'price', header: 'Price', align: 'right', sortValue: (p) => p.price, render: (p) => <span className="font-semibold mf-tnum">{money(p.price)}</span> },
            {
              key: 'flags', header: 'Flags',
              render: (p) => p.moderation?.flags.length
                ? <div className="flex flex-wrap gap-1">{p.moderation.flags.slice(0, 2).map((f) => <Badge key={f} tone="amber">{titleCase(f)}</Badge>)}</div>
                : <span className="text-2xs text-ink-400">None</span>,
              hideBelow: 'lg',
            },
            { key: 'sub', header: 'Submitted', render: (p) => <span className="text-ink-500">{relativeTime(p.moderation?.submittedAt ?? p.createdAt)}</span>, hideBelow: 'sm' },
            { key: 's', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            {
              key: 'a', header: '', align: 'right',
              render: (p) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {p.status === 'pending_approval' && <>
                    <Button size="xs" variant="primary" onClick={() => setReview(p)}>Review</Button>
                  </>}
                  {p.status === 'published' && (
                    <Button size="xs" onClick={() => toast({ title: p.isFeatured ? 'Removed from featured' : 'Featured on homepage', body: p.shortTitle, variant: 'success' })}>
                      {p.isFeatured ? 'Unfeature' : 'Feature'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Drawer
        open={!!review} onClose={() => setReview(null)} width="max-w-2xl"
        title="Review listing" subtitle={review?.title}
        footer={review ? <>
          <Button size="sm" variant="primary" block icon={<Check className="size-4" />} onClick={() => { toast({ title: 'Listing approved', body: `${review.shortTitle} is now live`, variant: 'success' }); setReview(null); }}>Approve & publish</Button>
          <Button size="sm" onClick={() => { toast({ title: 'Changes requested', body: 'Vendor notified with your notes.', variant: 'info' }); setReview(null); }}>Request changes</Button>
          <Button size="sm" variant="danger" onClick={() => { toast({ title: 'Listing rejected', variant: 'warning' }); setReview(null); }}>Reject</Button>
        </> : undefined}
      >
        {review && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={review.status} />
              <Badge tone="neutral">{api.categoryById.get(review.categoryId)?.name}</Badge>
              <Link to={`/admin/vendors/${review.vendorId}`} className="text-xs mf-link">{api.vendorById.get(review.vendorId)?.name}</Link>
            </div>

            {!!review.moderation?.flags.length && (
              <Alert tone="warning" title="Automated checks flagged this listing">
                <ul className="mt-1 space-y-1">
                  {review.moderation.flags.map((f) => (
                    <li key={f} className="flex gap-1.5"><span className="text-amber-600">•</span>{
                      f === 'image_overlay_text' ? 'Primary image appears to contain text overlay'
                      : f === 'price_outlier' ? 'Price is 40% below the category median for this brand'
                      : f === 'duplicate_title' ? 'Title closely matches an existing listing from another seller'
                      : f === 'missing_hsn' ? 'HSN code is missing or invalid for this category'
                      : 'Marketing claims need substantiation'
                    }</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="grid grid-cols-5 gap-2">
              {review.imageSeeds.map((seed) => (
                <img key={seed} src={productImage(review.imageKind, review.tint, seed, 200)} alt="" className="aspect-square w-full rounded-md border border-ink-200" />
              ))}
            </div>

            <DefinitionList columns={2} items={[
              { label: 'SKU', value: <span className="mf-tnum">{review.sku}</span> },
              { label: 'Brand', value: api.brandById.get(review.brandId)?.name },
              { label: 'Price / MRP', value: <span className="mf-tnum">{money(review.price)} / {money(review.mrp)}</span> },
              { label: 'GST rate', value: `${review.taxRatePct}%` },
              { label: 'HSN code', value: <span className="mf-tnum">{review.hsnCode}</span> },
              { label: 'Barcode', value: <span className="mf-tnum">{review.barcode}</span> },
              { label: 'Warranty', value: `${review.warrantyMonths} months` },
              { label: 'Return window', value: `${review.returnWindowDays} days` },
            ]} />

            <div>
              <p className="mf-label">Key features</p>
              <ul className="space-y-1">
                {review.highlights.map((h) => <li key={h} className="text-[13px] text-ink-700 flex gap-2"><span className="text-ink-300">•</span>{h}</li>)}
              </ul>
            </div>

            <div>
              <p className="mf-label">Description</p>
              <p className="text-[13px] text-ink-700 leading-relaxed">{review.description}</p>
            </div>

            <Field label="Moderator note" hint="Shared with the vendor for rejections and change requests">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain what needs to change…" />
            </Field>
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

export function AdminCategories() {
  const { toast } = useApp();
  const [selected, setSelected] = useState<Category>(api.topCategories[0]);
  const [editing, setEditing] = useState(false);

  return (
    <PortalPage>
      <Head
        title="Categories" subtitle={`${api.topCategories.length} departments · ${api.categories.length - api.topCategories.length} subcategories`}
        actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing(true)}>New category</Button>}
      />

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
        <Panel>
          <PanelHeader title="Hierarchy" subtitle="Drag to reorder" />
          <ul className="p-2">
            {api.topCategories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c)}
                  className={cx('flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                    selected.id === c.id ? 'bg-forge-50 text-forge-900' : 'hover:bg-ink-50 text-ink-700')}
                >
                  <GripVertical className="size-3.5 text-ink-300 shrink-0" />
                  <span className="size-2.5 rounded shrink-0" style={{ background: c.tint }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{c.name}</span>
                    <span className="block text-2xs text-ink-500">{api.subcategoriesOf(c.id).length} subcategories · {c.productCount} listings</span>
                  </span>
                  {!c.isActive && <Badge tone="slate">Hidden</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel>
            <PanelHeader
              title={selected.name} subtitle={selected.description}
              actions={<>
                <Button size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="ghost" icon={<Eye className="size-4" />} onClick={() => window.open(`/c/${selected.slug}`, '_blank')}>View</Button>
              </>}
            />
            <div className="p-4 grid gap-3 sm:grid-cols-4">
              {[['Listings', String(selected.productCount)], ['Subcategories', String(api.subcategoriesOf(selected.id).length)], ['Attributes', String(selected.attributes.length)], ['Commission', `${api.commissions.find((c) => c.scopeId === selected.id)?.ratePct ?? 12}%`]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-ink-200 px-3 py-2">
                  <p className="text-2xs text-ink-500">{k}</p>
                  <p className="text-[15px] font-bold text-ink-950 mf-tnum">{v}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Subcategories" actions={<Button size="sm" icon={<Plus className="size-4" />}>Add subcategory</Button>} />
            <DataTable
              rows={api.subcategoriesOf(selected.id)} keyOf={(c) => c.id}
              columns={[
                { key: 'n', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
                { key: 's', header: 'Slug', render: (c) => <span className="mf-tnum text-ink-500">{c.slug}</span>, hideBelow: 'md' },
                { key: 'p', header: 'Listings', align: 'right', render: (c) => <span className="mf-tnum">{api.productsInCategory(c.id).length}</span> },
                { key: 'o', header: 'Order', align: 'right', render: (c) => <span className="mf-tnum text-ink-500">{c.order}</span>, hideBelow: 'lg' },
                { key: 'st', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'disabled'} /> },
                { key: 'a', header: '', align: 'right', render: () => (
                  <div className="flex justify-end gap-0.5">
                    <IconButton label="Edit" size="xs" variant="ghost"><Pencil className="size-3.5" /></IconButton>
                    <IconButton label="Delete" size="xs" variant="ghost"><Trash2 className="size-3.5" /></IconButton>
                  </div>
                ) },
              ]}
            />
          </Panel>

          <Panel>
            <PanelHeader title="Category attributes" subtitle="These drive the filters shoppers see" actions={<Button size="sm" icon={<Plus className="size-4" />}>Add attribute</Button>} />
            <DataTable
              rows={selected.attributes} keyOf={(a) => a.key}
              empty={<EmptyState compact icon={<Tags className="size-5" />} title="No attributes yet" body="Add attributes so buyers can filter this department." />}
              columns={[
                { key: 'l', header: 'Label', render: (a) => <span className="font-medium">{a.label}</span> },
                { key: 'k', header: 'Key', render: (a) => <span className="mf-tnum text-ink-500">{a.key}</span>, hideBelow: 'md' },
                { key: 't', header: 'Type', render: (a) => <Badge tone="neutral">{titleCase(a.type)}</Badge> },
                { key: 'o', header: 'Options', render: (a) => <span className="text-ink-600 line-clamp-1">{a.options?.join(', ') ?? (a.unit ? `Numeric (${a.unit})` : 'Yes / No')}</span>, hideBelow: 'lg' },
                { key: 'f', header: 'Filterable', align: 'right', render: (a) => a.filterable ? <Badge tone="green">Yes</Badge> : <Badge tone="neutral">No</Badge> },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Modal
        open={editing} onClose={() => setEditing(false)} title="Category settings" subtitle={selected.name} size="md"
        footer={<>
          <Button size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={() => { setEditing(false); toast({ title: 'Category saved', variant: 'success' }); }}>Save category</Button>
        </>}
      >
        <div className="space-y-3">
          <Field label="Name" required><Input defaultValue={selected.name} /></Field>
          <Field label="Slug" required hint="Used in the URL — changing it breaks existing links"><Input defaultValue={selected.slug} /></Field>
          <Field label="Description"><Textarea rows={3} defaultValue={selected.description} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display order"><Input type="number" defaultValue={selected.order} /></Field>
            <Field label="Accent colour"><Input defaultValue={selected.tint} /></Field>
          </div>
          <Switch checked={selected.isActive} onChange={() => {}} label="Visible in navigation and search" />
        </div>
      </Modal>
    </PortalPage>
  );
}

/* ────────────────────────────── Orders ─────────────────────────────────── */

export function AdminOrders() {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();

  const rows = api.orders
    .filter((o) => tab === 'all' ? true
      : tab === 'processing' ? ['pending', 'confirmed', 'processing', 'packed'].includes(o.status)
      : tab === 'transit' ? ['shipped', 'out_for_delivery'].includes(o.status)
      : o.status === tab)
    .filter((o) => !query.trim() || o.number.toLowerCase().includes(query.toLowerCase()) || (api.customerById.get(o.customerId)?.name ?? '').toLowerCase().includes(query.toLowerCase()));
  const shown = rows.slice((page - 1) * pageSize, page * pageSize);

  const count = (key: string) => api.orders.filter((o) => key === 'all' ? true
    : key === 'processing' ? ['pending', 'confirmed', 'processing', 'packed'].includes(o.status)
    : key === 'transit' ? ['shipped', 'out_for_delivery'].includes(o.status)
    : o.status === key).length;

  return (
    <PortalPage>
      <Head title="Orders" subtitle={`${api.orders.length} orders across the marketplace`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export</Button>} />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Total orders" value={numCompact(api.orders.length)} icon={<ClipboardList className="size-4" />} tone="forge" delta={12.6} />
          <StatCard label="In fulfilment" value={count('processing')} icon={<Package className="size-4" />} tone="amber" />
          <StatCard label="In transit" value={count('transit')} icon={<Truck className="size-4" />} tone="blue" />
          <StatCard label="Delivered" value={count('delivered')} icon={<Check className="size-4" />} tone="green" />
          <StatCard label="GMV" value={moneyCompact(api.orders.reduce((s, o) => s + o.totals.grandTotal, 0))} icon={<Wallet className="size-4" />} tone="violet" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All', count: count('all') },
            { key: 'processing', label: 'Processing', count: count('processing') },
            { key: 'transit', label: 'In transit', count: count('transit') },
            { key: 'delivered', label: 'Delivered', count: count('delivered') },
            { key: 'cancelled', label: 'Cancelled', count: count('cancelled') },
            { key: 'returned', label: 'Returned', count: count('returned') },
          ]}
          value={tab} onChange={(k) => { setTab(k); setPage(1); }}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search order number or customer" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <Select className="h-9 w-[160px]"><option>All vendors</option>{api.activeVendors.map((v) => <option key={v.id}>{v.name}</option>)}</Select>
          <Select className="h-9 w-[150px]"><option>All payment methods</option>{['Card', 'UPI', 'Net banking', 'Wallet', 'COD'].map((m) => <option key={m}>{m}</option>)}</Select>
        </div>
        <DataTable
          rows={shown} keyOf={(o) => o.id} onRowClick={(o) => navigate(`/orders/${o.id}`)}
          empty={<EmptyState icon={<ClipboardList className="size-5" />} title="No orders match" />}
          columns={[
            { key: 'n', header: 'Order', render: (o) => <span className="font-medium mf-tnum">{o.number}</span> },
            { key: 'd', header: 'Placed', sortValue: (o) => o.placedAt, render: (o) => <span className="text-ink-600">{formatDate(o.placedAt)}</span>, hideBelow: 'sm' },
            { key: 'c', header: 'Customer', render: (o) => api.customerById.get(o.customerId)?.name ?? '—', hideBelow: 'md' },
            { key: 'v', header: 'Vendors', render: (o) => [...new Set(o.items.map((i) => api.vendorById.get(i.vendorId)?.name))].join(', '), hideBelow: 'lg' },
            { key: 'i', header: 'Items', align: 'right', render: (o) => <span className="mf-tnum">{o.items.length}</span>, hideBelow: 'md' },
            { key: 't', header: 'Total', align: 'right', sortValue: (o) => o.totals.grandTotal, render: (o) => <span className="font-semibold mf-tnum">{money(o.totals.grandTotal)}</span> },
            { key: 'cm', header: 'Commission', align: 'right', render: (o) => <span className="mf-tnum text-forge-700">{money(o.totals.commission)}</span>, hideBelow: 'lg' },
            { key: 'p', header: 'Payment', render: (o) => <Badge tone="neutral">{titleCase(o.payment.method)}</Badge>, hideBelow: 'lg' },
            { key: 's', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          ]}
        />
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} onChange={setPage} total={rows.length} pageSize={pageSize} />
      </Panel>
    </PortalPage>
  );
}

/* ────────────────────────────── Returns ────────────────────────────────── */

export function AdminReturns() {
  const { toast } = useApp();
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState<typeof api.returns[number] | null>(null);

  const rows = api.returns.filter((r) => tab === 'all' ? true : tab === 'open' ? !['refunded', 'rejected'].includes(r.status) : r.status === tab);
  const count = (key: string) => api.returns.filter((r) => key === 'all' ? true : key === 'open' ? !['refunded', 'rejected'].includes(r.status) : r.status === key).length;

  return (
    <PortalPage>
      <Head title="Returns" subtitle={`${api.returns.length} return requests · ${count('open')} in progress`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export</Button>} />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Open returns" value={count('open')} icon={<RotateCcw className="size-4" />} tone="amber" />
          <StatCard label="Refunded value" value={moneyCompact(api.returns.filter((r) => r.status === 'refunded').reduce((s, r) => s + r.refundAmount, 0))} icon={<Wallet className="size-4" />} tone="red" />
          <StatCard label="Rejected" value={count('rejected')} icon={<X className="size-4" />} tone="neutral" hint="Outside return window" />
          <StatCard label="Return rate" value="3.4%" icon={<Percent className="size-4" />} tone="green" delta={-0.6} deltaLabel="improving" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All', count: count('all') },
            { key: 'open', label: 'In progress', count: count('open') },
            { key: 'requested', label: 'Requested', count: count('requested') },
            { key: 'inspection', label: 'Inspection', count: count('inspection') },
            { key: 'refunded', label: 'Refunded', count: count('refunded') },
            { key: 'rejected', label: 'Rejected', count: count('rejected') },
          ]}
          value={tab} onChange={setTab}
        />
        <DataTable
          rows={rows} keyOf={(r) => r.id} onRowClick={setDetail}
          empty={<EmptyState icon={<RotateCcw className="size-5" />} title="No returns in this view" />}
          columns={[
            { key: 'rma', header: 'RMA', render: (r) => <span className="font-medium mf-tnum">{r.rma}</span> },
            {
              key: 'p', header: 'Product',
              render: (r) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={productImage(r.imageKind, r.tint, r.id, 80)} alt="" className="size-8 rounded border border-ink-200 shrink-0" />
                  <span className="line-clamp-1">{r.productTitle}</span>
                </div>
              ),
            },
            { key: 'o', header: 'Order', render: (r) => <span className="mf-tnum text-ink-600">{r.orderNumber}</span>, hideBelow: 'lg' },
            { key: 'v', header: 'Vendor', render: (r) => api.vendorById.get(r.vendorId)?.name, hideBelow: 'md' },
            { key: 'reason', header: 'Reason', render: (r) => <Badge tone="neutral">{titleCase(r.reasonCategory)}</Badge>, hideBelow: 'lg' },
            { key: 't', header: 'Type', render: (r) => <Badge tone={r.type === 'replacement' ? 'violet' : 'blue'}>{titleCase(r.type)}</Badge>, hideBelow: 'md' },
            { key: 'amt', header: 'Refund', align: 'right', sortValue: (r) => r.refundAmount, render: (r) => <span className="font-semibold mf-tnum">{money(r.refundAmount)}</span> },
            { key: 's', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'd', header: 'Requested', align: 'right', render: (r) => <span className="text-ink-500">{relativeTime(r.requestedAt)}</span>, hideBelow: 'sm' },
          ]}
        />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-xl"
        title={detail ? `Return ${detail.rma}` : ''} subtitle={detail ? `${detail.productTitle} · order ${detail.orderNumber}` : ''}
        footer={detail && !['refunded', 'rejected'].includes(detail.status) ? <>
          <Button size="sm" variant="primary" block onClick={() => { toast({ title: 'Refund approved', body: `${money(detail.refundAmount)} released to the customer`, variant: 'success' }); setDetail(null); }}>Approve refund</Button>
          <Button size="sm" variant="danger" onClick={() => { toast({ title: 'Return rejected', variant: 'warning' }); setDetail(null); }}>Reject</Button>
        </> : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <Badge tone={detail.type === 'replacement' ? 'violet' : 'blue'}>{titleCase(detail.type)}</Badge>
              <Badge tone="neutral">{titleCase(detail.refundMethod)}</Badge>
            </div>
            <DefinitionList columns={2} items={[
              { label: 'Customer', value: api.customerById.get(detail.customerId)?.name ?? '—' },
              { label: 'Vendor', value: <Link to={`/admin/vendors/${detail.vendorId}`} className="mf-link">{api.vendorById.get(detail.vendorId)?.name}</Link> },
              { label: 'Reason', value: detail.reason },
              { label: 'Refund amount', value: <span className="mf-tnum font-semibold">{money(detail.refundAmount)}</span> },
              { label: 'Requested', value: formatDateTime(detail.requestedAt) },
              { label: 'Pickup slot', value: detail.pickupSlot ?? 'Not scheduled' },
            ]} />
            {detail.comments && (
              <div>
                <p className="mf-label">Customer comments</p>
                <p className="text-[13px] text-ink-700 leading-relaxed italic">"{detail.comments}"</p>
              </div>
            )}
            {detail.media.length > 0 && (
              <div>
                <p className="mf-label">Evidence photos</p>
                <div className="flex gap-2">
                  {detail.media.map((m) => <img key={m.id} src={mediaImage(m.seed, m.tint, 120)} alt={m.caption} className="size-20 rounded-md border border-ink-200" />)}
                </div>
              </div>
            )}
            {detail.inspectionNote && <Alert tone="info" title="Inspection note">{detail.inspectionNote}</Alert>}
            {detail.rejectionReason && <Alert tone="danger" title="Rejected">{detail.rejectionReason}</Alert>}
            <div>
              <p className="mf-label">Timeline</p>
              <Timeline steps={detail.timeline.filter((t) => t.state !== 'upcoming').map((t) => ({ ...t, at: formatDateTime(t.at) }))} />
            </div>
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ───────────────────────────── Payments ────────────────────────────────── */

export function AdminPayments() {
  const [tab, setTab] = useState('payments');
  const payments = api.payments;

  return (
    <PortalPage>
      <Head title="Payments" subtitle="Gateway transactions, refunds and settlement reconciliation" actions={<Button size="sm" icon={<Download className="size-4" />}>Export ledger</Button>} />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Captured" value={moneyCompact(payments.filter((p) => p.status === 'captured').reduce((s, p) => s + p.amount, 0))} icon={<Receipt className="size-4" />} tone="green" />
          <StatCard label="Pending (COD)" value={moneyCompact(payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0))} icon={<CircleAlert className="size-4" />} tone="amber" />
          <StatCard label="Refunded" value={moneyCompact(payments.reduce((s, p) => s + p.refundedAmount, 0))} icon={<RotateCcw className="size-4" />} tone="red" />
          <StatCard label="Gateway fees" value={moneyCompact(payments.reduce((s, p) => s + p.feeAmount, 0))} icon={<Percent className="size-4" />} tone="neutral" />
          <StatCard label="Failed" value={payments.filter((p) => p.status === 'failed').length} icon={<X className="size-4" />} tone="red" hint="Retry or contact buyer" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Payment volume" subtitle="Last 30 days" height={230}>
          <TrendChart data={api.buildSeries('pay-vol', 30, [{ key: 'captured', base: 5_800_000, growth: 0.3, noise: 0.22 }, { key: 'refunded', base: 128000, growth: 0.1, noise: 0.4 }])} metrics={[{ key: 'captured', label: 'Captured' }, { key: 'refunded', label: 'Refunded', color: '#F03E0B' }]} currency />
        </ChartCard>
        <ChartCard title="Payment method mix" subtitle="Share of captured value" height={230}>
          <DonutChart
            data={['card', 'upi', 'netbanking', 'wallet', 'cod'].map((m) => ({
              name: titleCase(m),
              value: payments.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0),
            })).filter((d) => d.value > 0)}
            currency
          />
        </ChartCard>
      </div>

      <Panel className="mt-3">
        <Tabs items={[{ key: 'payments', label: 'Transactions', count: payments.length }, { key: 'refunds', label: 'Refunds', count: api.refunds.length }]} value={tab} onChange={setTab} />
        {tab === 'payments' ? (
          <DataTable
            rows={payments.slice(0, 30)} keyOf={(p) => p.id}
            columns={[
              { key: 'ref', header: 'Transaction', render: (p) => <span className="font-medium mf-tnum">{p.transactionRef}</span> },
              { key: 'o', header: 'Order', render: (p) => <Link to={`/orders/${p.orderId}`} className="mf-link mf-tnum">{api.orderById.get(p.orderId)?.number}</Link>, hideBelow: 'md' },
              { key: 'm', header: 'Method', render: (p) => <span className="text-ink-700">{p.methodLabel}</span>, hideBelow: 'lg' },
              { key: 'g', header: 'Gateway', render: (p) => <Badge tone="neutral">{p.gateway}</Badge>, hideBelow: 'lg' },
              { key: 'a', header: 'Amount', align: 'right', sortValue: (p) => p.amount, render: (p) => <span className="font-semibold mf-tnum">{money(p.amount)}</span> },
              { key: 'f', header: 'Fee', align: 'right', render: (p) => <span className="mf-tnum text-ink-500">{money(p.feeAmount)}</span>, hideBelow: 'lg' },
              { key: 'r', header: 'Refunded', align: 'right', render: (p) => <span className="mf-tnum text-red-600">{p.refundedAmount ? money(p.refundedAmount) : '—'}</span>, hideBelow: 'md' },
              { key: 's', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
              { key: 'd', header: 'Processed', align: 'right', render: (p) => <span className="text-ink-500">{formatDate(p.processedAt)}</span>, hideBelow: 'sm' },
            ]}
          />
        ) : (
          <DataTable
            rows={api.refunds} keyOf={(r) => r.id}
            columns={[
              { key: 'ref', header: 'Reference', render: (r) => <span className="font-medium mf-tnum">{r.reference}</span> },
              { key: 'o', header: 'Order', render: (r) => <span className="mf-tnum text-ink-600">{r.orderNumber}</span>, hideBelow: 'md' },
              { key: 'v', header: 'Vendor', render: (r) => api.vendorById.get(r.vendorId)?.name, hideBelow: 'lg' },
              { key: 'a', header: 'Amount', align: 'right', sortValue: (r) => r.amount, render: (r) => <span className="font-semibold mf-tnum">{money(r.amount)}</span> },
              { key: 'm', header: 'Method', render: (r) => titleCase(r.method), hideBelow: 'lg' },
              { key: 'b', header: 'Borne by', render: (r) => <Badge tone={r.bearer === 'vendor' ? 'neutral' : r.bearer === 'platform' ? 'amber' : 'blue'}>{titleCase(r.bearer)}</Badge>, hideBelow: 'md' },
              { key: 's', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'd', header: 'Initiated', align: 'right', render: (r) => <span className="text-ink-500">{formatDate(r.initiatedAt)}</span>, hideBelow: 'sm' },
            ]}
          />
        )}
      </Panel>
    </PortalPage>
  );
}

/* ────────────────────────────── Payouts ────────────────────────────────── */

export function AdminPayouts() {
  const { toast } = useApp();
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const rows = api.payouts.filter((p) => tab === 'all' ? true : p.status === tab)
    .sort((a, b) => +new Date(b.periodEnd) - +new Date(a.periodEnd));
  const count = (key: string) => api.payouts.filter((p) => key === 'all' ? true : p.status === key).length;

  return (
    <PortalPage>
      <Head
        title="Payouts" subtitle="Vendor settlements across all sellers"
        actions={<>
          <Button size="sm" icon={<Download className="size-4" />}>Export NEFT file</Button>
          <Button size="sm" variant="primary" disabled={!selected.length} onClick={() => { toast({ title: `${selected.length} payouts released`, body: 'Bank transfer batch submitted.', variant: 'success' }); setSelected([]); }}>
            Release {selected.length || ''} payout{selected.length === 1 ? '' : 's'}
          </Button>
        </>}
      />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Pending release" value={moneyCompact(api.payouts.filter((p) => ['pending', 'scheduled'].includes(p.status)).reduce((s, p) => s + p.netAmount, 0))} icon={<Wallet className="size-4" />} tone="amber" hint={`${count('pending') + count('scheduled')} cycles`} />
          <StatCard label="Paid to date" value={moneyCompact(api.payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0))} icon={<Check className="size-4" />} tone="green" />
          <StatCard label="Commission earned" value={moneyCompact(api.payouts.reduce((s, p) => s + p.commission, 0))} icon={<Percent className="size-4" />} tone="forge" />
          <StatCard label="On hold" value={count('on_hold')} icon={<CircleAlert className="size-4" />} tone="amber" hint="Open disputes" />
          <StatCard label="Failed" value={count('failed')} icon={<X className="size-4" />} tone="red" hint="Bank detail mismatch" />
        </div>
      </KpiRow>

      {count('failed') > 0 && (
        <Alert tone="danger" className="mt-3" title={`${count('failed')} payouts failed`} action={<Button size="xs" variant="secondary">Review</Button>}>
          Bank transfers were rejected, usually because of an IFSC or account name mismatch. Verify the vendor's bank details before retrying.
        </Alert>
      )}

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'all', label: 'All', count: count('all') },
            { key: 'pending', label: 'Pending', count: count('pending') },
            { key: 'processing', label: 'Processing', count: count('processing') },
            { key: 'paid', label: 'Paid', count: count('paid') },
            { key: 'on_hold', label: 'On hold', count: count('on_hold') },
            { key: 'failed', label: 'Failed', count: count('failed') },
          ]}
          value={tab} onChange={setTab}
        />
        <DataTable
          rows={rows.slice(0, 40)} keyOf={(p) => p.id} selectable selected={selected} onSelect={setSelected}
          columns={[
            { key: 'ref', header: 'Payout ID', render: (p) => <span className="font-medium mf-tnum">{p.reference}</span> },
            { key: 'v', header: 'Vendor', render: (p) => <Link to={`/admin/vendors/${p.vendorId}`} className="mf-link" onClick={(e) => e.stopPropagation()}>{api.vendorById.get(p.vendorId)?.name}</Link> },
            { key: 'per', header: 'Period', render: (p) => <span className="mf-tnum text-ink-600">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span>, hideBelow: 'lg' },
            { key: 'g', header: 'Gross', align: 'right', sortValue: (p) => p.grossSales, render: (p) => <span className="mf-tnum">{money(p.grossSales)}</span>, hideBelow: 'md' },
            { key: 'c', header: 'Commission', align: 'right', render: (p) => <span className="mf-tnum text-forge-700">−{money(p.commission)}</span>, hideBelow: 'lg' },
            { key: 'r', header: 'Refunds', align: 'right', render: (p) => <span className="mf-tnum text-red-600">−{money(p.refunds)}</span>, hideBelow: 'lg' },
            { key: 'n', header: 'Net payout', align: 'right', sortValue: (p) => p.netAmount, render: (p) => <span className="font-semibold mf-tnum">{money(p.netAmount)}</span> },
            { key: 'm', header: 'Method', render: (p) => <Badge tone="neutral">{titleCase(p.method)}</Badge>, hideBelow: 'lg' },
            { key: 's', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          ]}
          footer={
            <tr>
              <td className="px-3 py-2 text-2xs text-ink-500" colSpan={7}>Total shown</td>
              <td className="px-3 py-2 text-right text-[13px] font-bold mf-tnum">{money(rows.slice(0, 40).reduce((s, p) => s + p.netAmount, 0))}</td>
              <td colSpan={2} />
            </tr>
          }
        />
      </Panel>
    </PortalPage>
  );
}

/* ──────────────────────────── Commissions ──────────────────────────────── */

export function AdminCommissions() {
  const { toast } = useApp();
  const [creating, setCreating] = useState(false);
  const active = api.commissions.filter((c) => c.status === 'active');
  const sample = api.publishedProducts[0];
  const eff = api.effectiveCommission(sample);

  return (
    <PortalPage>
      <Head
        title="Commissions" subtitle="Rate schedule resolved most-specific-first: product, then vendor, then category, then global"
        actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New rule</Button>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Global rate" value={`${active.find((c) => c.scope === 'global')?.ratePct ?? 12}%`} icon={<Percent className="size-4" />} tone="forge" hint="Fallback for unmatched items" />
          <StatCard label="Active rules" value={active.length} icon={<ScrollText className="size-4" />} hint={`${api.commissions.filter((c) => c.status === 'scheduled').length} scheduled`} />
          <StatCard label="Effective blended rate" value="11.4%" icon={<TrendingUp className="size-4" />} tone="green" delta={-0.4} deltaLabel="vs last quarter" />
          <StatCard label="Commission (30d)" value={moneyCompact(api.platformKpis('30d').commission)} icon={<Wallet className="size-4" />} tone="violet" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Rate schedule" subtitle="Lower priority number wins" />
          <DataTable
            rows={[...api.commissions].sort((a, b) => a.priority - b.priority || a.scope.localeCompare(b.scope))} keyOf={(c) => c.id}
            columns={[
              { key: 'scope', header: 'Scope', render: (c) => <Badge tone={c.scope === 'global' ? 'neutral' : c.scope === 'vendor' ? 'forge' : c.scope === 'category' ? 'blue' : 'violet'}>{titleCase(c.scope)}</Badge> },
              { key: 'target', header: 'Applies to', render: (c) => <span className="font-medium text-ink-950">{c.scopeLabel}</span> },
              { key: 'rate', header: 'Rate', align: 'right', sortValue: (c) => c.ratePct, render: (c) => <span className="font-semibold mf-tnum">{c.ratePct}%</span> },
              { key: 'fee', header: 'Fixed fee', align: 'right', render: (c) => <span className="mf-tnum text-ink-600">{c.fixedFee ? money(c.fixedFee) : '—'}</span>, hideBelow: 'md' },
              { key: 'pri', header: 'Priority', align: 'right', render: (c) => <span className="mf-tnum text-ink-500">{c.priority}</span>, hideBelow: 'lg' },
              { key: 'from', header: 'Effective', render: (c) => <span className="text-ink-500 mf-tnum">{formatDate(c.effectiveFrom)}</span>, hideBelow: 'lg' },
              { key: 'st', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
              { key: 'a', header: '', align: 'right', render: (c) => c.status !== 'archived' ? <Button size="xs" onClick={() => toast({ title: 'Rule editor opened', body: c.scopeLabel, variant: 'info' })}>Edit</Button> : null },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Rate resolution example" subtitle={sample.shortTitle} />
          <div className="p-4">
            <ol className="space-y-2">
              {[
                { scope: 'Product', rule: api.commissions.find((c) => c.scope === 'product' && c.scopeId === sample.id), },
                { scope: 'Vendor', rule: api.commissions.find((c) => c.scope === 'vendor' && c.scopeId === sample.vendorId) },
                { scope: 'Category', rule: api.commissions.find((c) => c.scope === 'category' && c.scopeId === api.rootCategoryOf(sample)?.id) },
                { scope: 'Global', rule: api.commissions.find((c) => c.scope === 'global' && c.status === 'active') },
              ].map((row, i) => {
                const wins = row.rule?.id === eff?.id;
                return (
                  <li key={row.scope} className={cx('flex items-center gap-2.5 rounded-lg border px-3 py-2', wins ? 'border-forge-400 bg-forge-50' : 'border-ink-200')}>
                    <span className="text-xs font-semibold text-ink-400 w-4 mf-tnum">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink-950">{row.scope}</span>
                      <span className="block text-2xs text-ink-500 truncate">{row.rule ? row.rule.scopeLabel : 'No rule at this level'}</span>
                    </span>
                    <span className="text-[13px] font-semibold mf-tnum">{row.rule ? `${row.rule.ratePct}%` : '—'}</span>
                    {wins && <Badge tone="forge">Applied</Badge>}
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 pt-3 border-t border-ink-100">
              <MoneyLine label="Selling price" value={sample.price} />
              <MoneyLine label={`Commission at ${eff?.ratePct}%`} value={Math.round((sample.price * (eff?.ratePct ?? 12)) / 100)} tone="debit" />
              {!!eff?.fixedFee && <MoneyLine label="Fixed fee" value={eff.fixedFee} tone="debit" />}
              <MoneyLine label="Vendor receives" value={sample.price - Math.round((sample.price * (eff?.ratePct ?? 12)) / 100) - (eff?.fixedFee ?? 0)} bold />
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        open={creating} onClose={() => setCreating(false)} title="New commission rule" size="md"
        footer={<>
          <Button size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={() => { setCreating(false); toast({ title: 'Commission rule created', body: 'Requires a second approval before it takes effect.', variant: 'success' }); }}>Create rule</Button>
        </>}
      >
        <div className="space-y-3">
          <Field label="Scope" required>
            <Select>{['Global', 'Vendor', 'Category', 'Product'].map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Applies to" required hint="Leave blank for a global rule">
            <Select><option value="">All vendors and categories</option>{api.activeVendors.map((v) => <option key={v.id}>{v.name}</option>)}</Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Commission rate" required><Input type="number" prefix="%" defaultValue={12} /></Field>
            <Field label="Fixed fee per unit"><Input type="number" prefix="₹" defaultValue={0} /></Field>
            <Field label="Effective from" required><Input type="date" defaultValue="2026-10-01" /></Field>
            <Field label="Effective to"><Input type="date" /></Field>
          </div>
          <Field label="Note"><Textarea rows={2} placeholder="Why this rate exists — negotiated deal, category strategy…" /></Field>
          <Alert tone="warning" title="Four-eyes approval required">
            Commission changes need a second admin to approve before they take effect. Both approvals are written to the audit log.
          </Alert>
        </div>
      </Modal>
    </PortalPage>
  );
}

/* ──────────────────────── Promotions & coupons ─────────────────────────── */

export function AdminPromotions() {
  const { toast } = useApp();
  const [tab, setTab] = useState('promotions');
  const [creating, setCreating] = useState(false);

  return (
    <PortalPage>
      <Head
        title="Promotions & coupons" subtitle={`${api.promotions.filter((p) => p.status === 'active').length} active campaigns · ${api.coupons.filter((c) => c.status === 'active').length} live coupon codes`}
        actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Create {tab === 'coupons' ? 'coupon' : 'promotion'}</Button>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Promo revenue" value={moneyCompact(api.promotions.reduce((s, p) => s + p.metrics.revenue, 0))} icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Redemptions" value={numCompact(api.promotions.reduce((s, p) => s + p.metrics.redemptions, 0))} icon={<Tags className="size-4" />} tone="blue" />
          <StatCard label="Coupon usage" value={numCompact(api.coupons.reduce((s, c) => s + c.usedCount, 0))} icon={<Percent className="size-4" />} tone="violet" />
          <StatCard label="Avg. uplift" value={`${(api.promotions.reduce((s, p) => s + p.metrics.uplift, 0) / api.promotions.length).toFixed(1)}%`} icon={<Sparkles className="size-4" />} tone="green" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs items={[{ key: 'promotions', label: 'Promotions', count: api.promotions.length }, { key: 'coupons', label: 'Coupons', count: api.coupons.length }]} value={tab} onChange={setTab} />
        {tab === 'promotions' ? (
          <DataTable
            rows={api.promotions} keyOf={(p) => p.id}
            columns={[
              {
                key: 'n', header: 'Campaign',
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
              { key: 't', header: 'Type', render: (p) => <Badge tone="neutral">{titleCase(p.type)}</Badge>, hideBelow: 'md' },
              { key: 'o', header: 'Owner', render: (p) => <Badge tone={p.ownerType === 'platform' ? 'violet' : 'forge'}>{p.ownerType === 'platform' ? 'Platform' : api.vendorById.get(p.vendorId ?? '')?.name ?? 'Vendor'}</Badge>, hideBelow: 'lg' },
              { key: 'w', header: 'Window', render: (p) => <span className="mf-tnum text-ink-600">{formatDate(p.startsAt)} – {formatDate(p.endsAt)}</span>, hideBelow: 'lg' },
              { key: 'r', header: 'Redemptions', align: 'right', render: (p) => <span className="mf-tnum">{numCompact(p.metrics.redemptions)}</span>, hideBelow: 'md' },
              { key: 'rev', header: 'Revenue', align: 'right', sortValue: (p) => p.metrics.revenue, render: (p) => <span className="font-semibold mf-tnum">{moneyCompact(p.metrics.revenue)}</span> },
              { key: 'u', header: 'Uplift', align: 'right', render: (p) => <span className="mf-tnum text-emerald-700 font-semibold">+{p.metrics.uplift}%</span>, hideBelow: 'md' },
              { key: 's', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
              {
                key: 'a', header: '', align: 'right',
                render: (p) => (
                  <Button size="xs" onClick={() => toast({ title: p.status === 'active' ? `${p.name} paused` : `${p.name} activated`, variant: 'info' })}>
                    {p.status === 'active' ? 'Pause' : p.status === 'paused' ? 'Resume' : 'Edit'}
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <DataTable
            rows={api.coupons} keyOf={(c) => c.id}
            columns={[
              { key: 'code', header: 'Code', render: (c) => <span className="font-bold mf-tnum tracking-wide text-ink-950">{c.code}</span> },
              { key: 'd', header: 'Discount', render: (c) => <span className="text-ink-700">{c.discountType === 'percentage' ? `${c.discountAmount}%${c.maxDiscount ? ` up to ${money(c.maxDiscount)}` : ''}` : c.discountType === 'fixed' ? money(c.discountAmount) : 'Free shipping'}</span> },
              { key: 'min', header: 'Min order', align: 'right', render: (c) => <span className="mf-tnum">{c.minOrderValue ? money(c.minOrderValue) : '—'}</span>, hideBelow: 'lg' },
              {
                key: 'use', header: 'Usage', align: 'right',
                render: (c) => (
                  <span className="inline-flex flex-col items-end">
                    <span className="mf-tnum text-[13px]">{numCompact(c.usedCount)} / {numCompact(c.usageLimit)}</span>
                    <span className="mt-1 block h-1 w-16 rounded-full bg-ink-100 overflow-hidden">
                      <span className={cx('block h-full rounded-full', c.usedCount / c.usageLimit > 0.9 ? 'bg-red-500' : 'bg-forge-600')} style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }} />
                    </span>
                  </span>
                ),
              },
              { key: 'scope', header: 'Scope', render: (c) => <Badge tone="neutral">{c.applicableVendorIds.length ? api.vendorById.get(c.applicableVendorIds[0])?.name ?? 'Vendor' : c.applicableCategoryIds.length ? `${c.applicableCategoryIds.length} categories` : 'Sitewide'}</Badge>, hideBelow: 'md' },
              { key: 'w', header: 'Valid until', render: (c) => <span className="mf-tnum text-ink-600">{formatDate(c.endsAt)}</span>, hideBelow: 'lg' },
              { key: 's', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
              {
                key: 'a', header: '', align: 'right',
                render: (c) => (
                  <Button size="xs" onClick={() => toast({ title: c.status === 'active' ? `${c.code} disabled` : `${c.code} enabled`, variant: 'info' })}>
                    {c.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <Modal
        open={creating} onClose={() => setCreating(false)} size="lg"
        title={tab === 'coupons' ? 'Create a coupon' : 'Create a promotion'}
        footer={<>
          <Button size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={() => { setCreating(false); toast({ title: tab === 'coupons' ? 'Coupon created' : 'Promotion scheduled', variant: 'success' }); }}>
            {tab === 'coupons' ? 'Create coupon' : 'Schedule promotion'}
          </Button>
        </>}
      >
        <div className="space-y-3">
          {tab === 'coupons' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Coupon code" required hint="Uppercase, no spaces"><Input placeholder="FORGE20" className="uppercase" /></Field>
                <Field label="Discount type" required><Select>{['Percentage', 'Fixed amount', 'Free shipping'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Discount amount" required><Input type="number" prefix="%" defaultValue={10} /></Field>
                <Field label="Maximum discount"><Input type="number" prefix="₹" defaultValue={2000} /></Field>
                <Field label="Minimum order value"><Input type="number" prefix="₹" defaultValue={999} /></Field>
                <Field label="Total usage limit"><Input type="number" defaultValue={10000} /></Field>
                <Field label="Per-user limit"><Input type="number" defaultValue={1} /></Field>
                <Field label="Applies to"><Select>{['Sitewide', 'Selected categories', 'Selected vendors', 'Selected products'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Starts" required><Input type="date" defaultValue="2026-09-05" /></Field>
                <Field label="Ends" required><Input type="date" defaultValue="2026-09-30" /></Field>
              </div>
              <Field label="Description" hint="Shown to customers in the coupon list"><Input placeholder="10% off any order above ₹999" /></Field>
              <div className="space-y-2">
                <Checkbox label="First order only" sublabel="Restrict to customers with no previous orders" />
                <Checkbox label="Stackable" sublabel="Can be combined with other active offers" />
              </div>
            </>
          ) : (
            <>
              <Field label="Campaign name" required><Input placeholder="Forge Flash — Electronics 48h" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Promotion type" required><Select>{['Percentage discount', 'Fixed discount', 'Category discount', 'Vendor discount', 'Buy X get Y', 'Free shipping', 'Flash sale'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Discount value" required><Input type="number" prefix="%" defaultValue={25} /></Field>
                <Field label="Starts" required><Input type="datetime-local" /></Field>
                <Field label="Ends" required><Input type="datetime-local" /></Field>
              </div>
              <Field label="Scope" required>
                <div className="space-y-2">
                  <Radio name="pscope" defaultChecked label="Sitewide" sublabel="Every eligible listing on the marketplace" />
                  <Radio name="pscope" label="Selected categories" sublabel="Pick departments to include" />
                  <Radio name="pscope" label="Selected vendors" sublabel="Invite specific sellers to participate" />
                </div>
              </Field>
              <Field label="Description"><Textarea rows={2} placeholder="What buyers see on the campaign banner" /></Field>
              <Alert tone="info" title="Funding split">
                Platform-funded promotions are absorbed by MarketForge. Vendor-funded promotions are deducted from seller settlements before commission.
              </Alert>
            </>
          )}
        </div>
      </Modal>
    </PortalPage>
  );
}

/* ────────────────────────────── Shipping ───────────────────────────────── */

export function AdminShipping() {
  const { toast } = useApp();
  const [tab, setTab] = useState('zones');

  return (
    <PortalPage>
      <Head
        title="Shipping & delivery" subtitle="Zones, methods, carriers and fulfilment centres"
        actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => toast({ title: 'New configuration', body: 'Choose a zone, method or carrier to add.', variant: 'info' })}>Add configuration</Button>}
      />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Active carriers" value={api.deliveryPartners.filter((d) => d.status === 'active').length} icon={<Truck className="size-4" />} tone="forge" hint={`${api.deliveryPartners.length} onboarded`} />
          <StatCard label="Shipments (30d)" value={numCompact(api.deliveryPartners.reduce((s, d) => s + d.shipments30d, 0))} icon={<Package className="size-4" />} tone="blue" />
          <StatCard label="Blended on-time" value={`${(api.deliveryPartners.filter((d) => d.status === 'active').reduce((s, d) => s + d.onTimeRate, 0) / api.deliveryPartners.filter((d) => d.status === 'active').length).toFixed(1)}%`} icon={<Check className="size-4" />} tone="green" delta={1.2} />
          <StatCard label="Serviceable zones" value={api.shippingZones.filter((z) => z.isActive).length} icon={<Boxes className="size-4" />} tone="violet" hint={`${api.shippingZones.length} configured`} />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'zones', label: 'Zones', count: api.shippingZones.length },
            { key: 'methods', label: 'Methods', count: api.shippingMethods.length },
            { key: 'carriers', label: 'Carriers', count: api.deliveryPartners.length },
            { key: 'warehouses', label: 'Fulfilment centres', count: api.warehouses.length },
          ]}
          value={tab} onChange={setTab}
        />
        {tab === 'zones' && (
          <DataTable
            rows={api.shippingZones} keyOf={(z) => z.id}
            columns={[
              { key: 'n', header: 'Zone', render: (z) => <span className="font-medium text-ink-950">{z.name}</span> },
              { key: 'r', header: 'Regions', render: (z) => <span className="text-ink-600 line-clamp-1">{z.regions.join(', ')}</span> },
              { key: 'm', header: 'Methods', render: (z) => <div className="flex flex-wrap gap-1">{z.methodIds.map((m) => <Badge key={m} tone="neutral">{api.shippingMethods.find((x) => x.id === m)?.code}</Badge>)}</div>, hideBelow: 'md' },
              { key: 'cod', header: 'COD', align: 'center', render: (z) => z.codAvailable ? <Badge tone="green">Yes</Badge> : <Badge tone="neutral">No</Badge>, hideBelow: 'lg' },
              { key: 's', header: 'Status', render: (z) => <StatusBadge status={z.isActive ? 'active' : 'disabled'} /> },
              { key: 'a', header: '', align: 'right', render: () => <Button size="xs">Edit</Button> },
            ]}
          />
        )}
        {tab === 'methods' && (
          <DataTable
            rows={api.shippingMethods} keyOf={(m) => m.id}
            columns={[
              { key: 'n', header: 'Method', render: (m) => <span className="font-medium text-ink-950">{m.name}</span> },
              { key: 'c', header: 'Code', render: (m) => <span className="mf-tnum text-ink-500">{m.code}</span>, hideBelow: 'md' },
              { key: 'carrier', header: 'Carrier', render: (m) => api.deliveryPartners.find((d) => d.id === m.carrierId)?.name, hideBelow: 'lg' },
              { key: 'days', header: 'Transit', render: (m) => <span className="mf-tnum">{m.minDays === 0 ? 'Same day' : `${m.minDays}–${m.maxDays} days`}</span> },
              { key: 'base', header: 'Base rate', align: 'right', render: (m) => <span className="mf-tnum">{money(m.baseRate)}</span> },
              { key: 'kg', header: 'Per kg', align: 'right', render: (m) => <span className="mf-tnum text-ink-600">{money(m.perKgRate)}</span>, hideBelow: 'lg' },
              { key: 'free', header: 'Free above', align: 'right', render: (m) => <span className="mf-tnum">{m.freeAbove ? money(m.freeAbove) : '—'}</span>, hideBelow: 'md' },
              { key: 'cod', header: 'COD', align: 'center', render: (m) => m.supportsCod ? <Check className="size-3.5 text-emerald-600 inline" /> : <X className="size-3.5 text-ink-300 inline" />, hideBelow: 'lg' },
              { key: 's', header: 'Status', render: (m) => <StatusBadge status={m.isActive ? 'active' : 'disabled'} /> },
            ]}
          />
        )}
        {tab === 'carriers' && (
          <DataTable
            rows={api.deliveryPartners} keyOf={(d) => d.id}
            columns={[
              {
                key: 'n', header: 'Carrier',
                render: (d) => (
                  <div className="flex items-center gap-2.5">
                    <span className="grid place-items-center size-8 rounded text-white text-[10px] font-bold shrink-0" style={{ background: d.tint }}>{d.code}</span>
                    <div>
                      <p className="font-medium text-ink-950">{d.name}</p>
                      <p className="text-2xs text-ink-500 mf-tnum">{d.supportPhone}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'cov', header: 'Coverage', render: (d) => <span className="text-ink-600 line-clamp-1">{d.coverage}</span>, hideBelow: 'md' },
              { key: 'ship', header: 'Shipments (30d)', align: 'right', sortValue: (d) => d.shipments30d, render: (d) => <span className="mf-tnum">{numCompact(d.shipments30d)}</span>, hideBelow: 'lg' },
              { key: 'ot', header: 'On-time', align: 'right', sortValue: (d) => d.onTimeRate, render: (d) => <span className={cx('font-semibold mf-tnum', d.onTimeRate > 94 ? 'text-emerald-700' : d.onTimeRate > 88 ? 'text-amber-600' : 'text-red-600')}>{d.onTimeRate}%</span> },
              { key: 'transit', header: 'Avg transit', align: 'right', render: (d) => <span className="mf-tnum">{d.avgTransitDays} days</span>, hideBelow: 'md' },
              { key: 'cost', header: 'Cost index', align: 'right', render: (d) => <span className="mf-tnum">{d.costIndex.toFixed(2)}×</span>, hideBelow: 'lg' },
              { key: 's', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
            ]}
          />
        )}
        {tab === 'warehouses' && (
          <DataTable
            rows={api.warehouses} keyOf={(w) => w.id}
            columns={[
              { key: 'n', header: 'Facility', render: (w) => <span className="font-medium text-ink-950">{w.name}</span> },
              { key: 'c', header: 'Code', render: (w) => <span className="mf-tnum text-ink-500">{w.code}</span>, hideBelow: 'md' },
              { key: 'loc', header: 'Location', render: (w) => `${w.city}, ${w.state}`, hideBelow: 'lg' },
              { key: 'cap', header: 'Capacity', align: 'right', render: (w) => <span className="mf-tnum">{numCompact(w.capacityUnits)}</span>, hideBelow: 'md' },
              {
                key: 'util', header: 'Utilisation', align: 'right',
                render: (w) => (
                  <span className="inline-flex flex-col items-end">
                    <span className="mf-tnum text-[13px] font-semibold">{Math.round((w.usedUnits / w.capacityUnits) * 100)}%</span>
                    <span className="mt-1 block h-1 w-16 rounded-full bg-ink-100 overflow-hidden">
                      <span className={cx('block h-full rounded-full', w.usedUnits / w.capacityUnits > 0.85 ? 'bg-red-500' : 'bg-forge-600')} style={{ width: `${(w.usedUnits / w.capacityUnits) * 100}%` }} />
                    </span>
                  </span>
                ),
              },
              { key: 'p', header: 'Primary', align: 'right', render: (w) => w.isPrimary ? <Badge tone="forge">Primary</Badge> : null },
            ]}
          />
        )}
      </Panel>
    </PortalPage>
  );
}

/* ────────────────────────────── Disputes ───────────────────────────────── */

export function AdminDisputes() {
  const { toast } = useApp();
  const [tab, setTab] = useState('open');
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [reply, setReply] = useState('');
  const [resolving, setResolving] = useState(false);

  const rows = api.disputes.filter((d) => tab === 'all' ? true : tab === 'open' ? !['resolved', 'closed'].includes(d.status) : d.status === tab);
  const count = (key: string) => api.disputes.filter((d) => key === 'all' ? true : key === 'open' ? !['resolved', 'closed'].includes(d.status) : d.status === key).length;
  const breached = api.disputes.filter((d) => !['resolved', 'closed'].includes(d.status) && new Date(d.slaDueAt) < new Date());

  return (
    <PortalPage>
      <Head title="Disputes" subtitle={`${count('open')} open cases · ${breached.length} past SLA`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export cases</Button>} />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Open" value={count('open')} icon={<ShieldCheck className="size-4" />} tone="red" />
          <StatCard label="Past SLA" value={breached.length} icon={<CircleAlert className="size-4" />} tone="amber" hint="Escalate immediately" />
          <StatCard label="Value in dispute" value={moneyCompact(api.disputes.filter((d) => !['resolved', 'closed'].includes(d.status)).reduce((s, d) => s + d.amountInDispute, 0))} icon={<Wallet className="size-4" />} tone="violet" />
          <StatCard label="Resolved" value={count('resolved') + count('closed')} icon={<Check className="size-4" />} tone="green" />
          <StatCard label="Chargebacks" value={api.disputes.filter((d) => d.category === 'chargeback').length} icon={<Receipt className="size-4" />} tone="neutral" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'open', label: 'Open', count: count('open') },
            { key: 'under_review', label: 'Under review', count: count('under_review') },
            { key: 'waiting_customer', label: 'Waiting customer', count: count('waiting_customer') },
            { key: 'waiting_vendor', label: 'Waiting vendor', count: count('waiting_vendor') },
            { key: 'resolved', label: 'Resolved', count: count('resolved') },
            { key: 'all', label: 'All', count: count('all') },
          ]}
          value={tab} onChange={setTab}
        />
        <DataTable
          rows={rows} keyOf={(d) => d.id} onRowClick={setDetail}
          empty={<EmptyState icon={<ShieldCheck className="size-5" />} title="No disputes here" body="Nothing needs attention in this view." />}
          columns={[
            { key: 'ref', header: 'Case', render: (d) => <span className="font-medium mf-tnum">{d.reference}</span> },
            { key: 's', header: 'Subject', render: (d) => <span className="line-clamp-1">{d.subject}</span> },
            { key: 'c', header: 'Customer', render: (d) => d.customerName, hideBelow: 'lg' },
            { key: 'v', header: 'Vendor', render: (d) => api.vendorById.get(d.vendorId)?.name, hideBelow: 'md' },
            { key: 'a', header: 'Amount', align: 'right', sortValue: (d) => d.amountInDispute, render: (d) => <span className="font-semibold mf-tnum">{money(d.amountInDispute)}</span> },
            { key: 'p', header: 'Priority', render: (d) => <StatusBadge status={d.priority} /> },
            { key: 'st', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
            {
              key: 'sla', header: 'SLA', align: 'right',
              render: (d) => {
                const late = new Date(d.slaDueAt) < new Date() && !['resolved', 'closed'].includes(d.status);
                return <span className={cx('mf-tnum', late ? 'text-red-600 font-semibold' : 'text-ink-500')}>{late ? 'Breached' : relativeTime(d.slaDueAt)}</span>;
              },
            },
            { key: 'as', header: 'Assignee', render: (d) => d.assigneeName ? <Avatar name={d.assigneeName} size="xs" /> : <span className="text-2xs text-ink-400">Unassigned</span>, align: 'center', hideBelow: 'lg' },
          ]}
        />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => { setDetail(null); setResolving(false); }} width="max-w-2xl"
        title={detail ? detail.reference : ''} subtitle={detail?.subject}
        footer={detail ? (
          resolving ? <>
            <Button size="sm" variant="primary" block onClick={() => { toast({ title: 'Dispute resolved', body: 'Refund issued and both parties notified.', variant: 'success' }); setDetail(null); setResolving(false); }}>Confirm resolution</Button>
            <Button size="sm" onClick={() => setResolving(false)}>Back</Button>
          </> : <>
            <Button size="sm" variant="primary" block icon={<Send className="size-4" />} disabled={!reply.trim()} onClick={() => { toast({ title: 'Reply sent', body: 'Both parties can see your message.', variant: 'success' }); setReply(''); }}>Send reply</Button>
            {!['resolved', 'closed'].includes(detail.status) && <Button size="sm" variant="danger" onClick={() => setResolving(true)}>Resolve case</Button>}
          </>
        ) : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.priority} />
              <Badge tone="neutral">{titleCase(detail.category)}</Badge>
              <Badge tone="neutral">Raised by {titleCase(detail.raisedBy)}</Badge>
            </div>

            <DefinitionList columns={2} items={[
              { label: 'Order', value: <Link to={`/orders/${detail.orderId}`} className="mf-link mf-tnum">{detail.orderNumber}</Link> },
              { label: 'Amount in dispute', value: <span className="mf-tnum font-semibold">{money(detail.amountInDispute)}</span> },
              { label: 'Customer', value: detail.customerName },
              { label: 'Vendor', value: <Link to={`/admin/vendors/${detail.vendorId}`} className="mf-link">{api.vendorById.get(detail.vendorId)?.name}</Link> },
              { label: 'Opened', value: formatDateTime(detail.openedAt) },
              { label: 'SLA due', value: <span className={cx(new Date(detail.slaDueAt) < new Date() && 'text-red-600 font-semibold')}>{formatDateTime(detail.slaDueAt)}</span> },
            ]} />

            {resolving ? (
              <div className="space-y-3">
                <Alert tone="warning" title="Resolution is final">
                  Both parties are notified and the case closes. Refunds are issued immediately and the vendor's settlement is adjusted on the next cycle.
                </Alert>
                <Field label="Outcome" required>
                  <div className="space-y-2">
                    <Radio name="out" defaultChecked label="Refund the customer in full" sublabel={`${money(detail.amountInDispute)} returned to the original payment method`} />
                    <Radio name="out" label="Partial refund" sublabel="Split the amount between customer and vendor" />
                    <Radio name="out" label="Send a replacement" sublabel="Vendor ships a new unit at their cost" />
                    <Radio name="out" label="Find in favour of the vendor" sublabel="No refund; case closed with an explanation" />
                  </div>
                </Field>
                <Field label="Who bears the cost?" required>
                  <Select>{['Vendor', 'Platform', 'Shared 50/50', 'Carrier claim'].map((o) => <option key={o}>{o}</option>)}</Select>
                </Field>
                <Field label="Resolution note" required hint="Written to the audit log and shared with both parties">
                  <Textarea rows={3} placeholder="Explain the decision and the evidence it rests on…" />
                </Field>
                <Checkbox label="Record a policy strike against the vendor" sublabel="Three strikes in 90 days triggers automatic review" />
              </div>
            ) : (
              <>
                <div>
                  <p className="mf-label">Conversation</p>
                  <div className="space-y-3">
                    {detail.messages.map((m) => (
                      <div key={m.id} className={cx('flex gap-2.5', m.authorType === 'agent' && 'flex-row-reverse')}>
                        <Avatar name={m.authorName} seed={m.avatarSeed} size="sm" className="mt-0.5 shrink-0" />
                        <div className={cx('min-w-0 rounded-lg px-3 py-2.5 max-w-[85%]',
                          m.authorType === 'agent' ? 'bg-forge-700 text-white' : m.authorType === 'system' ? 'bg-amber-50 border border-amber-200' : 'bg-ink-100')}>
                          <p className={cx('text-2xs font-semibold', m.authorType === 'agent' ? 'text-white/70' : 'text-ink-500')}>
                            {m.authorName} · {titleCase(m.authorType)} · {relativeTime(m.at)}
                          </p>
                          <p className={cx('mt-1 text-[13px] leading-relaxed', m.authorType === 'agent' ? 'text-white' : 'text-ink-800')}>{m.body}</p>
                          {m.attachments?.map((a) => (
                            <p key={a.id} className={cx('mt-1.5 inline-flex items-center gap-1 text-2xs', m.authorType === 'agent' ? 'text-white/80' : 'text-forge-700')}>
                              <FileText className="size-3" />{a.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mf-label">Evidence</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {detail.evidence.map((e) => (
                      <div key={e.id} className="rounded-lg border border-ink-200 p-2.5">
                        {e.kind === 'image'
                          ? <img src={mediaImage(e.seed, '#12817A', 120)} alt={e.label} className="aspect-video w-full rounded object-cover" />
                          : <div className="aspect-video w-full rounded bg-ink-100 grid place-items-center"><FileText className="size-5 text-ink-400" /></div>}
                        <p className="mt-1.5 text-2xs font-medium text-ink-900 line-clamp-1">{e.label}</p>
                        <p className="text-2xs text-ink-500">{e.uploadedBy} · {relativeTime(e.at)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.resolution && (
                  <Alert tone="success" title={`Resolved — ${titleCase(detail.resolution.outcome)}`}>
                    {detail.resolution.note}
                    <p className="mt-1.5 font-medium">Amount: {money(detail.resolution.amount)} · by {detail.resolution.by} · {formatDate(detail.resolution.at)}</p>
                  </Alert>
                )}

                {!['resolved', 'closed'].includes(detail.status) && (
                  <Field label="Reply to both parties">
                    <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Ask for evidence, set expectations, or explain next steps…" />
                  </Field>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ────────────────────────────── Support ────────────────────────────────── */

export function AdminSupport() {
  const { toast } = useApp();
  const [tab, setTab] = useState('open');
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');

  const rows = api.supportTickets.filter((t) => tab === 'all' ? true : tab === 'open' ? ['open', 'pending'].includes(t.status) : t.status === tab);
  const count = (key: string) => api.supportTickets.filter((t) => key === 'all' ? true : key === 'open' ? ['open', 'pending'].includes(t.status) : t.status === key).length;
  const solved = api.supportTickets.filter((t) => t.satisfaction);

  return (
    <PortalPage>
      <Head title="Support" subtitle={`${count('open')} open tickets from customers and vendors`} actions={<Button size="sm" variant="primary" icon={<Plus className="size-4" />}>New ticket</Button>} />

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="Open tickets" value={count('open')} icon={<LifeBuoy className="size-4" />} tone="red" />
          <StatCard label="Median first reply" value="24 min" icon={<Check className="size-4" />} tone="green" delta={-12.4} deltaLabel="faster than last week" />
          <StatCard label="Solved (30d)" value={count('solved') + count('closed')} icon={<Check className="size-4" />} tone="forge" />
          <StatCard label="Satisfaction" value={`${Math.round((solved.filter((t) => t.satisfaction === 'good').length / Math.max(1, solved.length)) * 100)}%`} icon={<Star className="size-4" />} tone="amber" hint={`${solved.length} rated`} />
          <StatCard label="Urgent" value={api.supportTickets.filter((t) => t.priority === 'urgent' && ['open', 'pending'].includes(t.status)).length} icon={<CircleAlert className="size-4" />} tone="red" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <Tabs
          items={[
            { key: 'open', label: 'Open', count: count('open') },
            { key: 'on_hold', label: 'On hold', count: count('on_hold') },
            { key: 'solved', label: 'Solved', count: count('solved') },
            { key: 'closed', label: 'Closed', count: count('closed') },
            { key: 'all', label: 'All', count: count('all') },
          ]}
          value={tab} onChange={setTab}
        />
        <DataTable
          rows={rows} keyOf={(t) => t.id} onRowClick={setDetail}
          empty={<EmptyState icon={<LifeBuoy className="size-5" />} title="No tickets here" body="Queue is clear for this filter." />}
          columns={[
            { key: 'ref', header: 'Ticket', render: (t) => <span className="font-medium mf-tnum">{t.reference}</span> },
            { key: 's', header: 'Subject', render: (t) => <span className="line-clamp-1">{t.subject}</span> },
            {
              key: 'r', header: 'Requester',
              render: (t) => (
                <div className="flex items-center gap-2">
                  <Avatar name={t.requesterName} seed={t.requesterId} size="xs" />
                  <span className="min-w-0">
                    <span className="block text-[13px] truncate">{t.requesterName}</span>
                    <span className="block text-2xs text-ink-500">{titleCase(t.requesterType)}</span>
                  </span>
                </div>
              ),
              hideBelow: 'md',
            },
            { key: 'c', header: 'Category', render: (t) => <Badge tone="neutral">{titleCase(t.category)}</Badge>, hideBelow: 'lg' },
            { key: 'ch', header: 'Channel', render: (t) => titleCase(t.channel), hideBelow: 'lg' },
            { key: 'p', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
            { key: 'st', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
            { key: 'a', header: 'Assignee', render: (t) => t.assigneeName ? <Avatar name={t.assigneeName} size="xs" /> : <span className="text-2xs text-ink-400">—</span>, align: 'center', hideBelow: 'md' },
            { key: 'u', header: 'Updated', align: 'right', render: (t) => <span className="text-ink-500">{relativeTime(t.updatedAt)}</span>, hideBelow: 'sm' },
          ]}
        />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-2xl"
        title={detail?.reference ?? ''} subtitle={detail?.subject}
        footer={detail ? <>
          <Button size="sm" variant="primary" block icon={<Send className="size-4" />} disabled={!reply.trim()} onClick={() => { toast({ title: 'Reply sent', body: `${detail.requesterName} notified by ${detail.channel}`, variant: 'success' }); setReply(''); }}>Send reply</Button>
          <Button size="sm" onClick={() => { toast({ title: 'Ticket solved', variant: 'success' }); setDetail(null); }}>Mark solved</Button>
        </> : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.priority} />
              <Badge tone="neutral">{titleCase(detail.category)}</Badge>
              <Badge tone="neutral">{titleCase(detail.channel)}</Badge>
              {detail.tags.map((t) => <Badge key={t} tone="forge">{t}</Badge>)}
            </div>

            <DefinitionList columns={2} items={[
              { label: 'Requester', value: `${detail.requesterName} (${titleCase(detail.requesterType)})` },
              { label: 'Related order', value: detail.orderNumber ? <span className="mf-tnum">{detail.orderNumber}</span> : 'None' },
              { label: 'Created', value: formatDateTime(detail.createdAt) },
              { label: 'First response', value: detail.firstResponseMins ? `${detail.firstResponseMins} min` : 'Not yet answered' },
              { label: 'Assignee', value: detail.assigneeName ?? 'Unassigned' },
              { label: 'Satisfaction', value: detail.satisfaction ? titleCase(detail.satisfaction) : '—' },
            ]} />

            <div>
              <p className="mf-label">Conversation</p>
              <div className="space-y-3">
                {detail.messages.map((m) => (
                  <div key={m.id} className={cx('flex gap-2.5', m.authorType === 'agent' && 'flex-row-reverse')}>
                    <Avatar name={m.authorName} seed={m.avatarSeed} size="sm" className="mt-0.5 shrink-0" />
                    <div className={cx('rounded-lg px-3 py-2.5 max-w-[85%]', m.authorType === 'agent' ? 'bg-forge-700 text-white' : 'bg-ink-100')}>
                      <p className={cx('text-2xs font-semibold', m.authorType === 'agent' ? 'text-white/70' : 'text-ink-500')}>{m.authorName} · {relativeTime(m.at)}</p>
                      <p className={cx('mt-1 text-[13px] leading-relaxed', m.authorType === 'agent' ? 'text-white' : 'text-ink-800')}>{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Reply">
              <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your response…" />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {['Apologise and refund', 'Request more detail', 'Escalate to engineering'].map((m) => (
                <button key={m} onClick={() => setReply(m === 'Apologise and refund' ? 'I am sorry about this. I have processed a full refund which should reach you in 3-5 business days, and I have noted the issue against the order.' : m === 'Request more detail' ? 'Thanks for reaching out. Could you share a screenshot and the browser you are using so I can reproduce this?' : 'I have raised this with our engineering team as a priority issue and applied a manual workaround on your account in the meantime.')} className="rounded-full border border-ink-200 px-2.5 py-1 text-2xs text-ink-600 hover:border-forge-300 hover:text-forge-800">{m}</button>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ───────────────────────────── Analytics ───────────────────────────────── */

export function AdminAnalytics() {
  const [range, setRange] = useState<RangeKey>('30d');
  const days = api.daysForRange(range);
  const k = api.platformKpis(range);
  const gmv = api.buildSeries(`an-gmv-${range}`, days, [
    { key: 'gmv', base: 6_140_000, growth: 0.38, noise: 0.22 },
    { key: 'revenue', base: 700_000, growth: 0.44, noise: 0.24 },
  ]);
  const acquisition = api.buildSeries(`an-acq-${range}`, days, [
    { key: 'newCustomers', base: 312, growth: 0.5, noise: 0.28 },
    { key: 'returning', base: 218, growth: 0.36, noise: 0.24 },
  ]);
  const rates = api.buildSeries(`an-rates-${range}`, days, [
    { key: 'conversion', base: 34, growth: 0.18, noise: 0.14 },
    { key: 'returnRate', base: 36, growth: -0.1, noise: 0.2 },
    { key: 'cancellation', base: 19, growth: -0.12, noise: 0.22 },
  ]).map((p) => ({ ...p, conversion: Number((Number(p.conversion) / 10).toFixed(2)), returnRate: Number((Number(p.returnRate) / 10).toFixed(2)), cancellation: Number((Number(p.cancellation) / 10).toFixed(2)) }));
  const catPerf = api.categoryPerformance();
  const leaders = api.vendorLeaderboard();

  return (
    <PortalPage>
      <Head
        title="Analytics" subtitle="Marketplace performance across GMV, customers, vendors and categories"
        actions={<><SegmentedControl options={RANGES} value={range} onChange={setRange} /><Button size="sm" icon={<Download className="size-4" />}>Export report</Button></>}
      />

      <KpiRow cols={6}>
        <div className="contents">
          <StatCard label="GMV" value={moneyCompact(k.gmv)} delta={k.deltas.gmv} icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Revenue" value={moneyCompact(k.revenue)} delta={k.deltas.revenue} icon={<Wallet className="size-4" />} tone="green" />
          <StatCard label="Orders" value={numCompact(k.orders)} delta={k.deltas.orders} icon={<ClipboardList className="size-4" />} tone="blue" />
          <StatCard label="AOV" value={money(k.aov)} delta={k.deltas.aov} icon={<Receipt className="size-4" />} tone="violet" />
          <StatCard label="Conversion" value={`${k.conversionRate}%`} delta={k.deltas.conversionRate} icon={<Percent className="size-4" />} tone="amber" />
          <StatCard label="Repeat rate" value={`${k.repeatRate}%`} delta={2.1} icon={<RotateCcw className="size-4" />} tone="forge" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="GMV and platform revenue" subtitle={`Last ${days} days`} height={264}>
          <TrendChart data={gmv} metrics={[{ key: 'gmv', label: 'GMV' }, { key: 'revenue', label: 'Revenue', color: '#F03E0B' }]} currency />
        </ChartCard>
        <ChartCard title="Quality rates" subtitle="Conversion, returns and cancellations" height={264}>
          <LinesChart data={rates} metrics={[{ key: 'conversion', label: 'Conversion' }, { key: 'returnRate', label: 'Return rate', color: '#F03E0B' }, { key: 'cancellation', label: 'Cancellation', color: '#B45309' }]} percent />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Customer acquisition" subtitle="New versus returning buyers" height={240}>
          <TrendChart data={acquisition} metrics={[{ key: 'newCustomers', label: 'New' }, { key: 'returning', label: 'Returning', color: '#4C5FD7' }]} stacked />
        </ChartCard>
        <ChartCard title="GMV by category" subtitle="All departments" height={240}>
          <BarsChart data={catPerf.map((c) => ({ label: c.category.name, gmv: c.gmv }))} metrics={[{ key: 'gmv', label: 'GMV' }]} currency horizontal />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Category performance" subtitle="GMV, growth and quality by department" />
          <DataTable
            dense rows={catPerf} keyOf={(c) => c.category.id}
            columns={[
              { key: 'c', header: 'Category', render: (c) => (
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded shrink-0" style={{ background: c.category.tint }} />
                  <span className="font-medium">{c.category.name}</span>
                </span>
              ) },
              { key: 'g', header: 'GMV', align: 'right', sortValue: (c) => c.gmv, render: (c) => <span className="font-semibold mf-tnum">{moneyCompact(c.gmv)}</span> },
              { key: 'gr', header: 'Growth', align: 'right', render: (c) => <span className={cx('mf-tnum font-semibold', c.growth >= 0 ? 'text-emerald-700' : 'text-red-600')}>{c.growth >= 0 ? '▲' : '▼'}{Math.abs(c.growth)}%</span> },
              { key: 'aov', header: 'AOV', align: 'right', render: (c) => <span className="mf-tnum">{money(c.aov)}</span>, hideBelow: 'md' },
              { key: 'cr', header: 'CR', align: 'right', render: (c) => <span className="mf-tnum">{c.conversion}%</span>, hideBelow: 'lg' },
              { key: 'rr', header: 'Return', align: 'right', render: (c) => <span className={cx('mf-tnum', c.returnRate > 6 && 'text-red-600')}>{c.returnRate}%</span>, hideBelow: 'lg' },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Top vendors" subtitle="By GMV in the period" />
          <RankList items={leaders.slice(0, 8).map((v) => ({
            label: v.name,
            sublabel: `${numCompact(v.orderCount)} orders · ${v.rating}★ · ${v.commissionRate}% commission`,
            value: moneyCompact(v.gmv), share: v.gmv, to: `/admin/vendors/${v.id}`, tint: v.tint,
          }))} />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel>
          <PanelHeader title="Top products marketplace-wide" subtitle="By revenue" />
          <DataTable
            rows={api.topProducts(undefined, 10)} keyOf={(t) => t.product.id}
            columns={[
              { key: 'p', header: 'Product', render: (t) => (
                <div className="flex items-center gap-2.5">
                  <img src={productImage(t.product.imageKind, t.product.tint, t.product.imageSeeds[0], 80)} alt="" className="size-8 rounded border border-ink-200 shrink-0" />
                  <Link to={`/p/${t.product.slug}`} className="font-medium hover:text-forge-800 line-clamp-1">{t.product.shortTitle}</Link>
                </div>
              ) },
              { key: 'v', header: 'Vendor', render: (t) => api.vendorById.get(t.product.vendorId)?.name, hideBelow: 'md' },
              { key: 'c', header: 'Category', render: (t) => api.categoryById.get(t.product.categoryId)?.name, hideBelow: 'lg' },
              { key: 'u', header: 'Units', align: 'right', render: (t) => <span className="mf-tnum">{numCompact(t.units)}</span> },
              { key: 'r', header: 'Revenue', align: 'right', sortValue: (t) => t.revenue, render: (t) => <span className="font-semibold mf-tnum">{moneyCompact(t.revenue)}</span> },
              { key: 'rt', header: 'Rating', align: 'right', render: (t) => <Rating value={t.product.rating} size="xs" />, hideBelow: 'md' },
            ]}
          />
        </Panel>
      </div>
    </PortalPage>
  );
}

/* ───────────────────────────── Audit log ───────────────────────────────── */

export function AdminAudit() {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [resource, setResource] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<typeof api.auditLogs[number] | null>(null);
  const pageSize = 20;

  const rows = api.auditLogs
    .filter((a) => severity === 'all' || a.severity === severity)
    .filter((a) => resource === 'all' || a.resourceType === resource)
    .filter((a) => !query.trim() || `${a.action} ${a.resourceLabel} ${a.actorName}`.toLowerCase().includes(query.toLowerCase()));
  const shown = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PortalPage>
      <Head title="Audit logs" subtitle={`${api.auditLogs.length} recorded administrative actions`} actions={<Button size="sm" icon={<Download className="size-4" />}>Export log</Button>} />

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Events (45d)" value={api.auditLogs.length} icon={<ScrollText className="size-4" />} tone="forge" />
          <StatCard label="Critical" value={api.auditLogs.filter((a) => a.severity === 'critical').length} icon={<CircleAlert className="size-4" />} tone="red" hint="Four-eyes approved" />
          <StatCard label="Warnings" value={api.auditLogs.filter((a) => a.severity === 'warning').length} icon={<Flag className="size-4" />} tone="amber" />
          <StatCard label="Active actors" value={new Set(api.auditLogs.map((a) => a.actorName)).size} icon={<Users className="size-4" />} tone="blue" />
        </div>
      </KpiRow>

      <Panel className="mt-3">
        <PanelHeader title="Event log" subtitle="Immutable record of every privileged action" />
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ink-200/70">
          <SearchInput className="w-full sm:w-72" placeholder="Search action, resource or actor" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <Select className="h-9 w-[140px]" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
            <option value="all">All severities</option>
            {['info', 'warning', 'critical'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
          <Select className="h-9 w-[150px]" value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }}>
            <option value="all">All resources</option>
            {[...new Set(api.auditLogs.map((a) => a.resourceType))].map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
          </Select>
        </div>
        <DataTable
          rows={shown} keyOf={(a) => a.id} onRowClick={setDetail}
          empty={<EmptyState icon={<ScrollText className="size-5" />} title="No matching events" />}
          columns={[
            { key: 'at', header: 'Timestamp', render: (a) => <span className="mf-tnum text-ink-600">{formatDateTime(a.at)}</span> },
            {
              key: 'actor', header: 'Actor',
              render: (a) => (
                <div className="flex items-center gap-2">
                  <Avatar name={a.actorName} size="xs" />
                  <span className="min-w-0">
                    <span className="block text-[13px] truncate">{a.actorName}</span>
                    <span className="block text-2xs text-ink-500">{ROLE_LABELS[a.actorRole]}</span>
                  </span>
                </div>
              ),
            },
            { key: 'action', header: 'Action', render: (a) => <span className="font-medium text-ink-950">{a.action}</span> },
            { key: 'res', header: 'Resource', render: (a) => <span className="text-ink-700"><Badge tone="neutral" className="mr-1.5">{titleCase(a.resourceType)}</Badge>{a.resourceLabel}</span>, hideBelow: 'md' },
            { key: 'ip', header: 'IP', render: (a) => <span className="mf-tnum text-ink-500">{a.ip}</span>, hideBelow: 'lg' },
            { key: 'loc', header: 'Location', render: (a) => <span className="text-ink-500">{a.location}</span>, hideBelow: 'lg' },
            { key: 'sev', header: 'Severity', align: 'right', render: (a) => <StatusBadge status={a.severity} /> },
          ]}
        />
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} onChange={setPage} total={rows.length} pageSize={pageSize} />
      </Panel>

      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width="max-w-lg"
        title={detail?.action ?? ''} subtitle={detail ? formatDateTime(detail.at) : ''}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.severity} />
              <Badge tone="neutral">{titleCase(detail.resourceType)}</Badge>
            </div>
            <DefinitionList columns={2} items={[
              { label: 'Actor', value: `${detail.actorName} (${ROLE_LABELS[detail.actorRole]})` },
              { label: 'Resource', value: detail.resourceLabel },
              { label: 'Resource ID', value: <span className="mf-tnum">{detail.resourceId}</span> },
              { label: 'IP address', value: <span className="mf-tnum">{detail.ip}</span> },
              { label: 'Device', value: detail.device },
              { label: 'Location', value: detail.location },
            ]} />
            {detail.note && <Alert tone="warning" title="Note">{detail.note}</Alert>}
            {(detail.before || detail.after) && (
              <div>
                <p className="mf-label">Change diff</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-red-700">Before</p>
                    <pre className="mt-1.5 text-2xs text-ink-800 whitespace-pre-wrap font-mono">{JSON.stringify(detail.before ?? {}, null, 2)}</pre>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-emerald-700">After</p>
                    <pre className="mt-1.5 text-2xs text-ink-800 whitespace-pre-wrap font-mono">{JSON.stringify(detail.after ?? {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </PortalPage>
  );
}

/* ───────────────────────────── Settings ────────────────────────────────── */

export function AdminSettings() {
  const { toast } = useApp();
  const [tab, setTab] = useState('general');
  const roles = ['admin', 'catalog_manager', 'finance_manager', 'support_agent'] as const;
  const PERMS = [
    ['Catalogue', ['catalog.view', 'catalog.moderate', 'category.manage']],
    ['Vendors', ['vendor.view', 'vendor.approve']],
    ['Customers', ['customer.view', 'customer.suspend']],
    ['Orders & returns', ['order.view', 'return.manage']],
    ['Finance', ['finance.view', 'finance.payout', 'finance.commission']],
    ['Service', ['dispute.resolve', 'support.manage']],
    ['Platform', ['analytics.view', 'audit.view', 'settings.manage']],
  ] as const;
  const ROLE_PERMS: Record<string, string[]> = {
    admin: PERMS.flatMap(([, p]) => [...p]),
    catalog_manager: ['catalog.view', 'catalog.moderate', 'category.manage', 'vendor.view', 'order.view', 'analytics.view'],
    finance_manager: ['finance.view', 'finance.payout', 'finance.commission', 'order.view', 'return.manage', 'vendor.view', 'analytics.view', 'audit.view'],
    support_agent: ['order.view', 'return.manage', 'customer.view', 'dispute.resolve', 'support.manage', 'vendor.view', 'catalog.view'],
  };

  return (
    <PortalPage>
      <Head title="Settings" subtitle="Marketplace configuration, roles and policies" actions={<Button size="sm" variant="primary" onClick={() => toast({ title: 'Settings saved', variant: 'success' })}>Save changes</Button>} />

      <Panel>
        <Tabs
          items={[
            { key: 'general', label: 'General' },
            { key: 'roles', label: 'Roles & permissions' },
            { key: 'team', label: 'Team', count: api.users.filter((u) => !['customer', 'vendor'].includes(u.role)).length },
            { key: 'policies', label: 'Marketplace policies' },
          ]}
          value={tab} onChange={setTab}
        />
        <div className="p-4">
          {tab === 'general' && (
            <div className="grid gap-3 sm:grid-cols-2 max-w-4xl">
              <Field label="Marketplace name"><Input defaultValue="MarketForge" /></Field>
              <Field label="Tagline"><Input defaultValue="Build. Sell. Scale." /></Field>
              <Field label="Support email"><Input defaultValue="support@marketforge.com" /></Field>
              <Field label="Default currency"><Select><option>INR — Indian Rupee</option><option>USD — US Dollar</option></Select></Field>
              <Field label="Free shipping threshold"><Input type="number" prefix="₹" defaultValue={499} /></Field>
              <Field label="COD order limit"><Input type="number" prefix="₹" defaultValue={50000} /></Field>
              <Field label="Vendor review SLA (days)"><Input type="number" defaultValue={2} /></Field>
              <Field label="Dispute SLA (hours)"><Input type="number" defaultValue={48} /></Field>
              <Field label="Payout cycle"><Select><option>Weekly (Sunday close, Wednesday pay)</option><option>Fortnightly</option><option>Monthly</option></Select></Field>
              <Field label="Payout reserve"><Input type="number" prefix="%" defaultValue={5} /></Field>
              <div className="sm:col-span-2 space-y-2.5 pt-2">
                <Switch checked onChange={() => {}} label="Require catalogue moderation before listings go live" />
                <Switch checked onChange={() => {}} label="Auto-approve listings from vendors rated 4.7★ and above" />
                <Switch checked={false} onChange={() => {}} label="Allow international vendors" />
                <Switch checked onChange={() => {}} label="Hold payouts for vendors with open disputes above ₹25,000" />
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div className="space-y-3">
              <Alert tone="info" title="Role-based access control">
                Permissions determine which pages and actions each role can reach. Changes take effect at the next sign-in and are written to the audit log.
              </Alert>
              <div className="overflow-x-auto mf-scroll">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-ink-200 bg-ink-50/70">
                      <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">Permission</th>
                      {roles.map((r) => (
                        <th key={r} className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-500 text-center">{ROLE_LABELS[r]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMS.map(([group, perms]) => (
                      <>
                        <tr key={group} className="bg-ink-50/40">
                          <td colSpan={roles.length + 1} className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-600">{group}</td>
                        </tr>
                        {perms.map((p) => (
                          <tr key={p} className="border-b border-ink-100">
                            <td className="px-3 py-2 text-[13px] text-ink-800 mf-tnum">{p}</td>
                            {roles.map((r) => (
                              <td key={r} className="px-3 py-2 text-center">
                                {ROLE_PERMS[r].includes(p)
                                  ? <Check className="size-4 text-emerald-600 inline" />
                                  : <X className="size-4 text-ink-200 inline" />}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-600">Internal users with access to the admin console.</p>
                <Button size="sm" variant="primary" icon={<Plus className="size-4" />}>Invite teammate</Button>
              </div>
              <DataTable
                rows={api.users.filter((u) => !['customer', 'vendor'].includes(u.role))} keyOf={(u) => u.id}
                columns={[
                  { key: 'u', header: 'User', render: (u) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} seed={u.avatarSeed} size="sm" />
                      <div><p className="font-medium text-ink-950">{u.name}</p><p className="text-2xs text-ink-500">{u.email}</p></div>
                    </div>
                  ) },
                  { key: 'r', header: 'Role', render: (u) => <Badge tone={u.role === 'admin' ? 'forge' : 'neutral'}>{ROLE_LABELS[u.role]}</Badge> },
                  { key: 'j', header: 'Title', render: (u) => <span className="text-ink-600">{u.jobTitle}</span>, hideBelow: 'lg' },
                  { key: '2fa', header: '2FA', align: 'center', render: (u) => u.twoFactorEnabled ? <Badge tone="green">On</Badge> : <Badge tone="red">Off</Badge>, hideBelow: 'md' },
                  { key: 'l', header: 'Last active', render: (u) => <span className="text-ink-500">{u.lastLoginAt ? relativeTime(u.lastLoginAt) : '—'}</span>, hideBelow: 'sm' },
                  { key: 's', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
                  { key: 'a', header: '', align: 'right', render: () => <Button size="xs">Manage</Button> },
                ]}
              />
            </div>
          )}

          {tab === 'policies' && (
            <div className="space-y-3 max-w-3xl">
              <Field label="Return policy minimum" hint="Vendors may offer longer, never shorter">
                <Select defaultValue="7"><option value="7">7 days</option><option value="10">10 days</option><option value="14">14 days</option></Select>
              </Field>
              <Field label="Prohibited categories" hint="Comma separated — listings matching these are auto-rejected">
                <Textarea rows={2} defaultValue="Weapons, tobacco, prescription medication, live animals, counterfeit goods" />
              </Field>
              <Field label="Vendor code of conduct"><Textarea rows={5} defaultValue="Sellers must dispatch within the stated handling time, describe items accurately, honour the published return policy, and respond to buyer messages within 48 hours. Repeated breaches lead to suspension." /></Field>
              <Field label="Catalogue imagery rules"><Textarea rows={4} defaultValue="Primary images must show the product on a pure white background at a minimum of 1000x1000 pixels, with no text, watermarks, borders or promotional overlays. The product must fill at least 85% of the frame." /></Field>
              <div className="space-y-2.5">
                <Switch checked onChange={() => {}} label="Require a policy strike record for every dispute resolved against a vendor" />
                <Switch checked onChange={() => {}} label="Auto-suspend vendors after 3 policy strikes in 90 days" />
              </div>
            </div>
          )}
        </div>
      </Panel>
    </PortalPage>
  );
}
