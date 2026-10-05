/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const lib = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/research/labels.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports:lib, Intl});
const ready = {decision:'chon_chinh', stage:'decided', readiness:'san_sang', passed_filters:true, failed_filters:[], missing_required:[], unknown_filters:[], decision_conflict:false};
test('three exhaustive groups; a research-ready product still needs a decision',()=>{
  assert.deepEqual(Array.from(lib.PIPELINE, g=>g.key), ['chon','theo_doi','loai']);
  assert.equal(lib.pipelineGroup(ready),'chon');
  assert.equal(lib.pipelineGroup({...ready,decision:null}),'theo_doi');
  assert.equal(lib.pipelineGroup({...ready,stage:'monitoring'}),'chon');
});
test('missing or conflicting evidence never becomes chosen',()=>{
  for (const patch of [{readiness:null},{readiness:'can_xac_minh'},{missing_required:['safety']},{unknown_filters:['hazmat']},{missing_required:null},{passed_filters:null},{decision_conflict:true}]) {
    assert.equal(lib.pipelineGroup({...ready,...patch}),'theo_doi');
  }
});
test('rejection and hard failure override selection and monitoring',()=>{
  for (const patch of [{decision:'khong_chon'},{stage:'filtered_out'},{readiness:'rot_loc_cung'},{failed_filters:['safety']}]) {
    assert.equal(lib.pipelineGroup({...ready,stage:'monitoring',...patch}),'loai');
  }
  assert.equal(lib.pipelineGroup({...ready,decision:null,stage:'deep_dive',readiness:'can_xac_minh'}),'theo_doi');
});
