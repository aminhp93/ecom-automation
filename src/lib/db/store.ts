import fs from 'fs';
import path from 'path';

export interface ProductValidation {
  trend_status: 'surging' | 'steady' | 'declining';
  trend_growth_pct: number;
  active_competitor_ads: number;
  ads_longevity_days: number;
  review_sentiment_score: number;
  negative_reviews_mined: Array<{ issue: string; frequency: string; workaround: string }>;
  validation_score: number;
  verdict: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
  verdict_reason: string;
}

export interface CompetitorItem {
  name: string;
  url: string;
  selling_price: number;
  shipping_days: string;
  rating: number;
  offer_type: string;
  hook_score: number;
  weakness: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorItem[];
  outpositioning_strategy: string;
  price_opportunity: string;
  gap_identified: string;
}

export interface SupplierOption {
  source: string;
  unit_cost: number;
  moq: number;
  shipping_method: string;
  shipping_cost: number;
  delivery_days: string;
  reliability_rating: number;
}

export interface SupplierEconomics {
  suppliers: SupplierOption[];
  break_even_roas: number;
  target_roas: number;
  profit_projection_100_orders: number;
  profit_projection_500_orders: number;
}

export interface OfferPackageItem {
  tier: 'A' | 'B' | 'C';
  name: string;
  badge?: string;
  price: number;
  value: number;
  savings: string;
  description: string;
  items: string[];
}

export interface OfferPackage {
  positioning_statement: string;
  target_desire: string;
  packages: OfferPackageItem[];
  risk_reversal_guarantee: string;
  urgency_hook: string;
}

export interface SceneItem {
  time: string;
  visual: string;
  audio: string;
  text_overlay: string;
}

export interface VideoScript {
  title: string;
  framework: string;
  target_length: string;
  scenes: SceneItem[];
}

export interface CreativePack {
  viral_hooks: Array<{ id: number; angle: string; hook_text: string; category: string }>;
  video_scripts: VideoScript[];
  shopify_page: {
    headline: string;
    subheadline: string;
    benefits: Array<{ title: string; desc: string }>;
    faqs: Array<{ q: string; a: string }>;
    html_description: string;
  };
}

export interface Product {
  id: string;
  name: string;
  source: 'tiktok' | 'meta_ads' | 'amazon' | 'aliexpress' | 'manual';
  url: string;
  image_url: string;
  niche: string;
  category: string;

  // Financials & Economics
  supplier_price: number;
  selling_price: number;
  shipping_cost: number;
  payment_fee: number;
  refund_reserve: number;
  landed_cost: number;
  gross_margin: number;
  margin_percentage: number;

  // AI 6-factor Scoring (0-100)
  demand_score: number;
  competition_score: number;
  margin_score: number;
  creative_score: number;
  problem_score: number;
  shipping_score: number;
  product_score: number;

  status: 'discovered' | 'approved_for_validation' | 'rejected' | 'testing';
  recommendation: 'TEST' | 'CONSIDER' | 'KILL';
  recommendation_reason: string;

  // Marketing Hooks & Insights
  wow_factor: string;
  target_audience: string;
  pain_points: string[];
  angles: string[];

  // Deep Pipeline Stages (Stages 02 -> 06/07)
  validation?: ProductValidation;
  competitor_analysis?: CompetitorAnalysis;
  supplier_economics?: SupplierEconomics;
  offer_package?: OfferPackage;
  creative_pack?: CreativePack;

  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'search' | 'found' | 'ai_analyze' | 'score' | 'approval' | 'done' | 'error';
  stage: string;
  message: string;
  data?: any;
}

export interface WorkflowRun {
  id: string;
  workflow: string;
  niche: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  logs: WorkflowEvent[];
  discovered_count: number;
}

export interface AgentRun {
  id: string;
  workflow_run_id?: string;
  agent: string;
  provider: string;
  model: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

interface EcomStoreData {
  products: Product[];
  workflow_runs: WorkflowRun[];
  agent_runs: AgentRun[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'ecom_store.json');

// Initial seed products with rich sample data for immediate exploration
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_snuglet_01',
    name: 'Teething Relief Silicone Bear Mitt',
    source: 'tiktok',
    url: 'https://www.tiktok.com/tag/babyshowergift',
    image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
    niche: 'Baby Products',
    category: 'Infant Teething & Oral Care',
    supplier_price: 3.20,
    selling_price: 24.99,
    shipping_cost: 2.80,
    payment_fee: 1.02,
    refund_reserve: 0.75,
    landed_cost: 7.77,
    gross_margin: 17.22,
    margin_percentage: 68.9,
    demand_score: 92,
    competition_score: 68,
    margin_score: 94,
    creative_score: 95,
    problem_score: 88,
    shipping_score: 96,
    product_score: 89.2,
    status: 'approved_for_validation',
    recommendation: 'TEST',
    recommendation_reason: 'High viral impulse buy factor on TikTok, light shipping weight (42g), 68.9% gross margin.',
    wow_factor: 'Freezable ergonomic glove that baby cannot drop on dirty floors.',
    target_audience: 'First-time moms and dads with infants aged 3-12 months experiencing sleepless teething nights.',
    pain_points: [
      'Baby drops regular teether on dirty ground constantly',
      'Teething pain keeps entire household awake',
      'Babies scratch their own faces while fussy',
    ],
    angles: [
      'Before/After: Screaming 2AM wakeups vs Peaceful sleep',
      'Pain Hook: Stop washing dropped chew toys 20 times a day',
      'Doctor POV: Pediatrician approved food-grade sensory glove',
    ],
    validation: {
      trend_status: 'surging',
      trend_growth_pct: 185,
      active_competitor_ads: 28,
      ads_longevity_days: 22,
      review_sentiment_score: 84,
      negative_reviews_mined: [
        { issue: 'Velcro strap wears out after 3 weeks', frequency: '24%', workaround: 'Use reinforced dual-stitch silicone strap' },
        { issue: 'Takes too long to freeze solid', frequency: '18%', workaround: 'Highlight 15-min flash chill gel core' },
        { issue: 'Too small for chubby 14mo hands', frequency: '12%', workaround: 'Offer XL stretchy cuff variant' }
      ],
      validation_score: 91,
      verdict: 'GO',
      verdict_reason: 'Trend volume +185% YoY, 6 competitors running ads for > 20 days indicating consistent profitability.'
    },
    competitor_analysis: {
      competitors: [
        { name: 'MunchMitts Co', url: 'https://munchmitt.example.com', selling_price: 29.99, shipping_days: '5-8d', rating: 4.4, offer_type: 'Single Unit', hook_score: 75, weakness: 'Single unit pricing too high ($30), no bundles' },
        { name: 'TeethieBaby', url: 'https://teethie.example.com', selling_price: 22.50, shipping_days: '10-14d', rating: 4.1, offer_type: '20% Off', hook_score: 82, weakness: 'Slow 14-day ePacket shipping, poor packaging' },
        { name: 'LittleGums Direct', url: 'https://littlegums.example.com', selling_price: 24.99, shipping_days: '7-10d', rating: 4.5, offer_type: 'Buy 2 Get 1', hook_score: 88, weakness: 'Weak video creatives (just static photos)' }
      ],
      outpositioning_strategy: 'Position as the "Doctor Approved Dual-Cooling Mitt" with 2-pack bundle and free hygiene carrying case.',
      price_opportunity: 'Priced at $24.99 with BOGO 50% ($37.49 AOV) beats $29.99 single competitor.',
      gap_identified: 'Competitors ignore nighttime sleep angle and hygiene case.'
    },
    supplier_economics: {
      suppliers: [
        { source: 'CJ Dropshipping', unit_cost: 3.10, moq: 1, shipping_method: 'CJPacket Fast', shipping_cost: 2.70, delivery_days: '7-10d', reliability_rating: 94 },
        { source: 'AliExpress Direct', unit_cost: 3.40, moq: 1, shipping_method: 'Ali Standard', shipping_cost: 2.90, delivery_days: '9-14d', reliability_rating: 88 },
        { source: '1688 Sourcing Agent', unit_cost: 1.85, moq: 100, shipping_method: 'YunExpress Direct', shipping_cost: 2.50, delivery_days: '6-9d', reliability_rating: 96 }
      ],
      break_even_roas: 1.45,
      target_roas: 2.40,
      profit_projection_100_orders: 1722,
      profit_projection_500_orders: 9350
    },
    offer_package: {
      positioning_statement: 'The only drop-proof, quick-freeze teething glove designed for uninterrupted baby sleep.',
      target_desire: 'Get babies to sleep through the night without screaming from painful teething gums.',
      packages: [
        { tier: 'A', name: 'Starter Pack (1 Glove)', price: 24.99, value: 39.99, savings: '$15.00 OFF', description: 'Includes 1 Food-Grade Sensory Teething Mitt.', items: ['1x Bear Teething Glove', '1x Travel Hygiene Pouch'] },
        { tier: 'B', name: 'Peaceful Nights Twin Pack (Buy 1 Get 1 50% OFF)', badge: 'MOST POPULAR', price: 37.49, value: 59.99, savings: 'BEST VALUE', description: 'One glove in the freezer while one is in use. Never wait for refreezing.', items: ['2x Bear Teething Gloves', '2x Travel Pouches', 'Free Shipping'] },
        { tier: 'C', name: 'Deluxe Baby Registry Bundle', price: 54.99, value: 89.99, savings: 'SAVE 40%', description: 'Complete oral soothing kit for active teething stages.', items: ['3x Multi-texture Mitts', '3x Pouches', '1x Silicone Fruit Feeder Pacifier', 'Lifetime Teething Guarantee'] }
      ],
      risk_reversal_guarantee: '90-Day "Sleep Soundly or Free" Money-Back Guarantee. If your baby doesn’t calm down in 7 nights, keep it and get 100% refund.',
      urgency_hook: 'Limited First-Batch Production — Only 42 Twin Packs remaining in stock today.'
    },
    creative_pack: {
      viral_hooks: [
        { id: 1, angle: 'Problem Hook', hook_text: 'If your baby woke up screaming at 2 AM last night... this 1 hack will save your sanity.', category: 'Sleep Deprivation' },
        { id: 2, angle: 'Visual Demonstration', hook_text: 'Watch what happens when I freeze this tiny silicone bear for just 15 minutes...', category: 'Curiosity Shock' },
        { id: 3, angle: 'Floor Hygiene', hook_text: 'Stop boiling your baby’s dropped chew toy 20 times a day. Look at this instead.', category: 'Relatable Pain' }
      ],
      video_scripts: [
        {
          title: 'The 2AM Wakeup Solution (PAS Framework)',
          framework: 'Problem - Agitation - Solution',
          target_length: '35s',
          scenes: [
            { time: '0-3s', visual: 'Tired mom looking at crying baby in crib in dark room with clock showing 2:14 AM.', audio: 'If you’re up at 2 AM holding a screaming baby who is chewing on their own hands...', text_overlay: 'POV: 2:14 AM with a teething baby' },
            { time: '3-12s', visual: 'Shows regular chew toys dropped on dusty carpet floor; mom frustrated washing it.', audio: 'Regular teethers fall onto the dirty floor every 2 minutes, and rubbing medicine wears off in seconds.', text_overlay: 'Why regular teethers FAIL ❌' },
            { time: '12-25s', visual: 'Close up of the Bear Mitt sliding onto baby wrist, baby instantly chewing and smiling.', audio: 'Pediatric dentists created this self-soothing glove. It straps comfortably to their wrist so it NEVER drops, and the textured silicone cools inflamed gums instantly.', text_overlay: 'Straps on & cools gums in 30s ✨' },
            { time: '25-35s', visual: 'Baby sleeping peacefully; mom showing twin pack and tapping order button.', audio: 'Get the Twin Pack today with 50% off the second pair, backed by our 90-day sleep guarantee!', text_overlay: '90-Day Sleep Guarantee 🛡️' }
          ]
        }
      ],
      shopify_page: {
        headline: 'Sooth Inflamed Gums In 30 Seconds — The Drop-Proof Glove Babies Never Lose',
        subheadline: 'Dentist-approved sensory cooling silicone glove engineered to help fussy babies self-soothe so parents can finally sleep.',
        benefits: [
          { title: 'Never Drops on Dirty Floors', desc: 'Secure velcro cuff keeps the mitt comfortably fastened to baby’s wrist at home, in strollers, and during car rides.' },
          { title: '15-Minute Flash Chill Core', desc: 'Medical-grade thermal silicone retains cool temperatures without freezing hard plastic surfaces that hurt sensitive mouths.' },
          { title: 'Prevents Face Scratching', desc: 'Soft breathable cotton protects delicate skin from fingernail scratches during irritable teething episodes.' }
        ],
        faqs: [
          { q: 'Is the silicone 100% baby safe?', a: 'Yes, it is 100% BPA-free, Phthalate-free, food-grade platinum silicone tested to US FDA & CPSIA standards.' },
          { q: 'How do I clean and sterilize it?', a: 'Dishwasher safe on top rack, or boil in water for 2-3 minutes. Machine washable cotton cuff.' },
          { q: 'What age is this suitable for?', a: 'Ideal for infants from 3 months up to 18 months.' }
        ],
        html_description: `<div class="ecom-description"><h2>Sooth Inflamed Gums in 30 Seconds</h2><p>Engineered by pediatric dentists, the Bear Teething Mitt ends 2AM sleepless wakeups.</p><ul><li><strong>Drop-Proof:</strong> Stays on baby wrist all day.</li><li><strong>Flash Chill:</strong> 15 mins in freezer provides 2 hours of soothing.</li><li><strong>Food-Grade:</strong> 100% BPA-Free Platinum Silicone.</li></ul><p><em>Backed by our 90-Day Unconditional Money-Back Guarantee.</em></p></div>`
      }
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class EcomStore {
  private data: EcomStoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): EcomStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read store file, using in-memory default:', e);
    }
    return {
      products: SEED_PRODUCTS,
      workflow_runs: [],
      agent_runs: [],
    };
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist store data:', e);
    }
  }

  // --- Products ---
  getProducts(filters?: { niche?: string; status?: string; minScore?: number }): Product[] {
    let list = [...this.data.products];
    if (filters?.niche && filters.niche !== 'all') {
      list = list.filter((p) => p.niche.toLowerCase().includes(filters.niche!.toLowerCase()));
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.minScore) {
      list = list.filter((p) => p.product_score >= filters.minScore!);
    }
    return list.sort((a, b) => b.product_score - a.product_score);
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = { ...product, updated_at: new Date().toISOString() };
    } else {
      this.data.products.unshift(product);
    }
    this.save();
    return product;
  }

  updateProductStatus(id: string, status: Product['status']): Product | undefined {
    const product = this.data.products.find((p) => p.id === id);
    if (product) {
      product.status = status;
      product.updated_at = new Date().toISOString();
      this.save();
      return product;
    }
    return undefined;
  }

  updateProductField<K extends keyof Product>(id: string, key: K, value: Product[K]): Product | undefined {
    const product = this.data.products.find((p) => p.id === id);
    if (product) {
      product[key] = value;
      product.updated_at = new Date().toISOString();
      this.save();
      return product;
    }
    return undefined;
  }

  // --- Workflow Runs ---
  saveWorkflowRun(run: WorkflowRun) {
    const idx = this.data.workflow_runs.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      this.data.workflow_runs[idx] = run;
    } else {
      this.data.workflow_runs.unshift(run);
    }
    this.save();
  }

  getWorkflowRun(id: string): WorkflowRun | undefined {
    return this.data.workflow_runs.find((r) => r.id === id);
  }

  // --- Agent Runs (Token & Cost tracking) ---
  addAgentRun(run: AgentRun) {
    this.data.agent_runs.unshift(run);
    this.save();
  }

  getStats() {
    const totalProducts = this.data.products.length;
    const approvedProducts = this.data.products.filter(
      (p) => p.status === 'approved_for_validation'
    ).length;
    const totalRuns = this.data.workflow_runs.length;

    let totalTokens = 0;
    let totalCostUsd = 0;
    const providerUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};

    for (const r of this.data.agent_runs) {
      totalTokens += r.total_tokens;
      totalCostUsd += r.cost_usd;
      if (!providerUsage[r.provider]) {
        providerUsage[r.provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      providerUsage[r.provider].calls += 1;
      providerUsage[r.provider].tokens += r.total_tokens;
      providerUsage[r.provider].cost += r.cost_usd;
    }

    return {
      totalProducts,
      approvedProducts,
      totalRuns,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      providerUsage,
    };
  }
}

export const ecomStore = new EcomStore();
