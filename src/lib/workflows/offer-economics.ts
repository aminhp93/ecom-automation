import type { Product, OfferPackageItem } from "../db/store";
import { calculateFinancials } from "../tools/scoring";

/** Conservative baseline: shipping scales per unit; no uncosted gifts or invented wholesale discount. */
export function buildOfferPackages(product: Product): OfferPackageItem[] {
  const baseline = calculateFinancials(product);
  if (baseline.gross_margin <= 0)
    throw new Error("Không thể tạo offer từ sản phẩm có margin không dương.");
  const tiers = ["A", "B", "C"] as const;
  return tiers.map((tier, index) => {
    const quantity = index + 1;
    const variableCost =
      quantity * (baseline.supplier_price + baseline.shipping_cost);
    // Reserve 30% contribution BEFORE ads; fee 2.9% + $0.30, refunds 3%.
    const floor = (variableCost + 0.3) / (1 - 0.029 - 0.03 - 0.3);
    const proposed = baseline.selling_price * [1, 1.5, 2.2][index];
    const price = Math.ceil(Math.max(floor, proposed) * 100) / 100;
    const economics = calculateFinancials({
      supplier_price: quantity * baseline.supplier_price,
      shipping_cost: quantity * baseline.shipping_cost,
      selling_price: price,
    });
    if (economics.gross_margin <= 0)
      throw new Error("Offer không có contribution dương.");
    const reference = Math.round(quantity * baseline.selling_price * 100) / 100;
    const value = Math.max(price, reference);
    const percent = Math.round(((value - price) / value) * 10000) / 100;
    return {
      tier,
      quantity,
      name: `Gói ${quantity} sản phẩm`,
      price,
      value,
      savings: percent > 0 ? `Tiết kiệm ${percent}%` : "Không giảm giá",
      description:
        "Giá nháp theo chi phí hiện tại; shipping tính theo từng chiếc, chưa gồm thuế/phí vận hành.",
      items: [`${quantity}x ${product.name}`],
      estimated_cost: economics.landed_cost,
      contribution: economics.gross_margin,
      break_even_roas: Number((price / economics.gross_margin).toFixed(2)),
    };
  });
}
