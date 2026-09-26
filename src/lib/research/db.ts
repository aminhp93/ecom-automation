// Đọc dữ liệu Market Research từ Supabase (PostgREST). Chỉ dùng trong Server Components.
// Ghi dữ liệu do Claude làm qua MCP — web chỉ đọc (RLS: select-only).
import { connection } from 'next/server';

export class ResearchDbError extends Error {}

async function get<T>(path: string): Promise<T> {
  // Dữ liệu đổi theo từng lần chụp số liệu → luôn render lúc có request, không prerender lúc build.
  await connection();
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!URL || !KEY) {
    throw new ResearchDbError(
      'Thiếu biến môi trường SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY (local: .env.local; Vercel: Project Settings → Environment Variables).',
    );
  }
  const res = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: KEY }, cache: 'no-store' });
  if (!res.ok) throw new ResearchDbError(`${res.status} ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const inList = (values: string[]) =>
  `in.(${values
    .map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')})`;
const q = (s: string) => encodeURIComponent(s);

export type Decision = 'chon_chinh' | 'chon_phu' | 'du_phong' | 'khong_chon';

export interface ProductOverview {
  product_id: number;
  slug: string;
  name_vi: string;
  category: string | null;
  cluster: string | null;
  stage: string;
  decision: Decision | null;
  keyword: string | null;
  us_searches: number | null;
  us_purchase_rate: number | null;
  us_price: number | null;
  au_searches: number | null;
  au_price: number | null;
  uk_searches: number | null;
  meta_active_ads: number | null;
  meta_over60: number | null;
  meta_sample: number | null;
  adswin_pages: number;
  adswin_long_pages: number;
  marketplace_pages: number;
  weight_class: string | null;
  hazmat: string | null;
  policy_risk: string | null;
  retail_risk: string | null;
  bundle_potential: string | null;
  target_dtc_price: string | null;
  landed_cost: number | null;
  score_version: string | null;
  score: number | null;
  completeness: number | null;
  passed_filters: boolean | null;
  failed_filters: string[] | null;
  scored_on: string | null;
  verdict: string | null;
  headline: string | null;
  dossier_on: string | null;
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
  kind: 'hard_filter' | 'score';
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
  advertisers_in_sample: number | null;
  ads_over_60d_in_sample: number | null;
  top_pages: string[] | null;
  note: string | null;
}

export interface AdvertiserLink {
  role: string;
  advertisers: {
    page_id: string;
    name: string;
    kind: string;
    page_created: string | null;
    note: string | null;
    advertiser_snapshots: {
      captured_on: string;
      active_all: number | null;
      total_all: number | null;
      active_au: number | null;
      longest_active_days: number | null;
    }[];
  };
}

export interface ProductDetail {
  overview: ProductOverview;
  product: { id: number; name_en: string | null; idea_source: string | null; legacy_no: number | null; legacy_score: number | null; legacy_status: string | null; legacy_reason: string | null; decision_summary: string | null; drive_url: string | null };
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
  decisions: { decided_on: string; decision: Decision; reason: string | null; revisit_trigger: string | null; criteria_version: string | null }[];
}

export const getOverview = () =>
  get<ProductOverview[]>('v_product_overview?select=*&order=score.desc.nullslast');

export const getCriteriaVersions = () =>
  get<CriteriaVersion[]>('criteria_versions?select=*&order=created_on.desc');

export const getCriteria = (version?: string) =>
  get<Criterion[]>(`criteria?select=*${version ? `&version=eq.${q(version)}` : ''}&order=version.desc,sort.asc`);

export const getFreshness = () =>
  get<{ source: string; scope: string; captured_on: string; rows: number }[]>(
    'v_data_freshness?select=*&order=captured_on.desc,source.asc',
  );

export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const [overview] = await get<ProductOverview[]>(`v_product_overview?select=*&slug=eq.${q(slug)}`);
  if (!overview) return null;
  const id = overview.product_id;
  const [[product], keywords] = await Promise.all([
    get<ProductDetail['product'][]>(
      `products?select=id,name_en,idea_source,legacy_no,legacy_score,legacy_status,legacy_reason,decision_summary,drive_url&id=eq.${id}`,
    ),
    get<ProductDetail['keywords']>(`product_keywords?select=keyword,is_primary&product_id=eq.${id}&order=is_primary.desc`),
  ]);
  const kws = keywords.map((k) => k.keyword);
  const kwFilter = kws.length ? q(inList(kws)) : 'in.()';
  const [scores, amazon, listings, meta, tiktok, trends, advertisers, assessments, dossiers, decisions] = await Promise.all([
    get<ScoreRow[]>(`scores?select=version,computed_on,passed_filters,failed_filters,total,completeness,breakdown&product_id=eq.${id}&order=computed_on.desc`),
    get<AmazonSnapshot[]>(`amazon_keyword_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc,market.asc`),
    get<ProductDetail['listings']>(`amazon_listing_snapshots?select=*&keyword=${kwFilter}&order=est_units.desc.nullslast`),
    get<MetaSnapshot[]>(`meta_keyword_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    get<ProductDetail['tiktok']>(`tiktok_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    get<ProductDetail['trends']>(`trend_snapshots?select=*&keyword=${kwFilter}&order=captured_on.desc`),
    get<AdvertiserLink[]>(
      `product_advertisers?select=role,advertisers(page_id,name,kind,page_created,note,advertiser_snapshots(captured_on,active_all,total_all,active_au,longest_active_days))&product_id=eq.${id}`,
    ),
    get<ProductDetail['assessments']>(`product_assessments?select=*&product_id=eq.${id}&order=assessed_on.desc`),
    get<ProductDetail['dossiers']>(`dossiers?select=version,written_on,verdict,headline,body_md,author&product_id=eq.${id}&order=version.desc`),
    get<ProductDetail['decisions']>(`decisions?select=decided_on,decision,reason,revisit_trigger,criteria_version&product_id=eq.${id}&order=decided_on.desc,id.desc`),
  ]);
  return { overview, product, keywords, scores, amazon, listings, meta, tiktok, trends, advertisers, assessments, dossiers, decisions };
}
