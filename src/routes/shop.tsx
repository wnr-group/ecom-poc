import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Boxes, Calendar, CircleCheck, CreditCard, Download, Heart, Info,
  LifeBuoy, Lock, MapPin, MessageSquare, Package, Percent, Printer, RotateCcw, Search, ShieldCheck,
  ShoppingCart, Sparkles, Star, Store as StoreIcon, Ticket, Trash2, Truck, User, Wallet, X, Plus,
  ChevronRight, CircleHelp, Send, Smartphone, Building, Banknote, Gift, ClipboardList, Settings,
} from 'lucide-react';
import * as api from '../lib/api';
import { useApp, type CartLine } from '../lib/store';
import type { Address, Order, OrderItem, Return } from '../lib/types';
import { mediaImage, productImage } from '../lib/images';
import {
  deliveryPromise, formatDate, formatDateTime, money, relativeTime, titleCase,
} from '../lib/format';
import {
  Alert, Avatar, Badge, Breadcrumbs, Button, Checkbox, ConfirmDialog, DataTable, DefinitionList,
  EmptyState, Field, Input, Modal, Panel, PanelHeader, Price, Radio,
  Rating, Select, StatusBadge, Stepper, StatCard, Switch, Tabs, Textarea, Timeline,
  cx,
} from '../components/ui';
import { ProductCard, ProductImage, Shelf } from '../components/marketplace';
import { WriteReviewModal } from './customer';

const Wrap = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx('mx-auto max-w-[1560px] px-3 sm:px-5', className)}>{children}</div>
);

const Narrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx('mx-auto max-w-6xl px-3 sm:px-5', className)}>{children}</div>
);

/* ─────────────────────────────── Cart page ──────────────────────────────── */

function CartLineRow({ line, saved }: { line: CartLine; saved?: boolean }) {
  const { dispatch, toast } = useApp();
  const vendor = api.vendorById.get(line.product.vendorId);
  const promise = new Date(Date.now() + line.deliveryDays * 86400000).toISOString();

  return (
    <div className="flex gap-3 sm:gap-4 py-4">
      <Link to={`/p/${line.product.slug}`} className="shrink-0">
        <ProductImage product={line.product} size={200} className="size-[88px] sm:size-28 rounded-md border border-ink-200" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/p/${line.product.slug}`} className="text-[14px] font-semibold text-ink-950 hover:text-forge-800 leading-snug line-clamp-2">
              {line.product.title}
            </Link>
            {line.variantLabel && <p className="text-xs text-ink-500 mt-0.5">{line.variantLabel}</p>}
            <p className="text-xs text-ink-500 mt-0.5">
              Sold by <Link to={`/store/${vendor?.slug}`} className="mf-link">{vendor?.name}</Link>
            </p>
            <p className={cx('text-xs mt-1 font-medium', line.stock === 0 ? 'text-red-600' : line.stock <= 8 ? 'text-amber-600' : 'text-emerald-700')}>
              {line.stock === 0 ? 'Out of stock' : line.stock <= 8 ? `Only ${line.stock} left` : 'In stock'}
            </p>
            <p className="text-xs text-ink-600 mt-1 flex items-center gap-1.5">
              <Truck className="size-3.5 text-ink-400" />
              {line.product.freeShipping ? 'Free delivery' : 'Delivery ₹49'} · arrives {deliveryPromise(promise)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <Price value={line.lineTotal} mrp={line.mrp * line.item.quantity} />
            {line.item.quantity > 1 && <p className="text-2xs text-ink-500 mt-0.5 mf-tnum">{money(line.unitPrice)} each</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!saved && (
            <div className="inline-flex items-center rounded-md border border-ink-300 h-8">
              <button
                onClick={() => dispatch({ type: 'cart/qty', itemId: line.item.id, quantity: line.item.quantity - 1 })}
                disabled={line.item.quantity <= 1}
                className="grid place-items-center w-8 h-full text-ink-600 hover:bg-ink-50 disabled:opacity-40 rounded-l-md"
                aria-label="Decrease quantity"
              >−</button>
              <span className="w-9 text-center text-[13px] font-semibold mf-tnum border-x border-ink-200 h-full leading-8">{line.item.quantity}</span>
              <button
                onClick={() => dispatch({ type: 'cart/qty', itemId: line.item.id, quantity: line.item.quantity + 1 })}
                className="grid place-items-center w-8 h-full text-ink-600 hover:bg-ink-50 rounded-r-md"
                aria-label="Increase quantity"
              >+</button>
            </div>
          )}
          {saved ? (
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'cart/move-to-cart', itemId: line.item.id })}>Move to cart</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'cart/save-later', itemId: line.item.id })}>Save for later</Button>
          )}
          <Button
            size="sm" variant="ghost" icon={<Trash2 className="size-3.5" />}
            onClick={() => { dispatch({ type: 'cart/remove', itemId: line.item.id }); toast({ title: 'Removed from cart', body: line.product.shortTitle, variant: 'info' }); }}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({ children }: { children?: React.ReactNode }) {
  const { cart, state, dispatch, toast } = useApp();
  const [code, setCode] = useState(state.couponCode ?? '');

  return (
    <Panel className="p-4 lg:sticky lg:top-[116px]">
      <h2 className="text-[15px] font-bold text-ink-950">Order summary</h2>
      <dl className="mt-3 space-y-2 text-[13px]">
        <div className="flex justify-between"><dt className="text-ink-600">Items ({cart.itemCount})</dt><dd className="mf-tnum text-ink-900">{money(cart.mrpTotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-600">Product discounts</dt><dd className="mf-tnum text-emerald-700">−{money(cart.discount)}</dd></div>
        {cart.couponDiscount > 0 && (
          <div className="flex justify-between"><dt className="text-ink-600">Coupon {cart.couponCode}</dt><dd className="mf-tnum text-emerald-700">−{money(cart.couponDiscount)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd className="mf-tnum text-ink-900">{cart.shipping === 0 ? <span className="text-emerald-700">Free</span> : money(cart.shipping)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-600">Tax (included)</dt><dd className="mf-tnum text-ink-500">{money(cart.tax)}</dd></div>
        {cart.giftCardApplied > 0 && (
          <div className="flex justify-between"><dt className="text-ink-600">Gift card</dt><dd className="mf-tnum text-emerald-700">−{money(cart.giftCardApplied)}</dd></div>
        )}
        <div className="flex justify-between pt-2.5 border-t border-ink-200">
          <dt className="text-[15px] font-bold text-ink-950">Order total</dt>
          <dd className="text-[17px] font-bold text-ink-950 mf-tnum">{money(cart.grandTotal)}</dd>
        </div>
      </dl>

      {cart.discount + cart.couponDiscount > 0 && (
        <p className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
          You save {money(cart.discount + cart.couponDiscount)} on this order
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-ink-100">
        <label className="mf-label">Coupon or gift card</label>
        <div className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FORGE10" className="uppercase" />
          <Button
            size="md" variant="secondary"
            onClick={() => {
              const coupon = api.couponByCode(code);
              const gift = api.giftCardByCode(code);
              if (gift) { dispatch({ type: 'giftcard', code }); toast({ title: 'Gift card applied', body: `Balance ${money(gift.balance)}`, variant: 'success' }); }
              else if (coupon) { dispatch({ type: 'coupon', code }); toast({ title: `Coupon ${coupon.code} applied`, body: coupon.description, variant: 'success' }); }
              else toast({ title: 'Invalid code', body: 'Check the code and try again.', variant: 'error' });
            }}
          >Apply</Button>
        </div>
        {cart.couponError && <p className="mt-1.5 text-xs text-red-600">{cart.couponError}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {api.coupons.filter((c) => c.status === 'active').slice(0, 3).map((c) => (
            <button
              key={c.id} onClick={() => { setCode(c.code); dispatch({ type: 'coupon', code: c.code }); }}
              className="rounded-md border border-dashed border-forge-300 bg-forge-50 px-2 py-1 text-2xs font-semibold text-forge-800 hover:bg-forge-100"
            >
              {c.code} · {c.discountType === 'percentage' ? `${c.discountAmount}% off` : c.discountType === 'fixed' ? `${money(c.discountAmount)} off` : 'Free shipping'}
            </button>
          ))}
        </div>
      </div>

      {children}

      <div className="mt-4 pt-3 border-t border-ink-100 space-y-1.5 text-2xs text-ink-500">
        <p className="flex items-center gap-1.5"><Lock className="size-3" /> Payments are encrypted and PCI DSS compliant</p>
        <p className="flex items-center gap-1.5"><ShieldCheck className="size-3" /> Buyer protection on every marketplace order</p>
      </div>
    </Panel>
  );
}

export function CartPage() {
  const { cart, savedLines } = useApp();
  const navigate = useNavigate();

  if (cart.lines.length === 0) {
    return (
      <Narrow className="py-8">
        <Panel>
          <EmptyState
            icon={<ShoppingCart className="size-5" />}
            title="Your cart is empty"
            body="Browse the marketplace or pick up where you left off — items in your wishlist are still saved."
            action={<Button variant="accent" to="/">Start shopping</Button>}
            secondary={<Button to="/wishlist">View wishlist</Button>}
          />
        </Panel>
        {savedLines.length > 0 && (
          <Panel className="mt-4">
            <PanelHeader title="Saved for later" subtitle={`${savedLines.length} items`} />
            <div className="px-4 divide-y divide-ink-100">
              {savedLines.map((l) => <CartLineRow key={l.item.id} line={l} saved />)}
            </div>
          </Panel>
        )}
        <div className="mt-4">
          <Shelf title="Recommended for you" products={api.homeShelves.recommended} />
        </div>
      </Narrow>
    );
  }

  return (
    <Wrap className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-ink-950">Shopping cart</h1>
          <p className="text-[13px] text-ink-500 mt-1">
            {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} from {cart.groups.length} seller{cart.groups.length > 1 ? 's' : ''} · items ship separately
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-3">
          {cart.groups.map((g) => (
            <Panel key={g.vendorId}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-ink-200/70 bg-ink-50/60">
                <div className="flex items-center gap-2 min-w-0">
                  <StoreIcon className="size-4 text-ink-400 shrink-0" />
                  <Link to={`/store/${api.vendorById.get(g.vendorId)?.slug}`} className="text-[13px] font-bold text-ink-950 hover:text-forge-800 truncate">
                    {g.vendorName}
                  </Link>
                  <Rating value={g.vendorRating} size="xs" />
                  {g.fulfilledByMarketForge && <Badge tone="forge" icon={<BadgeCheck className="size-3" />}>Fulfilled by MarketForge</Badge>}
                </div>
                <p className="text-xs text-ink-600">
                  {g.shipping === 0 ? <span className="text-emerald-700 font-medium">Free delivery</span> : `Delivery ${money(g.shipping)}`}
                  {' · '}arrives {deliveryPromise(new Date(Date.now() + g.deliveryDays * 86400000).toISOString())}
                </p>
              </div>
              <div className="px-4 divide-y divide-ink-100">
                {g.lines.map((l) => <CartLineRow key={l.item.id} line={l} />)}
              </div>
              <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/40 flex items-center justify-between">
                <span className="text-xs text-ink-500">{g.lines.length} item{g.lines.length > 1 ? 's' : ''} from this seller</span>
                <span className="text-[13px] font-semibold text-ink-950 mf-tnum">Subtotal {money(g.subtotal)}</span>
              </div>
            </Panel>
          ))}

          {savedLines.length > 0 && (
            <Panel>
              <PanelHeader title="Saved for later" subtitle={`${savedLines.length} item${savedLines.length > 1 ? 's' : ''}`} />
              <div className="px-4 divide-y divide-ink-100">
                {savedLines.map((l) => <CartLineRow key={l.item.id} line={l} saved />)}
              </div>
            </Panel>
          )}
        </div>

        <OrderSummaryCard>
          <Button variant="accent" size="lg" block className="mt-4" onClick={() => navigate('/checkout')} iconRight={<ArrowRight className="size-4" />}>
            Proceed to checkout
          </Button>
          <Button size="md" block className="mt-2" to="/">Continue shopping</Button>
        </OrderSummaryCard>
      </div>

      <div className="mt-5 space-y-4">
        <Shelf title="Frequently bought with your cart" products={api.homeShelves.trending} />
      </div>
    </Wrap>
  );
}

/* ─────────────────────────────── Checkout ───────────────────────────────── */

const CHECKOUT_STEPS = [
  { key: 'address', label: 'Delivery address' },
  { key: 'delivery', label: 'Delivery method' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

function AddressForm({ initial, onSave, onCancel }: { initial?: Address; onSave: (a: Address) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Address>(initial ?? {
    id: `adr_${Math.random().toString(36).slice(2, 8)}`,
    ownerId: api.currentCustomer.id, label: 'Home', fullName: api.currentCustomer.name,
    phone: api.currentCustomer.phone, line1: '', line2: '', city: '', state: '', postalCode: '',
    country: 'India', isDefault: false,
  });
  const set = (patch: Partial<Address>) => setForm({ ...form, ...patch });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required><Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} /></Field>
        <Field label="Phone number" required><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
      </div>
      <Field label="Address line 1" required hint="Flat, house number, building, company"><Input value={form.line1} onChange={(e) => set({ line1: e.target.value })} /></Field>
      <Field label="Address line 2" hint="Area, street, sector, village"><Input value={form.line2 ?? ''} onChange={(e) => set({ line2: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Pin code" required><Input value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} /></Field>
        <Field label="City" required><Input value={form.city} onChange={(e) => set({ city: e.target.value })} /></Field>
        <Field label="State" required><Input value={form.state} onChange={(e) => set({ state: e.target.value })} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Address type">
          <Select value={form.label} onChange={(e) => set({ label: e.target.value as Address['label'] })}>
            <option value="Home">Home (all day delivery)</option>
            <option value="Work">Work (delivery 9am–7pm)</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
        <Field label="Delivery instructions"><Input value={form.deliveryNotes ?? ''} onChange={(e) => set({ deliveryNotes: e.target.value })} placeholder="Leave with security" /></Field>
      </div>
      <Checkbox label="Make this my default delivery address" checked={form.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />
      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="sm" disabled={!form.fullName || !form.line1 || !form.city || !form.postalCode} onClick={() => onSave(form)}>Save address</Button>
        <Button size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { cart, state, dispatch, placeOrder, toast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(state.addresses.find((a) => a.isDefault)?.id ?? state.addresses[0]?.id);
  const [method, setMethod] = useState<Order['deliveryMethod']>('standard');
  const [payMethod, setPayMethod] = useState('pm_visa');
  const [adding, setAdding] = useState(false);
  const [gift, setGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [placing, setPlacing] = useState(false);

  const address = state.addresses.find((a) => a.id === addressId);
  const pm = api.paymentMethods.find((p) => p.id === payMethod);

  if (cart.lines.length === 0) {
    return (
      <Narrow className="py-10">
        <Panel>
          <EmptyState icon={<ShoppingCart className="size-5" />} title="Nothing to check out" body="Your cart is empty. Add something first." action={<Button variant="accent" to="/">Start shopping</Button>} />
        </Panel>
      </Narrow>
    );
  }

  const DELIVERY_OPTIONS: { key: Order['deliveryMethod']; label: string; sub: string; price: number }[] = [
    { key: 'standard', label: 'Standard delivery', sub: `Arrives ${deliveryPromise(new Date(Date.now() + 4 * 86400000).toISOString())} · free over ₹499`, price: cart.itemTotal >= 499 ? 0 : 49 },
    { key: 'express', label: 'Express 48 hours', sub: `Arrives ${deliveryPromise(new Date(Date.now() + 2 * 86400000).toISOString())} · priority handling`, price: 129 },
    { key: 'same_day', label: 'Same-day (metro)', sub: 'Order before 2pm for delivery tonight', price: 199 },
    { key: 'pickup', label: 'Collect from ForgePoint', sub: 'Ready in 2 days at Banashankari ForgePoint · free', price: 0 },
  ];
  const deliveryFee = DELIVERY_OPTIONS.find((d) => d.key === method)!.price;
  const total = cart.grandTotal - cart.shipping + deliveryFee;

  const confirm = () => {
    setPlacing(true);
    window.setTimeout(() => {
      const order = placeOrder({
        address: address!, deliveryMethod: method,
        paymentKind: pm!.kind, paymentLabel: `${pm!.label}${pm!.detail ? ` · ${pm!.detail}` : ''}`,
        summary: { ...cart, shipping: deliveryFee, grandTotal: total },
        giftMessage: gift ? giftMessage : undefined,
      });
      setPlacing(false);
      navigate(`/order-confirmed/${order.id}`);
    }, 900);
  };

  return (
    <Narrow className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink-950">Checkout</h1>
        <p className="text-[13px] text-ink-500 mf-tnum">{cart.itemCount} items · {money(total)}</p>
      </div>
      <div className="mt-3 rounded-lg border border-ink-200 bg-white px-3 py-2.5">
        <Stepper steps={CHECKOUT_STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-3">
          {/* Step 1 — address */}
          <Panel>
            <PanelHeader
              title="1 · Delivery address" icon={<MapPin className="size-4" />}
              actions={step !== 0 && address ? <Button size="xs" variant="link" onClick={() => setStep(0)}>Change</Button> : undefined}
            />
            {step === 0 ? (
              <div className="p-4 space-y-2.5">
                {state.addresses.map((a) => (
                  <Radio
                    key={a.id} name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)}
                    label={<span className="flex items-center gap-2">{a.fullName} <Badge tone="neutral">{a.label}</Badge>{a.isDefault && <Badge tone="forge">Default</Badge>}</span>}
                    sublabel={<>{a.line1}, {a.line2 ? `${a.line2}, ` : ''}{a.city}, {a.state} {a.postalCode} · {a.phone}{a.deliveryNotes ? <><br /><span className="text-ink-400">Note: {a.deliveryNotes}</span></> : null}</>}
                  />
                ))}
                {adding ? (
                  <div className="rounded-lg border border-ink-200 p-4">
                    <p className="text-[13px] font-semibold text-ink-950 mb-3">Add a new address</p>
                    <AddressForm
                      onSave={(a) => { dispatch({ type: 'address/save', address: a }); setAddressId(a.id); setAdding(false); toast({ title: 'Address saved', variant: 'success' }); }}
                      onCancel={() => setAdding(false)}
                    />
                  </div>
                ) : (
                  <button onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-3 text-[13px] font-medium text-forge-700 hover:border-forge-400 hover:bg-forge-50/50 transition-colors">
                    <Plus className="size-4" /> Add a new address
                  </button>
                )}
                <div className="pt-1">
                  <Button variant="primary" onClick={() => setStep(1)} disabled={!address}>Deliver to this address</Button>
                </div>
              </div>
            ) : address ? (
              <div className="px-4 py-3 text-[13px] text-ink-700">
                <span className="font-semibold text-ink-950">{address.fullName}</span> · {address.line1}, {address.city}, {address.state} {address.postalCode}
              </div>
            ) : null}
          </Panel>

          {/* Step 2 — delivery */}
          <Panel>
            <PanelHeader
              title="2 · Delivery method" icon={<Truck className="size-4" />}
              actions={step > 1 ? <Button size="xs" variant="link" onClick={() => setStep(1)}>Change</Button> : undefined}
            />
            {step === 1 ? (
              <div className="p-4 space-y-2.5">
                {DELIVERY_OPTIONS.map((d) => (
                  <Radio
                    key={d.key} name="delivery" checked={method === d.key} onChange={() => setMethod(d.key)}
                    label={d.label} sublabel={d.sub} right={d.price === 0 ? 'Free' : money(d.price)}
                  />
                ))}
                <Alert tone="info" className="!mt-3">
                  Your order ships from {cart.groups.length} seller{cart.groups.length > 1 ? 's' : ''}, so items may arrive in separate parcels on different days.
                </Alert>
                <div className="pt-1"><Button variant="primary" onClick={() => setStep(2)}>Continue to payment</Button></div>
              </div>
            ) : step > 1 ? (
              <div className="px-4 py-3 text-[13px] text-ink-700">
                {DELIVERY_OPTIONS.find((d) => d.key === method)!.label} · {deliveryFee === 0 ? 'Free' : money(deliveryFee)}
              </div>
            ) : null}
          </Panel>

          {/* Step 3 — payment */}
          <Panel>
            <PanelHeader
              title="3 · Payment method" icon={<CreditCard className="size-4" />}
              actions={step > 2 ? <Button size="xs" variant="link" onClick={() => setStep(2)}>Change</Button> : undefined}
            />
            {step === 2 ? (
              <div className="p-4 space-y-2.5">
                {api.paymentMethods.map((p) => (
                  <Radio
                    key={p.id} name="payment" checked={payMethod === p.id} onChange={() => setPayMethod(p.id)}
                    label={
                      <span className="flex items-center gap-2">
                        {p.kind === 'card' ? <CreditCard className="size-4 text-ink-400" /> : p.kind === 'upi' ? <Smartphone className="size-4 text-ink-400" /> : p.kind === 'netbanking' ? <Building className="size-4 text-ink-400" /> : p.kind === 'wallet' ? <Wallet className="size-4 text-ink-400" /> : <Banknote className="size-4 text-ink-400" />}
                        {p.label}
                        {p.brand && <Badge tone="neutral">{p.brand}</Badge>}
                      </span>
                    }
                    sublabel={p.expiry ? `${p.detail} · expires ${p.expiry}` : p.detail}
                  />
                ))}
                {pm?.kind === 'card' && (
                  <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3">
                    <p className="text-[13px] font-semibold text-ink-950 flex items-center gap-1.5"><Percent className="size-3.5" /> EMI available on this card</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {[3, 6, 12].map((m) => (
                        <div key={m} className="rounded-md border border-ink-200 bg-white px-2.5 py-2">
                          <p className="text-2xs text-ink-500">{m} months</p>
                          <p className="text-[13px] font-bold text-ink-950 mf-tnum">{money(Math.round(total / m))}/mo</p>
                          <p className="text-2xs text-emerald-700">{m === 3 ? 'No cost EMI' : '14% p.a.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pm?.kind === 'cod' && (
                  <Alert tone="warning" title="Cash on Delivery">
                    A ₹0 handling fee applies on this order. Please keep exact change ready — delivery agents may not carry change for amounts above ₹2,000.
                  </Alert>
                )}
                <div className="pt-1"><Button variant="primary" onClick={() => setStep(3)}>Review order</Button></div>
              </div>
            ) : step > 2 ? (
              <div className="px-4 py-3 text-[13px] text-ink-700">{pm?.label} · {pm?.detail}</div>
            ) : null}
          </Panel>

          {/* Step 4 — review */}
          {step === 3 && (
            <Panel>
              <PanelHeader title="4 · Review your order" icon={<ClipboardList className="size-4" />} />
              <div className="p-4 space-y-4">
                {cart.groups.map((g) => (
                  <div key={g.vendorId} className="rounded-lg border border-ink-200 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-ink-50/70 border-b border-ink-200">
                      <span className="text-[13px] font-semibold text-ink-950">{g.vendorName}</span>
                      <span className="text-xs text-ink-600">Arrives {deliveryPromise(new Date(Date.now() + g.deliveryDays * 86400000).toISOString())}</span>
                    </div>
                    <div className="divide-y divide-ink-100">
                      {g.lines.map((l) => (
                        <div key={l.item.id} className="flex items-center gap-3 px-3 py-2.5">
                          <ProductImage product={l.product} size={100} className="size-12 rounded border border-ink-200 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-ink-900 line-clamp-1">{l.product.title}</p>
                            <p className="text-2xs text-ink-500">{l.variantLabel ? `${l.variantLabel} · ` : ''}Qty {l.item.quantity}</p>
                          </div>
                          <span className="text-[13px] font-semibold text-ink-950 mf-tnum">{money(l.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <Switch checked={gift} onChange={setGift} label="This order is a gift" />
                  {gift && (
                    <Textarea className="mt-2" rows={2} value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Add a gift message (printed on the invoice-free packing slip)" maxLength={200} />
                  )}
                </div>

                <Alert tone="info" icon={<Info className="size-4" />}>
                  By placing this order you agree to MarketForge's terms of sale and each seller's return policy. Prices include GST.
                </Alert>

                <Button variant="accent" size="lg" block loading={placing} onClick={confirm}>
                  {placing ? 'Placing your order…' : `Place order · ${money(total)}`}
                </Button>
              </div>
            </Panel>
          )}
        </div>

        <Panel className="p-4 lg:sticky lg:top-[116px]">
          <h2 className="text-[15px] font-bold text-ink-950">Order summary</h2>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-ink-600">Items ({cart.itemCount})</dt><dd className="mf-tnum">{money(cart.mrpTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-600">Discounts</dt><dd className="mf-tnum text-emerald-700">−{money(cart.discount)}</dd></div>
            {cart.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-600">Coupon {cart.couponCode}</dt><dd className="mf-tnum text-emerald-700">−{money(cart.couponDiscount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd className="mf-tnum">{deliveryFee === 0 ? <span className="text-emerald-700">Free</span> : money(deliveryFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-600">Tax (included)</dt><dd className="mf-tnum text-ink-500">{money(cart.tax)}</dd></div>
            <div className="flex justify-between pt-2.5 border-t border-ink-200">
              <dt className="text-[15px] font-bold text-ink-950">Total payable</dt>
              <dd className="text-[17px] font-bold text-ink-950 mf-tnum">{money(total)}</dd>
            </div>
          </dl>
          <div className="mt-3 pt-3 border-t border-ink-100 space-y-1.5 text-2xs text-ink-500">
            <p className="flex items-center gap-1.5"><Lock className="size-3" /> 256-bit TLS · PCI DSS Level 1</p>
            <p className="flex items-center gap-1.5"><RotateCcw className="size-3" /> Returns handled by MarketForge</p>
          </div>
        </Panel>
      </div>
    </Narrow>
  );
}

export function OrderConfirmedPage() {
  const { id = '' } = useParams();
  const { state } = useApp();
  const order = state.orders.find((o) => o.id === id) ?? api.orderById.get(id);

  if (!order) {
    return (
      <Narrow className="py-16">
        <EmptyState icon={<Package className="size-5" />} title="Order not found" action={<Button variant="primary" to="/orders">View your orders</Button>} />
      </Narrow>
    );
  }

  return (
    <Narrow className="py-6">
      <Panel className="overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-6 text-center">
          <span className="grid place-items-center size-12 rounded-full bg-emerald-600 text-white mx-auto">
            <CircleCheck className="size-7" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-emerald-950">Order placed successfully</h1>
          <p className="mt-1 text-[13px] text-emerald-800">
            Order <span className="font-semibold mf-tnum">{order.number}</span> · A confirmation has been emailed to {api.currentCustomer.email}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="sm" to={`/orders/${order.id}`}>Track your order</Button>
            <Button size="sm" to="/orders">All orders</Button>
            <Button size="sm" variant="ghost" to="/">Continue shopping</Button>
          </div>
        </div>

        <div className="p-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Delivering to</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-950">{order.shippingAddress.fullName}</p>
            <p className="text-xs text-ink-600 leading-relaxed">
              {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Arriving by</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-950">{formatDate(order.promisedBy)}</p>
            <p className="text-xs text-ink-600">{titleCase(order.deliveryMethod)} delivery</p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Paid with</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-950">{order.payment.methodLabel}</p>
            <p className="text-xs text-ink-600 mf-tnum">{money(order.totals.grandTotal)} · {titleCase(order.payment.status)}</p>
          </div>
        </div>

        <div className="border-t border-ink-100 divide-y divide-ink-100">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 px-5 py-3">
              <img src={productImage(i.imageKind, i.tint, i.imageSeed, 100)} alt="" className="size-12 rounded border border-ink-200" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-900 line-clamp-1">{i.title}</p>
                <p className="text-2xs text-ink-500">{api.vendorById.get(i.vendorId)?.name} · Qty {i.quantity}</p>
              </div>
              <span className="text-[13px] font-semibold mf-tnum">{money(i.lineTotal)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4">
        <Shelf title="Customers also bought" products={api.homeShelves.bestSellers} />
      </div>
    </Narrow>
  );
}

/* ──────────────────────────────── Orders ────────────────────────────────── */

const ORDER_TABS = [
  { key: 'all', label: 'All orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned' },
];

export function OrdersPage() {
  const { state } = useApp();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = state.orders.filter((o) => {
    const matchTab =
      tab === 'all' ? true
      : tab === 'processing' ? ['pending', 'confirmed', 'processing', 'packed'].includes(o.status)
      : tab === 'shipped' ? ['shipped', 'out_for_delivery'].includes(o.status)
      : o.status === tab;
    const matchQuery = !query.trim() || o.number.toLowerCase().includes(query.toLowerCase())
      || o.items.some((i) => i.title.toLowerCase().includes(query.toLowerCase()));
    return matchTab && matchQuery;
  });

  const counts = (key: string) => state.orders.filter((o) =>
    key === 'all' ? true
    : key === 'processing' ? ['pending', 'confirmed', 'processing', 'packed'].includes(o.status)
    : key === 'shipped' ? ['shipped', 'out_for_delivery'].includes(o.status)
    : o.status === key).length;

  return (
    <Wrap className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Your account', to: '/account' }, { label: 'Orders' }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-ink-950">Your orders</h1>
          <p className="text-[13px] text-ink-500 mt-1">{state.orders.length} orders placed on MarketForge</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders by number or product"
            className="h-9 w-full rounded-md border border-ink-300 pl-9 pr-3 text-sm focus:border-forge-500 focus:ring-2 focus:ring-forge-500/20 focus:outline-none"
          />
        </div>
      </div>

      <Panel className="mt-4">
        <Tabs items={ORDER_TABS.map((t) => ({ ...t, count: counts(t.key) }))} value={tab} onChange={setTab} />
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="size-5" />}
            title={query ? 'No orders match your search' : `No ${tab === 'all' ? '' : tab} orders`}
            body={query ? 'Try a different order number or product name.' : 'When you place an order it will appear here with live tracking.'}
            action={<Button variant="primary" size="sm" to="/">Start shopping</Button>}
          />
        ) : (
          <div className="divide-y divide-ink-200/70">
            {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
        )}
      </Panel>
    </Wrap>
  );
}

function OrderRow({ order }: { order: Order }) {
  const currentStep = order.timeline.find((t) => t.state === 'current') ?? [...order.timeline].reverse().find((t) => t.state === 'done');
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 flex-1 min-w-0">
          {[
            ['Order placed', formatDate(order.placedAt)],
            ['Total', money(order.totals.grandTotal)],
            ['Ship to', order.shippingAddress.fullName],
            ['Order #', order.number],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-2xs text-ink-500">{k}</p>
              <p className="text-[13px] font-medium text-ink-900 mf-tnum truncate">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <Button size="sm" to={`/orders/${order.id}`}>View details</Button>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-ink-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-ink-50/70 border-b border-ink-200">
          <p className="text-[13px] font-semibold text-ink-950">
            {order.status === 'delivered' ? `Delivered ${formatDate(order.deliveredAt ?? order.promisedBy)}`
              : order.status === 'cancelled' ? `Cancelled ${formatDate(order.cancelledAt ?? order.placedAt)}`
              : order.status === 'returned' ? 'Returned and refunded'
              : `Arriving ${formatDate(order.promisedBy)}`}
          </p>
          <p className="text-xs text-ink-600">{currentStep?.label}{currentStep?.location ? ` · ${currentStep.location}` : ''}</p>
        </div>
        <div className="divide-y divide-ink-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-wrap gap-3 p-3">
              <Link to={`/p/${api.productById.get(item.productId)?.slug ?? ''}`} className="shrink-0">
                <img src={productImage(item.imageKind, item.tint, item.imageSeed, 140)} alt="" className="size-16 rounded-md border border-ink-200" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/p/${api.productById.get(item.productId)?.slug ?? ''}`} className="text-[13px] font-medium text-ink-900 hover:text-forge-800 line-clamp-2">{item.title}</Link>
                <p className="text-2xs text-ink-500 mt-0.5">
                  Sold by <Link to={`/store/${api.vendorById.get(item.vendorId)?.slug}`} className="mf-link">{api.vendorById.get(item.vendorId)?.name}</Link>
                  {item.variantLabel ? ` · ${item.variantLabel}` : ''} · Qty {item.quantity}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusBadge status={item.vendorStatus} />
                  {item.returnId && <Badge tone="amber">Return {api.returnById.get(item.returnId)?.rma ?? 'open'}</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[13px] font-semibold mf-tnum">{money(item.lineTotal)}</span>
                {order.status === 'delivered' && !item.returnId && (
                  <Button size="xs" to={`/orders/${order.id}?return=${item.id}`}>Return or replace</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Order detail ─────────────────────────────── */

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { state, dispatch, toast, addToCart } = useApp();
  const order = state.orders.find((o) => o.id === id) ?? api.orderById.get(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [returnItem, setReturnItem] = useState<OrderItem | null>(null);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  useMemo(() => {
    const target = params.get('return');
    if (target && order) setReturnItem(order.items.find((i) => i.id === target) ?? null);
  }, [params, order?.id]);

  if (!order) {
    return (
      <Narrow className="py-16">
        <EmptyState icon={<Package className="size-5" />} title="Order not found" body="Check your orders list — this order may belong to another account." action={<Button variant="primary" to="/orders">Your orders</Button>} />
      </Narrow>
    );
  }

  const canCancel = ['pending', 'confirmed', 'processing', 'packed'].includes(order.status);
  const relatedReturns = state.returns.filter((r) => r.orderId === order.id);
  const vendorGroups = [...new Set(order.items.map((i) => i.vendorId))];

  return (
    <Narrow className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Orders', to: '/orders' }, { label: order.number }]} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-ink-950 mf-tnum">Order {order.number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-[13px] text-ink-500 mt-1">
            Placed {formatDateTime(order.placedAt)} · {order.items.length} item{order.items.length > 1 ? 's' : ''} from {vendorGroups.length} seller{vendorGroups.length > 1 ? 's' : ''} · via {titleCase(order.channel)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button size="sm" icon={<Download className="size-4" />} onClick={() => toast({ title: 'Invoice downloaded', body: `${order.invoiceNumber}.pdf`, variant: 'success' })}>Invoice</Button>
          <Button size="sm" icon={<Printer className="size-4" />} onClick={() => window.print()}>Print</Button>
          <Button size="sm" icon={<MessageSquare className="size-4" />} onClick={() => setContactOpen(true)}>Contact seller</Button>
          {canCancel && <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>Cancel order</Button>}
        </div>
      </div>

      {order.status === 'out_for_delivery' && (
        <Alert tone="success" className="mt-3" title="Arriving today" icon={<Truck className="size-4" />}>
          Your parcel is with the delivery agent and should arrive before 7pm. You will get an SMS when it is 10 minutes away.
        </Alert>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-3">
          <Panel>
            <PanelHeader title="Delivery timeline" subtitle={order.status === 'delivered' ? `Delivered ${formatDate(order.deliveredAt!)}` : `Expected by ${formatDate(order.promisedBy)}`} />
            <div className="p-4">
              <div className="hidden sm:block mb-5">
                <Timeline orientation="horizontal" steps={order.timeline.map((t) => ({ ...t, at: formatDate(t.at) }))} />
              </div>
              <div className="sm:hidden">
                <Timeline steps={order.timeline.map((t) => ({ ...t, at: formatDateTime(t.at) }))} />
              </div>
              <div className="hidden sm:block">
                <Timeline steps={order.timeline.filter((t) => t.state !== 'upcoming').map((t) => ({ ...t, at: formatDateTime(t.at) }))} />
              </div>
            </div>
          </Panel>

          {order.shipments.length > 0 && (
            <Panel>
              <PanelHeader title="Shipments" subtitle={`${order.shipments.length} parcel${order.shipments.length > 1 ? 's' : ''}`} />
              <div className="divide-y divide-ink-100">
                {order.shipments.map((s) => (
                  <div key={s.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-ink-950">{api.vendorById.get(s.vendorId)?.name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {s.carrier} · <span className="mf-tnum">{s.trackingNumber}</span> · {s.weightKg} kg
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.status} />
                        <Button size="xs" onClick={() => toast({ title: 'Opening carrier tracking', body: `${s.carrier} · ${s.trackingNumber}`, variant: 'info' })}>Track</Button>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {[...s.checkpoints].reverse().map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs">
                          <span className={cx('mt-1 size-1.5 rounded-full shrink-0', i === 0 ? 'bg-forge-600' : 'bg-ink-300')} />
                          <span className="text-ink-700 font-medium">{c.label}</span>
                          <span className="text-ink-500">{c.location}</span>
                          <span className="text-ink-400 ml-auto whitespace-nowrap">{formatDateTime(c.at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {vendorGroups.map((vid) => {
            const vendor = api.vendorById.get(vid)!;
            const items = order.items.filter((i) => i.vendorId === vid);
            return (
              <Panel key={vid}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-ink-200/70 bg-ink-50/60">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="size-4 text-ink-400" />
                    <Link to={`/store/${vendor.slug}`} className="text-[13px] font-bold text-ink-950 hover:text-forge-800">{vendor.name}</Link>
                    <Rating value={vendor.rating} size="xs" />
                  </div>
                  <span className="text-xs text-ink-600 mf-tnum">{money(items.reduce((s, i) => s + i.lineTotal, 0))}</span>
                </div>
                <div className="divide-y divide-ink-100">
                  {items.map((item) => {
                    const product = api.productById.get(item.productId);
                    const ret = item.returnId ? (state.returns.find((r) => r.id === item.returnId) ?? api.returnById.get(item.returnId)) : undefined;
                    return (
                      <div key={item.id} className="flex flex-wrap gap-3 p-4">
                        <Link to={`/p/${product?.slug}`} className="shrink-0">
                          <img src={productImage(item.imageKind, item.tint, item.imageSeed, 160)} alt="" className="size-20 rounded-md border border-ink-200" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/p/${product?.slug}`} className="text-[13px] font-medium text-ink-900 hover:text-forge-800 line-clamp-2">{item.title}</Link>
                          <p className="text-2xs text-ink-500 mt-0.5">
                            SKU {item.sku}{item.variantLabel ? ` · ${item.variantLabel}` : ''} · Qty {item.quantity}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={item.vendorStatus} />
                            {ret && <Badge tone="amber">{ret.rma} · {titleCase(ret.status)}</Badge>}
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-1.5 no-print">
                            {order.status === 'delivered' && !ret && (
                              <>
                                <Button size="xs" onClick={() => setReturnItem(item)}>Return item</Button>
                                <Button size="xs" onClick={() => { setReturnItem(item); }}>Replace item</Button>
                                <Button size="xs" variant="subtle" icon={<Star className="size-3" />} onClick={() => setReviewItem(item)}>Write a review</Button>
                              </>
                            )}
                            {ret && <Button size="xs" to="/account/returns">Track return</Button>}
                            {product && <Button size="xs" variant="ghost" onClick={() => addToCart(product)}>Buy it again</Button>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-ink-950 mf-tnum">{money(item.lineTotal)}</p>
                          <p className="text-2xs text-ink-500 mf-tnum">incl. {money(item.taxAmount)} tax</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}

          {relatedReturns.length > 0 && (
            <Panel>
              <PanelHeader title="Returns on this order" actions={<Button size="xs" to="/account/returns">All returns</Button>} />
              <div className="divide-y divide-ink-100">
                {relatedReturns.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                    <img src={productImage(r.imageKind, r.tint, r.id, 100)} alt="" className="size-12 rounded border border-ink-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink-900 line-clamp-1">{r.productTitle}</p>
                      <p className="text-2xs text-ink-500 mf-tnum">{r.rma} · {r.reason} · requested {relativeTime(r.requestedAt)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                    <span className="text-[13px] font-semibold mf-tnum">{money(r.refundAmount)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel className="p-4">
            <h3 className="text-[13px] font-bold text-ink-950">Payment summary</h3>
            <dl className="mt-2.5 space-y-1.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-600">Item total</dt><dd className="mf-tnum">{money(order.totals.itemTotal)}</dd></div>
              {order.totals.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-600">Coupon {order.couponCode}</dt><dd className="mf-tnum text-emerald-700">−{money(order.totals.couponDiscount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-600">Delivery</dt><dd className="mf-tnum">{order.totals.shipping === 0 ? 'Free' : money(order.totals.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Tax (included)</dt><dd className="mf-tnum text-ink-500">{money(order.totals.tax)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-ink-200"><dt className="font-bold text-ink-950">Grand total</dt><dd className="font-bold mf-tnum">{money(order.totals.grandTotal)}</dd></div>
            </dl>
            <div className="mt-3 pt-3 border-t border-ink-100 space-y-1.5">
              <DefinitionList items={[
                { label: 'Payment method', value: order.payment.methodLabel },
                { label: 'Payment status', value: <StatusBadge status={order.payment.status} /> },
                { label: 'Transaction ref', value: <span className="mf-tnum">{order.payment.transactionRef}</span> },
                { label: 'Gateway', value: order.payment.gateway },
                ...(order.payment.refundedAmount > 0 ? [{ label: 'Refunded', value: <span className="text-emerald-700 mf-tnum">{money(order.payment.refundedAmount)}</span> }] : []),
                { label: 'Invoice', value: <span className="mf-tnum">{order.invoiceNumber}</span> },
              ]} />
            </div>
          </Panel>

          <Panel className="p-4">
            <h3 className="text-[13px] font-bold text-ink-950">Delivery address</h3>
            <p className="mt-2 text-[13px] font-medium text-ink-900">{order.shippingAddress.fullName}</p>
            <p className="text-xs text-ink-600 leading-relaxed mt-0.5">
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
            <p className="text-xs text-ink-500 mt-1.5">{order.shippingAddress.phone}</p>
            {order.shippingAddress.deliveryNotes && (
              <p className="mt-2 rounded-md bg-ink-50 border border-ink-200 px-2.5 py-1.5 text-2xs text-ink-600">{order.shippingAddress.deliveryNotes}</p>
            )}
          </Panel>

          {order.giftMessage && (
            <Panel className="p-4">
              <h3 className="text-[13px] font-bold text-ink-950 flex items-center gap-1.5"><Gift className="size-3.5" /> Gift message</h3>
              <p className="mt-1.5 text-[13px] text-ink-700 italic leading-relaxed">"{order.giftMessage}"</p>
            </Panel>
          )}

          <Panel className="p-4 no-print">
            <h3 className="text-[13px] font-bold text-ink-950">Need help?</h3>
            <div className="mt-2 space-y-1">
              {[
                ['Track this order', <Truck className="size-3.5" />, '#'],
                ['Return or replace items', <RotateCcw className="size-3.5" />, '/account/returns'],
                ['Contact the seller', <MessageSquare className="size-3.5" />, '#'],
                ['Raise a dispute', <ShieldCheck className="size-3.5" />, '/help/contact'],
                ['Help centre', <CircleHelp className="size-3.5" />, '/help'],
              ].map(([label, icon, to]) => (
                <Link key={label as string} to={to as string} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-700 hover:bg-ink-50 hover:text-forge-800">
                  <span className="text-ink-400">{icon}</span>{label as string}
                  <ChevronRight className="size-3.5 text-ink-300 ml-auto" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen} onClose={() => setCancelOpen(false)}
        title="Cancel this order?" confirmLabel="Cancel order"
        onConfirm={() => { dispatch({ type: 'order/cancel', orderId: order.id, reason: cancelReason }); setCancelOpen(false); toast({ title: 'Order cancelled', body: `Refund of ${money(order.totals.grandTotal)} initiated to ${order.payment.methodLabel}`, variant: 'success' }); }}
        body={
          <div className="space-y-3">
            <p>Cancelling will stop the shipment and refund {money(order.totals.grandTotal)} to your original payment method within 3–5 business days.</p>
            <Field label="Reason for cancellation">
              <Select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                {['Ordered by mistake', 'Found a better price elsewhere', 'Delivery date too late', 'No longer needed', 'Changed my mind about the seller'].map((r) => <option key={r}>{r}</option>)}
              </Select>
            </Field>
          </div>
        }
      />

      {returnItem && <ReturnRequestModal order={order} item={returnItem} onClose={() => setReturnItem(null)} />}
      {reviewItem && <WriteReviewModal open onClose={() => setReviewItem(null)} productTitle={reviewItem.title} />}

      <Modal
        open={contactOpen} onClose={() => setContactOpen(false)}
        title="Contact seller" subtitle={api.vendorById.get(order.items[0].vendorId)?.name}
        footer={<>
          <Button size="sm" onClick={() => setContactOpen(false)}>Cancel</Button>
          <Button size="sm" variant="primary" icon={<Send className="size-3.5" />} onClick={() => { setContactOpen(false); toast({ title: 'Message sent to seller', body: 'Most sellers reply within 12 hours.', variant: 'success' }); }}>Send message</Button>
        </>}
      >
        <div className="space-y-3">
          <Field label="Regarding">
            <Select defaultValue={order.number}>{[order.number].map((n) => <option key={n}>{n}</option>)}</Select>
          </Field>
          <Field label="Topic">
            <Select>{['Where is my order?', 'Item damaged or defective', 'Wrong item received', 'Invoice or GST query', 'Warranty question', 'Other'].map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Message" required>
            <Textarea rows={4} placeholder="Describe the issue and what you would like the seller to do…" />
          </Field>
          <Alert tone="info">Messages are logged against this order. If the seller does not respond within 48 hours you can escalate to MarketForge support.</Alert>
        </div>
      </Modal>
    </Narrow>
  );
}

/* ────────────────────────── Return request flow ─────────────────────────── */

const RETURN_REASONS: { key: Return['reasonCategory']; label: string; needsPhoto?: boolean }[] = [
  { key: 'damaged', label: 'Item arrived damaged', needsPhoto: true },
  { key: 'wrong_item', label: 'Wrong item delivered', needsPhoto: true },
  { key: 'not_as_described', label: 'Does not match the description', needsPhoto: true },
  { key: 'size_fit', label: 'Size or fit is wrong' },
  { key: 'quality', label: 'Quality not as expected' },
  { key: 'no_longer_needed', label: 'No longer needed' },
  { key: 'late_delivery', label: 'Delivered later than promised' },
];

export function ReturnRequestModal({ order, item, onClose }: { order: Order; item: OrderItem; onClose: () => void }) {
  const { createReturn, toast } = useApp();
  const navigate = useNavigate();
  const [type, setType] = useState<Return['type']>('refund');
  const [reason, setReason] = useState<Return['reasonCategory']>('damaged');
  const [comments, setComments] = useState('');
  const [refundMethod, setRefundMethod] = useState<Return['refundMethod']>('original');
  const [photos, setPhotos] = useState<string[]>([]);
  const selected = RETURN_REASONS.find((r) => r.key === reason)!;

  const submit = () => {
    const ret = createReturn({
      order, item, type, reasonCategory: reason, reason: selected.label,
      comments, refundMethod, photoCount: photos.length,
    });
    onClose();
    toast({ title: `Return ${ret.rma} created`, body: 'The seller has 48 hours to approve. We will book a free pickup.', variant: 'success', action: { label: 'Track return', to: '/account/returns' } });
    navigate('/account/returns');
  };

  return (
    <Modal
      open onClose={onClose} size="lg"
      title="Return or replace item" subtitle={item.title}
      footer={<>
        <Button size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" variant="primary" disabled={selected.needsPhoto && photos.length === 0} onClick={submit}>
          Submit request
        </Button>
      </>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-3">
          <img src={productImage(item.imageKind, item.tint, item.imageSeed, 120)} alt="" className="size-14 rounded border border-ink-200" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink-900 line-clamp-1">{item.title}</p>
            <p className="text-2xs text-ink-500">Order {order.number} · delivered {formatDate(order.deliveredAt ?? order.promisedBy)} · {api.vendorById.get(item.vendorId)?.name}</p>
          </div>
          <span className="text-[13px] font-semibold mf-tnum">{money(item.unitPrice)}</span>
        </div>

        <Field label="What would you like?" required>
          <div className="grid gap-2 sm:grid-cols-2">
            <Radio name="rtype" checked={type === 'refund'} onChange={() => setType('refund')} label="Refund" sublabel="Return the item and get your money back" />
            <Radio name="rtype" checked={type === 'replacement'} onChange={() => setType('replacement')} label="Replacement" sublabel="Exchange for the same item, subject to stock" />
          </div>
        </Field>

        <Field label="Reason for return" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value as Return['reasonCategory'])}>
            {RETURN_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </Select>
        </Field>

        <Field label="Tell us more" hint="Details help the seller approve faster and avoid a second pickup">
          <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Describe the issue — where the damage is, what arrived instead, or how the fit differs…" />
        </Field>

        <Field
          label={`Upload photos${selected.needsPhoto ? '' : ' (optional)'}`}
          required={selected.needsPhoto}
          error={selected.needsPhoto && photos.length === 0 ? 'At least one photo is required for this reason' : undefined}
          hint="Clear photos of the item, the label and the packaging speed up approval"
        >
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p} className="relative">
                <img src={mediaImage(`ret-${i}`, item.tint, 88)} alt="" className="size-16 rounded-md border border-ink-200" />
                <button onClick={() => setPhotos(photos.filter((x) => x !== p))} className="absolute -top-1.5 -right-1.5 grid place-items-center size-5 rounded-full bg-ink-950 text-white">
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                onClick={() => setPhotos([...photos, `return-photo-${photos.length + 1}.jpg`])}
                className="grid place-items-center size-16 rounded-md border-2 border-dashed border-ink-300 text-2xs text-ink-500 hover:border-forge-400 hover:text-forge-700"
              >+ Photo</button>
            )}
          </div>
        </Field>

        {type === 'refund' && (
          <Field label="Refund to" required>
            <div className="grid gap-2 sm:grid-cols-2">
              <Radio name="refund" checked={refundMethod === 'original'} onChange={() => setRefundMethod('original')} label="Original payment method" sublabel={`${order.payment.methodLabel} · 3–5 business days`} />
              <Radio name="refund" checked={refundMethod === 'wallet'} onChange={() => setRefundMethod('wallet')} label="MarketForge Wallet" sublabel="Instant credit, usable immediately" />
              <Radio name="refund" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} label="Bank transfer" sublabel="NEFT to a saved account · 5–7 days" />
              <Radio name="refund" checked={refundMethod === 'gift_card'} onChange={() => setRefundMethod('gift_card')} label="Gift card" sublabel="Instant, plus 5% bonus credit" />
            </div>
          </Field>
        )}

        <Alert tone="info" title="What happens next">
          The seller reviews your request within 48 hours. Once approved we book a free pickup at your convenience, inspect the item on arrival, and release the refund. You can follow every stage on the return timeline.
        </Alert>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────── Wishlist ───────────────────────────────── */

export function WishlistPage() {
  const { state, dispatch, addToCart, toast } = useApp();
  const [activeId, setActiveId] = useState(state.wishlists[0]?.id);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const list = state.wishlists.find((w) => w.id === activeId) ?? state.wishlists[0];

  return (
    <Wrap className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Your account', to: '/account' }, { label: 'Wishlist' }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-ink-950">Your wishlists</h1>
          <p className="text-[13px] text-ink-500 mt-1">
            {state.wishlists.reduce((s, w) => s + w.items.length, 0)} saved items across {state.wishlists.length} collections
          </p>
        </div>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New collection</Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
        <Panel className="p-2 lg:sticky lg:top-[116px]">
          {state.wishlists.map((w) => (
            <button
              key={w.id} onClick={() => setActiveId(w.id)}
              className={cx('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                w.id === list?.id ? 'bg-forge-50 text-forge-900' : 'hover:bg-ink-50 text-ink-700')}
            >
              <Heart className={cx('size-4 shrink-0', w.id === list?.id ? 'fill-ember-500 text-ember-500' : 'text-ink-400')} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium truncate">{w.name}</span>
                <span className="block text-2xs text-ink-500">{w.items.length} items · {w.visibility}</span>
              </span>
              {w.isDefault && <Badge tone="neutral">Default</Badge>}
            </button>
          ))}
        </Panel>

        <div className="min-w-0">
          {!list || list.items.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Heart className="size-5" />}
                title="This collection is empty"
                body="Tap the heart on any product to save it here for later."
                action={<Button variant="accent" to="/">Browse products</Button>}
              />
            </Panel>
          ) : (
            <>
              <Panel className="mb-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-950">{list.name}</h2>
                    <p className="text-xs text-ink-500 mt-0.5">Created {formatDate(list.createdAt)} · {list.visibility === 'shared' ? 'Shared via link' : 'Private'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" icon={<ShoppingCart className="size-4" />}
                      onClick={() => {
                        list.items.forEach((i) => { const p = api.productById.get(i.productId); if (p) addToCart(p, { silent: true }); });
                        toast({ title: 'All items added to cart', body: `${list.items.length} products`, variant: 'success', action: { label: 'View cart', to: '/cart' } });
                      }}
                    >Add all to cart</Button>
                    <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Share link copied', body: 'Anyone with the link can view this collection.', variant: 'success' })}>Share</Button>
                  </div>
                </div>
              </Panel>

              <div className="space-y-3">
                {list.items.map((item) => {
                  const product = api.productById.get(item.productId);
                  if (!product) return null;
                  const inv = api.inventoryByProduct.get(product.id);
                  const dropped = item.priceAtAdd > product.price;
                  return (
                    <Panel key={item.id} className="p-3 sm:p-4 flex flex-wrap gap-4">
                      <Link to={`/p/${product.slug}`} className="shrink-0">
                        <ProductImage product={product} size={220} className="size-24 sm:size-28 rounded-md border border-ink-200" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/p/${product.slug}`} className="text-[14px] font-semibold text-ink-950 hover:text-forge-800 line-clamp-2">{product.title}</Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Rating value={product.rating} count={product.ratingCount} size="xs" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Price value={product.price} mrp={product.mrp} />
                          {dropped && (
                            <Badge tone="green">Price dropped {money(item.priceAtAdd - product.price)} since you saved it</Badge>
                          )}
                        </div>
                        <p className={cx('mt-1.5 text-xs font-medium', (inv?.available ?? 0) === 0 ? 'text-red-600' : 'text-emerald-700')}>
                          {(inv?.available ?? 0) === 0 ? 'Out of stock — we will alert you when it returns' : `In stock · delivery ${deliveryPromise(new Date(Date.now() + product.deliveryDays * 86400000).toISOString())}`}
                        </p>
                        {item.note && <p className="mt-1.5 text-2xs text-ink-500 italic">Note: {item.note}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="accent" disabled={(inv?.available ?? 0) === 0} onClick={() => { addToCart(product); dispatch({ type: 'wishlist/remove', listId: list.id, itemId: item.id }); }}>
                            Move to cart
                          </Button>
                          <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => dispatch({ type: 'wishlist/remove', listId: list.id, itemId: item.id })}>Remove</Button>
                          {(inv?.available ?? 0) === 0 && (
                            <Button size="sm" variant="subtle" icon={<Bell className="size-3.5" />} onClick={() => toast({ title: 'Back-in-stock alert set', body: product.shortTitle, variant: 'success' })}>Notify me</Button>
                          )}
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={creating} onClose={() => setCreating(false)} title="New wishlist collection" size="sm"
        footer={<>
          <Button size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          <Button size="sm" variant="primary" disabled={!newName.trim()} onClick={() => { dispatch({ type: 'wishlist/create', name: newName.trim() }); setCreating(false); setNewName(''); }}>Create</Button>
        </>}
      >
        <Field label="Collection name" required hint="For example: Desk setup, Gifts, Kitchen upgrade">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Desk setup 2027" />
        </Field>
      </Modal>
    </Wrap>
  );
}

/* ──────────────────────────── Customer account ──────────────────────────── */

const ACCOUNT_NAV = [
  { to: '/account', label: 'Overview', icon: <User className="size-4" />, end: true },
  { to: '/orders', label: 'Orders', icon: <Package className="size-4" /> },
  { to: '/account/returns', label: 'Returns & refunds', icon: <RotateCcw className="size-4" /> },
  { to: '/wishlist', label: 'Wishlists', icon: <Heart className="size-4" /> },
  { to: '/account/addresses', label: 'Addresses', icon: <MapPin className="size-4" /> },
  { to: '/account/payments', label: 'Payment methods', icon: <CreditCard className="size-4" /> },
  { to: '/account/reviews', label: 'Your reviews', icon: <Star className="size-4" /> },
  { to: '/account/coupons', label: 'Coupons & gift cards', icon: <Ticket className="size-4" /> },
  { to: '/account/notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
  { to: '/account/security', label: 'Login & security', icon: <ShieldCheck className="size-4" /> },
  { to: '/account/preferences', label: 'Preferences', icon: <Settings className="size-4" /> },
];

export function AccountLayout() {
  return (
    <Wrap className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Your account' }]} />
      <div className="mt-3 grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)] items-start">
        <Panel className="p-2 lg:sticky lg:top-[116px]">
          <div className="flex items-center gap-2.5 px-2 py-2.5 mb-1 border-b border-ink-100">
            <Avatar name={api.currentCustomer.name} seed={api.currentCustomer.id} size="md" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-950 truncate">{api.currentCustomer.name}</p>
              <p className="text-2xs text-ink-500 truncate">{titleCase(api.currentCustomer.tier)} member</p>
            </div>
          </div>
          {ACCOUNT_NAV.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cx('flex items-center gap-2.5 rounded-md px-2.5 h-9 text-[13px] transition-colors',
                isActive ? 'bg-forge-50 text-forge-900 font-medium' : 'text-ink-700 hover:bg-ink-50')}
            >
              <span className="text-ink-400">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </Panel>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </Wrap>
  );
}

export function AccountOverview() {
  const { state } = useApp();
  const c = api.currentCustomer;
  const orders = state.orders;
  const active = orders.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.status));

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={c.name} seed={c.id} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-ink-950">{c.name}</h1>
            <p className="text-[13px] text-ink-500">{c.email} · {c.phone}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone="forge">{titleCase(c.tier)} member</Badge>
              <Badge tone="neutral">Member since {formatDate(c.joinedAt)}</Badge>
              <Badge tone="green" dot>Account active</Badge>
            </div>
          </div>
          <Button size="sm" to="/account/preferences">Edit profile</Button>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={orders.length} icon={<Package className="size-4" />} hint={`${active.length} in progress`} />
        <StatCard label="Lifetime spend" value={money(orders.reduce((s, o) => s + o.totals.grandTotal, 0))} icon={<Wallet className="size-4" />} tone="forge" hint="Across all sellers" />
        <StatCard label="Saved items" value={state.wishlists.reduce((s, w) => s + w.items.length, 0)} icon={<Heart className="size-4" />} tone="ember" hint={`${state.wishlists.length} collections`} />
        <StatCard label="Open returns" value={state.returns.filter((r) => !['refunded', 'rejected'].includes(r.status)).length} icon={<RotateCcw className="size-4" />} tone="amber" hint={`${state.returns.length} total returns`} />
      </div>

      {active.length > 0 && (
        <Panel>
          <PanelHeader title="In progress" subtitle="Orders on the way to you" actions={<Button size="xs" to="/orders">All orders</Button>} />
          <div className="divide-y divide-ink-100">
            {active.slice(0, 3).map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-ink-50/60 transition-colors">
                <img src={productImage(o.items[0].imageKind, o.items[0].tint, o.items[0].imageSeed, 120)} alt="" className="size-14 rounded border border-ink-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-900 line-clamp-1">{o.items[0].title}</p>
                  <p className="text-2xs text-ink-500 mf-tnum">{o.number} · {o.items.length} item{o.items.length > 1 ? 's' : ''} · {money(o.totals.grandTotal)}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <p className="text-2xs text-ink-500 mt-1">Arriving {formatDate(o.promisedBy)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Buy it again" subtitle="From your delivered orders" />
          <div className="p-2">
            {orders.filter((o) => o.status === 'delivered').slice(0, 4).flatMap((o) => o.items.slice(0, 1)).map((i) => {
              const p = api.productById.get(i.productId);
              return p ? <ProductCard key={i.id} product={p} layout="compact" /> : null;
            })}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Recent activity" />
          <ul className="divide-y divide-ink-100">
            {state.notifications.filter((n) => n.audience === 'customer').slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-start gap-3 p-3.5">
                <span className={cx('mt-1 size-2 rounded-full shrink-0',
                  n.severity === 'success' ? 'bg-emerald-500' : n.severity === 'warning' ? 'bg-amber-500' : n.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500')} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{n.title}</p>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-2xs text-ink-400 mt-1">{relativeTime(n.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

export function AccountReturns() {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState('all');
  const list = state.returns.filter((r) =>
    tab === 'all' ? true : tab === 'open' ? !['refunded', 'rejected'].includes(r.status) : tab === 'refunded' ? r.status === 'refunded' : r.status === 'rejected');

  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader
          title="Returns & refunds"
          subtitle="Track every return, replacement and refund across sellers"
          actions={<Button size="sm" to="/orders">Start a new return</Button>}
        />
        <Tabs
          items={[
            { key: 'all', label: 'All', count: state.returns.length },
            { key: 'open', label: 'In progress', count: state.returns.filter((r) => !['refunded', 'rejected'].includes(r.status)).length },
            { key: 'refunded', label: 'Refunded', count: state.returns.filter((r) => r.status === 'refunded').length },
            { key: 'rejected', label: 'Rejected', count: state.returns.filter((r) => r.status === 'rejected').length },
          ]}
          value={tab} onChange={setTab}
        />
        {list.length === 0 ? (
          <EmptyState icon={<RotateCcw className="size-5" />} title="No returns here" body="Returns you raise from an order will show up with a live timeline." action={<Button size="sm" variant="primary" to="/orders">Go to orders</Button>} />
        ) : (
          <div className="divide-y divide-ink-200/70">
            {list.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex flex-wrap gap-4">
                  <img src={productImage(r.imageKind, r.tint, r.id, 160)} alt="" className="size-20 rounded-md border border-ink-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-ink-950 line-clamp-1">{r.productTitle}</p>
                        <p className="text-2xs text-ink-500 mt-0.5 mf-tnum">
                          {r.rma} · Order <Link to={`/orders/${r.orderId}`} className="mf-link">{r.orderNumber}</Link> · requested {relativeTime(r.requestedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={r.type === 'replacement' ? 'violet' : 'blue'}>{titleCase(r.type)}</Badge>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <DefinitionList items={[
                        { label: 'Reason', value: r.reason },
                        { label: 'Refund amount', value: <span className="mf-tnum">{money(r.refundAmount)}</span> },
                        { label: 'Refund to', value: titleCase(r.refundMethod === 'original' ? 'Original payment method' : r.refundMethod) },
                      ]} />
                      {r.pickupSlot && (
                        <div className="rounded-md border border-forge-200 bg-forge-50 px-3 py-2">
                          <p className="text-2xs font-semibold uppercase tracking-wide text-forge-700 flex items-center gap-1"><Calendar className="size-3" /> Pickup slot</p>
                          <p className="text-[13px] font-semibold text-forge-950 mt-0.5">{r.pickupSlot}</p>
                          <p className="text-2xs text-forge-700 mt-0.5">ForgeExpress Reverse · free pickup</p>
                        </div>
                      )}
                      {r.media.length > 0 && (
                        <div>
                          <p className="text-2xs text-ink-500 mb-1.5">Your photos</p>
                          <div className="flex gap-1.5">
                            {r.media.map((m) => <img key={m.id} src={mediaImage(m.seed, m.tint, 80)} alt={m.caption} className="size-12 rounded border border-ink-200" />)}
                          </div>
                        </div>
                      )}
                    </div>
                    {r.comments && <p className="mt-2 text-xs text-ink-600 leading-relaxed italic">"{r.comments}"</p>}
                    {r.inspectionNote && <Alert tone="info" className="mt-2.5" title="Inspection note">{r.inspectionNote}</Alert>}
                    {r.rejectionReason && <Alert tone="danger" className="mt-2.5" title="Return rejected">{r.rejectionReason}</Alert>}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50/40 p-3">
                  <div className="hidden sm:block">
                    <Timeline orientation="horizontal" steps={r.timeline.map((t) => ({ ...t, at: t.state === 'upcoming' ? undefined : formatDate(t.at) }))} />
                  </div>
                  <div className="sm:hidden">
                    <Timeline steps={r.timeline.filter((t) => t.state !== 'upcoming').map((t) => ({ ...t, at: formatDate(t.at) }))} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="xs" to={`/orders/${r.orderId}`}>View order</Button>
                  {r.status === 'requested' && (
                    <Button size="xs" variant="danger" onClick={() => { dispatch({ type: 'return/status', returnId: r.id, status: 'rejected' }); toast({ title: 'Return cancelled', variant: 'info' }); }}>
                      Cancel return
                    </Button>
                  )}
                  {r.pickupSlot && r.status === 'pickup_scheduled' && (
                    <Button size="xs" onClick={() => toast({ title: 'Pickup rescheduled', body: 'New slot: Sat, 6 Sep · 12pm – 3pm', variant: 'success' })}>Reschedule pickup</Button>
                  )}
                  <Button size="xs" variant="ghost" icon={<LifeBuoy className="size-3" />} to="/help/contact">Get help</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Refund history" subtitle="Money returned to your payment methods" />
        <DataTable
          rows={api.refunds.slice(0, 6)}
          keyOf={(r) => r.id}
          columns={[
            { key: 'ref', header: 'Reference', render: (r) => <span className="font-medium mf-tnum">{r.reference}</span> },
            { key: 'order', header: 'Order', render: (r) => <Link to={`/orders/${r.orderId}`} className="mf-link mf-tnum">{r.orderNumber}</Link>, hideBelow: 'sm' },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-semibold mf-tnum">{money(r.amount)}</span> },
            { key: 'method', header: 'Method', render: (r) => titleCase(r.method), hideBelow: 'md' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'date', header: 'Initiated', align: 'right', render: (r) => <span className="text-ink-500">{formatDate(r.initiatedAt)}</span>, hideBelow: 'sm' },
          ]}
        />
      </Panel>
    </div>
  );
}

export function AccountAddresses() {
  const { state, dispatch, toast } = useApp();
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Address | null>(null);

  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader title="Your addresses" subtitle="Used for delivery and billing at checkout" actions={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add address</Button>} />
        <div className="p-4 grid gap-3 sm:grid-cols-2">
          {state.addresses.map((a) => (
            <div key={a.id} className={cx('rounded-lg border p-3.5', a.isDefault ? 'border-forge-300 bg-forge-50/40' : 'border-ink-200')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{a.label}</Badge>
                  {a.isDefault && <Badge tone="forge">Default</Badge>}
                </div>
                <MapPin className="size-4 text-ink-300" />
              </div>
              <p className="mt-2 text-[13px] font-semibold text-ink-950">{a.fullName}</p>
              <p className="text-xs text-ink-600 leading-relaxed mt-0.5">
                {a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.city}, {a.state} {a.postalCode}<br />{a.country}
              </p>
              <p className="text-xs text-ink-500 mt-1.5 mf-tnum">{a.phone}</p>
              {a.deliveryNotes && <p className="mt-2 text-2xs text-ink-500 italic">{a.deliveryNotes}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="xs" onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && <Button size="xs" variant="ghost" onClick={() => { dispatch({ type: 'address/default', addressId: a.id }); toast({ title: 'Default address updated', variant: 'success' }); }}>Set as default</Button>}
                <Button size="xs" variant="ghost" onClick={() => setRemoving(a)}>Delete</Button>
              </div>
            </div>
          ))}
          <button onClick={() => setAdding(true)} className="rounded-lg border-2 border-dashed border-ink-300 p-6 flex flex-col items-center justify-center gap-2 text-ink-500 hover:border-forge-400 hover:text-forge-700 hover:bg-forge-50/40 transition-colors min-h-[180px]">
            <Plus className="size-6" />
            <span className="text-[13px] font-medium">Add a new address</span>
          </button>
        </div>
      </Panel>

      <Modal open={adding || !!editing} onClose={() => { setAdding(false); setEditing(null); }} title={editing ? 'Edit address' : 'Add a new address'} size="lg">
        <AddressForm
          initial={editing ?? undefined}
          onSave={(a) => { dispatch({ type: 'address/save', address: a }); setAdding(false); setEditing(null); toast({ title: editing ? 'Address updated' : 'Address added', variant: 'success' }); }}
          onCancel={() => { setAdding(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!removing} onClose={() => setRemoving(null)} title="Delete this address?"
        body={<>This will remove <span className="font-semibold">{removing?.line1}, {removing?.city}</span> from your saved addresses. Orders already placed are not affected.</>}
        confirmLabel="Delete address"
        onConfirm={() => { dispatch({ type: 'address/remove', addressId: removing!.id }); setRemoving(null); toast({ title: 'Address deleted', variant: 'info' }); }}
      />
    </div>
  );
}

export function AccountPayments() {
  const { toast } = useApp();
  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader title="Payment methods" subtitle="Cards, UPI and wallets saved to your account" actions={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => toast({ title: 'Add payment method', body: 'You will be redirected to a secure gateway page.', variant: 'info' })}>Add method</Button>} />
        <div className="divide-y divide-ink-100">
          {api.paymentMethods.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid place-items-center size-10 rounded-md border border-ink-200 bg-ink-50 text-ink-500 shrink-0">
                {p.kind === 'card' ? <CreditCard className="size-4" /> : p.kind === 'upi' ? <Smartphone className="size-4" /> : p.kind === 'wallet' ? <Wallet className="size-4" /> : p.kind === 'netbanking' ? <Building className="size-4" /> : <Banknote className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink-950 flex items-center gap-2">
                  {p.label}
                  {p.brand && <Badge tone="neutral">{p.brand}</Badge>}
                  {p.isDefault && <Badge tone="forge">Default</Badge>}
                </p>
                <p className="text-xs text-ink-500 mt-0.5 mf-tnum">{p.detail}{p.expiry ? ` · expires ${p.expiry}` : ''}</p>
              </div>
              <div className="flex gap-2">
                {!p.isDefault && <Button size="xs" onClick={() => toast({ title: 'Default payment method updated', variant: 'success' })}>Set default</Button>}
                <Button size="xs" variant="ghost" onClick={() => toast({ title: 'Payment method removed', variant: 'info' })}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-4">
        <h3 className="text-[13px] font-bold text-ink-950 flex items-center gap-1.5"><Wallet className="size-4" /> MarketForge Wallet</h3>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xs text-ink-500 uppercase tracking-wide">Available balance</p>
            <p className="text-3xl font-bold text-ink-950 mf-tnum">{money(2480)}</p>
            <p className="text-xs text-ink-500 mt-1">Includes ₹480 of refund credit expiring 12 Nov 2026</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary">Add money</Button>
            <Button size="sm">Transaction history</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function AccountReviews() {
  const { state } = useApp();
  const mine = api.customerReviews(api.currentCustomer.id);
  const pending = state.orders.filter((o) => o.status === 'delivered').flatMap((o) => o.items.filter((i) => !i.reviewed).map((i) => ({ order: o, item: i }))).slice(0, 4);
  const [reviewing, setReviewing] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Panel>
          <PanelHeader title="Waiting for your review" subtitle="Delivered items you have not rated yet" />
          <div className="divide-y divide-ink-100">
            {pending.map(({ order, item }) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                <img src={productImage(item.imageKind, item.tint, item.imageSeed, 120)} alt="" className="size-14 rounded border border-ink-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-900 line-clamp-1">{item.title}</p>
                  <p className="text-2xs text-ink-500">Delivered {formatDate(order.deliveredAt ?? order.promisedBy)} · {api.vendorById.get(item.vendorId)?.name}</p>
                </div>
                <Rating value={0} showValue={false} size="md" onChange={() => setReviewing(item.title)} />
                <Button size="sm" onClick={() => setReviewing(item.title)}>Write review</Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Your reviews" subtitle={`${mine.length} published reviews`} />
        {mine.length === 0 ? (
          <EmptyState icon={<Star className="size-5" />} title="No published reviews yet" body="Reviews you write appear here and on the product page." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {mine.map((r) => {
              const p = api.productById.get(r.productId);
              return (
                <li key={r.id} className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {p && <img src={productImage(p.imageKind, p.tint, p.imageSeeds[0], 120)} alt="" className="size-14 rounded border border-ink-200" />}
                    <div className="min-w-0 flex-1">
                      <Link to={`/p/${p?.slug}`} className="text-[13px] font-medium text-ink-900 hover:text-forge-800 line-clamp-1">{p?.title}</Link>
                      <div className="mt-1 flex items-center gap-2">
                        <Rating value={r.rating} size="xs" showValue={false} />
                        <span className="text-[13px] font-semibold text-ink-950">{r.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-600 leading-relaxed line-clamp-2">{r.body}</p>
                      <p className="text-2xs text-ink-400 mt-1.5">{relativeTime(r.createdAt)} · {r.helpfulCount} found this helpful</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {reviewing && <WriteReviewModal open onClose={() => setReviewing(null)} productTitle={reviewing} />}
    </div>
  );
}

export function AccountCoupons() {
  const { toast } = useApp();
  const active = api.coupons.filter((c) => c.status === 'active');
  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader title="Available coupons" subtitle="Apply any of these at checkout" />
        <div className="p-4 grid gap-3 sm:grid-cols-2">
          {active.map((c) => (
            <div key={c.id} className="relative rounded-lg border border-dashed border-forge-300 bg-forge-50/50 p-3.5 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-forge-900 mf-tnum tracking-wide">{c.code}</p>
                  <p className="text-xs text-ink-600 mt-1 leading-relaxed">{c.description}</p>
                </div>
                <Badge tone="forge">
                  {c.discountType === 'percentage' ? `${c.discountAmount}% off` : c.discountType === 'fixed' ? `${money(c.discountAmount)} off` : 'Free ship'}
                </Badge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-ink-500">
                <span>Min order {money(c.minOrderValue)}</span>
                {c.maxDiscount && <span>Max {money(c.maxDiscount)}</span>}
                <span>Expires {formatDate(c.endsAt)}</span>
                {c.firstOrderOnly && <span className="text-ember-700 font-medium">First order only</span>}
              </div>
              <Button size="xs" className="mt-2.5" onClick={() => { navigator.clipboard?.writeText(c.code); toast({ title: `${c.code} copied`, body: 'Paste it in the cart or at checkout.', variant: 'success' }); }}>
                Copy code
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Gift cards" subtitle="Balances applied automatically at checkout" actions={<Button size="sm">Add gift card</Button>} />
        <div className="divide-y divide-ink-100">
          {api.giftCards.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid place-items-center size-10 rounded-md bg-ember-50 border border-ember-200 text-ember-700 shrink-0"><Gift className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink-950 mf-tnum">{g.code}</p>
                <p className="text-2xs text-ink-500">Issued {formatDate(g.issuedAt)} · expires {formatDate(g.expiresAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-ink-950 mf-tnum">{money(g.balance)}</p>
                <p className="text-2xs text-ink-500">of {money(g.initialValue)}</p>
              </div>
              <StatusBadge status={g.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function AccountNotifications() {
  const { state, dispatch } = useApp();
  const list = state.notifications.filter((n) => n.audience === 'customer');
  return (
    <Panel>
      <PanelHeader
        title="Notifications" subtitle={`${list.filter((n) => !n.read).length} unread`}
        actions={<Button size="sm" onClick={() => dispatch({ type: 'notification/read' })}>Mark all read</Button>}
      />
      <ul className="divide-y divide-ink-100">
        {list.map((n) => (
          <li key={n.id} className={cx('flex items-start gap-3 p-4', !n.read && 'bg-forge-50/30')}>
            <span className={cx('mt-1 grid place-items-center size-8 rounded-md border shrink-0',
              n.severity === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : n.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700'
              : n.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700')}>
              {n.kind === 'delivery' ? <Truck className="size-4" /> : n.kind === 'refund' ? <RotateCcw className="size-4" /> : n.kind === 'price_drop' ? <Percent className="size-4" /> : n.kind === 'promotion' ? <Sparkles className="size-4" /> : n.kind === 'back_in_stock' ? <Boxes className="size-4" /> : <Package className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold text-ink-950">{n.title}</p>
                <Badge tone="neutral">{titleCase(n.kind)}</Badge>
                {!n.read && <span className="size-1.5 rounded-full bg-ember-500" />}
              </div>
              <p className="text-[13px] text-ink-600 mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-2xs text-ink-400 mt-1">{formatDateTime(n.at)} · {relativeTime(n.at)}</p>
            </div>
            {n.href && <Button size="xs" to={n.href}>View</Button>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function AccountSecurity() {
  const { toast } = useApp();
  const [twoFa, setTwoFa] = useState(true);
  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader title="Login & security" subtitle="Protect your account and review recent activity" />
        <div className="divide-y divide-ink-100">
          {[
            ['Email address', api.currentCustomer.email, 'Change email'],
            ['Mobile number', api.currentCustomer.phone, 'Change number'],
            ['Password', 'Last changed 4 months ago', 'Change password'],
          ].map(([label, value, action]) => (
            <div key={label} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-[13px] font-semibold text-ink-950">{label}</p>
                <p className="text-xs text-ink-500 mt-0.5">{value}</p>
              </div>
              <Button size="sm" onClick={() => toast({ title: `${action} requested`, body: 'A verification code has been sent.', variant: 'info' })}>{action}</Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[13px] font-semibold text-ink-950">Two-factor authentication</p>
              <p className="text-xs text-ink-500 mt-0.5">Require a code from your authenticator app at every sign-in</p>
            </div>
            <Switch checked={twoFa} onChange={(v) => { setTwoFa(v); toast({ title: v ? '2FA enabled' : '2FA disabled', variant: v ? 'success' : 'warning' }); }} />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent login activity" subtitle="Sign out of anything you do not recognise" actions={<Button size="sm" variant="danger">Sign out everywhere</Button>} />
        <DataTable
          rows={api.loginEvents} keyOf={(e) => e.id} dense
          columns={[
            { key: 'when', header: 'When', render: (e) => <span className="mf-tnum">{formatDateTime(e.at)}</span> },
            { key: 'device', header: 'Device', render: (e) => e.device },
            { key: 'location', header: 'Location', render: (e) => e.location, hideBelow: 'sm' },
            { key: 'ip', header: 'IP address', render: (e) => <span className="mf-tnum text-ink-500">{e.ip}</span>, hideBelow: 'md' },
            { key: 'result', header: 'Result', align: 'right', render: (e) => <StatusBadge status={e.result === 'success' ? 'verified' : e.result === 'failed' ? 'failed' : 'critical'} /> },
          ]}
        />
      </Panel>
    </div>
  );
}

export function AccountPreferences() {
  const { toast } = useApp();
  const [prefs, setPrefs] = useState({ marketing: true, priceDrops: true, orderSms: true, weekly: false, personalise: true });
  return (
    <div className="space-y-3">
      <Panel>
        <PanelHeader title="Profile" subtitle="How your name appears on reviews and orders" />
        <div className="p-4 grid gap-3 sm:grid-cols-2">
          <Field label="Display name"><Input defaultValue={api.currentCustomer.name} /></Field>
          <Field label="Email"><Input defaultValue={api.currentCustomer.email} /></Field>
          <Field label="Phone"><Input defaultValue={api.currentCustomer.phone} /></Field>
          <Field label="Language">
            <Select defaultValue="en-IN">{['English (India)', 'हिन्दी', 'தமிழ்', 'বাংলা'].map((l) => <option key={l}>{l}</option>)}</Select>
          </Field>
          <Field label="Currency"><Select defaultValue="INR"><option>INR — Indian Rupee</option><option>USD — US Dollar</option></Select></Field>
          <Field label="Default delivery pin"><Input defaultValue="560085" className="mf-tnum" /></Field>
        </div>
        <div className="px-4 pb-4">
          <Button variant="primary" size="sm" onClick={() => toast({ title: 'Preferences saved', variant: 'success' })}>Save changes</Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Communication preferences" />
        <div className="divide-y divide-ink-100">
          {([
            ['marketing', 'Promotional emails', 'Deals, launches and marketplace events'],
            ['priceDrops', 'Price drop alerts', 'When a wishlisted item gets cheaper'],
            ['orderSms', 'Order SMS updates', 'Dispatch, out-for-delivery and delivered'],
            ['weekly', 'Weekly digest', 'A Monday summary of new arrivals in your categories'],
            ['personalise', 'Personalised recommendations', 'Use my browsing and order history to suggest products'],
          ] as const).map(([key, label, desc]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-950">{label}</p>
                <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
              </div>
              <Switch checked={prefs[key]} onChange={(v) => setPrefs({ ...prefs, [key]: v })} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── Help & support ─────────────────────────────── */

export function HelpPage() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const faqs = api.faqs.filter((f) =>
    (!topic || f.topic.toLowerCase().includes(topic)) &&
    (!query.trim() || `${f.question} ${f.answer}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <>
      <div className="bg-ink-950">
        <Narrow className="py-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How can we help?</h1>
          <p className="mt-1.5 text-sm text-white/65">Search our help centre, or contact support — average first reply is 24 minutes.</p>
          <div className="mt-4 relative max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles — refunds, tracking, GST invoice…"
              className="h-11 w-full rounded-lg pl-10 pr-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ember-400"
            />
          </div>
        </Narrow>
      </div>

      <Narrow className="py-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {api.helpTopics.map((t) => (
            <button
              key={t.slug} onClick={() => setTopic(topic === t.slug ? null : t.slug)}
              className={cx('mf-card p-4 text-left transition-all hover:shadow-card', topic === t.slug && 'border-forge-400 ring-1 ring-forge-300')}
            >
              <div className="flex items-start gap-3">
                <span className="grid place-items-center size-9 rounded-lg bg-forge-50 border border-forge-200 text-forge-700 shrink-0">
                  {t.icon === 'Package' ? <Package className="size-4" /> : t.icon === 'RotateCcw' ? <RotateCcw className="size-4" /> : t.icon === 'CreditCard' ? <CreditCard className="size-4" /> : t.icon === 'ShieldCheck' ? <ShieldCheck className="size-4" /> : t.icon === 'Store' ? <StoreIcon className="size-4" /> : <Truck className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-950">{t.label}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{t.blurb}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Panel>
          <PanelHeader
            title={topic ? `${api.helpTopics.find((t) => t.slug === topic)?.label} — FAQ` : 'Frequently asked questions'}
            subtitle={`${faqs.length} articles`}
            actions={topic ? <Button size="xs" onClick={() => setTopic(null)}>Clear filter</Button> : undefined}
          />
          {faqs.length === 0 ? (
            <EmptyState compact icon={<CircleHelp className="size-5" />} title="No articles found" body="Try a different search term, or contact support directly." action={<Button size="sm" variant="primary" to="/help/contact">Contact support</Button>} />
          ) : (
            <div className="divide-y divide-ink-100">
              {faqs.map((f) => (
                <details key={f.id} className="group">
                  <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-ink-50/60">
                    <span className="text-[13px] font-medium text-ink-900">{f.question}</span>
                    <ChevronRight className="size-4 text-ink-400 group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-[13px] text-ink-600 leading-relaxed">{f.answer}</p>
                    <p className="mt-2.5 text-2xs text-ink-400">{f.helpful.toLocaleString('en-IN')} people found this helpful</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-ink-950">Still need help?</h2>
            <p className="text-[13px] text-ink-500 mt-1">Chat with an agent, raise a ticket, or ask a seller directly about an order.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" to="/help/contact" icon={<MessageSquare className="size-4" />}>Contact support</Button>
            <Button to="/orders">Track an order</Button>
          </div>
        </Panel>
      </Narrow>
    </>
  );
}

export function ContactSupportPage() {
  const { state, toast } = useApp();
  const [sent, setSent] = useState(false);
  const [category, setCategory] = useState('order');
  const [messages, setMessages] = useState([
    { from: 'agent', body: 'Hi! You are chatting with Rehan from MarketForge Support. How can I help today?', at: 'Just now' },
  ]);
  const [draft, setDraft] = useState('');

  const myTickets = api.supportTickets.filter((t) => t.requesterType === 'customer').slice(0, 4);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { from: 'customer', body: draft, at: 'Just now' }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((m) => [...m, {
        from: 'agent',
        body: 'Thanks — I can see that order on my side. I have requested the carrier to re-attempt delivery tomorrow between 9am and 12pm, and I have noted the address instructions on the shipment. You will get an SMS confirmation shortly.',
        at: 'Just now',
      }]);
    }, 1100);
  };

  return (
    <Narrow className="py-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Help centre', to: '/help' }, { label: 'Contact support' }]} />
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-3">
          <Panel>
            <PanelHeader title="Raise a support ticket" subtitle="Typical first response in under 30 minutes" />
            {sent ? (
              <div className="p-4">
                <Alert tone="success" title="Ticket TKT-58314 created">
                  We have emailed you a confirmation. An agent will pick this up shortly, and you can follow it below under Your tickets.
                </Alert>
                <Button size="sm" className="mt-3" onClick={() => setSent(false)}>Raise another ticket</Button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="What is this about?" required>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {[['order', 'An order or delivery'], ['returns', 'A return or refund'], ['payment', 'Payment or billing'], ['product', 'A product listing'], ['account', 'My account'], ['technical', 'Something is broken']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                  </Field>
                  <Field label="Related order" hint="Optional — helps us resolve faster">
                    <Select>
                      <option value="">Not about a specific order</option>
                      {state.orders.slice(0, 6).map((o) => <option key={o.id} value={o.id}>{o.number} · {formatDate(o.placedAt)}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Subject" required><Input placeholder="Short summary of the issue" /></Field>
                <Field label="Details" required hint="Include order numbers, dates and what you have already tried">
                  <Textarea rows={5} placeholder="Describe what happened, what you expected, and what would resolve it…" />
                </Field>
                <Field label="Priority">
                  <Select defaultValue="normal">{['low', 'normal', 'high', 'urgent'].map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</Select>
                </Field>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => { setSent(true); toast({ title: 'Ticket created', body: 'TKT-58314 · we will email you updates', variant: 'success' }); }}>Submit ticket</Button>
                  <Button variant="ghost">Attach a file</Button>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Your tickets" subtitle="Open and recently closed" />
            <DataTable
              rows={myTickets} keyOf={(t) => t.id}
              columns={[
                { key: 'ref', header: 'Ticket', render: (t) => <span className="font-medium mf-tnum">{t.reference}</span> },
                { key: 'subject', header: 'Subject', render: (t) => <span className="line-clamp-1">{t.subject}</span> },
                { key: 'cat', header: 'Category', render: (t) => titleCase(t.category), hideBelow: 'md' },
                { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
                { key: 'updated', header: 'Updated', align: 'right', render: (t) => <span className="text-ink-500">{relativeTime(t.updatedAt)}</span>, hideBelow: 'sm' },
              ]}
            />
          </Panel>
        </div>

        <Panel className="flex flex-col h-[560px] lg:sticky lg:top-[116px]">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-ink-200/70">
            <Avatar name="Rehan Qureshi" seed="admin-4" size="sm" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-950">Live chat · Rehan Q.</p>
              <p className="text-2xs text-emerald-700 flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" /> Online now</p>
            </div>
            <Badge tone="neutral" className="ml-auto">Avg 24 min</Badge>
          </div>
          <div className="flex-1 overflow-y-auto mf-scroll p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cx('flex gap-2', m.from === 'customer' && 'justify-end')}>
                {m.from === 'agent' && <Avatar name="Rehan Qureshi" seed="admin-4" size="xs" className="mt-0.5" />}
                <div className={cx('max-w-[78%] rounded-lg px-3 py-2',
                  m.from === 'customer' ? 'bg-forge-700 text-white' : 'bg-ink-100 text-ink-900')}>
                  <p className="text-[13px] leading-relaxed">{m.body}</p>
                  <p className={cx('text-2xs mt-1', m.from === 'customer' ? 'text-white/60' : 'text-ink-500')}>{m.at}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-200/70 p-3">
            <div className="flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Type your message…" />
              <Button variant="primary" onClick={send} icon={<Send className="size-4" />} aria-label="Send" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Where is my order?', 'Refund status', 'Change address'].map((q) => (
                <button key={q} onClick={() => setDraft(q)} className="rounded-full border border-ink-200 px-2.5 py-1 text-2xs text-ink-600 hover:border-forge-300 hover:text-forge-800">{q}</button>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </Narrow>
  );
}
