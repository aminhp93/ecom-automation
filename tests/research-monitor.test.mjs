import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, dueDay, dayVN } from '../src/lib/research/automation/engine.mjs';
import { createStore } from '../src/lib/research/automation/store.mjs';

const fixture = () => ({
  product: { product_id: 1, slug: 'test', score_version: 'v3', scored_on: '2026-10-13' },
  criteria: [{ version: 'v3', is_current: true }],
  amazon: [{ searches: 0, data_month: '2026-09', captured_on: '2026-10-13' }],
  trends: [{ market: 'AU', captured_on: '2026-10-13' }],
  decisions: [{ criteria_version: 'v3', decided_on: '2026-10-13' }],
  pages: [{ page_id: '1', matches_product: 'yes', advertisers: { name: 'Brand', kind: 'brand', advertiser_snapshots: [
    { captured_on: '2026-10-13', active_au: 76 }, { captured_on: '2026-10-12', active_au: 36 },
  ] } }],
  quotes: [{ ship_to: 'US', supplier: 'A' }, { ship_to: 'AU', supplier: 'CJ' }, { ship_to: 'AU', supplier: ' cj ' }],
});
test('schedule respects Vietnam midnight and 06:00 independently of machine timezone', () => {
  assert.equal(dayVN(new Date('2026-10-12T18:00:00Z')), '2026-10-13');
  assert.equal(dueDay(new Date('2026-10-12T22:59:59Z')), null);
  assert.equal(dueDay(new Date('2026-10-12T23:00:00Z')), '2026-10-13');
});
test('null is missing evidence, genuine zero is valid, future dates are invalid', () => {
  const input = fixture();
  assert.equal(evaluate(input, '2026-10-13').freshness[0].status, 'fresh');
  input.amazon[0].searches = null;
  assert.equal(evaluate(input, '2026-10-13').freshness[0].status, 'invalid');
  input.amazon[0].searches = 10;
  input.amazon[0].captured_on = '2027-01-01';
  assert.equal(evaluate(input, '2026-10-13').freshness[0].status, 'invalid');
});
test('recent fetch does not make an old data month fresh', () => {
  const input = fixture(); input.amazon[0].data_month = '2026-01';
  assert.equal(evaluate(input, '2026-10-13').freshness[0].status, 'invalid');
});
test('AU quote count deduplicates supplier names, does not imply gate approval', () => {
  const report = evaluate(fixture(), '2026-10-13');
  assert.equal(report.supplier_count_unverified, 1);
  assert.equal(report.gate_a, 'not_evaluated');
  assert.equal(report.collection_status, 'not_connected');
  assert.ok(report.tasks.some(t => t.key === 'economics'));
});
test('detects >50% changes and never interprets them as profit', () => {
  const report = evaluate(fixture(), '2026-10-13');
  assert.equal(report.changes[0].delta, 40);
  assert.ok(report.tasks.some(t => t.key === 'anomaly-1'));
});
test('missing/future score, mixed criteria and outdated decisions need review', () => {
  const input = fixture(); input.product.scored_on = null; input.decisions = [];
  const report = evaluate(input, '2026-10-13');
  assert.ok(report.tasks.some(t => t.key === 'score'));
  assert.ok(report.tasks.some(t => t.key === 'decision'));
});
test('read retries transient failures; permanent auth failures never retry or leak response', async () => {
  let calls = 0;
  const store = createStore({ url: 'https://test.invalid', key: 'secret', fetcher: async () => {
    calls++; return calls === 1 ? new Response('unavailable', { status: 503 }) : Response.json([]);
  } });
  assert.deepEqual(await store.request('products'), []);
  assert.equal(calls, 2);
  calls = 0;
  const denied = createStore({ url: 'https://test.invalid', key: 'secret', fetcher: async () => {
    calls++; return new Response('secret-content', { status: 401 });
  } });
  await assert.rejects(denied.request('products'), { message: 'Supabase HTTP 401 (products)' });
  assert.equal(calls, 1);
});
test('writes are not blindly retried after a potentially committed response', async () => {
  let calls = 0;
  const store = createStore({ url: 'https://test.invalid', key: 'secret', fetcher: async () => {
    calls++; throw new Error('connection lost');
  } });
  await assert.rejects(store.request('rpc/research_monitor_finish', {}));
  assert.equal(calls, 1);
});
