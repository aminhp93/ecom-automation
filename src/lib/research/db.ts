// Đọc dữ liệu Market Research từ Supabase (PostgREST). Chỉ dùng trong Server Components.
// Ghi dữ liệu do Claude làm qua MCP — web chỉ đọc (RLS: select-only).
import { connection } from 'next/server';

export class ResearchDbError extends Error {}

/** Tag cache chung cho mọi dữ liệu research — nút "Làm mới dữ liệu" xoá tag này. */
export const RESEARCH_CACHE_TAG = 'research';
/** Dữ liệu chỉ đổi khi Claude ghi số liệu mới (vài lần/tuần) → cache 10 phút, bấm "Làm mới" để lấy ngay. */
const REVALIDATE_SECONDS = 600;

async function get<T>(path: string): Promise<T> {
  // Vẫn render lúc có request (không prerender lúc build: build không có env Supabase),
  // nhưng kết quả fetch được cache trong Data Cache của Next → lần sau không gọi lại Supabase.
  await connection();
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!URL || !KEY) {
    throw new ResearchDbError(
      'Thiếu biến môi trường SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY (local: .env.local; Vercel: Project Settings → Environment Variables).',
    );
  }
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY },
    next: { revalidate: REVALIDATE_SECONDS, tags: [RESEARCH_CACHE_TAG] },
  });
  if (!res.ok) throw new ResearchDbError(`${res.status} ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const inList = (values: string[]) =>
  `in.(${values
    .map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')})`;
const q = (s: string) => encodeURIComponent(s);

export type Decision = 'chon_chinh' | 'chon_phu' | 'du_phong' | 'khong_chon';

export type Readiness = 'san_sang' | 'can_xac_minh' | 'rot_loc_cung';

export interface ProductOverview {
  product_id: number;
  slug: string;
  name_vi: string;
  category: string | null;
  cluster: string | null;
  stage: string;
  decision: Decision | null;
  variant_of: number | null;
  variant_note: string | null;
  keyword: string | null;
  us_searches: number | null;
  us_purchase_rate: number | null;
  us_price: number | null;
  au_searches: number | null;
  au_price: number | null;
  uk_searches: number | null;
  meta_au_active_ads: number | null;
  meta_au_sample: number | null;
  meta_au_method: string | null;
  meta_au_captured_on: string | null;
  meta_au_over60_ratio: number | null;
  ad_signal_brands: number | null;
  competitors_checked_on: string | null;
  marketplace_present: number | null;
  variant_conflict: boolean | null;
  weight_class: string | null;
  hazmat: string | null;
  policy_risk: string | null;
  retail_risk: string | null;
  bundle_potential: string | null;
  target_dtc_price: string | null;
  landed_cost: number | null;
  marketplace_barrier: string | null;
  competitor_model: string | null;
  content_ease: string | null;
  score_version: string | null;
  score: number | null;
  completeness: number | null;
  passed_filters: boolean | null;
  failed_filters: string[] | null;
  readiness: Readiness | null;
  missing_required: string[] | null;
  unknown_filters: string[] | null;
  scored_on: string | null;
  verdict: string | null;
  headline: string | null;
  dossier_on: string | null;
  exception_reason: string | null;
  decision_conflict: boolean | null;
}

export interface ResearchCheck {
  check_type: string;
  checked_on: string;
  value: number | null;
  result: string;
  scope: string | null;
  method: string | null;
  source: string | null;
}

export interface ResearchSession {
  id: number;
  held_on: string;
  title: string;
  mentor: string | null;
  summary: string | null;
  body_md: string;
  source: string | null;
  session_products: { outcome: string; note: string | null; products: { slug: string; name_vi: string } }[];
}

export interface CriteriaVersion {
  version: string;
  created_on: string;
  summary: string;
  is_current: boolean;
}

export interface Criterion {
  version: string;
  key: string;
  name_vi: string;
  kind: 'hard_filter' | 'score' | 'required';
  group_name: string | null;
  expr: string;
  good: number | null;
  bad: number | null;
  weight: number;
  status: 'active' | 'trial' | 'retired';
  rationale: string | null;
  sort: number;
}

export interface ScoreRow {
  version: string;
  computed_on: string;
  passed_filters: boolean;
  failed_filters: string[];
  total: number | null;
  completeness: number | null;
  breakdown: Record<string, { kind: string; pass?: boolean | null; value?: number | null; score?: number | null; weight?: number }>;
  readiness: Readiness | null;
  missing_required: string[] | null;
  unknown_filters: string[] | null;
}

export interface AmazonSnapshot {
  keyword: string;
  market: string;
  data_month: string;
  captured_on: string;
  searches: number | null;
  purchases: number | null;
  purchase_rate: number | null;
  avg_price: number | null;
  click_concentration: number | null;
  bid: number | null;
  note: string | null;
}

export interface MetaSnapshot {
  keyword: string;
  country: string;
  search_type: string;
  captured_on: string;
  active_ads: number | null;
  active_ads_approx: boolean;
  sample_size: number | null;
  sample_method: string | null;
  advertisers_in_sample: number | null;
  ads_over_60d_in_sample: number | null;
  top_pages: string[] | null;
  note: string | null;
}

export interface BusinessCheck {
  checked_on: string;
  model: 'global_dtc' | 'dropship' | 'local_brand' | 'local_manufacturer' | 'local_stockist' | 'local_retailer' | 'local_service' | 'marketplace' | 'advertorial';
  parent_page_id: string | null;
  confidence: 'cao' | 'trung_binh' | 'thap';
  shipping_time: string | null;
  ships_from: string | null;
  entity: string | null;
  signals: { signal: string; value: string; points_to: 'local' | 'dropship' | 'global' }[] | null;
  can_copy: boolean | null;
  note: string | null;
  sources: string[] | null;
}

export interface AdvertiserLink {
  role: string;
  matches_product: 'yes' | 'no' | 'unverified';
  landing_domain: string | null;
  verified_on: string | null;
  note: string | null;
  advertisers: {
    page_id: string;
    name: string;
    kind: string;
    page_created: string | null;
    note: string | null;
    website: string | null;
    advertiser_snapshots: {
      captured_on: string;
      active_all: number | null;
      total_all: number | null;
      active_au: number | null;
      longest_active_days: number | null;
    }[];
    advertiser_business_checks?: BusinessCheck[];
  };
}

export interface LifeStats {
  n: number;
  min: number;
  median: number;
  p90: number;
  max: number;
  over30: number;
  over60: number;
}

export interface AdSample {
  id: string;
  s: string | null;
  e: string | null;
  days: number | null;
  active: boolean;
  video: boolean;
  text: string;
}

/** Thống kê ads của 1 page trong 1 lần quét toàn bộ Meta Ads Library. */
export interface AdvertiserAdStats {
  page_id: string;
  captured_on: string;
  total: number | null;
  parsed: number | null;
  active: number | null;
  inactive: number | null;
  removed: number | null;
  video: number | null;
  inactive_visible: boolean | null;
  first_start: string | null;
  last_start: string | null;
  countries: Record<string, number> | null;
  life: { all: LifeStats | null; active: LifeStats | null; inactive: LifeStats | null } | null;
  launched_by_week: Record<string, number> | null;
  active_by_week: Record<string, number> | null;
  longest_ads: AdSample[] | null;
  shortest_ads: AdSample[] | null;
  newest_ads: AdSample[] | null;
  partner_pages: Record<string, number> | null;
  landing: Record<string, number> | null;
  note: string | null;
  churn_analysis: ChurnAnalysis | null;
}

/** Vì sao ad của 1 page bị tắt (phân tích từng ad trong Ads Library). */
export interface ChurnAnalysis {
  parsed: number;
  inactive: number;
  low_impression_ads: number;
  summary_md: string;
  reasons: { key: string; label: string; n: number; note: string }[];
  life_buckets: Record<string, number>;
  mass_days: { d: string; n: number; sale: number; median_life: number; top: [string, number][]; note?: string }[];
  by: Record<string, { n: number; active: number; dead: number; died_le3: number; median_dead_life: number | null }>;
  losers: { text: string; n: number; died3: number; median: number; max: number; video: number; partner: number; first: string; last_end: string | null; angle?: string }[];
  winners: { text: string; n: number; active: number; median: number; max: number; first: string; angle?: string }[];
}

export interface CompetitorSocial {
  page_id: string | null;
  brand: string;
  captured_on: string;
  platform: string;
  handle: string | null;
  url: string | null;
  relation: string;
  followers: number | null;
  likes: number | null;
  posts: number | null;
  top_videos: { url: string; views: number | null; likes?: number | null; posted_on?: string | null; caption?: string | null; duration_s?: number | null }[] | null;
  detail: Record<string, unknown> | null;
  note: string | null;
  source: string | null;
}

export interface AdAngleReview {
  captured_on: string;
  angle_key: string;
  name_vi: string;
  description: string | null;
  used_by: { brand: string; ads?: number | null; max_days?: number | null; example?: string | null }[] | null;
  evidence: string | null;
  effectiveness: 'hieu_qua' | 'dang_test' | 'yeu' | 'rui_ro' | 'chua_ai_lam';
  action: 'dung_lai' | 'lam_moi' | 'moi' | 'tranh';
  our_take: string | null;
  sort: number;
}

export interface WinAssessment {
  captured_on: string;
  market: string;
  verdict: string;
  win_probability: number | null;
  summary: string | null;
  factors: { factor: string; rating: 'tot' | 'trung_binh' | 'xau'; note: string }[] | null;
  body_md: string | null;
}

export interface ProductDetail {
  overview: ProductOverview;
  product: { id: number; variant_of: number | null; variant_note: string | null; name_en: string | null; idea_source: string | null; legacy_no: number | null; legacy_score: number | null; legacy_status: string | null; legacy_reason: string | null; decision_summary: string | null; drive_url: string | null };
  keywords: { keyword: string; is_primary: boolean }[];
  scores: ScoreRow[];
  amazon: AmazonSnapshot[];
  listings: { asin: string; market: string; captured_on: string; brand: string | null; title: string | null; price: number | null; est_units: number | null; amazon_badge: string | null; source: string }[];
  meta: MetaSnapshot[];
  tiktok: { keyword: string; captured_on: string; top_item: string | null; top_units_30d: number | null; top_price: number | null; best_video_url: string | null; best_video_views: number | null; note: string | null }[];
  trends: { keyword: string; market: string; captured_on: string; median: number | null; floor_ratio: number | null; seasonality: number | null; growth_25_22: number | null; series: number[] | null; note: string | null }[];
  advertisers: AdvertiserLink[];
  assessments: { assessed_on: string; weight_class: string | null; hazmat: string | null; policy_risk: string | null; retail_risk: string | null; bundle_potential: string | null; target_dtc_price: string | null; landed_cost: number | null; landed_cost_note: string | null; source: string; confidence: string }[];
  dossiers: { version: number; written_on: string; verdict: string; headline: string | null; body_md: string; author: string }[];
  decisions: { decided_on: string; decision: Decision; reason: string | null; revisit_trigger: string | null; criteria_version: string | null; exception_reason: string | null }[];
  checks: ResearchCheck[];
  sessions: { outcome: string; note: string | null; research_sessions: { id: number; held_on: string; title: string } }[];
  adStats: AdvertiserAdStats[];
  variants: { slug: string; name_vi: string; variant_note: string | null }[];
  social: CompetitorSocial[];
  angles: AdAngleReview[];
  win: WinAssessment[];
}

export const getOverview = () =>
  get<ProductOverview[]>('v_product_overview?select=*&order=score.desc.nullslast');

export const getSessions = () =>
  get<ResearchSession[]>(
    'research_sessions?select=*,session_products(outcome,note,products(slug,name_vi))&order=held_on.desc',
  );

export const getCriteriaVersions = () =>
  get<CriteriaVersion[]>('criteria_versions?select=*&order=created_on.desc');

export const getCriteria = (version?: string) =>
  get<Criterion[]>(`criteria?select=*${version ? `&version=eq.${q(version)}` : ''}&order=version.desc,sort.asc`);

export const getFreshness = () =>
  get<{ source: string; scope: string; captured_on: string; rows: number }[]>(
    'v_data_freshness?select=*&order=captured_on.desc,source.asc',
  );

export type CandidateStatus = 'moi' | 'trung' | 'rot_loc' | 'de_xuat' | 'da_them' | 'bo_qua';

export interface DiscoveryCategory {
  category: string;
  active: boolean;
  seed_keywords: string[];
  note: string | null;
  last_run_on: string | null;
}

export interface DiscoveryCandidate {
  id: number;
  run_id: number | null;
  found_on: string;
  category: string | null;
  keyword: string;
  name_vi: string | null;
  source: string;
  signals: Record<string, unknown> | null;
  screen: { hard_filters?: Record<string, boolean>; marketplace_barrier?: string; reason?: string } | null;
  status: CandidateStatus;
  priority: number | null;
  product_id: number | null;
  note: string | null;
  products: { slug: string; name_vi: string } | null;
}

export interface DiscoveryRun {
  id: number;
  run_on: string;
  categories: string[];
  sources: string[];
  n_found: number | null;
  n_new: number | null;
  n_screened_out: number | null;
  n_proposed: number | null;
  summary: string | null;
  errors: string | null;
  discovery_candidates: DiscoveryCandidate[];
}

export const getDiscovery = () =>
  Promise.all([
    get<DiscoveryRun[]>(
      'discovery_runs?select=*,discovery_candidates(*,products(slug,name_vi))&order=run_on.desc,id.desc&limit=20',
    ),
    get<DiscoveryCategory[]>('discovery_categories?select=*&order=active.desc,last_run_on.asc.nullsfirst,category.asc'),
  ]).then(([runs, categories]) => ({ runs, categories }));

export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  // Đợt 1: theo slug (song song). Đợt 2: mọi bảng theo product_id (song song). Supabase ở Sydney ~0.4s/lượt.
  const [[overview], [productRow]] = await Promise.all([
    get<ProductOverview[]>(`v_product_overview?select=*&slug=eq.${q(slug)}`),
    get<(ProductDetail['product'] & { product_keywords: ProductDetail['keywords'] })[]>(
      `products?select=id,variant_of,variant_note,name_en,idea_source,legacy_no,legacy_score,legacy_status,legacy_reason,decision_summary,drive_url,product_keywords(keyword,is_primary)&slug=eq.${q(slug)}`,
    ),
  ]);
  if (!overview || !productRow) return null;
  const id = overview.product_id;
  const { product_keywords, ...product } = productRow;
  const keywords = [...product_keywords].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const kws = keywords.map((k) => k.keyword);
  const kwFilter = kws.length ? q(inList(kws)) : 'in.()';
  const [scores, amazon, listings, meta, tiktok, trends, advertiserRows, assessments, dossiers, decisions, checks, sessions, social, angles, win, variants] = await Promise.all([
    get<ScoreRow[]>(`scores?select=version,computed_on,passed_filters,failed_filters,total,completeness,breakdown,readiness,missing_required,unknown_filters&product_id=eq.${id}&order=computed_on.desc`),
    get<AmazonSnapshot[]>(`amazon_keyword_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc,market.asc`),
    get<ProductDetail['listings']>(`amazon_listing_snapshots?select=*&keyword=${kwFilter}&order=est_units.desc.nullslast`),
    get<MetaSnapshot[]>(`meta_keyword_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    get<ProductDetail['tiktok']>(`tiktok_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    get<ProductDetail['trends']>(`trend_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    // advertiser_ad_stats nhúng qua khoá ngoại page_id → không cần thêm một lượt truy vấn
    get<(AdvertiserLink & { advertisers: AdvertiserLink['advertisers'] & { advertiser_ad_stats: AdvertiserAdStats[] } })[]>(
      `product_advertisers?select=role,matches_product,landing_domain,verified_on,note,advertisers(page_id,name,kind,page_created,note,website,advertiser_snapshots(captured_on,active_all,total_all,active_au,longest_active_days),advertiser_ad_stats(*),advertiser_business_checks!advertiser_business_checks_page_id_fkey(*))&product_id=eq.${id}`,
    ),
    get<ProductDetail['assessments']>(`product_assessments?select=*&product_id=eq.${id}&order=assessed_on.desc`),
    get<ProductDetail['dossiers']>(`dossiers?select=version,written_on,verdict,headline,body_md,author&product_id=eq.${id}&order=version.desc`),
    get<ProductDetail['decisions']>(`decisions?select=decided_on,decision,reason,revisit_trigger,criteria_version,exception_reason&product_id=eq.${id}&order=decided_on.desc,id.desc`),
    get<ResearchCheck[]>(`research_checks?select=check_type,checked_on,value,result,scope,method,source&product_id=eq.${id}&order=checked_on.desc`),
    get<ProductDetail['sessions']>(`session_products?select=outcome,note,research_sessions(id,held_on,title)&product_id=eq.${id}`),
    get<CompetitorSocial[]>(`competitor_social?select=*&product_id=eq.${id}&order=captured_on.desc`),
    get<AdAngleReview[]>(`ad_angle_reviews?select=*&product_id=eq.${id}&order=captured_on.desc,sort.asc`),
    get<WinAssessment[]>(`win_assessments?select=*&product_id=eq.${id}&order=captured_on.desc`),
    get<ProductDetail['variants']>(`products?select=slug,name_vi,variant_note&variant_of=eq.${id}&order=id.asc`),
  ]);
  const adStats = advertiserRows
    .flatMap((r) => r.advertisers.advertiser_ad_stats ?? [])
    .sort((a, b) => b.captured_on.localeCompare(a.captured_on));
  const advertisers: AdvertiserLink[] = advertiserRows;
  return { overview, product, keywords, scores, amazon, listings, meta, tiktok, trends, advertisers, assessments, dossiers, decisions, checks, sessions, adStats, variants, social, angles, win };
}

