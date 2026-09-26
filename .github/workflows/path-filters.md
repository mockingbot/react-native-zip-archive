# CI path filters

Heavy workflows use [`dorny/paths-filter`](https://github.com/dorny/paths-filter) with [`.github/path-filters.yml`](../path-filters.yml):

1. Every push still **starts** the workflow (so `concurrency: cancel-in-progress` can stop an outdated run).
2. A cheap `changes` job decides whether native/E2E work is needed.
3. Expensive jobs run only when the matching filter is `true`, or on `workflow_dispatch`.

| Filter | Typical workflows |
|--------|-------------------|
| `native` | Android Build, iOS Build, E2E, Old Architecture |
| `interop` | Zip Interop |
| `js` | JS Tests (Jest) |

Documentation (`*.md`, `AGENTS.md`, `CLAUDE.md`, docs-sync script, pre-commit) does **not** match `native` / `e2e`. `package.json` alone does not trigger native/E2E (it does trigger JS Tests + Zip Interop). Peer bumps that need a native rebuild should include a native/JS file change, or use **Run workflow**.
