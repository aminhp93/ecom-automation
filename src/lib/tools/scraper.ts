export interface RawProductCandidate {
  name: string;
  source: 'tiktok' | 'meta_ads' | 'amazon' | 'aliexpress';
  url: string;
  image_url: string;
  supplier_price: number;
  shipping_cost: number;
  raw_description: string;
  platform_signals: {
    views?: string;
    active_ads?: number;
    trend_growth?: string;
    orders_30d?: number;
  };
}

// Database of realistic trending ecom archetypes per niche
const NICHE_CANDIDATES: Record<string, RawProductCandidate[]> = {
  baby: [
    {
      name: 'Anti-Drop Freeze Silicone Teething Mitt',
      source: 'tiktok',
      url: 'https://www.tiktok.com/tag/teethinghacks',
      image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
      supplier_price: 3.20,
      shipping_cost: 2.80,
      raw_description: 'Food-grade silicone mitt with textured micro-ridges. Keeps baby from dropping teether. Can be refrigerated for instant soothing.',
      platform_signals: { views: '14.2M', trend_growth: '+320% this month' },
    },
    {
      name: '360° Spill-Proof Gyro Bowl for Toddlers',
      source: 'meta_ads',
      url: 'https://www.facebook.com/ads/library',
      image_url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&auto=format&fit=crop&q=80',
      supplier_price: 2.90,
      shipping_cost: 2.50,
      raw_description: 'Inner bowl rotates 360 degrees using gyroscopic motion. Dry food never spills even when toddlers shake or drop it.',
      platform_signals: { active_ads: 24, trend_growth: '+140%' },
    },
    {
      name: 'Electric Infant Nasal Aspirator with Music',
      source: 'aliexpress',
      url: 'https://aliexpress.com/item/baby-nasal-cleaner',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      supplier_price: 6.80,
      shipping_cost: 3.10,
      raw_description: 'Gentle silicone suction clears congested baby nose in seconds. Plays soft lullabies and LED lights to calm fussy infants.',
      platform_signals: { orders_30d: 3420, trend_growth: '+85%' },
    },
    {
      name: 'Crawl Knee Protection Non-Slip Pads (3 Pairs)',
      source: 'amazon',
      url: 'https://amazon.com/dp/baby-kneepads',
      image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
      supplier_price: 2.10,
      shipping_cost: 2.40,
      raw_description: 'Breathable elastic cotton pads with silicone grip dots. Protects baby knees on hardwood and tile floors.',
      platform_signals: { orders_30d: 1850, active_ads: 8 },
    },
  ],
  pet: [
    {
      name: 'Nano Mist Electric Steam Pet Grooming Brush',
      source: 'tiktok',
      url: 'https://www.tiktok.com/tag/petproducts',
      image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
      supplier_price: 4.80,
      shipping_cost: 3.20,
      raw_description: 'Gentle warm nano-steam traps floating shedding fur instantly. One-click hair ejection button. Pets love the massage sensation.',
      platform_signals: { views: '28.5M', trend_growth: '+410%' },
    },
    {
      name: 'Interactive Smart Bouncing Ball with LED Laser',
      source: 'meta_ads',
      url: 'https://www.facebook.com/ads/library',
      image_url: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&auto=format&fit=crop&q=80',
      supplier_price: 5.20,
      shipping_cost: 3.00,
      raw_description: 'Autonomous erratic bouncing movements with motion sensors. Keeps dogs and indoor cats active for hours while owners work.',
      platform_signals: { active_ads: 31, trend_growth: '+210%' },
    },
    {
      name: 'Slow Feeder Lick Mat with Suction Wall Mount',
      source: 'aliexpress',
      url: 'https://aliexpress.com/item/pet-lick-mat',
      image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
      supplier_price: 1.80,
      shipping_cost: 2.20,
      raw_description: 'Textured silicone mat distracts pets with peanut butter or yogurt during bath time or nail trimming anxiety.',
      platform_signals: { orders_30d: 5120, trend_growth: '+95%' },
    },
  ],
  car: [
    {
      name: 'Magnetic Lumbar Pressure Car Seat Support',
      source: 'meta_ads',
      url: 'https://facebook.com/ads/library',
      image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
      supplier_price: 9.80,
      shipping_cost: 5.50,
      raw_description: 'Ergonomic mesh backing with embedded tourmaline acupressure points. Eliminates lower back stiffness during highway traffic.',
      platform_signals: { active_ads: 18, trend_growth: '+115%' },
    },
    {
      name: 'Cordless 120W High Power Turbo Car Vacuum',
      source: 'tiktok',
      url: 'https://tiktok.com/tag/caraccessories',
      image_url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop&q=80',
      supplier_price: 8.50,
      shipping_cost: 4.80,
      raw_description: 'Ultra-compact mini blower & vacuum combo with 9000Pa cyclone suction. Easily cleans tight console crevices and cup holders.',
      platform_signals: { views: '11.8M', trend_growth: '+180%' },
    },
  ],
  home: [
    {
      name: 'Electric Spin Scrubber with Telescopic Handle',
      source: 'tiktok',
      url: 'https://tiktok.com/tag/cleantok',
      image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
      supplier_price: 11.50,
      shipping_cost: 5.90,
      raw_description: '300 RPM rotating bathroom cleaner head. Cleans grout, bathtubs, and tiles without bending over or scrubbing with elbows.',
      platform_signals: { views: '45.1M', trend_growth: '+520%' },
    },
    {
      name: 'Motion Sensor LED Under-Cabinet Slim Lights',
      source: 'amazon',
      url: 'https://amazon.com/dp/motion-lights',
      image_url: 'https://images.unsplash.com/photo-1550985543-f47f38aeee65?w=600&auto=format&fit=crop&q=80',
      supplier_price: 4.20,
      shipping_cost: 3.10,
      raw_description: 'Magnetic rechargeable ultra-thin light strips. Turns any dark closet, kitchen counter, or stairway into luxury warm lighting.',
      platform_signals: { orders_30d: 8900, active_ads: 22 },
    },
  ],
};

/**
 * Searches and collects raw product candidates matching query/niche
 */
export async function searchRawCandidates(
  query: string,
  sources: Array<'tiktok' | 'meta_ads' | 'amazon' | 'aliexpress'> = ['tiktok', 'meta_ads', 'amazon', 'aliexpress']
): Promise<RawProductCandidate[]> {
  // Simulate network scrape latency
  await new Promise((r) => setTimeout(r, 600));

  const lowerQuery = query.toLowerCase().trim();
  let matches: RawProductCandidate[] = [];

  for (const [nicheKey, items] of Object.entries(NICHE_CANDIDATES)) {
    if (lowerQuery.includes(nicheKey) || nicheKey.includes(lowerQuery)) {
      matches.push(...items);
    }
  }

  // If no direct key match, match by keyword or return general hot items
  if (matches.length === 0) {
    for (const items of Object.values(NICHE_CANDIDATES)) {
      for (const item of items) {
        if (
          item.name.toLowerCase().includes(lowerQuery) ||
          item.raw_description.toLowerCase().includes(lowerQuery)
        ) {
          matches.push(item);
        }
      }
    }
  }

  // Fallback: if query is generic (e.g. "trending", "dropship", "gadgets"), combine top picks
  if (matches.length === 0) {
    matches = [
      ...NICHE_CANDIDATES.baby.slice(0, 2),
      ...NICHE_CANDIDATES.pet.slice(0, 2),
      ...NICHE_CANDIDATES.home.slice(0, 1),
    ];
  }

  // Filter by requested sources
  if (sources.length > 0) {
    matches = matches.filter((item) => sources.includes(item.source));
  }

  return matches;
}
