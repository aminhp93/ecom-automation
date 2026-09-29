-- Đối thủ là brand local hay dropship? (tiêu chí anh Thanh: thời gian ship; + các dấu hiệu khác)
-- Mỗi lần kiểm tra = 1 dòng (chỉ thêm).
create table if not exists advertiser_business_checks (
  id bigint generated always as identity primary key,
  page_id text not null references advertisers(page_id),
  checked_on date not null,
  model text not null check (model in (
    'global_dtc',          -- brand DTC toàn cầu, làm theo đơn ở nước ngoài, ship quốc tế (vd Guard)
    'dropship',            -- ship thẳng từ nhà cung cấp (thường Trung Quốc), không kho riêng
    'local_brand',         -- brand Úc (pháp nhân/tên miền .au) nhưng chưa rõ sản xuất ở đâu
    'local_manufacturer',  -- tự sản xuất ở Úc
    'local_stockist',      -- nhập hàng về kho ở Úc rồi bán
    'local_retailer',      -- chuỗi/nhà bán lẻ Úc
    'local_service',       -- đo & lắp tận nhà
    'marketplace',
    'advertorial'          -- page review/advertorial của brand khác
  )),
  parent_page_id text references advertisers(page_id), -- advertorial → brand
  confidence text not null default 'trung_binh' check (confidence in ('cao','trung_binh','thap')),
  shipping_time text,        -- tổng thời gian khách chờ (SX + ship)
  ships_from text,
  entity text,               -- pháp nhân / địa chỉ đăng ký
  signals jsonb,             -- [{signal, value, points_to: 'local'|'dropship'|'global'}]
  can_copy boolean,          -- mình (dropship) làm được mô hình này không
  note text,
  sources text[],
  unique (page_id, checked_on)
);
alter table advertiser_business_checks enable row level security;
drop policy if exists "public read" on advertiser_business_checks;
create policy "public read" on advertiser_business_checks for select to anon, authenticated using (true);
