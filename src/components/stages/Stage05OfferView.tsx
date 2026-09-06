'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/db/store';
import { Play, Loader2, ArrowRight, Tag, ShieldCheck, Check, Copy } from 'lucide-react';

interface Stage05OfferViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onProceedToNext: () => void;
}

export const Stage05OfferView: React.FC<Stage05OfferViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onProceedToNext,
}) => {
  const [copiedTier, setCopiedTier] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">Chưa chọn sản phẩm</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để thiết kế offer.
        </p>
      </div>
    );
  }

  const off = product.offer_package;

  const handleCopy = (tier: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTier(tier);
    setTimeout(() => setCopiedTier(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 05
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Offer Creation & Bundle Architecture
            </h1>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black text-white">
              Powered by Claude Sonnet 4.5
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm:{' '}
            <strong className="text-zinc-900">{product.name}</strong> (Giá bán lẻ neo: ${product.selling_price})
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
                <span>Claude đang tạo Offer...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>{off ? 'Tạo Lại Offer' : 'Tạo 3 Gói Offer (Claude)'}</span>
              </>
            )}
          </button>

          {off && (
            <button
              onClick={onProceedToNext}
              className="px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-900 font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-zinc-200"
            >
              <span>Tiếp Tục Stage 06/07</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {!off ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Tag className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">Xây dựng Grand Slam Offer với Claude Sonnet 4.5</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Hệ thống sẽ dùng Claude Sonnet để thiết kế 3 tầng gói cước (Starter Pack, Buy 1 Get 1 50% Off, Family Deluxe Bundle) kèm cam kết bảo hành đảo ngược rủi ro để tối đa hóa AOV.
          </p>
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className="mt-4 px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
          >
            Tạo Offer với Claude Sonnet ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Positioning Banner */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                ĐỊNH VỊ SẢN PHẨM (USP POSITIONING)
              </span>
              <div className="text-sm font-semibold text-zinc-900 mt-0.5">
                &ldquo;{off.positioning_statement}&rdquo;
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-200 text-zinc-600">
              <strong className="text-zinc-800">Khao khát chuyển hóa:</strong> {off.target_desire}
            </div>
          </div>

          {/* 3 Tier Offer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {off.packages.map((pkg) => {
              const isPopular = pkg.tier === 'B';
              return (
                <div
                  key={pkg.tier}
                  className={`bg-white rounded-lg p-4 flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'border-2 border-black shadow-md relative'
                      : 'border border-zinc-200 shadow-2xs'
                  }`}
                >
                  <div>
                    {isPopular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ★ MOST POPULAR (BOOST AOV)
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-zinc-900 uppercase">
                        {pkg.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {pkg.savings}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mt-2 min-h-[32px]">
                      {pkg.description}
                    </p>

                    <div className="my-3 font-mono">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                          ${pkg.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-400 line-through">
                          ${pkg.value.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-zinc-100 text-xs">
                      {pkg.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-zinc-700">
                          <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                          <span>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        pkg.tier,
                        `${pkg.name} - Giá: $${pkg.price.toFixed(2)} (Tiết kiệm ${pkg.savings})\nBao gồm: ${pkg.items.join(', ')}`
                      )
                    }
                    className="mt-4 w-full py-1.5 rounded-md border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-100 transition flex items-center justify-center gap-1.5"
                  >
                    {copiedTier === pkg.tier ? (
                      <>
                        <Check className="w-3 h-3 text-black" />
                        <span>Đã copy thông tin gói!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copy Offer Gói Này</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Risk Reversal Guarantee & Urgency Hook */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-1">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Cam Kết Bảo Hành Đảo Ngược Rủi Ro:</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">{off.risk_reversal_guarantee}</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-1">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <span>⚡ Lý Do Cấp Bách (Urgency Trigger):</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">{off.urgency_hook}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
