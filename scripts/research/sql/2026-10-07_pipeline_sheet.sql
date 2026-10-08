-- Bảng tổng hợp phẳng, thứ tự cột giống sheet "Pipeline 91 SP" (pipeline-san-pham-2026-09-23).
-- Một dòng mỗi sản phẩm (products) + một dòng mỗi ứng viên của discover chưa thành sản phẩm.
-- Web (/market-research/pipeline) và file xuất hằng tuần (scripts/research/export_pipeline.py) cùng đọc view này,
-- nhãn cột tiếng Việt nằm ở src/lib/research/pipeline-columns.json.
-- Cột `nhom` = tag do người dùng đặt (products.tag / discovery_candidates.tag: theo_doi | loai | null). Chưa tag thì null.
-- Không có cột "Số ô đỏ / ô xanh" của sheet cũ: đó là tô màu thủ công, không có trong DB.
create or replace view v_pipeline_sheet with (security_invoker = true) as
with tt as (
  select distinct on (keyword) keyword, top_item, best_video_url, best_video_views
  from tiktok_snapshots order by keyword, captured_on desc, id desc
),
mk as (
  -- Một lần quét Meta Ads Library TẤT CẢ quốc gia (country = 'ALL') mới nhất cho mỗi keyword (kể cả mẫu < 20 ad hoặc 0 ad: 0 ad là kết quả đã kiểm tra, không phải "chưa kiểm tra").
  -- Mọi cột Meta của bảng đều lấy từ CÙNG một dòng này để không trộn nhiều lần quét.
  select distinct on (keyword) keyword, active_ads, captured_on, advertisers_in_sample, ads_over_60d_in_sample, top_pages
  from meta_keyword_snapshots
  where country = 'ALL' and active_ads is not null
  order by keyword, captured_on desc, id desc
),
tp as (
  -- Advertiser thấy trong mẫu quét keyword (top_pages có hai dạng: mảng tên, hoặc mảng {n, name, max_days, page_id}); dùng khi sản phẩm chưa có page được liên kết.
  -- Page đã quét riêng (advertiser_snapshots) hiện "tên: active/tổng - năm tạo"; chưa quét thì "tên: n ad trong mẫu". Sắp theo ad đang chạy giảm dần.
  select m.keyword,
    jsonb_agg(jsonb_build_object('n', x.nm, 'id', coalesce(y.pid2, ''), 'a', sn.active_all, 't', sn.total_all, 'y', ay.page_created, 's', x.cnt) order by sn.active_all desc nulls last, e.ord) filter (where e.ord <= 10) as pages_json,
    string_agg(x.nm || case when sn.active_all is not null then ': ' || sn.active_all || '/' || coalesce(sn.total_all::text, '?') || coalesce(' - ' || ay.page_created, '')
                            when x.cnt is not null then ': ' || x.cnt || ' ad trong mẫu' else '' end, E'\n' order by sn.active_all desc nulls last, e.ord) filter (where e.ord <= 10) as pages_txt,
    string_agg(x.nm || coalesce('(' || x.cnt || ')', ''), '; ' order by e.ord) filter (where e.ord <= 6) as top_txt
  from mk m
  cross join lateral jsonb_array_elements(case when jsonb_typeof(m.top_pages) = 'array' then m.top_pages else '[]'::jsonb end) with ordinality e(v, ord)
  cross join lateral (select regexp_replace(case jsonb_typeof(e.v) when 'string' then e.v #>> '{}' else e.v->>'name' end, '\s*\(page \d+\)', '') as nm,
                             substring(case jsonb_typeof(e.v) when 'string' then e.v #>> '{}' else e.v->>'name' end from 'page (\d+)') as pid,
                             case when jsonb_typeof(e.v) = 'object' then (e.v->>'n')::int end as cnt) x
  left join lateral (select a.page_id as adv_id from advertisers a where lower(a.name) = lower(x.nm) limit 1) ad on true
  cross join lateral (select coalesce(e.v->>'page_id', x.pid, ad.adv_id) as pid2) y
  left join lateral (select s.active_all, s.total_all from advertiser_snapshots s where s.page_id = y.pid2 and s.active_all is not null order by s.captured_on desc, s.id desc limit 1) sn on true
  left join advertisers ay on ay.page_id = y.pid2
  group by m.keyword
),
mkc as (
  -- Lần quét mới nhất theo từng nước riêng (AU, US) cho mỗi keyword
  select distinct on (keyword, country) keyword, country, active_ads, top_pages
  from meta_keyword_snapshots
  where country in ('AU', 'US') and active_ads is not null
  order by keyword, country, captured_on desc, id desc
),
tpc as (
  select m.keyword, m.country,
    string_agg(x.nm || coalesce('(' || x.cnt || ')', ''), '; ' order by e.ord) filter (where e.ord <= 6) as top_txt
  from mkc m
  cross join lateral jsonb_array_elements(case when jsonb_typeof(m.top_pages) = 'array' then m.top_pages else '[]'::jsonb end) with ordinality e(v, ord)
  cross join lateral (select regexp_replace(case jsonb_typeof(e.v) when 'string' then e.v #>> '{}' else e.v->>'name' end, '\s*\(page \d+\)', '') as nm,
                             case when jsonb_typeof(e.v) = 'object' then (e.v->>'n')::int end as cnt) x
  group by m.keyword, m.country
),
price as (
  -- Giá TB Amazon mới nhất có số, kể cả tháng chưa có số search (view v3 bỏ các dòng đó nên giá bị trống)
  select keyword,
    max(avg_price) filter (where market = 'US') as us_price,
    max(avg_price) filter (where market = 'AU') as au_price,
    max(avg_price) filter (where market = 'UK') as uk_price
  from (select distinct on (keyword, market) keyword, market, avg_price from amazon_keyword_snapshots
        where avg_price is not null order by keyword, market, captured_on desc, data_month desc, id desc) z
  group by keyword
),
pg as (
  select x.product_id,
    array_to_string((array_agg(
      a.name || ': ' || coalesce(s.active_all::text, '?') || '/' || coalesce(s.total_all::text, '?')
        || coalesce(' - ' || a.page_created, '')
      order by s.active_all desc nulls last))[1:10], E'\n') as meta_pages,
    to_jsonb((array_agg(
      jsonb_build_object('n', a.name, 'id', a.page_id, 'a', s.active_all, 't', s.total_all, 'y', a.page_created)
      order by s.active_all desc nulls last))[1:10]) as meta_pages_json
  from (select distinct on (product_id, page_id) product_id, page_id from product_advertisers order by product_id, page_id) x
  join advertisers a using (page_id)
  left join lateral (
    select active_all, total_all from advertiser_snapshots s
    where s.page_id = a.page_id order by captured_on desc, id desc limit 1) s on true
  group by x.product_id
)
select
  case o.decision
    when 'chon_chinh' then 'Chọn – SP chính' when 'chon_phu' then 'Chọn – SP phụ'
    when 'du_phong' then 'Chọn – dự phòng' when 'khong_chon' then 'Không chọn' else 'Chưa quyết' end as quyet_dinh,
  o.score,
  o.name_vi,
  o.us_searches, o.us_purchases, o.us_purchase_rate,
  o.cluster, o.category, o.keyword,
  coalesce(o.us_price, pr.us_price) as us_price, o.us_click_conc,
  o.au_searches, coalesce(o.au_price, pr.au_price) as au_price, o.uk_searches, coalesce(o.uk_price, pr.uk_price) as uk_price,
  o.tt_units_30d, o.tt_price, tt.top_item as tt_top_item, tt.best_video_url as tt_video_url, tt.best_video_views as tt_views,
  o.trend_floor, o.trend_season, o.trend_growth,
  mk.active_ads as meta_au_active_ads,
  coalesce(mk.advertisers_in_sample, jsonb_array_length(case when jsonb_typeof(mk.top_pages) = 'array' then mk.top_pages end)) as meta_au_advertisers,
  mk.ads_over_60d_in_sample as meta_au_over60,
  tp.top_txt as meta_au_top,
  o.weight_class, o.hazmat, o.policy_risk, o.retail_risk, o.bundle_potential, o.target_dtc_price, o.landed_cost,
  coalesce(pg.meta_pages, tp.pages_txt) as meta_pages,
  coalesce(p.decision_summary, o.headline, p.legacy_reason) as reason,
  nullif(array_to_string(coalesce(o.missing_required, '{}') || coalesce(o.unknown_filters, '{}'), ', '), '') as missing,
  (  (o.us_searches is null)::int + (o.us_purchases is null)::int + (coalesce(o.us_price, pr.us_price) is null)::int
   + (o.au_searches is null)::int + (coalesce(o.au_price, pr.au_price) is null)::int + (o.uk_searches is null)::int + (coalesce(o.uk_price, pr.uk_price) is null)::int
   + (o.tt_units_30d is null)::int + (o.tt_price is null)::int
   + (o.trend_floor is null)::int + (o.trend_season is null)::int + (o.trend_growth is null)::int
   + (mk.active_ads is null)::int + (o.weight_class is null)::int + (o.hazmat is null)::int
   + (o.policy_risk is null)::int + (o.retail_risk is null)::int + (o.bundle_potential is null)::int
   + (o.target_dtc_price is null)::int + (o.landed_cost is null)::int) as n_empty,
  'san_pham'::text as loai_dong,
  mk.captured_on as ngay_quet,
  o.slug as ref,
  p.tag as nhom,
  coalesce(pg.meta_pages_json, tp.pages_json) as meta_pages_json,
  au.active_ads as meta_au_ads_n, tau.top_txt as meta_au_top2,
  us.active_ads as meta_us_ads_n, tus.top_txt as meta_us_top2
from v_product_overview o
join products p on p.id = o.product_id
left join tt on tt.keyword = o.keyword
left join mk on mk.keyword = o.keyword
left join tp on tp.keyword = o.keyword
left join price pr on pr.keyword = o.keyword
left join pg on pg.product_id = o.product_id
left join mkc au on au.keyword = o.keyword and au.country = 'AU'
left join mkc us on us.keyword = o.keyword and us.country = 'US'
left join tpc tau on tau.keyword = o.keyword and tau.country = 'AU'
left join tpc tus on tus.keyword = o.keyword and tus.country = 'US'

union all

select
  'Ứng viên – ' || case c.status when 'de_xuat' then 'đề xuất' when 'moi' then 'mới' when 'trung' then 'trùng SP cũ'
    when 'rot_loc' then 'rớt lọc' when 'bo_qua' then 'bỏ qua' when 'da_them' then 'đã thêm' else c.status end,
  null::numeric,
  c.name_vi,
  null, null, null,
  null, c.category, c.keyword,
  null, null,
  case when c.signals->>'au_searches' ~ '^[0-9]+$' then (c.signals->>'au_searches')::integer end, null, null, null,
  null, null, null, null, null,
  null, null, null,
  coalesce(mk.active_ads, case when c.signals->>'meta_active_ads_au' ~ '^[0-9]+$' then (c.signals->>'meta_active_ads_au')::integer end),
  coalesce(mk.advertisers_in_sample, jsonb_array_length(case when jsonb_typeof(mk.top_pages) = 'array' then mk.top_pages end)),
  mk.ads_over_60d_in_sample,
  tp.top_txt,
  null, null, null, null, null, null, null,
  tp.pages_txt,
  concat_ws(' | ',
    case when c.priority is not null then 'Xếp hạng đề xuất ' || c.priority::text end,
    c.note,
    (select string_agg(k || ': ' || v, '; ') from jsonb_each_text(c.signals) as s(k, v)
      where k not in ('au_searches', 'meta_active_ads_au'))),
  null,
  null::integer,
  'ung_vien'::text,
  coalesce(mk.captured_on, c.found_on),
  c.id::text,
  c.tag,
  tp.pages_json,
  au.active_ads, tau.top_txt, us.active_ads, tus.top_txt
from discovery_candidates c
left join mk on mk.keyword = c.keyword
left join tp on tp.keyword = c.keyword
left join mkc au on au.keyword = c.keyword and au.country = 'AU'
left join mkc us on us.keyword = c.keyword and us.country = 'US'
left join tpc tau on tau.keyword = c.keyword and tau.country = 'AU'
left join tpc tus on tus.keyword = c.keyword and tus.country = 'US'
-- Ứng viên 'trùng SP cũ' đã có dòng sản phẩm nên không lặp lại trong bảng
where c.product_id is null and c.status <> 'trung';

comment on view v_pipeline_sheet is 'Bảng phẳng giống sheet pipeline; sản phẩm + ứng viên discover chưa thành sản phẩm';
