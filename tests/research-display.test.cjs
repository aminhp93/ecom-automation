/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const output = ts.transpileModule(fs.readFileSync('src/lib/research/display.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject });
const { advertiserCounts, latestPer } = exportsObject;
test('new weekly zero supersedes older detailed counts, fields selected independently', () => {
 const result = advertiserCounts([{ captured_on: '2026-09-27', countries: { AU: 69, ALL: 78 } }], [{ captured_on: '2026-09-28', active_au: 0, active_all: null }]);
 assert.equal(result.au, 0); assert.equal(result.all, 78); assert.equal(result.auDate, '2026-09-28');
});
test('new detailed scan supersedes snapshot and missing counts remain unknown', () => {
 assert.equal(advertiserCounts([{ captured_on: '2026-09-29', countries: { AU: 134 } }], [{ captured_on: '2026-09-28', active_au: 69 }]).au, 134);
 assert.equal(advertiserCounts([], []).au, null);
});
test('latest win retained per market without replacing AU with newer US', () => {
 const rows = latestPer([{ market: 'AU', captured_on: '2026-09-27' }, { market: 'US', captured_on: '2026-09-29' }, { market: 'AU', captured_on: '2026-09-26' }], x => x.market);
 assert.equal(rows.find(x => x.market === 'AU').captured_on, '2026-09-27');
 assert.equal(latestPer([{ market: 'US', captured_on: '2026-09-29' }], x => x.market).find(x => x.market === 'AU'), undefined);
});
