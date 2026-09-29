-- Số liệu cho tiêu chí v3. Khác v2:
--  * không coalesce: ô an toàn trống → null → lọc cứng "chưa xác minh", không tự qua
--  * ad_signal_brands: chỉ đếm website khác nhau đã xác nhận bán ĐÚNG SP, có ≥5 ad đang chạy ở AU;
--    null nếu chưa có lần kiểm tra competitors_au
--  * marketplace_present: từ research_checks; không có lần kiểm tra → null (không phải 0)
--  * meta_au_over60_ratio: tỷ lệ trên số mẫu, chỉ khi mẫu ≥ 20
--  * bỏ số liệu TikTok khi product_keywords.sources_excluded có 'tiktok' (thuộc phiên bản khác)
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

-- Chấm điểm theo phiên bản; mỗi phiên bản đọc view riêng (criteria_versions.metrics_view)
create or replace function compute_scores(p_version text)
returns int language plpgsql set search_path = public as $$
declare
  vw text; prod record; c record; v numeric; ok boolean; s numeric;
  wsum numeric; wall numeric; tot numeric; failed text[]; unknown text[]; missing text[]; bd jsonb; n int := 0;
begin
  select metrics_view into vw from criteria_versions where version = p_version;
  if vw is null then raise exception 'Không có phiên bản tiêu chí %', p_version; end if;
  for prod in execute format('select product_id from %I', vw) loop
    failed := '{}'; unknown := '{}'; missing := '{}'; bd := '{}'::jsonb; wsum := 0; wall := 0; tot := 0;
    for c in select * from criteria where version = p_version and status <> 'retired' order by sort loop
      if c.kind in ('hard_filter', 'required') then
        execute format('select (%s)::boolean from %I where product_id = $1', c.expr, vw) into ok using prod.product_id;
        if c.kind = 'hard_filter' then
          if ok is false then failed := failed || c.key; elsif ok is null then unknown := unknown || c.key; end if;
        elsif ok is not true then
          missing := missing || c.key;
        end if;
        bd := bd || jsonb_build_object(c.key, jsonb_build_object('kind', c.kind, 'pass', ok));
      else
        execute format('select (%s)::numeric from %I where product_id = $1', c.expr, vw) into v using prod.product_id;
        wall := wall + c.weight;
        if v is null or c.good is null or c.bad is null or c.good = c.bad then
          s := null;
        else
          s := round(greatest(0, least(1, (v - c.bad) / (c.good - c.bad))) * 100, 1);
          wsum := wsum + c.weight; tot := tot + s * c.weight;
        end if;
        bd := bd || jsonb_build_object(c.key, jsonb_build_object('kind', 'score', 'value', v, 'score', s, 'weight', c.weight));
      end if;
    end loop;
    insert into scores (product_id, version, computed_on, passed_filters, failed_filters, total, completeness, breakdown,
                        readiness, missing_required, unknown_filters)
    values (prod.product_id, p_version, current_date, cardinality(failed) = 0, failed,
            case when wsum > 0 then round(tot / wsum, 1) end,
            case when wall > 0 then round(wsum / wall, 2) end, bd,
            case when cardinality(failed) > 0 then 'rot_loc_cung'
                 when cardinality(unknown) > 0 or cardinality(missing) > 0 then 'can_xac_minh'
                 else 'san_sang' end,
            missing, unknown)
    on conflict (product_id, version, computed_on) do update
      set passed_filters = excluded.passed_filters, failed_filters = excluded.failed_filters,
          total = excluded.total, completeness = excluded.completeness, breakdown = excluded.breakdown,
          readiness = excluded.readiness, missing_required = excluded.missing_required,
          unknown_filters = excluded.unknown_filters;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function compute_scores(text) from public, anon, authenticated;

-- Tổng quan theo phiên bản hiện hành (đọc số liệu v3), kèm mức sẵn sàng + xung đột quyết định
drop view if exists v_product_overview;
create view v_product_overview with (security_invoker = true) as
select m.*, s.version as score_version, s.total as score, s.completeness, s.passed_filters, s.failed_filters,
       s.readiness, s.missing_required, s.unknown_filters, s.computed_on as scored_on,
       d.verdict, d.headline, d.written_on as dossier_on,
       dc.exception_reason,
       (m.decision in ('chon_chinh','chon_phu','du_phong') and coalesce(s.readiness, 'can_xac_minh') <> 'san_sang'
        and dc.exception_reason is null) as decision_conflict
from v_product_metrics_v3 m
left join lateral (
  select sc.* from scores sc join criteria_versions cv on cv.version = sc.version and cv.is_current
  where sc.product_id = m.product_id order by sc.computed_on desc limit 1) s on true
left join lateral (select * from dossiers d where d.product_id = m.product_id order by version desc limit 1) d on true
left join lateral (select * from decisions x where x.product_id = m.product_id order by decided_on desc, id desc limit 1) dc on true;
