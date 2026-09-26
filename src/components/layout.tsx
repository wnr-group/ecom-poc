/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell, ChevronDown, Heart, LayoutGrid, LogOut, Mail, MapPin, Menu, Package, Search, Settings,
  ShoppingCart, Store, User, X, Home, Boxes, Users, Star, Tags, Wallet, BarChart3, FileClock,
  ShieldCheck, LifeBuoy, Truck, Percent, Receipt, RotateCcw, ClipboardList, Building2, ScrollText,
  CircleHelp, TrendingUp, Sparkles, ChevronRight, PanelLeftClose, PanelLeft, Gauge,
} from 'lucide-react';
import * as api from '../lib/api';
import { useApp, ROLE_LABELS } from '../lib/store';
import type { Role } from '../lib/types';
import { formatDateShort, money, relativeTime, titleCase } from '../lib/format';
import {
  Avatar, Badge, Button, Dropdown, IconButton, MenuDivider, MenuItem, MenuLabel, Toaster, cx,
} from './ui';

/* ───────────────────────────────── Brand ────────────────────────────────── */

export function Logo({ variant = 'light', compact }: { variant?: 'light' | 'dark'; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span className="grid place-items-center size-8 rounded-lg bg-ember-500 text-white font-bold text-[15px] shrink-0 shadow-sm">M</span>
      {!compact && (
        <span className="leading-none">
          <span className={cx('block font-display font-extrabold text-[17px] tracking-tight', variant === 'light' ? 'text-white' : 'text-ink-950')}>
            MarketForge
          </span>
          <span className={cx('block text-[9px] font-semibold uppercase tracking-[0.14em] mt-0.5', variant === 'light' ? 'text-forge-300' : 'text-forge-700')}>
            Build. Sell. Scale.
          </span>
        </span>
      )}
    </span>
  );
}

/* ────────────────────────── Notification dropdown ───────────────────────── */

function NotificationBell({ audience, dark }: { audience: 'customer' | 'vendor' | 'admin'; dark?: boolean }) {
  const { state, dispatch } = useApp();
  const list = state.notifications.filter((n) => n.audience === audience);
  const unread = list.filter((n) => !n.read).length;
  const tone = { info: 'blue', success: 'green', warning: 'amber', critical: 'red' } as const;

  return (
    <Dropdown
      width="w-[360px]"
      trigger={
        <button className={cx('relative grid place-items-center size-9 rounded-md transition-colors', dark ? 'hover:bg-white/10 text-white' : 'hover:bg-ink-100 text-ink-600')} aria-label="Notifications">
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-ember-500 text-white text-[9px] font-bold grid place-items-center mf-tnum">
              {unread}
            </span>
          )}
        </button>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100">
            <p className="text-[13px] font-semibold text-ink-950">Notifications</p>
            {unread > 0 && (
              <button onClick={() => dispatch({ type: 'notification/read' })} className="text-xs font-medium text-forge-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto mf-scroll">
            {list.map((n) => (
              <Link
                key={n.id} to={n.href ?? '#'} onClick={() => { dispatch({ type: 'notification/read', id: n.id }); close(); }}
                className={cx('flex gap-3 px-3 py-2.5 border-b border-ink-100 last:border-0 hover:bg-ink-50 transition-colors', !n.read && 'bg-forge-50/40')}
              >
                <span className={cx('mt-1 size-1.5 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-ember-500')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-ink-900 leading-snug">{n.title}</p>
                    <Badge tone={tone[n.severity]}>{titleCase(n.kind)}</Badge>
                  </div>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-2xs text-ink-400 mt-1">{relativeTime(n.at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Dropdown>
  );
}

/* ─────────────────────────── Role / workspace menu ──────────────────────── */

const WORKSPACES: { role: Role; to: string; label: string; blurb: string; icon: ReactNode }[] = [
  { role: 'customer', to: '/', label: 'Customer Marketplace', blurb: 'Shop, track orders, returns', icon: <ShoppingCart className="size-4" /> },
  { role: 'vendor', to: '/vendor', label: 'Vendor Portal', blurb: 'Listings, orders, payouts', icon: <Store className="size-4" /> },
  { role: 'admin', to: '/admin', label: 'Marketplace Admin', blurb: 'Full marketplace control', icon: <ShieldCheck className="size-4" /> },
  { role: 'catalog_manager', to: '/admin/products', label: 'Catalog Manager', blurb: 'Products, categories, moderation', icon: <Boxes className="size-4" /> },
  { role: 'finance_manager', to: '/admin/payouts', label: 'Finance Manager', blurb: 'Payouts, commissions, refunds', icon: <Wallet className="size-4" /> },
  { role: 'support_agent', to: '/admin/support', label: 'Support Agent', blurb: 'Tickets and disputes', icon: <LifeBuoy className="size-4" /> },
];

export function WorkspaceSwitcher({ dark }: { dark?: boolean }) {
  const { role, setRole } = useApp();
  const navigate = useNavigate();
  return (
    <Dropdown
      width="w-[288px]"
      trigger={
        <button className={cx('flex items-center gap-1.5 rounded-md px-2 h-9 text-[13px] font-medium transition-colors',
          dark ? 'text-white/90 hover:bg-white/10' : 'text-ink-700 hover:bg-ink-100')}>
          <LayoutGrid className="size-4" />
          <span className="hidden lg:inline">{ROLE_LABELS[role]}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      }
    >
      {(close) => (
        <>
          <MenuLabel>Switch workspace</MenuLabel>
          {WORKSPACES.map((w) => (
            <button
              key={w.role}
              onClick={() => { setRole(w.role); navigate(w.to); close(); }}
              className={cx('flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-ink-50', role === w.role && 'bg-forge-50')}
            >
              <span className={cx('mt-0.5 grid place-items-center size-7 rounded-md border shrink-0',
                role === w.role ? 'bg-forge-100 border-forge-200 text-forge-700' : 'bg-ink-50 border-ink-200 text-ink-500')}>
                {w.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink-900">{w.label}</span>
                <span className="block text-xs text-ink-500 mt-0.5">{w.blurb}</span>
              </span>
            </button>
          ))}
          <MenuDivider />
          <div className="px-3 py-2">
            <p className="text-2xs text-ink-500 leading-relaxed">
              Role-based access controls which pages and actions are available. Switching here simulates signing in as that role.
            </p>
          </div>
        </>
      )}
    </Dropdown>
  );
}

/* ─────────────────────────── Marketplace search ─────────────────────────── */

function MarketSearch({ className }: { className?: string }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [scope, setScope] = useState(params.get('cat') ?? 'all');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const suggestions = q.trim() ? api.suggest(q) : [];

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const submit = (value = q) => {
    if (!value.trim()) return;
    dispatch({ type: 'search/record', query: value.trim() });
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(value.trim())}${scope !== 'all' ? `&cat=${scope}` : ''}`);
  };

  const kindLabel = { product: 'Product', brand: 'Brand', category: 'Category', vendor: 'Seller', query: 'Search' };

  return (
    <form
      ref={ref}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className={cx('relative flex-1 min-w-0', className)}
      role="search"
    >
      <div className="flex h-10 rounded-lg overflow-hidden bg-white ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-ember-400">
        <select
          value={scope} onChange={(e) => setScope(e.target.value)}
          aria-label="Search category"
          className="hidden sm:block h-full bg-ink-100 border-r border-ink-200 px-2.5 text-xs text-ink-700 max-w-[132px] cursor-pointer focus:outline-none"
        >
          <option value="all">All categories</option>
          {api.topCategories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search 4,800+ products across 12 sellers"
          className="flex-1 min-w-0 h-full px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="grid place-items-center w-11 bg-ember-500 hover:bg-ember-600 text-white transition-colors">
          <Search className="size-[18px]" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg border border-ink-200 bg-white shadow-pop overflow-hidden animate-slide-up">
          {suggestions.length > 0 ? (
            <ul className="max-h-[420px] overflow-y-auto mf-scroll py-1">
              {suggestions.map((s, i) => (
                <li key={`${s.kind}-${i}`}>
                  <Link
                    to={s.href} onClick={() => { setOpen(false); dispatch({ type: 'search/record', query: s.label }); }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-ink-50 transition-colors"
                  >
                    <span className="grid place-items-center size-7 rounded-md bg-ink-100 text-ink-500 shrink-0">
                      {s.kind === 'product' ? <Package className="size-3.5" /> : s.kind === 'category' ? <LayoutGrid className="size-3.5" /> : s.kind === 'vendor' ? <Store className="size-3.5" /> : s.kind === 'brand' ? <Tags className="size-3.5" /> : <Search className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-ink-900 truncate">{s.label}</span>
                      {s.sublabel && <span className="block text-2xs text-ink-500 truncate">{s.sublabel}</span>}
                    </span>
                    <Badge tone="neutral">{kindLabel[s.kind]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Recent searches</p>
                <ul className="space-y-0.5">
                  {state.recentSearches.slice(0, 4).map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => { setQ(r); submit(r); }} className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-[13px] text-ink-700 hover:bg-ink-50 text-left">
                        <FileClock className="size-3.5 text-ink-400 shrink-0" /><span className="truncate">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Trending now</p>
                <ul className="space-y-0.5">
                  {api.popularSearches.slice(0, 5).map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => { setQ(r); submit(r); }} className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-[13px] text-ink-700 hover:bg-ink-50 text-left">
                        <TrendingUp className="size-3.5 text-ember-500 shrink-0" /><span className="truncate">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

/* ───────────────────────────── Customer shell ───────────────────────────── */

function DeliveryPin() {
  const { state, dispatch } = useApp();
  const [value, setValue] = useState(state.deliveryPin);
  return (
    <Dropdown
      width="w-72"
      trigger={
        <button className="hidden md:flex items-start gap-1.5 rounded-md px-2 h-9 text-white/90 hover:bg-white/10 transition-colors text-left">
          <MapPin className="size-4 mt-0.5 shrink-0" />
          <span className="leading-tight">
            <span className="block text-[10px] text-white/60">Deliver to</span>
            <span className="block text-xs font-semibold mf-tnum">{state.deliveryPin}</span>
          </span>
          <ChevronDown className="size-3 mt-1 opacity-60" />
        </button>
      }
    >
      {(close) => (
        <div className="p-3">
          <p className="text-[13px] font-semibold text-ink-950">Choose your location</p>
          <p className="text-xs text-ink-500 mt-1 leading-relaxed">Delivery estimates, COD eligibility and same-day slots depend on your pin code.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-9 flex-1 rounded-md border border-ink-300 px-3 text-sm mf-tnum focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 focus:outline-none"
              placeholder="560085"
            />
            <Button size="sm" variant="primary" onClick={() => { dispatch({ type: 'pin', pin: value || '560085' }); close(); }}>Apply</Button>
          </div>
          <div className="mt-3 pt-3 border-t border-ink-100">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Saved addresses</p>
            {api.addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => { dispatch({ type: 'pin', pin: a.postalCode }); close(); }}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-ink-50"
              >
                <Badge tone="neutral">{a.label}</Badge>
                <span className="text-xs text-ink-700 truncate">{a.line1}, {a.city} {a.postalCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Dropdown>
  );
}

export function CustomerLayout() {
  const { cart, state, toasts, dismissToast } = useApp();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const wishCount = state.wishlists.reduce((s, w) => s + w.items.length, 0);

  useEffect(() => { window.scrollTo({ top: 0 }); setMenuOpen(false); }, [location.pathname]);

  const navLink = 'flex items-center gap-1.5 rounded-md px-2 h-9 text-white/90 hover:bg-white/10 transition-colors text-[13px] font-medium';

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <header className="sticky top-0 z-50 bg-ink-950 text-white no-print">
        <div className="mx-auto max-w-[1560px] px-3 lg:px-5">
          <div className="flex items-center gap-2 h-[60px]">
            <button className="lg:hidden grid place-items-center size-9 rounded-md hover:bg-white/10" aria-label="Menu" onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" />
            </button>
            <Link to="/" className="shrink-0 mr-1"><Logo /></Link>
            <DeliveryPin />
            <MarketSearch className="mx-1 max-w-3xl" />
            <div className="flex items-center gap-0.5 shrink-0">
              <div className="hidden lg:block"><WorkspaceSwitcher dark /></div>
              <NotificationBell audience="customer" dark />
              <Link to="/orders" className={cx(navLink, 'hidden sm:flex')}>
                <Package className="size-[18px]" /><span className="hidden xl:inline">Orders</span>
              </Link>
              <Link to="/wishlist" className={cx(navLink, 'relative hidden sm:flex')}>
                <Heart className="size-[18px]" /><span className="hidden xl:inline">Wishlist</span>
                {wishCount > 0 && <span className="absolute -top-0.5 right-0 xl:right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-ember-500 text-[9px] font-bold grid place-items-center mf-tnum">{wishCount}</span>}
              </Link>
              <Dropdown
                width="w-60"
                trigger={
                  <button className={navLink}>
                    <Avatar name={api.currentCustomer.name} seed={api.currentCustomer.id} size="xs" />
                    <span className="hidden xl:inline max-w-[90px] truncate">{api.currentCustomer.name.split(' ')[0]}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                }
              >
                <>
                  <div className="px-3 py-2.5 border-b border-ink-100">
                    <p className="text-[13px] font-semibold text-ink-950">{api.currentCustomer.name}</p>
                    <p className="text-xs text-ink-500 truncate">{api.currentCustomer.email}</p>
                    <Badge tone="forge" className="mt-1.5">{titleCase(api.currentCustomer.tier)} member</Badge>
                  </div>
                  <MenuItem to="/account" icon={<User className="size-4" />}>Your account</MenuItem>
                  <MenuItem to="/orders" icon={<Package className="size-4" />}>Your orders</MenuItem>
                  <MenuItem to="/account/returns" icon={<RotateCcw className="size-4" />}>Returns & refunds</MenuItem>
                  <MenuItem to="/wishlist" icon={<Heart className="size-4" />}>Wishlists</MenuItem>
                  <MenuItem to="/account/coupons" icon={<Percent className="size-4" />}>Coupons & gift cards</MenuItem>
                  <MenuDivider />
                  <MenuItem to="/account/security" icon={<ShieldCheck className="size-4" />}>Login & security</MenuItem>
                  <MenuItem to="/help" icon={<CircleHelp className="size-4" />}>Help centre</MenuItem>
                  <MenuDivider />
                  <MenuItem to="/vendor/onboarding" icon={<Store className="size-4" />}>Start selling</MenuItem>
                  <MenuItem icon={<LogOut className="size-4" />}>Sign out</MenuItem>
                </>
              </Dropdown>
              <Link to="/cart" className={cx(navLink, 'relative pr-2.5')}>
                <ShoppingCart className="size-[19px]" />
                <span className="hidden xl:inline">Cart</span>
                {cart.itemCount > 0 && (
                  <span className="absolute -top-0.5 right-0 xl:right-1 min-w-[16px] h-4 px-1 rounded-full bg-ember-500 text-[10px] font-bold grid place-items-center mf-tnum">
                    {cart.itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <nav className="hidden lg:block border-t border-white/10 bg-ink-900">
          <div className="mx-auto max-w-[1560px] px-5 flex items-center gap-1 h-9 overflow-x-auto no-scrollbar">
            <Link to="/categories" className="flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-semibold text-white hover:bg-white/10">
              <LayoutGrid className="size-3.5" /> All categories
            </Link>
            {api.topCategories.map((c) => (
              <NavLink
                key={c.id} to={`/c/${c.slug}`}
                className={({ isActive }) => cx('rounded px-2 py-1 text-[13px] whitespace-nowrap transition-colors', isActive ? 'bg-white/15 text-white font-medium' : 'text-white/80 hover:bg-white/10')}
              >
                {c.name}
              </NavLink>
            ))}
            <Link to="/deals" className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-semibold text-ember-300 hover:bg-white/10 whitespace-nowrap">
              <Sparkles className="size-3.5" /> Today's deals
            </Link>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[300px] bg-white flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-4 h-14 bg-ink-950">
              <Logo />
              <IconButton label="Close" onClick={() => setMenuOpen(false)} className="text-white hover:bg-white/10"><X className="size-5" /></IconButton>
            </div>
            <div className="flex-1 overflow-y-auto mf-scroll py-2">
              <MenuLabel>Shop by category</MenuLabel>
              {api.topCategories.map((c) => (
                <MenuItem key={c.id} to={`/c/${c.slug}`} icon={<ChevronRight className="size-4" />}>{c.name}</MenuItem>
              ))}
              <MenuDivider />
              <MenuLabel>Your account</MenuLabel>
              <MenuItem to="/account" icon={<User className="size-4" />}>Account</MenuItem>
              <MenuItem to="/orders" icon={<Package className="size-4" />}>Orders</MenuItem>
              <MenuItem to="/wishlist" icon={<Heart className="size-4" />}>Wishlist</MenuItem>
              <MenuItem to="/help" icon={<CircleHelp className="size-4" />}>Help centre</MenuItem>
              <MenuDivider />
              <MenuLabel>Workspaces</MenuLabel>
              <MenuItem to="/vendor" icon={<Store className="size-4" />}>Vendor portal</MenuItem>
              <MenuItem to="/admin" icon={<ShieldCheck className="size-4" />}>Admin console</MenuItem>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>

      <footer className="bg-ink-950 text-white/70 no-print">
        <div className="mx-auto max-w-[1560px] px-5 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-3 text-xs leading-relaxed">
              MarketForge is a multi-vendor marketplace connecting 12,400 independent sellers with buyers across India.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge tone="forge">ISO 27001</Badge>
              <Badge tone="forge">PCI DSS</Badge>
            </div>
          </div>
          {[
            { title: 'Shop', links: [['All categories', '/categories'], ["Today's deals", '/deals'], ['Best sellers', '/search?sort=best_selling'], ['New arrivals', '/search?sort=newest'], ['Brands', '/categories']] },
            { title: 'Your account', links: [['Account', '/account'], ['Orders', '/orders'], ['Returns', '/account/returns'], ['Wishlist', '/wishlist'], ['Addresses', '/account/addresses']] },
            { title: 'Sell', links: [['Start selling', '/vendor/onboarding'], ['Vendor portal', '/vendor'], ['Commission rates', '/help'], ['Seller policies', '/help'], ['Fulfilment', '/help']] },
            { title: 'Support', links: [['Help centre', '/help'], ['Contact support', '/help/contact'], ['Track an order', '/orders'], ['Shipping & delivery', '/help'], ['Admin console', '/admin']] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-semibold text-white mb-2.5">{col.title}</p>
              <ul className="space-y-1.5">
                {col.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-xs hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1560px] px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-2xs">
            <p>© 2026 MarketForge Commerce Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-4">
              <span>Terms</span><span>Privacy</span><span>Cookies</span><span>Interest-based ads</span>
            </p>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-ink-200 no-print">
        <div className="grid grid-cols-5">
          {[
            { to: '/', label: 'Home', icon: <Home className="size-[19px]" /> },
            { to: '/categories', label: 'Categories', icon: <LayoutGrid className="size-[19px]" /> },
            { to: '/wishlist', label: 'Wishlist', icon: <Heart className="size-[19px]" />, badge: wishCount },
            { to: '/cart', label: 'Cart', icon: <ShoppingCart className="size-[19px]" />, badge: cart.itemCount },
            { to: '/account', label: 'Account', icon: <User className="size-[19px]" /> },
          ].map((t) => (
            <NavLink
              key={t.to} to={t.to} end={t.to === '/'}
              className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors', isActive ? 'text-forge-700' : 'text-ink-500')}
            >
              {t.icon}
              {t.label}
              {!!t.badge && <span className="absolute top-1 right-[calc(50%-16px)] min-w-[15px] h-[15px] px-1 rounded-full bg-ember-500 text-white text-[9px] font-bold grid place-items-center mf-tnum">{t.badge}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/* ────────────────────────── Vendor / admin shell ────────────────────────── */

interface NavGroup { label?: string; items: { to: string; label: string; icon: ReactNode; badge?: number; end?: boolean }[] }

function vendorNav(): NavGroup[] {
  const vendorId = 'ven_techworld';
  const newOrders = api.vendorOrders(vendorId).filter((g) => g.items.some((i) => i.vendorStatus === 'new')).length;
  const lowStock = api.vendorInventory(vendorId).filter((i) => api.alertTypeFor(i) === 'low_stock' || api.alertTypeFor(i) === 'out_of_stock').length;
  return [
    { items: [{ to: '/vendor', label: 'Dashboard', icon: <Gauge className="size-[17px]" />, end: true }] },
    {
      label: 'Catalogue',
      items: [
        { to: '/vendor/products', label: 'Products', icon: <Package className="size-[17px]" /> },
        { to: '/vendor/inventory', label: 'Inventory', icon: <Boxes className="size-[17px]" />, badge: lowStock },
      ],
    },
    {
      label: 'Selling',
      items: [
        { to: '/vendor/orders', label: 'Orders', icon: <ClipboardList className="size-[17px]" />, badge: newOrders },
        { to: '/vendor/customers', label: 'Customers', icon: <Users className="size-[17px]" /> },
        { to: '/vendor/reviews', label: 'Reviews', icon: <Star className="size-[17px]" /> },
        { to: '/vendor/promotions', label: 'Promotions', icon: <Percent className="size-[17px]" /> },
      ],
    },
    {
      label: 'Business',
      items: [
        { to: '/vendor/payouts', label: 'Payouts', icon: <Wallet className="size-[17px]" /> },
        { to: '/vendor/analytics', label: 'Analytics', icon: <BarChart3 className="size-[17px]" /> },
        { to: '/vendor/store', label: 'Store', icon: <Store className="size-[17px]" /> },
        { to: '/vendor/settings', label: 'Settings', icon: <Settings className="size-[17px]" /> },
      ],
    },
  ];
}

function adminNav(): NavGroup[] {
  const pendingVendors = api.vendors.filter((v) => ['submitted', 'under_review'].includes(v.status)).length;
  const pendingProducts = api.products.filter((p) => p.status === 'pending_approval').length;
  const openDisputes = api.disputes.filter((d) => !['resolved', 'closed'].includes(d.status)).length;
  const openTickets = api.supportTickets.filter((t) => ['open', 'pending'].includes(t.status)).length;
  return [
    { items: [{ to: '/admin', label: 'Dashboard', icon: <Gauge className="size-[17px]" />, end: true }] },
    {
      label: 'Marketplace',
      items: [
        { to: '/admin/vendors', label: 'Vendors', icon: <Building2 className="size-[17px]" />, badge: pendingVendors },
        { to: '/admin/customers', label: 'Customers', icon: <Users className="size-[17px]" /> },
        { to: '/admin/products', label: 'Products', icon: <Package className="size-[17px]" />, badge: pendingProducts },
        { to: '/admin/categories', label: 'Categories', icon: <LayoutGrid className="size-[17px]" /> },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/admin/orders', label: 'Orders', icon: <ClipboardList className="size-[17px]" /> },
        { to: '/admin/returns', label: 'Returns', icon: <RotateCcw className="size-[17px]" /> },
        { to: '/admin/shipping', label: 'Shipping', icon: <Truck className="size-[17px]" /> },
      ],
    },
    {
      label: 'Finance',
      items: [
        { to: '/admin/payments', label: 'Payments', icon: <Receipt className="size-[17px]" /> },
        { to: '/admin/payouts', label: 'Payouts', icon: <Wallet className="size-[17px]" /> },
        { to: '/admin/commissions', label: 'Commissions', icon: <Percent className="size-[17px]" /> },
        { to: '/admin/promotions', label: 'Promotions', icon: <Tags className="size-[17px]" /> },
      ],
    },
    {
      label: 'Service',
      items: [
        { to: '/admin/disputes', label: 'Disputes', icon: <ShieldCheck className="size-[17px]" />, badge: openDisputes },
        { to: '/admin/support', label: 'Support', icon: <LifeBuoy className="size-[17px]" />, badge: openTickets },
      ],
    },
    {
      label: 'Insight',
      items: [
        { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="size-[17px]" /> },
        { to: '/admin/audit', label: 'Audit logs', icon: <ScrollText className="size-[17px]" /> },
        { to: '/admin/settings', label: 'Settings', icon: <Settings className="size-[17px]" /> },
      ],
    },
  ];
}

export function PortalLayout({ kind }: { kind: 'vendor' | 'admin' }) {
  const { toasts, dismissToast, role, setRole } = useApp();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = kind === 'vendor' ? vendorNav() : adminNav();
  const vendor = api.vendorById.get('ven_techworld')!;
  const user = kind === 'vendor' ? api.users[1] : api.users.find((u) => u.role === role) ?? api.users[2];

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (kind === 'vendor' && role !== 'vendor') setRole('vendor');
    if (kind === 'admin' && (role === 'customer' || role === 'vendor')) setRole('admin');
  }, [kind, role, setRole]);

  const sidebar = (
    <div className={cx('flex flex-col h-full bg-ink-950 text-white/80', collapsed ? 'w-[68px]' : 'w-[236px]')}>
      <div className={cx('flex items-center h-14 shrink-0 border-b border-white/10', collapsed ? 'justify-center px-2' : 'px-4 gap-2')}>
        <Link to={kind === 'vendor' ? '/vendor' : '/admin'}><Logo compact={collapsed} /></Link>
      </div>

      <div className={cx('border-b border-white/10 py-3', collapsed ? 'px-2' : 'px-3')}>
        {kind === 'vendor' ? (
          collapsed ? (
            <span className="grid place-items-center size-9 rounded-md text-white font-bold text-xs mx-auto" style={{ background: vendor.tint }}>TW</span>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2">
              <span className="grid place-items-center size-8 rounded-md text-white font-bold text-xs shrink-0" style={{ background: vendor.tint }}>TW</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{vendor.name}</p>
                <p className="text-2xs text-forge-300">Seller ID {vendor.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
          )
        ) : (
          collapsed ? (
            <span className="grid place-items-center size-9 rounded-md bg-forge-700 text-white mx-auto"><ShieldCheck className="size-4" /></span>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2">
              <span className="grid place-items-center size-8 rounded-md bg-forge-700 shrink-0"><ShieldCheck className="size-4" /></span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">Admin Console</p>
                <p className="text-2xs text-forge-300">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          )
        )}
      </div>

      <nav className="flex-1 overflow-y-auto mf-scroll py-2 px-2">
        {groups.map((g, gi) => (
          <div key={g.label ?? gi} className="mb-1">
            {g.label && !collapsed && (
              <p className="px-2 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{g.label}</p>
            )}
            {g.label && collapsed && gi > 0 && <div className="my-2 mx-2 h-px bg-white/10" />}
            {g.items.map((item) => (
              <NavLink
                key={item.to} to={item.to} end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => cx(
                  'group flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors mb-0.5',
                  collapsed ? 'justify-center h-9' : 'px-2.5 h-9',
                  isActive ? 'bg-forge-700/90 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!!item.badge && (
                  <span className={cx('rounded-full bg-ember-500 text-white text-[10px] font-bold mf-tnum grid place-items-center',
                    collapsed ? 'absolute translate-x-3 -translate-y-2.5 size-4' : 'min-w-[18px] h-[18px] px-1')}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <Link to="/" className={cx('flex items-center gap-2.5 rounded-md text-[13px] text-white/70 hover:bg-white/10 hover:text-white transition-colors', collapsed ? 'justify-center h-9' : 'px-2.5 h-9')} title="Back to storefront">
          <ShoppingCart className="size-[17px] shrink-0" />
          {!collapsed && 'Back to storefront'}
        </Link>
        <button onClick={() => setCollapsed((c) => !c)} className={cx('hidden lg:flex items-center gap-2.5 rounded-md w-full text-[13px] text-white/50 hover:bg-white/10 hover:text-white transition-colors', collapsed ? 'justify-center h-9' : 'px-2.5 h-9')}>
          {collapsed ? <PanelLeft className="size-[17px]" /> : <><PanelLeftClose className="size-[17px]" /> Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-ink-50">
      <aside className="hidden lg:block sticky top-0 h-screen shrink-0 no-print">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-in-left">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-ink-200/80 no-print">
          <div className="flex items-center gap-2 h-14 px-4 lg:px-5">
            <button className="lg:hidden grid place-items-center size-9 rounded-md hover:bg-ink-100" aria-label="Menu" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5 text-ink-700" />
            </button>
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
                <input
                  placeholder={kind === 'vendor' ? 'Search products, orders, SKUs…' : 'Search vendors, orders, products…'}
                  className="h-9 w-full rounded-md border border-ink-300 bg-ink-50/60 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:bg-white focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 focus:outline-none"
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {kind === 'vendor' && (
                <Badge tone="green" dot className="hidden md:inline-flex mr-1">Store live</Badge>
              )}
              <WorkspaceSwitcher />
              <NotificationBell audience={kind} />
              <Dropdown
                width="w-64"
                trigger={
                  <button className="flex items-center gap-2 rounded-md px-1.5 h-9 hover:bg-ink-100 transition-colors">
                    <Avatar name={user.name} seed={user.avatarSeed} size="sm" />
                    <span className="hidden md:block text-left leading-tight">
                      <span className="block text-[13px] font-medium text-ink-900">{user.name}</span>
                      <span className="block text-2xs text-ink-500">{ROLE_LABELS[user.role]}</span>
                    </span>
                    <ChevronDown className="size-3.5 text-ink-400" />
                  </button>
                }
              >
                <>
                  <div className="px-3 py-2.5 border-b border-ink-100">
                    <p className="text-[13px] font-semibold text-ink-950">{user.name}</p>
                    <p className="text-xs text-ink-500 truncate">{user.email}</p>
                    {user.jobTitle && <p className="text-2xs text-ink-400 mt-1">{user.jobTitle}</p>}
                  </div>
                  <MenuItem icon={<User className="size-4" />} to={kind === 'vendor' ? '/vendor/settings' : '/admin/settings'}>Profile & preferences</MenuItem>
                  <MenuItem icon={<ShieldCheck className="size-4" />} to={kind === 'vendor' ? '/vendor/settings' : '/admin/settings'}>Security</MenuItem>
                  <MenuItem icon={<Mail className="size-4" />} to={kind === 'vendor' ? '/vendor/settings' : '/admin/settings'}>Notification preferences</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<LogOut className="size-4" />}>Sign out</MenuItem>
                </>
              </Dropdown>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>

        <footer className="border-t border-ink-200/80 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-2xs text-ink-500 no-print">
          <p>MarketForge {kind === 'vendor' ? 'Vendor Portal' : 'Admin Console'} · v4.2.1</p>
          <p className="flex items-center gap-3">
            <span>All systems operational</span>
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Data as of {formatDateShort(new Date().toISOString())}</span>
          </p>
        </footer>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/* ──────────────────────── Shared portal page pieces ─────────────────────── */

export function PortalPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('px-4 lg:px-7 py-5', className)}>{children}</div>;
}

export function MoneyLine({ label, value, tone, bold }: { label: string; value: number | string; tone?: 'credit' | 'debit' | 'total'; bold?: boolean }) {
  return (
    <div className={cx('flex items-center justify-between gap-4 py-1.5', bold && 'border-t border-ink-200 pt-2.5 mt-1')}>
      <span className={cx('text-[13px]', bold ? 'font-semibold text-ink-950' : 'text-ink-600')}>{label}</span>
      <span className={cx('mf-tnum text-[13px]',
        bold ? 'font-bold text-ink-950 text-[15px]' : tone === 'credit' ? 'text-emerald-700 font-medium' : tone === 'debit' ? 'text-red-600 font-medium' : 'text-ink-900 font-medium')}>
        {typeof value === 'number' ? `${tone === 'debit' ? '−' : ''}${money(Math.abs(value))}` : value}
      </span>
    </div>
  );
}
