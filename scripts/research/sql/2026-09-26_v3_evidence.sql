-- v3 (26/09/2026): bằng chứng đúng SP/đúng AU, phân biệt "chưa kiểm tra" với "0",
-- mức sẵn sàng ra quyết định, tỷ lệ ad lâu ngày theo mẫu, tiêu chí của anh Thanh.

-- 1) Liên kết SP ↔ page quảng cáo: đã xác nhận đúng SP chưa, website đích (gộp page cùng brand)
alter table product_advertisers
  add column if not exists matches_product text not null default 'unverified'
    check (matches_product in ('yes','no','unverified')),
  add column if not exists landing_domain text,
  add column if not exists verified_on date,
  add column if not exists note text;

-- 2) Nhật ký kiểm tra: không có dòng = chưa kiểm tra (không bao giờ hiểu thành 0)
create table if not exists research_checks (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  check_type text not null check (check_type in
    ('competitors_au','marketplace_presence','safety','variant','landed_cost','barrier','competitor_model','policy','content')),
  checked_on date not null,
  value numeric,            -- số hoá kết quả khi cần (vd marketplace_presence: 1 có / 0 không)
  result text not null,     -- kết luận ngắn
  scope text,               -- keyword / quốc gia / phạm vi
  method text,              -- cách kiểm tra, cách lấy mẫu
  source text,
  unique (product_id, check_type, checked_on)
);
create index if not exists research_checks_product on research_checks (product_id, check_type, checked_on desc);

-- 3) Đánh giá định tính theo tiêu chí anh Thanh (null = chưa đánh giá)
alter table product_assessments
  add column if not exists marketplace_barrier text check (marketplace_barrier in ('Cao','TB','Thấp')),
  add column if not exists competitor_model text check (competitor_model in ('dropship','mixed','local')),
  add column if not exists content_ease text check (content_ease in ('Cao','TB','Thấp'));

-- 4) Cách lấy mẫu Meta
alter table meta_keyword_snapshots add column if not exists sample_method text;

-- 5) Phiên bản SP: bằng chứng của phiên bản khác chỉ là tham khảo
alter table products
  add column if not exists variant_of bigint references products(id),
  add column if not exists variant_note text;
alter table product_keywords add column if not exists sources_excluded text[] not null default '{}';

-- 6) Quyết định trái lọc cứng / chưa đủ bằng chứng phải ghi lý do ngoại lệ
alter table decisions add column if not exists exception_reason text;

-- 7) Kết quả chấm: mức sẵn sàng
alter table scores
  add column if not exists readiness text check (readiness in ('san_sang','can_xac_minh','rot_loc_cung')),
  add column if not exists missing_required text[] not null default '{}',
  add column if not exists unknown_filters text[] not null default '{}';

-- 8) Tiêu chí: thêm loại "required" (bằng chứng bắt buộc) + mỗi phiên bản chọn view số liệu
alter table criteria drop constraint if exists criteria_kind_check;
alter table criteria add constraint criteria_kind_check check (kind in ('hard_filter','score','required'));
alter table criteria_versions add column if not exists metrics_view text not null default 'v_product_metrics';

-- 9) Phiên nghiên cứu (buổi với anh Thanh, kết quả, tiêu chí mentor)
create table if not exists research_sessions (
  id bigint generated always as identity primary key,
  held_on date not null,
  title text not null,
  mentor text,
  summary text,
  body_md text not null,
  source text
);
create table if not exists session_products (
  session_id bigint not null references research_sessions(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  outcome text not null,
  note text,
  primary key (session_id, product_id)
);

alter table research_checks enable row level security;
alter table research_sessions enable row level security;
alter table session_products enable row level security;
do $$ begin
  create policy research_checks_read on research_checks for select to anon, authenticated using (true);
  create policy research_sessions_read on research_sessions for select to anon, authenticated using (true);
  create policy session_products_read on session_products for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
