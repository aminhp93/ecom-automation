-- Tìm sản phẩm mới (discovery): ngành xoay vòng hằng tuần → ứng viên → lọc → top 5 đưa vào pipeline.

-- Ngành hàng theo dõi + keyword gốc để quét. Ngành bị loại (Pet, Baby — anh Thanh) để active=false.
create table if not exists discovery_categories (
  category text primary key,
  active boolean not null default true,
  seed_keywords text[] not null default '{}',   -- keyword gốc (EN) dùng cho Topview + Meta Ads Library
  note text,
  last_run_on date
);

-- Mỗi lần chạy tìm mới = 1 dòng.
create table if not exists discovery_runs (
  id bigint generated always as identity primary key,
  run_on date not null,
  categories text[] not null,
  sources text[] not null,          -- topview.aba_weekly, topview.product_research, topview.tiktok, meta.ads_library, amazon.web …
  n_found int, n_new int, n_screened_out int, n_proposed int,
  summary text,
  errors text                       -- nguồn nào lỗi / không lấy được
);

-- Ứng viên tìm được (chỉ thêm; trùng keyword trong cùng lần chạy thì gộp).
create table if not exists discovery_candidates (
  id bigint generated always as identity primary key,
  run_id bigint references discovery_runs(id),
  found_on date not null,
  category text references discovery_categories(category),
  keyword text not null,             -- keyword EN đại diện
  name_vi text,
  source text not null,
  signals jsonb,                     -- {us_searches, au_searches, growth, tiktok_gmv_7d, meta_active_ads_au, ads_over_60d, example_brand, price…}
  screen jsonb,                      -- {hard_filters:{battery,liquid,knife,heavy,baby_pet,medical}, marketplace_barrier:'Cao|TB|Thấp', reason}
  status text not null default 'moi' check (status in ('moi','trung','rot_loc','de_xuat','da_them','bo_qua')),
  priority numeric,                  -- điểm sơ bộ để xếp top 5
  product_id bigint references products(id),  -- khi đã thêm vào pipeline
  note text,
  unique (run_id, keyword)
);

alter table discovery_categories enable row level security;
alter table discovery_runs enable row level security;
alter table discovery_candidates enable row level security;
drop policy if exists "public read" on discovery_categories;
drop policy if exists "public read" on discovery_runs;
drop policy if exists "public read" on discovery_candidates;
create policy "public read" on discovery_categories for select to anon, authenticated using (true);
create policy "public read" on discovery_runs for select to anon, authenticated using (true);
create policy "public read" on discovery_candidates for select to anon, authenticated using (true);

-- Ngành xoay vòng: ngành active có last_run_on cũ nhất (null trước) → chạy 2 ngành/tuần.
create or replace view v_discovery_next as
select category, seed_keywords, last_run_on
from discovery_categories where active
order by last_run_on nulls first, category
limit 2;
