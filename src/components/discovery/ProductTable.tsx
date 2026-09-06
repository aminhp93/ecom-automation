'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { Check, Eye } from 'lucide-react';

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
      <div className="bg-[#121215] border border-[#27272a] rounded-lg p-10 text-center">
        <h3 className="text-xs font-medium text-zinc-300">Không tìm thấy sản phẩm nào</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Hãy bấm &quot;Run Discovery&quot; để tìm kiếm và chấm điểm các sản phẩm dropshipping tiềm năng.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#18181b] border-b border-[#27272a] text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
            <tr>
              <th className="py-2.5 px-3.5">Sản Phẩm</th>
              <th className="py-2.5 px-3">Nguồn</th>
              <th className="py-2.5 px-3">Economics</th>
              <th className="py-2.5 px-3">Margin</th>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3">Đánh Giá</th>
              <th className="py-2.5 px-3">Trạng Thái</th>
              <th className="py-2.5 px-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232328]">
            {products.map((p) => {
              const isApproved = p.status === 'approved_for_validation';

              return (
                <tr
                  key={p.id}
                  className="hover:bg-[#18181d] transition-colors group cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  {/* Product Info */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-100 truncate max-w-xs group-hover:text-white transition">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                          {p.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                      {p.source.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Unit Economics */}
                  <td className="py-3 px-3 font-mono">
                    <div className="text-zinc-200">
                      Bán: ${p.selling_price.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Cost: ${p.landed_cost.toFixed(2)}
                    </div>
                  </td>

                  {/* Gross Margin */}
                  <td className="py-3 px-3 font-mono">
                    <div className="text-zinc-100 font-medium">
                      +${p.gross_margin.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.margin_percentage}%
                    </div>
                  </td>

                  {/* Multi-factor Score */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-zinc-100 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                        {p.product_score}
                      </span>
                      <div className="text-[10px] text-zinc-500 space-y-0.5">
                        <div>D:{p.demand_score}</div>
                        <div>C:{p.creative_score}</div>
                      </div>
                    </div>
                  </td>

                  {/* Recommendation */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                        p.recommendation === 'TEST'
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                          : p.recommendation === 'CONSIDER'
                          ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          : 'bg-zinc-950 text-zinc-600 border-zinc-900'
                      }`}
                    >
                      {p.recommendation}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                        <Check className="w-2.5 h-2.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Chờ duyệt
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isApproved ? (
                        <button
                          onClick={() => onApproveProduct(p.id)}
                          disabled={isApprovingId === p.id}
                          className="px-2 py-0.5 rounded-md bg-white text-black hover:bg-zinc-200 text-[11px] font-medium transition"
                        >
                          Duyệt
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Ready Stg 02
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
