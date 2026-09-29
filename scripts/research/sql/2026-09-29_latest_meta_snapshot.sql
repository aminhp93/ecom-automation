-- Keep observed ad counts even when the longevity sample is too small.
create or replace view v_product_metrics_v3 with (security_invoker = true) as
with pk as (
  select product_id, keyword, sources_excluded from product_keywords where is_primary
),
az as (
  select distinct on (keyword, market) * from amazon_keyword_snapshots
  where searches is not null order by keyword, market, captured_on desc, data_month desc
),
adv as (
  select distinct on (page_id) page_id, active_au from advertiser_snapshots
  where active_au is not null order by page_id, captured_on desc
),
pa as (
  -- mỗi cột lấy giá trị có dữ liệu mới nhất (một lần đánh giá có thể chỉ điền vài cột)
  select product_id,
    (array_agg(weight_class order by assessed_on desc) filter (where weight_class is not null))[1] as weight_class,
    (array_agg(hazmat order by assessed_on desc) filter (where hazmat is not null))[1] as hazmat,
    (array_agg(policy_risk order by assessed_on desc) filter (where policy_risk is not null))[1] as policy_risk,
    (array_agg(retail_risk order by assessed_on desc) filter (where retail_risk is not null))[1] as retail_risk,
    (array_agg(bundle_potential order by assessed_on desc) filter (where bundle_potential is not null))[1] as bundle_potential,
    (array_agg(target_dtc_price order by assessed_on desc) filter (where target_dtc_price is not null))[1] as target_dtc_price,
    (array_agg(landed_cost order by assessed_on desc) filter (where landed_cost is not null))[1] as landed_cost,
    (array_agg(marketplace_barrier order by assessed_on desc) filter (where marketplace_barrier is not null))[1] as marketplace_barrier,
    (array_agg(competitor_model order by assessed_on desc) filter (where competitor_model is not null))[1] as competitor_model,
    (array_agg(content_ease order by assessed_on desc) filter (where content_ease is not null))[1] as content_ease
  from product_assessments group by product_id
),
chk as (
  select distinct on (product_id, check_type) * from research_checks order by product_id, check_type, checked_on desc
)
select
  p.id as product_id, p.slug, p.name_vi, p.category, p.cluster, p.stage, p.decision, p.variant_of, p.variant_note,
  pk.keyword,
  us.searches as us_searches, us.purchases as us_purchases, us.purchase_rate as us_purchase_rate,
  us.avg_price as us_price, us.click_concentration as us_click_conc,
  au.searches as au_searches, au.purchases as au_purchases, au.avg_price as au_price,
  uk.searches as uk_searches, uk.avg_price as uk_price,
  case when 'tiktok' = any(pk.sources_excluded) then null else tt.top_units_30d end as tt_units_30d,
  case when 'tiktok' = any(pk.sources_excluded) then null else tt.top_price end as tt_price,
  tr.floor_ratio as trend_floor, tr.seasonality as trend_season, tr.growth_25_22 as trend_growth,
  mk.active_ads as meta_au_active_ads, mk.sample_size as meta_au_sample, mk.sample_method as meta_au_method,
  mk.captured_on as meta_au_captured_on,
  case when mk.sample_size >= 20 then round(mk.ads_over_60d_in_sample::numeric / nullif(mk.sample_size, 0), 3) end as meta_au_over60_ratio,
  case when ca.product_id is null then null else (
    select count(distinct coalesce(x.landing_domain, a.website, a.page_id))
    from product_advertisers x join advertisers a using (page_id) join adv s using (page_id)
    where x.product_id = p.id and x.matches_product = 'yes' and a.kind in ('brand','advertorial') and s.active_au >= 5
  ) end as ad_signal_brands,
  ca.checked_on as competitors_checked_on,
  mp.value as marketplace_present,
  (vc.value = 1) as variant_conflict,
  pa.weight_class, pa.hazmat, pa.policy_risk, pa.retail_risk, pa.bundle_potential, pa.target_dtc_price, pa.landed_cost,
  pa.marketplace_barrier, pa.competitor_model, pa.content_ease
from products p
left join pk on pk.product_id = p.id
left join az us on us.keyword = pk.keyword and us.market = 'US'
left join az au on au.keyword = pk.keyword and au.market = 'AU'
left join az uk on uk.keyword = pk.keyword and uk.market = 'UK'
left join lateral (select * from tiktok_snapshots t where t.keyword = pk.keyword order by captured_on desc limit 1) tt on true
left join lateral (select * from trend_snapshots t where t.keyword = pk.keyword and t.market = 'US' order by captured_on desc limit 1) tr on true
left join lateral (select * from meta_keyword_snapshots m where m.keyword = pk.keyword and m.country = 'AU'
                   and m.active_ads is not null order by captured_on desc, id desc limit 1) mk on true
left join chk ca on ca.product_id = p.id and ca.check_type = 'competitors_au'
left join chk mp on mp.product_id = p.id and mp.check_type = 'marketplace_presence'
left join chk vc on vc.product_id = p.id and vc.check_type = 'variant'
left join pa on pa.product_id = p.id;

