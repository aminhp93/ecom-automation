'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { X, CheckCircle2, DollarSign, Target, Sparkles, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1018] border border-[#222738] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121420] border-b border-[#1f2436] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Product Intelligence Report
            </span>
            <span className="text-xs text-slate-400">ID: {product.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-xs">
          {/* Top Banner: Product Hero */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-32 h-32 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-[#23283d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {product.source}
                </span>
                <span className="text-[11px] text-slate-400">{product.category}</span>
              </div>

              <h2 className="text-base font-bold text-slate-100">{product.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#141724] p-3 rounded-lg border border-[#23283d]">
                <strong className="text-emerald-400">✨ Wow Factor (3s Hook):</strong> {product.wow_factor}
              </p>
            </div>
          </div>

          {/* Unit Economics Formula Breakdown */}
          <div className="bg-[#121522] border border-[#202538] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Unit Economics & Landed Cost Breakdown
              </h3>
              <div className="text-xs font-mono">
                Gross Contribution:{' '}
                <span className="text-emerald-400 font-bold text-sm">
                  +${product.gross_margin.toFixed(2)}
                </span>{' '}
                <span className="text-slate-400">({product.margin_percentage}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-center">
              <div className="bg-[#171b2b] p-2.5 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400 mb-1">Giá Bán Đề Xuất</div>
                <div className="text-sm font-bold text-slate-100">${product.selling_price.toFixed(2)}</div>
              </div>
              <div className="bg-[#171b2b] p-2.5 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400 mb-1">Giá Supplier</div>
                <div className="text-sm font-bold text-slate-300">${product.supplier_price.toFixed(2)}</div>
              </div>
              <div className="bg-[#171b2b] p-2.5 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400 mb-1">Vận Chuyển</div>
                <div className="text-sm font-bold text-slate-300">${product.shipping_cost.toFixed(2)}</div>
              </div>
              <div className="bg-[#171b2b] p-2.5 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400 mb-1">Phí Cổng (2.9%+.3)</div>
                <div className="text-sm font-bold text-slate-300">${product.payment_fee.toFixed(2)}</div>
              </div>
              <div className="bg-[#171b2b] p-2.5 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400 mb-1">Landed Cost</div>
                <div className="text-sm font-bold text-amber-400">${product.landed_cost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* 6-Factor AI Scoring Breakdown */}
          <div className="bg-[#121522] border border-[#202538] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                6-Factor Weighted Score (Tổng: {product.product_score}/100)
              </h3>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                  product.recommendation === 'TEST'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {product.recommendation}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">{product.recommendation_reason}</p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Demand (30%)</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">{product.demand_score}</div>
              </div>
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Comp (20%)</div>
                <div className="text-xs font-bold text-cyan-400 mt-1">{product.competition_score}</div>
              </div>
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Margin (15%)</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">{product.margin_score}</div>
              </div>
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Creative (15%)</div>
                <div className="text-xs font-bold text-purple-400 mt-1">{product.creative_score}</div>
              </div>
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Problem (10%)</div>
                <div className="text-xs font-bold text-amber-400 mt-1">{product.problem_score}</div>
              </div>
              <div className="bg-[#171b2b] p-2 rounded-lg border border-[#23293d]">
                <div className="text-[10px] text-slate-400">Ship (10%)</div>
                <div className="text-xs font-bold text-blue-400 mt-1">{product.shipping_score}</div>
              </div>
            </div>
          </div>

          {/* Marketing Angles & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#121522] border border-[#202538] rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                Target Audience & Nỗi Đau
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Chân dung:</strong> {product.target_audience}
              </p>
              <ul className="space-y-1 mt-2">
                {product.pain_points.map((pt, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#121522] border border-[#202538] rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Góc Quảng Cáo AI Phát Hiện (Angles)
              </h4>
              <ul className="space-y-2">
                {product.angles.map((angle, i) => (
                  <li
                    key={i}
                    className="p-2 rounded bg-[#171b2b] border border-[#23293d] text-[11px] text-slate-300"
                  >
                    {angle}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer: Human Approval Gate */}
        <div className="px-6 py-4 bg-[#121420] border-t border-[#1f2436] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Human-in-the-loop Approval Gate</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Đóng
            </button>

            {!isApproved ? (
              <button
                onClick={() => onApprove(product.id)}
                disabled={isApproving}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold flex items-center gap-2 hover:brightness-110 transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproving ? 'Đang duyệt...' : 'Phê Duyệt Cho Stage 02: Validation'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Đã Phê Duyệt Cho Stage 02</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
