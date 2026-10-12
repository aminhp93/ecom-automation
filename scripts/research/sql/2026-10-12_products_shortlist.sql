-- Đánh dấu sản phẩm tiềm năng nhất trong nhóm Theo dõi (do người dùng chọn). Web: ★ cạnh tên + nền vàng nhạt + xếp lên đầu.
alter table products add column if not exists shortlist boolean not null default false;
