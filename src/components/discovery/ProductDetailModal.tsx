'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { X, CheckCircle2, ArrowRight, ExternalLink, Info } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onApprove: (productId: string) => void;
  isApproving: boolean;
  onGoToStage02?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onApprove,
  isApproving,
  onGoToStage02,
}) => {
  if (!product) return null;

  const isApproved = product.status === 'approved_for_validation';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-zinc-900">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-white text-zinc-700 border border-zinc-200 shadow-2xs">
              Analysis Report
            </span>
            <span className="text-xs text-zinc-400 font-mono">{product.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-zinc-700 text-xs">
          {/* Top Banner: Product Hero */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {product.source}
                </span>
                <span className="text-[11px] text-zinc-500">{product.category}</span>
              </div>

              <h2 className="text-sm font-semibold text-zinc-900">{product.name}</h2>
              {product.url && (
                <div>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    <span>Mở trang sản phẩm / Nguồn tham khảo</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
              <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50 p-2.5 rounded-md border border-zinc-200">
                <strong className="text-zinc-900">Wow Factor:</strong> {product.wow_factor}
              </p>
            </div>
          </div>

          {/* Unit Economics Formula Breakdown */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Unit Economics & Landed Cost
              </h3>
              <div className="text-xs font-mono">
                Margin:{' '}
                <span className="text-zinc-900 font-bold">
                  +${product.gross_margin.toFixed(2)}
                </span>{' '}
                <span className="text-zinc-500">({product.margin_percentage}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono text-center">
              {/* Selling Price */}
              <div className="group relative bg-white p-2 rounded border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-colors">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <span>Giá Bán</span>
                  <Info className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-600 cursor-help" />
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-0.5">${product.selling_price.toFixed(2)}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-lg text-left font-sans pointer-events-none">
                  <div className="font-semibold text-zinc-100 mb-0.5">Giá Bán Đề Xuất (DTC)</div>
                  <div className="text-zinc-300 leading-relaxed">Áp dụng markup chuẩn 3.4x so với Landed Cost, làm tròn đuôi .99 tâm lý học thương mại điện tử.</div>
                </div>
              </div>

              {/* Supplier Cost */}
              <div className="group relative bg-white p-2 rounded border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-colors">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <span>Supplier</span>
                  <Info className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-600 cursor-help" />
                </div>
                <div className="text-xs text-zinc-700 mt-0.5">${product.supplier_price.toFixed(2)}</div>
                {/* Tooltip / Popover with link */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-56 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-lg text-left font-sans">
                  <div className="font-semibold text-zinc-100 flex items-center justify-between mb-0.5">
                    <span>Nguồn Cung Ứng</span>
                    <span className="uppercase text-[9px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-300">{product.source}</span>
                  </div>
                  <div className="text-zinc-300 leading-relaxed mb-1.5">
                    Giá nhập sỉ từ xưởng / nhà cung cấp verified ({product.source.toUpperCase()}).
                  </div>
                  {product.url && (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium underline"
                    >
                      Kiểm chứng link gốc <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Shipping Cost */}
              <div className="group relative bg-white p-2 rounded border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-colors">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <span>Ship</span>
                  <Info className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-600 cursor-help" />
                </div>
                <div className="text-xs text-zinc-700 mt-0.5">${product.shipping_cost.toFixed(2)}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-52 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-lg text-left font-sans pointer-events-none">
                  <div className="font-semibold text-zinc-100 mb-0.5">Cước Vận Chuyển Quốc Tế</div>
                  <div className="text-zinc-300 leading-relaxed">
                    Báo giá đường bay chuẩn tuyến US (YunExpress / 4PX / ePacket 7-12 ngày) cho kiện hàng dưới 250g.
                  </div>
                </div>
              </div>

              {/* Payment Gateway */}
              <div className="group relative bg-white p-2 rounded border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-colors">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <span>Gateway</span>
                  <Info className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-600 cursor-help" />
                </div>
                <div className="text-xs text-zinc-700 mt-0.5">${product.payment_fee.toFixed(2)}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-56 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-lg text-left font-sans pointer-events-none">
                  <div className="font-semibold text-zinc-100 mb-0.5">Phí Cổng Thanh Toán</div>
                  <div className="text-zinc-300 leading-relaxed font-mono">
                    Stripe / Shopify Payments:<br />
                    2.9% × ${product.selling_price.toFixed(2)} + $0.30 = ${(product.selling_price * 0.029 + 0.30).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Landed Cost */}
              <div className="group relative bg-white p-2 rounded border border-zinc-200 shadow-2xs hover:border-zinc-400 transition-colors">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <span>Landed</span>
                  <Info className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-600 cursor-help" />
                </div>
                <div className="text-xs font-semibold text-zinc-800 mt-0.5">${product.landed_cost.toFixed(2)}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-50 w-60 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-lg text-left font-sans pointer-events-none">
                  <div className="font-semibold text-zinc-100 mb-0.5">Tổng Giá Vốn Đến Tay Khách</div>
                  <div className="text-zinc-300 leading-relaxed font-mono">
                    Supplier (${product.supplier_price.toFixed(2)}) + Ship (${product.shipping_cost.toFixed(2)}) + Gateway (${product.payment_fee.toFixed(2)}) + Hoàn/Hủy 3% (${(product.selling_price * 0.03).toFixed(2)}) = ${product.landed_cost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6-Factor AI Scoring Breakdown */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                6-Factor Score ({product.product_score}/100)
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-white font-medium">
                {product.recommendation}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600">{product.recommendation_reason}</p>

            <div className="grid grid-cols-6 gap-1.5 text-center font-mono">
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Demand</div>
                <div className="text-xs font-medium text-zinc-800">{product.demand_score}</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Comp</div>
                <div className="text-xs font-medium text-zinc-800">{product.competition_score}</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Margin</div>
                <div className="text-xs font-medium text-zinc-800">{product.margin_score}</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Creative</div>
                <div className="text-xs font-medium text-zinc-800">{product.creative_score}</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Problem</div>
                <div className="text-xs font-medium text-zinc-800">{product.problem_score}</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-2xs">
                <div className="text-[9px] text-zinc-400">Ship</div>
                <div className="text-xs font-medium text-zinc-800">{product.shipping_score}</div>
              </div>
            </div>
          </div>

          {/* Marketing Angles & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5">
              <h4 className="font-semibold text-zinc-900 text-xs">
                Audience & Pain Points
              </h4>
              <p className="text-[11px] text-zinc-600">
                {product.target_audience}
              </p>
              <ul className="space-y-1 mt-1.5">
                {product.pain_points.map((pt, i) => (
                  <li key={i} className="text-[11px] text-zinc-700 flex items-start gap-1.5">
                    <span className="text-zinc-400 shrink-0">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5">
              <h4 className="font-semibold text-zinc-900 text-xs">
                Góc bán (lý do mua)
              </h4>
              {product.marketing_angles && product.marketing_angles.length > 0 ? (
                <ul className="space-y-1.5">
                  {product.marketing_angles.map((a) => (
                    <li
                      key={a.id}
                      className="p-2 rounded bg-white border border-zinc-200 text-[11px] shadow-2xs space-y-0.5"
                    >
                      <div className="font-semibold text-zinc-900">{a.name}</div>
                      <div className="text-zinc-600">
                        Tệp: {a.sub_audience}
                      </div>
                      <div className="text-zinc-500">
                        Cảm xúc: {a.core_emotion} · {a.hooks.length} hook
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1.5">
                  {product.angles.map((angle, i) => (
                    <li
                      key={i}
                      className="p-1.5 rounded bg-white border border-zinc-200 text-[11px] text-zinc-700 shadow-2xs"
                    >
                      {angle}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: Human Approval Gate */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Human Approval Gate
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition"
            >
              Đóng
            </button>

            {!isApproved ? (
              <button
                onClick={() => onApprove(product.id)}
                disabled={isApproving}
                className="px-3.5 py-1.5 rounded-md bg-black text-white font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-800 transition active:bg-zinc-900 shadow-2xs"
              >
                <span>{isApproving ? 'Đang duyệt...' : 'Phê Duyệt Cho Stage 02'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1.5 rounded-md bg-zinc-100 text-zinc-800 flex items-center gap-1.5 font-mono text-xs font-medium border border-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Đã Duyệt</span>
                </div>
                {onGoToStage02 && (
                  <button
                    onClick={() => onGoToStage02(product.id)}
                    className="px-3.5 py-1.5 rounded-md bg-black text-white font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-800 transition shadow-2xs"
                  >
                    <span>Đi Tới Stage 02 (Validation)</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
