-- "Chưa rõ" (diem_chua_ro) đếm đủ hơn (09/10/2026). Điểm tiềm năng (diem_tiem_nang) KHÔNG đổi.
-- Trước: chỉ đếm 9 tiêu chí chấm điểm, và Trends chỉ tính là chưa rõ khi thiếu CẢ hai chỉ số.
-- Sau: Trends thiếu MỘT trong hai chỉ số (mùa vụ, tăng trưởng) cũng tính là chưa rõ; thêm 3 lọc cứng chưa có dữ liệu
--      (weight_class, hazmat, policy_risk): lọc cứng thiếu vẫn được coi là "qua lọc" để chấm điểm, nên phải báo là chưa rõ.
-- Vá định nghĩa hiện tại của v_pipeline_sheet (view bọc ngoài); chạy lại nhiều lần an toàn.
do $$
declare
  d text := pg_get_viewdef('v_pipeline_sheet'::regclass, true);
  old text := '(x.trend_season IS NULL AND x.trend_growth IS NULL)::integer';
begin
  if position('x.weight_class IS NULL' in d) > 0 then raise notice 'đã vá, bỏ qua'; return; end if;
  if position(old in d) = 0 then raise exception 'Không tìm thấy biểu thức chưa rõ, giữ nguyên'; end if;
  d := replace(d, old, '(x.trend_season IS NULL OR x.trend_growth IS NULL)::integer + (x.weight_class IS NULL)::integer + (x.hazmat IS NULL)::integer + (x.policy_risk IS NULL)::integer');
  execute 'create or replace view v_pipeline_sheet with (security_invoker = true) as ' || rtrim(d, ';');
end $$;
