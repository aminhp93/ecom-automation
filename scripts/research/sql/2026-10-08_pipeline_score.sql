-- Điểm tiềm năng (08/10/2026). `v_pipeline_sheet_base` = view gốc 2026-10-07_pipeline_sheet.sql (đã đổi tên);
-- `v_pipeline_sheet` bọc ngoài, thêm: rao_can_san (đánh giá mới nhất từ product_assessments, trống nếu chưa kiểm chứng),
-- diem_tiem_nang (0–9) và diem_chua_ro (số tiêu chí chưa có dữ liệu). Chỉ chấm sản phẩm qua lọc cứng
-- (không nặng, không pin/dễ vỡ/dao, chính sách không Cao, rủi ro siêu thị không Cao); ứng viên và SP rớt lọc cứng để trống.
-- 9 tiêu chí, mỗi tiêu chí 1 điểm; thiếu dữ liệu = 0 điểm và tính vào diem_chua_ro:
--  1 search AU >= 5.000 · 2 >= 100 ad AU · 3 >= 15 ad chạy >60 ngày (mẫu mọi nước) · 4 giá DTC mục tiêu (số lớn nhất) >= 50
--  5 search US >= 100.000 và tỷ lệ mua >= 2% · 6 Trends không mùa vụ (<= 2,5) và không giảm (>= 1,0) · 7 bundle Cao
--  8 rủi ro siêu thị Thấp · 9 rào cản với sàn Cao hoặc TB.
-- Thực hiện: alter view v_pipeline_sheet rename to v_pipeline_sheet_base; rồi chạy phần dưới.
create view v_pipeline_sheet with (security_invoker = true) as
with mbs as (
  select p.slug, a.marketplace_barrier
  from products p
  left join lateral (select x.marketplace_barrier from product_assessments x where x.product_id = p.id and x.marketplace_barrier is not null order by x.assessed_on desc, x.id desc limit 1) a on true
),
x as (
  select b.*, m.marketplace_barrier as rao_can_san,
    (select max(n[1]::numeric) from regexp_matches(b.target_dtc_price, '\d+(?:\.\d+)?', 'g') n) as top_price
  from v_pipeline_sheet_base b
  left join mbs m on m.slug = b.ref and b.loai_dong = 'san_pham'
),
c as (
  select x.*,
    (coalesce(x.weight_class, '') <> 'nặng' and coalesce(x.hazmat, 'Không') = 'Không' and coalesce(x.policy_risk, '') <> 'Cao' and coalesce(x.retail_risk, '') <> 'Cao') as qua_loc_cung,
    coalesce((x.au_searches >= 5000)::int, 0) + coalesce((x.meta_au_ads_n >= 100)::int, 0) + coalesce((x.meta_au_over60 >= 15)::int, 0) + coalesce((x.top_price >= 50)::int, 0)
      + coalesce((x.us_searches >= 100000 and x.us_purchase_rate >= 0.02)::int, 0)
      + coalesce((coalesce(x.trend_season, 0) <= 2.5 and coalesce(x.trend_growth, 1) >= 1.0 and (x.trend_season is not null or x.trend_growth is not null))::int, 0)
      + coalesce((x.bundle_potential = 'Cao')::int, 0) + coalesce((x.retail_risk = 'Thấp')::int, 0) + coalesce((x.rao_can_san in ('Cao', 'TB'))::int, 0) as pts,
    (x.au_searches is null)::int + (x.meta_au_ads_n is null)::int + (x.meta_au_over60 is null)::int + (x.top_price is null)::int
      + (x.us_searches is null or x.us_purchase_rate is null)::int + (x.trend_season is null and x.trend_growth is null)::int
      + (x.bundle_potential is null)::int + (x.retail_risk is null)::int + (x.rao_can_san is null)::int as unk
  from x
)
select c.quyet_dinh, c.score, c.name_vi, c.us_searches, c.us_purchases, c.us_purchase_rate, c.cluster, c.category, c.keyword, c.us_price, c.us_click_conc,
  c.au_searches, c.au_price, c.uk_searches, c.uk_price, c.tt_units_30d, c.tt_price, c.tt_top_item, c.tt_video_url, c.tt_views,
  c.trend_floor, c.trend_season, c.trend_growth, c.meta_au_active_ads, c.meta_au_advertisers, c.meta_au_over60, c.meta_au_top,
  c.weight_class, c.hazmat, c.policy_risk, c.retail_risk, c.bundle_potential, c.target_dtc_price, c.landed_cost,
  c.meta_pages, c.reason, c.missing, c.n_empty, c.loai_dong, c.ngay_quet, c.ref, c.nhom, c.meta_pages_json,
  c.meta_au_ads_n, c.meta_au_top2, c.meta_us_ads_n, c.meta_us_top2,
  c.rao_can_san,
  case when c.loai_dong = 'san_pham' and c.qua_loc_cung then c.pts end as diem_tiem_nang,
  case when c.loai_dong = 'san_pham' and c.qua_loc_cung then c.unk end as diem_chua_ro
from c;
