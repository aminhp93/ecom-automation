"use client";

import React, { useState } from "react";
import { Product, SupplierOption } from "@/lib/db/store";
import { supplierSchema } from "@/lib/workflows/schemas";
import {
  Play,
  Loader2,
  ArrowRight,
  Truck,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Package,
  ShieldCheck,
  Search,
  Radio,
  Info,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

interface Stage04SupplierViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onProceedToNext: () => void;
}

export const Stage04SupplierView: React.FC<Stage04SupplierViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onProceedToNext,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierOption | null>(null);

  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">
          Chưa chọn sản phẩm
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để thẩm định nhà cung cấp.
        </p>
      </div>
    );
  }

  const sup = supplierSchema.safeParse(product.supplier_economics).data;
  const hasCompetitor = !!product.competitor_analysis;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const cleanKeyword =
    product.name.replace(/[™®©]/g, "").split("(")[0].split("-")[0].trim() ||
    product.category ||
    "dropshipping product";

  const defaultCjUrl = `https://cjdropshipping.com/list/product-list.html?key=${encodeURIComponent(cleanKeyword)}`;
  const defaultAliUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(cleanKeyword)}`;
  const default1688Url = `https://s.1688.com/youyuan.html?keywords=${encodeURIComponent(cleanKeyword)}`;
  const defaultAlibabaUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(cleanKeyword)}`;

  const getSupplierUrl = (s: SupplierOption) => {
    if (s.url) return s.url;
    if (s.source.toLowerCase().includes("cj")) return defaultCjUrl;
    if (s.source.toLowerCase().includes("aliexpress")) return defaultAliUrl;
    if (s.source.toLowerCase().includes("1688")) return default1688Url;
    return defaultAlibabaUrl;
  };

  return (
    <div className="space-y-4">
      {/* Prerequisite Gate Banner */}
      {!hasCompetitor && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-red-900">
          <Truck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">
              Cổng Kiểm Soát Pipeline: Thiếu Dữ Liệu Stage 03 (Competitor
              Research)
            </div>
            <div className="text-red-700 text-[11px] mt-0.5">
              Bạn cần hoàn thành phân tích đối thủ ở Stage 03 để có cơ sở giá
              bán thị trường và biên lợi nhuận trước khi thẩm định nguồn cung
              ứng.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 04
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Supplier Validation & Break-Even ROAS
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm: <strong className="text-zinc-900">{product.name}</strong>{" "}
            (Giá bán: ${product.selling_price} | Landed: ${product.landed_cost})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunStage}
            disabled={isRunning || !hasCompetitor}
            className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition ${
              isRunning || !hasCompetitor
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tính toán...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>
                  {sup ? "Tính Lại Chi Phí" : "Thẩm Định Nhà Cung Cấp"}
                </span>
              </>
            )}
          </button>

          {sup && (
            <button
              onClick={onProceedToNext}
              className="px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-900 font-medium text-xs flex items-center gap-1.5 hover:bg-zinc-200 border border-zinc-200"
            >
              <span>Tiếp Tục Stage 05</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Original Product Reference Banner (if product has url) */}
      {product.url && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-amber-900">
                Nguồn Tham Khảo / Cảm Hứng Sản Phẩm Ban Đầu:
              </span>{" "}
              <span className="text-amber-800 font-mono text-[11px] break-all">
                {product.url}
              </span>
            </div>
          </div>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1 rounded border border-amber-300 transition shrink-0"
          >
            <span>Mở Link Gốc</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {!sup ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Truck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">
            Thẩm định tuyến vận chuyển & Điểm hòa vốn
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Lập kịch bản chi phí và ROAS từ giá đầu vào. Chưa có báo giá hoặc
            kết nối supplier API; cần xác minh SKU, sample, shipping và chứng
            từ.
          </p>
          <button
            onClick={onRunStage}
            disabled={isRunning}
            className="mt-4 px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-zinc-800 transition"
          >
            Thẩm định nhà cung cấp ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Economics Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Break-Even ROAS
              </div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {sup.break_even_roas}x
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                ROAS tối thiểu (Lãi ròng = $0)
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Target Scale ROAS
              </div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {sup.target_roas}x
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Mục tiêu scale có lãi ròng
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Gross Margin Pool (100 Đơn)
              </div>
              <div className="text-base font-bold text-blue-700 mt-1">
                +$
                {(
                  sup.gross_margin_pool_100 ?? sup.profit_projection_100_orders
                ).toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Ngân sách cho Ads & Vận hành
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Lãi Ròng Sau Ads (100 Đơn)
              </div>
              <div className="text-base font-bold text-emerald-600 mt-1">
                +$
                {(
                  sup.net_profit_projection_100_orders ??
                  Math.round(
                    (sup.gross_margin_pool_100 ??
                      sup.profit_projection_100_orders) -
                      (product.selling_price * 100) / sup.target_roas,
                  )
                ).toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Ước tính tại ROAS {sup.target_roas}x, chưa gồm thuế/vận hành
              </div>
            </div>
          </div>

          {/* Financial Reality Check Box */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between font-sans text-zinc-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  Bóc tách tài chính 100 đơn hàng (Minh bạch chi phí Ads & Lãi
                  ròng):
                </span>
              </span>
              <span className="text-[10px] text-zinc-500">
                Target ROAS = {sup.target_roas}x
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 text-[11px]">
              <div>
                <span className="text-zinc-500">Tổng doanh thu:</span>
                <div className="font-bold text-zinc-900">
                  ${(product.selling_price * 100).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">Gross Margin Pool:</span>
                <div className="font-bold text-blue-700">
                  $
                  {(
                    sup.gross_margin_pool_100 ??
                    sup.profit_projection_100_orders
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">Chi phí Ads ước tính:</span>
                <div className="font-bold text-amber-700">
                  -$
                  {(
                    sup.ad_spend_projection_100 ??
                    Math.round((product.selling_price * 100) / sup.target_roas)
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">
                  Contribution sau Ads ước tính:
                </span>
                <div className="font-bold text-emerald-700">
                  +$
                  {(
                    sup.net_profit_projection_100_orders ??
                    Math.round(
                      (sup.gross_margin_pool_100 ??
                        sup.profit_projection_100_orders) -
                        (product.selling_price * 100) / sup.target_roas,
                    )
                  ).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">
              * Ghi chú an toàn tài chính: Tại điểm hòa vốn Break-Even ROAS (
              {sup.break_even_roas}x), Chi phí Ads = Gross Margin Pool và Lãi
              ròng = $0. Cột mốc 500 đơn tối ưu thêm giá sỉ 1688 đạt Lãi ròng +$
              {(
                sup.net_profit_projection_500_orders ??
                Math.round(
                  (sup.gross_margin_pool_500 ??
                    sup.profit_projection_500_orders) -
                    (product.selling_price * 500) / sup.target_roas,
                )
              ).toLocaleString()}
              .
            </div>
          </div>

          {/* Live Sourcing & Supplier Telemetry Hub */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-zinc-900">
                  Kịch bản tìm nguồn — chưa có báo giá xác minh
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ● Ước tính, không phải kết nối API
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Giá, reliability và delivery là giả định để lập kế hoạch; kịch bản
              500 đơn giả định giảm giá sỉ chưa được báo giá. Link tìm kiếm
              không xác nhận tồn kho, API hay chứng nhận chất lượng.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Card 1: CJ Dropshipping */}
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {sup.suppliers[0]?.source || "Chưa có nguồn 1"}
                      </span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      CJPacket Line
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1.5">
                    Giá vốn:{" "}
                    <strong>
                      ${sup.suppliers[0]?.unit_cost.toFixed(2) ?? "—"}
                    </strong>{" "}
                    • Ship:{" "}
                    <strong>
                      ${sup.suppliers[0]?.shipping_cost.toFixed(2) ?? "—"}
                    </strong>{" "}
                    ({sup.suppliers[0]?.delivery_days ?? "Chưa có dữ liệu"})
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                    Chưa xác minh báo giá/SKU. Cần đối chiếu trực tiếp nhà cung
                    cấp.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/80 flex items-center gap-1.5">
                  <a
                    href={getSupplierUrl(
                      sup.suppliers[0] || {
                        source: "CJ Dropshipping",
                        unit_cost: 0,
                        moq: 1,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 py-1.5 px-2 rounded transition"
                  >
                    <span>Mở nguồn tham khảo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() =>
                      handleCopy(
                        getSupplierUrl(
                          sup.suppliers[0] || {
                            source: "CJ Dropshipping",
                            unit_cost: 0,
                            moq: 1,
                            shipping_method: "",
                            shipping_cost: 0,
                            delivery_days: "",
                            reliability_rating: 0,
                          },
                        ),
                      )
                    }
                    className="px-2 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition"
                    title="Copy Link CJ"
                  >
                    {copiedUrl ===
                    getSupplierUrl(
                      sup.suppliers[0] || {
                        source: "CJ Dropshipping",
                        unit_cost: 0,
                        moq: 1,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    ) ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: AliExpress Direct */}
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-orange-600" />
                      <span>
                        {sup.suppliers[1]?.source || "Chưa có nguồn 2"}
                      </span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200 font-medium">
                      Buyer Reviews
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1.5">
                    Giá vốn:{" "}
                    <strong>
                      ${sup.suppliers[1]?.unit_cost.toFixed(2) ?? "—"}
                    </strong>{" "}
                    • Ship:{" "}
                    <strong>
                      ${sup.suppliers[1]?.shipping_cost.toFixed(2) ?? "—"}
                    </strong>{" "}
                    ({sup.suppliers[1]?.delivery_days ?? "Chưa có dữ liệu"})
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                    Chưa xác minh đánh giá người mua hoặc khả năng giao hàng.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/80 flex items-center gap-1.5">
                  <a
                    href={getSupplierUrl(
                      sup.suppliers[1] || {
                        source: "AliExpress Direct",
                        unit_cost: 0,
                        moq: 1,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 py-1.5 px-2 rounded transition"
                  >
                    <span>Mở nguồn tham khảo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() =>
                      handleCopy(
                        getSupplierUrl(
                          sup.suppliers[1] || {
                            source: "AliExpress Direct",
                            unit_cost: 0,
                            moq: 1,
                            shipping_method: "",
                            shipping_cost: 0,
                            delivery_days: "",
                            reliability_rating: 0,
                          },
                        ),
                      )
                    }
                    className="px-2 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition"
                    title="Copy Link AliExpress"
                  >
                    {copiedUrl ===
                    getSupplierUrl(
                      sup.suppliers[1] || {
                        source: "AliExpress Direct",
                        unit_cost: 0,
                        moq: 1,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    ) ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card 3: 1688 OEM Factory */}
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-rose-600" />
                      <span>
                        {sup.suppliers[2]?.source || "Chưa có nguồn 3"}
                      </span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                      Giá Xuất Xưởng
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1.5">
                    Giá vốn:{" "}
                    <strong>
                      ${sup.suppliers[2]?.unit_cost.toFixed(2) ?? "—"}
                    </strong>{" "}
                    • MOQ: <strong>{sup.suppliers[2]?.moq ?? "—"} đơn</strong> (
                    {sup.suppliers[2]?.delivery_days ?? "Chưa có dữ liệu"})
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                    Giảm giá sỉ và MOQ cần báo giá xác nhận, không được đảm bảo
                    bởi mô hình.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/80 flex items-center gap-1.5">
                  <a
                    href={getSupplierUrl(
                      sup.suppliers[2] || {
                        source: "1688",
                        unit_cost: 0,
                        moq: 50,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 px-2 rounded transition"
                  >
                    <span>Mở nguồn tham khảo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() =>
                      handleCopy(
                        getSupplierUrl(
                          sup.suppliers[2] || {
                            source: "1688",
                            unit_cost: 0,
                            moq: 50,
                            shipping_method: "",
                            shipping_cost: 0,
                            delivery_days: "",
                            reliability_rating: 0,
                          },
                        ),
                      )
                    }
                    className="px-2 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition"
                    title="Copy Link 1688"
                  >
                    {copiedUrl ===
                    getSupplierUrl(
                      sup.suppliers[2] || {
                        source: "1688",
                        unit_cost: 0,
                        moq: 50,
                        shipping_method: "",
                        shipping_cost: 0,
                        delivery_days: "",
                        reliability_rating: 0,
                      },
                    ) ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Sourcing Verification Links Row */}
            <div className="pt-2 border-t border-zinc-200/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500">
              <span className="font-medium text-zinc-700">
                Kênh Thẩm Định Khác:
              </span>
              <a
                href={defaultAlibabaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 inline-flex items-center gap-1 transition"
              >
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <span>Alibaba Trade Assurance / FDA Manufacturers ↗</span>
              </a>
              <a
                href="https://www.yunexpress.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 inline-flex items-center gap-1 transition"
              >
                <Truck className="w-3 h-3 text-emerald-500" />
                <span>Tra Cứu Bảng Cước YunExpress Fast Line ↗</span>
              </a>
            </div>
          </div>

          {/* Supplier Comparison Table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center justify-between">
              <span>Bảng So Sánh Các Tuyến Cung Ứng & Vận Chuyển</span>
              <span className="text-[10px] font-mono text-zinc-500">
                Sourcing Benchmark
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-100/50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="py-2.5 px-3.5">Kênh Nguồn</th>
                    <th className="py-2.5 px-3">Giá Vốn (Unit)</th>
                    <th className="py-2.5 px-3">MOQ</th>
                    <th className="py-2.5 px-3">Tuyến Vận Chuyển</th>
                    <th className="py-2.5 px-3">Phí Ship</th>
                    <th className="py-2.5 px-3">Thời Gian Giao</th>
                    <th className="py-2.5 px-3 text-center">Độ Tin Cậy</th>
                    <th className="py-2.5 px-3.5 text-right">
                      Kiểm Chứng Trực Tiếp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {sup.suppliers.map((s, idx) => {
                    const url = getSupplierUrl(s);
                    return (
                      <tr key={idx} className="hover:bg-zinc-50 transition">
                        <td className="py-3 px-3.5 font-sans font-medium text-zinc-900">
                          <div className="flex items-center gap-2">
                            <span>{s.source}</span>
                            {s.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                Chưa xác minh
                              </span>
                            )}
                          </div>
                          {s.notes && (
                            <div className="text-[10px] text-zinc-400 font-sans mt-0.5 line-clamp-1">
                              {s.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">
                          ${s.unit_cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-zinc-600">{s.moq} đơn</td>
                        <td className="py-3 px-3 font-sans text-zinc-700">
                          {s.shipping_method}
                        </td>
                        <td className="py-3 px-3 text-zinc-600">
                          ${s.shipping_cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-sans text-zinc-800 font-medium">
                          {s.delivery_days}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-zinc-900">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono">
                            {s.reliability_rating}%
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-sans">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition"
                            >
                              <span>Mở Nguồn</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleCopy(url)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 rounded hover:bg-zinc-100 transition"
                              title="Copy link"
                            >
                              {copiedUrl === url ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
