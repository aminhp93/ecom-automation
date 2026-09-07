"use client";

import React, { useState } from "react";
import { Product } from "@/lib/db/store";
import { creativeSchema } from "@/lib/workflows/schemas";
import {
  Play,
  Loader2,
  Film,
  Copy,
  Check,
  Sparkles,
  Store,
  Layers,
} from "lucide-react";

interface Stage06CreativeViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onGoToRoadmap?: () => void;
}

export const Stage06CreativeView: React.FC<Stage06CreativeViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onGoToRoadmap,
}) => {
  const [subTab, setSubTab] = useState<"hooks" | "scripts" | "shopify">(
    "hooks",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">
          Chưa chọn sản phẩm
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để sản xuất kịch bản và nội dung trang
          bán hàng.
        </p>
      </div>
    );
  }

  const cr = creativeSchema.safeParse(product.creative_pack).data;
  const hasOffer = !!product.offer_package;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Prerequisite Gate Banner */}
      {!hasOffer && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-red-900">
          <Film className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">
              Cổng Kiểm Soát Pipeline: Thiếu Dữ Liệu Stage 05 (Offer Creation)
            </div>
            <div className="text-red-700 text-[11px] mt-0.5">
              Bạn cần hoàn tất thiết kế 3 tầng Offer và lời cam kết ở Stage 05
              trước. Kịch bản video và trang Shopify phụ thuộc chặt chẽ vào cấu
              trúc ưu đãi này.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 06 • Final V1 Delivery
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Creative Studio & Shopify Storefront Engine
            </h1>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black text-white">
              Powered by Claude Sonnet 4.5
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm: <strong className="text-zinc-900">{product.name}</strong>{" "}
            ({product.niche})
          </p>
        </div>

        <button
          onClick={onRunStage}
          disabled={isRunning || !hasOffer}
          className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition ${
            isRunning || !hasOffer
              ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
              : "bg-black text-white hover:bg-zinc-800"
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Claude đang viết kịch bản...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>
                {cr
                  ? "Tạo Lại Kịch Bản & Store"
                  : "Tạo Kịch Bản & Store (Claude)"}
              </span>
            </>
          )}
        </button>
      </div>

      {!cr ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Film className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">
            Sản xuất vũ khí Content & Trang Bán Hàng
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Claude Sonnet 4.5 sẽ trực tiếp viết 10 Viral Video Hooks cho
            TikTok/Reels, 3 kịch bản video ad phân cảnh chi tiết từng giây, và
            toàn bộ nội dung mô tả sản phẩm chuẩn SEO cho Shopify.
          </p>
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className="mt-4 px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
          >
            Sản xuất Content với Claude Sonnet ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pipeline Complete & Launch Ready Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-900 flex items-center gap-2">
                  <span>Bản nháp creative — cần người dùng kiểm tra</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-600 text-white font-medium">
                    STATUS: NEEDS_REVIEW
                  </span>
                </div>
                <div className="text-emerald-700 text-[11px] mt-0.5">
                  Chưa được duyệt launch. Đối chiếu giá/offer, điều kiện giao
                  hàng, chính sách đổi trả và bằng chứng cho mọi claim trước khi
                  xuất bản hoặc chạy ads.
                </div>
              </div>
            </div>

            {onGoToRoadmap && (
              <button
                onClick={onGoToRoadmap}
                className="px-3 py-1.5 rounded-md bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition shrink-0 flex items-center gap-1"
              >
                <span>Xem Roadmap V2 (Meta Ads)</span>
                <span>→</span>
              </button>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200 text-xs w-fit">
            <button
              onClick={() => setSubTab("hooks")}
              className={`px-3 py-1 rounded-sm font-medium transition ${
                subTab === "hooks"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              10 Viral Hooks ({cr.viral_hooks.length})
            </button>
            <button
              onClick={() => setSubTab("scripts")}
              className={`px-3 py-1 rounded-sm font-medium transition ${
                subTab === "scripts"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Kịch Bản Video Ads ({cr.video_scripts.length})
            </button>
            <button
              onClick={() => setSubTab("shopify")}
              className={`px-3 py-1 rounded-sm font-medium transition ${
                subTab === "shopify"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Nội Dung Trang Shopify
            </button>
          </div>

          {/* Subtab 1: Viral Hooks */}
          {subTab === "hooks" && (
            <div className="space-y-2.5">
              {cr.viral_hooks.map((h) => (
                <div
                  key={h.id}
                  className="bg-white border border-zinc-200 rounded-lg p-3 flex items-start justify-between gap-3 shadow-2xs text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                        #{h.id} {h.angle}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {h.category}
                      </span>
                    </div>
                    <div className="text-zinc-900 font-medium text-sm leading-snug">
                      &ldquo;{h.hook_text}&rdquo;
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(`hook_${h.id}`, h.hook_text)}
                    className="p-1.5 rounded-md border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition shrink-0"
                    title="Copy Hook Text"
                  >
                    {copiedId === `hook_${h.id}` ? (
                      <Check className="w-3.5 h-3.5 text-black" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subtab 2: Video Scripts Scene-by-Scene */}
          {subTab === "scripts" && (
            <div className="space-y-4">
              {cr.video_scripts.map((sc, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs"
                >
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900 text-xs">
                        {sc.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Framework: {sc.framework} • Thời lượng:{" "}
                        {sc.target_length}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(
                          `script_${sIdx}`,
                          sc.scenes
                            .map(
                              (sn) =>
                                `[${sn.time}]\n• Visual B-roll: ${sn.visual}\n• Voiceover: ${sn.audio}\n• Text Overlay: ${sn.text_overlay}`,
                            )
                            .join("\n\n"),
                        )
                      }
                      className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-100 transition flex items-center gap-1.5"
                    >
                      {copiedId === `script_${sIdx}` ? (
                        <>
                          <Check className="w-3 h-3 text-black" />
                          <span>Đã copy kịch bản</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy Kịch Bản</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-100 text-xs">
                    {sc.scenes.map((sn, snIdx) => (
                      <div
                        key={snIdx}
                        className="p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3 hover:bg-zinc-50/60 transition"
                      >
                        <div className="sm:col-span-1 font-mono">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
                            {sn.time}
                          </span>
                          <div className="text-[11px] text-zinc-500 mt-2">
                            <span className="font-semibold text-zinc-700">
                              Text Màn Hình:
                            </span>
                            <div className="text-zinc-900 font-medium italic mt-0.5">
                              &ldquo;{sn.text_overlay}&rdquo;
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-3 space-y-1.5">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              Hình ảnh B-Roll quay:
                            </span>
                            <div className="text-zinc-800 font-medium mt-0.5">
                              {sn.visual}
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-zinc-100">
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              Lời thoại Voiceover:
                            </span>
                            <div className="text-zinc-900 mt-0.5 leading-relaxed">
                              &ldquo;{sn.audio}&rdquo;
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtab 3: Shopify Store Page Content */}
          {subTab === "shopify" && (
            <div className="space-y-4">
              {/* Headline & Subheadline */}
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  SHOPIFY HERO HEADLINE
                </span>
                <h2 className="text-base font-bold text-zinc-900">
                  {cr.shopify_page.headline}
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {cr.shopify_page.subheadline}
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cr.shopify_page.benefits.map((b, bIdx) => (
                  <div
                    key={bIdx}
                    className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-1 text-xs"
                  >
                    <div className="font-semibold text-zinc-900">
                      ✓ {b.title}
                    </div>
                    <p className="text-zinc-600 leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>

              {/* FAQs */}
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3 text-xs">
                <div className="font-semibold text-zinc-900">
                  Bộ 5 Câu Hỏi Thường Gặp (FAQs Xóa Bỏ Do Dự Của Khách)
                </div>
                <div className="space-y-2">
                  {cr.shopify_page.faqs.map((f, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-1"
                    >
                      <div className="font-semibold text-zinc-900">
                        Q: {f.q}
                      </div>
                      <div className="text-zinc-600 leading-relaxed">
                        A: {f.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw HTML Code Box */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 font-mono text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>
                    Mã HTML Mô Tả Sản Phẩm (Dán thẳng vào Shopify Product
                    Description)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        "shopify_html",
                        cr.shopify_page.html_description,
                      )
                    }
                    className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition flex items-center gap-1.5"
                  >
                    {copiedId === "shopify_html" ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span>Đã copy HTML</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Shopify HTML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] text-zinc-300 p-2 bg-black/50 rounded">
                  {cr.shopify_page.html_description}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
