-- Thống kê ads của từng page đối thủ, mỗi lần quét Meta Ads Library = 1 dòng (chỉ thêm, không ghi đè).
-- Quét toàn bộ ad của page (active_status=all, country=ALL) + đếm ad đang chạy theo từng nước.
-- Lưu ý: Ads Library chỉ hiện ad đã tắt nếu ad từng chạy ở EU/UK → page chỉ chạy AU/US có inactive_visible = false.
create table if not exists advertiser_ad_stats (
  id bigint generated always as identity primary key,
  page_id text not null references advertisers(page_id),
  captured_on date not null,
  total int,                 -- số "results" Ads Library báo
  parsed int,                -- số ad đọc được
  active int,
  inactive int,
  removed int,               -- ad bị gỡ vì vi phạm tiêu chuẩn quảng cáo
  video int,
  inactive_visible boolean,  -- Ads Library có hiện ad đã tắt không
  first_start date,          -- ad cũ nhất còn thấy
  last_start date,           -- ad mới nhất
  countries jsonb,           -- {"ALL":499,"US":468,"AU":47,...} ad đang chạy theo nước
  life jsonb,                -- {"all":{n,min,median,p90,max,over30,over60},"active":{...},"inactive":{...}} (ngày)
  launched_by_week jsonb,    -- {"2026-09-21": 46, ...} ad mới theo tuần (thứ 2)
  active_by_week jsonb,      -- {"2026-09-21": 500, ...} ad đang chạy trong tuần (dựng lại từ ngày bắt đầu/kết thúc)
  longest_ads jsonb,         -- [{id,s,e,days,active,video,text}] top 5, bỏ trùng nội dung
  shortest_ads jsonb,        -- top 5 ad đã tắt sống ngắn nhất
  newest_ads jsonb,
  partner_pages jsonb,       -- {"calmcozysleeps with Guard Blinds":144, ...}
  landing jsonb,             -- domain hiển thị trên ad → số ad
  note text,
  source text default 'meta.ads_library',
  unique (page_id, captured_on)
);
alter table advertiser_ad_stats enable row level security;
drop policy if exists "public read" on advertiser_ad_stats;
create policy "public read" on advertiser_ad_stats for select to anon, authenticated using (true);

-- 28/09: phân tích vì sao ad bị tắt (sale hết đợt / thay bản mới / dọn hàng loạt / test thua / hết vòng đời / low impression)
alter table advertiser_ad_stats add column if not exists churn_analysis jsonb;
