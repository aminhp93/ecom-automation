-- Mạng xã hội của đối thủ (brand + tài khoản affiliate/faceless), video viral.
create table if not exists competitor_social (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id),
  page_id text references advertisers(page_id),   -- brand trên Meta (nếu có)
  brand text not null,                             -- brand mà tài khoản này bán cho
  captured_on date not null,
  platform text not null,                          -- meta | tiktok | instagram | youtube | facebook
  handle text,                                     -- @roomgoesdark …
  url text,
  relation text not null default 'brand',          -- brand | affiliate | partnership | advertorial
  followers bigint,
  likes bigint,
  posts int,
  top_videos jsonb,                                -- [{url, views, likes, posted_on, caption, duration_s}]
  detail jsonb,                                    -- meta: {placements:{...}, formats:{...}}
  note text,
  source text,
  unique (product_id, captured_on, platform, handle)
);

-- Đánh giá angle quảng cáo cho 1 SP (mỗi lần phân tích = 1 bộ dòng theo ngày).
create table if not exists ad_angle_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id),
  captured_on date not null,
  angle_key text not null,
  name_vi text not null,
  description text,
  used_by jsonb,              -- [{brand, ads, max_days, example}]
  evidence text,
  effectiveness text not null check (effectiveness in ('hieu_qua','dang_test','yeu','rui_ro','chua_ai_lam')),
  action text not null check (action in ('dung_lai','lam_moi','moi','tranh')),
  our_take text,              -- mình làm phiên bản nào
  sort int default 0,
  unique (product_id, captured_on, angle_key)
);

-- Đánh giá thực tế khả năng win của SP theo thị trường.
create table if not exists win_assessments (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id),
  captured_on date not null,
  market text not null,                 -- AU | US | UK | ALL
  verdict text not null,                -- cao | kha | trung_binh | thap
  win_probability numeric,              -- 0..1, ước lượng chủ quan
  summary text,
  factors jsonb,                        -- [{factor, rating: 'tot'|'trung_binh'|'xau', note}]
  body_md text,
  unique (product_id, captured_on, market)
);

alter table competitor_social enable row level security;
alter table ad_angle_reviews enable row level security;
alter table win_assessments enable row level security;
drop policy if exists "public read" on competitor_social;
drop policy if exists "public read" on ad_angle_reviews;
drop policy if exists "public read" on win_assessments;
create policy "public read" on competitor_social for select to anon, authenticated using (true);
create policy "public read" on ad_angle_reviews for select to anon, authenticated using (true);
create policy "public read" on win_assessments for select to anon, authenticated using (true);
