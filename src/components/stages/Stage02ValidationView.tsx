"use client";

import React from "react";
import { Product } from "@/lib/db/store";
import { validationSchema } from "@/lib/workflows/schemas";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

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
        <h3 className="text-xs font-medium text-zinc-900">
          Chưa chọn sản phẩm để xác thực
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Hãy quay lại Stage 01 (Product Discovery) và bấm &quot;Duyệt&quot; một
          sản phẩm để bắt đầu xác thực.
        </p>
      </div>
    );
  }

  const v = validationSchema.safeParse(product.validation).success
    ? product.validation
    : undefined;

  return (
    <div className="space-y-4">
      {/* KILL / Low Score Caution Banner */}
      {(product.recommendation === "KILL" || product.product_score < 68) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800">
              Cảnh báo Gating: Sản phẩm có khuyến nghị {product.recommendation}{" "}
              ({product.product_score}/100)
            </div>
            <div className="text-amber-700 text-[11px] mt-0.5">
              Sản phẩm này không vượt qua ngưỡng an toàn tối thiểu (68 điểm) ở
              Stage 01. Nếu bạn chọn tiếp tục, hãy đặc biệt chú ý đến tín hiệu
              Ads Longevity và Sentiment tại Stage này trước khi quyết định chi
              tiền tìm nguồn hàng.
            </div>
          </div>
        </div>
      )}

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
            Sản phẩm đang thẩm định:{" "}
            <strong className="text-zinc-900">{product.name}</strong> (
            {product.niche})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition ${
              isRunning
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800"
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
                <span>
                  {v ? "Chạy Lại Validation" : "Chạy Deep Validation"}
                </span>
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
          <h3 className="text-xs font-semibold text-zinc-900">
            Sẵn sàng chạy xác thực chuyên sâu
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            AI đề xuất giả thuyết rủi ro. Chưa có kết nối Google Trends, Ads
            Library hoặc reviews thực tế; cần đối chiếu nguồn thủ công.
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
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Trend Momentum
              </div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {v.trend_growth_pct == null
                  ? "Chưa có dữ liệu"
                  : `${v.trend_growth_pct}% (chưa xác minh)`}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Chưa kết nối dữ liệu Trends
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Ad Saturation
              </div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {v.active_competitor_ads == null
                  ? "Chưa có dữ liệu"
                  : `${v.active_competitor_ads} ads (chưa xác minh)`}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {v.ads_longevity_days == null
                  ? "Chưa đo tuổi thọ ads"
                  : `Ước tính ${v.ads_longevity_days} ngày — không chứng minh lợi nhuận`}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Review Sentiment
              </div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {v.review_sentiment_score}/100
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Điểm AI ước tính, không phải khảo sát
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Phán Quyết Final
              </div>
              <div className="text-base font-bold mt-1 flex items-center gap-1.5">
                {v.verdict === "GO" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">GO VERDICT</span>
                  </>
                ) : v.verdict === "CONDITIONAL_GO" ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700">CONDITIONAL_GO</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">NO_GO VERDICT</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {v.verdict === "CONDITIONAL_GO"
                  ? `Điểm: ${v.validation_score}/100 (Thẩm định có điều kiện)`
                  : `Điểm: ${v.validation_score}/100`}
              </div>
            </div>
          </div>

          {/* Live Verification Proof Bar */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <span className="font-semibold text-zinc-900">
                  Kiểm chứng nguồn thực tế:
                </span>
                <span className="text-zinc-500 text-[11px] ml-1.5">
                  (Tín hiệu mô phỏng + AI Market Heuristics. Bấm link để xác
                  minh số liệu thật):
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <a
                href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(product.name || product.category)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium transition"
              >
                <span>Google Trends</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>

              <a
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(product.name || product.category)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium transition"
              >
                <span>Meta Ad Library</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>

              <a
                href={`https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium transition"
              >
                <span>Amazon Reviews</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
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
              <span className="text-[10px] font-mono text-zinc-400">
                Amazon/AliExpress sentiment
              </span>
            </div>

            <div className="space-y-2">
              {v.negative_reviews_mined.map((rev, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 border border-zinc-200 rounded-md p-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <div className="sm:col-span-1">
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Khuyết điểm của đối thủ ({rev.frequency}):
                    </div>
                    <div className="text-zinc-900 font-medium mt-0.5">
                      {rev.issue}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Giải pháp chuyển hóa thành USP của mình:
                    </div>
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
