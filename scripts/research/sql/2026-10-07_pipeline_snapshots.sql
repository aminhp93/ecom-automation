-- Bản chụp độc lập của bảng tổng hợp (v_pipeline_sheet) mỗi lần fetch dữ liệu, để so sánh theo thời gian.
-- Luồng: fetch dữ liệu → pipeline_snapshot_take() tạo bản NHÁP → pipeline_diff(đang dùng, nháp) cho người dùng xem thay đổi
--        → người dùng duyệt → pipeline_snapshot_publish(id). Web /research/pipeline và Excel tuần chỉ đọc bản đã publish.
-- Không sửa, không xoá bản chụp; bản bị từ chối đặt status = 'rejected'. Tag (products.tag) không nằm trong bản chụp, web lấy trực tiếp.
create table if not exists pipeline_snapshots (
  id bigserial primary key,
  taken_at timestamptz not null default now(),
  taken_on date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected', 'superseded')),
  note text,
  row_count int not null default 0,
  sources jsonb not null default '{}'::jsonb,   -- ngày kéo mới nhất của từng nguồn tại thời điểm chụp
  published_at timestamptz,
  based_on bigint references pipeline_snapshots(id)  -- bản đang dùng lúc chụp
);
create table if not exists pipeline_snapshot_rows (
  snapshot_id bigint not null references pipeline_snapshots(id) on delete cascade,
  key text not null,            -- loai_dong:ref
  row jsonb not null,
  primary key (snapshot_id, key)
);
alter table pipeline_snapshots enable row level security;
alter table pipeline_snapshot_rows enable row level security;
drop policy if exists pipeline_snapshots_read on pipeline_snapshots;
drop policy if exists pipeline_snapshot_rows_read on pipeline_snapshot_rows;
create policy pipeline_snapshots_read on pipeline_snapshots for select to anon, authenticated using (true);
create policy pipeline_snapshot_rows_read on pipeline_snapshot_rows for select to anon, authenticated using (true);

create or replace function pipeline_snapshot_take(p_note text default null)
returns bigint language plpgsql set search_path = public as $$
declare sid bigint; n int; prev bigint;
begin
  select id into prev from pipeline_snapshots where status = 'published' order by id desc limit 1;
  insert into pipeline_snapshots (note, sources, based_on) values (p_note, jsonb_build_object(
    'amazon',       jsonb_build_object('captured_on', (select max(captured_on) from amazon_keyword_snapshots), 'data_month', (select max(data_month) from amazon_keyword_snapshots)),
    'trends',       jsonb_build_object('captured_on', (select max(captured_on) from trend_snapshots)),
    'tiktok',       jsonb_build_object('captured_on', (select max(captured_on) from tiktok_snapshots)),
    'meta_keyword', jsonb_build_object('captured_on', (select max(captured_on) from meta_keyword_snapshots where country = 'ALL'), 'country', 'ALL'),
    'meta_au',      jsonb_build_object('captured_on', (select max(captured_on) from meta_keyword_snapshots where country = 'AU')),
    'meta_us',      jsonb_build_object('captured_on', (select max(captured_on) from meta_keyword_snapshots where country = 'US')),
    'meta_pages',   jsonb_build_object('captured_on', (select max(captured_on) from advertiser_snapshots)),
    'discover',     jsonb_build_object('captured_on', (select max(run_on) from discovery_runs))
  ), prev) returning id into sid;
  insert into pipeline_snapshot_rows (snapshot_id, key, row)
    select sid, v.loai_dong || ':' || v.ref, to_jsonb(v) from v_pipeline_sheet v;
  get diagnostics n = row_count;
  update pipeline_snapshots set row_count = n where id = sid;
  return sid;
end $$;

create or replace function pipeline_snapshot_publish(p_id bigint)
returns void language sql set search_path = public as $$
  update pipeline_snapshots set status = 'published', published_at = now() where id = p_id and status = 'draft';
  -- bản nháp cũ hơn mà chưa duyệt coi như đã được bản mới thay (vẫn giữ để xem)
  update pipeline_snapshots set status = 'superseded' where status = 'draft' and id < p_id
    and exists (select 1 from pipeline_snapshots where id = p_id and status = 'published');
$$;

-- Thay đổi từ bản a sang bản b: them / bo / doi (kèm {cột: {old, new}}). Bỏ qua tag, điểm, số ô trống.
create or replace function pipeline_diff(a bigint, b bigint)
returns table(key text, name text, change text, changes jsonb) language sql stable set search_path = public as $$
  with x as (select * from pipeline_snapshot_rows where snapshot_id = a),
       y as (select * from pipeline_snapshot_rows where snapshot_id = b),
       j as (
         select coalesce(x.key, y.key) as key,
                coalesce(y.row->>'name_vi', x.row->>'name_vi') as name,
                case when x.key is null then 'them' when y.key is null then 'bo' else 'doi' end as change,
                case when x.key is not null and y.key is not null then (
                  select jsonb_object_agg(k, jsonb_build_object('old', x.row->k, 'new', y.row->k))
                  from jsonb_object_keys(y.row) k
                  where k not in ('nhom', 'n_empty', 'meta_pages_json', 'score') and (x.row->k) is distinct from (y.row->k)) end as changes
         from x full join y on x.key = y.key)
  select key, name, change, changes from j where change <> 'doi' or changes is not null;
$$;

revoke execute on function pipeline_snapshot_take(text) from public, anon, authenticated;
revoke execute on function pipeline_snapshot_publish(bigint) from public, anon, authenticated;
