'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DiscoveryConsole } from '@/components/discovery/DiscoveryConsole';
import { WorkflowTerminal } from '@/components/discovery/WorkflowTerminal';
import { ProductTable } from '@/components/discovery/ProductTable';
import { ProductDetailModal } from '@/components/discovery/ProductDetailModal';
import { WorkflowChatDrawer } from '@/components/chat/WorkflowChatDrawer';

// Stage Views
import { Stage02ValidationView } from '@/components/stages/Stage02ValidationView';
import { Stage03CompetitorView } from '@/components/stages/Stage03CompetitorView';
import { Stage04SupplierView } from '@/components/stages/Stage04SupplierView';
import { Stage05OfferView } from '@/components/stages/Stage05OfferView';
import { Stage06CreativeView } from '@/components/stages/Stage06CreativeView';
import { AddCustomProductModal } from '@/components/discovery/AddCustomProductModal';
import { AiTokenAuditModal } from '@/components/modals/AiTokenAuditModal';

import { Product, WorkflowEvent } from '@/lib/db/store';
import { errorMessage } from '@/lib/errors';
import { ChevronRight, Package, Sparkles, Plus } from 'lucide-react';

export default function EcomOSDashboard() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState('01');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeWorkingProductId, setActiveWorkingProductId] = useState<string>('');
  const [isApprovingId, setIsApprovingId] = useState<string | undefined>(undefined);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [isTokenAuditOpen, setIsTokenAuditOpen] = useState(false);

  // Workflow Execution & Streaming State
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<WorkflowEvent[]>([]);

  // System Stats
  const [stats, setStats] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load products & stats on mount
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, statsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stats'),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        const list: Product[] = pData.products || [];
        setProducts(list);
        setFilteredProducts(list);

        // Auto-select first approved product as default working product if none selected
        if (list.length > 0) {
          const approved = list.find((p) => p.status === 'approved_for_validation') || list[0];
          setActiveWorkingProductId((prev) => prev || approved.id);
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
        setProviders(sData.providers);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeWorkingProduct = products.find((p) => p.id === activeWorkingProductId) || products[0] || null;

  // Filter Handling for Stage 01
  const handleFilterChange = ({
    query,
    status,
    minScore,
  }: {
    query: string;
    status: string;
    minScore: number;
  }) => {
    let result = [...products];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.wow_factor.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      result = result.filter((p) => p.status === status);
    }

    if (minScore > 0) {
      result = result.filter((p) => p.product_score >= minScore);
    }

    setFilteredProducts(result);
  };

  // Run Stage 01 Discovery with SSE Streaming
  const handleRunDiscovery = async (niche: string, sources: string[]) => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(5);
    setLogs([
      {
        id: 'start',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        stage: '01_PRODUCT_DISCOVERY',
        message: `Đang kết nối tới Workflow Engine SSE cho thị trường: "${niche}"...`,
      },
    ]);

    try {
      const response = await fetch('/api/workflows/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, sources }),
      });

      if (!response.body) throw new Error('SSE stream không hỗ trợ');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event: WorkflowEvent = JSON.parse(trimmed.slice(6));
              setLogs((prev) => [...prev, event]);

              if (event.type === 'search') setProgress(25);
              else if (event.type === 'found') setProgress(45);
              else if (event.type === 'ai_analyze') setProgress((prev) => Math.min(85, prev + 10));
              else if (event.type === 'score') {
                setProgress((prev) => Math.min(95, prev + 5));
                loadData();
              } else if (event.type === 'done') setProgress(100);
            } catch (err) {
              console.warn('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (err: unknown) {
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          stage: '01_PRODUCT_DISCOVERY',
          message: `Lỗi luồng: ${errorMessage(err, 'Unknown stream error')}`,
        },
      ]);
    } finally {
      setIsRunning(false);
      loadData();
    }
  };

  // Run Stages 02 -> 06 with Strict Preflight Gating & SSE Runner
  const handleRunStage = async (stageNum: string, allowNoGoOverride = false) => {
    if (isRunning || !activeWorkingProduct) return;

    // Strict Pipeline Pre-flight Gating
    if (stageNum === '02') {
      if (activeWorkingProduct.status === 'rejected') {
        alert('Sản phẩm này đã bị loại (Rejected). Không thể chạy xác thực Stage 02.');
        return;
      }
    } else if (stageNum === '03') {
      if (!activeWorkingProduct.validation) {
        alert('❌ Cổng Gating Chặn: Bạn cần hoàn thành Stage 02 (Validation) trước khi chạy Stage 03.');
        return;
      }
      if (activeWorkingProduct.validation.verdict === 'NO_GO' && !allowNoGoOverride) {
        alert('❌ Cổng Gating Chặn: Sản phẩm nhận phán quyết NO_GO ở Stage 02. Hãy tích chọn "Bỏ qua phán quyết NO_GO" nếu bạn vẫn muốn tiếp tục.');
        return;
      }
    } else if (stageNum === '04') {
      if (!activeWorkingProduct.competitor_analysis) {
        alert('❌ Cổng Gating Chặn: Bạn cần hoàn thành Stage 03 (Competitor Research) trước khi thẩm định nhà cung cấp.');
        return;
      }
    } else if (stageNum === '05') {
      if (!activeWorkingProduct.competitor_analysis || !activeWorkingProduct.supplier_economics) {
        alert('❌ Cổng Gating Chặn: Stage 05 yêu cầu dữ liệu của cả Stage 03 (Competitor) và Stage 04 (Supplier).');
        return;
      }
    } else if (stageNum === '06') {
      if (!activeWorkingProduct.offer_package) {
        alert('❌ Cổng Gating Chặn: Bạn cần hoàn thành Stage 05 (Offer Creation) trước khi sản xuất kịch bản và trang Shopify.');
        return;
      }
    }

    setIsRunning(true);
    setProgress(15);
    setLogs([
      {
        id: `start_stg_${stageNum}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        stage: `STAGE_${stageNum}`,
        message: `Khởi chạy Stage ${stageNum} cho sản phẩm: "${activeWorkingProduct.name}"...`,
      },
    ]);

    try {
      const response = await fetch('/api/workflows/run-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeWorkingProduct.id,
          stage: stageNum,
          allowNoGoOverride,
        }),
      });

      if (!response.body) throw new Error('SSE stream không hỗ trợ');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event: WorkflowEvent = JSON.parse(trimmed.slice(6));
              setLogs((prev) => [...prev, event]);

              if (event.type === 'search') setProgress(40);
              else if (event.type === 'ai_analyze') setProgress(75);
              else if (event.type === 'score') {
                setProgress(90);
                loadData();
              } else if (event.type === 'done') setProgress(100);
            } catch (err) {
              console.warn('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (err: unknown) {
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          stage: `STAGE_${stageNum}`,
          message: `Lỗi luồng: ${errorMessage(err, 'Error')}`,
        },
      ]);
    } finally {
      setIsRunning(false);
      loadData();
    }
  };

  // Human Approval Gate: Approve Product for Stage 02
  const handleApproveProduct = async (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (targetProduct && (targetProduct.recommendation === 'KILL' || targetProduct.product_score < 68)) {
      const proceed = window.confirm(
        `⚠️ CẢNH BÁO PIPELINE GATING:\n\nSản phẩm "${targetProduct.name}" có điểm số thấp (${targetProduct.product_score}/100) và khuyến nghị ${targetProduct.recommendation}.\n\nBạn có chắc chắn muốn bỏ qua khuyến nghị để phê duyệt sản phẩm này vào Stage 02 không?`
      );
      if (!proceed) return;
    }

    setIsApprovingId(productId);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: 'approved_for_validation' }),
      });

      if (res.ok) {
        await loadData();
        setActiveWorkingProductId(productId);
        // Automatically take user to Stage 02
        setCurrentStage('02');
      }
    } catch (e) {
      console.error('Failed to approve product:', e);
    } finally {
      setIsApprovingId(undefined);
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa] text-zinc-900 overflow-hidden">
      {/* 6-Stage Core V1 + Roadmap Sidebar */}
      <Sidebar
        currentStage={currentStage}
        onSelectStage={(stage) => (stage === '01' ? router.push('/research') : setCurrentStage(stage))}
        activeProduct={activeWorkingProduct}
        stats={stats}
        providers={providers}
        onOpenTokenAudit={() => setIsTokenAuditOpen(true)}
      />

      {/* Main Orchestration Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onRefresh={loadData} isRefreshing={isRefreshing} />

        {/* Global Active Product Selector Bar (for Stage 02 and beyond) */}
        {currentStage !== '01' && (
          <div className="px-5 py-2.5 bg-white border-b border-zinc-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 font-medium">Sản phẩm đang chọn:</span>
                <select
                  value={activeWorkingProductId}
                  onChange={(e) => setActiveWorkingProductId(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium px-2 py-1 rounded focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.status === 'approved_for_validation' ? '✓ (Approved)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomOpen(true)}
                className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium flex items-center gap-1 border border-zinc-200 transition"
              >
                <Plus className="w-3 h-3" />
                <span>+ Thêm sản phẩm mới</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <span>Giai đoạn {currentStage} / 06 (Core V1 Pipeline)</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Realtime Terminal Console */}
            <WorkflowTerminal
              logs={logs}
              isRunning={isRunning}
              progress={progress}
            />

            {/* STAGE 01: Product Discovery */}
            {currentStage === '01' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Stage 01 đã chuyển sang <b>Market Research</b> (số liệu thật từ Supabase, bộ tiêu chí có phiên bản, hồ sơ từng SP).
                    Phần Discovery bên dưới dùng dữ liệu mẫu/AI — không dùng để ra quyết định.
                  </span>
                  <Link href="/research" className="px-2.5 py-1 rounded-md bg-zinc-900 text-white font-medium">Mở Market Research →</Link>
                </div>
                <DiscoveryConsole
                  onRunWorkflow={handleRunDiscovery}
                  isRunning={isRunning}
                  onFilterChange={handleFilterChange}
                  onOpenAddCustom={() => setIsAddCustomOpen(true)}
                />
                <ProductTable
                  products={filteredProducts}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onApproveProduct={handleApproveProduct}
                  isApprovingId={isApprovingId}
                  onGoToStage02={(productId) => {
                    setActiveWorkingProductId(productId);
                    setCurrentStage('02');
                  }}
                />
              </>
            )}

            {/* STAGE 02: Product Validation */}
            {currentStage === '02' && (
              <Stage02ValidationView
                product={activeWorkingProduct}
                onRunStage={() => handleRunStage('02')}
                isRunning={isRunning}
                onProceedToNext={() => setCurrentStage('03')}
              />
            )}

            {/* STAGE 03: Competitor Research */}
            {currentStage === '03' && (
              <Stage03CompetitorView
                product={activeWorkingProduct}
                onRunStage={(override) => handleRunStage('03', override)}
                isRunning={isRunning}
                onProceedToNext={() => setCurrentStage('04')}
              />
            )}

            {/* STAGE 04: Supplier Validation */}
            {currentStage === '04' && (
              <Stage04SupplierView
                product={activeWorkingProduct}
                onRunStage={() => handleRunStage('04')}
                isRunning={isRunning}
                onProceedToNext={() => setCurrentStage('05')}
              />
            )}

            {/* STAGE 05: Offer Creation (Claude Sonnet 4.5) */}
            {currentStage === '05' && (
              <Stage05OfferView
                product={activeWorkingProduct}
                onRunStage={() => handleRunStage('05')}
                isRunning={isRunning}
                onProceedToNext={() => setCurrentStage('06')}
              />
            )}

            {/* STAGE 06: Creative & Store Page Engine (Claude Sonnet 4.5) */}
            {currentStage === '06' && (
              <Stage06CreativeView
                product={activeWorkingProduct}
                onRunStage={() => handleRunStage('06')}
                isRunning={isRunning}
                onGoToRoadmap={() => setCurrentStage('07')}
              />
            )}

            {/* STAGES 07 - 12: Planned Future Stages (Roadmap V2) */}
            {['07', '08', '09', '10', '11', '12'].includes(currentStage) && (
              <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs space-y-2">
                <Sparkles className="w-8 h-8 text-zinc-400 mx-auto" />
                <h2 className="text-sm font-semibold text-zinc-900">
                  Stage {currentStage}: Roadmap V2 & V3
                </h2>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Giai đoạn này thuộc phần mở rộng (Meta Ads API Integration, Shopify Live Sync, và Autonomous Analytics Optimization) sau khi bạn hoàn tất kiểm thử bộ công cụ V1 (Stages 01 - 06).
                </p>
                <button
                  onClick={() => setCurrentStage('06')}
                  className="mt-3 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-800 text-xs font-medium hover:bg-zinc-200 transition"
                >
                  Quay lại Stage 06
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onApprove={handleApproveProduct}
        isApproving={isApprovingId === selectedProduct?.id}
        onGoToStage02={(productId) => {
          setActiveWorkingProductId(productId);
          setSelectedProduct(null);
          setCurrentStage('02');
        }}
      />

      {/* Add Custom Product Modal */}
      <AddCustomProductModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        onProductCreated={(newProd) => {
          setProducts((prev) => [newProd, ...prev]);
          setFilteredProducts((prev) => [newProd, ...prev]);
          setActiveWorkingProductId(newProd.id);
          // Auto switch to Stage 02
          setCurrentStage('02');
        }}
      />

      {/* AI Token & Cost Audit Modal */}
      <AiTokenAuditModal
        isOpen={isTokenAuditOpen}
        onClose={() => setIsTokenAuditOpen(false)}
        stats={stats}
      />

      {/* Embedded In-Workflow AI Chat Assistant */}
      <WorkflowChatDrawer />
    </div>
  );
}
