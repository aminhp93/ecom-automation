# Research monitor runtime

Implemented scope: deterministic daily audit of existing Supabase snapshots for
`blackout-curtains`. No paid requests. No automatic product decisions. No fresh
Topview/Meta collection yet. This is the first layer of the autonomous system,
not the complete market research agent.

## Read-only preview (works with current credentials)

Node 22+, from the repo root:

```sh
npm run research:preview
```

The web page `/market-research/operations` reads the same evaluator. It labels
on-demand previews separately from persisted worker runs. An empty/unavailable
run history must never be presented as a running scheduler.

## Activate persistent execution

1. Apply `sql/2026-10-13_monitor_runs.sql` to the project as database owner.
   This adds three tables and two service-role-only RPCs, without changing
   existing products, market snapshots, criteria or decisions.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in the worker's local environment, alongside
   `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Never use a `NEXT_PUBLIC_` name.
   Do not paste credentials into chat or commit them. Prefer worker-only env.
3. Run `npm run research:once`; confirm the run and task rows in Operations.
4. Run `npm run research:worker` under the chosen process supervisor. The worker
   must remain running; the web server does not execute schedules. No supervisor
   has been installed or activated by this change.

The worker checks every minute, runs once per Vietnam calendar day after 06:00,
and catches up for the current day on restart. Historical missed days are not
backfilled. Sunday is included for unattended monitoring (no human work implied).
Claims are unique on product/day/policy version. A 10-minute lease fences stale
workers; failures/expired leases can retry up to three attempts. Successful runs
are immutable through the RPC. Whole audits restart on retry; no external
collection side effects exist in this version. Finish and task reconciliation
are atomic. Read requests have a 15-second timeout and bounded retry. SQL writes
are not automatically retried after ambiguous network failure.

Tasks are deduplicated by product/key. Research checks resolve when absent from
the next successful report. Human tasks remain open: their verification and
approval workflow is not implemented yet. Never equate their presence with a
rejected product or their absence with Gate A approval.

## Tests

```sh
npm run test:research-monitor
node --test tests/research-monitor-db.test.mjs
```

The SQL integration test requires local `initdb`, `pg_ctl`, `psql`. It creates
and shuts down an isolated cluster in the OS temporary directory, using only a
Unix socket; it does not touch the live database.

## Remaining integrations

- Authorized write connection / migration deployment.
- Source adapters for Topview and Meta, with provenance, SKU/market validation,
  monthly data deduplication and per-source cost limits before paid calls.
- Process supervisor and heartbeat for unattended operation.
- Evidence-backed resolution of human tasks, review of recommendations and
  Product Brief handoff. The existing products/decisions remain authoritative.
- New product discovery after the selected-product flow is working end-to-end.

Source facts are not stored in local files. Research workflow documentation
continues to live in Confluence; this file documents only the code runtime.
