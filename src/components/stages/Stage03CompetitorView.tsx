"use client";

import React, { useState } from "react";
import { Product, CompetitorItem } from "@/lib/db/store";
import { competitorSchema } from "@/lib/workflows/schemas";
import {
  Play,
  Loader2,
  ArrowRight,
  Target,
  ExternalLink,
  Globe,
  Radio,
  Search,
  Copy,
  Check,
  Eye,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  Flame,
  Code2,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface Stage03CompetitorViewProps {
  product: Product | null;
  onRunStage: (allowNoGoOverride?: boolean) => void;
  isRunning: boolean;
  onProceedToNext: () => void;
}

export const Stage03CompetitorView: React.FC<Stage03CompetitorViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onProceedToNext,
}) => {
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<CompetitorItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [allowNoGoOverride, setAllowNoGoOverride] = useState(false);

  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">
          Chưa chọn sản phẩm để phân tích đối thủ
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để tiến hành phân tích đối thủ.
        </p>
      </div>
    );
  }

  const hasValidation = !!product.validation;
  const isNoGo = product.validation?.verdict === "NO_GO";
  const isBlocked = !hasValidation || (isNoGo && !allowNoGoOverride);
  const parsedComp = competitorSchema.safeParse(
    product.competitor_analysis,
  ).data;
  // Existing seed/legacy records are not evidence of a live platform detection either.
  const comp = parsedComp
    ? {
        ...parsedComp,
        competitors: parsedComp.competitors.map((c) => ({
          ...c,
          shopify_detected: false,
          platform: "Chưa xác minh",
          shopify_theme: undefined,
          shopify_apps: [],
        })),
      }
    : undefined;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Helper to extract clean domain root from URL
  const getDomainRoot = (url: string) => {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  };

  const getShopifyBestsellersUrl = (c: CompetitorItem) => {
    if (c.bestseller_url) return c.bestseller_url;
    const root = getDomainRoot(c.url);
    return `${root}/collections/all?sort_by=best-selling`;
  };

  const getShopifyProductsJsonUrl = (c: CompetitorItem) => {
    if (c.products_json_url) return c.products_json_url;
    const root = getDomainRoot(c.url);
    return `${root}/products.json`;
  };

  const getAdLibraryUrl = (c: CompetitorItem) => {
    if (c.ad_library_url) return c.ad_library_url;
    const clean = c.name.replace(/[™®©]/g, "").trim();
    return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(clean)}`;
  };

  const getTikTokUrl = (c: CompetitorItem) => {
    if (c.tiktok_url) return c.tiktok_url;
    const clean = c.name.replace(/[™®©]/g, "").trim();
    return `https://www.tiktok.com/search?q=${encodeURIComponent(clean)}`;
  };

  const getGoogleTrendsUrl = (keyword: string) => {
    return `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`;
  };

  return (
    <div className="space-y-4">
      {/* Prerequisite Gate Banners */}
      {!hasValidation && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-red-900">
          <Target className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">
              Cổng Kiểm Soát Pipeline: Thiếu Dữ Liệu Stage 02 (Validation)
            </div>
            <div className="text-red-700 text-[11px] mt-0.5">
              Bạn không thể chạy Stage 03 nếu sản phẩm chưa được kiểm chứng ở
              Stage 02. Hãy quay lại Stage 02 để thực hiện Deep Validation.
            </div>
          </div>
        </div>
      )}

      {hasValidation && isNoGo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-2 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800">
                Cảnh Báo: Sản phẩm nhận phán quyết NO_GO ở Stage 02 (
                {product.validation?.validation_score}/100)
              </div>
              <div className="text-amber-700 text-[11px] mt-0.5">
                Các chỉ số ads longevity hoặc sentiment không đạt chuẩn an toàn.
                Mặc định pipeline sẽ khóa các bước tiếp theo để tránh lãng phí
                chi phí.
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200">
            <input
              type="checkbox"
              checked={allowNoGoOverride}
              onChange={(e) => setAllowNoGoOverride(e.target.checked)}
              className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="font-medium text-amber-900 text-[11px]">
              Tôi hiểu rủi ro và muốn ép chạy tiếp (Override Phán Quyết NO_GO)
            </span>
          </label>
        </div>
      )}

      {hasValidation && product.validation?.verdict === "CONDITIONAL_GO" && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800">
              Thẩm Định Có Điều Kiện (CONDITIONAL_GO -{" "}
              {product.validation?.validation_score}/100)
            </div>
            <div className="text-amber-700 text-[11px] mt-0.5">
              Sản phẩm có rủi ro tiềm ẩn ở Stage 02. Phân tích đối thủ tại bước
              này sẽ giúp bạn tìm ra điểm yếu chưa được giải quyết để xây dựng
              giải pháp vượt trội.
            </div>
          </div>
        </div>
      )}

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
            Sản phẩm: <strong className="text-zinc-900">{product.name}</strong>{" "}
            (Giá bán kỳ vọng: ${product.selling_price})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunStage(allowNoGoOverride)}
            disabled={isRunning || isBlocked}
            className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition ${
              isRunning || isBlocked
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang quét đối thủ & Shopify...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>{comp ? "Quét Lại Đối Thủ" : "Quét & Lập Ma Trận"}</span>
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
          <h3 className="text-xs font-semibold text-zinc-900">
            Bóc tách 3 đối thủ hàng đầu trên thị trường
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            AI đề xuất đối thủ và hướng nghiên cứu. Chưa crawl website, xác minh
            nền tảng, theme/apps hoặc doanh số; cần kiểm tra thủ công.
          </p>
          <button
            onClick={() => onRunStage(allowNoGoOverride)}
            disabled={isRunning || isBlocked}
            className={`mt-4 px-4 py-2 rounded-md text-xs font-medium transition ${
              isRunning || isBlocked
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isBlocked
              ? "Đang khóa bởi Cổng Gating"
              : "Bắt đầu phân tích đối thủ tự động"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Outpositioning Strategy Summary Banner */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>
                🎯 Chiến Lược Định Vị Vượt Trội (Outpositioning Blueprint):
              </span>
            </h3>
            <p className="text-zinc-700 leading-relaxed">
              {comp.outpositioning_strategy}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  CƠ HỘI ĐỊNH GIÁ:
                </span>
                <div className="text-zinc-800 font-medium mt-0.5">
                  {comp.price_opportunity}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  KHOẢNG TRỐNG THỊ TRƯỜNG:
                </span>
                <div className="text-zinc-800 font-medium mt-0.5">
                  {comp.gap_identified}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Live Verification & Spy Resources Hub */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-zinc-900">
                  Gợi ý nghiên cứu đối thủ — chưa xác minh nguồn
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ● AI / dữ liệu mẫu — cần kiểm chứng
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Các link là điểm bắt đầu nghiên cứu, không phải bằng chứng đã kiểm
              tra website hoặc dữ liệu bán hàng. Giá, rating và điểm yếu chưa
              được xác minh.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {comp.competitors.map((c, idx) => {
                const adLibUrl = getAdLibraryUrl(c);
                const tiktokUrl = getTikTokUrl(c);
                const isShopify =
                  c.shopify_detected ??
                  (c.platform?.toLowerCase().includes("shopify") ||
                    c.url.includes("copacalmer") ||
                    c.url.includes("plenny") ||
                    c.url.includes("lavenderthorne"));

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition space-y-2 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-zinc-900 truncate">
                          {c.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                            isShopify
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-200 text-zinc-700 border-zinc-300"
                          }`}
                        >
                          {c.platform || (isShopify ? "Shopify DTC" : "Store")}
                        </span>
                      </div>

                      {/* Detected Theme & Apps */}
                      {isShopify && (
                        <div className="mt-1.5 space-y-0.5 text-[10px]">
                          <div className="text-zinc-600 font-mono flex items-center gap-1">
                            <span className="text-zinc-400">Theme:</span>
                            <span className="font-medium text-zinc-800">
                              {c.shopify_theme || "Dawn Theme"}
                            </span>
                          </div>
                          {c.shopify_apps && c.shopify_apps.length > 0 && (
                            <div
                              className="text-zinc-500 truncate"
                              title={c.shopify_apps.join(", ")}
                            >
                              <span className="text-zinc-400 font-mono">
                                Apps:
                              </span>{" "}
                              {c.shopify_apps.slice(0, 2).join(", ")}
                              {c.shopify_apps.length > 2 &&
                                ` +${c.shopify_apps.length - 2}`}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                        Offer: {c.offer_type} • Giá: $
                        {c.selling_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/80 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black text-white text-[10px] font-medium hover:bg-zinc-800 transition shadow-2xs"
                          title="Mở website chính thức của đối thủ"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Xem Store</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <a
                          href={adLibUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-medium transition"
                          title="Xem toàn bộ quảng cáo đang chạy trên Facebook/Instagram"
                        >
                          <span>Meta Ads</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <a
                          href={tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-200 text-zinc-800 hover:bg-zinc-300 text-[10px] font-medium transition"
                          title="Xem video viral và ads trên TikTok"
                        >
                          <span>TikTok</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <button
                          onClick={() => setSelectedCompetitor(c)}
                          className="inline-flex items-center gap-1 px-1.5 py-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 text-[10px] ml-auto transition"
                          title="Soi chi tiết điểm yếu & phản đòn"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi Tiết</span>
                        </button>
                      </div>

                      {/* Direct Automated Shopify Bestseller link */}
                      {isShopify && (
                        <div className="flex items-center gap-1 pt-1 border-t border-zinc-100 text-[10px]">
                          <span className="text-zinc-400 font-mono">
                            Bán chạy nhất:
                          </span>
                          <a
                            href={getShopifyBestsellersUrl(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium inline-flex items-center gap-0.5 truncate flex-1"
                            title="Mở xem danh sách sản phẩm bán chạy nhất theo thuật toán Shopify"
                          >
                            <Flame className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span className="truncate">
                              {c.bestseller_item || "Xem Bestsellers"}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick General Market Research Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 border-t border-zinc-100">
              <span className="font-mono text-[10px] text-zinc-400 uppercase">
                Kiểm chứng thị trường:
              </span>
              <a
                href={getGoogleTrendsUrl(
                  product.name.includes("Roller")
                    ? "teething roller"
                    : product.category,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-blue-600 hover:underline"
              >
                <TrendingUp className="w-3 h-3 text-zinc-500" />
                <span>Google Trends</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-zinc-300">•</span>
              <a
                href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=copacalmer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-blue-600 hover:underline"
              >
                <span>Meta Ad Library (CopaCalmer Live)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-zinc-300">•</span>
              <a
                href="https://www.amazon.com/Best-Sellers-Baby-Teething-Relief/zgbs/baby-products/2237482011"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-blue-600 hover:underline"
              >
                <ShoppingBag className="w-3 h-3 text-zinc-500" />
                <span>Amazon Teething Bestsellers</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Competitor Matrix Table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center justify-between">
              <span>Ma trận đối thủ — bản nháp nghiên cứu</span>
              <span className="text-[10px] font-mono text-zinc-500">
                Unverified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-100/50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3.5">Đối Thủ & Nền Tảng</th>
                    <th className="py-2.5 px-3">Bestseller Của Họ</th>
                    <th className="py-2.5 px-3">Giá Bán</th>
                    <th className="py-2.5 px-3">Shipping</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Cấu Trúc Offer</th>
                    <th className="py-2.5 px-3">Hook Score</th>
                    <th className="py-2.5 px-3.5">Điểm Yếu Chết Người</th>
                    <th className="py-2.5 px-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {comp.competitors.map((c, idx) => {
                    const isShopify =
                      c.shopify_detected ??
                      (c.platform?.toLowerCase().includes("shopify") ||
                        c.url.includes("copacalmer") ||
                        c.url.includes("plenny") ||
                        c.url.includes("lavenderthorne"));

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-zinc-50/80 transition group"
                      >
                        {/* Competitor & Platform Info */}
                        <td className="py-3 px-3.5 font-medium text-zinc-900">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:text-blue-600 hover:underline transition"
                                title={`Mở website đối thủ: ${c.url}`}
                              >
                                <span>{c.name}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-zinc-400 group-hover:text-blue-600 transition" />
                              </a>
                              <span
                                className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                                  isShopify
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                }`}
                              >
                                {isShopify ? "Shopify" : "Retail"}
                              </span>
                            </div>

                            {/* Theme & Apps Footprint */}
                            {isShopify && (
                              <div className="text-[10px] text-zinc-500 font-normal leading-tight">
                                <span className="font-mono text-zinc-400">
                                  Theme:
                                </span>{" "}
                                {c.shopify_theme || "Dawn"}
                                {c.shopify_apps &&
                                  c.shopify_apps.length > 0 && (
                                    <span className="text-zinc-400">
                                      {" "}
                                      • {c.shopify_apps.slice(0, 2).join(", ")}
                                    </span>
                                  )}
                              </div>
                            )}

                            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                              <button
                                onClick={() => handleCopy(c.url)}
                                className="hover:text-zinc-700 inline-flex items-center gap-0.5"
                                title="Sao chép link website"
                              >
                                {copiedUrl === c.url ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                                <span>
                                  {copiedUrl === c.url
                                    ? "Đã copy"
                                    : "Copy link"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Bestseller of the Competitor */}
                        <td className="py-3 px-3 text-xs">
                          {isShopify ? (
                            <div className="space-y-0.5 max-w-xs">
                              <div className="text-zinc-800 font-medium truncate text-[11px]">
                                {c.bestseller_item ||
                                  "Teething Roller Solution"}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <a
                                  href={getShopifyBestsellersUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 hover:underline font-medium inline-flex items-center gap-0.5"
                                  title="Xem danh mục bestsellers của store này"
                                >
                                  <Flame className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Bestsellers ↗</span>
                                </a>
                                <span className="text-zinc-300">•</span>
                                <a
                                  href={getShopifyProductsJsonUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-zinc-800 hover:underline font-mono"
                                  title="Xem data JSON của store"
                                >
                                  JSON
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-500 font-mono">
                              Catalog Amazon/Store
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-zinc-900">
                          ${c.selling_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-600">
                          {c.shipping_days}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-600">
                          ★ {c.rating}
                        </td>
                        <td className="py-3 px-3">{c.offer_type}</td>
                        <td className="py-3 px-3 font-mono font-medium text-zinc-900">
                          {c.hook_score}/100
                        </td>
                        <td className="py-3 px-3.5 text-zinc-600 italic">
                          {c.weakness}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition"
                              title="Mở website"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setSelectedCompetitor(c)}
                              className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* YOU row */}
                  <tr className="bg-zinc-100/60 font-semibold border-t-2 border-zinc-300">
                    <td className="py-3 px-3.5 text-zinc-900">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-black"></span>
                        <span>YOUR STORE (Chiến Lược Mới)</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Shopify High-Converting Architecture
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-900 font-medium">
                      Gói Cặp Đôi Ngủ Ngon (BOGO 50%)
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">
                      ${product.selling_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">
                      5-8 ngày (YunExpress)
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">
                      Mục tiêu 4.8★
                    </td>
                    <td className="py-3 px-3 text-zinc-900 font-medium">
                      BOGO 50% + 90d Guarantee
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-900">
                      92/100 (AI Viral Hooks)
                    </td>
                    <td className="py-3 px-3.5 text-zinc-900 not-italic">
                      Đã khắc phục lỗi Velcro & thêm túi bảo quản
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[10px] text-zinc-500">
                      Baseline
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Deep Spy Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-white text-zinc-700 border border-zinc-200">
                  Competitor Deep Spy
                </span>
                <span className="text-xs font-semibold text-zinc-900 truncate">
                  {selectedCompetitor.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Direct Link Action Bar */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2">
                <div className="text-[10px] uppercase font-mono text-zinc-400">
                  Liên Kết Kiểm Chứng Trực Tiếp:
                </div>
                <div className="flex items-center gap-2 text-zinc-800 font-mono text-xs truncate bg-white p-2 rounded border border-zinc-200">
                  <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1">
                    {selectedCompetitor.url}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedCompetitor.url)}
                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] shrink-0 inline-flex items-center gap-1 transition"
                  >
                    {copiedUrl === selectedCompetitor.url ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Đã copy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={selectedCompetitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black text-white font-medium text-xs hover:bg-zinc-800 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Truy Cập Cửa Hàng Ngay</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={getAdLibraryUrl(selectedCompetitor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium text-xs transition"
                  >
                    <span>Mở Meta Ads Library</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={getTikTokUrl(selectedCompetitor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200 font-medium text-xs transition"
                  >
                    <span>Xem TikTok Videos & Ads</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Shopify Endpoints if detected */}
                <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Shopify Endpoints:
                  </span>
                  <a
                    href={getShopifyBestsellersUrl(selectedCompetitor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-medium transition"
                  >
                    <Flame className="w-3 h-3 text-emerald-600" />
                    <span>Xem Bestsellers (/collections/all)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={getShopifyProductsJsonUrl(selectedCompetitor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 font-mono text-[10px] transition"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>/products.json</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Shopify Tech Stack Card */}
              {selectedCompetitor.shopify_detected && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-emerald-800 font-semibold flex items-center justify-between">
                    <span>Shopify Tech Stack Đã Nhận Diện:</span>
                    <span className="bg-emerald-100 px-1.5 py-0.2 rounded text-emerald-800">
                      Auto-Detected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-mono">
                        Theme đang dùng:
                      </span>
                      <div className="font-semibold text-zinc-900 mt-0.5">
                        {selectedCompetitor.shopify_theme || "Dawn Theme"}
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-mono">
                        Bestseller số 1:
                      </span>
                      <div className="font-semibold text-zinc-900 mt-0.5 truncate">
                        {selectedCompetitor.bestseller_item ||
                          "Teething Roller"}
                      </div>
                    </div>
                  </div>
                  {selectedCompetitor.shopify_apps &&
                    selectedCompetitor.shopify_apps.length > 0 && (
                      <div className="pt-1 text-[11px] text-zinc-700">
                        <span className="text-zinc-500 text-[10px] font-mono">
                          Apps chuyển đổi cài đặt:
                        </span>{" "}
                        <span className="font-medium text-zinc-900">
                          {selectedCompetitor.shopify_apps.join(", ")}
                        </span>
                      </div>
                    )}
                </div>
              )}

              {/* Competitor Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-400">Giá Bán</div>
                  <div className="text-sm font-bold text-zinc-900 mt-0.5">
                    ${selectedCompetitor.selling_price.toFixed(2)}
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-400">Shipping</div>
                  <div className="text-xs font-semibold text-zinc-800 mt-0.5">
                    {selectedCompetitor.shipping_days}
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-400">Đánh Giá</div>
                  <div className="text-xs font-semibold text-zinc-800 mt-0.5">
                    ★ {selectedCompetitor.rating}/5.0
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-400">Hook Score</div>
                  <div className="text-xs font-semibold text-zinc-800 mt-0.5">
                    {selectedCompetitor.hook_score}/100
                  </div>
                </div>
              </div>

              {/* Offer Structure */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  Cấu Trúc Offer Của Đối Thủ:
                </div>
                <div className="text-zinc-900 font-medium">
                  {selectedCompetitor.offer_type}
                </div>
              </div>

              {/* Flaws & Outpositioning Target */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-rose-600 font-semibold flex items-center gap-1">
                  <span>Tử Huyệt Của Đối Thủ (Weakness):</span>
                </div>
                <p className="text-rose-950 leading-relaxed text-xs">
                  {selectedCompetitor.weakness}
                </p>
              </div>

              {/* How We Win */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-emerald-700 font-semibold flex items-center gap-1">
                  <span>Chiến Lược Outpositioning Của Snuglet:</span>
                </div>
                <p className="text-emerald-950 leading-relaxed text-xs">
                  Định vị bằng bi lăn thép không chạm tay (No-Touch) + combo quà
                  tặng ngàm ngậm silicone an toàn. Giữ giá hấp dẫn hơn ($24.99
                  vs ${selectedCompetitor.selling_price}) và đẩy gói đôi BOGO
                  50% miễn phí ship để nuốt trọn tệp khách hàng của họ.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="px-4 py-1.5 rounded-md bg-zinc-900 text-white font-medium text-xs hover:bg-black transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
