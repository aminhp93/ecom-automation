'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { Check, Eye, Info, ExternalLink } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onApproveProduct: (productId: string) => void;
  isApprovingId?: string;
  onGoToStage02?: (productId: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onSelectProduct,
  onApproveProduct,
  isApprovingId,
  onGoToStage02,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-800">Không tìm thấy sản phẩm nào</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Hãy bấm &quot;Run Discovery&quot; để tìm kiếm và chấm điểm các sản phẩm dropshipping tiềm năng.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-800">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
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
          <tbody className="divide-y divide-zinc-100">
            {products.map((p) => {
              const isApproved = p.status === 'approved_for_validation';

              return (
                <tr
                  key={p.id}
                  className="hover:bg-zinc-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectProduct(p)}
                >
                  {/* Product Info */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 truncate max-w-xs group-hover:text-black transition">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                          {p.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                        p.source === 'kalodata'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : p.source === 'tiktok'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : p.source === 'meta_ads'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {p.source === 'kalodata' ? 'Kalodata' : p.source.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Unit Economics */}
                  <td className="py-3 px-3 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-900 font-medium">
                        Bán: ${p.selling_price.toFixed(2)}
                      </span>
                      <div className="group relative inline-block">
                        <Info className="w-3 h-3 text-zinc-400 hover:text-zinc-700 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-64 p-2.5 bg-zinc-900 text-white text-[10px] rounded-md shadow-xl text-left font-sans">
                          <div className="font-semibold text-zinc-100 flex items-center justify-between pb-1 border-b border-zinc-800 mb-1.5">
                            <span>Chi tiết Unit Economics</span>
                            <span className="uppercase text-[9px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-300">{p.source}</span>
                          </div>
                          <div className="space-y-1 font-mono text-zinc-300">
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Supplier ({p.source}):</span>
                              <span>${p.supplier_price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Shipping (US line):</span>
                              <span>${p.shipping_cost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Gateway (2.9%+$0.3):</span>
                              <span>${p.payment_fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Hoàn hủy (3%):</span>
                              <span>${(p.selling_price * 0.03).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-800 font-semibold text-zinc-100">
                              <span>Landed Cost:</span>
                              <span>${p.landed_cost.toFixed(2)}</span>
                            </div>
                          </div>
                          {p.url && (
                            <div className="mt-2 pt-1.5 border-t border-zinc-800">
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Mở link gốc sản phẩm <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Cost: ${p.landed_cost.toFixed(2)}
                    </div>
                  </td>

                  {/* Gross Margin */}
                  <td className="py-3 px-3 font-mono">
                    <div className="text-zinc-900 font-semibold">
                      +${p.gross_margin.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.margin_percentage}%
                    </div>
                  </td>

                  {/* Multi-factor Score */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        {p.product_score}
                      </span>
                      <div className="text-[10px] text-zinc-400 space-y-0.5 font-mono">
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
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : p.recommendation === 'CONSIDER'
                          ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                      }`}
                    >
                      {p.recommendation}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-medium">
                        <Check className="w-2.5 h-2.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Chờ duyệt
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isApproved ? (
                        <button
                          onClick={() => onApproveProduct(p.id)}
                          disabled={isApprovingId === p.id}
                          className="px-2.5 py-1 rounded-md bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400 text-[11px] font-medium transition shadow-2xs"
                        >
                          Duyệt
                        </button>
                      ) : (
                        <button
                          onClick={() => onGoToStage02 && onGoToStage02(p.id)}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 text-white hover:bg-black text-[11px] font-medium transition flex items-center gap-1 shadow-2xs"
                          title="Chuyển sang Stage 02 Validation"
                        >
                          <span>Stage 02</span>
                          <span>→</span>
                        </button>
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
