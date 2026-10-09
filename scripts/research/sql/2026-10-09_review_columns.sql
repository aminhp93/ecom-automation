-- Đánh dấu "đã xem" tách khỏi tag (09/10/2026, theo yêu cầu của người dùng).
-- Tag (theo_doi | loai) là kết luận; reviewed_on là việc đã làm: xem xong chưa chắc đã quyết.
-- Chưa đưa vào view v_pipeline_sheet và web; hiện chỉ đọc/ghi trực tiếp trên bảng.
alter table products add column if not exists reviewed_on date, add column if not exists review_note text;
alter table discovery_candidates add column if not exists reviewed_on date, add column if not exists review_note text;
comment on column products.reviewed_on is 'Ngày người dùng đã xem sản phẩm này (khác tag: xem xong chưa chắc đã quyết)';
comment on column products.review_note is 'Kết luận 1 dòng khi xem, vd "ad AU yếu, còn cân nhắc"';
comment on column discovery_candidates.reviewed_on is 'Ngày người dùng đã xem ứng viên này (khác tag)';
comment on column discovery_candidates.review_note is 'Kết luận 1 dòng khi xem';

-- Ví dụ: xem xong, chưa tag
--   update products set reviewed_on = (now() at time zone 'Asia/Ho_Chi_Minh')::date, review_note = 'ad AU yếu, còn cân nhắc' where slug = '...';  -- dùng giờ VN, không dùng current_date (UTC)
--   update discovery_candidates set reviewed_on = current_date, review_note = '...' where id = 12;
-- Khi tag, ghi luôn reviewed_on cùng ngày:
--   update products set tag = 'loai', tagged_on = current_date, reviewed_on = current_date where slug = '...';
-- Đếm hôm nay:
--   select (select count(*) from products where reviewed_on = current_date)
--        + (select count(*) from discovery_candidates where reviewed_on = current_date) as da_xem_hom_nay;
