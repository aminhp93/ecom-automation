'use client';

import React, { useState } from 'react';
import { X, Plus, Loader2, DollarSign, Sparkles } from 'lucide-react';
import { Product } from '@/lib/db/store';

interface AddCustomProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: Product) => void;
}

export const AddCustomProductModal: React.FC<AddCustomProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('Baby Products');
  const [supplierPrice, setSupplierPrice] = useState('4.50');
  const [sellingPrice, setSellingPrice] = useState('29.99');
  const [shippingCost, setShippingCost] = useState('2.80');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          niche: niche.trim(),
          supplier_price: parseFloat(supplierPrice) || 4.5,
          selling_price: parseFloat(sellingPrice) || 29.99,
          shipping_cost: parseFloat(shippingCost) || 2.8,
          image_url: imageUrl.trim() || undefined,
          raw_description: description.trim(),
          auto_approve: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        onProductCreated(data.product);
        onClose();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo sản phẩm');
      }
    } catch (err) {
      console.error('Error creating custom product:', err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-black text-white flex items-center justify-center font-bold text-xs">
              +
            </span>
            <span className="font-semibold text-xs text-zinc-900">
              Nhập Sản Phẩm Riêng Của Bạn Để Test Toàn Bộ Pipeline
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 font-medium mb-1">
              Tên sản phẩm của bạn <span className="text-black">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Silicone Freeze Teething Mitt, Ultrasonic Pet Brush..."
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-medium mb-1">
                Niche / Ngành hàng
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ví dụ: Baby Care, Pet Tech..."
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-medium mb-1">
                Link ảnh sản phẩm (tùy chọn)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash..."
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Unit Economics Inputs */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
            <span className="font-semibold text-zinc-800 text-[11px] block">
              Thông số tài chính dự kiến:
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] text-zinc-500 font-mono mb-0.5">
                  Giá Supplier ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={supplierPrice}
                  onChange={(e) => setSupplierPrice(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-zinc-200 rounded text-zinc-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-mono mb-0.5">
                  Ship dự kiến ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-zinc-200 rounded text-zinc-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-mono mb-0.5">
                  Giá bán kỳ vọng ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-zinc-200 rounded text-zinc-900 font-mono focus:outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-medium mb-1">
              Ghi chú tính năng hoặc nỗi đau giải quyết (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Đồ gậm nướu có dây đeo cổ tay không bao giờ bị rơi bẩn, có lõi giữ lạnh 15 phút..."
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-zinc-500" /> Tự động tính toán & duyệt
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 transition"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-zinc-800 transition font-medium flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Sản Phẩm & Test Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
