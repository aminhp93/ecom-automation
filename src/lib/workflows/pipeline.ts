import {
  ecomStore,
  advanceStageStatus,
  type Product,
  type StageKey,
} from "../db/store";
import {
  competitorSchema,
  offerSchema,
  supplierSchema,
  validationSchema,
} from "./schemas";

const outputs = [
  "validation",
  "competitor_analysis",
  "supplier_economics",
  "offer_package",
  "creative_pack",
] as const;

/** Rechecked both before AI work and at commit. CONDITIONAL_GO permits draft research, not launch. */
export function assertStageReady(
  product: Product,
  stage: StageKey,
  override = false,
) {
  if (!["approved_for_validation", "testing"].includes(product.status)) {
    throw new Error(
      "Cần duyệt sản phẩm trước khi chạy workflow; sản phẩm bị loại không được chạy.",
    );
  }
  if (stage === "02") return;
  if (!product.validation) throw new Error("Cần hoàn thành Stage 02 trước.");
  // Legacy fallback results may have no reviews; only accept a valid analysis.
  validationSchema.parse(product.validation);
  if (
    product.validation.verdict === "NO_GO" &&
    !product.no_go_override &&
    !(stage === "03" && override === true)
  ) {
    throw new Error(
      "NO_GO: cần xác nhận override tại Stage 03 cho lần validation hiện tại.",
    );
  }
  if (Number(stage) >= 4) competitorSchema.parse(product.competitor_analysis);
  if (Number(stage) >= 5) supplierSchema.parse(product.supplier_economics);
  if (stage === "06") offerSchema.parse(product.offer_package);
}

/** Compare-and-swap prevents saving AI output calculated from an obsolete input snapshot. */
export function commitStage(
  snapshot: Product,
  stage: StageKey,
  change: (p: Product) => void,
  override = false,
): Product {
  const saved = ecomStore.updateProduct(
    snapshot.id,
    (p) => {
      assertStageReady(p, stage, override);
      const index = Number(stage) - 2;
      for (let i = index + 1; i < outputs.length; i++) delete p[outputs[i]];
      if (stage === "02") delete p.no_go_override;
      if (stage === "03")
        p.no_go_override =
          p.validation?.verdict === "NO_GO" && override === true;
      change(p);
      p.stage_status = advanceStageStatus(p.stage_status, stage);
      if (p.validation?.verdict === "NO_GO" && !p.no_go_override)
        p.stage_status["03"] = "locked";
    },
    snapshot.revision ?? 0,
  );
  if (!saved) throw new Error("Sản phẩm đã bị xóa.");
  return saved;
}
