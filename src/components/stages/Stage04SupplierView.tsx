'use client';

import React from 'react';
import { Product } from '@/lib/db/store';
import { Play, Loader2, ArrowRight, Truck, DollarSign } from 'lucide-react';

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
  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">Chưa chọn sản phẩm</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để thẩm định nhà cung cấp.
        </p>
      </div>
    );
  }

  const sup = product.supplier_economics;

  return (
    <div className="space-y-4">
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
            Sản phẩm:{' '}
            <strong className="text-zinc-900">{product.name}</strong> (Giá bán: ${product.selling_price} | Landed: ${product.landed_cost})
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
                <span>Đang tính toán...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>{sup ? 'Tính Lại Chi Phí' : 'Thẩm Định Nhà Cung Cấp'}</span>
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

      {!sup ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Truck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">Thẩm định tuyến vận chuyển & Điểm hòa vốn</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            So sánh biểu phí thực tế giữa CJ Dropshipping, AliExpress và Đại lý 1688; đồng thời tính toán chỉ số Break-Even ROAS để kiểm soát ngân sách chạy ads.
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
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Break-Even ROAS</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {sup.break_even_roas}x
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">ROAS tối thiểu để không lỗ</div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Target Scale ROAS</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                {sup.target_roas}x
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Mục tiêu để có lợi nhuận ròng 30%</div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Dự Phóng 100 Đơn</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                +${sup.profit_projection_100_orders.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Gross Contribution</div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs font-mono">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Dự Phóng 500 Đơn</div>
              <div className="text-base font-bold text-zinc-900 mt-1">
                +${sup.profit_projection_500_orders.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Tối ưu chi phí sỉ theo quy mô</div>
            </div>
          </div>

          {/* Supplier Comparison Table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center justify-between">
              <span>Bảng So Sánh Các Tuyến Cung Ứng & Vận Chuyển</span>
              <span className="text-[10px] font-mono text-zinc-500">Sourcing Benchmark</span>
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
                    <th className="py-2.5 px-3.5 text-right">Độ Tin Cậy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {sup.suppliers.map((s, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition">
                      <td className="py-3 px-3.5 font-sans font-medium text-zinc-900">
                        {s.source}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-900">
                        ${s.unit_cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-zinc-600">{s.moq} đơn</td>
                      <td className="py-3 px-3 font-sans text-zinc-700">{s.shipping_method}</td>
                      <td className="py-3 px-3 text-zinc-600">${s.shipping_cost.toFixed(2)}</td>
                      <td className="py-3 px-3 font-sans text-zinc-800 font-medium">
                        {s.delivery_days}
                      </td>
                      <td className="py-3 px-3.5 text-right font-semibold text-zinc-900">
                        {s.reliability_rating}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
