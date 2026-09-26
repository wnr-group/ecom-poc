import type {
  Brand, Category, DeliveryPartner, FaqEntry, ShippingMethod, ShippingZone, Warehouse,
} from '../types';

/* ───────────────────────────── Categories ───────────────────────────────── */

interface CatSeed {
  slug: string;
  name: string;
  icon: string;
  tint: string;
  description: string;
  children: string[];
  attributes: Category['attributes'];
}

const TOP_LEVEL: CatSeed[] = [
  {
    slug: 'electronics', name: 'Electronics', icon: 'Cable', tint: '#1D4ED8',
    description: 'Audio, wearables, cameras and smart home gear from verified sellers.',
    children: ['Headphones & Earbuds', 'Smartwatches', 'Cameras', 'Televisions', 'Speakers', 'Gaming'],
    attributes: [
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['Bluetooth 5.3', 'Bluetooth 5.2', 'Wi-Fi 6', 'Wired', 'USB-C'], filterable: true },
      { key: 'warranty', label: 'Warranty', type: 'select', options: ['6 months', '1 year', '2 years'], filterable: true },
      { key: 'batteryLife', label: 'Battery life', type: 'number', unit: 'hrs', filterable: true },
    ],
  },
  {
    slug: 'computers', name: 'Computers', icon: 'Laptop', tint: '#0F766E',
    description: 'Laptops, desktops, monitors and components for work and play.',
    children: ['Laptops', 'Monitors', 'Keyboards & Mice', 'Storage', 'Components'],
    attributes: [
      { key: 'processor', label: 'Processor', type: 'select', options: ['Intel Core i5', 'Intel Core i7', 'Intel Core Ultra 7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M3'], filterable: true },
      { key: 'ram', label: 'RAM', type: 'select', options: ['8 GB', '16 GB', '24 GB', '32 GB'], filterable: true },
      { key: 'storage', label: 'Storage', type: 'select', options: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD'], filterable: true },
      { key: 'screenSize', label: 'Screen size', type: 'number', unit: 'in', filterable: true },
    ],
  },
  {
    slug: 'mobiles', name: 'Mobiles', icon: 'Smartphone', tint: '#4C1D95',
    description: 'Flagship and value smartphones, tablets and accessories.',
    children: ['Smartphones', 'Tablets', 'Cases & Covers', 'Chargers & Cables', 'Power Banks'],
    attributes: [
      { key: 'ram', label: 'RAM', type: 'select', options: ['6 GB', '8 GB', '12 GB', '16 GB'], filterable: true },
      { key: 'storage', label: 'Storage', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB'], filterable: true },
      { key: 'network', label: 'Network', type: 'select', options: ['4G', '5G'], filterable: true },
      { key: 'battery', label: 'Battery', type: 'number', unit: 'mAh', filterable: true },
    ],
  },
  {
    slug: 'home-kitchen', name: 'Home & Kitchen', icon: 'Lamp', tint: '#B45309',
    description: 'Cookware, lighting, furniture and everything that makes a house work.',
    children: ['Cookware', 'Lighting', 'Furniture', 'Storage & Organisation', 'Home Décor'],
    attributes: [
      { key: 'material', label: 'Material', type: 'select', options: ['Stainless steel', 'Cast iron', 'Ceramic', 'Solid wood', 'Engineered wood', 'Aluminium'], filterable: true },
      { key: 'dishwasherSafe', label: 'Dishwasher safe', type: 'boolean', filterable: true },
    ],
  },
  {
    slug: 'fashion', name: 'Fashion', icon: 'Shirt', tint: '#9D174D',
    description: 'Everyday essentials and statement pieces across men, women and kids.',
    children: ["Men's Clothing", "Women's Clothing", 'Footwear', 'Bags & Luggage', 'Watches & Accessories'],
    attributes: [
      { key: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], filterable: true },
      { key: 'fabric', label: 'Fabric', type: 'select', options: ['Cotton', 'Linen', 'Merino wool', 'Recycled polyester', 'Denim'], filterable: true },
      { key: 'fit', label: 'Fit', type: 'select', options: ['Slim', 'Regular', 'Relaxed', 'Oversized'], filterable: true },
    ],
  },
  {
    slug: 'beauty', name: 'Beauty', icon: 'Sparkles', tint: '#BE185D',
    description: 'Skincare, haircare and grooming — dermatologist-tested formulations.',
    children: ['Skincare', 'Haircare', 'Fragrance', 'Grooming', 'Makeup'],
    attributes: [
      { key: 'skinType', label: 'Skin type', type: 'select', options: ['All', 'Oily', 'Dry', 'Combination', 'Sensitive'], filterable: true },
      { key: 'volume', label: 'Volume', type: 'number', unit: 'ml', filterable: true },
      { key: 'crueltyFree', label: 'Cruelty free', type: 'boolean', filterable: true },
    ],
  },
  {
    slug: 'grocery', name: 'Grocery', icon: 'ShoppingBasket', tint: '#15803D',
    description: 'Pantry staples, single-origin coffee, snacks and cold-pressed oils.',
    children: ['Coffee & Tea', 'Snacks', 'Staples', 'Oils & Condiments', 'Health Foods'],
    attributes: [
      { key: 'weight', label: 'Net weight', type: 'number', unit: 'g', filterable: true },
      { key: 'organic', label: 'Organic', type: 'boolean', filterable: true },
      { key: 'diet', label: 'Diet', type: 'select', options: ['Vegan', 'Vegetarian', 'Gluten-free', 'Keto'], filterable: true },
    ],
  },
  {
    slug: 'sports', name: 'Sports', icon: 'Dumbbell', tint: '#C2410C',
    description: 'Training gear, team sports equipment and outdoor kit.',
    children: ['Fitness Equipment', 'Team Sports', 'Cycling', 'Outdoor & Camping', 'Activewear'],
    attributes: [
      { key: 'level', label: 'Skill level', type: 'select', options: ['Beginner', 'Intermediate', 'Professional'], filterable: true },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', filterable: true },
    ],
  },
  {
    slug: 'books', name: 'Books', icon: 'BookOpen', tint: '#7C3AED',
    description: 'Fiction, business, design and children books — new and collectible.',
    children: ['Business & Economics', 'Fiction', 'Design & Architecture', 'Children', 'Academic'],
    attributes: [
      { key: 'format', label: 'Format', type: 'select', options: ['Hardcover', 'Paperback', 'Boxed set'], filterable: true },
      { key: 'language', label: 'Language', type: 'select', options: ['English', 'Hindi', 'Tamil', 'Bengali'], filterable: true },
      { key: 'pages', label: 'Pages', type: 'number', filterable: false },
    ],
  },
  {
    slug: 'toys', name: 'Toys', icon: 'Blocks', tint: '#0E7490',
    description: 'STEM kits, board games and building sets tested for safety.',
    children: ['Building Sets', 'Board Games', 'STEM & Learning', 'Ride-ons', 'Soft Toys'],
    attributes: [
      { key: 'ageGroup', label: 'Age group', type: 'select', options: ['0-2 yrs', '3-5 yrs', '6-8 yrs', '9-12 yrs', '12+ yrs'], filterable: true },
      { key: 'pieces', label: 'Pieces', type: 'number', filterable: false },
    ],
  },
  {
    slug: 'automotive', name: 'Automotive', icon: 'Car', tint: '#334155',
    description: 'Care products, alloys, dash cams and accessories for every drive.',
    children: ['Car Care', 'Wheels & Tyres', 'Interior Accessories', 'Electronics & Dash Cams', 'Tools'],
    attributes: [
      { key: 'vehicleType', label: 'Vehicle type', type: 'select', options: ['Hatchback', 'Sedan', 'SUV', 'Motorcycle', 'Universal'], filterable: true },
      { key: 'fitment', label: 'Fitment', type: 'select', options: ['Universal', 'Model specific'], filterable: true },
    ],
  },
];

function buildCategories(): Category[] {
  const out: Category[] = [];
  TOP_LEVEL.forEach((seed, i) => {
    const id = `cat_${seed.slug}`;
    out.push({
      id,
      parentId: null,
      name: seed.name,
      slug: seed.slug,
      icon: seed.icon,
      description: seed.description,
      order: i + 1,
      productCount: 0,
      isActive: true,
      attributes: seed.attributes,
      tint: seed.tint,
    });
    seed.children.forEach((childName, ci) => {
      const childSlug = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      out.push({
        id: `cat_${seed.slug}_${childSlug}`,
        parentId: id,
        name: childName,
        slug: childSlug,
        icon: seed.icon,
        description: `${childName} in ${seed.name}`,
        order: ci + 1,
        productCount: 0,
        isActive: true,
        attributes: [],
        tint: seed.tint,
      });
    });
  });
  return out;
}

export const categories: Category[] = buildCategories();
export const topCategories = categories.filter((c) => c.parentId === null);

/* ─────────────────────────────── Brands ─────────────────────────────────── */

interface BrandSeed { name: string; cats: string[]; origin: string; tint: string; featured?: boolean }

const BRAND_SEEDS: BrandSeed[] = [
  { name: 'Auralis', cats: ['electronics'], origin: 'Copenhagen, DK', tint: '#1D4ED8', featured: true },
  { name: 'Nordveil', cats: ['electronics', 'computers'], origin: 'Oslo, NO', tint: '#0F766E', featured: true },
  { name: 'Volterra', cats: ['computers', 'electronics'], origin: 'Milan, IT', tint: '#4C1D95', featured: true },
  { name: 'Kestrel', cats: ['mobiles', 'electronics'], origin: 'Bengaluru, IN', tint: '#B45309', featured: true },
  { name: 'Lumen&Co', cats: ['home-kitchen'], origin: 'Stockholm, SE', tint: '#C2410C', featured: true },
  { name: 'Terracove', cats: ['home-kitchen', 'grocery'], origin: 'Kochi, IN', tint: '#15803D' },
  { name: 'Northloom', cats: ['fashion'], origin: 'Ahmedabad, IN', tint: '#9D174D', featured: true },
  { name: 'Marrow', cats: ['fashion', 'sports'], origin: 'Portland, US', tint: '#334155' },
  { name: 'Botanica Rye', cats: ['beauty'], origin: 'Seoul, KR', tint: '#BE185D', featured: true },
  { name: 'Ashgrove', cats: ['beauty', 'grocery'], origin: 'Melbourne, AU', tint: '#7C3AED' },
  { name: 'Roast Republic', cats: ['grocery'], origin: 'Coorg, IN', tint: '#78350F', featured: true },
  { name: 'Ironpeak', cats: ['sports'], origin: 'Munich, DE', tint: '#0E7490', featured: true },
  { name: 'Sundial Press', cats: ['books'], origin: 'London, UK', tint: '#7C3AED' },
  { name: 'Brickwright', cats: ['toys'], origin: 'Billund, DK', tint: '#0E7490', featured: true },
  { name: 'Axlecraft', cats: ['automotive'], origin: 'Pune, IN', tint: '#334155' },
  { name: 'Halcyon', cats: ['electronics', 'mobiles'], origin: 'Taipei, TW', tint: '#1D4ED8' },
  { name: 'Veldt', cats: ['fashion', 'sports'], origin: 'Cape Town, ZA', tint: '#B45309' },
  { name: 'Cindermill', cats: ['home-kitchen'], origin: 'Jaipur, IN', tint: '#9A3412' },
  { name: 'Pixelforge', cats: ['electronics', 'computers'], origin: 'Shenzhen, CN', tint: '#4C5FD7' },
  { name: 'Everkeep', cats: ['home-kitchen', 'grocery'], origin: 'Toronto, CA', tint: '#0F766E' },
  { name: 'Saffron & Salt', cats: ['grocery'], origin: 'Chennai, IN', tint: '#B45309' },
  { name: 'Cadenza', cats: ['electronics'], origin: 'Vienna, AT', tint: '#7C3AED' },
  { name: 'Trailmark', cats: ['sports', 'automotive'], origin: 'Denver, US', tint: '#15803D' },
  { name: 'Glasswing', cats: ['beauty', 'home-kitchen'], origin: 'Lisbon, PT', tint: '#BE185D' },
];

export const brands: Brand[] = BRAND_SEEDS.map((b) => ({
  id: `brd_${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
  name: b.name,
  slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  categories: b.cats.map((c) => `cat_${c}`),
  productCount: 0,
  rating: 0,
  isFeatured: Boolean(b.featured),
  origin: b.origin,
  tint: b.tint,
}));

export const brandByName = new Map(brands.map((b) => [b.name, b]));

/* ─────────────────────────── Logistics config ───────────────────────────── */

export const deliveryPartners: DeliveryPartner[] = [
  { id: 'dp_forgex', name: 'ForgeExpress', code: 'FGX', coverage: '19,400 pin codes · Pan-India', onTimeRate: 96.4, avgTransitDays: 2.1, status: 'active', supportPhone: '+91 80 4718 2200', shipments30d: 48213, costIndex: 1.0, tint: '#12817A' },
  { id: 'dp_bluedart', name: 'Bluestreak Logistics', code: 'BSL', coverage: '16,800 pin codes · Metro priority', onTimeRate: 94.1, avgTransitDays: 2.6, status: 'active', supportPhone: '+91 22 6178 9000', shipments30d: 31980, costIndex: 1.14, tint: '#1D4ED8' },
  { id: 'dp_swiftcart', name: 'SwiftCart Same-Day', code: 'SCS', coverage: '12 metros · Same-day slots', onTimeRate: 91.7, avgTransitDays: 0.6, status: 'active', supportPhone: '+91 80 4000 1212', shipments30d: 9640, costIndex: 1.85, tint: '#F03E0B' },
  { id: 'dp_gatiway', name: 'Gatiway Surface', code: 'GTW', coverage: '21,000 pin codes · Heavy & bulky', onTimeRate: 88.2, avgTransitDays: 4.8, status: 'active', supportPhone: '+91 40 2311 4477', shipments30d: 14210, costIndex: 0.72, tint: '#B45309' },
  { id: 'dp_northline', name: 'Northline Air', code: 'NLA', coverage: 'North & East · Air freight', onTimeRate: 93.5, avgTransitDays: 1.8, status: 'paused', supportPhone: '+91 11 4055 6600', shipments30d: 4120, costIndex: 1.42, tint: '#4C1D95' },
  { id: 'dp_harbour', name: 'Harbour Freight Intl.', code: 'HFI', coverage: 'Cross-border · 24 countries', onTimeRate: 85.9, avgTransitDays: 9.4, status: 'onboarding', supportPhone: '+65 6220 4411', shipments30d: 0, costIndex: 2.1, tint: '#0E7490' },
];

export const shippingMethods: ShippingMethod[] = [
  { id: 'shm_std', name: 'Standard Delivery', code: 'STD', carrierId: 'dp_forgex', minDays: 3, maxDays: 5, baseRate: 49, perKgRate: 18, freeAbove: 499, isActive: true, supportsCod: true },
  { id: 'shm_exp', name: 'Express 48h', code: 'EXP48', carrierId: 'dp_bluedart', minDays: 1, maxDays: 2, baseRate: 129, perKgRate: 32, freeAbove: 2999, isActive: true, supportsCod: true },
  { id: 'shm_sameday', name: 'Same-Day (Metro)', code: 'SDM', carrierId: 'dp_swiftcart', minDays: 0, maxDays: 1, baseRate: 199, perKgRate: 40, isActive: true, supportsCod: false },
  { id: 'shm_heavy', name: 'Heavy & Bulky Surface', code: 'HVY', carrierId: 'dp_gatiway', minDays: 4, maxDays: 8, baseRate: 349, perKgRate: 12, isActive: true, supportsCod: true },
  { id: 'shm_intl', name: 'International Economy', code: 'INTL', carrierId: 'dp_harbour', minDays: 8, maxDays: 14, baseRate: 1290, perKgRate: 210, isActive: false, supportsCod: false },
];

export const shippingZones: ShippingZone[] = [
  { id: 'zn_metro', name: 'Metro Tier-1', regions: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'], isActive: true, methodIds: ['shm_std', 'shm_exp', 'shm_sameday'], codAvailable: true },
  { id: 'zn_tier2', name: 'Tier-2 Cities', regions: ['Jaipur', 'Kochi', 'Indore', 'Coimbatore', 'Lucknow', 'Chandigarh', 'Bhubaneswar'], isActive: true, methodIds: ['shm_std', 'shm_exp'], codAvailable: true },
  { id: 'zn_rest', name: 'Rest of India', regions: ['All other serviceable pin codes'], isActive: true, methodIds: ['shm_std', 'shm_heavy'], codAvailable: true },
  { id: 'zn_ne', name: 'North-East & Islands', regions: ['Assam', 'Manipur', 'Andaman & Nicobar', 'Lakshadweep'], isActive: true, methodIds: ['shm_std'], codAvailable: false },
  { id: 'zn_intl', name: 'International', regions: ['UAE', 'Singapore', 'United Kingdom', 'United States'], isActive: false, methodIds: ['shm_intl'], codAvailable: false },
];

export const warehouses: Warehouse[] = [
  { id: 'wh_blr1', vendorId: null, name: 'MarketForge Bengaluru FC', code: 'BLR-FC1', city: 'Bengaluru', state: 'Karnataka', capacityUnits: 180000, usedUnits: 141220, isPrimary: true },
  { id: 'wh_bom1', vendorId: null, name: 'MarketForge Bhiwandi FC', code: 'BOM-FC2', city: 'Bhiwandi', state: 'Maharashtra', capacityUnits: 220000, usedUnits: 156480, isPrimary: false },
  { id: 'wh_del1', vendorId: null, name: 'MarketForge Gurugram FC', code: 'DEL-FC1', city: 'Gurugram', state: 'Haryana', capacityUnits: 160000, usedUnits: 98340, isPrimary: false },
  { id: 'wh_maa1', vendorId: null, name: 'MarketForge Sriperumbudur FC', code: 'MAA-FC1', city: 'Sriperumbudur', state: 'Tamil Nadu', capacityUnits: 120000, usedUnits: 74210, isPrimary: false },
];

/* ──────────────────────────────── Help ──────────────────────────────────── */

export const faqs: FaqEntry[] = [
  { id: 'faq_1', topic: 'Orders', question: 'How do I track my order?', answer: 'Open Orders from your account menu and select the order. Every shipment shows a live tracking timeline with carrier checkpoints. Orders that ship from multiple vendors are tracked separately, since each vendor dispatches from their own warehouse.', helpful: 1842 },
  { id: 'faq_2', topic: 'Orders', question: 'Can I change the delivery address after placing an order?', answer: 'Yes, until the order is packed. Open the order, choose Change address, and pick or add an address in the same serviceable zone. Once a packing slip is generated the address is locked and you will need to contact the seller.', helpful: 963 },
  { id: 'faq_3', topic: 'Returns', question: 'What is the return window?', answer: 'Most categories carry a 7 to 30 day return window shown on each product page under Return policy. Grocery, innerwear and personalised items are non-returnable. Damaged or wrong items can be reported within 48 hours of delivery for a free pickup.', helpful: 2410 },
  { id: 'faq_4', topic: 'Returns', question: 'When will I get my refund?', answer: 'Refunds are initiated once the returned item clears inspection at the vendor warehouse. Card and UPI refunds settle in 3-5 business days; MarketForge Wallet credits are instant. You can follow every stage on the return timeline.', helpful: 1755 },
  { id: 'faq_5', topic: 'Payments', question: 'Which payment methods are supported?', answer: 'Credit and debit cards, UPI, net banking from 58 banks, MarketForge Wallet, gift cards and Cash on Delivery on eligible orders. No-cost EMI is available on orders above ₹4,999 with participating banks.', helpful: 1290 },
  { id: 'faq_6', topic: 'Payments', question: 'Is Cash on Delivery available everywhere?', answer: 'COD is available on most serviceable pin codes for orders up to ₹50,000, excluding North-East and island zones and same-day delivery slots. Eligibility is confirmed at checkout.', helpful: 704 },
  { id: 'faq_7', topic: 'Selling', question: 'How long does seller verification take?', answer: 'Most applications are reviewed within 2 business days once business registration, tax details, bank proof and identity documents are submitted. Category approvals for regulated categories such as Beauty and Grocery can take an extra 3 days.', helpful: 618 },
  { id: 'faq_8', topic: 'Selling', question: 'How is commission calculated?', answer: 'Commission is applied per order item using the most specific rule that matches: product, then category, then vendor, then the global rate. Your effective rate appears on every order line and on the payout statement.', helpful: 542 },
  { id: 'faq_9', topic: 'Selling', question: 'When are payouts released?', answer: 'Payout cycles close every Sunday and settle on the following Wednesday by bank transfer. Amounts held against open disputes or pending returns are shown separately as adjustments on your payout statement.', helpful: 489 },
  { id: 'faq_10', topic: 'Account', question: 'How do I secure my account?', answer: 'Enable two-factor authentication under Account, Security. You can also review every active session and recent login attempt there, and sign out of devices you do not recognise.', helpful: 831 },
  { id: 'faq_11', topic: 'Delivery', question: 'Why do items in one order arrive separately?', answer: 'MarketForge is a marketplace, so a single order can contain items from several vendors. Each vendor ships from their own location, which means separate parcels, tracking numbers and delivery dates.', helpful: 1122 },
  { id: 'faq_12', topic: 'Delivery', question: 'What happens if I miss a delivery?', answer: 'Carriers make three attempts on consecutive days. After the third attempt the parcel returns to the vendor and you are refunded automatically for prepaid orders, less any COD handling fee.', helpful: 655 },
];

export const helpTopics = [
  { slug: 'orders', label: 'Orders & Delivery', icon: 'Package', blurb: 'Track, change or cancel an order' },
  { slug: 'returns', label: 'Returns & Refunds', icon: 'RotateCcw', blurb: 'Start a return, check refund status' },
  { slug: 'payments', label: 'Payments & Offers', icon: 'CreditCard', blurb: 'Methods, EMI, coupons and gift cards' },
  { slug: 'account', label: 'Account & Security', icon: 'ShieldCheck', blurb: 'Login, 2FA, privacy and data' },
  { slug: 'selling', label: 'Selling on MarketForge', icon: 'Store', blurb: 'Onboarding, listings, payouts' },
  { slug: 'delivery', label: 'Shipping & Logistics', icon: 'Truck', blurb: 'Zones, timelines, carriers' },
];
