/**
 * MarketForge — domain model.
 *
 * Interfaces describe the marketplace's relational schema. Every entity carries
 * the foreign keys a real backend would expose, so the mock repository in
 * `lib/api.ts` can be swapped for HTTP calls without touching the UI.
 */

export type ID = string;
/** ISO-8601 timestamp. */
export type Timestamp = string;

/* ─────────────────────────── Identity & access ─────────────────────────── */

export type Role =
  | 'customer'
  | 'vendor'
  | 'admin'
  | 'catalog_manager'
  | 'finance_manager'
  | 'support_agent';

export type Permission =
  | 'catalog.view' | 'catalog.moderate' | 'category.manage'
  | 'vendor.view' | 'vendor.approve'
  | 'customer.view' | 'customer.suspend'
  | 'order.view' | 'return.manage'
  | 'finance.view' | 'finance.payout' | 'finance.commission'
  | 'promo.manage' | 'shipping.manage'
  | 'dispute.resolve' | 'support.manage'
  | 'analytics.view' | 'audit.view' | 'settings.manage';

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarSeed: string;
  status: 'active' | 'suspended' | 'invited';
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  twoFactorEnabled: boolean;
  vendorId?: ID;
  customerId?: ID;
  jobTitle?: string;
}

export interface LoginEvent {
  id: ID;
  userId: ID;
  at: Timestamp;
  ip: string;
  device: string;
  location: string;
  result: 'success' | 'failed' | 'blocked';
}

/* ───────────────────────────── Customers ──────────────────────────────── */

export type CustomerTier = 'standard' | 'plus' | 'prime';

export interface Customer {
  id: ID;
  userId: ID;
  name: string;
  email: string;
  phone: string;
  avatarSeed: string;
  tier: CustomerTier;
  status: 'active' | 'suspended';
  joinedAt: Timestamp;
  city: string;
  state: string;
  lifetimeValue: number;
  orderCount: number;
  returnCount: number;
  reviewCount: number;
  marketingOptIn: boolean;
  currency: string;
}

export interface Address {
  id: ID;
  ownerId: ID;
  label: 'Home' | 'Work' | 'Other';
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  deliveryNotes?: string;
}

export interface PaymentMethod {
  id: ID;
  ownerId: ID;
  kind: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  label: string;
  detail: string;
  brand?: 'Visa' | 'Mastercard' | 'Amex' | 'RuPay';
  expiry?: string;
  isDefault: boolean;
}

/* ────────────────────────────── Vendors ───────────────────────────────── */

export type VendorStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface Vendor {
  id: ID;
  slug: string;
  name: string;
  legalName: string;
  tagline: string;
  about: string;
  logoSeed: string;
  status: VendorStatus;
  joinedAt: Timestamp;
  homeCity: string;
  homeState: string;
  country: string;
  categories: ID[];
  rating: number;
  ratingCount: number;
  productCount: number;
  orderCount: number;
  grossSales: number;
  commissionRate: number;
  fulfilmentRate: number;
  onTimeShipRate: number;
  cancellationRate: number;
  returnRate: number;
  responseTimeHours: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  badges: string[];
  fulfilledByMarketForge: boolean;
  tint: string;
}

export type VerificationStepKey =
  | 'business' | 'owner' | 'address' | 'tax' | 'bank'
  | 'documents' | 'categories' | 'store' | 'review';

export interface VerificationStep {
  key: VerificationStepKey;
  label: string;
  state: 'complete' | 'in_progress' | 'pending' | 'action_required';
  completedAt?: Timestamp;
  note?: string;
}

export interface VendorDocument {
  id: ID;
  type: 'business_registration' | 'tax_certificate' | 'bank_statement' | 'owner_id' | 'address_proof';
  fileName: string;
  sizeKb: number;
  uploadedAt: Timestamp;
  status: 'pending' | 'verified' | 'rejected';
  note?: string;
}

export interface VendorVerification {
  id: ID;
  vendorId: ID;
  status: VendorStatus;
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewerName?: string;
  rejectionReason?: string;
  steps: VerificationStep[];
  documents: VendorDocument[];
  tax: { taxId: string; gstin: string; panOrEin: string; registeredCountry: string; taxScheme: 'regular' | 'composition' | 'exempt' };
  bank: { accountHolder: string; accountNumberMasked: string; ifscOrRouting: string; bankName: string; branch: string; verified: boolean };
  business: {
    legalName: string; displayName: string;
    entityType: 'sole_proprietor' | 'partnership' | 'llp' | 'private_limited';
    registrationNumber: string; incorporationYear: number; website: string;
    employeeCount: string; annualRevenueBand: string;
  };
  owner: { fullName: string; email: string; phone: string; dateOfBirth: string; idType: 'passport' | 'national_id' | 'driving_licence'; idNumberMasked: string };
  address: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
}

export interface VendorStore {
  id: ID;
  vendorId: ID;
  headline: string;
  description: string;
  announcement?: string;
  policies: { shipping: string; returns: string; warranty: string };
  socials: { website?: string; instagram?: string; x?: string };
  featuredProductIds: ID[];
  collections: { id: ID; title: string; productIds: ID[] }[];
  metrics: { followers: number; storeVisits30d: number; conversionRate: number };
}

/* ────────────────────────────── Catalog ──────────────────────────────── */

export interface CategoryAttribute {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean';
  options?: string[];
  unit?: string;
  filterable: boolean;
}

export interface Category {
  id: ID;
  parentId: ID | null;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
  productCount: number;
  isActive: boolean;
  attributes: CategoryAttribute[];
  tint: string;
}

export interface Brand {
  id: ID;
  name: string;
  slug: string;
  categories: ID[];
  productCount: number;
  rating: number;
  isFeatured: boolean;
  origin: string;
  tint: string;
}

export type ProductStatus =
  | 'draft' | 'pending_approval' | 'published' | 'rejected' | 'out_of_stock' | 'archived';

export type ProductBadge =
  | "Editor's Pick" | 'Best Seller' | 'New Arrival' | 'Limited Stock'
  | 'MarketForge Choice' | 'Price Drop';

export type ImageKind =
  | 'laptop' | 'phone' | 'headphone' | 'watch' | 'camera' | 'tv' | 'speaker'
  | 'apparel' | 'shoe' | 'bag' | 'cosmetic' | 'bottle' | 'book' | 'ball'
  | 'lamp' | 'cookware' | 'chair' | 'toy' | 'carpart' | 'grocery' | 'console';

export interface ProductVariant {
  id: ID;
  productId: ID;
  sku: string;
  optionName: string;
  optionValue: string;
  priceDelta: number;
  stock: number;
  isDefault: boolean;
  swatch?: string;
}

export interface ModerationRecord {
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewerName?: string;
  decision?: 'approved' | 'rejected' | 'changes_requested';
  reason?: string;
  flags: string[];
}

export interface Product {
  id: ID;
  sku: string;
  slug: string;
  title: string;
  shortTitle: string;
  brandId: ID;
  vendorId: ID;
  categoryId: ID;
  status: ProductStatus;
  price: number;
  mrp: number;
  currency: string;
  taxRatePct: number;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  soldCount: number;
  viewCount30d: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageKind: ImageKind;
  tint: string;
  imageSeeds: string[];
  highlights: string[];
  description: string;
  whatsIncluded: string[];
  specs: { group: string; rows: { label: string; value: string }[] }[];
  attributes: Record<string, string | number | boolean>;
  variants: ProductVariant[];
  warrantyMonths: number;
  returnWindowDays: number;
  freeShipping: boolean;
  codAvailable: boolean;
  weightKg: number;
  dimensionsCm: { l: number; w: number; h: number };
  barcode: string;
  hsnCode: string;
  tags: string[];
  badges: ProductBadge[];
  isFeatured: boolean;
  isDeal: boolean;
  dealEndsAt?: Timestamp;
  moderation?: ModerationRecord;
  fulfilment: 'vendor' | 'marketforge';
  deliveryDays: number;
}

/* ──────────────────────────── Inventory ─────────────────────────────── */

export interface Warehouse {
  id: ID;
  vendorId: ID | null;
  name: string;
  code: string;
  city: string;
  state: string;
  capacityUnits: number;
  usedUnits: number;
  isPrimary: boolean;
}

export interface Inventory {
  id: ID;
  productId: ID;
  vendorId: ID;
  warehouseId: ID;
  sku: string;
  available: number;
  reserved: number;
  incoming: number;
  reorderPoint: number;
  overstockThreshold: number;
  unitCost: number;
  updatedAt: Timestamp;
}

export interface StockMovement {
  id: ID;
  inventoryId: ID;
  vendorId: ID;
  sku: string;
  at: Timestamp;
  type: 'restock' | 'sale' | 'return' | 'adjustment' | 'damage' | 'transfer';
  delta: number;
  balanceAfter: number;
  reference?: string;
  actor: string;
  note?: string;
}

export type InventoryAlertType = 'low_stock' | 'out_of_stock' | 'overstock';

/* ────────────────────────── Cart & wishlist ──────────────────────────── */

export interface CartItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  vendorId: ID;
  quantity: number;
  addedAt: Timestamp;
  priceAtAdd: number;
}

export interface WishlistItem {
  id: ID;
  productId: ID;
  addedAt: Timestamp;
  priceAtAdd: number;
  note?: string;
}

export interface Wishlist {
  id: ID;
  customerId: ID;
  name: string;
  isDefault: boolean;
  visibility: 'private' | 'shared';
  createdAt: Timestamp;
  items: WishlistItem[];
}

/* ─────────────────────────────── Orders ──────────────────────────────── */

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

export type VendorOrderStatus =
  | 'new' | 'accepted' | 'processing' | 'packed' | 'ready_for_pickup'
  | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned' | 'rejected';

export interface OrderTotals {
  itemTotal: number;
  discount: number;
  couponDiscount: number;
  shipping: number;
  tax: number;
  giftCardApplied: number;
  grandTotal: number;
  commission: number;
  vendorPayable: number;
}

export interface OrderItem {
  id: ID;
  orderId: ID;
  productId: ID;
  variantId?: ID;
  vendorId: ID;
  title: string;
  sku: string;
  variantLabel?: string;
  imageKind: ImageKind;
  imageSeed: string;
  tint: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  taxAmount: number;
  discount: number;
  lineTotal: number;
  commissionRate: number;
  commissionAmount: number;
  vendorStatus: VendorOrderStatus;
  returnId?: ID;
  reviewed?: boolean;
}

export interface OrderEvent {
  id: ID;
  at: Timestamp;
  label: string;
  detail?: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
  location?: string;
  actor?: string;
}

export interface Shipment {
  id: ID;
  orderId: ID;
  vendorId: ID;
  itemIds: ID[];
  carrier: string;
  trackingNumber: string;
  status: 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  shippedAt?: Timestamp;
  estimatedDelivery: Timestamp;
  deliveredAt?: Timestamp;
  weightKg: number;
  shippingCost: number;
  checkpoints: { at: Timestamp; label: string; location: string }[];
}

export interface Payment {
  id: ID;
  orderId: ID;
  customerId: ID;
  method: PaymentMethod['kind'];
  methodLabel: string;
  amount: number;
  status: 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded' | 'pending';
  gateway: 'ForgePay' | 'Stripe' | 'Razorpay' | 'PayPal';
  transactionRef: string;
  processedAt: Timestamp;
  cardLast4?: string;
  upiHandle?: string;
  bank?: string;
  feeAmount: number;
  refundedAmount: number;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID;
  placedAt: Timestamp;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  payment: Payment;
  shipments: Shipment[];
  totals: OrderTotals;
  couponCode?: string;
  deliveryMethod: 'standard' | 'express' | 'same_day' | 'pickup';
  promisedBy: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  invoiceNumber: string;
  giftMessage?: string;
  timeline: OrderEvent[];
  channel: 'web' | 'ios' | 'android';
}

/* ──────────────────────── Returns & refunds ─────────────────────────── */

export type ReturnStatus =
  | 'requested' | 'approved' | 'pickup_scheduled' | 'picked_up'
  | 'inspection' | 'refund_initiated' | 'refunded' | 'rejected';

export interface ReviewMedia {
  id: ID;
  kind: 'image' | 'video';
  seed: string;
  tint: string;
  caption?: string;
  durationSec?: number;
}

export interface Return {
  id: ID;
  rma: string;
  orderId: ID;
  orderNumber: string;
  orderItemId: ID;
  productId: ID;
  productTitle: string;
  imageKind: ImageKind;
  tint: string;
  customerId: ID;
  vendorId: ID;
  quantity: number;
  type: 'refund' | 'replacement';
  reason: string;
  reasonCategory: 'damaged' | 'wrong_item' | 'not_as_described' | 'size_fit' | 'quality' | 'no_longer_needed' | 'late_delivery';
  comments: string;
  status: ReturnStatus;
  requestedAt: Timestamp;
  updatedAt: Timestamp;
  refundMethod: 'original' | 'wallet' | 'bank' | 'gift_card';
  refundAmount: number;
  pickupSlot?: string;
  media: ReviewMedia[];
  timeline: OrderEvent[];
  inspectionNote?: string;
  rejectionReason?: string;
}

export interface Refund {
  id: ID;
  returnId?: ID;
  orderId: ID;
  orderNumber: string;
  customerId: ID;
  vendorId: ID;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'original' | 'wallet' | 'bank' | 'gift_card';
  initiatedAt: Timestamp;
  completedAt?: Timestamp;
  reference: string;
  reason: string;
  bearer: 'vendor' | 'platform' | 'shared';
}

/* ────────────────────────── Reviews & ratings ───────────────────────── */

export interface Review {
  id: ID;
  productId: ID;
  vendorId: ID;
  customerId: ID;
  customerName: string;
  avatarSeed: string;
  orderId?: ID;
  rating: number;
  title: string;
  body: string;
  createdAt: Timestamp;
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  media: ReviewMedia[];
  variantLabel?: string;
  status: 'published' | 'pending' | 'flagged' | 'removed';
  vendorResponse?: { body: string; at: Timestamp; author: string };
  reported: boolean;
  location: string;
}

export interface SellerRating {
  id: ID;
  vendorId: ID;
  customerName: string;
  orderId: ID;
  packaging: number;
  accuracy: number;
  shippingSpeed: number;
  communication: number;
  overall: number;
  comment: string;
  createdAt: Timestamp;
}

export interface ProductQuestion {
  id: ID;
  productId: ID;
  askedBy: string;
  askedAt: Timestamp;
  question: string;
  votes: number;
  answers: {
    id: ID;
    body: string;
    author: string;
    authorType: 'vendor' | 'customer' | 'marketforge';
    at: Timestamp;
    helpfulCount: number;
  }[];
}

/* ──────────────────── Promotions, coupons, commission ───────────────── */

export type PromotionType =
  | 'percentage' | 'fixed' | 'product' | 'category' | 'vendor'
  | 'bxgy' | 'free_shipping' | 'flash_sale';

export interface Promotion {
  id: ID;
  name: string;
  type: PromotionType;
  status: 'scheduled' | 'active' | 'paused' | 'expired' | 'draft';
  description: string;
  discountValue: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  scope: { vendorIds: ID[]; categoryIds: ID[]; productIds: ID[] };
  ownerType: 'platform' | 'vendor';
  vendorId?: ID;
  createdBy: string;
  metrics: { impressions: number; redemptions: number; revenue: number; uplift: number };
  bxgy?: { buyQty: number; getQty: number };
  tint: string;
}

export interface Coupon {
  id: ID;
  code: string;
  promotionId?: ID;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountAmount: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  applicableVendorIds: ID[];
  applicableCategoryIds: ID[];
  applicableProductIds: ID[];
  firstOrderOnly: boolean;
  stackable: boolean;
  createdAt: Timestamp;
  createdBy: string;
  description: string;
}

export interface GiftCard {
  id: ID;
  code: string;
  balance: number;
  initialValue: number;
  issuedAt: Timestamp;
  expiresAt: Timestamp;
  status: 'active' | 'redeemed' | 'expired';
}

export interface Commission {
  id: ID;
  scope: 'global' | 'vendor' | 'category' | 'product';
  scopeId?: ID;
  scopeLabel: string;
  ratePct: number;
  fixedFee: number;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  status: 'active' | 'scheduled' | 'archived';
  updatedBy: string;
  updatedAt: Timestamp;
  note?: string;
  priority: number;
}

/* ───────────────────────────── Payouts ─────────────────────────────── */

export interface Payout {
  id: ID;
  vendorId: ID;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  grossSales: number;
  commission: number;
  tax: number;
  shippingFees: number;
  refunds: number;
  adjustments: number;
  netAmount: number;
  status: 'pending' | 'scheduled' | 'processing' | 'paid' | 'on_hold' | 'failed';
  scheduledFor: Timestamp;
  paidAt?: Timestamp;
  reference: string;
  method: 'bank_transfer' | 'upi' | 'wire';
  orderCount: number;
}

/* ─────────────────── Shipping & logistics config ───────────────────── */

export interface ShippingZone {
  id: ID;
  name: string;
  regions: string[];
  isActive: boolean;
  methodIds: ID[];
  codAvailable: boolean;
}

export interface ShippingMethod {
  id: ID;
  name: string;
  code: string;
  carrierId: ID;
  minDays: number;
  maxDays: number;
  baseRate: number;
  perKgRate: number;
  freeAbove?: number;
  isActive: boolean;
  supportsCod: boolean;
}

export interface DeliveryPartner {
  id: ID;
  name: string;
  code: string;
  coverage: string;
  onTimeRate: number;
  avgTransitDays: number;
  status: 'active' | 'paused' | 'onboarding';
  supportPhone: string;
  shipments30d: number;
  costIndex: number;
  tint: string;
}

/* ──────────────────── Disputes, support, notifications ─────────────── */

export type DisputeStatus =
  | 'open' | 'under_review' | 'waiting_customer' | 'waiting_vendor' | 'resolved' | 'closed';

export interface ConversationMessage {
  id: ID;
  authorType: 'customer' | 'vendor' | 'agent' | 'system';
  authorName: string;
  avatarSeed: string;
  body: string;
  at: Timestamp;
  attachments?: { id: ID; label: string; seed: string }[];
  internal?: boolean;
}

export interface Dispute {
  id: ID;
  reference: string;
  orderId: ID;
  orderNumber: string;
  customerId: ID;
  customerName: string;
  vendorId: ID;
  raisedBy: 'customer' | 'vendor';
  subject: string;
  category: 'item_not_received' | 'not_as_described' | 'refund_not_received' | 'damaged' | 'chargeback' | 'policy_violation';
  amountInDispute: number;
  status: DisputeStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  openedAt: Timestamp;
  updatedAt: Timestamp;
  slaDueAt: Timestamp;
  assigneeName?: string;
  messages: ConversationMessage[];
  evidence: { id: ID; label: string; kind: 'image' | 'document' | 'log'; seed: string; uploadedBy: string; at: Timestamp }[];
  resolution?: { outcome: 'refund_customer' | 'favour_vendor' | 'partial_refund' | 'replacement' | 'no_action'; amount: number; note: string; at: Timestamp; by: string };
}

export interface SupportTicket {
  id: ID;
  reference: string;
  subject: string;
  requesterType: 'customer' | 'vendor';
  requesterId: ID;
  requesterName: string;
  category: 'order' | 'payment' | 'account' | 'product' | 'returns' | 'technical' | 'vendor_onboarding';
  orderNumber?: string;
  status: 'open' | 'pending' | 'on_hold' | 'solved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: 'chat' | 'email' | 'phone' | 'web';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  firstResponseMins?: number;
  assigneeName?: string;
  satisfaction?: 'good' | 'bad';
  messages: ConversationMessage[];
  tags: string[];
}

export type NotificationAudience = 'customer' | 'vendor' | 'admin';

export type NotificationKind =
  | 'order_update' | 'delivery' | 'refund' | 'promotion' | 'price_drop' | 'back_in_stock'
  | 'new_order' | 'product_approval' | 'low_inventory' | 'payout' | 'review'
  | 'vendor_application' | 'moderation' | 'dispute' | 'payment_issue' | 'system';

export interface Notification {
  id: ID;
  audience: NotificationAudience;
  recipientId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  at: Timestamp;
  read: boolean;
  href?: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface AuditLog {
  id: ID;
  at: Timestamp;
  actorName: string;
  actorRole: Role;
  action: string;
  resourceType: 'vendor' | 'product' | 'order' | 'customer' | 'commission' | 'coupon' | 'payout' | 'refund' | 'category' | 'settings' | 'dispute' | 'user';
  resourceId: ID;
  resourceLabel: string;
  ip: string;
  device: string;
  location: string;
  severity: 'info' | 'warning' | 'critical';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
}

/* ─────────────────────────── View helpers ──────────────────────────── */

export interface FaqEntry {
  id: ID;
  topic: string;
  question: string;
  answer: string;
  helpful: number;
}

export interface SearchSuggestion {
  kind: 'product' | 'brand' | 'category' | 'query' | 'vendor';
  label: string;
  sublabel?: string;
  href: string;
}

export interface SeriesPoint {
  date: string;
  label: string;
  [metric: string]: number | string;
}
