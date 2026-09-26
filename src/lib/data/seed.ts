import { Rng, daysAgo, daysAhead, makeId } from '../rng';
import { categories, brands, brandByName, deliveryPartners, warehouses } from './taxonomy';
import type {
  Address, AuditLog, Commission, ConversationMessage, Coupon, Customer, DisputeStatus, Dispute,
  GiftCard, ImageKind, Inventory, Notification, Order, OrderEvent, OrderItem, OrderStatus, Payment,
  PaymentMethod, Product, ProductBadge, ProductQuestion, ProductVariant, Promotion, Refund, Return,
  Payout, ReturnStatus, Review, ReviewMedia, SellerRating, Shipment, StockMovement, SupportTicket, User,
  Vendor, VendorDocument, VendorOrderStatus, VendorStore, VendorVerification, Wishlist,
} from '../types';

/* ─────────────────────────────── Vendors ────────────────────────────────── */

interface VendorSeed {
  name: string; legal: string; tagline: string; cats: string[]; city: string; state: string;
  status: Vendor['status']; tint: string; years: number; fbm?: boolean;
}

const VENDOR_SEEDS: VendorSeed[] = [
  { name: 'TechWorld', legal: 'Techworld Retail Pvt. Ltd.', tagline: 'Consumer electronics, honestly priced', cats: ['electronics', 'computers', 'mobiles'], city: 'Bengaluru', state: 'Karnataka', status: 'approved', tint: '#1D4ED8', years: 6, fbm: true },
  { name: 'HomeHub', legal: 'HomeHub Living LLP', tagline: 'Considered objects for everyday rooms', cats: ['home-kitchen'], city: 'Jaipur', state: 'Rajasthan', status: 'approved', tint: '#B45309', years: 4 },
  { name: 'Northloom Studio', legal: 'Northloom Apparel Pvt. Ltd.', tagline: 'Slow-made cotton and linen', cats: ['fashion'], city: 'Ahmedabad', state: 'Gujarat', status: 'approved', tint: '#9D174D', years: 5 },
  { name: 'PixelPeak', legal: 'PixelPeak Devices Pvt. Ltd.', tagline: 'Computing for makers and studios', cats: ['computers', 'electronics'], city: 'Pune', state: 'Maharashtra', status: 'approved', tint: '#0F766E', years: 3, fbm: true },
  { name: 'GlowRoom', legal: 'GlowRoom Beauty Pvt. Ltd.', tagline: 'Dermatologist-tested, fragrance-optional', cats: ['beauty'], city: 'Mumbai', state: 'Maharashtra', status: 'approved', tint: '#BE185D', years: 4 },
  { name: 'Roast Republic', legal: 'Roast Republic Coffee Co.', tagline: 'Single-estate coffee, roasted weekly', cats: ['grocery'], city: 'Coorg', state: 'Karnataka', status: 'approved', tint: '#78350F', years: 7 },
  { name: 'Ironpeak Sports', legal: 'Ironpeak Fitness India Pvt. Ltd.', tagline: 'Gym-grade equipment for home floors', cats: ['sports'], city: 'Gurugram', state: 'Haryana', status: 'approved', tint: '#C2410C', years: 5 },
  { name: 'Sundial Books', legal: 'Sundial Press Distribution', tagline: 'Independent publishing, curated', cats: ['books'], city: 'Kolkata', state: 'West Bengal', status: 'approved', tint: '#7C3AED', years: 9 },
  { name: 'Brickwright Toys', legal: 'Brickwright Play Pvt. Ltd.', tagline: 'Build-first play for curious kids', cats: ['toys'], city: 'Chennai', state: 'Tamil Nadu', status: 'approved', tint: '#0E7490', years: 3 },
  { name: 'Axlecraft Auto', legal: 'Axlecraft Components Pvt. Ltd.', tagline: 'Garage-tested car care and parts', cats: ['automotive'], city: 'Pune', state: 'Maharashtra', status: 'approved', tint: '#334155', years: 6 },
  { name: 'Cadenza Audio', legal: 'Cadenza Sound Labs Pvt. Ltd.', tagline: 'Reference audio for small rooms', cats: ['electronics'], city: 'Hyderabad', state: 'Telangana', status: 'approved', tint: '#4C1D95', years: 2 },
  { name: 'Everkeep Kitchen', legal: 'Everkeep Homeware Pvt. Ltd.', tagline: 'Cookware built to be inherited', cats: ['home-kitchen', 'grocery'], city: 'Kochi', state: 'Kerala', status: 'approved', tint: '#0F766E', years: 4 },
  { name: 'Velo Cycles', legal: 'Velo Mobility Pvt. Ltd.', tagline: 'City bikes and everything for them', cats: ['sports', 'automotive'], city: 'Bengaluru', state: 'Karnataka', status: 'under_review', tint: '#15803D', years: 1 },
  { name: 'Saffron & Salt', legal: 'Saffron and Salt Foods LLP', tagline: 'Regional pantry, small batches', cats: ['grocery'], city: 'Chennai', state: 'Tamil Nadu', status: 'submitted', tint: '#B45309', years: 1 },
  { name: 'Lumen Lighting', legal: 'Lumen Lighting Works Pvt. Ltd.', tagline: 'Warm light, engineered', cats: ['home-kitchen'], city: 'Noida', state: 'Uttar Pradesh', status: 'suspended', tint: '#C2410C', years: 3 },
  { name: 'Zenith Mobiles', legal: 'Zenith Cellular Trading Co.', tagline: 'Phones and accessories, fast dispatch', cats: ['mobiles'], city: 'Delhi', state: 'Delhi', status: 'rejected', tint: '#4C5FD7', years: 1 },
];

export const vendors: Vendor[] = VENDOR_SEEDS.map((v, i) => {
  const r = new Rng(`vendor:${v.name}`);
  const approved = v.status === 'approved';
  const rating = approved ? r.float(3.9, 4.9, 1) : r.float(3.4, 4.4, 1);
  return {
    id: `ven_${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: v.name,
    legalName: v.legal,
    tagline: v.tagline,
    about: `${v.name} has been trading on MarketForge since ${2026 - v.years}. The team operates out of ${v.city}, ${v.state}, ships ${approved ? 'six days a week' : 'on weekdays'} and handles support in English and Hindi. Every listing is inspected before dispatch and packed in recyclable material.`,
    logoSeed: `logo-${i}`,
    status: v.status,
    joinedAt: daysAgo(v.years * 365 + r.int(0, 200)),
    homeCity: v.city,
    homeState: v.state,
    country: 'India',
    categories: v.cats.map((c) => `cat_${c}`),
    rating,
    ratingCount: approved ? r.int(420, 9800) : r.int(0, 60),
    productCount: 0,
    orderCount: approved ? r.int(1200, 24000) : r.int(0, 80),
    grossSales: approved ? r.int(3_800_000, 84_000_000) : r.int(0, 400_000),
    commissionRate: r.pick([8, 9.5, 10, 11, 12, 12.5, 14, 15]),
    fulfilmentRate: r.float(94, 99.6, 1),
    onTimeShipRate: r.float(88, 99.2, 1),
    cancellationRate: r.float(0.3, 3.4, 1),
    returnRate: r.float(1.1, 7.8, 1),
    responseTimeHours: r.float(0.6, 11, 1),
    contactName: r.pick(['Ananya Rao', 'Rohit Menon', 'Farhan Qureshi', 'Divya Iyer', 'Karan Malhotra', 'Sneha Pillai', 'Vikram Sethi', 'Ritu Bansal']),
    contactEmail: `sellers@${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.in`,
    contactPhone: `+91 ${r.int(70, 99)}${r.int(10000000, 99999999)}`,
    badges: [
      ...(rating >= 4.6 ? ['Top Rated Seller'] : []),
      ...(v.fbm ? ['Fulfilled by MarketForge'] : []),
      ...(v.years >= 5 ? ['5+ Years'] : []),
    ],
    fulfilledByMarketForge: Boolean(v.fbm),
    tint: v.tint,
  };
});

export const vendorById = new Map(vendors.map((v) => [v.id, v]));
export const activeVendors = vendors.filter((v) => v.status === 'approved');

const DOC_TYPES: VendorDocument['type'][] = ['business_registration', 'tax_certificate', 'bank_statement', 'owner_id', 'address_proof'];
const DOC_LABELS: Record<VendorDocument['type'], string> = {
  business_registration: 'Certificate of Incorporation.pdf',
  tax_certificate: 'GST Registration Certificate.pdf',
  bank_statement: 'Bank Statement — Jun 2026.pdf',
  owner_id: 'Director PAN & Aadhaar.pdf',
  address_proof: 'Warehouse Lease Agreement.pdf',
};

const STEP_LABELS: [VendorVerification['steps'][number]['key'], string][] = [
  ['business', 'Business information'], ['owner', 'Owner information'], ['address', 'Business address'],
  ['tax', 'Tax information'], ['bank', 'Bank account'], ['documents', 'Documents'],
  ['categories', 'Product categories'], ['store', 'Store configuration'], ['review', 'Verification'],
];

export const vendorVerifications: VendorVerification[] = vendors.map((v) => {
  const r = new Rng(`verify:${v.id}`);
  const progress =
    v.status === 'approved' || v.status === 'suspended' ? 9
      : v.status === 'under_review' ? 9
      : v.status === 'submitted' ? 8
      : v.status === 'rejected' ? 9 : 4;
  return {
    id: makeId('vrf', v.id),
    vendorId: v.id,
    status: v.status,
    submittedAt: progress >= 8 ? daysAgo(r.int(3, 900)) : undefined,
    reviewedAt: ['approved', 'rejected', 'suspended'].includes(v.status) ? daysAgo(r.int(2, 880)) : undefined,
    reviewerName: ['approved', 'rejected', 'suspended'].includes(v.status) ? r.pick(['Priya Nair', 'Aditya Kulkarni', 'Meera Joshi']) : undefined,
    rejectionReason: v.status === 'rejected'
      ? 'Bank account holder name does not match the registered business name, and the GST certificate supplied has expired.'
      : undefined,
    steps: STEP_LABELS.map(([key, label], i) => ({
      key,
      label,
      state: i < progress ? 'complete' : i === progress ? (v.status === 'draft' ? 'in_progress' : 'action_required') : 'pending',
      completedAt: i < progress ? daysAgo(r.int(4, 920)) : undefined,
      note: i === progress && v.status === 'submitted' ? 'Awaiting compliance review' : undefined,
    })),
    documents: DOC_TYPES.slice(0, progress >= 6 ? 5 : 2).map((t) => ({
      id: makeId('doc', `${v.id}${t}`),
      type: t,
      fileName: DOC_LABELS[t],
      sizeKb: r.int(180, 4400),
      uploadedAt: daysAgo(r.int(3, 700)),
      status: v.status === 'approved' ? 'verified' : v.status === 'rejected' && t === 'tax_certificate' ? 'rejected' : 'pending',
      note: v.status === 'rejected' && t === 'tax_certificate' ? 'Certificate expired on 31 Mar 2026' : undefined,
    })),
    tax: {
      taxId: `TAX${r.int(100000, 999999)}`,
      gstin: `${r.int(10, 36)}${['AABCT', 'AAFCH', 'AADCN', 'AAGCP'][r.int(0, 3)]}${r.int(1000, 9999)}${['A', 'B', 'C'][r.int(0, 2)]}1Z${r.int(1, 9)}`,
      panOrEin: `${['AABCT', 'AAFCH', 'AADCN'][r.int(0, 2)]}${r.int(1000, 9999)}${['A', 'K', 'M'][r.int(0, 2)]}`,
      registeredCountry: 'India',
      taxScheme: r.pick(['regular', 'regular', 'composition']),
    },
    bank: {
      accountHolder: v.legalName,
      accountNumberMasked: `XXXXXX${r.int(1000, 9999)}`,
      ifscOrRouting: `${['HDFC', 'ICIC', 'SBIN', 'AXIS'][r.int(0, 3)]}000${r.int(1000, 9999)}`,
      bankName: r.pick(['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank']),
      branch: `${v.homeCity} — ${r.pick(['MG Road', 'Industrial Area', 'Sector 18', 'Park Street'])}`,
      verified: v.status === 'approved',
    },
    business: {
      legalName: v.legalName,
      displayName: v.name,
      entityType: r.pick(['private_limited', 'private_limited', 'llp', 'partnership', 'sole_proprietor']),
      registrationNumber: `U${r.int(10000, 99999)}KA${2026 - r.int(1, 12)}PTC${r.int(100000, 999999)}`,
      incorporationYear: 2026 - r.int(2, 16),
      website: `https://www.${v.slug.replace(/-/g, '')}.in`,
      employeeCount: r.pick(['1-10', '11-50', '51-200', '201-500']),
      annualRevenueBand: r.pick(['₹50L - ₹2Cr', '₹2Cr - ₹10Cr', '₹10Cr - ₹50Cr', '₹50Cr+']),
    },
    owner: {
      fullName: v.contactName,
      email: v.contactEmail,
      phone: v.contactPhone,
      dateOfBirth: `${r.int(1970, 1995)}-0${r.int(1, 9)}-${r.int(10, 28)}`,
      idType: r.pick(['national_id', 'passport', 'driving_licence']),
      idNumberMasked: `XXXX XXXX ${r.int(1000, 9999)}`,
    },
    address: {
      line1: `${r.int(1, 240)}, ${r.pick(['Prestige Tech Park', 'Lodha Industrial Estate', 'Ambience Corporate Centre', 'DLF Cyber Hub'])}`,
      line2: `${r.pick(['Block B', 'Tower 3', 'Unit 14', 'Wing A'])}, ${r.pick(['Whitefield', 'Andheri East', 'Sector 44', 'Guindy'])}`,
      city: v.homeCity,
      state: v.homeState,
      postalCode: String(r.int(110001, 700099)),
      country: 'India',
    },
  };
});

export const verificationByVendor = new Map(vendorVerifications.map((v) => [v.vendorId, v]));

/* ─────────────────────────────── Products ───────────────────────────────── */

/** [title, brand, categorySlug, subcategory, imageKind, price, mrp] */
type ProdSeed = [string, string, string, string, ImageKind, number, number];

const PRODUCT_SEEDS: ProdSeed[] = [
  // Electronics
  ['Auralis Vox 700 Wireless Over-Ear Headphones', 'Auralis', 'electronics', 'headphones-earbuds', 'headphone', 24990, 32990],
  ['Auralis Vox Air Pro ANC Earbuds', 'Auralis', 'electronics', 'headphones-earbuds', 'headphone', 9499, 14999],
  ['Cadenza Reference C3 Bookshelf Speakers (Pair)', 'Cadenza', 'electronics', 'speakers', 'speaker', 42500, 54000],
  ['Cadenza Motif Portable Bluetooth Speaker', 'Cadenza', 'electronics', 'speakers', 'speaker', 6799, 9499],
  ['Nordveil Pulse 3 GPS Smartwatch', 'Nordveil', 'electronics', 'smartwatches', 'watch', 18999, 24999],
  ['Nordveil Trace Lite Fitness Band', 'Nordveil', 'electronics', 'smartwatches', 'watch', 3299, 4999],
  ['Halcyon Optic X20 Mirrorless Camera (Body)', 'Halcyon', 'electronics', 'cameras', 'camera', 87990, 104990],
  ['Halcyon Optic Vlog Kit 24mm f/1.8', 'Halcyon', 'electronics', 'cameras', 'camera', 31499, 38999],
  ['Pixelforge Vista 55" 4K QLED Smart TV', 'Pixelforge', 'electronics', 'televisions', 'tv', 54990, 74990],
  ['Pixelforge Vista 43" 4K LED Smart TV', 'Pixelforge', 'electronics', 'televisions', 'tv', 28490, 39990],
  ['Pixelforge Arc Wireless Gaming Controller', 'Pixelforge', 'electronics', 'gaming', 'console', 4999, 6499],
  // Computers
  ['Volterra Studio 14 Laptop — Core Ultra 7 / 16GB / 1TB', 'Volterra', 'computers', 'laptops', 'laptop', 124990, 149990],
  ['Volterra Studio 16 Creator Laptop — Ryzen 7 / 32GB', 'Volterra', 'computers', 'laptops', 'laptop', 168500, 189900],
  ['Nordveil Slate 13 Ultralight Laptop', 'Nordveil', 'computers', 'laptops', 'laptop', 78990, 92990],
  ['Pixelforge Vantage 27" 4K USB-C Monitor', 'Pixelforge', 'computers', 'monitors', 'tv', 38990, 47990],
  ['Pixelforge Vantage 34" Ultrawide Monitor', 'Pixelforge', 'computers', 'monitors', 'tv', 62490, 74990],
  ['Volterra Tactile 75 Mechanical Keyboard', 'Volterra', 'computers', 'keyboards-mice', 'console', 11999, 14499],
  ['Nordveil Glide Ergonomic Wireless Mouse', 'Nordveil', 'computers', 'keyboards-mice', 'console', 4299, 5799],
  ['Pixelforge Vault 2TB Portable NVMe SSD', 'Pixelforge', 'computers', 'storage', 'console', 16999, 21999],
  // Mobiles
  ['Kestrel K9 Pro 5G — 12GB / 256GB', 'Kestrel', 'mobiles', 'smartphones', 'phone', 68999, 79999],
  ['Kestrel K9 5G — 8GB / 128GB', 'Kestrel', 'mobiles', 'smartphones', 'phone', 42499, 49999],
  ['Kestrel Nova Lite 5G — 6GB / 128GB', 'Kestrel', 'mobiles', 'smartphones', 'phone', 18999, 22999],
  ['Halcyon Tab S11 11" Tablet — 8GB / 256GB', 'Halcyon', 'mobiles', 'tablets', 'phone', 44990, 52990],
  ['Kestrel ArmourShell Case for K9 Pro', 'Kestrel', 'mobiles', 'cases-covers', 'bag', 1299, 1999],
  ['Halcyon FastCharge 65W GaN Charger', 'Halcyon', 'mobiles', 'chargers-cables', 'console', 2799, 3999],
  ['Halcyon PowerCell 20000mAh Power Bank', 'Halcyon', 'mobiles', 'power-banks', 'console', 3499, 4999],
  // Home & Kitchen
  ['Everkeep Triply Stainless Steel Frypan 26cm', 'Everkeep', 'home-kitchen', 'cookware', 'cookware', 3299, 4599],
  ['Everkeep Cast Iron Dutch Oven 4.5L', 'Everkeep', 'home-kitchen', 'cookware', 'cookware', 6899, 9499],
  ['Everkeep Chef Series 5-Piece Cookware Set', 'Everkeep', 'home-kitchen', 'cookware', 'cookware', 12499, 17999],
  ['Lumen&Co Arcline Adjustable Desk Lamp', 'Lumen&Co', 'home-kitchen', 'lighting', 'lamp', 4699, 6299],
  ['Lumen&Co Halo Pendant Light — Brass', 'Lumen&Co', 'home-kitchen', 'lighting', 'lamp', 8990, 11990],
  ['Cindermill Solid Sheesham Study Desk', 'Cindermill', 'home-kitchen', 'furniture', 'chair', 21499, 28999],
  ['Cindermill Ridge Ergonomic Office Chair', 'Cindermill', 'home-kitchen', 'furniture', 'chair', 15990, 21990],
  ['Terracove Stoneware Dinner Set — 16 Piece', 'Terracove', 'home-kitchen', 'home-decor', 'cookware', 5499, 7999],
  ['Everkeep Vacuum Insulated Bottle 1L', 'Everkeep', 'home-kitchen', 'storage-organisation', 'bottle', 1899, 2599],
  // Fashion
  ['Northloom Everyday Cotton Oxford Shirt', 'Northloom', 'fashion', 'mens-clothing', 'apparel', 2499, 3499],
  ['Northloom Linen Blend Relaxed Shirt', 'Northloom', 'fashion', 'mens-clothing', 'apparel', 2899, 3999],
  ['Northloom Merino Crew Neck Sweater', 'Northloom', 'fashion', 'womens-clothing', 'apparel', 4799, 6499],
  ['Northloom Handloom Cotton Kurta', 'Northloom', 'fashion', 'womens-clothing', 'apparel', 2199, 2999],
  ['Marrow Trail Runner GTX Shoes', 'Marrow', 'fashion', 'footwear', 'shoe', 8999, 11999],
  ['Marrow Court Classic Leather Sneakers', 'Marrow', 'fashion', 'footwear', 'shoe', 5499, 7499],
  ['Veldt Ranger 32L Travel Backpack', 'Veldt', 'fashion', 'bags-luggage', 'bag', 6499, 8999],
  ['Veldt Weekender Duffel — Waxed Canvas', 'Veldt', 'fashion', 'bags-luggage', 'bag', 7899, 10499],
  ['Nordveil Meridian Automatic Watch', 'Nordveil', 'fashion', 'watches-accessories', 'watch', 22999, 29999],
  // Beauty
  ['Botanica Rye Barrier Repair Moisturiser 50ml', 'Botanica Rye', 'beauty', 'skincare', 'cosmetic', 1899, 2400],
  ['Botanica Rye Niacinamide 10% Serum 30ml', 'Botanica Rye', 'beauty', 'skincare', 'cosmetic', 1299, 1699],
  ['Botanica Rye Mineral Sunscreen SPF 50 PA++++', 'Botanica Rye', 'beauty', 'skincare', 'cosmetic', 1099, 1450],
  ['Ashgrove Rosemary Scalp Strengthening Oil', 'Ashgrove', 'beauty', 'haircare', 'cosmetic', 899, 1299],
  ['Glasswing Amber Neroli Eau de Parfum 50ml', 'Glasswing', 'beauty', 'fragrance', 'cosmetic', 4899, 6500],
  ['Ashgrove Precision Beard Trimmer Kit', 'Ashgrove', 'beauty', 'grooming', 'cosmetic', 2799, 3999],
  // Grocery
  ['Roast Republic Estate Reserve Coffee Beans 500g', 'Roast Republic', 'grocery', 'coffee-tea', 'grocery', 899, 1150],
  ['Roast Republic Cold Brew Filter Blend 250g', 'Roast Republic', 'grocery', 'coffee-tea', 'grocery', 549, 699],
  ['Saffron & Salt Cold Pressed Groundnut Oil 1L', 'Saffron & Salt', 'grocery', 'oils-condiments', 'grocery', 465, 590],
  ['Saffron & Salt Kashmiri Saffron 2g', 'Saffron & Salt', 'grocery', 'staples', 'grocery', 1290, 1650],
  ['Terracove Millet Multigrain Crackers 300g', 'Terracove', 'grocery', 'snacks', 'grocery', 249, 320],
  ['Ashgrove Plant Protein Blend 1kg', 'Ashgrove', 'grocery', 'health-foods', 'grocery', 2199, 2899],
  // Sports
  ['Ironpeak Hex Rubber Dumbbell Pair 10kg', 'Ironpeak', 'sports', 'fitness-equipment', 'ball', 4299, 5799],
  ['Ironpeak Olympic Barbell 20kg + Plate Set', 'Ironpeak', 'sports', 'fitness-equipment', 'ball', 18990, 24999],
  ['Ironpeak Pro Grip Yoga Mat 6mm', 'Ironpeak', 'sports', 'activewear', 'ball', 1899, 2599],
  ['Trailmark Match Football — FIFA Basic', 'Trailmark', 'sports', 'team-sports', 'ball', 1499, 1999],
  ['Trailmark Summit 45L Trekking Rucksack', 'Trailmark', 'sports', 'outdoor-camping', 'bag', 5299, 6999],
  ['Velo City 7-Speed Commuter Bicycle', 'Trailmark', 'sports', 'cycling', 'carpart', 27990, 34990],
  // Books
  ['Sundial Press — The Marketplace Effect (Hardcover)', 'Sundial Press', 'books', 'business-economics', 'book', 799, 1099],
  ['Sundial Press — Systems of Small Cities', 'Sundial Press', 'books', 'design-architecture', 'book', 1450, 1899],
  ['Sundial Press — The Longest Monsoon (Fiction)', 'Sundial Press', 'books', 'fiction', 'book', 499, 699],
  ['Sundial Press — Atlas of Curious Machines (Kids)', 'Sundial Press', 'books', 'children', 'book', 899, 1199],
  // Toys
  ['Brickwright Harbour Crane Building Set — 1,240 pcs', 'Brickwright', 'toys', 'building-sets', 'toy', 4999, 6499],
  ['Brickwright Circuit Lab STEM Kit', 'Brickwright', 'toys', 'stem-learning', 'toy', 2899, 3799],
  ['Brickwright Trade Routes Strategy Board Game', 'Brickwright', 'toys', 'board-games', 'toy', 2199, 2899],
  // Automotive
  ['Axlecraft Ceramic Shield Car Wax Kit', 'Axlecraft', 'automotive', 'car-care', 'carpart', 2499, 3299],
  ['Axlecraft Forged Alloy Wheel 17" (Single)', 'Axlecraft', 'automotive', 'wheels-tyres', 'carpart', 14990, 18990],
  ['Axlecraft DashSight 2K Dash Camera', 'Axlecraft', 'automotive', 'electronics-dash-cams', 'carpart', 8499, 10999],
  ['Axlecraft All-Weather Floor Mat Set', 'Axlecraft', 'automotive', 'interior-accessories', 'carpart', 3299, 4499],
];

const VENDOR_BY_CAT: Record<string, string[]> = {
  electronics: ['ven_techworld', 'ven_cadenzaaudio', 'ven_pixelpeak'],
  computers: ['ven_pixelpeak', 'ven_techworld'],
  mobiles: ['ven_techworld', 'ven_zenithmobiles'],
  'home-kitchen': ['ven_homehub', 'ven_everkeepkitchen', 'ven_lumenlighting'],
  fashion: ['ven_northloomstudio'],
  beauty: ['ven_glowroom'],
  grocery: ['ven_roastrepublic', 'ven_saffronsalt', 'ven_everkeepkitchen'],
  sports: ['ven_ironpeaksports', 'ven_velocycles'],
  books: ['ven_sundialbooks'],
  toys: ['ven_brickwrighttoys'],
  automotive: ['ven_axlecraftauto'],
};

const HIGHLIGHTS_BY_KIND: Partial<Record<ImageKind, string[]>> = {
  headphone: ['Hybrid active noise cancellation with 3 transparency levels', 'Up to 48 hours playback, 5 hours from a 10-minute charge', 'Multipoint pairing across two devices', 'Memory-foam earcups with replaceable pads', 'Companion app with 8-band custom EQ'],
  phone: ['6.7" 120Hz LTPO AMOLED, 2,600 nits peak', 'Triple camera with 50MP OIS main sensor', '5,200mAh battery with 80W wired charging', '5 years of OS and security updates', 'IP68 dust and water resistance'],
  laptop: ['14" 3K 120Hz display, 100% DCI-P3', 'All-metal chassis at 1.29kg', 'Up to 17 hours of mixed-use battery', 'Two Thunderbolt 4 ports, full-size HDMI 2.1', 'Backlit keyboard with 1.5mm travel'],
  watch: ['Dual-band GPS with route-back navigation', '14-day battery in smartwatch mode', 'ECG, SpO2 and skin-temperature sensors', '5ATM water resistance for pool swims', '160+ sport modes with auto-detection'],
  camera: ['26MP back-illuminated APS-C sensor', '7-stop in-body image stabilisation', '4K/60p 10-bit internal recording', 'Weather-sealed magnesium alloy body', 'Dual card slots with relay recording'],
  tv: ['Quantum dot panel with 1,000 nits peak brightness', 'Dolby Vision IQ and Dolby Atmos', '4 HDMI 2.1 ports with 120Hz VRR', 'Far-field mics with hands-free voice', '3-year on-site panel warranty'],
  speaker: ['Twin 5.25" woofers with silk-dome tweeters', 'Class-D amplification, 120W RMS', 'Bluetooth 5.3 aptX HD and optical in', 'CNC-machined aluminium baffle', 'Room-correction via companion app'],
  console: ['Machined aluminium frame', 'Hot-swappable switches, factory lubed', 'USB-C and 2.4GHz low-latency wireless', '4,000mAh battery, 90 days standby', 'Per-key RGB with onboard profiles'],
  apparel: ['Long-staple combed cotton, 140 GSM', 'Pre-shrunk and enzyme-washed', 'Mother-of-pearl buttons', 'Reinforced side seams and gussets', 'Made in a Fair Trade certified unit'],
  shoe: ['Nitrogen-infused foam midsole', 'Recycled knit upper, 62% post-consumer', 'Gusseted tongue keeps grit out', 'Vibram outsole with 4mm lugs', '10mm heel-to-toe drop'],
  bag: ['1680D ballistic nylon with DWR finish', 'Padded 16" laptop sleeve', 'YKK AquaGuard zips throughout', 'Luggage pass-through strap', 'Lifetime hardware warranty'],
  cosmetic: ['Fragrance-free and non-comedogenic', 'Dermatologist tested on sensitive skin', 'Ceramide and squalane complex', 'Airless pump keeps actives stable', 'Cruelty-free, vegan formulation'],
  bottle: ['18/8 food-grade stainless steel', '24h cold, 12h hot retention', 'Leak-proof twin-lid system', 'Powder-coated non-slip finish', 'Fits standard cup holders'],
  book: ['Smyth-sewn binding lies flat', 'FSC-certified uncoated paper', 'Includes 24 pages of plates', 'Foil-stamped cloth cover', 'Printed and bound in India'],
  ball: ['Solid cast iron with rubber encasement', 'Knurled chrome handle for dry grip', 'Flat hex faces prevent rolling', 'Tested to 40,000 drop cycles', 'Backed by a 5-year warranty'],
  lamp: ['Stepless dimming from 5% to 100%', 'CRI 95+ across 2700K to 5000K', 'Weighted base, single-hand adjust', 'Flicker-free driver, TÜV certified', 'USB-C pass-through charging'],
  cookware: ['Triply construction with aluminium core', 'Induction, gas and oven safe to 260°C', 'Riveted stay-cool cast handle', 'Even heat spread, no hot spots', 'Dishwasher safe, 10-year warranty'],
  chair: ['Solid hardwood frame, mortise joints', 'High-resilience moulded foam', 'Breathable knit mesh back', '4D adjustable armrests', 'BIFMA tested to 136kg'],
  toy: ['1,240 precision-moulded pieces', 'Illustrated 92-page build manual', 'ASTM F963 and EN71 certified', 'Compatible with standard brick systems', 'Spare-parts service for 8 years'],
  carpart: ['Flow-formed alloy, 18% lighter', 'Salt-spray tested to 1,000 hours', 'TÜV load rating 690kg per wheel', 'Includes centre cap and valve', 'Fitment guide for 140+ models'],
  grocery: ['Single-estate, traceable to the plot', 'Roasted in small 12kg batches', 'Degassing valve keeps beans fresh', 'No additives or preservatives', 'FSSAI licensed facility'],
};

const DESCRIPTION_TEMPLATES = [
  (t: string, b: string) => `${t} is ${b}'s answer to a simple question: what should this cost when nothing important is removed? The engineering team spent two development cycles on the parts owners actually touch — the finish, the fit, the moving components — and left out the features that look good on a spec sheet and go unused. Every unit is function-tested before it leaves the line, and spares are stocked for the life of the product plus three years.`,
  (t: string, b: string) => `Built for daily use rather than the showroom, ${t} carries ${b}'s standard fit-and-finish: tight tolerances, serviceable parts, and materials chosen for how they age. Independent lab testing covers drop, thermal and cycle endurance, and the results are published in the specification sheet below rather than summarised in marketing language.`,
  (t: string, b: string) => `${b} designed ${t} around a long service life. Fasteners are standard sizes, wear parts are replaceable, and the documentation includes exploded diagrams. If something fails inside the warranty period it is repaired or replaced without a diagnostic fee, and out-of-warranty repairs are quoted at a fixed rate.`,
];

const badgePool: ProductBadge[] = ['Best Seller', 'New Arrival', "Editor's Pick", 'MarketForge Choice', 'Limited Stock', 'Price Drop'];

function specsFor(kind: ImageKind, title: string, brandName: string, r: Rng) {
  const general = {
    group: 'General',
    rows: [
      { label: 'Brand', value: brandName },
      { label: 'Model name', value: title.split('—')[0].replace(brandName, '').trim() || title },
      { label: 'Model year', value: String(r.int(2025, 2026)) },
      { label: 'Country of origin', value: r.pick(['India', 'India', 'Vietnam', 'China', 'Germany']) },
      { label: 'In the box', value: 'Product, documentation, warranty card' },
    ],
  };
  const byKind: Partial<Record<ImageKind, { group: string; rows: { label: string; value: string }[] }[]>> = {
    headphone: [{ group: 'Audio', rows: [{ label: 'Driver', value: '40mm dynamic, bio-cellulose' }, { label: 'Frequency response', value: '5Hz – 40kHz' }, { label: 'Impedance', value: '32Ω' }, { label: 'Codecs', value: 'SBC, AAC, LDAC, aptX Adaptive' }] }, { group: 'Battery', rows: [{ label: 'Playback (ANC on)', value: '38 hours' }, { label: 'Playback (ANC off)', value: '48 hours' }, { label: 'Charge time', value: '1h 40m' }, { label: 'Port', value: 'USB-C' }] }],
    phone: [{ group: 'Display', rows: [{ label: 'Size', value: '6.7 inch' }, { label: 'Type', value: 'LTPO AMOLED' }, { label: 'Refresh rate', value: '1 – 120Hz adaptive' }, { label: 'Protection', value: 'Corning Gorilla Glass Victus 2' }] }, { group: 'Performance', rows: [{ label: 'Chipset', value: 'Kestrel Halo 8 (4nm)' }, { label: 'RAM', value: '12 GB LPDDR5X' }, { label: 'Storage', value: '256 GB UFS 4.0' }, { label: 'OS', value: 'ForgeOS 6, Android 16' }] }, { group: 'Camera', rows: [{ label: 'Main', value: '50MP f/1.7, OIS' }, { label: 'Ultra-wide', value: '12MP f/2.2, 120°' }, { label: 'Telephoto', value: '10MP f/2.4, 3x optical' }, { label: 'Front', value: '32MP f/2.4' }] }],
    laptop: [{ group: 'Display', rows: [{ label: 'Size', value: '14.0 inch' }, { label: 'Resolution', value: '3072 x 1920' }, { label: 'Refresh rate', value: '120 Hz' }, { label: 'Brightness', value: '500 nits typical' }] }, { group: 'Performance', rows: [{ label: 'Processor', value: 'Intel Core Ultra 7 155H' }, { label: 'Graphics', value: 'Intel Arc integrated' }, { label: 'Memory', value: '16 GB LPDDR5X-7467' }, { label: 'Storage', value: '1 TB PCIe 4.0 NVMe' }] }, { group: 'Connectivity', rows: [{ label: 'Ports', value: '2x Thunderbolt 4, 1x USB-A, HDMI 2.1, SD' }, { label: 'Wireless', value: 'Wi-Fi 6E, Bluetooth 5.3' }, { label: 'Webcam', value: '1080p with IR' }] }],
    watch: [{ group: 'Display', rows: [{ label: 'Size', value: '1.43 inch AMOLED' }, { label: 'Resolution', value: '466 x 466' }, { label: 'Always-on', value: 'Yes' }] }, { group: 'Health', rows: [{ label: 'Sensors', value: 'HR, SpO2, ECG, skin temp' }, { label: 'GPS', value: 'Dual-band L1 + L5' }, { label: 'Water rating', value: '5 ATM' }] }],
    cookware: [{ group: 'Construction', rows: [{ label: 'Material', value: 'Triply — steel / aluminium / steel' }, { label: 'Base thickness', value: '3.2 mm' }, { label: 'Handle', value: 'Cast stainless, riveted' }, { label: 'Compatible hobs', value: 'Induction, gas, electric, ceramic' }] }],
    apparel: [{ group: 'Fabric & care', rows: [{ label: 'Composition', value: '100% combed cotton' }, { label: 'GSM', value: '140' }, { label: 'Wash care', value: 'Machine wash cold, line dry' }, { label: 'Fit', value: 'Regular' }] }],
    cosmetic: [{ group: 'Formulation', rows: [{ label: 'Key actives', value: 'Ceramide NP, squalane, panthenol' }, { label: 'pH', value: '5.5' }, { label: 'Volume', value: '50 ml' }, { label: 'Shelf life', value: '24 months, 6 months after opening' }] }],
    grocery: [{ group: 'Product', rows: [{ label: 'Net weight', value: '500 g' }, { label: 'Ingredients', value: '100% arabica coffee beans' }, { label: 'Roast', value: 'Medium' }, { label: 'Best before', value: '9 months from packing' }] }],
    book: [{ group: 'Publication', rows: [{ label: 'Publisher', value: 'Sundial Press' }, { label: 'Format', value: 'Hardcover' }, { label: 'Pages', value: '384' }, { label: 'ISBN-13', value: `978-93-${r.int(10000, 99999)}-${r.int(10, 99)}-${r.int(1, 9)}` }, { label: 'Language', value: 'English' }] }],
  };
  return [general, ...(byKind[kind] ?? [{ group: 'Specification', rows: [{ label: 'Material', value: r.pick(['Aluminium', 'Stainless steel', 'ABS + polycarbonate', 'Solid wood']) }, { label: 'Finish', value: r.pick(['Matte', 'Brushed', 'Powder-coated']) }, { label: 'Certifications', value: 'BIS, RoHS' }] }])];
}

function variantsFor(kind: ImageKind, productId: string, price: number, r: Rng): ProductVariant[] {
  const sets: Partial<Record<ImageKind, { name: string; values: [string, number, string?][] }>> = {
    phone: { name: 'Storage', values: [['128 GB', 0], ['256 GB', Math.round(price * 0.11)], ['512 GB', Math.round(price * 0.24)]] },
    laptop: { name: 'Configuration', values: [['16GB / 512GB', 0], ['16GB / 1TB', Math.round(price * 0.09)], ['32GB / 1TB', Math.round(price * 0.21)]] },
    headphone: { name: 'Colour', values: [['Graphite', 0, '#2B3547'], ['Sandstone', 0, '#D6C3A9'], ['Deep Teal', 400, '#12817A']] },
    watch: { name: 'Case', values: [['41mm Aluminium', 0, '#BCC5D3'], ['45mm Aluminium', 2500, '#8592A9'], ['45mm Titanium', 9000, '#414B5E']] },
    apparel: { name: 'Size', values: [['S', 0], ['M', 0], ['L', 0], ['XL', 0], ['XXL', 150]] },
    shoe: { name: 'Size (UK)', values: [['7', 0], ['8', 0], ['9', 0], ['10', 0], ['11', 0]] },
    bag: { name: 'Colour', values: [['Black', 0, '#1B2435'], ['Olive', 0, '#4B5320'], ['Clay', 0, '#B0654A']] },
    cookware: { name: 'Size', values: [['24 cm', 0], ['26 cm', 400], ['28 cm', 900]] },
    cosmetic: { name: 'Size', values: [['30 ml', 0], ['50 ml', Math.round(price * 0.55)]] },
    grocery: { name: 'Pack', values: [['250 g', 0], ['500 g', Math.round(price * 0.7)], ['1 kg', Math.round(price * 1.5)]] },
    tv: { name: 'Screen size', values: [['43 inch', 0], ['55 inch', Math.round(price * 0.35)], ['65 inch', Math.round(price * 0.72)]] },
    book: { name: 'Format', values: [['Hardcover', 0], ['Paperback', -250]] },
  };
  const set = sets[kind];
  if (!set) return [];
  return set.values.map(([value, delta, swatch], i) => ({
    id: `${productId}_v${i}`,
    productId,
    sku: `${productId.toUpperCase().replace('PRD_', 'MF-')}-${String(value).replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()}`,
    optionName: set.name,
    optionValue: String(value),
    priceDelta: delta,
    stock: r.int(0, 180),
    isDefault: i === (kind === 'apparel' || kind === 'shoe' ? 1 : 0),
    swatch,
  }));
}

export const products: Product[] = PRODUCT_SEEDS.map(([title, brandName, catSlug, subSlug, kind, price, mrp], idx) => {
  const r = new Rng(`product:${title}`);
  const id = makeId('prd', title);
  const brand = brandByName.get(brandName) ?? brands[0];
  const subcat = categories.find((c) => c.id === `cat_${catSlug}_${subSlug}`);
  const categoryId = subcat?.id ?? `cat_${catSlug}`;
  const pool = VENDOR_BY_CAT[catSlug] ?? ['ven_techworld'];
  const vendorId = pool[idx % pool.length];
  const rating = r.float(3.6, 4.9, 1);
  const status: Product['status'] =
    idx % 23 === 5 ? 'pending_approval' : idx % 29 === 7 ? 'draft' : idx % 31 === 11 ? 'out_of_stock' : idx % 37 === 13 ? 'rejected' : 'published';
  const isDeal = idx % 4 === 0;
  const attrCat = categories.find((c) => c.id === `cat_${catSlug}`);
  const attributes: Record<string, string | number | boolean> = {};
  attrCat?.attributes.forEach((a) => {
    if (a.type === 'select' && a.options) attributes[a.key] = r.pick(a.options);
    else if (a.type === 'number') attributes[a.key] = r.int(6, 5200);
    else if (a.type === 'boolean') attributes[a.key] = r.bool(0.7);
  });

  return {
    id,
    sku: `MF-${brand.slug.slice(0, 3).toUpperCase()}-${String(1000 + idx)}`,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60),
    title,
    shortTitle: title.split('—')[0].trim(),
    brandId: brand.id,
    vendorId,
    categoryId,
    status,
    price,
    mrp,
    currency: 'INR',
    taxRatePct: catSlug === 'grocery' || catSlug === 'books' ? 5 : catSlug === 'fashion' ? 12 : 18,
    rating,
    ratingCount: r.int(48, 8600),
    reviewCount: r.int(12, 1400),
    soldCount: r.int(120, 26000),
    viewCount30d: r.int(1800, 148000),
    createdAt: daysAgo(r.int(20, 900)),
    updatedAt: daysAgo(r.int(0, 18)),
    imageKind: kind,
    tint: brand.tint,
    imageSeeds: [`${id}-a`, `${id}-b`, `${id}-c`, `${id}-d`, `${id}-e`],
    highlights: (HIGHLIGHTS_BY_KIND[kind] ?? ['Built from durable, serviceable materials', 'Independently lab tested for endurance', 'Spare parts stocked for 5 years', 'Backed by an on-site warranty']).slice(0, 5),
    description: r.pick(DESCRIPTION_TEMPLATES)(title, brandName),
    whatsIncluded: [title.split('—')[0].trim(), r.pick(['USB-C charging cable', 'Carry pouch', 'Quick-start guide', 'Mounting hardware']), 'Warranty card', 'Documentation'],
    specs: specsFor(kind, title, brandName, r),
    attributes,
    variants: variantsFor(kind, id, price, r),
    warrantyMonths: r.pick([6, 12, 12, 24, 36]),
    returnWindowDays: catSlug === 'grocery' ? 0 : catSlug === 'fashion' ? 30 : r.pick([7, 10, 14]),
    freeShipping: price > 499,
    codAvailable: price < 50000,
    weightKg: r.float(0.12, 14, 2),
    dimensionsCm: { l: r.int(8, 92), w: r.int(6, 62), h: r.int(2, 40) },
    barcode: `89${r.int(10000000000, 99999999999)}`,
    hsnCode: String(r.int(3004, 9503)),
    tags: [brandName, attrCat?.name ?? '', subcat?.name ?? '', ...(isDeal ? ['deal'] : [])].filter(Boolean),
    badges: r.sample(badgePool, r.int(0, 2)) as ProductBadge[],
    isFeatured: idx % 5 === 0,
    isDeal,
    dealEndsAt: isDeal ? daysAhead(r.int(0, 2), r.int(2, 20)) : undefined,
    moderation: status === 'pending_approval' || status === 'rejected'
      ? {
          submittedAt: daysAgo(r.int(1, 9)),
          reviewedAt: status === 'rejected' ? daysAgo(r.int(0, 4)) : undefined,
          reviewerName: status === 'rejected' ? 'Aditya Kulkarni' : undefined,
          decision: status === 'rejected' ? 'rejected' : undefined,
          reason: status === 'rejected' ? 'Primary image contains promotional text overlay, which is not permitted on catalogue imagery.' : undefined,
          flags: status === 'rejected' ? ['image_overlay_text'] : r.sample(['missing_hsn', 'price_outlier', 'duplicate_title', 'claims_review'], r.int(0, 2)),
        }
      : undefined,
    fulfilment: vendorById.get(vendorId)?.fulfilledByMarketForge && idx % 2 === 0 ? 'marketforge' : 'vendor',
    deliveryDays: r.int(1, 6),
  };
});

export const productById = new Map(products.map((p) => [p.id, p]));
export const publishedProducts = products.filter((p) => p.status === 'published' || p.status === 'out_of_stock');

/** Safe indexed access for demo fixtures — wraps instead of returning undefined. */
export const pp = (i: number) => publishedProducts[i % publishedProducts.length];

// Back-fill denormalised counts used across dashboards.
vendors.forEach((v) => { v.productCount = products.filter((p) => p.vendorId === v.id).length; });
brands.forEach((b) => {
  const own = products.filter((p) => p.brandId === b.id);
  b.productCount = own.length;
  b.rating = own.length ? Number((own.reduce((s, p) => s + p.rating, 0) / own.length).toFixed(1)) : 0;
});
categories.forEach((c) => {
  c.productCount = products.filter((p) => p.categoryId === c.id || productById.get(p.id)?.categoryId.startsWith(`${c.id}_`)).length
    || products.filter((p) => p.categoryId.startsWith(c.id)).length;
});

/* ─────────────────────────────── Inventory ──────────────────────────────── */

export const inventory: Inventory[] = products.map((p) => {
  const r = new Rng(`inv:${p.id}`);
  const outOfStock = p.status === 'out_of_stock';
  const available = outOfStock ? 0 : r.weighted([[r.int(0, 8), 1], [r.int(9, 40), 3], [r.int(41, 320), 6], [r.int(600, 1400), 1]]);
  return {
    id: makeId('inv', p.id),
    productId: p.id,
    vendorId: p.vendorId,
    warehouseId: r.pick(warehouses).id,
    sku: p.sku,
    available,
    reserved: Math.min(available, r.int(0, 24)),
    incoming: r.bool(0.4) ? r.int(20, 400) : 0,
    reorderPoint: r.int(12, 40),
    overstockThreshold: r.int(600, 900),
    unitCost: Math.round(p.price * r.float(0.52, 0.74, 2)),
    updatedAt: daysAgo(r.int(0, 6), r.int(0, 20)),
  };
});

export const inventoryByProduct = new Map(inventory.map((i) => [i.productId, i]));

export function alertTypeFor(i: Inventory): 'low_stock' | 'out_of_stock' | 'overstock' | null {
  if (i.available === 0) return 'out_of_stock';
  if (i.available <= i.reorderPoint) return 'low_stock';
  if (i.available >= i.overstockThreshold) return 'overstock';
  return null;
}

const MOVEMENT_ACTORS = ['System · Order engine', 'Nikhil (Warehouse)', 'Shruti (Ops)', 'System · Returns', 'Cycle count'];

export const stockMovements: StockMovement[] = inventory.flatMap((inv) => {
  const r = new Rng(`mv:${inv.id}`);
  let balance = inv.available;
  return Array.from({ length: r.int(4, 9) }, (_, k) => {
    const type = r.weighted<StockMovement['type']>([['sale', 6], ['restock', 3], ['return', 2], ['adjustment', 1], ['damage', 1], ['transfer', 1]]);
    const delta = type === 'sale' ? -r.int(1, 12) : type === 'damage' ? -r.int(1, 4) : type === 'restock' ? r.int(20, 200) : type === 'return' ? r.int(1, 3) : r.int(-8, 8);
    const before = balance;
    balance = Math.max(0, balance - delta);
    return {
      id: makeId('mvt', `${inv.id}${k}`),
      inventoryId: inv.id,
      vendorId: inv.vendorId,
      sku: inv.sku,
      at: daysAgo(k * r.int(1, 4) + r.int(0, 2), r.int(0, 22)),
      type,
      delta,
      balanceAfter: before,
      reference: type === 'sale' ? `MF-${r.int(100000, 999999)}` : type === 'restock' ? `PO-${r.int(4000, 9999)}` : undefined,
      actor: r.pick(MOVEMENT_ACTORS),
      note: type === 'adjustment' ? 'Cycle count correction' : type === 'damage' ? 'Damaged in transit — written off' : undefined,
    };
  });
});

/* ─────────────────────────── Customers & users ──────────────────────────── */

const FIRST = ['Aarav', 'Ananya', 'Vihaan', 'Diya', 'Arjun', 'Ishita', 'Kabir', 'Meera', 'Rohan', 'Saanvi', 'Aditya', 'Nisha', 'Karthik', 'Priya', 'Rahul', 'Tanvi', 'Siddharth', 'Aisha', 'Nikhil', 'Riya', 'Varun', 'Shreya', 'Manav', 'Pooja', 'Dev', 'Kavya', 'Yash', 'Neha', 'Aman', 'Sneha', 'Farhan', 'Zoya', 'Imran', 'Sara', 'Rehan', 'Fatima', 'Joel', 'Grace', 'Ryan', 'Elena'];
const LAST = ['Sharma', 'Iyer', 'Nair', 'Menon', 'Reddy', 'Patel', 'Gupta', 'Singh', 'Bose', 'Rao', 'Kulkarni', 'Joshi', 'Malhotra', 'Chatterjee', 'Pillai', 'Desai', 'Bhatt', 'Kapoor', 'Sethi', 'Mehta', 'Qureshi', 'Khan', 'Fernandes', 'Dsouza', 'Thomas', 'Verma', 'Bansal', 'Chopra'];
const CITIES: [string, string][] = [['Bengaluru', 'Karnataka'], ['Mumbai', 'Maharashtra'], ['New Delhi', 'Delhi'], ['Hyderabad', 'Telangana'], ['Chennai', 'Tamil Nadu'], ['Pune', 'Maharashtra'], ['Kolkata', 'West Bengal'], ['Ahmedabad', 'Gujarat'], ['Jaipur', 'Rajasthan'], ['Kochi', 'Kerala'], ['Indore', 'Madhya Pradesh'], ['Chandigarh', 'Punjab'], ['Coimbatore', 'Tamil Nadu'], ['Lucknow', 'Uttar Pradesh'], ['Bhubaneswar', 'Odisha']];

export const customers: Customer[] = Array.from({ length: 128 }, (_, i) => {
  const r = new Rng(`cust:${i}`);
  const name = `${r.pick(FIRST)} ${r.pick(LAST)}`;
  const [city, state] = r.pick(CITIES);
  const id = makeId('cus', `${name}${i}`);
  const orderCount = r.weighted([[r.int(1, 3), 5], [r.int(4, 12), 3], [r.int(13, 44), 1]]);
  return {
    id,
    userId: makeId('usr', id),
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}${r.int(1, 99)}@${r.pick(['gmail.com', 'outlook.com', 'protonmail.com', 'yahoo.in'])}`,
    phone: `+91 ${r.int(70, 99)}${r.int(10000000, 99999999)}`,
    avatarSeed: id,
    tier: r.weighted<Customer['tier']>([['standard', 6], ['plus', 3], ['prime', 2]]),
    status: i % 41 === 3 ? 'suspended' : 'active',
    joinedAt: daysAgo(r.int(12, 1400)),
    city,
    state,
    lifetimeValue: orderCount * r.int(1800, 14000),
    orderCount,
    returnCount: r.int(0, Math.max(1, Math.floor(orderCount / 4))),
    reviewCount: r.int(0, Math.max(1, orderCount)),
    marketingOptIn: r.bool(0.62),
    currency: 'INR',
  };
});

export const customerById = new Map(customers.map((c) => [c.id, c]));
/** The signed-in shopper for the customer experience. */
export const currentCustomer = customers[0];

export const addresses: Address[] = [
  { id: 'adr_home', ownerId: currentCustomer.id, label: 'Home', fullName: currentCustomer.name, phone: currentCustomer.phone, line1: '402, Brigade Altitude', line2: 'Banashankari 3rd Stage', city: 'Bengaluru', state: 'Karnataka', postalCode: '560085', country: 'India', isDefault: true, deliveryNotes: 'Leave with the security desk if not home' },
  { id: 'adr_work', ownerId: currentCustomer.id, label: 'Work', fullName: currentCustomer.name, phone: currentCustomer.phone, line1: 'Prestige Tech Park, Tower C', line2: '7th Floor, Kadubeesanahalli', city: 'Bengaluru', state: 'Karnataka', postalCode: '560103', country: 'India', isDefault: false, deliveryNotes: 'Reception accepts parcels 9am–7pm' },
  { id: 'adr_parents', ownerId: currentCustomer.id, label: 'Other', fullName: 'Lakshmi Sharma', phone: '+91 9845012233', line1: '18, Rose Garden Layout', line2: 'Near Kalyan Nagar Post Office', city: 'Bengaluru', state: 'Karnataka', postalCode: '560043', country: 'India', isDefault: false },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'pm_visa', ownerId: currentCustomer.id, kind: 'card', label: 'HDFC Bank Credit Card', detail: '•••• 4821', brand: 'Visa', expiry: '09/29', isDefault: true },
  { id: 'pm_mc', ownerId: currentCustomer.id, kind: 'card', label: 'ICICI Bank Debit Card', detail: '•••• 7314', brand: 'Mastercard', expiry: '04/28', isDefault: false },
  { id: 'pm_upi', ownerId: currentCustomer.id, kind: 'upi', label: 'UPI', detail: 'aarav@okhdfcbank', isDefault: false },
  { id: 'pm_wallet', ownerId: currentCustomer.id, kind: 'wallet', label: 'MarketForge Wallet', detail: 'Balance ₹2,480', isDefault: false },
  { id: 'pm_cod', ownerId: currentCustomer.id, kind: 'cod', label: 'Cash on Delivery', detail: 'Pay when the parcel arrives', isDefault: false },
];

export const users: User[] = [
  { id: 'usr_customer', name: currentCustomer.name, email: currentCustomer.email, phone: currentCustomer.phone, role: 'customer', avatarSeed: currentCustomer.id, status: 'active', createdAt: currentCustomer.joinedAt, lastLoginAt: daysAgo(0, -2), twoFactorEnabled: true, customerId: currentCustomer.id },
  { id: 'usr_vendor', name: 'Ananya Rao', email: 'ananya@techworld.in', phone: '+91 9845110022', role: 'vendor', avatarSeed: 'ven_techworld', status: 'active', createdAt: daysAgo(2190), lastLoginAt: daysAgo(0, -5), twoFactorEnabled: true, vendorId: 'ven_techworld', jobTitle: 'Head of Marketplace, TechWorld' },
  { id: 'usr_admin', name: 'Priya Nair', email: 'priya.nair@marketforge.com', role: 'admin', avatarSeed: 'admin-1', status: 'active', createdAt: daysAgo(1620), lastLoginAt: daysAgo(0, -1), twoFactorEnabled: true, jobTitle: 'Marketplace Operations Lead' },
  { id: 'usr_catalog', name: 'Aditya Kulkarni', email: 'aditya.k@marketforge.com', role: 'catalog_manager', avatarSeed: 'admin-2', status: 'active', createdAt: daysAgo(940), lastLoginAt: daysAgo(0, -3), twoFactorEnabled: true, jobTitle: 'Catalog Quality Manager' },
  { id: 'usr_finance', name: 'Meera Joshi', email: 'meera.joshi@marketforge.com', role: 'finance_manager', avatarSeed: 'admin-3', status: 'active', createdAt: daysAgo(1180), lastLoginAt: daysAgo(1, 4), twoFactorEnabled: true, jobTitle: 'Finance Manager, Payouts' },
  { id: 'usr_support', name: 'Rehan Qureshi', email: 'rehan.q@marketforge.com', role: 'support_agent', avatarSeed: 'admin-4', status: 'active', createdAt: daysAgo(430), lastLoginAt: daysAgo(0, -6), twoFactorEnabled: false, jobTitle: 'Senior Support Specialist' },
];

export const loginEvents = Array.from({ length: 9 }, (_, i) => {
  const r = new Rng(`login:${i}`);
  return {
    id: `lge_${i}`,
    userId: 'usr_customer',
    at: daysAgo(i * r.int(1, 5), r.int(0, 20)),
    ip: `49.36.${r.int(1, 254)}.${r.int(1, 254)}`,
    device: r.pick(['Chrome 141 · Windows 11', 'Safari 19 · iPhone 17', 'ForgeShop App 4.2 · Android 16', 'Edge 141 · macOS 15']),
    location: r.pick(['Bengaluru, IN', 'Bengaluru, IN', 'Mumbai, IN', 'Chennai, IN']),
    result: (i === 4 ? 'failed' : i === 7 ? 'blocked' : 'success') as 'success' | 'failed' | 'blocked',
  };
});

/* ──────────────────────────────── Orders ────────────────────────────────── */

const CARRIERS = deliveryPartners.filter((d) => d.status === 'active');

const ORDER_FLOW: { status: OrderStatus; label: string; detail: string }[] = [
  { status: 'pending', label: 'Order Placed', detail: 'We received your order and are confirming payment' },
  { status: 'confirmed', label: 'Confirmed', detail: 'Payment authorised and sent to the seller' },
  { status: 'processing', label: 'Packed', detail: 'Seller packed your items and generated a label' },
  { status: 'shipped', label: 'Shipped', detail: 'Parcel handed to the carrier' },
  { status: 'out_for_delivery', label: 'Out for Delivery', detail: 'With the delivery agent for final-mile handoff' },
  { status: 'delivered', label: 'Delivered', detail: 'Left with the recipient' },
];

const VENDOR_STATUS_FOR: Record<OrderStatus, VendorOrderStatus> = {
  pending: 'new', confirmed: 'accepted', processing: 'packed', packed: 'packed',
  shipped: 'shipped', out_for_delivery: 'shipped', delivered: 'delivered',
  cancelled: 'cancelled', returned: 'returned',
};

function pickPaymentMethod(r: Rng): { kind: Payment['method']; label: string } {
  return r.weighted([
    { kind: 'card' as const, label: 'Visa •••• 4821' },
    { kind: 'upi' as const, label: 'UPI · aarav@okhdfcbank' },
    { kind: 'netbanking' as const, label: 'Net Banking · HDFC Bank' },
    { kind: 'wallet' as const, label: 'MarketForge Wallet' },
    { kind: 'cod' as const, label: 'Cash on Delivery' },
  ].map((v, i) => [v, [5, 6, 2, 2, 3][i]] as [{ kind: Payment['method']; label: string }, number]));
}

function buildOrder(index: number, customerId: string, forcedStatus?: OrderStatus): Order {
  const r = new Rng(`order:${index}:${customerId}`);
  const daysBack = r.int(0, 150);
  const status: OrderStatus = forcedStatus ?? (
    daysBack > 14
      ? r.weighted<OrderStatus>([['delivered', 12], ['returned', 2], ['cancelled', 1]])
      : daysBack > 6
        ? r.weighted<OrderStatus>([['delivered', 7], ['out_for_delivery', 2], ['shipped', 3], ['cancelled', 1]])
        : r.weighted<OrderStatus>([['shipped', 3], ['processing', 3], ['confirmed', 2], ['pending', 1], ['out_for_delivery', 2]])
  );

  const picked = r.sample(publishedProducts, r.weighted([[1, 5], [2, 4], [3, 2], [4, 1]]));
  const orderId = makeId('ord', `${index}${customerId}`);
  const items: OrderItem[] = picked.map((p, i) => {
    const qty = r.weighted([[1, 8], [2, 3], [3, 1]]);
    const variant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
    const unitPrice = p.price + (variant?.priceDelta ?? 0);
    const lineTotal = unitPrice * qty;
    const commissionRate = vendorById.get(p.vendorId)?.commissionRate ?? 10;
    return {
      id: `${orderId}_i${i}`,
      orderId,
      productId: p.id,
      variantId: variant?.id,
      vendorId: p.vendorId,
      title: p.title,
      sku: variant?.sku ?? p.sku,
      variantLabel: variant ? `${variant.optionName}: ${variant.optionValue}` : undefined,
      imageKind: p.imageKind,
      imageSeed: p.imageSeeds[0],
      tint: p.tint,
      unitPrice,
      mrp: p.mrp,
      quantity: qty,
      taxAmount: Math.round((lineTotal * p.taxRatePct) / (100 + p.taxRatePct)),
      discount: Math.round((p.mrp - p.price) * qty),
      lineTotal,
      commissionRate,
      commissionAmount: Math.round((lineTotal * commissionRate) / 100),
      vendorStatus: VENDOR_STATUS_FOR[status],
      reviewed: status === 'delivered' && r.bool(0.35),
    };
  });

  const itemTotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const couponCode = r.bool(0.3) ? r.pick(['FORGE10', 'WELCOME200', 'FESTIVE15', 'FREESHIP']) : undefined;
  const couponDiscount = couponCode ? Math.min(Math.round(itemTotal * 0.1), 2000) : 0;
  const shipping = itemTotal > 499 ? 0 : 49;
  const tax = items.reduce((s, i) => s + i.taxAmount, 0);
  const commission = items.reduce((s, i) => s + i.commissionAmount, 0);
  const grandTotal = itemTotal - couponDiscount + shipping;
  const pm = pickPaymentMethod(r);
  const address = r.pick(addresses);
  const deliveryMethod = r.weighted<Order['deliveryMethod']>([['standard', 6], ['express', 3], ['same_day', 1], ['pickup', 1]]);
  const transitDays = deliveryMethod === 'same_day' ? 0 : deliveryMethod === 'express' ? 2 : 4;
  const placedAt = daysAgo(daysBack, r.int(0, 22));
  const promisedBy = daysAgo(daysBack - transitDays, r.int(0, 12));

  const flowIndex = status === 'delivered' ? 5 : status === 'out_for_delivery' ? 4 : status === 'shipped' ? 3
    : status === 'processing' || status === 'packed' ? 2 : status === 'confirmed' ? 1 : 0;
  const terminal = status === 'cancelled' || status === 'returned';

  const timeline: OrderEvent[] = ORDER_FLOW.map((step, i) => ({
    id: `${orderId}_t${i}`,
    at: daysAgo(daysBack - i * (transitDays / 5 || 0.5), r.int(0, 20)),
    label: step.label,
    detail: step.detail,
    state: terminal ? (i === 0 ? 'done' : 'upcoming') : i < flowIndex ? 'done' : i === flowIndex ? 'current' : 'upcoming',
    location: i >= 3 ? r.pick(['Bengaluru Hub', 'Hoskote Sort Centre', 'Banashankari DC']) : vendorById.get(items[0].vendorId)?.homeCity,
    actor: i <= 2 ? vendorById.get(items[0].vendorId)?.name : r.pick(CARRIERS).name,
  }));
  if (status === 'cancelled') {
    timeline.push({ id: `${orderId}_tc`, at: daysAgo(daysBack - 1, 4), label: 'Cancelled', detail: 'Order cancelled and refund initiated', state: 'failed', actor: r.bool() ? 'Customer' : 'Seller' });
  }
  if (status === 'returned') {
    timeline.push({ id: `${orderId}_tr`, at: daysAgo(Math.max(0, daysBack - 12), 6), label: 'Returned', detail: 'Item returned and refund completed', state: 'done', actor: 'MarketForge Returns' });
  }

  const vendorGroups = [...new Set(items.map((i) => i.vendorId))];
  const shipments: Shipment[] = flowIndex >= 3 || status === 'returned'
    ? vendorGroups.map((vid, gi) => {
        const carrier = r.pick(CARRIERS);
        const own = items.filter((i) => i.vendorId === vid);
        return {
          id: `${orderId}_s${gi}`,
          orderId,
          vendorId: vid,
          itemIds: own.map((i) => i.id),
          carrier: carrier.name,
          trackingNumber: `${carrier.code}${r.int(100000000, 999999999)}`,
          status: status === 'delivered' ? 'delivered' : status === 'out_for_delivery' ? 'out_for_delivery' : status === 'returned' ? 'returned' : 'in_transit',
          shippedAt: daysAgo(daysBack - 1, r.int(0, 12)),
          estimatedDelivery: promisedBy,
          deliveredAt: status === 'delivered' ? promisedBy : undefined,
          weightKg: Number(own.reduce((s, i) => s + (productById.get(i.productId)?.weightKg ?? 1) * i.quantity, 0).toFixed(2)),
          shippingCost: r.int(48, 320),
          checkpoints: [
            { at: daysAgo(daysBack - 1, 2), label: 'Shipment picked up', location: vendorById.get(vid)?.homeCity ?? 'Bengaluru' },
            { at: daysAgo(daysBack - 1.6, 8), label: 'In transit', location: 'Hoskote Sort Centre' },
            ...(flowIndex >= 4 ? [{ at: daysAgo(daysBack - transitDays, 6), label: 'Out for delivery', location: address.city }] : []),
            ...(status === 'delivered' ? [{ at: promisedBy, label: 'Delivered', location: `${address.city} — ${address.postalCode}` }] : []),
          ],
        };
      })
    : [];

  const payment: Payment = {
    id: `${orderId}_pay`,
    orderId,
    customerId,
    method: pm.kind,
    methodLabel: pm.label,
    amount: grandTotal,
    status: status === 'cancelled' ? 'refunded' : status === 'returned' ? 'partially_refunded' : pm.kind === 'cod' ? (status === 'delivered' ? 'captured' : 'pending') : 'captured',
    gateway: pm.kind === 'cod' ? 'ForgePay' : r.pick(['ForgePay', 'Razorpay', 'Stripe']),
    transactionRef: `TXN${r.int(1000000000, 9999999999)}`,
    processedAt: placedAt,
    cardLast4: pm.kind === 'card' ? '4821' : undefined,
    upiHandle: pm.kind === 'upi' ? 'aarav@okhdfcbank' : undefined,
    bank: pm.kind === 'netbanking' ? 'HDFC Bank' : undefined,
    feeAmount: Math.round(grandTotal * 0.019),
    refundedAmount: status === 'cancelled' ? grandTotal : status === 'returned' ? Math.round(grandTotal * 0.45) : 0,
  };

  return {
    id: orderId,
    number: `MF-${2026}-${String(480000 + index * 7).slice(0, 6)}`,
    customerId,
    placedAt,
    status,
    items,
    shippingAddress: address,
    payment,
    shipments,
    totals: {
      itemTotal,
      discount: items.reduce((s, i) => s + i.discount, 0),
      couponDiscount,
      shipping,
      tax,
      giftCardApplied: 0,
      grandTotal,
      commission,
      vendorPayable: itemTotal - commission,
    },
    couponCode,
    deliveryMethod,
    promisedBy,
    deliveredAt: status === 'delivered' ? promisedBy : undefined,
    cancelledAt: status === 'cancelled' ? daysAgo(daysBack - 1, 4) : undefined,
    cancellationReason: status === 'cancelled' ? r.pick(['Ordered by mistake', 'Found a better price elsewhere', 'Delivery date too late', 'Seller could not fulfil in time']) : undefined,
    invoiceNumber: `INV/2026-27/${r.int(10000, 99999)}`,
    giftMessage: r.bool(0.08) ? 'Happy birthday! Hope this makes the desk setup complete.' : undefined,
    timeline,
    channel: r.weighted<Order['channel']>([['web', 5], ['android', 3], ['ios', 2]]),
  };
}

/** Orders belonging to the signed-in shopper — one per lifecycle state. */
export const myOrders: Order[] = [
  buildOrder(1, currentCustomer.id, 'out_for_delivery'),
  buildOrder(2, currentCustomer.id, 'shipped'),
  buildOrder(3, currentCustomer.id, 'processing'),
  buildOrder(4, currentCustomer.id, 'confirmed'),
  buildOrder(5, currentCustomer.id, 'delivered'),
  buildOrder(6, currentCustomer.id, 'delivered'),
  buildOrder(7, currentCustomer.id, 'delivered'),
  buildOrder(8, currentCustomer.id, 'returned'),
  buildOrder(9, currentCustomer.id, 'cancelled'),
];

const otherOrders: Order[] = Array.from({ length: 340 }, (_, i) =>
  buildOrder(100 + i, customers[(i * 7 + 3) % customers.length].id),
);

export const orders: Order[] = [...myOrders, ...otherOrders].sort(
  (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
);
export const orderById = new Map(orders.map((o) => [o.id, o]));
export const orderItems = orders.flatMap((o) => o.items);
export const payments = orders.map((o) => o.payment);
export const shipments = orders.flatMap((o) => o.shipments);

vendors.forEach((v) => {
  const own = orderItems.filter((i) => i.vendorId === v.id);
  if (own.length) {
    v.orderCount = new Set(own.map((i) => i.orderId)).size;
    v.grossSales = own.reduce((s, i) => s + i.lineTotal, 0);
  }
});

/* ──────────────────────────── Returns & refunds ─────────────────────────── */

const RETURN_REASONS: [Return['reasonCategory'], string][] = [
  ['damaged', 'Item arrived damaged'],
  ['wrong_item', 'Wrong item was delivered'],
  ['not_as_described', 'Item does not match the description'],
  ['size_fit', 'Size or fit is wrong'],
  ['quality', 'Quality not as expected'],
  ['no_longer_needed', 'No longer needed'],
  ['late_delivery', 'Delivered later than promised'],
];

const RETURN_FLOW: { status: ReturnStatus; label: string; detail: string }[] = [
  { status: 'requested', label: 'Return Requested', detail: 'We received your request and shared it with the seller' },
  { status: 'approved', label: 'Approved', detail: 'Seller approved the return' },
  { status: 'pickup_scheduled', label: 'Pickup Scheduled', detail: 'A carrier slot has been booked' },
  { status: 'picked_up', label: 'Picked Up', detail: 'Parcel collected from your address' },
  { status: 'inspection', label: 'Inspection', detail: 'Item is being checked at the seller warehouse' },
  { status: 'refund_initiated', label: 'Refund Initiated', detail: 'Refund sent to your original payment method' },
  { status: 'refunded', label: 'Refunded', detail: 'Amount credited' },
];

function buildReturn(index: number, order: Order, status?: ReturnStatus): Return {
  const r = new Rng(`ret:${order.id}:${index}`);
  const item = r.pick(order.items);
  const [reasonCategory, reason] = r.pick(RETURN_REASONS);
  const st = status ?? r.weighted<ReturnStatus>([
    ['requested', 3], ['approved', 2], ['pickup_scheduled', 2], ['picked_up', 2],
    ['inspection', 2], ['refund_initiated', 2], ['refunded', 5], ['rejected', 1],
  ]);
  const flowIdx = RETURN_FLOW.findIndex((f) => f.status === st);
  const product = productById.get(item.productId)!;
  const daysBack = r.int(1, 40);
  return {
    id: makeId('rtn', `${order.id}${index}`),
    rma: `RMA-${r.int(100000, 999999)}`,
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
    type: r.weighted<Return['type']>([['refund', 4], ['replacement', 1]]),
    reason,
    reasonCategory,
    comments: r.pick([
      'The outer box was intact but the product has a deep scratch across the lid. Photos attached.',
      'Received a different colour than the one ordered — invoice says Graphite, parcel has Sandstone.',
      'Stopped holding charge after four days of normal use. Happy to accept a replacement instead.',
      'Fit runs a full size small compared to the size chart on the listing.',
      'Delivered six days after the promised date and I no longer need it.',
    ]),
    status: st,
    requestedAt: daysAgo(daysBack, r.int(0, 20)),
    updatedAt: daysAgo(Math.max(0, daysBack - flowIdx), r.int(0, 12)),
    refundMethod: r.weighted<Return['refundMethod']>([['original', 6], ['wallet', 3], ['bank', 1], ['gift_card', 1]]),
    refundAmount: item.unitPrice,
    pickupSlot: flowIdx >= 2 ? `${r.pick(['Tomorrow', 'Fri, 5 Sep', 'Sat, 6 Sep'])}, ${r.pick(['9am – 12pm', '12pm – 3pm', '3pm – 7pm'])}` : undefined,
    media: reasonCategory === 'damaged' || reasonCategory === 'wrong_item'
      ? Array.from({ length: r.int(1, 3) }, (_, k) => ({ id: `${order.id}rm${k}`, kind: 'image' as const, seed: `${order.id}-rm-${k}`, tint: product.tint, caption: r.pick(['Scratch on the lid', 'Packaging as received', 'Serial number label']) }))
      : [],
    timeline: RETURN_FLOW.map((f, i) => ({
      id: `${order.id}rt${i}`,
      at: daysAgo(daysBack - i, r.int(0, 18)),
      label: f.label,
      detail: f.detail,
      state: st === 'rejected' ? (i === 0 ? 'done' : i === 1 ? 'failed' : 'upcoming') : i < flowIdx ? 'done' : i === flowIdx ? 'current' : 'upcoming',
      actor: i === 0 ? 'Customer' : i <= 1 ? vendorById.get(item.vendorId)?.name : 'ForgeExpress Reverse',
    })),
    inspectionNote: flowIdx >= 4 ? 'Serial verified against the invoice. Cosmetic damage confirmed on the lid; unit otherwise functional.' : undefined,
    rejectionReason: st === 'rejected' ? 'Return window of 7 days had closed at the time of the request.' : undefined,
  };
}

const returnableOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'returned');
export const returns: Return[] = [
  buildReturn(0, myOrders[7], 'inspection'),
  buildReturn(1, myOrders[4], 'refunded'),
  buildReturn(2, myOrders[5], 'pickup_scheduled'),
  ...Array.from({ length: 46 }, (_, i) => buildReturn(10 + i, returnableOrders[(i * 5 + 2) % returnableOrders.length])),
];
export const returnById = new Map(returns.map((r) => [r.id, r]));

// Link returns back onto their order items.
returns.forEach((rt) => {
  const item = orderById.get(rt.orderId)?.items.find((i) => i.id === rt.orderItemId);
  if (item) { item.returnId = rt.id; item.vendorStatus = rt.status === 'refunded' ? 'returned' : 'return_requested'; }
});

export const refunds: Refund[] = returns
  .filter((rt) => ['refund_initiated', 'refunded'].includes(rt.status))
  .map((rt, i) => {
    const r = new Rng(`refund:${rt.id}`);
    return {
      id: makeId('rfd', rt.id),
      returnId: rt.id,
      orderId: rt.orderId,
      orderNumber: rt.orderNumber,
      customerId: rt.customerId,
      vendorId: rt.vendorId,
      amount: rt.refundAmount,
      status: rt.status === 'refunded' ? 'completed' : i % 7 === 0 ? 'failed' : 'processing',
      method: rt.refundMethod,
      initiatedAt: rt.updatedAt,
      completedAt: rt.status === 'refunded' ? rt.updatedAt : undefined,
      reference: `RFD${r.int(10000000, 99999999)}`,
      reason: rt.reason,
      bearer: r.weighted<Refund['bearer']>([['vendor', 6], ['platform', 2], ['shared', 1]]),
    };
  });

/* ──────────────────────────────── Reviews ───────────────────────────────── */

const REVIEW_TITLES = [
  'Exactly what the listing promised', 'Good, with one caveat', 'Worth the premium',
  'Solid build, average battery', 'Replaced my three-year-old unit', 'Great value at this price',
  'Not for everyone, but right for me', 'Two months in — still impressed',
  'Packaging could be better', 'Does one job, does it well', 'Slightly overpriced but excellent',
  'Would buy again', 'Fit runs small', 'Impressive for a first-generation product',
];

const REVIEW_BODIES = [
  'Ordered on a Tuesday, arrived Thursday, and the packaging was tidy enough that I kept the box. Build quality is what you expect at this price — no creaks, no rattles, and the finish has not marked in six weeks of daily handling. The only thing I would change is the documentation, which assumes you already know the product family.',
  'I compared this against two alternatives in the same bracket before buying. It wins on fit and finish and loses slightly on features, which was the right trade for me. Setup took under ten minutes. Support answered a question about accessories within a day, which is more than I expected from a marketplace seller.',
  'Three weeks of use and it has become the default choice in the house. Nothing about it is flashy, and that is the appeal. The materials feel like they will last, and the parts that move still move the same way as on day one.',
  'Good product, average delivery. The item itself is genuine and matches the description exactly, including the serial on the box. It sat at the local hub for two extra days, which the seller was upfront about when I asked.',
  'Bought this to replace a unit that lasted four years, and the upgrade is real but incremental. If you are on the previous generation you can wait. Coming from anything older, this is a clear step up and the price is fair.',
  'The specification sheet is accurate, which is unusual enough to mention. Measured the dimensions myself and they matched to the millimetre. One star off because the accessory in the box is clearly a cost-saving choice.',
  'Runs a size small — I usually take M and needed L. Fabric is genuinely good, holds shape after four washes with no pilling and no colour bleed. Would order again knowing the sizing.',
  'Does exactly one thing and does not pretend otherwise. No app, no subscription, no account required. After a year of everything needing firmware updates, this was a relief.',
];

const REVIEW_LOCATIONS = ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'New Delhi', 'Pune, Maharashtra', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Kochi, Kerala', 'Jaipur, Rajasthan'];

export const reviews: Review[] = publishedProducts.flatMap((p) => {
  const r = new Rng(`rev:${p.id}`);
  const count = r.int(4, 11);
  return Array.from({ length: count }, (_, k) => {
    const cust = customers[(r.int(0, customers.length - 1) + k) % customers.length];
    const rating = r.weighted([[5, 52], [4, 26], [3, 12], [2, 6], [1, 4]]);
    const hasMedia = r.bool(0.28);
    const media: ReviewMedia[] = hasMedia
      ? Array.from({ length: r.int(1, 3) }, (_, m) => ({
          id: `${p.id}rm${k}${m}`,
          kind: m === 0 && r.bool(0.18) ? 'video' : 'image',
          seed: `${p.id}-review-${k}-${m}`,
          tint: p.tint,
          durationSec: r.int(12, 90),
        }))
      : [];
    const variant = p.variants[r.int(0, Math.max(0, p.variants.length - 1))];
    return {
      id: makeId('rvw', `${p.id}${k}`),
      productId: p.id,
      vendorId: p.vendorId,
      customerId: cust.id,
      customerName: cust.name,
      avatarSeed: cust.id,
      rating,
      title: r.pick(REVIEW_TITLES),
      body: r.pick(REVIEW_BODIES),
      createdAt: daysAgo(r.int(1, 400), r.int(0, 22)),
      verifiedPurchase: r.bool(0.86),
      helpfulCount: r.int(0, 480),
      notHelpfulCount: r.int(0, 40),
      media,
      variantLabel: variant ? `${variant.optionName}: ${variant.optionValue}` : undefined,
      status: r.bool(0.05) ? 'flagged' : 'published',
      vendorResponse: rating <= 3 && r.bool(0.55)
        ? {
            body: 'Thank you for the detailed note — this is useful. We have raised the packaging point with our warehouse team and would like to make this right. Our support team will reach out with a replacement or refund option, whichever you prefer.',
            at: daysAgo(r.int(0, 120), 4),
            author: `${vendorById.get(p.vendorId)?.name ?? 'Seller'} Support`,
          }
        : undefined,
      reported: r.bool(0.04),
      location: r.pick(REVIEW_LOCATIONS),
    };
  });
});

export const reviewsByProduct = reviews.reduce<Map<string, Review[]>>((m, rv) => {
  const list = m.get(rv.productId) ?? [];
  list.push(rv);
  m.set(rv.productId, list);
  return m;
}, new Map());

// Reconcile product rating aggregates with the generated reviews.
products.forEach((p) => {
  const list = reviewsByProduct.get(p.id);
  if (list?.length) {
    p.rating = Number((list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1));
    p.reviewCount = list.length;
  }
});

export const sellerRatings: SellerRating[] = activeVendors.flatMap((v) => {
  const r = new Rng(`sr:${v.id}`);
  return Array.from({ length: r.int(3, 7) }, (_, k) => {
    const packaging = r.int(3, 5), accuracy = r.int(3, 5), shippingSpeed = r.int(2, 5), communication = r.int(3, 5);
    return {
      id: makeId('srt', `${v.id}${k}`),
      vendorId: v.id,
      customerName: r.pick(customers).name,
      orderId: r.pick(orders).id,
      packaging, accuracy, shippingSpeed, communication,
      overall: Number(((packaging + accuracy + shippingSpeed + communication) / 4).toFixed(1)),
      comment: r.pick([
        'Dispatched the same evening and answered a packaging question within the hour.',
        'Invoice, warranty card and serial all matched. No complaints.',
        'Shipping took two days longer than the estimate, but communication was proactive.',
        'Second order from this seller. Consistent packing quality both times.',
      ]),
      createdAt: daysAgo(r.int(2, 300), r.int(0, 20)),
    };
  });
});

export const productQuestions: ProductQuestion[] = publishedProducts.flatMap((p) => {
  const r = new Rng(`q:${p.id}`);
  const QS = [
    'Does this come with an India warranty or is it an import unit?',
    'Is the invoice GST compliant for business purchase?',
    'Will this work with the previous generation accessories?',
    'What is the actual weight without packaging?',
    'Can I return it if the size does not fit?',
    'Is the seller shipping from within India?',
  ];
  return r.sample(QS, r.int(2, 4)).map((q, k) => ({
    id: makeId('qst', `${p.id}${k}`),
    productId: p.id,
    askedBy: r.pick(customers).name.split(' ')[0],
    askedAt: daysAgo(r.int(4, 220), r.int(0, 20)),
    question: q,
    votes: r.int(0, 84),
    answers: [
      {
        id: `${p.id}a${k}`,
        body: r.pick([
          'Yes — this ships with a manufacturer warranty valid at all authorised service centres in India. Register the serial within 30 days to activate on-site support.',
          'A GST invoice with your business GSTIN is generated at checkout if you select Business purchase. It is available to download from Orders immediately after dispatch.',
          'Accessories from the previous generation are compatible, with the exception of the charging dock, which changed dimensions this year.',
          'Shipped weight is listed in the specification table. Product-only weight is about 8% lower than the boxed figure.',
        ]),
        author: `${vendorById.get(p.vendorId)?.name ?? 'Seller'} Support`,
        authorType: 'vendor' as const,
        at: daysAgo(r.int(2, 200), 6),
        helpfulCount: r.int(2, 140),
      },
      ...(r.bool(0.4)
        ? [{
            id: `${p.id}a${k}b`,
            body: 'Can confirm from my own order last month — warranty registration went through without issue and the service centre had the serial on file.',
            author: r.pick(customers).name.split(' ')[0],
            authorType: 'customer' as const,
            at: daysAgo(r.int(1, 90), 3),
            helpfulCount: r.int(0, 60),
          }]
        : []),
    ],
  }));
});

/* ─────────────────────── Promotions, coupons, finance ───────────────────── */

export const promotions: Promotion[] = [
  { id: 'pro_flash_electronics', name: 'Forge Flash — Electronics 48h', type: 'flash_sale', status: 'active', description: 'Up to 45% off headline audio, wearables and TV listings for 48 hours.', discountValue: 45, startsAt: daysAgo(1), endsAt: daysAhead(1, 6), scope: { vendorIds: ['ven_techworld', 'ven_cadenzaaudio'], categoryIds: ['cat_electronics'], productIds: [] }, ownerType: 'platform', createdBy: 'Priya Nair', metrics: { impressions: 1_842_300, redemptions: 12480, revenue: 41_820_000, uplift: 38.4 }, tint: '#F03E0B' },
  { id: 'pro_bts', name: 'Back to Work — Computers', type: 'category', status: 'active', description: 'Flat 12% off laptops, monitors and desk accessories across approved sellers.', discountValue: 12, startsAt: daysAgo(9), endsAt: daysAhead(12), scope: { vendorIds: [], categoryIds: ['cat_computers'], productIds: [] }, ownerType: 'platform', createdBy: 'Priya Nair', metrics: { impressions: 984_100, redemptions: 6210, revenue: 62_400_000, uplift: 22.1 }, tint: '#0F766E' },
  { id: 'pro_fashion_bxgy', name: 'Northloom Buy 2 Get 1', type: 'bxgy', status: 'active', description: 'Buy any two Northloom shirts and get the third free.', discountValue: 100, startsAt: daysAgo(4), endsAt: daysAhead(20), scope: { vendorIds: ['ven_northloomstudio'], categoryIds: ['cat_fashion'], productIds: [] }, ownerType: 'vendor', vendorId: 'ven_northloomstudio', createdBy: 'Northloom Studio', metrics: { impressions: 312_400, redemptions: 2140, revenue: 8_940_000, uplift: 46.8 }, bxgy: { buyQty: 2, getQty: 1 }, tint: '#9D174D' },
  { id: 'pro_freeship', name: 'Free Shipping Weekend', type: 'free_shipping', status: 'scheduled', description: 'Free standard shipping with no minimum order across all categories.', discountValue: 0, startsAt: daysAhead(4), endsAt: daysAhead(6), scope: { vendorIds: [], categoryIds: [], productIds: [] }, ownerType: 'platform', createdBy: 'Meera Joshi', metrics: { impressions: 0, redemptions: 0, revenue: 0, uplift: 0 }, tint: '#1D4ED8' },
  { id: 'pro_beauty', name: 'GlowRoom Skincare Bundle', type: 'vendor', status: 'active', description: '20% off when two or more GlowRoom skincare items are in the cart.', discountValue: 20, startsAt: daysAgo(14), endsAt: daysAhead(8), scope: { vendorIds: ['ven_glowroom'], categoryIds: ['cat_beauty'], productIds: [] }, ownerType: 'vendor', vendorId: 'ven_glowroom', createdBy: 'GlowRoom', metrics: { impressions: 218_900, redemptions: 3410, revenue: 5_120_000, uplift: 31.2 }, tint: '#BE185D' },
  { id: 'pro_coffee', name: 'Roast Republic Subscribe & Save', type: 'percentage', status: 'active', description: '15% off recurring coffee orders with free express shipping.', discountValue: 15, startsAt: daysAgo(60), endsAt: daysAhead(120), scope: { vendorIds: ['ven_roastrepublic'], categoryIds: ['cat_grocery'], productIds: [] }, ownerType: 'vendor', vendorId: 'ven_roastrepublic', createdBy: 'Roast Republic', metrics: { impressions: 142_600, redemptions: 5820, revenue: 3_180_000, uplift: 18.9 }, tint: '#78350F' },
  { id: 'pro_diwali', name: 'Festive Forge — Sitewide', type: 'percentage', status: 'expired', description: 'Sitewide festive event with tiered discounts up to 60%.', discountValue: 60, startsAt: daysAgo(72), endsAt: daysAgo(58), scope: { vendorIds: [], categoryIds: [], productIds: [] }, ownerType: 'platform', createdBy: 'Priya Nair', metrics: { impressions: 8_412_000, redemptions: 84120, revenue: 412_800_000, uplift: 88.2 }, tint: '#C2410C' },
  { id: 'pro_toys', name: 'Brickwright Clearance', type: 'fixed', status: 'paused', description: 'Flat ₹500 off building sets above ₹2,499.', discountValue: 500, startsAt: daysAgo(20), endsAt: daysAhead(3), scope: { vendorIds: ['ven_brickwrighttoys'], categoryIds: ['cat_toys'], productIds: [] }, ownerType: 'vendor', vendorId: 'ven_brickwrighttoys', createdBy: 'Brickwright Toys', metrics: { impressions: 84_200, redemptions: 640, revenue: 1_820_000, uplift: 9.4 }, tint: '#0E7490' },
  { id: 'pro_draft', name: 'New Year Forge 2027', type: 'percentage', status: 'draft', description: 'Draft plan for the January sitewide event. Pending finance sign-off.', discountValue: 40, startsAt: daysAhead(118), endsAt: daysAhead(126), scope: { vendorIds: [], categoryIds: [], productIds: [] }, ownerType: 'platform', createdBy: 'Priya Nair', metrics: { impressions: 0, redemptions: 0, revenue: 0, uplift: 0 }, tint: '#4C1D95' },
];

export const coupons: Coupon[] = [
  { id: 'cpn_forge10', code: 'FORGE10', discountType: 'percentage', discountAmount: 10, minOrderValue: 999, maxDiscount: 2000, usageLimit: 100000, usedCount: 41820, perUserLimit: 3, startsAt: daysAgo(40), endsAt: daysAhead(50), status: 'active', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(41), createdBy: 'Priya Nair', description: '10% off any order above ₹999, capped at ₹2,000.' },
  { id: 'cpn_welcome200', code: 'WELCOME200', discountType: 'fixed', discountAmount: 200, minOrderValue: 799, usageLimit: 50000, usedCount: 18240, perUserLimit: 1, startsAt: daysAgo(180), endsAt: daysAhead(180), status: 'active', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: true, stackable: false, createdAt: daysAgo(181), createdBy: 'Priya Nair', description: 'Flat ₹200 off the first order for new customers.' },
  { id: 'cpn_festive15', code: 'FESTIVE15', discountType: 'percentage', discountAmount: 15, minOrderValue: 2499, maxDiscount: 3500, usageLimit: 30000, usedCount: 28940, perUserLimit: 2, startsAt: daysAgo(10), endsAt: daysAhead(6), status: 'active', applicableVendorIds: [], applicableCategoryIds: ['cat_electronics', 'cat_computers'], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(12), createdBy: 'Aditya Kulkarni', description: '15% off Electronics and Computers above ₹2,499.' },
  { id: 'cpn_freeship', code: 'FREESHIP', discountType: 'free_shipping', discountAmount: 0, minOrderValue: 0, usageLimit: 200000, usedCount: 92140, perUserLimit: 5, startsAt: daysAgo(90), endsAt: daysAhead(90), status: 'active', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: false, stackable: true, createdAt: daysAgo(92), createdBy: 'Meera Joshi', description: 'Waives standard shipping on any order.' },
  { id: 'cpn_glow20', code: 'GLOW20', discountType: 'percentage', discountAmount: 20, minOrderValue: 1499, maxDiscount: 800, usageLimit: 10000, usedCount: 3410, perUserLimit: 2, startsAt: daysAgo(14), endsAt: daysAhead(8), status: 'active', applicableVendorIds: ['ven_glowroom'], applicableCategoryIds: ['cat_beauty'], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(15), createdBy: 'GlowRoom', description: '20% off GlowRoom skincare above ₹1,499.' },
  { id: 'cpn_brew15', code: 'BREW15', discountType: 'percentage', discountAmount: 15, minOrderValue: 599, maxDiscount: 300, usageLimit: 25000, usedCount: 5820, perUserLimit: 4, startsAt: daysAgo(60), endsAt: daysAhead(120), status: 'active', applicableVendorIds: ['ven_roastrepublic'], applicableCategoryIds: ['cat_grocery'], applicableProductIds: [], firstOrderOnly: false, stackable: true, createdAt: daysAgo(61), createdBy: 'Roast Republic', description: '15% off Roast Republic coffee.' },
  { id: 'cpn_newyear', code: 'FORGE2027', discountType: 'percentage', discountAmount: 25, minOrderValue: 1999, maxDiscount: 5000, usageLimit: 80000, usedCount: 0, perUserLimit: 2, startsAt: daysAhead(118), endsAt: daysAhead(126), status: 'scheduled', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(3), createdBy: 'Priya Nair', description: 'New Year event coupon — 25% off, capped at ₹5,000.' },
  { id: 'cpn_diwali', code: 'FESTIVE60', discountType: 'percentage', discountAmount: 60, minOrderValue: 4999, maxDiscount: 12000, usageLimit: 120000, usedCount: 84120, perUserLimit: 1, startsAt: daysAgo(72), endsAt: daysAgo(58), status: 'expired', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(80), createdBy: 'Priya Nair', description: 'Expired festive event coupon.' },
  { id: 'cpn_bulk', code: 'BULK5', discountType: 'percentage', discountAmount: 5, minOrderValue: 24999, maxDiscount: 4000, usageLimit: 5000, usedCount: 218, perUserLimit: 10, startsAt: daysAgo(30), endsAt: daysAhead(60), status: 'disabled', applicableVendorIds: [], applicableCategoryIds: [], applicableProductIds: [], firstOrderOnly: false, stackable: false, createdAt: daysAgo(31), createdBy: 'Meera Joshi', description: 'Disabled pending abuse review — bulk order discount.' },
];

export const giftCards: GiftCard[] = [
  { id: 'gc_1', code: 'FORGE-4K2M-99XA', balance: 1500, initialValue: 2000, issuedAt: daysAgo(120), expiresAt: daysAhead(245), status: 'active' },
  { id: 'gc_2', code: 'FORGE-8HQ1-2ZLP', balance: 0, initialValue: 1000, issuedAt: daysAgo(300), expiresAt: daysAhead(65), status: 'redeemed' },
];

export const commissions: Commission[] = [
  { id: 'com_global', scope: 'global', scopeLabel: 'All vendors and categories', ratePct: 12, fixedFee: 0, effectiveFrom: daysAgo(400), status: 'active', updatedBy: 'Meera Joshi', updatedAt: daysAgo(400), note: 'Platform default. Applies when no more specific rule matches.', priority: 4 },
  { id: 'com_cat_electronics', scope: 'category', scopeId: 'cat_electronics', scopeLabel: 'Electronics', ratePct: 9.5, fixedFee: 0, effectiveFrom: daysAgo(210), status: 'active', updatedBy: 'Meera Joshi', updatedAt: daysAgo(30), note: 'Reduced to stay competitive on audio and wearables.', priority: 3 },
  { id: 'com_cat_grocery', scope: 'category', scopeId: 'cat_grocery', scopeLabel: 'Grocery', ratePct: 6, fixedFee: 4, effectiveFrom: daysAgo(190), status: 'active', updatedBy: 'Meera Joshi', updatedAt: daysAgo(190), note: 'Low-margin category — fixed pick fee applies per unit.', priority: 3 },
  { id: 'com_cat_fashion', scope: 'category', scopeId: 'cat_fashion', scopeLabel: 'Fashion', ratePct: 18, fixedFee: 0, effectiveFrom: daysAgo(365), status: 'active', updatedBy: 'Priya Nair', updatedAt: daysAgo(88), note: 'Higher rate reflects return handling cost.', priority: 3 },
  { id: 'com_ven_techworld', scope: 'vendor', scopeId: 'ven_techworld', scopeLabel: 'TechWorld', ratePct: 8, fixedFee: 0, effectiveFrom: daysAgo(120), status: 'active', updatedBy: 'Priya Nair', updatedAt: daysAgo(120), note: 'Negotiated rate — strategic seller, GMV above ₹5Cr/quarter.', priority: 2 },
  { id: 'com_ven_roast', scope: 'vendor', scopeId: 'ven_roastrepublic', scopeLabel: 'Roast Republic', ratePct: 5.5, fixedFee: 4, effectiveFrom: daysAgo(60), status: 'active', updatedBy: 'Meera Joshi', updatedAt: daysAgo(60), priority: 2 },
  { id: 'com_prod_flagship', scope: 'product', scopeId: products[19]?.id, scopeLabel: products[19]?.shortTitle ?? 'Kestrel K9 Pro 5G', ratePct: 6.5, fixedFee: 0, effectiveFrom: daysAgo(45), status: 'active', updatedBy: 'Priya Nair', updatedAt: daysAgo(45), note: 'Launch support rate for the flagship handset.', priority: 1 },
  { id: 'com_cat_beauty_sched', scope: 'category', scopeId: 'cat_beauty', scopeLabel: 'Beauty', ratePct: 14, fixedFee: 0, effectiveFrom: daysAhead(28), status: 'scheduled', updatedBy: 'Meera Joshi', updatedAt: daysAgo(6), note: 'Approved increase, effective next billing cycle.', priority: 3 },
  { id: 'com_archived', scope: 'global', scopeLabel: 'All vendors (2025 schedule)', ratePct: 14, fixedFee: 0, effectiveFrom: daysAgo(900), effectiveTo: daysAgo(400), status: 'archived', updatedBy: 'Priya Nair', updatedAt: daysAgo(400), priority: 4 },
];

export const payouts: Payout[] = activeVendors.flatMap((v) => {
  const r = new Rng(`payout:${v.id}`);
  return Array.from({ length: 8 }, (_, k) => {
    const gross = Math.round((v.grossSales / 26) * r.float(0.6, 1.5, 2));
    const commission = Math.round((gross * v.commissionRate) / 100);
    const tax = Math.round(gross * 0.041);
    const shippingFees = Math.round(gross * 0.023);
    const refundsAmt = Math.round(gross * r.float(0.005, 0.06, 3));
    const adjustments = r.bool(0.3) ? -r.int(200, 6400) : 0;
    const net = gross - commission - tax - shippingFees - refundsAmt + adjustments;
    const status: Payout['status'] = k === 0 ? 'pending' : k === 1 ? (r.bool(0.3) ? 'on_hold' : 'processing') : r.bool(0.03) ? 'failed' : 'paid';
    return {
      id: makeId('pyo', `${v.id}${k}`),
      vendorId: v.id,
      periodStart: daysAgo(7 * (k + 1)),
      periodEnd: daysAgo(7 * k + 1),
      grossSales: gross,
      commission,
      tax,
      shippingFees,
      refunds: refundsAmt,
      adjustments,
      netAmount: net,
      status,
      scheduledFor: daysAgo(7 * k - 2),
      paidAt: status === 'paid' ? daysAgo(7 * k - 2) : undefined,
      reference: `PYT-2026-${r.int(10000, 99999)}`,
      method: r.weighted<Payout['method']>([['bank_transfer', 8], ['upi', 2], ['wire', 1]]),
      orderCount: r.int(40, 620),
    };
  });
});

/* ───────────────────────── Disputes & support ───────────────────────────── */

const DISPUTE_SUBJECTS: [Dispute['category'], string][] = [
  ['item_not_received', 'Parcel marked delivered but never received'],
  ['not_as_described', 'Received a lower configuration than ordered'],
  ['refund_not_received', 'Refund not credited 12 days after pickup'],
  ['damaged', 'Screen cracked on arrival, seller declined return'],
  ['chargeback', 'Card chargeback raised by issuing bank'],
  ['policy_violation', 'Seller listing uses another brand imagery'],
];

function conversation(r: Rng, customerName: string, vendorName: string, category: Dispute['category']): ConversationMessage[] {
  const base: ConversationMessage[] = [
    { id: 'm1', authorType: 'customer', authorName: customerName, avatarSeed: customerName, body: r.pick([
      'The tracking shows delivered on Monday afternoon but nothing arrived. Nobody at home received a parcel and there is no delivery photo on the tracking page. I have already checked with the neighbours and the building security desk.',
      'The listing specified 16GB RAM and the invoice says the same, but the unit that arrived reports 8GB in system information. I have attached a screenshot and a photo of the serial label.',
      'The return was picked up twelve days ago and the status has not moved past inspection. My refund of the full amount is still pending and I have had no update from the seller.',
    ]), at: daysAgo(r.int(4, 14), 2), attachments: [{ id: 'a1', label: 'tracking-screenshot.png', seed: 'ev-1' }] },
    { id: 'm2', authorType: 'agent', authorName: 'Rehan Qureshi', avatarSeed: 'admin-4', body: 'Thanks for the detail, and sorry about this. I have opened a dispute and asked the seller for their dispatch records and the carrier proof of delivery. You will hear back within 48 hours — I have set a reminder to follow up either way.', at: daysAgo(r.int(3, 12), 5) },
    { id: 'm3', authorType: 'vendor', authorName: `${vendorName} Support`, avatarSeed: vendorName, body: r.pick([
      'We have pulled the dispatch record and the carrier POD. The signature on file does not match the customer name, so we accept that final-mile handling is at fault and we will not contest a refund. Raising a claim with the carrier separately.',
      'Our packing video for this order number shows the correct configuration going into the box. We are happy to accept the return for inspection and will refund in full if the serial matches what we shipped.',
      'The return reached our warehouse but was routed to the wrong bay. Inspection is complete as of this morning and we have released the refund from our side.',
    ]), at: daysAgo(r.int(1, 8), 8), attachments: [{ id: 'a2', label: 'carrier-pod.pdf', seed: 'ev-2' }] },
  ];
  if (category === 'chargeback') {
    base.push({ id: 'm4', authorType: 'system', authorName: 'ForgePay', avatarSeed: 'system', body: 'Chargeback received from the issuing bank. Reason code 13.1 — merchandise not received. Evidence bundle is due within 7 calendar days. Disputed amount has been debited from the platform reserve pending outcome.', at: daysAgo(2, 3) });
  }
  return base;
}

export const disputes: Dispute[] = Array.from({ length: 18 }, (_, i) => {
  const r = new Rng(`dis:${i}`);
  const order = orders[i * 11 + 4];
  const cust = customerById.get(order.customerId)!;
  const vendorId = order.items[0].vendorId;
  const vendor = vendorById.get(vendorId)!;
  const [category, subject] = r.pick(DISPUTE_SUBJECTS);
  const status = r.weighted<DisputeStatus>([['open', 4], ['under_review', 4], ['waiting_customer', 2], ['waiting_vendor', 3], ['resolved', 4], ['closed', 2]]);
  const resolved = status === 'resolved' || status === 'closed';
  return {
    id: makeId('dsp', `${i}`),
    reference: `DSP-2026-${String(1040 + i * 3)}`,
    orderId: order.id,
    orderNumber: order.number,
    customerId: cust.id,
    customerName: cust.name,
    vendorId,
    raisedBy: r.weighted<'customer' | 'vendor'>([['customer', 8], ['vendor', 2]]),
    subject,
    category,
    amountInDispute: order.totals.grandTotal,
    status,
    priority: r.weighted<Dispute['priority']>([['low', 2], ['medium', 4], ['high', 3], ['urgent', 1]]),
    openedAt: daysAgo(r.int(1, 30), r.int(0, 20)),
    updatedAt: daysAgo(r.int(0, 5), r.int(0, 12)),
    slaDueAt: daysAhead(r.int(-2, 4), r.int(0, 12)),
    assigneeName: r.pick(['Rehan Qureshi', 'Rehan Qureshi', 'Priya Nair', undefined as unknown as string]),
    messages: conversation(r, cust.name, vendor.name, category),
    evidence: [
      { id: `ev${i}a`, label: 'Carrier proof of delivery.pdf', kind: 'document', seed: `ev-${i}-a`, uploadedBy: vendor.name, at: daysAgo(r.int(1, 6), 4) },
      { id: `ev${i}b`, label: 'Unboxing photo', kind: 'image', seed: `ev-${i}-b`, uploadedBy: cust.name, at: daysAgo(r.int(2, 8), 7) },
      { id: `ev${i}c`, label: 'Payment gateway log', kind: 'log', seed: `ev-${i}-c`, uploadedBy: 'ForgePay', at: daysAgo(r.int(1, 4), 1) },
    ],
    resolution: resolved
      ? {
          outcome: r.weighted([['refund_customer', 5], ['partial_refund', 3], ['favour_vendor', 2], ['replacement', 2], ['no_action', 1]]),
          amount: Math.round(order.totals.grandTotal * r.float(0.3, 1, 2)),
          note: 'Carrier proof of delivery could not be validated. Refunded the customer in full and raised a recovery claim against the carrier. Seller not penalised.',
          at: daysAgo(r.int(0, 4), 6),
          by: 'Priya Nair',
        }
      : undefined,
  };
});

export const supportTickets: SupportTicket[] = Array.from({ length: 26 }, (_, i) => {
  const r = new Rng(`tkt:${i}`);
  const fromVendor = r.bool(0.3);
  const cust = customers[(i * 9) % customers.length];
  const vendor = r.pick(activeVendors);
  const category = r.pick<SupportTicket['category']>(['order', 'payment', 'account', 'product', 'returns', 'technical', 'vendor_onboarding']);
  const SUBJECTS: Record<SupportTicket['category'], string[]> = {
    order: ['Cannot change delivery address on an order', 'Order shows confirmed but no dispatch after 4 days'],
    payment: ['Charged twice for the same order', 'EMI option not appearing at checkout'],
    account: ['Two-factor codes not arriving', 'Need to merge two accounts with the same email'],
    product: ['Listing shows wrong warranty period', 'Variant selector missing on a product page'],
    returns: ['Pickup agent did not arrive in the booked slot', 'Return rejected without an inspection note'],
    technical: ['Invoice PDF download fails on Safari', 'Bulk export times out for large catalogues'],
    vendor_onboarding: ['GST verification stuck at Under Review', 'Cannot upload bank statement over 5MB'],
  };
  const status = r.weighted<SupportTicket['status']>([['open', 5], ['pending', 3], ['on_hold', 1], ['solved', 5], ['closed', 2]]);
  return {
    id: makeId('tkt', `${i}`),
    reference: `TKT-${String(58210 + i * 4)}`,
    subject: r.pick(SUBJECTS[category]),
    requesterType: fromVendor ? 'vendor' : 'customer',
    requesterId: fromVendor ? vendor.id : cust.id,
    requesterName: fromVendor ? vendor.name : cust.name,
    category: fromVendor ? (r.bool(0.5) ? 'vendor_onboarding' : category) : category,
    orderNumber: r.bool(0.6) ? orders[i * 5].number : undefined,
    status,
    priority: r.weighted<SupportTicket['priority']>([['low', 2], ['normal', 5], ['high', 3], ['urgent', 1]]),
    channel: r.weighted<SupportTicket['channel']>([['chat', 4], ['email', 4], ['web', 3], ['phone', 1]]),
    createdAt: daysAgo(r.int(0, 24), r.int(0, 22)),
    updatedAt: daysAgo(r.int(0, 3), r.int(0, 12)),
    firstResponseMins: status === 'open' ? undefined : r.int(4, 320),
    assigneeName: status === 'open' ? undefined : r.pick(['Rehan Qureshi', 'Priya Nair', 'Aditya Kulkarni']),
    satisfaction: status === 'solved' ? r.weighted([['good', 8], ['bad', 2]]) : undefined,
    messages: [
      { id: `t${i}m1`, authorType: fromVendor ? 'vendor' : 'customer', authorName: fromVendor ? vendor.name : cust.name, avatarSeed: fromVendor ? vendor.id : cust.id, body: r.pick([
        'I have tried this on two browsers and the same thing happens each time. Screenshot attached. This is blocking me from completing the order today, which matters because the coupon expires tonight.',
        'This has been open on my side for three days. Could someone confirm whether the amount will be reversed automatically or if I need to raise a formal claim?',
        'Following up on the earlier thread — the document is 6.2MB and the uploader rejects anything over 5MB. Can the limit be raised, or is there another way to submit it?',
      ]), at: daysAgo(r.int(1, 20), 3) },
      ...(status !== 'open'
        ? [{ id: `t${i}m2`, authorType: 'agent' as const, authorName: 'Rehan Qureshi', avatarSeed: 'admin-4', body: 'Thanks for flagging this — I can reproduce it. I have raised it with engineering as a P2 and applied a manual workaround on your account so you are not blocked in the meantime. I will keep this ticket open until the fix ships.', at: daysAgo(r.int(0, 12), 6) }]
        : []),
    ],
    tags: r.sample(['billing', 'checkout', 'p2', 'vip', 'escalated', 'awaiting-eng', 'refund', 'onboarding'], r.int(1, 3)),
  };
});

/* ───────────────────────── Notifications & audit ────────────────────────── */

export const notifications: Notification[] = [
  { id: 'ntf_c1', audience: 'customer', recipientId: currentCustomer.id, kind: 'delivery', title: 'Arriving today', body: `Your ${myOrders[0].items[0].title.split('—')[0].trim()} is out for delivery and should arrive before 7pm.`, at: daysAgo(0, -3), read: false, href: `/orders/${myOrders[0].id}`, severity: 'info' },
  { id: 'ntf_c2', audience: 'customer', recipientId: currentCustomer.id, kind: 'order_update', title: 'Shipped', body: `Order ${myOrders[1].number} has been handed to ForgeExpress. Track it for live checkpoints.`, at: daysAgo(1, 4), read: false, href: `/orders/${myOrders[1].id}`, severity: 'success' },
  { id: 'ntf_c3', audience: 'customer', recipientId: currentCustomer.id, kind: 'price_drop', title: 'Price drop on your wishlist', body: 'Auralis Vox 700 dropped 24% to ₹24,990 — the lowest price in 90 days.', at: daysAgo(1, -6), read: false, href: '/wishlist', severity: 'success' },
  { id: 'ntf_c4', audience: 'customer', recipientId: currentCustomer.id, kind: 'refund', title: 'Refund credited', body: '₹4,299 has been credited to your HDFC card ending 4821 for RMA-482911.', at: daysAgo(2, 2), read: true, href: '/account/returns', severity: 'success' },
  { id: 'ntf_c5', audience: 'customer', recipientId: currentCustomer.id, kind: 'back_in_stock', title: 'Back in stock', body: 'Everkeep Cast Iron Dutch Oven 4.5L is available again from Everkeep Kitchen.', at: daysAgo(3, 5), read: true, href: '/wishlist', severity: 'info' },
  { id: 'ntf_c6', audience: 'customer', recipientId: currentCustomer.id, kind: 'promotion', title: 'Forge Flash ends tonight', body: 'Up to 45% off Electronics for the next 9 hours. Your cart has two eligible items.', at: daysAgo(0, -8), read: true, href: '/deals', severity: 'warning' },

  { id: 'ntf_v1', audience: 'vendor', recipientId: 'ven_techworld', kind: 'new_order', title: '7 new orders', body: '7 orders are awaiting acceptance. The oldest has been waiting 4 hours — accept within 12 hours to protect your SLA.', at: daysAgo(0, -2), read: false, href: '/vendor/orders', severity: 'warning' },
  { id: 'ntf_v2', audience: 'vendor', recipientId: 'ven_techworld', kind: 'low_inventory', title: 'Low stock on 5 SKUs', body: 'MF-KES-1020 has 6 units left with 14 units of daily velocity. Restock to avoid a stock-out in under a day.', at: daysAgo(0, -5), read: false, href: '/vendor/inventory', severity: 'critical' },
  { id: 'ntf_v3', audience: 'vendor', recipientId: 'ven_techworld', kind: 'product_approval', title: 'Listing approved', body: 'Kestrel Nova Lite 5G passed catalogue review and is live in Mobiles › Smartphones.', at: daysAgo(1, 3), read: false, href: '/vendor/products', severity: 'success' },
  { id: 'ntf_v4', audience: 'vendor', recipientId: 'ven_techworld', kind: 'payout', title: 'Payout scheduled', body: 'Your payout of ₹18.4L for 25 Aug – 31 Aug is scheduled for Wednesday.', at: daysAgo(1, -4), read: true, href: '/vendor/payouts', severity: 'info' },
  { id: 'ntf_v5', audience: 'vendor', recipientId: 'ven_techworld', kind: 'review', title: 'New 2-star review', body: 'A verified buyer left 2 stars on Auralis Vox Air Pro. Responding within 24 hours improves resolution rates.', at: daysAgo(2, 6), read: true, href: '/vendor/reviews', severity: 'warning' },
  { id: 'ntf_v6', audience: 'vendor', recipientId: 'ven_techworld', kind: 'dispute', title: 'Dispute needs your evidence', body: 'DSP-2026-1052 is waiting on your dispatch records. SLA expires in 22 hours.', at: daysAgo(0, -7), read: false, href: '/vendor/orders', severity: 'critical' },

  { id: 'ntf_a1', audience: 'admin', recipientId: 'usr_admin', kind: 'vendor_application', title: '2 vendor applications pending', body: 'Velo Cycles is under review and Saffron & Salt was submitted 3 days ago, past the 2-day SLA.', at: daysAgo(0, -1), read: false, href: '/admin/vendors', severity: 'warning' },
  { id: 'ntf_a2', audience: 'admin', recipientId: 'usr_admin', kind: 'moderation', title: 'Moderation queue at 14', body: '14 listings await review; 3 are flagged for price outliers and 1 for trademark imagery.', at: daysAgo(0, -4), read: false, href: '/admin/products', severity: 'info' },
  { id: 'ntf_a3', audience: 'admin', recipientId: 'usr_admin', kind: 'payment_issue', title: 'Payout failed', body: 'A ₹2.4L bank transfer to Ironpeak Sports was rejected — IFSC mismatch. Retry after verifying bank details.', at: daysAgo(1, 2), read: false, href: '/admin/payouts', severity: 'critical' },
  { id: 'ntf_a4', audience: 'admin', recipientId: 'usr_admin', kind: 'dispute', title: 'Chargeback filed', body: 'A card chargeback for ₹68,999 was filed on MF-2026-480021. Evidence is due in 7 days.', at: daysAgo(2, 3), read: true, href: '/admin/disputes', severity: 'critical' },
  { id: 'ntf_a5', audience: 'admin', recipientId: 'usr_admin', kind: 'system', title: 'GMV milestone', body: 'Marketplace GMV crossed ₹100Cr for the trailing 90 days, up 34% year on year.', at: daysAgo(3, 4), read: true, href: '/admin/analytics', severity: 'success' },
];

const AUDIT_TEMPLATES: [AuditLog['resourceType'], string, AuditLog['severity']][] = [
  ['vendor', 'Vendor approved', 'info'],
  ['vendor', 'Vendor suspended', 'critical'],
  ['product', 'Product rejected', 'warning'],
  ['product', 'Product approved', 'info'],
  ['product', 'Product featured', 'info'],
  ['commission', 'Commission rate changed', 'critical'],
  ['refund', 'Refund issued', 'warning'],
  ['customer', 'Customer suspended', 'critical'],
  ['coupon', 'Coupon created', 'info'],
  ['coupon', 'Coupon disabled', 'warning'],
  ['payout', 'Payout released', 'info'],
  ['payout', 'Payout put on hold', 'warning'],
  ['category', 'Category attributes updated', 'info'],
  ['dispute', 'Dispute resolved', 'info'],
  ['settings', 'Shipping zone updated', 'info'],
  ['user', 'Role permissions changed', 'critical'],
];

const AUDIT_ACTORS: [string, User['role']][] = [
  ['Priya Nair', 'admin'], ['Aditya Kulkarni', 'catalog_manager'],
  ['Meera Joshi', 'finance_manager'], ['Rehan Qureshi', 'support_agent'],
];

export const auditLogs: AuditLog[] = Array.from({ length: 64 }, (_, i) => {
  const r = new Rng(`audit:${i}`);
  const [resourceType, action, severity] = r.pick(AUDIT_TEMPLATES);
  const [actorName, actorRole] = r.pick(AUDIT_ACTORS);
  const resource =
    resourceType === 'vendor' ? r.pick(vendors)
    : resourceType === 'product' ? r.pick(products)
    : resourceType === 'customer' ? r.pick(customers)
    : resourceType === 'coupon' ? r.pick(coupons)
    : resourceType === 'commission' ? r.pick(commissions)
    : resourceType === 'payout' ? r.pick(payouts)
    : resourceType === 'dispute' ? r.pick(disputes)
    : null;
  const label =
    resource && 'name' in resource ? String(resource.name)
    : resource && 'title' in resource ? String(resource.title)
    : resource && 'code' in resource ? String(resource.code)
    : resource && 'scopeLabel' in resource ? String(resource.scopeLabel)
    : resource && 'reference' in resource ? String(resource.reference)
    : 'Global settings';

  const diffs: Record<string, { before: Record<string, unknown>; after: Record<string, unknown> }> = {
    'Commission rate changed': { before: { ratePct: 12, fixedFee: 0 }, after: { ratePct: 9.5, fixedFee: 0 } },
    'Vendor approved': { before: { status: 'under_review' }, after: { status: 'approved', commissionRate: 12 } },
    'Vendor suspended': { before: { status: 'approved' }, after: { status: 'suspended', reason: 'Counterfeit complaint rate above 2%' } },
    'Product rejected': { before: { status: 'pending_approval' }, after: { status: 'rejected', reason: 'Image overlay text' } },
    'Product approved': { before: { status: 'pending_approval' }, after: { status: 'published' } },
    'Customer suspended': { before: { status: 'active' }, after: { status: 'suspended', reason: 'Return abuse — 14 returns in 30 days' } },
    'Refund issued': { before: { refundedAmount: 0 }, after: { refundedAmount: 4299, method: 'original' } },
    'Coupon disabled': { before: { status: 'active' }, after: { status: 'disabled', reason: 'Suspected coupon farming' } },
    'Payout put on hold': { before: { status: 'processing' }, after: { status: 'on_hold', reason: 'Open dispute above threshold' } },
    'Role permissions changed': { before: { permissions: ['catalog.view'] }, after: { permissions: ['catalog.view', 'catalog.moderate'] } },
  };
  const diff = diffs[action];

  return {
    id: makeId('aud', `${i}`),
    at: daysAgo(r.int(0, 45), r.int(0, 22)),
    actorName,
    actorRole,
    action,
    resourceType,
    resourceId: resource && 'id' in resource ? String(resource.id) : 'global',
    resourceLabel: label,
    ip: `103.${r.int(1, 254)}.${r.int(1, 254)}.${r.int(1, 254)}`,
    device: r.pick(['Chrome 141 · macOS 15', 'Chrome 141 · Windows 11', 'Firefox 142 · Ubuntu 24.04', 'Safari 19 · macOS 15']),
    location: r.pick(['Bengaluru, IN', 'Mumbai, IN', 'Gurugram, IN', 'Remote · VPN']),
    severity,
    before: diff?.before,
    after: diff?.after,
    note: severity === 'critical' ? 'Change required a second approval under the four-eyes policy.' : undefined,
  };
}).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

/* ───────────────────────── Wishlists & storefronts ──────────────────────── */

export const wishlists: Wishlist[] = [
  {
    id: 'wls_default', customerId: currentCustomer.id, name: 'My Wishlist', isDefault: true, visibility: 'private', createdAt: daysAgo(180),
    items: [pp(0), pp(11), pp(19), pp(27), pp(40), pp(52)].map((p, i) => ({
      id: `wli_d${i}`, productId: p.id, addedAt: daysAgo(i * 9 + 3), priceAtAdd: Math.round(p.price * (i % 3 === 0 ? 1.18 : 1)),
    })),
  },
  {
    id: 'wls_desk', customerId: currentCustomer.id, name: 'Desk Setup 2027', isDefault: false, visibility: 'shared', createdAt: daysAgo(64),
    items: [pp(14), pp(16), pp(17), pp(31)].map((p, i) => ({
      id: `wli_k${i}`, productId: p.id, addedAt: daysAgo(i * 6 + 2), priceAtAdd: Math.round(p.price * (i === 1 ? 1.12 : 1)), note: i === 0 ? 'Wait for the next flash sale' : undefined,
    })),
  },
  {
    id: 'wls_gifts', customerId: currentCustomer.id, name: 'Gifts', isDefault: false, visibility: 'private', createdAt: daysAgo(22),
    items: [pp(63), pp(70), pp(46)].map((p, i) => ({
      id: `wli_g${i}`, productId: p.id, addedAt: daysAgo(i * 4 + 1), priceAtAdd: p.price,
    })),
  },
];

export const vendorStores: VendorStore[] = activeVendors.map((v) => {
  const r = new Rng(`store:${v.id}`);
  const own = products.filter((p) => p.vendorId === v.id && p.status === 'published');
  return {
    id: makeId('vst', v.id),
    vendorId: v.id,
    headline: v.tagline,
    description: v.about,
    announcement: r.bool(0.5) ? r.pick([
      'Dispatching same day on orders placed before 4pm IST.',
      'Extended 30-day returns on all listings this month.',
      'Free express shipping on orders above ₹4,999.',
    ]) : undefined,
    policies: {
      shipping: `Orders are packed within one business day and dispatched from ${v.homeCity}. Standard delivery reaches metro pin codes in 2–3 days and the rest of India in 4–6 days. Express is offered at checkout where serviceable.`,
      returns: `Returns accepted within the window shown on each listing, provided the item is unused with tags and original packaging intact. Damaged or wrong items are picked up free of charge; change-of-mind returns carry a ₹99 reverse logistics fee.`,
      warranty: `Manufacturer warranty applies from the invoice date and is honoured at authorised service centres. ${v.name} handles warranty coordination for the first 30 days directly.`,
    },
    socials: { website: `https://www.${v.slug.replace(/-/g, '')}.in`, instagram: `@${v.slug.replace(/-/g, '')}`, x: `@${v.slug.replace(/-/g, '')}` },
    featuredProductIds: own.slice(0, 4).map((p) => p.id),
    collections: [
      { id: `col_${v.id}_new`, title: 'New this season', productIds: own.slice(0, 6).map((p) => p.id) },
      { id: `col_${v.id}_best`, title: 'Best sellers', productIds: [...own].sort((a, b) => b.soldCount - a.soldCount).slice(0, 6).map((p) => p.id) },
    ],
    metrics: { followers: r.int(840, 48000), storeVisits30d: r.int(9800, 420000), conversionRate: r.float(1.4, 6.8, 2) },
  };
});

export const storeByVendor = new Map(vendorStores.map((s) => [s.vendorId, s]));
