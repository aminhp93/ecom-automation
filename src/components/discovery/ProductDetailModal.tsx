'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onApprove: (productId: string) => void;
  isApproving: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onApprove,
  isApproving,
}) => {
  if (!product) return null;

  const isApproved = product.status === 'approved_for_validation';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0f0f12] border border-[#27272a] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#141418] border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Analysis Report
            </span>
            <span className="text-xs text-zinc-500 font-mono">{product.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-zinc-300 text-xs">
          {/* Top Banner: Product Hero */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {product.source}
                </span>
                <span className="text-[11px] text-zinc-500">{product.category}</span>
              </div>

              <h2 className="text-sm font-semibold text-zinc-100">{product.name}</h2>
              <p className="text-xs text-zinc-300 leading-relaxed bg-[#18181b] p-2.5 rounded-md border border-[#27272a]">
                <strong className="text-zinc-100">Wow Factor:</strong> {product.wow_factor}
              </p>
            </div>
          </div>

          {/* Unit Economics Formula Breakdown */}
          <div className="bg-[#141418] border border-[#27272a] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Unit Economics & Landed Cost
              </h3>
              <div className="text-xs font-mono">
                Margin:{' '}
                <span className="text-white font-semibold">
                  +${product.gross_margin.toFixed(2)}
                </span>{' '}
                <span className="text-zinc-500">({product.margin_percentage}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono text-center">
              <div className="bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="text-[10px] text-zinc-500">Giá Bán</div>
                <div className="text-xs font-semibold text-zinc-100 mt-0.5">${product.selling_price.toFixed(2)}</div>
              </div>
              <div className="bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="text-[10px] text-zinc-500">Supplier</div>
                <div className="text-xs text-zinc-300 mt-0.5">${product.supplier_price.toFixed(2)}</div>
              </div>
              <div className="bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="text-[10px] text-zinc-500">Ship</div>
                <div className="text-xs text-zinc-300 mt-0.5">${product.shipping_cost.toFixed(2)}</div>
              </div>
              <div className="bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="text-[10px] text-zinc-500">Gateway</div>
                <div className="text-xs text-zinc-300 mt-0.5">${product.payment_fee.toFixed(2)}</div>
              </div>
              <div className="bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="text-[10px] text-zinc-500">Landed</div>
                <div className="text-xs font-semibold text-zinc-200 mt-0.5">${product.landed_cost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* 6-Factor AI Scoring Breakdown */}
          <div className="bg-[#141418] border border-[#27272a] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                6-Factor Score ({product.product_score}/100)
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                {product.recommendation}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">{product.recommendation_reason}</p>

            <div className="grid grid-cols-6 gap-1.5 text-center font-mono">
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Demand</div>
                <div className="text-xs font-medium text-zinc-200">{product.demand_score}</div>
              </div>
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Comp</div>
                <div className="text-xs font-medium text-zinc-200">{product.competition_score}</div>
              </div>
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Margin</div>
                <div className="text-xs font-medium text-zinc-200">{product.margin_score}</div>
              </div>
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Creative</div>
                <div className="text-xs font-medium text-zinc-200">{product.creative_score}</div>
              </div>
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Problem</div>
                <div className="text-xs font-medium text-zinc-200">{product.problem_score}</div>
              </div>
              <div className="bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                <div className="text-[9px] text-zinc-500">Ship</div>
                <div className="text-xs font-medium text-zinc-200">{product.shipping_score}</div>
              </div>
            </div>
          </div>

          {/* Marketing Angles & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#141418] border border-[#27272a] rounded-lg p-3 space-y-1.5">
              <h4 className="font-semibold text-zinc-200 text-xs">
                Audience & Pain Points
              </h4>
              <p className="text-[11px] text-zinc-400">
                {product.target_audience}
              </p>
              <ul className="space-y-1 mt-1.5">
                {product.pain_points.map((pt, i) => (
                  <li key={i} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                    <span className="text-zinc-500 shrink-0">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#141418] border border-[#27272a] rounded-lg p-3 space-y-1.5">
              <h4 className="font-semibold text-zinc-200 text-xs">
                Creative Angles
              </h4>
              <ul className="space-y-1.5">
                {product.angles.map((angle, i) => (
                  <li
                    key={i}
                    className="p-1.5 rounded bg-[#18181b] border border-[#27272a] text-[11px] text-zinc-300"
                  >
                    {angle}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer: Human Approval Gate */}
        <div className="px-5 py-3 bg-[#141418] border-t border-[#27272a] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Human Approval Gate
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Đóng
            </button>

            {!isApproved ? (
              <button
                onClick={() => onApprove(product.id)}
                disabled={isApproving}
                className="px-3.5 py-1.5 rounded-md bg-white text-black font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition active:bg-zinc-300"
              >
                <span>{isApproving ? 'Đang duyệt...' : 'Phê Duyệt Cho Stage 02'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
