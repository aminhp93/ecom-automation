# Creative Studio — workspace storage (15/10/2026)

UI: `/creative-studio`; store preview `/store-setup`. This is the application's storage contract, not the canonical creative playbook.

Business artifacts live outside the application repo:

- `../workspace/noctanest/project.json`: project identity and canonical-system links.
- `../workspace/noctanest/creative/angles.json`, `video-N/video.json`, and each video's input/instruction/output folders.
- `../workspace/noctanest/publishing/channels.json` and `posts.json`: brand channels and per-platform posts.
- `../workspace/noctanest/store/store-status.json`: store checklist.
- `../reference/blackout/reference.json`, competitor media and `store-benchmarks/`: shared references only.

`src/lib/workspace-paths.ts` maps legacy product id blackout-curtains to project noctanest. Other product IDs resolve to their own workspace directory; they never inherit Noctanest channels. GET `/api/creative-studio` reads working artifacts. POST `/api/creative-studio/action` writes reviews, selected approvals, posts and angle decisions within the selected project. It never publishes or sends messages.

GET `/api/creative-studio/file?path=...` serves only supported file types in workspace/reference, with Range. Metadata paths are relative to the dropship root. Legacy `blackout-curtains/video-N/...`, `blackout-curtains/reference/...` and `video-drafts/...` URLs are translated. Lexical traversal and realpath/symlink escapes are rejected. No data is duplicated in the application.

Version ordering is display order, not automatic approval. Each video.json retains its selected approval and review blockers. Existing publish eligibility checks remain in force.

The old `/creative` SceneBuilder UI documentation no longer describes the active Creative Studio. Historical layout/workflow drafts are in `../archive/2026-10-15/`. Canonical knowledge stays Confluence; research/results Supabase; canonical media Drive; code Git; tasks Jira.
