'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DiscoveryConsole } from '@/components/discovery/DiscoveryConsole';
import { WorkflowTerminal } from '@/components/discovery/WorkflowTerminal';
import { ProductTable } from '@/components/discovery/ProductTable';
import { ProductDetailModal } from '@/components/discovery/ProductDetailModal';
import { WorkflowChatDrawer } from '@/components/chat/WorkflowChatDrawer';
import { Product, WorkflowEvent } from '@/lib/db/store';

export default function EcomOSDashboard() {
  const [currentStage, setCurrentStage] = useState('01');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isApprovingId, setIsApprovingId] = useState<string | undefined>(undefined);

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
        setProducts(pData.products || []);
        setFilteredProducts(pData.products || []);
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

  // Client-side Filter Handling
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
  const handleRunWorkflow = async (niche: string, sources: string[]) => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(5);
    setLogs([
      {
        id: 'start',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        stage: '01_PRODUCT_DISCOVERY',
        message: `Đang kết nối tới Workflow Engine SSE endpoint cho thị trường: "${niche}"...`,
      },
    ]);

    try {
      const response = await fetch('/api/workflows/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, sources }),
      });

      if (!response.body) {
        throw new Error('ReadableStream không được hỗ trợ bởi trình duyệt.');
      }

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

              if (event.type === 'search') {
                setProgress(20);
              } else if (event.type === 'found') {
                setProgress(40);
              } else if (event.type === 'ai_analyze') {
                setProgress((prev) => Math.min(85, prev + 10));
              } else if (event.type === 'score') {
                setProgress((prev) => Math.min(95, prev + 5));
                loadData(); // Update table dynamically as each item is scored
              } else if (event.type === 'done') {
                setProgress(100);
              }
            } catch (err) {
              console.warn('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          stage: '01_PRODUCT_DISCOVERY',
          message: `Lỗi luồng: ${err?.message || 'Unknown stream error'}`,
        },
      ]);
    } finally {
      setIsRunning(false);
      loadData();
    }
  };

  // Human Approval Gate: Approve Product for Stage 02
  const handleApproveProduct = async (productId: string) => {
    setIsApprovingId(productId);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: 'approved_for_validation' }),
      });

      if (res.ok) {
        await loadData();
        if (selectedProduct?.id === productId) {
          setSelectedProduct((prev) =>
            prev ? { ...prev, status: 'approved_for_validation' } : null
          );
        }
      }
    } catch (e) {
      console.error('Failed to approve product:', e);
    } finally {
      setIsApprovingId(undefined);
    }
  };

  return (
    <div className="flex h-screen bg-[#08090d] text-slate-100 overflow-hidden">
      {/* 12-Stage Pipeline Sidebar */}
      <Sidebar
        currentStage={currentStage}
        onSelectStage={(stage) => setCurrentStage(stage)}
        stats={stats}
        providers={providers}
      />

      {/* Main Orchestration Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onRefresh={loadData} isRefreshing={isRefreshing} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stage 01 Console: Inputs & Triggers */}
            <DiscoveryConsole
              onRunWorkflow={handleRunWorkflow}
              isRunning={isRunning}
              onFilterChange={handleFilterChange}
            />

            {/* Manus/Claude Code style Real-time Event Stream */}
            <WorkflowTerminal
              logs={logs}
              isRunning={isRunning}
              progress={progress}
            />

            {/* Matrix Table of Discovered Products */}
            <ProductTable
              products={filteredProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onApproveProduct={handleApproveProduct}
              isApprovingId={isApprovingId}
            />
          </div>
        </main>
      </div>

      {/* Deep Dive & Economics Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onApprove={handleApproveProduct}
        isApproving={isApprovingId === selectedProduct?.id}
      />

      {/* Embedded In-Workflow AI Chat Assistant */}
      <WorkflowChatDrawer />
    </div>
  );
}
