'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { ExternalLink, Check, Eye, DollarSign, TrendingUp, Sparkles } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onApproveProduct: (productId: string) => void;
  isApprovingId?: string;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onSelectProduct,
  onApproveProduct,
  isApprovingId,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-[#0e1017] border border-[#1c202e] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Chưa có sản phẩm nào phù hợp</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Hãy bấm nút &quot;Run Product Discovery&quot; ở trên hoặc điều chỉnh bộ lọc để AI tìm kiếm và phân tích các ứng viên tiềm năng.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1017] border border-[#1c202e] rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#121520] border-b border-[#1c202e] text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3 px-4">Sản Phẩm</th>
              <th className="py-3 px-3">Nguồn</th>
              <th className="py-3 px-3">Unit Economics</th>
              <th className="py-3 px-3">Margin $ / %</th>
              <th className="py-3 px-3">Điểm Đánh Giá</th>
              <th className="py-3 px-3">Khuyến Nghị</th>
              <th className="py-3 px-3">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181c2b]">
            {products.map((p) => {
              const isApproved = p.status === 'approved_for_validation';
              const isHot = p.product_score >= 82;

              let sourceBadge = 'bg-slate-800 text-slate-300 border-slate-700';
              if (p.source === 'tiktok') {
                sourceBadge = 'bg-pink-950/40 text-pink-300 border-pink-500/30';
              } else if (p.source === 'meta_ads') {
                sourceBadge = 'bg-blue-950/40 text-blue-300 border-blue-500/30';
              } else if (p.source === 'amazon') {
                sourceBadge = 'bg-amber-950/40 text-amber-300 border-amber-500/30';
              } else if (p.source === 'aliexpress') {
                sourceBadge = 'bg-orange-950/40 text-orange-300 border-orange-500/30';
              }

              return (
                <tr
                  key={p.id}
                  className="hover:bg-[#131624] transition-colors group cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  {/* Product Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-[#23283d] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate max-w-xs group-hover:text-emerald-400 transition">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {p.category} • <span className="text-slate-400">{p.niche}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${sourceBadge}`}>
                      {p.source.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Unit Economics */}
                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-slate-200 font-medium">
                      Bán: <span className="text-emerald-400">${p.selling_price.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Landed: ${p.landed_cost.toFixed(2)}
                    </div>
                  </td>

                  {/* Gross Margin */}
                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-emerald-400 font-semibold">
                      +${p.gross_margin.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.margin_percentage}% margin
                    </div>
                  </td>

                  {/* Multi-factor Score */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-bold font-mono px-2 py-0.5 rounded border ${
                          isHot
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {p.product_score}
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>Cầu: {p.demand_score}</div>
                        <div>Ads: {p.creative_score}</div>
                      </div>
                    </div>
                  </td>

                  {/* Recommendation */}
                  <td className="py-3.5 px-3">
                    {p.recommendation === 'TEST' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        🔥 TEST
                      </span>
                    ) : p.recommendation === 'CONSIDER' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                        ⚠️ CONSIDER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                        ❌ KILL
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-cyan-400" /> Đã duyệt (Stg 02)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded-full border border-slate-700/50">
                        Chờ duyệt
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1.5 rounded-lg bg-[#181c2b] text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        title="Xem chi tiết phân tích"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isApproved ? (
                        <button
                          onClick={() => onApproveProduct(p.id)}
                          disabled={isApprovingId === p.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" />
                          <span>Duyệt</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-cyan-400 font-mono">
                          Ready for Stg 02
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
