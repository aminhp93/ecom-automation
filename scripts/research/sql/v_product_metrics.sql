-- 1 dòng / SP: số liệu mới nhất (có dữ liệu) của keyword chính ở mỗi nguồn.
-- Tiêu chí (bảng criteria.expr) viết biểu thức trên các cột của view này.
create or replace view v_product_metrics with (security_invoker = true) as
with pk as (
  select product_id, keyword from product_keywords where is_primary
),
az as (
  select distinct on (keyword, market) *
  from amazon_keyword_snapshots
  where searches is not null
  order by keyword, market, captured_on desc, data_month desc
),
adv as (
  select page_id,
    (array_agg(active_all order by captured_on desc) filter (where active_all is not null))[1] as active_all,
    max(longest_active_days) as longest_active_days
  from advertiser_snapshots group by page_id
),
pa as (
  select distinct on (product_id) * from product_assessments order by product_id, assessed_on desc
)
select
  p.id as product_id, p.slug, p.name_vi, p.category, p.cluster, p.stage, p.decision,
  pk.keyword,
  us.searches as us_searches, us.purchases as us_purchases, us.purchase_rate as us_purchase_rate,
  us.avg_price as us_price, us.click_concentration as us_click_conc, us.captured_on as us_captured_on,
  au.searches as au_searches, au.purchases as au_purchases, au.avg_price as au_price, au.purchase_rate as au_purchase_rate,
  uk.searches as uk_searches, uk.avg_price as uk_price,
  tt.top_units_30d as tt_units_30d, tt.top_price as tt_price, tt.best_video_views as tt_views,
  tr.floor_ratio as trend_floor, tr.seasonality as trend_season, tr.growth_25_22 as trend_growth,
  mk.active_ads as meta_active_ads, mk.advertisers_in_sample as meta_advertisers,
  mo.ads_over_60d_in_sample as meta_over60, mo.sample_size as meta_sample,
  (select count(*) from product_advertisers x join advertisers a using (page_id) join adv s using (page_id)
     where x.product_id = p.id and a.kind in ('brand','advertorial') and s.active_all >= 50) as adswin_pages,
  (select count(*) from product_advertisers x join advertisers a using (page_id) join adv s using (page_id)
     where x.product_id = p.id and a.kind in ('brand','advertorial') and s.longest_active_days >= 180) as adswin_long_pages,
  (select count(*) from product_advertisers x join advertisers a using (page_id)
     where x.product_id = p.id and a.kind in ('retailer','marketplace')) as marketplace_pages,
  pa.weight_class, pa.hazmat, pa.policy_risk, pa.retail_risk, pa.bundle_potential, pa.target_dtc_price, pa.landed_cost
from products p
left join pk on pk.product_id = p.id
left join az us on us.keyword = pk.keyword and us.market = 'US'
left join az au on au.keyword = pk.keyword and au.market = 'AU'
left join az uk on uk.keyword = pk.keyword and uk.market = 'UK'
left join lateral (select * from tiktok_snapshots t where t.keyword = pk.keyword order by captured_on desc limit 1) tt on true
left join lateral (select * from trend_snapshots t where t.keyword = pk.keyword and t.market = 'US' order by captured_on desc limit 1) tr on true
left join lateral (select * from meta_keyword_snapshots m where m.keyword = pk.keyword and m.country = 'AU'
                   and m.active_ads is not null order by captured_on desc limit 1) mk on true
left join lateral (select * from meta_keyword_snapshots m where m.keyword = pk.keyword and m.country = 'AU'
                   and m.ads_over_60d_in_sample is not null order by captured_on desc limit 1) mo on true
left join pa on pa.product_id = p.id;
