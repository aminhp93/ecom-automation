'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { Play, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface Stage02ValidationViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onProceedToNext: () => void;
}

export const Stage02ValidationView: React.FC<Stage02ValidationViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onProceedToNext,
}) => {
  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">Chưa chọn sản phẩm để xác thực</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Hãy quay lại Stage 01 (Product Discovery) và bấm &quot;Duyệt&quot; một sản phẩm để bắt đầu xác thực.
        </p>
      </div>
    );
  }

  const v = product.validation;

  return (
    <div className="space-y-4">
      {/* Stage Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 02
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Product Deep Validation
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm đang thẩm định:{' '}
            <strong className="text-zinc-900">{product.name}</strong> ({product.niche})
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
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>{v ? 'Chạy Lại Validation' : 'Chạy Deep Validation'}</span>
              </>
            )}
          </button>

          {v && (
            <button
              onClick={onProceedToNext}
              className="px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-900 font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-zinc-200"
            >
              <span>Tiếp Tục Stage 03</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {!v ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <ShieldCheck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">Sẵn sàng chạy xác thực chuyên sâu</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Hệ thống sẽ kiểm tra xu hướng Google Trends, đo lường độ bão hòa Ads đối thủ và đào xới các đánh giá tiêu cực (1-3 sao) để tìm điểm khác biệt.
          </p>
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className="mt-4 px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
          >
            Bắt đầu xác thực ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Trend Momentum</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                +{v.trend_growth_pct}% YoY
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Xu hướng đang tăng trưởng</div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Ad Saturation</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {v.active_competitor_ads} Ads chạy
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Tuổi thọ trung bình ~{v.ads_longevity_days} ngày
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Review Sentiment</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {v.review_sentiment_score}/100
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Độ hài lòng tích cực</div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Phán Quyết Final</div>
              <div className="text-base font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>{v.verdict} VERDICT</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Điểm: {v.validation_score}/100</div>
            </div>
          </div>

          {/* Verdict Summary Box */}
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>Đánh giá thẩm định của AI:</span>
            </div>
            <p className="text-zinc-600 leading-relaxed">{v.verdict_reason}</p>
          </div>

          {/* Mined Negative Reviews & Flaws */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">
                Bóc Tách 100 Review 1-3 Sao Đối Thủ & Giải Pháp USP Của Chúng Ta
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Amazon/AliExpress sentiment</span>
            </div>

            <div className="space-y-2">
              {v.negative_reviews_mined.map((rev, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 border border-zinc-200 rounded-md p-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <div className="sm:col-span-1">
                    <div className="text-[10px] text-zinc-400 font-mono">Khuyết điểm của đối thủ ({rev.frequency}):</div>
                    <div className="text-zinc-900 font-medium mt-0.5">{rev.issue}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] text-zinc-400 font-mono">Giải pháp chuyển hóa thành USP của mình:</div>
                    <div className="text-zinc-700 mt-0.5">{rev.workaround}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
