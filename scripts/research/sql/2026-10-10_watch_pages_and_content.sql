-- Theo dõi page đối thủ hằng ngày (bắt đầu Guard Blinds), thay file Google Sheet. Đã áp dụng 10/10/2026.
-- Số liệu theo ngày của page dùng bảng sẵn có: advertiser_snapshots (ads), competitor_social (follower, likes, tổng số bài).
-- Bảng mới: watched_pages, watch_content (+ lịch sử watch_content_snapshots), watch_winning_reels. RLS: chỉ đọc cho web.
create table if not exists watched_pages (page_id text primary key references advertisers(page_id), label text not null, active boolean not null default true, added_on date not null default current_date, note text);
create table if not exists watch_content (id bigserial primary key, page_id text not null references advertisers(page_id), channel text not null check (channel in ('facebook','instagram','tiktok')), kind text, ext_key text not null, posted_on date, title text, url text, ad_id text, duration_s numeric, views bigint, reactions bigint, comments bigint, first_seen_on date not null default current_date, last_checked_on date, note text, unique (page_id, ext_key));
create table if not exists watch_content_snapshots (content_id bigint not null references watch_content(id) on delete cascade, captured_on date not null, views bigint, reactions bigint, comments bigint, primary key (content_id, captured_on));
create table if not exists watch_winning_reels (id bigserial primary key, page_id text not null references advertisers(page_id), seq int not null, file text, reel_url text, views bigint, duration_s numeric, hook text, angle text, structure text, audio text, scenes int, timeline text, note text, unique (page_id, seq));
alter table watched_pages enable row level security; alter table watch_content enable row level security; alter table watch_content_snapshots enable row level security; alter table watch_winning_reels enable row level security;
create policy watched_pages_read on watched_pages for select to anon, authenticated using (true);
create policy watch_content_read on watch_content for select to anon, authenticated using (true);
create policy watch_content_snapshots_read on watch_content_snapshots for select to anon, authenticated using (true);
create policy watch_winning_reels_read on watch_winning_reels for select to anon, authenticated using (true);
