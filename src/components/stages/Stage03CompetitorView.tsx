'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { Play, Loader2, ArrowRight, Target, ExternalLink } from 'lucide-react';

interface Stage03CompetitorViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onProceedToNext: () => void;
}

export const Stage03CompetitorView: React.FC<Stage03CompetitorViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onProceedToNext,
}) => {
  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">Chưa chọn sản phẩm để phân tích đối thủ</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để tiến hành phân tích đối thủ.
        </p>
      </div>
    );
  }

  const comp = product.competitor_analysis;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 03
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Competitor Matrix & Outpositioning
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm:{' '}
            <strong className="text-zinc-900">{product.name}</strong> (Giá bán kỳ vọng: ${product.selling_price})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition ${
              isRunning
                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang quét đối thủ...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>{comp ? 'Quét Lại Đối Thủ' : 'Quét & Lập Ma Trận'}</span>
              </>
            )}
          </button>

          {comp && (
            <button
              onClick={onProceedToNext}
              className="px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-900 font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-zinc-200"
            >
              <span>Tiếp Tục Stage 04</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {!comp ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Target className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">Bóc tách 3 đối thủ hàng đầu trên thị trường</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            AI sẽ truy quét các đối thủ cạnh tranh trực tiếp, so sánh giá, chính sách ship, cấu trúc offer và điểm yếu của họ để xây dựng chiến lược vượt trội.
          </p>
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className="mt-4 px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
          >
            Bắt đầu phân tích đối thủ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Outpositioning Strategy Summary Banner */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>🎯 Chiến Lược Định Vị Vượt Trội (Outpositioning Blueprint):</span>
            </h3>
            <p className="text-zinc-700 leading-relaxed">{comp.outpositioning_strategy}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono">CƠ HỘI ĐỊNH GIÁ:</span>
                <div className="text-zinc-800 font-medium mt-0.5">{comp.price_opportunity}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-mono">KHOẢNG TRỐNG THỊ TRƯỜNG:</span>
                <div className="text-zinc-800 font-medium mt-0.5">{comp.gap_identified}</div>
              </div>
            </div>
          </div>

          {/* Competitor Matrix Table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center justify-between">
              <span>Ma Trận So Sánh Đối Thủ Trực Tiếp</span>
              <span className="text-[10px] font-mono text-zinc-500">Live Benchmarking</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-100/50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3.5">Đối Thủ</th>
                    <th className="py-2.5 px-3">Giá Bán</th>
                    <th className="py-2.5 px-3">Shipping</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Cấu Trúc Offer</th>
                    <th className="py-2.5 px-3">Hook Score</th>
                    <th className="py-2.5 px-3.5">Điểm Yếu Chết Người</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {comp.competitors.map((c, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition">
                      <td className="py-3 px-3.5 font-medium text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-zinc-900">
                        ${c.selling_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-600">{c.shipping_days}</td>
                      <td className="py-3 px-3 font-mono text-zinc-600">★ {c.rating}</td>
                      <td className="py-3 px-3">{c.offer_type}</td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-900">
                        {c.hook_score}/100
                      </td>
                      <td className="py-3 px-3.5 text-zinc-600 italic">
                        {c.weakness}
                      </td>
                    </tr>
                  ))}
                  {/* YOU row */}
                  <tr className="bg-zinc-100/60 font-semibold border-t-2 border-zinc-300">
                    <td className="py-3 px-3.5 text-zinc-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black"></span>
                      <span>YOUR STORE (Chiến Lược Mới)</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">
                      ${product.selling_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">5-8 ngày (YunExpress)</td>
                    <td className="py-3 px-3 font-mono text-zinc-900">Mục tiêu 4.8★</td>
                    <td className="py-3 px-3 text-zinc-900 font-medium">BOGO 50% + 90d Guarantee</td>
                    <td className="py-3 px-3 font-mono text-zinc-900">92/100 (AI Viral Hooks)</td>
                    <td className="py-3 px-3.5 text-zinc-900 not-italic">
                      Đã khắc phục lỗi Velcro & thêm túi bảo quản
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
