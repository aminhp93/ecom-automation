-- Bảng tổng hợp: web mặc định đọc bản chụp MỚI NHẤT; chỉ giữ 10 bản mới nhất (09/10/2026, theo yêu cầu của người dùng).
-- pipeline_snapshot_take() tự gọi pipeline_snapshot_prune(10) sau mỗi lần chụp; based_on của bản trước đó trỏ vào bản bị xoá thì đặt null.
-- Đã chạy 09/10: xoá 9 bản (#1, #3–#10), giữ #11–#20. Bản sao lưu 9 bản bị xoá (1.176 dòng) nằm trong thư mục tool-results của session Claude (~/.claude/projects/-Users-aminhp93-working-dropship/.../tool-results/mcp-b921babe-...-execute_sql-1791512870839.txt).
create or replace function public.pipeline_snapshot_prune(p_keep int default 10)
returns int language plpgsql set search_path to 'public' as $fn$
declare n int;
begin
  update pipeline_snapshots set based_on = null
    where based_on in (select id from pipeline_snapshots order by id desc offset p_keep);
  delete from pipeline_snapshots
    where id in (select id from pipeline_snapshots order by id desc offset p_keep);
  get diagnostics n = row_count;
  return n;
end $fn$;

-- pipeline_snapshot_take: giữ nguyên thân hàm cũ (xem 2026-10-07_pipeline_snapshots.sql), chỉ đổi 2 chỗ:
--   1) prev = bản mới nhất bất kể trạng thái (trước là bản published)
--   2) trước `return sid` gọi: perform pipeline_snapshot_prune(10);
-- Định nghĩa đầy đủ đang chạy: select pg_get_functiondef('pipeline_snapshot_take(text)'::regprocedure);

comment on table public.pipeline_snapshots is 'Mỗi lần fetch dữ liệu = một bản chụp độc lập của bảng tổng hợp (v_pipeline_sheet). Web mặc định đọc bản mới nhất. Chỉ giữ 10 bản mới nhất: pipeline_snapshot_take() tự gọi pipeline_snapshot_prune(10).';
