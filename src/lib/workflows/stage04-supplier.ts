import { ecomStore, Product, WorkflowEvent, SupplierEconomics } from '../db/store';

export type EventCallback = (event: WorkflowEvent) => void;

export interface SupplierWorkflowOptions {
  productId: string;
  onEvent?: EventCallback;
}

export async function runSupplierValidationWorkflow(
  options: SupplierWorkflowOptions
): Promise<{ product: Product; supplierEconomics: SupplierEconomics }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }

  const emit = (type: WorkflowEvent['type'], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: '04_SUPPLIER_VALIDATION',
      message,
      data,
    };
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  emit('info', `🚀 Bắt đầu Stage 04: Thẩm định nhà cung cấp & Tính toán hòa vốn cho "${product.name}"...`);

  emit('search', `🔎 So sánh biểu phí và độ uy tín từ CJ Dropshipping, AliExpress, và Đại lý 1688...`);
  await new Promise((r) => setTimeout(r, 600));

  const sup1Cost = Number(product.supplier_price.toFixed(2));
  const sup2Cost = Number((product.supplier_price * 1.08).toFixed(2));
  const sup3Cost = Number((product.supplier_price * 0.65).toFixed(2)); // Wholesale / 1688 price

  const supplierData: SupplierEconomics = {
    suppliers: [
      {
        source: 'CJ Dropshipping',
        unit_cost: sup1Cost,
        moq: 1,
        shipping_method: 'CJPacket Fast Line',
        shipping_cost: Number((product.shipping_cost * 0.95).toFixed(2)),
        delivery_days: '7-11 ngày',
        reliability_rating: 95,
      },
      {
        source: 'AliExpress Direct',
        unit_cost: sup2Cost,
        moq: 1,
        shipping_method: 'AliExpress Standard',
        shipping_cost: product.shipping_cost,
        delivery_days: '10-15 ngày',
        reliability_rating: 88,
      },
      {
        source: '1688 Agent / Sourcing',
        unit_cost: sup3Cost,
        moq: 50,
        shipping_method: 'YunExpress Dedicated',
        shipping_cost: Number((product.shipping_cost * 0.88).toFixed(2)),
        delivery_days: '6-9 ngày',
        reliability_rating: 97,
      },
    ],
    break_even_roas: Number((product.selling_price / product.gross_margin).toFixed(2)),
    target_roas: Number(((product.selling_price / product.gross_margin) * 1.6).toFixed(2)),
    profit_projection_100_orders: Math.round(product.gross_margin * 100),
    profit_projection_500_orders: Math.round(product.gross_margin * 500 * 1.15), // Higher margin at scale
  };

  emit('found', `✓ Đã tính xong: Điểm hòa vốn Break-Even ROAS là ${supplierData.break_even_roas}.`);

  emit(
    'score',
    `🏆 Dự phóng lợi nhuận: 100 đơn = $${supplierData.profit_projection_100_orders} | 500 đơn = $${supplierData.profit_projection_500_orders}.`,
    { supplierEconomics: supplierData }
  );

  product.supplier_economics = supplierData;
  ecomStore.saveProduct(product);

  emit('done', `🎉 Hoàn thành Stage 04! Sẵn sàng tạo các gói Offer chuyển đổi cao ở Stage 05.`);

  return { product, supplierEconomics: supplierData };
}
