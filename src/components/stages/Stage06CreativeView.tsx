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
  Target,
  Users,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";

interface Stage06CreativeViewProps {
  product: Product | null;
  onRunStage: () => void;
  isRunning: boolean;
  onGoToRoadmap?: () => void;
}

const AWARENESS_LABEL: Record<string, string> = {
  unaware: "Chưa biết vấn đề",
  problem_aware: "Biết vấn đề",
  solution_aware: "Biết loại giải pháp",
  product_aware: "Biết sản phẩm mình",
  most_aware: "Sẵn sàng mua",
};

type SubTab =
  | "angles"
  | "ugc"
  | "static"
  | "testplan"
  | "hooks"
  | "scripts"
  | "shopify";

export const Stage06CreativeView: React.FC<Stage06CreativeViewProps> = ({
  product,
  onRunStage,
  isRunning,
  onGoToRoadmap,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("angles");

  if (!product) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center shadow-2xs">
        <h3 className="text-xs font-medium text-zinc-900">Chưa chọn sản phẩm</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Vui lòng chọn sản phẩm đã duyệt để sản xuất hệ thống creative.
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

  const copyBtn = (id: string, text: string) => (
    <button
      onClick={() => handleCopy(id, text)}
      className="p-1.5 rounded-md border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition shrink-0"
      title="Copy"
    >
      {copiedId === id ? (
        <Check className="w-3.5 h-3.5 text-black" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );

  const tabs: { id: SubTab; label: string; show: boolean }[] = [
    { id: "angles", label: `Góc bán (${cr?.angle_briefs?.length ?? 0})`, show: !!cr?.angle_briefs?.length },
    { id: "ugc", label: `UGC Scripts (${cr?.ugc_scripts?.length ?? 0})`, show: !!cr?.ugc_scripts?.length },
    { id: "static", label: `Ảnh tĩnh (${cr?.static_concepts?.length ?? 0})`, show: !!cr?.static_concepts?.length },
    { id: "testplan", label: "Kế hoạch Test", show: !!cr?.test_plan },
    { id: "hooks", label: `Hooks (${cr?.viral_hooks.length ?? 0})`, show: !!cr && !cr.angle_briefs?.length },
    { id: "scripts", label: `Kịch bản Video (${cr?.video_scripts.length ?? 0})`, show: !!cr },
    { id: "shopify", label: "Trang Shopify", show: !!cr },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  const activeTab = visibleTabs.some((t) => t.id === subTab)
    ? subTab
    : visibleTabs[0]?.id;

  return (
    <div className="space-y-4">
      {!hasOffer && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-red-900">
          <Film className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">
              Cổng Kiểm Soát Pipeline: Thiếu Dữ Liệu Stage 05 (Offer Creation)
            </div>
            <div className="text-red-700 text-[11px] mt-0.5">
              Cần hoàn tất 3 tầng Offer và lời cam kết ở Stage 05 trước. Kịch bản
              và trang Shopify phụ thuộc vào cấu trúc ưu đãi này.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              Stage 06 • Creative System
            </span>
            <h1 className="text-sm font-semibold text-zinc-900">
              Angle-Driven Creative & Test Plan
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sản phẩm: <strong className="text-zinc-900">{product.name}</strong> (
            {product.niche})
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
              <span>Đang viết creative...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>{cr ? "Tạo Lại Creative System" : "Tạo Creative System"}</span>
            </>
          )}
        </button>
      </div>

      {!cr ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs">
          <Target className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-zinc-900">
            Sản xuất hệ thống creative theo góc bán
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Mỗi góc bán (từ Stage 01) → 1 UGC script + 3 hook A/B/C + concept ảnh
            tĩnh + cờ compliance. Kèm kế hoạch test: góc nào chạy trước, chia
            budget, kill rules, nhịp iterate.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Needs review banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900 flex items-center gap-2">
                  <span>Bản nháp — cần người duyệt</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-600 text-white font-medium">
                    NEEDS_REVIEW
                  </span>
                </div>
                <div className="text-amber-700 text-[11px] mt-0.5">
                  Hook fallback là khung — cần người viết trau. Rà mọi claim,
                  offer, điều kiện giao hàng và compliance trước khi chạy ads.
                </div>
              </div>
            </div>
            {onGoToRoadmap && (
              <button
                onClick={onGoToRoadmap}
                className="px-3 py-1.5 rounded-md bg-amber-700 text-white text-xs font-medium hover:bg-amber-800 transition shrink-0"
              >
                Roadmap V2 (Launch / Meta Ads) →
              </button>
            )}
          </div>

          {/* Sub tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200 text-xs w-fit">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-1 rounded-sm font-medium transition ${
                  activeTab === t.id
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ANGLES */}
          {activeTab === "angles" && cr.angle_briefs && (
            <div className="space-y-3">
              {cr.angle_briefs.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden"
                >
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                        Góc #{a.id}
                      </span>
                      <span className="font-semibold text-zinc-900 text-xs">
                        {a.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600">
                      {AWARENESS_LABEL[a.awareness_level] ?? a.awareness_level}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <Field icon={<Users className="w-3 h-3" />} label="Tệp khách" value={a.sub_audience} />
                    <Field label="Cảm xúc lõi" value={a.core_emotion} />
                    <Field label="Niềm tin cần phá" value={a.belief_to_shift} />
                    <Field label="Lời hứa" value={a.promise} />
                    <Field label="Bằng chứng phải có" value={a.proof_needed} />
                    <Field label="Format gợi ý" value={a.recommended_format} />
                    {a.source_evidence && (
                      <div className="sm:col-span-2">
                        <Field label="Nguồn (review/comment thật)" value={a.source_evidence} />
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      3 Hook A/B/C — test trong cùng góc
                    </div>
                    {a.hooks.map((h) => (
                      <div
                        key={h.variation}
                        className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                            <span className="px-1 py-0.2 rounded bg-white border border-zinc-200 text-zinc-800 font-semibold">
                              {h.variation}
                            </span>
                            <span className="uppercase">{h.platform}</span>
                          </div>
                          <div className="text-zinc-900 font-medium">
                            &ldquo;{h.spoken_hook}&rdquo;
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Frame 1: {h.visual_first_frame} · Overlay: &ldquo;
                            {h.on_screen_text}&rdquo;
                          </div>
                          <div className="text-[11px] text-zinc-400 italic">
                            Chặn scroll vì: {h.why_it_stops_scroll}
                          </div>
                        </div>
                        {copyBtn(`hk_${a.id}_${h.variation}`, h.spoken_hook)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* UGC SCRIPTS */}
          {activeTab === "ugc" && cr.ugc_scripts && (
            <div className="space-y-4">
              {cr.ugc_scripts.map((s, i) => (
                <div
                  key={i}
                  className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs"
                >
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-zinc-900 text-xs">
                        Góc: {s.angle_name} · {s.framework}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Persona: {s.creator_persona} · {s.target_length}
                      </div>
                    </div>
                    {copyBtn(
                      `ugc_${i}`,
                      [
                        `HOOK: ${s.hook_line}`,
                        ...s.scenes.map(
                          (sc) =>
                            `[${sc.time}]\nVisual: ${sc.visual}\nThoại: ${sc.spoken}\nOverlay: ${sc.on_screen_text}`,
                        ),
                        `CTA: ${s.cta_line}`,
                      ].join("\n\n"),
                    )}
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    {s.scenes.map((sc, j) => (
                      <div key={j} className="p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="font-mono">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
                            {sc.time}
                          </span>
                          <div className="text-[11px] text-zinc-500 mt-2">
                            Overlay:
                            <div className="text-zinc-900 font-medium italic mt-0.5">
                              &ldquo;{sc.on_screen_text}&rdquo;
                            </div>
                          </div>
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              Quay:
                            </span>
                            <div className="text-zinc-800 mt-0.5">{sc.visual}</div>
                          </div>
                          <div className="pt-1.5 border-t border-zinc-100">
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              Lời thoại:
                            </span>
                            <div className="text-zinc-900 mt-0.5">
                              &ldquo;{sc.spoken}&rdquo;
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 bg-zinc-50/60 border-t border-zinc-100 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400">
                        B-roll cần quay:
                      </span>
                      <ul className="list-disc list-inside text-zinc-700 mt-1">
                        {s.b_roll_shot_list.map((b, k) => (
                          <li key={k}>{b}</li>
                        ))}
                      </ul>
                    </div>
                    {s.compliance_flags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-amber-600 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Cờ compliance
                        </span>
                        {s.compliance_flags.map((f, k) => (
                          <div
                            key={k}
                            className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px]"
                          >
                            <div className="text-amber-900">
                              <strong>Rủi ro:</strong> &ldquo;{f.claim}&rdquo; — {f.risk}
                            </div>
                            <div className="text-amber-800 mt-0.5">
                              <strong>Viết lại:</strong> {f.compliant_rewrite}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-zinc-600">
                      <strong>CTA:</strong> {s.cta_line}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATIC CONCEPTS */}
          {activeTab === "static" && cr.static_concepts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cr.static_concepts.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                      Góc #{c.angle_id}
                    </span>
                    <span className="uppercase">{c.format.replace("_", " ")}</span>
                  </div>
                  <div className="text-zinc-800">{c.concept}</div>
                  <div className="pt-1.5 border-t border-zinc-100">
                    <div className="font-semibold text-zinc-900">{c.headline}</div>
                    <div className="text-zinc-600 mt-0.5">{c.primary_text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TEST PLAN */}
          {activeTab === "testplan" && cr.test_plan && (
            <div className="space-y-3">
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-900">
                  <FlaskConical className="w-4 h-4 text-zinc-500" />
                  Kế hoạch test
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <Stat label="Góc chạy trước" value={`#${cr.test_plan.first_angle_id}`} />
                  <Stat label="Budget / ad set / ngày" value={`$${cr.test_plan.daily_budget_per_ad_set}`} />
                  <Stat label="Số ad set" value={String(cr.test_plan.ad_set_count)} />
                  <Stat label="Cửa sổ test" value={`${cr.test_plan.test_window_days} ngày`} />
                </div>
                <p className="text-zinc-600 leading-relaxed">
                  <strong>Vì sao góc này trước:</strong>{" "}
                  {cr.test_plan.first_angle_rationale}
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs text-xs">
                <div className="font-semibold text-zinc-900 mb-2">Kill rules</div>
                <div className="space-y-1.5">
                  {cr.test_plan.kill_rules.map((r, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-zinc-50 border border-zinc-200 rounded-md p-2"
                    >
                      <div className="text-zinc-900 font-medium">{r.metric}</div>
                      <div className="text-red-700 font-mono">{r.threshold}</div>
                      <div className="text-zinc-600">→ {r.action}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-zinc-600">
                  <p><strong>Scale:</strong> {cr.test_plan.scale_rule}</p>
                  <p><strong>Iterate:</strong> {cr.test_plan.iteration_note}</p>
                </div>
              </div>

              {cr.compliance_summary && cr.compliance_summary.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4" /> Compliance nền tảng cho ngành này
                  </div>
                  <ul className="list-disc list-inside text-amber-800 space-y-1">
                    {cr.compliance_summary.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* LEGACY HOOKS */}
          {activeTab === "hooks" && (
            <div className="space-y-2.5">
              {cr.viral_hooks.map((h) => (
                <div
                  key={h.id}
                  className="bg-white border border-zinc-200 rounded-lg p-3 flex items-start justify-between gap-3 shadow-2xs text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      #{h.id} {h.angle} · {h.category}
                    </span>
                    <div className="text-zinc-900 font-medium text-sm leading-snug">
                      &ldquo;{h.hook_text}&rdquo;
                    </div>
                  </div>
                  {copyBtn(`hook_${h.id}`, h.hook_text)}
                </div>
              ))}
            </div>
          )}

          {/* VIDEO SCRIPTS */}
          {activeTab === "scripts" && (
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
                        {sc.framework} • {sc.target_length}
                      </div>
                    </div>
                    {copyBtn(
                      `script_${sIdx}`,
                      sc.scenes
                        .map(
                          (sn) =>
                            `[${sn.time}]\nVisual: ${sn.visual}\nVoiceover: ${sn.audio}\nOverlay: ${sn.text_overlay}`,
                        )
                        .join("\n\n"),
                    )}
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    {sc.scenes.map((sn, snIdx) => (
                      <div
                        key={snIdx}
                        className="p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3"
                      >
                        <div className="font-mono">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
                            {sn.time}
                          </span>
                          <div className="text-[11px] text-zinc-500 mt-2">
                            Overlay:
                            <div className="text-zinc-900 font-medium italic mt-0.5">
                              &ldquo;{sn.text_overlay}&rdquo;
                            </div>
                          </div>
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              B-Roll:
                            </span>
                            <div className="text-zinc-800 mt-0.5">{sn.visual}</div>
                          </div>
                          <div className="pt-1.5 border-t border-zinc-100">
                            <span className="text-[10px] font-mono uppercase text-zinc-400">
                              Voiceover:
                            </span>
                            <div className="text-zinc-900 mt-0.5">
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

          {/* SHOPIFY */}
          {activeTab === "shopify" && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Shopify Hero
                </span>
                <h2 className="text-base font-bold text-zinc-900">
                  {cr.shopify_page.headline}
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {cr.shopify_page.subheadline}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cr.shopify_page.benefits.map((b, bIdx) => (
                  <div
                    key={bIdx}
                    className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-1 text-xs"
                  >
                    <div className="font-semibold text-zinc-900">✓ {b.title}</div>
                    <p className="text-zinc-600 leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3 text-xs">
                <div className="font-semibold text-zinc-900">FAQs</div>
                {cr.shopify_page.faqs.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-1"
                  >
                    <div className="font-semibold text-zinc-900">Q: {f.q}</div>
                    <div className="text-zinc-600 leading-relaxed">A: {f.a}</div>
                  </div>
                ))}
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
                  <span>HTML mô tả sản phẩm</span>
                  {copyBtn("shopify_html", cr.shopify_page.html_description)}
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

const Field = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div>
    <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className="text-zinc-800 mt-0.5">{value}</div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2">
    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
      {label}
    </div>
    <div className="text-sm font-bold text-zinc-900 mt-0.5">{value}</div>
  </div>
);
