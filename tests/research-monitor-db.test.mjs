// Integration tests in a disposable local PostgreSQL cluster, never the user's database.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
const exec = promisify(execFile);

test('SQL claims, fencing, atomic completion, retries and read-only web roles', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'research-monitor-pg-'));
  const data = join(dir, 'data');
  const args = ['-h', dir, '-p', '55439', '-U', 'postgres', '-d', 'postgres', '-X', '-At', '-v', 'ON_ERROR_STOP=1'];
  const sql = input => execFileSync('psql', args, { input, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
  execFileSync('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale'], { stdio: 'pipe' });
  execFileSync('pg_ctl', ['-D', data, '-l', join(dir, 'postgres.log'), '-o', `-k ${dir} -p 55439 -c listen_addresses=''`, '-w', 'start'], { stdio: 'pipe' });
  try {
    sql('create role anon; create role authenticated; create role service_role; create table products(id bigint primary key); insert into products values (1);');
    sql(readFileSync('scripts/research/sql/2026-10-13_monitor_runs.sql', 'utf8'));
    const claim = "select id from research_monitor_claim(1,'2026-10-13','monitor-v1');";
    const results = await Promise.all([exec('psql', [...args,'-c',claim]), exec('psql', [...args,'-c',claim])]);
    assert.equal(results.filter(r => r.stdout.trim()).length, 1, 'only one worker owns the day');
    assert.equal(sql('select count(*) from research_monitor_runs'), '1');
    const id = sql('select id from research_monitor_runs');
    const oldToken = sql('select lease_token from research_monitor_runs');
    sql("update research_monitor_runs set lease_until=now()-interval '1 second'");
    sql(claim);
    const token = sql('select lease_token from research_monitor_runs');
    assert.notEqual(token, oldToken);
    assert.throws(() => sql(`select research_monitor_finish('${id}','${oldToken}',null,'late worker');`), /Lease lost/);
    const report = { product_id: 1, policy_version: 'monitor-v1', evaluated_on: '2026-10-13', summary: 'test', tasks: [{ key: 'quote', title: 'Quote', detail: 'Need evidence', kind: 'human' }] };
    sql(`set role service_role; select research_monitor_finish('${id}','${token}','${JSON.stringify(report)}',null);`);
    assert.equal(sql('select status from research_monitor_runs'), 'completed');
    assert.equal(sql('select count(*) from research_monitor_tasks'), '1');
    assert.equal(sql(claim), '', 'completed day is idempotent');
    assert.equal(sql('set role anon; select count(*) from research_monitor_runs').split('\n').at(-1), '1');
    assert.throws(() => sql(`set role anon; ${claim}`), /permission denied/);
    assert.throws(() => sql("set role anon; update research_monitor_tasks set status='resolved'"), /permission denied/);
    // Failed writes must roll back run status and all task mutations together.
    const next = "select id from research_monitor_claim(1,'2026-10-14','monitor-v1');";
    const secondId = sql(next);
    for (let i = 1; i <= 3; i++) {
      const lease = sql(`select lease_token from research_monitor_runs where id='${secondId}'`);
      if (i === 1) {
        const invalid = { ...report, evaluated_on: '2026-10-14', tasks: [{ ...report.tasks[0], kind: 'invalid' }] };
        assert.throws(() => sql(`select research_monitor_finish('${secondId}','${lease}','${JSON.stringify(invalid)}',null)`), /check constraint/);
        assert.equal(sql(`select status from research_monitor_runs where id='${secondId}'`), 'running');
      }
      sql(`select research_monitor_finish('${secondId}','${lease}',null,'network error')`);
      const reclaimed = sql(next);
      assert.equal(Boolean(reclaimed), i < 3);
    }
    assert.equal(sql(`select attempt from research_monitor_runs where id='${secondId}'`), '3');
  } finally {
    execFileSync('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop'], { stdio: 'pipe' });
  }
});
