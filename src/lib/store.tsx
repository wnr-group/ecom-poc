/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useCallback, useContext, useMemo, useReducer, useRef, useState, type ReactNode,
} from 'react';
import * as api from './api';
import type {
  Address, CartItem, ID, Notification, Order, OrderItem, Permission, Product, Return, Role, Wishlist,
} from './types';
import { DEMO_NOW, Rng, makeId } from './rng';

/* ────────────────────────────── Permissions ─────────────────────────────── */

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  customer: [],
  vendor: [],
  admin: ['catalog.view', 'catalog.moderate', 'category.manage', 'vendor.view', 'vendor.approve', 'customer.view', 'customer.suspend', 'order.view', 'return.manage', 'finance.view', 'finance.payout', 'finance.commission', 'promo.manage', 'shipping.manage', 'dispute.resolve', 'support.manage', 'analytics.view', 'audit.view', 'settings.manage'],
  catalog_manager: ['catalog.view', 'catalog.moderate', 'category.manage', 'vendor.view', 'order.view', 'analytics.view'],
  finance_manager: ['finance.view', 'finance.payout', 'finance.commission', 'order.view', 'return.manage', 'vendor.view', 'analytics.view', 'audit.view', 'promo.manage'],
  support_agent: ['order.view', 'return.manage', 'customer.view', 'dispute.resolve', 'support.manage', 'vendor.view', 'catalog.view'],
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  admin: 'Marketplace Admin',
  catalog_manager: 'Catalog Manager',
  finance_manager: 'Finance Manager',
  support_agent: 'Support Agent',
};

/* ─────────────────────────────── Toasts ─────────────────────────────────── */

export interface Toast {
  id: string;
  title: string;
  body?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  action?: { label: string; to: string };
}

/* ──────────────────────────────── State ─────────────────────────────────── */

interface State {
  role: Role;
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlists: Wishlist[];
  couponCode?: string;
  giftCardCode?: string;
  recentlyViewed: ID[];
  recentSearches: string[];
  orders: Order[];
  returns: Return[];
  addresses: Address[];
  notifications: Notification[];
  productOverrides: Record<ID, Partial<Product>>;
  vendorStatusOverrides: Record<ID, string>;
  helpfulReviews: ID[];
  deliveryPin: string;
}

type Action =
  | { type: 'role'; role: Role }
  | { type: 'cart/add'; productId: ID; variantId?: ID; quantity: number; vendorId: ID; price: number }
  | { type: 'cart/qty'; itemId: ID; quantity: number }
  | { type: 'cart/remove'; itemId: ID }
  | { type: 'cart/save-later'; itemId: ID }
  | { type: 'cart/move-to-cart'; itemId: ID }
  | { type: 'cart/clear' }
  | { type: 'coupon'; code?: string }
  | { type: 'giftcard'; code?: string }
  | { type: 'wishlist/toggle'; productId: ID; listId?: ID; price: number }
  | { type: 'wishlist/remove'; listId: ID; itemId: ID }
  | { type: 'wishlist/create'; name: string }
  | { type: 'viewed'; productId: ID }
  | { type: 'search/record'; query: string }
  | { type: 'order/create'; order: Order }
  | { type: 'order/cancel'; orderId: ID; reason: string }
  | { type: 'order/vendor-status'; orderId: ID; itemIds: ID[]; status: OrderItem['vendorStatus'] }
  | { type: 'return/create'; ret: Return }
  | { type: 'return/status'; returnId: ID; status: Return['status'] }
  | { type: 'address/save'; address: Address }
  | { type: 'address/remove'; addressId: ID }
  | { type: 'address/default'; addressId: ID }
  | { type: 'notification/read'; id?: ID }
  | { type: 'product/patch'; productId: ID; patch: Partial<Product> }
  | { type: 'vendor/status'; vendorId: ID; status: string }
  | { type: 'review/helpful'; reviewId: ID }
  | { type: 'pin'; pin: string };

const initialState: State = {
  role: 'customer',
  cart: [
    { id: 'ci_1', productId: api.pp(11).id, vendorId: api.pp(11).vendorId, variantId: api.pp(11).variants[1]?.id, quantity: 1, addedAt: DEMO_NOW.toISOString(), priceAtAdd: api.pp(11).price },
    { id: 'ci_2', productId: api.pp(17).id, vendorId: api.pp(17).vendorId, quantity: 1, addedAt: DEMO_NOW.toISOString(), priceAtAdd: api.pp(17).price },
    { id: 'ci_3', productId: api.pp(30).id, vendorId: api.pp(30).vendorId, quantity: 2, addedAt: DEMO_NOW.toISOString(), priceAtAdd: api.pp(30).price },
  ],
  savedForLater: [
    { id: 'ci_s1', productId: api.pp(45).id, vendorId: api.pp(45).vendorId, quantity: 1, addedAt: DEMO_NOW.toISOString(), priceAtAdd: api.pp(45).price },
  ],
  wishlists: api.wishlists,
  recentlyViewed: [api.pp(3).id, api.pp(20).id, api.pp(36).id, api.pp(52).id, api.pp(8).id],
  recentSearches: ['noise cancelling headphones', 'cast iron dutch oven', 'ultrawide monitor'],
  orders: api.myOrders,
  returns: api.returns.filter((r) => r.customerId === api.currentCustomer.id),
  addresses: api.addresses,
  notifications: api.notifications,
  productOverrides: {},
  vendorStatusOverrides: {},
  helpfulReviews: [],
  deliveryPin: '560085',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'role':
      return { ...state, role: action.role };

    case 'cart/add': {
      const existing = state.cart.find((i) => i.productId === action.productId && i.variantId === action.variantId);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) => (i === existing ? { ...i, quantity: i.quantity + action.quantity } : i)),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: `ci_${Math.random().toString(36).slice(2, 9)}`,
            productId: action.productId,
            variantId: action.variantId,
            vendorId: action.vendorId,
            quantity: action.quantity,
            addedAt: new Date().toISOString(),
            priceAtAdd: action.price,
          },
        ],
      };
    }
    case 'cart/qty':
      return { ...state, cart: state.cart.map((i) => (i.id === action.itemId ? { ...i, quantity: Math.max(1, action.quantity) } : i)) };
    case 'cart/remove':
      return { ...state, cart: state.cart.filter((i) => i.id !== action.itemId) };
    case 'cart/save-later': {
      const item = state.cart.find((i) => i.id === action.itemId);
      if (!item) return state;
      return { ...state, cart: state.cart.filter((i) => i.id !== action.itemId), savedForLater: [item, ...state.savedForLater] };
    }
    case 'cart/move-to-cart': {
      const item = state.savedForLater.find((i) => i.id === action.itemId);
      if (!item) return state;
      return { ...state, savedForLater: state.savedForLater.filter((i) => i.id !== action.itemId), cart: [...state.cart, item] };
    }
    case 'cart/clear':
      return { ...state, cart: [], couponCode: undefined, giftCardCode: undefined };

    case 'coupon':
      return { ...state, couponCode: action.code };
    case 'giftcard':
      return { ...state, giftCardCode: action.code };

    case 'wishlist/toggle': {
      const listId = action.listId ?? state.wishlists.find((w) => w.isDefault)!.id;
      return {
        ...state,
        wishlists: state.wishlists.map((w) => {
          if (w.id !== listId) return w;
          const has = w.items.find((i) => i.productId === action.productId);
          return has
            ? { ...w, items: w.items.filter((i) => i.productId !== action.productId) }
            : { ...w, items: [{ id: `wli_${Math.random().toString(36).slice(2, 8)}`, productId: action.productId, addedAt: new Date().toISOString(), priceAtAdd: action.price }, ...w.items] };
        }),
      };
    }
    case 'wishlist/remove':
      return {
        ...state,
        wishlists: state.wishlists.map((w) => (w.id === action.listId ? { ...w, items: w.items.filter((i) => i.id !== action.itemId) } : w)),
      };
    case 'wishlist/create':
      return {
        ...state,
        wishlists: [...state.wishlists, { id: `wls_${Math.random().toString(36).slice(2, 8)}`, customerId: api.currentCustomer.id, name: action.name, isDefault: false, visibility: 'private', createdAt: new Date().toISOString(), items: [] }],
      };

    case 'viewed':
      return { ...state, recentlyViewed: [action.productId, ...state.recentlyViewed.filter((id) => id !== action.productId)].slice(0, 12) };
    case 'search/record':
      return { ...state, recentSearches: [action.query, ...state.recentSearches.filter((q) => q !== action.query)].slice(0, 8) };

    case 'order/create':
      return { ...state, orders: [action.order, ...state.orders] };
    case 'order/cancel':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancellationReason: action.reason,
                items: o.items.map((i) => ({ ...i, vendorStatus: 'cancelled' as const })),
                timeline: [
                  ...o.timeline.map((t) => (t.state === 'current' ? { ...t, state: 'done' as const } : t.state === 'upcoming' ? { ...t, state: 'upcoming' as const } : t)),
                  { id: `${o.id}_cx`, at: new Date().toISOString(), label: 'Cancelled', detail: action.reason, state: 'failed' as const, actor: 'Customer' },
                ],
              }
            : o,
        ),
      };
    case 'order/vendor-status':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? { ...o, items: o.items.map((i) => (action.itemIds.includes(i.id) ? { ...i, vendorStatus: action.status } : i)) }
            : o,
        ),
      };

    case 'return/create':
      return { ...state, returns: [action.ret, ...state.returns] };
    case 'return/status':
      return {
        ...state,
        returns: state.returns.map((r) => (r.id === action.returnId ? { ...r, status: action.status, updatedAt: new Date().toISOString() } : r)),
      };

    case 'address/save':
      return {
        ...state,
        addresses: state.addresses.some((a) => a.id === action.address.id)
          ? state.addresses.map((a) => (a.id === action.address.id ? action.address : action.address.isDefault ? { ...a, isDefault: false } : a))
          : [...state.addresses.map((a) => (action.address.isDefault ? { ...a, isDefault: false } : a)), action.address],
      };
    case 'address/remove':
      return { ...state, addresses: state.addresses.filter((a) => a.id !== action.addressId) };
    case 'address/default':
      return { ...state, addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === action.addressId })) };

    case 'notification/read':
      return {
        ...state,
        notifications: state.notifications.map((n) => (action.id ? (n.id === action.id ? { ...n, read: true } : n) : { ...n, read: true })),
      };

    case 'product/patch':
      return { ...state, productOverrides: { ...state.productOverrides, [action.productId]: { ...state.productOverrides[action.productId], ...action.patch } } };
    case 'vendor/status':
      return { ...state, vendorStatusOverrides: { ...state.vendorStatusOverrides, [action.vendorId]: action.status } };
    case 'review/helpful':
      return { ...state, helpfulReviews: state.helpfulReviews.includes(action.reviewId) ? state.helpfulReviews.filter((r) => r !== action.reviewId) : [...state.helpfulReviews, action.reviewId] };
    case 'pin':
      return { ...state, deliveryPin: action.pin };

    default:
      return state;
  }
}

/* ─────────────────────────── Derived cart maths ─────────────────────────── */

export interface CartLine {
  item: CartItem;
  product: Product;
  variantLabel?: string;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
  stock: number;
  deliveryDays: number;
}

export interface VendorGroup {
  vendorId: ID;
  vendorName: string;
  vendorRating: number;
  fulfilledByMarketForge: boolean;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  deliveryDays: number;
}

export interface CartSummary {
  groups: VendorGroup[];
  lines: CartLine[];
  itemCount: number;
  itemTotal: number;
  mrpTotal: number;
  discount: number;
  couponDiscount: number;
  giftCardApplied: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  couponCode?: string;
  couponError?: string;
}

function buildLine(item: CartItem): CartLine | null {
  const product = api.productById.get(item.productId);
  if (!product) return null;
  const variant = product.variants.find((v) => v.id === item.variantId);
  const unitPrice = product.price + (variant?.priceDelta ?? 0);
  return {
    item,
    product,
    variantLabel: variant ? `${variant.optionName}: ${variant.optionValue}` : undefined,
    unitPrice,
    mrp: product.mrp + (variant?.priceDelta ?? 0),
    lineTotal: unitPrice * item.quantity,
    stock: variant?.stock ?? api.inventoryByProduct.get(product.id)?.available ?? 0,
    deliveryDays: product.deliveryDays,
  };
}

export function summarise(cart: CartItem[], couponCode?: string, giftCardCode?: string): CartSummary {
  const lines = cart.map(buildLine).filter((l): l is CartLine => Boolean(l));
  const byVendor = new Map<ID, CartLine[]>();
  lines.forEach((l) => {
    const list = byVendor.get(l.product.vendorId) ?? [];
    list.push(l);
    byVendor.set(l.product.vendorId, list);
  });

  const groups: VendorGroup[] = [...byVendor.entries()].map(([vendorId, groupLines]) => {
    const vendor = api.vendorById.get(vendorId);
    const subtotal = groupLines.reduce((s, l) => s + l.lineTotal, 0);
    return {
      vendorId,
      vendorName: vendor?.name ?? 'Unknown seller',
      vendorRating: vendor?.rating ?? 0,
      fulfilledByMarketForge: vendor?.fulfilledByMarketForge ?? false,
      lines: groupLines,
      subtotal,
      shipping: subtotal >= 499 ? 0 : 49,
      deliveryDays: Math.max(...groupLines.map((l) => l.deliveryDays)),
    };
  });

  const itemTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.mrp * l.item.quantity, 0);
  const shipping = groups.reduce((s, g) => s + g.shipping, 0);
  const tax = lines.reduce((s, l) => s + Math.round((l.lineTotal * l.product.taxRatePct) / (100 + l.product.taxRatePct)), 0);

  let couponDiscount = 0;
  let couponError: string | undefined;
  if (couponCode) {
    const coupon = api.couponByCode(couponCode);
    if (!coupon) couponError = 'That code is not recognised.';
    else if (coupon.status !== 'active') couponError = `Coupon ${coupon.code} is ${coupon.status}.`;
    else if (itemTotal < coupon.minOrderValue) couponError = `Add ₹${(coupon.minOrderValue - itemTotal).toLocaleString('en-IN')} more to use ${coupon.code}.`;
    else if (coupon.discountType === 'free_shipping') couponDiscount = shipping;
    else if (coupon.discountType === 'percentage') couponDiscount = Math.min(Math.round((itemTotal * coupon.discountAmount) / 100), coupon.maxDiscount ?? Infinity);
    else couponDiscount = coupon.discountAmount;
  }

  const giftCard = giftCardCode ? api.giftCardByCode(giftCardCode) : undefined;
  const payable = Math.max(0, itemTotal - couponDiscount + shipping);
  const giftCardApplied = giftCard && giftCard.status === 'active' ? Math.min(giftCard.balance, payable) : 0;

  return {
    groups,
    lines,
    itemCount: lines.reduce((s, l) => s + l.item.quantity, 0),
    itemTotal,
    mrpTotal,
    discount: mrpTotal - itemTotal,
    couponDiscount,
    giftCardApplied,
    shipping,
    tax,
    grandTotal: payable - giftCardApplied,
    couponCode,
    couponError,
  };
}

/* ─────────────────────────────── Context ────────────────────────────────── */

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  cart: CartSummary;
  savedLines: CartLine[];
  role: Role;
  setRole: (r: Role) => void;
  can: (p: Permission) => boolean;
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  isWishlisted: (productId: ID) => boolean;
  addToCart: (product: Product, opts?: { variantId?: ID; quantity?: number; silent?: boolean }) => void;
  toggleWishlist: (product: Product, listId?: ID) => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  createReturn: (input: CreateReturnInput) => Return;
}

export interface PlaceOrderInput {
  address: Address;
  deliveryMethod: Order['deliveryMethod'];
  paymentLabel: string;
  paymentKind: Order['payment']['method'];
  summary: CartSummary;
  giftMessage?: string;
}

export interface CreateReturnInput {
  order: Order;
  item: OrderItem;
  type: Return['type'];
  reasonCategory: Return['reasonCategory'];
  reason: string;
  comments: string;
  refundMethod: Return['refundMethod'];
  photoCount: number;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t_${Math.random().toString(36).slice(2, 9)}`;
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    timers.current[id] = window.setTimeout(() => dismissToast(id), 4200);
  }, [dismissToast]);

  const cart = useMemo(() => summarise(state.cart, state.couponCode, state.giftCardCode), [state.cart, state.couponCode, state.giftCardCode]);
  const savedLines = useMemo(() => state.savedForLater.map(buildLine).filter((l): l is CartLine => Boolean(l)), [state.savedForLater]);

  const can = useCallback((p: Permission) => ROLE_PERMISSIONS[state.role].includes(p), [state.role]);

  const isWishlisted = useCallback(
    (productId: ID) => state.wishlists.some((w) => w.items.some((i) => i.productId === productId)),
    [state.wishlists],
  );

  const addToCart = useCallback<Ctx['addToCart']>((product, opts) => {
    const variantId = opts?.variantId ?? product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id;
    dispatch({ type: 'cart/add', productId: product.id, variantId, quantity: opts?.quantity ?? 1, vendorId: product.vendorId, price: product.price });
    if (!opts?.silent) {
      toast({ title: 'Added to cart', body: product.shortTitle, variant: 'success', action: { label: 'View cart', to: '/cart' } });
    }
  }, [toast]);

  const toggleWishlist = useCallback<Ctx['toggleWishlist']>((product, listId) => {
    const was = state.wishlists.some((w) => (listId ? w.id === listId : true) && w.items.some((i) => i.productId === product.id));
    dispatch({ type: 'wishlist/toggle', productId: product.id, listId, price: product.price });
    toast({
      title: was ? 'Removed from wishlist' : 'Saved to wishlist',
      body: product.shortTitle,
      variant: was ? 'info' : 'success',
      action: was ? undefined : { label: 'View wishlist', to: '/wishlist' },
    });
  }, [state.wishlists, toast]);

  const placeOrder = useCallback<Ctx['placeOrder']>((input) => {
    const { summary, address, deliveryMethod, paymentKind, paymentLabel } = input;
    const rng = new Rng(`neworder:${Date.now()}`);
    const seq = 900000 + state.orders.length * 13;
    const orderId = makeId('ord', `new${seq}`);
    const transit = deliveryMethod === 'same_day' ? 0 : deliveryMethod === 'express' ? 2 : 4;
    const now = new Date();

    const items: OrderItem[] = summary.lines.map((l, i) => {
      const commissionRate = api.vendorById.get(l.product.vendorId)?.commissionRate ?? 10;
      return {
        id: `${orderId}_i${i}`,
        orderId,
        productId: l.product.id,
        variantId: l.item.variantId,
        vendorId: l.product.vendorId,
        title: l.product.title,
        sku: l.product.sku,
        variantLabel: l.variantLabel,
        imageKind: l.product.imageKind,
        imageSeed: l.product.imageSeeds[0],
        tint: l.product.tint,
        unitPrice: l.unitPrice,
        mrp: l.mrp,
        quantity: l.item.quantity,
        taxAmount: Math.round((l.lineTotal * l.product.taxRatePct) / (100 + l.product.taxRatePct)),
        discount: (l.mrp - l.unitPrice) * l.item.quantity,
        lineTotal: l.lineTotal,
        commissionRate,
        commissionAmount: Math.round((l.lineTotal * commissionRate) / 100),
        vendorStatus: 'new',
      };
    });

    const order: Order = {
      id: orderId,
      number: `MF-2026-${seq}`,
      customerId: api.currentCustomer.id,
      placedAt: now.toISOString(),
      status: 'confirmed',
      items,
      shippingAddress: address,
      payment: {
        id: `${orderId}_pay`,
        orderId,
        customerId: api.currentCustomer.id,
        method: paymentKind,
        methodLabel: paymentLabel,
        amount: summary.grandTotal,
        status: paymentKind === 'cod' ? 'pending' : 'captured',
        gateway: 'ForgePay',
        transactionRef: `TXN${rng.int(1000000000, 9999999999)}`,
        processedAt: now.toISOString(),
        feeAmount: Math.round(summary.grandTotal * 0.019),
        refundedAmount: 0,
      },
      shipments: [],
      totals: {
        itemTotal: summary.itemTotal,
        discount: summary.discount,
        couponDiscount: summary.couponDiscount,
        shipping: summary.shipping,
        tax: summary.tax,
        giftCardApplied: summary.giftCardApplied,
        grandTotal: summary.grandTotal,
        commission: items.reduce((s, i) => s + i.commissionAmount, 0),
        vendorPayable: summary.itemTotal - items.reduce((s, i) => s + i.commissionAmount, 0),
      },
      couponCode: summary.couponCode,
      deliveryMethod,
      promisedBy: new Date(now.getTime() + transit * 86400000).toISOString(),
      invoiceNumber: `INV/2026-27/${rng.int(10000, 99999)}`,
      giftMessage: input.giftMessage,
      timeline: [
        { id: `${orderId}_t0`, at: now.toISOString(), label: 'Order Placed', detail: 'We received your order', state: 'done', actor: 'MarketForge' },
        { id: `${orderId}_t1`, at: now.toISOString(), label: 'Confirmed', detail: paymentKind === 'cod' ? 'Confirmed for Cash on Delivery' : 'Payment authorised', state: 'current', actor: 'ForgePay' },
        { id: `${orderId}_t2`, at: new Date(now.getTime() + 0.5 * 86400000).toISOString(), label: 'Packed', detail: 'Seller prepares your parcel', state: 'upcoming' },
        { id: `${orderId}_t3`, at: new Date(now.getTime() + 1 * 86400000).toISOString(), label: 'Shipped', detail: 'Handed to the carrier', state: 'upcoming' },
        { id: `${orderId}_t4`, at: new Date(now.getTime() + Math.max(1, transit - 0.5) * 86400000).toISOString(), label: 'Out for Delivery', detail: 'Final-mile handoff', state: 'upcoming' },
        { id: `${orderId}_t5`, at: new Date(now.getTime() + transit * 86400000).toISOString(), label: 'Delivered', detail: 'Expected delivery', state: 'upcoming' },
      ],
      channel: 'web',
    };

    dispatch({ type: 'order/create', order });
    dispatch({ type: 'cart/clear' });
    return order;
  }, [state.orders.length]);

  const createReturn = useCallback<Ctx['createReturn']>((input) => {
    const { order, item } = input;
    const id = makeId('rtn', `new${item.id}`);
    const now = new Date().toISOString();
    const ret: Return = {
      id,
      rma: `RMA-${Math.floor(100000 + Math.random() * 899999)}`,
      orderId: order.id,
      orderNumber: order.number,
      orderItemId: item.id,
      productId: item.productId,
      productTitle: item.title,
      imageKind: item.imageKind,
      tint: item.tint,
      customerId: order.customerId,
      vendorId: item.vendorId,
      quantity: 1,
      type: input.type,
      reason: input.reason,
      reasonCategory: input.reasonCategory,
      comments: input.comments,
      status: 'requested',
      requestedAt: now,
      updatedAt: now,
      refundMethod: input.refundMethod,
      refundAmount: item.unitPrice,
      media: Array.from({ length: input.photoCount }, (_, i) => ({
        id: `${id}m${i}`, kind: 'image' as const, seed: `${id}-${i}`, tint: item.tint, caption: `Photo ${i + 1}`,
      })),
      timeline: [
        { id: `${id}t0`, at: now, label: 'Return Requested', detail: 'We shared your request with the seller', state: 'current', actor: 'Customer' },
        { id: `${id}t1`, at: now, label: 'Approved', detail: 'Seller reviews the request', state: 'upcoming' },
        { id: `${id}t2`, at: now, label: 'Pickup Scheduled', detail: 'A carrier slot is booked', state: 'upcoming' },
        { id: `${id}t3`, at: now, label: 'Picked Up', detail: 'Parcel collected', state: 'upcoming' },
        { id: `${id}t4`, at: now, label: 'Inspection', detail: 'Checked at the warehouse', state: 'upcoming' },
        { id: `${id}t5`, at: now, label: 'Refund Initiated', detail: 'Refund sent to your payment method', state: 'upcoming' },
        { id: `${id}t6`, at: now, label: 'Refunded', detail: 'Amount credited', state: 'upcoming' },
      ],
    };
    dispatch({ type: 'return/create', ret });
    return ret;
  }, []);

  const value = useMemo<Ctx>(() => ({
    state,
    dispatch,
    cart,
    savedLines,
    role: state.role,
    setRole: (r) => dispatch({ type: 'role', role: r }),
    can,
    toasts,
    toast,
    dismissToast,
    isWishlisted,
    addToCart,
    toggleWishlist,
    placeOrder,
    createReturn,
  }), [state, cart, savedLines, can, toasts, toast, dismissToast, isWishlisted, addToCart, toggleWishlist, placeOrder, createReturn]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Product with any local (vendor/admin) edits applied. */
export function useProduct(productId: ID): Product | undefined {
  const { state } = useApp();
  const base = api.productById.get(productId);
  return base ? { ...base, ...state.productOverrides[productId] } : undefined;
}
