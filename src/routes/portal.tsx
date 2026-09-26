import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes, ClipboardList, Package, Percent, ShieldCheck, Star, TrendingUp, Users,
  Wallet, Building2, RotateCcw, CircleAlert,
} from 'lucide-react';
import * as api from '../lib/api';
import { productImage } from '../lib/images';
import { formatDate, money, moneyCompact, numCompact, relativeTime, titleCase } from '../lib/format';
import {
  Alert, Avatar, Badge, Button, DataTable, EmptyState, KpiRow, Panel, PanelHeader, ProgressBar,
  Rating, SegmentedControl, StatCard, StatusBadge, cx,
} from '../components/ui';
import { BarsChart, ChartCard, DonutChart, RankList, TrendChart } from '../components/marketplace';
import { PortalPage } from '../components/layout';
import type { RangeKey } from '../lib/api';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7d' }, { key: '30d', label: '30d' }, { key: '90d', label: '90d' },
];

/* ───────────────────────── Vendor dashboard ─────────────────────────────── */

const VENDOR_ID = 'ven_techworld';

export function VendorDashboard() {
  const [range, setRange] = useState<RangeKey>('30d');
  const days = api.daysForRange(range);
  const k = api.vendorKpis(VENDOR_ID, range);
  const vendor = api.vendorById.get(VENDOR_ID)!;
  const revenueSeries = api.buildSeries(`ven-rev-${VENDOR_ID}`, days, [
    { key: 'revenue', base: 148000, growth: 0.42, noise: 0.3 },
    { key: 'orders', base: 42, growth: 0.28, noise: 0.35 },
  ]);
  const groups = api.vendorOrders(VENDOR_ID);
  const newOrders = groups.filter((g) => g.items.some((i) => i.vendorStatus === 'new'));
  const inv = api.vendorInventory(VENDOR_ID);
  const lowStock = inv.filter((i) => api.alertTypeFor(i) === 'low_stock' || api.alertTypeFor(i) === 'out_of_stock');
  const top = api.topProducts(VENDOR_ID, 6);
  const catSplit = api.topCategories
    .map((c) => ({ name: c.name, value: api.vendorProducts(VENDOR_ID).filter((p) => p.categoryId.startsWith(c.id)).reduce((s, p) => s + p.price * p.soldCount, 0), color: c.tint }))
    .filter((d) => d.value > 0);

  return (
    <PortalPage>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Good morning, Ananya</h1>
          <p className="text-[13px] text-ink-500 mt-1">
            {vendor.name} · {k.liveProducts} live listings · seller rating {vendor.rating}★ · commission {vendor.commissionRate}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={RANGES} value={range} onChange={setRange} />
          <Button size="sm" variant="primary" to="/vendor">Add product</Button>
        </div>
      </div>

      {(newOrders.length > 0 || lowStock.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {newOrders.length > 0 && (
            <Alert tone="warning" title={`${newOrders.length} orders awaiting acceptance`} action={<Button size="xs" variant="secondary">Review</Button>}>
              Accept within 12 hours to protect your fulfilment SLA. Oldest has been waiting 4 hours.
            </Alert>
          )}
          {lowStock.length > 0 && (
            <Alert tone="danger" title={`${lowStock.length} SKUs low or out of stock`} action={<Button size="xs" variant="secondary">Restock</Button>}>
              These listings will stop converting. {inv.filter((i) => api.alertTypeFor(i) === 'out_of_stock').length} are already unavailable.
            </Alert>
          )}
        </div>
      )}

      <KpiRow cols={4}>
        <div className="contents">
          <StatCard label="Gross sales" value={moneyCompact(k.grossSales)} delta={k.deltas.grossSales} deltaLabel="vs previous period" icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Net revenue" value={moneyCompact(k.netRevenue)} delta={11.8} deltaLabel={`after ${moneyCompact(k.commission)} commission`} icon={<Wallet className="size-4" />} tone="green" />
          <StatCard label="Orders" value={numCompact(k.orders)} delta={k.deltas.orders} deltaLabel={`${numCompact(k.unitsSold)} units sold`} icon={<ClipboardList className="size-4" />} tone="blue" />
          <StatCard label="Pending payout" value={moneyCompact(k.pendingPayout)} delta={k.deltas.pendingPayout} deltaLabel="next cycle Wednesday" icon={<Wallet className="size-4" />} tone="amber" />
        </div>
      </KpiRow>

      <div className="mt-3">
        <KpiRow cols={4}>
          <div className="contents">
            <StatCard label="Products" value={k.products} hint={`${k.liveProducts} published`} icon={<Package className="size-4" />} />
            <StatCard label="Customers" value={numCompact(k.customers)} hint="Unique buyers" icon={<Users className="size-4" />} />
            <StatCard label="Avg. rating" value={k.rating.toFixed(1)} delta={k.deltas.rating} deltaLabel={`${numCompact(k.ratingCount)} ratings`} icon={<Star className="size-4" />} tone="amber" />
            <StatCard label="Returns" value={k.returns} delta={k.deltas.returns} deltaLabel={`${k.returnRate}% return rate`} icon={<RotateCcw className="size-4" />} tone="red" />
          </div>
        </KpiRow>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Revenue & orders" subtitle={`Last ${days} days`} height={260}>
          <TrendChart data={revenueSeries} metrics={[{ key: 'revenue', label: 'Revenue' }, { key: 'orders', label: 'Orders', color: '#F03E0B' }]} currency />
        </ChartCard>
        <ChartCard title="Sales by category" subtitle="Share of gross sales" height={260}>
          <DonutChart data={catSplit} currency centerLabel="Gross sales" centerValue={moneyCompact(catSplit.reduce((s, d) => s + d.value, 0))} />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Top products" subtitle="By revenue in the period" actions={<Button size="xs">Export</Button>} />
          <RankList items={top.map((t) => ({
            label: t.product.shortTitle,
            sublabel: `${numCompact(t.units)} units · ${t.product.rating}★`,
            value: moneyCompact(t.revenue),
            share: t.revenue,
            to: `/p/${t.product.slug}`,
            tint: t.product.tint,
          }))} />
        </Panel>

        <Panel>
          <PanelHeader title="Orders to fulfil" subtitle={`${newOrders.length} awaiting acceptance`} actions={<Button size="xs">View all</Button>} />
          {groups.length === 0 ? (
            <EmptyState compact icon={<ClipboardList className="size-5" />} title="No orders yet" />
          ) : (
            <DataTable
              rows={groups.slice(0, 7)} keyOf={(g) => g.order.id} dense
              columns={[
                { key: 'order', header: 'Order', render: (g) => <span className="font-medium mf-tnum">{g.order.number}</span> },
                { key: 'items', header: 'Items', render: (g) => `${g.items.length} × ${g.items[0].title.slice(0, 22)}…`, hideBelow: 'md' },
                { key: 'total', header: 'Value', align: 'right', render: (g) => <span className="font-semibold mf-tnum">{money(g.subtotal)}</span> },
                { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.items[0].vendorStatus} /> },
                { key: 'when', header: 'Placed', align: 'right', render: (g) => <span className="text-ink-500">{relativeTime(g.order.placedAt)}</span>, hideBelow: 'sm' },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Fulfilment health" />
          <div className="p-4 space-y-3.5">
            <ProgressBar label="On-time shipping" value={vendor.onTimeShipRate} showValue tone={vendor.onTimeShipRate > 95 ? 'green' : 'amber'} />
            <ProgressBar label="Fulfilment rate" value={vendor.fulfilmentRate} showValue tone="green" />
            <ProgressBar label="Order defect rate" value={vendor.cancellationRate * 10} showValue tone="red" />
            <ProgressBar label="Conversion rate" value={k.conversionRate * 12} showValue tone="forge" />
            <p className="text-2xs text-ink-500 leading-relaxed pt-1">
              Sellers above 95% on-time shipping qualify for the Top Rated badge and priority placement in search.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Inventory alerts" subtitle={`${lowStock.length} need attention`} />
          <DataTable
            rows={lowStock.slice(0, 6)} keyOf={(i) => i.id} dense
            empty={<EmptyState compact icon={<Boxes className="size-5" />} title="All stock healthy" />}
            columns={[
              { key: 'sku', header: 'SKU', render: (i) => <span className="mf-tnum">{i.sku}</span> },
              { key: 'product', header: 'Product', render: (i) => <span className="line-clamp-1">{api.productById.get(i.productId)?.shortTitle}</span>, hideBelow: 'md' },
              { key: 'avail', header: 'Available', align: 'right', render: (i) => <span className={cx('font-semibold mf-tnum', i.available === 0 ? 'text-red-600' : 'text-amber-600')}>{i.available}</span> },
              { key: 'alert', header: 'Alert', align: 'right', render: (i) => <StatusBadge status={api.alertTypeFor(i) ?? 'active'} /> },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Recent reviews" subtitle="Respond within 24 hours" />
          <ul className="divide-y divide-ink-100">
            {api.vendorReviews(VENDOR_ID).slice(0, 4).map((r) => (
              <li key={r.id} className="p-3.5">
                <div className="flex items-center gap-2">
                  <Avatar name={r.customerName} seed={r.avatarSeed} size="xs" />
                  <span className="text-[13px] font-medium text-ink-900 truncate">{r.customerName}</span>
                  <Rating value={r.rating} size="xs" className="ml-auto" />
                </div>
                <p className="mt-1.5 text-xs text-ink-600 line-clamp-2 leading-relaxed">{r.body}</p>
                <p className="text-2xs text-ink-400 mt-1">{api.productById.get(r.productId)?.shortTitle} · {relativeTime(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel>
          <PanelHeader title="Payout history" subtitle="Weekly cycles, settled every Wednesday" actions={<Button size="xs">Statement</Button>} />
          <DataTable
            rows={api.vendorPayouts(VENDOR_ID).slice(0, 6)} keyOf={(p) => p.id}
            columns={[
              { key: 'ref', header: 'Payout ID', render: (p) => <span className="font-medium mf-tnum">{p.reference}</span> },
              { key: 'period', header: 'Period', render: (p) => <span className="mf-tnum">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</span>, hideBelow: 'sm' },
              { key: 'gross', header: 'Gross', align: 'right', render: (p) => <span className="mf-tnum">{money(p.grossSales)}</span>, hideBelow: 'md' },
              { key: 'comm', header: 'Commission', align: 'right', render: (p) => <span className="mf-tnum text-red-600">−{money(p.commission)}</span>, hideBelow: 'md' },
              { key: 'refunds', header: 'Refunds', align: 'right', render: (p) => <span className="mf-tnum text-red-600">−{money(p.refunds)}</span>, hideBelow: 'lg' },
              { key: 'net', header: 'Net payout', align: 'right', render: (p) => <span className="font-semibold mf-tnum">{money(p.netAmount)}</span> },
              { key: 'status', header: 'Status', align: 'right', render: (p) => <StatusBadge status={p.status} /> },
            ]}
          />
        </Panel>
      </div>
    </PortalPage>
  );
}

/* ────────────────────────── Admin dashboard ─────────────────────────────── */

export function AdminDashboard() {
  const [range, setRange] = useState<RangeKey>('30d');
  const days = api.daysForRange(range);
  const k = api.platformKpis(range);
  const gmvSeries = api.buildSeries(`gmv-${range}`, days, [
    { key: 'gmv', base: 6_140_000, growth: 0.38, noise: 0.24 },
    { key: 'revenue', base: 700_000, growth: 0.44, noise: 0.26 },
  ]);
  const growthSeries = api.buildSeries(`growth-${range}`, days, [
    { key: 'customers', base: 312, growth: 0.5, noise: 0.3 },
    { key: 'vendors', base: 9, growth: 0.35, noise: 0.5 },
  ]);
  const catPerf = api.categoryPerformance();
  const leaders = api.vendorLeaderboard();
  const pendingVendors = api.vendors.filter((v) => ['submitted', 'under_review'].includes(v.status));
  const pendingProducts = api.products.filter((p) => p.status === 'pending_approval');
  const openDisputes = api.disputes.filter((d) => !['resolved', 'closed'].includes(d.status));

  return (
    <PortalPage>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950">Marketplace overview</h1>
          <p className="text-[13px] text-ink-500 mt-1">
            {api.activeVendors.length} active vendors · {numCompact(k.products)} listings · {numCompact(k.customers)} customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={RANGES} value={range} onChange={setRange} />
          <Button size="sm">Export report</Button>
        </div>
      </div>

      <KpiRow cols={5}>
        <div className="contents">
          <StatCard label="GMV" value={moneyCompact(k.gmv)} delta={k.deltas.gmv} deltaLabel="vs previous period" icon={<TrendingUp className="size-4" />} tone="forge" />
          <StatCard label="Platform revenue" value={moneyCompact(k.revenue)} delta={k.deltas.revenue} deltaLabel={`${moneyCompact(k.commission)} commission`} icon={<Wallet className="size-4" />} tone="green" />
          <StatCard label="Orders" value={numCompact(k.orders)} delta={k.deltas.orders} deltaLabel={`AOV ${money(k.aov)}`} icon={<ClipboardList className="size-4" />} tone="blue" />
          <StatCard label="Refunds" value={moneyCompact(k.refunds)} delta={k.deltas.refunds} deltaLabel={`${k.returnRate}% return rate`} icon={<RotateCcw className="size-4" />} tone="red" />
          <StatCard label="Conversion" value={`${k.conversionRate}%`} delta={k.deltas.conversionRate} deltaLabel={`${k.repeatRate}% repeat buyers`} icon={<Percent className="size-4" />} tone="violet" />
        </div>
      </KpiRow>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending approvals" value={pendingVendors.length + pendingProducts.length} tone="amber"
          icon={<CircleAlert className="size-4" />} hint={`${pendingVendors.length} vendors · ${pendingProducts.length} listings`}
          footer={<Link to="/admin" className="text-xs font-semibold text-forge-700 hover:underline">Review queue →</Link>}
        />
        <StatCard label="Open disputes" value={openDisputes.length} tone="red" icon={<ShieldCheck className="size-4" />} hint={`${openDisputes.filter((d) => d.priority === 'urgent').length} urgent`} />
        <StatCard label="Support tickets" value={k.ticketsOpen} tone="blue" icon={<Users className="size-4" />} hint="Open and pending" />
        <StatCard label="Active vendors" value={k.vendors} tone="forge" icon={<Building2 className="size-4" />} hint={`${k.pendingVendors} in review`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="GMV & platform revenue" subtitle={`Last ${days} days`} height={272}>
          <TrendChart data={gmvSeries} metrics={[{ key: 'gmv', label: 'GMV' }, { key: 'revenue', label: 'Revenue', color: '#F03E0B' }]} currency />
        </ChartCard>
        <ChartCard title="Category performance" subtitle="GMV share" height={272}>
          <DonutChart
            data={catPerf.slice(0, 6).map((c) => ({ name: c.category.name, value: c.gmv, color: c.category.tint }))}
            currency centerLabel="Total GMV" centerValue={moneyCompact(catPerf.reduce((s, c) => s + c.gmv, 0))}
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Customer & vendor growth" subtitle="New sign-ups" height={240}>
          <TrendChart data={growthSeries} metrics={[{ key: 'customers', label: 'New customers' }, { key: 'vendors', label: 'New vendors', color: '#4C5FD7' }]} />
        </ChartCard>
        <ChartCard title="GMV by category" subtitle="Top 8 departments" height={240}>
          <BarsChart
            data={catPerf.slice(0, 8).map((c) => ({ label: c.category.name, gmv: c.gmv }))}
            metrics={[{ key: 'gmv', label: 'GMV' }]} currency horizontal
          />
        </ChartCard>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Vendor applications" subtitle={`${pendingVendors.length} awaiting decision`} actions={<Button size="xs">Open queue</Button>} />
          {pendingVendors.length === 0 ? (
            <EmptyState compact icon={<Building2 className="size-5" />} title="No pending applications" />
          ) : (
            <div className="divide-y divide-ink-100">
              {pendingVendors.map((v) => {
                const verify = api.verificationByVendor.get(v.id);
                const done = verify?.steps.filter((s) => s.state === 'complete').length ?? 0;
                return (
                  <div key={v.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="grid place-items-center size-10 rounded-lg text-white font-bold text-xs shrink-0" style={{ background: v.tint }}>
                      {v.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink-950">{v.name}</p>
                      <p className="text-2xs text-ink-500">{v.legalName} · {v.homeCity} · submitted {relativeTime(verify?.submittedAt ?? v.joinedAt)}</p>
                      <ProgressBar className="mt-1.5 max-w-[200px]" value={(done / 9) * 100} label={`${done}/9 steps complete`} tone="forge" />
                    </div>
                    <StatusBadge status={v.status} />
                    <div className="flex gap-1.5">
                      <Button size="xs" variant="primary">Approve</Button>
                      <Button size="xs" variant="secondary">Review</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Moderation queue" subtitle={`${pendingProducts.length} listings pending`} actions={<Button size="xs">Open queue</Button>} />
          {pendingProducts.length === 0 ? (
            <EmptyState compact icon={<Package className="size-5" />} title="Queue is clear" />
          ) : (
            <div className="divide-y divide-ink-100">
              {pendingProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                  <img src={productImage(p.imageKind, p.tint, p.imageSeeds[0], 80)} alt="" className="size-9 rounded border border-ink-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink-950 line-clamp-1">{p.title}</p>
                    <p className="text-2xs text-ink-500">
                      {api.vendorById.get(p.vendorId)?.name} · {money(p.price)} · submitted {relativeTime(p.moderation?.submittedAt ?? p.createdAt)}
                    </p>
                    {!!p.moderation?.flags.length && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.moderation.flags.map((f) => <Badge key={f} tone="amber">{titleCase(f)}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="xs" variant="primary">Approve</Button>
                    <Button size="xs" variant="secondary">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Vendor leaderboard" subtitle="By gross sales" actions={<Button size="xs">All vendors</Button>} />
          <DataTable
            rows={leaders.slice(0, 8)} keyOf={(v) => v.id} dense
            columns={[
              {
                key: 'vendor', header: 'Vendor',
                render: (v) => (
                  <span className="flex items-center gap-2">
                    <span className="grid place-items-center size-6 rounded text-white text-[10px] font-bold shrink-0" style={{ background: v.tint }}>{v.name.slice(0, 2).toUpperCase()}</span>
                    <Link to={`/store/${v.slug}`} className="font-medium hover:text-forge-800">{v.name}</Link>
                  </span>
                ),
              },
              { key: 'gmv', header: 'GMV', align: 'right', render: (v) => <span className="font-semibold mf-tnum">{moneyCompact(v.gmv)}</span>, sortValue: (v) => v.gmv },
              { key: 'growth', header: 'Growth', align: 'right', render: (v) => <span className={cx('font-semibold mf-tnum', v.growth >= 0 ? 'text-emerald-700' : 'text-red-600')}>{v.growth >= 0 ? '▲' : '▼'}{Math.abs(v.growth)}%</span>, hideBelow: 'sm' },
              { key: 'orders', header: 'Orders', align: 'right', render: (v) => <span className="mf-tnum">{numCompact(v.orderCount)}</span>, hideBelow: 'md' },
              { key: 'rating', header: 'Rating', align: 'right', render: (v) => <Rating value={v.rating} size="xs" />, hideBelow: 'md' },
              { key: 'comm', header: 'Commission', align: 'right', render: (v) => <span className="mf-tnum">{v.commissionRate}%</span>, hideBelow: 'lg' },
              { key: 'status', header: 'Status', align: 'right', render: (v) => <StatusBadge status={v.status} /> },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Recent audit activity" actions={<Button size="xs">Full log</Button>} />
          <ul className="divide-y divide-ink-100">
            {api.auditLogs.slice(0, 7).map((a) => (
              <li key={a.id} className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className={cx('mt-1 size-2 rounded-full shrink-0',
                    a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500')} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900">{a.action}</p>
                    <p className="text-2xs text-ink-500 truncate">{a.resourceLabel}</p>
                    <p className="text-2xs text-ink-400 mt-0.5">{a.actorName} · {relativeTime(a.at)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel>
          <PanelHeader title="Open disputes" subtitle={`${openDisputes.length} needing resolution`} actions={<Button size="xs">All disputes</Button>} />
          <DataTable
            rows={openDisputes.slice(0, 6)} keyOf={(d) => d.id}
            columns={[
              { key: 'ref', header: 'Reference', render: (d) => <span className="font-medium mf-tnum">{d.reference}</span> },
              { key: 'subject', header: 'Subject', render: (d) => <span className="line-clamp-1">{d.subject}</span> },
              { key: 'vendor', header: 'Vendor', render: (d) => api.vendorById.get(d.vendorId)?.name, hideBelow: 'md' },
              { key: 'amount', header: 'Amount', align: 'right', render: (d) => <span className="mf-tnum">{money(d.amountInDispute)}</span>, hideBelow: 'sm' },
              { key: 'priority', header: 'Priority', render: (d) => <StatusBadge status={d.priority} /> },
              { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
              { key: 'sla', header: 'SLA', align: 'right', render: (d) => <span className={cx('mf-tnum', new Date(d.slaDueAt) < new Date() ? 'text-red-600 font-semibold' : 'text-ink-500')}>{relativeTime(d.slaDueAt)}</span>, hideBelow: 'sm' },
            ]}
          />
        </Panel>
      </div>
    </PortalPage>
  );
}
