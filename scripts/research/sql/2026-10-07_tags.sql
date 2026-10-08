-- Tag do người dùng đặt cho bảng tổng hợp (/market-research/pipeline). Chỉ ghi khi người dùng bảo (qua Claude), không tự đặt.
alter table products add column if not exists tag text check (tag in ('theo_doi','loai')), add column if not exists tagged_on date;
alter table discovery_candidates add column if not exists tag text check (tag in ('theo_doi','loai')), add column if not exists tagged_on date;
-- Ví dụ: update products set tag = 'theo_doi', tagged_on = current_date where slug = 'ergonomic-seat-cushion';
--        update discovery_candidates set tag = 'loai', tagged_on = current_date where id = 12;
--        update products set tag = null, tagged_on = null where slug = '...';   -- bỏ tag
