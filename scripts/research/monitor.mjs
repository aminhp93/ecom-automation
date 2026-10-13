#!/usr/bin/env node
// Node >=22. No browser, paid API or model call. Uses existing Supabase snapshots.
import { setTimeout as delay } from 'node:timers/promises';
import { createStore } from '../../src/lib/research/automation/store.mjs';
import { evaluate, dueDay, dayVN, POLICY_VERSION } from '../../src/lib/research/automation/engine.mjs';

const flags = new Set(process.argv.slice(2));
if ([...flags].some(f => !['--preview','--once','--watch'].includes(f)) || flags.size !== 1) {
  console.error('Usage: node --env-file=.env.local scripts/research/monitor.mjs --preview|--once|--watch');
  process.exit(2);
}
const slug = 'blackout-curtains';
const reader = createStore();
if (flags.has('--preview')) {
  console.log(JSON.stringify(evaluate(await reader.load(slug)), null, 2));
} else {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Chưa bật worker: thiếu SUPABASE_SERVICE_ROLE_KEY phía server. Không dùng publishable key để ghi.');
    process.exit(2);
  }
  const writer = createStore({ key: process.env.SUPABASE_SERVICE_ROLE_KEY });
  async function tick(day) {
    const [product] = await reader.request(`products?select=id&slug=eq.${slug}`);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    const [run] = await writer.request('rpc/research_monitor_claim', {
      p_product_id: product.id, p_run_day: day, p_policy_version: POLICY_VERSION,
    });
    if (!run) return; // Already completed, leased, or retry limit exhausted.
    try {
      const input = await reader.load(slug);
      const result = evaluate(input, day);
      await writer.request('rpc/research_monitor_finish', { p_run_id: run.id, p_lease_token: run.lease_token, p_result: result, p_error: null });
      console.log(JSON.stringify({ run_id: run.id, status: 'completed', summary: result.summary, collection_status: result.collection_status }));
    } catch (error) {
      // Error messages from store never contain response bodies, credentials or request headers.
      await writer.request('rpc/research_monitor_finish', { p_run_id: run.id, p_lease_token: run.lease_token, p_result: null, p_error: error.message });
      throw error;
    }
  }
  if (flags.has('--once')) await tick(dayVN());
  else {
    console.log('Monitor worker: 06:00 Asia/Ho_Chi_Minh; audit snapshot; Meta/Topview collector chưa kết nối.');
    const abort = new AbortController();
    for (const signal of ['SIGTERM','SIGINT']) process.once(signal, () => abort.abort());
    while (!abort.signal.aborted) {
      try { const day = dueDay(); if (day) await tick(day); } catch (error) { console.error(error.message); }
      try { await delay(60000, undefined, { signal: abort.signal }); } catch { break; }
    }
  }
}
