-- Ứng viên (discovery_candidates) chưa thành sản phẩm vẫn cần ghi social đối thủ.
-- Web ghép social theo page_id Meta nên không cần product_id. Đã áp dụng 10/10/2026.
alter table competitor_social alter column product_id drop not null;
