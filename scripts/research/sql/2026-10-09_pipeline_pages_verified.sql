-- Cột Meta pages theo mức xác minh (09/10/2026).
-- Trước: mọi page trong product_advertisers đều hiện, xếp theo số ad đang chạy (vd blackout-curtains đặt Temu NZ, đã xác nhận "no", lên đầu).
-- Sau: (1) bỏ page matches_product = 'no'; (2) page 'yes' (đã đọc ad/website, đúng sản phẩm) xếp trước, rồi tới 'unverified', mỗi nhóm theo số ad đang chạy;
--      (3) meta_pages_json có thêm khoá 'm' = 'yes' | 'unverified' để web đánh dấu ✓.
-- Cách làm: vá định nghĩa hiện tại của v_pipeline_sheet_base (chỉ đổi CTE pg), cột view giữ nguyên nên v_pipeline_sheet (bọc ngoài) không phải tạo lại.
-- Chạy lại nhiều lần an toàn (nếu đã vá thì dừng, không đổi gì).
do $$
declare
  d text := pg_get_viewdef('v_pipeline_sheet_base'::regclass, true);
begin
  if position('''m'', x.m' in d) > 0 then
    raise notice 'v_pipeline_sheet_base đã được vá, bỏ qua';
    return;
  end if;
  -- xếp page đã xác nhận lên trước (cả bản text và bản json)
  d := replace(d, 'ORDER BY s.active_all DESC NULLS LAST', 'ORDER BY (x.m = ''yes'') DESC, s.active_all DESC NULLS LAST');
  -- thêm cờ xác minh vào json
  d := replace(d, '''y'', a.page_created)', '''y'', a.page_created, ''m'', x.m)');
  -- subquery x: lấy thêm matches_product, bỏ 'no', khi trùng page thì ưu tiên yes > unverified
  d := regexp_replace(d, 'product_advertisers\.page_id\s+FROM product_advertisers', 'product_advertisers.page_id, product_advertisers.matches_product AS m FROM product_advertisers WHERE coalesce(product_advertisers.matches_product, ''unverified'') <> ''no''');
  d := regexp_replace(d, 'ORDER BY product_advertisers\.product_id, product_advertisers\.page_id\) x', 'ORDER BY product_advertisers.product_id, product_advertisers.page_id, (product_advertisers.matches_product = ''yes'') DESC) x');
  if position('WHERE coalesce(product_advertisers.matches_product' in d) = 0 or position('''m'', x.m' in d) = 0 or position('(x.m = ''yes'') DESC' in d) = 0 then
    raise exception 'Không vá được định nghĩa view, giữ nguyên';
  end if;
  execute 'create or replace view v_pipeline_sheet_base with (security_invoker = true) as ' || rtrim(d, ';');
end $$;
