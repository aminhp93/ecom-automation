-- Báo giá nhà cung cấp (chỉ thêm, không sửa). Mỗi dòng = một báo giá cho một size, một nước nhận.
create table if not exists supplier_quotes (
  id bigserial primary key,
  product_id bigint not null references products(id),
  quoted_on date not null,
  supplier text not null,            -- vd CJ Dropshipping
  item text,                         -- tên hàng trên trang nhà cung cấp
  size text,                         -- vd '36x60 inch'
  url text,
  currency text not null default 'USD',
  unit_price numeric,                -- giá hàng
  ship_to text,                      -- US | AU ...
  ship_fee numeric,
  total numeric,                     -- giá hàng + ship
  process_days text,                 -- vd '1-3'
  delivery_days text,                -- vd '7-11'
  note text,
  source text
);
alter table supplier_quotes enable row level security;
create policy supplier_quotes_read on supplier_quotes for select to anon, authenticated using (true);
