import fs from 'fs';
import path from 'path';

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
  demand_score: number;         // 30%
  competition_score: number;    // 20%
  margin_score: number;         // 15%
  creative_score: number;       // 15%
  problem_score: number;        // 10%
  shipping_score: number;       // 10%
  product_score: number;        // Total weighted

  status: 'discovered' | 'approved_for_validation' | 'rejected' | 'testing';
  recommendation: 'TEST' | 'CONSIDER' | 'KILL';
  recommendation_reason: string;

  // Marketing Hooks & Insights
  wow_factor: string;
  target_audience: string;
  pain_points: string[];
  angles: string[];

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

// Initial seed products for immediate display & demo
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
      'Babies scratch their own faces while fussy'
    ],
    angles: [
      'Before/After: Screaming 2AM wakeups vs Peaceful sleep',
      'Pain Hook: Stop washing dropped chew toys 20 times a day',
      'Doctor POV: Pediatrician approved food-grade sensory glove'
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_pet_02',
    name: 'Ultrasonic Pet De-Shedding Steam Brush',
    source: 'meta_ads',
    url: 'https://www.facebook.com/ads/library',
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    niche: 'Pet Care',
    category: 'Grooming Tools',
    supplier_price: 5.40,
    selling_price: 29.99,
    shipping_cost: 3.50,
    payment_fee: 1.17,
    refund_reserve: 0.90,
    landed_cost: 10.97,
    gross_margin: 19.02,
    margin_percentage: 63.4,
    demand_score: 87,
    competition_score: 72,
    margin_score: 88,
    creative_score: 91,
    problem_score: 82,
    shipping_score: 85,
    product_score: 84.8,
    status: 'discovered',
    recommendation: 'TEST',
    recommendation_reason: 'Strong visual satisfying B-roll potential (peeling fur sheets), high search volume on Meta.',
    wow_factor: 'Nano mist traps loose flyaway hairs instantly and detangles without pulling.',
    target_audience: 'Golden Retriever, Husky, and long-hair cat owners tired of hair on sofas and clothes.',
    pain_points: [
      'Loose fur floating everywhere when brushing',
      'Pets hate traditional wire combs',
      'Expensive monthly professional grooming bills'
    ],
    angles: [
      'Oddly Satisfying peel off video ad hook',
      'Before/After living room couch covered in pet hair',
      'Pet reaction comparison: running away vs enjoying massage'
    ],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_car_03',
    name: 'Magnetic Lumbar Spine Car Seat Cushion',
    source: 'amazon',
    url: 'https://amazon.com/trends',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
    niche: 'Auto Accessories',
    category: 'Ergonomic Driving Comfort',
    supplier_price: 11.20,
    selling_price: 39.99,
    shipping_cost: 6.80,
    payment_fee: 1.46,
    refund_reserve: 1.20,
    landed_cost: 20.66,
    gross_margin: 19.33,
    margin_percentage: 48.3,
    demand_score: 74,
    competition_score: 82,
    margin_score: 71,
    creative_score: 69,
    problem_score: 85,
    shipping_score: 62,
    product_score: 73.9,
    status: 'discovered',
    recommendation: 'CONSIDER',
    recommendation_reason: 'Good problem solver but higher shipping volume weight reduces margin. Requires higher ticket bundle.',
    wow_factor: 'Targeted magnetic acupressure nodes relieve lower back spasms during long commutes.',
    target_audience: 'Commuters driving 40+ mins daily, Uber/truck drivers with sciatica or posture fatigue.',
    pain_points: [
      'Stiff lower back pain after 30 mins in traffic',
      'Expensive chiropractor appointments',
      'Hot sweaty memory foam seats'
    ],
    angles: [
      'Sciatica relief angle for desk workers and drivers',
      'Spine alignment animation breakdown'
    ],
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString()
  }
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
      agent_runs: [
        {
          id: 'agent_run_init_1',
          agent: 'Research Classifier',
          provider: 'gemini',
          model: 'gemini-3.6-flash',
          task: 'product_classification',
          input_tokens: 340,
          output_tokens: 220,
          total_tokens: 560,
          cost_usd: 0.0,
          latency_ms: 310,
          created_at: new Date().toISOString()
        }
      ]
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

// Singleton global store
export const ecomStore = new EcomStore();
