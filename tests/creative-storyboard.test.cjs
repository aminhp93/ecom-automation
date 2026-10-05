/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const output = ts.transpileModule(fs.readFileSync('src/lib/creative/storyboard.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const lib = {};
vm.runInNewContext(output, { exports: lib, require, crypto: require('node:crypto').webcrypto });
const board = scenes => ({ version: 1, name: 'Test', ratio: '9:16', fit: 'contain', scenes });
test('fixed storyboard slots preserve intended total durations and unique ids', () => {
  for (const [name, count, length] of [['short', 5, 19], ['story', 8, 30], ['free', 1, 3]]) {
    const scenes = lib.templateScenes(name);
    assert.equal(scenes.length, count);
    assert.equal(scenes.reduce((n, s) => n + s.duration, 0), length);
    assert.equal(new Set(scenes.map(s => s.id)).size, count);
    assert.equal(lib.storyboardSchema.safeParse(board(scenes)).success, true);
  }
});
test('replacing with a short clip does not silently shrink fixed slot', () => {
  const s = { ...lib.makeScene('Mở đầu', 3), clipId: 'other', start: 2 };
  assert.match(lib.sceneIssue(s, 4), /không đủ dài/);
  assert.equal(s.duration, 3);
  assert.equal(lib.sceneIssue(s, 5), null);
});
test('missing media, invalid ranges, oversized timelines rejected', () => {
  assert.match(lib.sceneIssue(lib.makeScene(), 10), /Chưa chọn/);
  assert.match(lib.sceneIssue({ ...lib.makeScene(), clipId: 'a', start: -1 }, 10), /không hợp lệ/);
  for (const scenes of [[], Array.from({length: 61}, () => lib.makeScene('Khác', 1)), [lib.makeScene('Khác', 120), lib.makeScene('Khác', 120)], [{...lib.makeScene(), duration: NaN}]]) {
    assert.equal(lib.storyboardSchema.safeParse(board(scenes)).success, false);
  }
});
test('JSON roundtrip preserves selected footage, trim, audio and layout', () => {
  const original = board([{ ...lib.makeScene(), clipId: 'source.mp4:123:456', start: 4.2, muted: true }]);
  const restored = lib.storyboardSchema.parse(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(JSON.stringify(original)));
});
