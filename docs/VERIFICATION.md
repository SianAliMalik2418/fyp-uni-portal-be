# Backend verification

Install Bun, Node.js and MongoDB, then run `bun install --frozen-lockfile` from `BE/`.
Mongo integration tests use `127.0.0.1:27017`. They create unique disposable databases
and remove them after the run. No production credentials or Gemini access are needed.

`bun run verify` runs the build, test typecheck, lint, formatting check, fast tests and
Mongo integration tests. It stops at the first failure.

```sh
bun run test                         # no MongoDB required
bun run test:integration             # real MongoDB required
bun run typecheck:tests              # typecheck tests and Vitest configurations
bun run test src/routes/auth.routes.test.ts
```

Integration tests use `*.integration.test.ts`. Keep them out of the default fast suite
and include them in the complete verification loop. Tests must create a unique database
and remove only that database during teardown. Do not share the fixed demo database
between tests or worktrees.

The e2e seed requires `NODE_ENV=test` and a database named `fyp_uni_portal_e2e`, optionally
followed by an underscore and a 32-character lowercase hexadecimal run ID. It drops that
database before seeding. `bun run seed:e2e --cleanup` drops the same guarded target without
recreating fixtures. Set `MONGODB_URI` to the exact disposable target when using either
command. The frontend full-stack runner supplies these settings automatically.

For final browser verification, run `bun run test:e2e:full` from the sibling `FE/` checkout.
That runner starts the backend, seeds isolated fixtures, builds and serves the frontend,
checks persisted results across roles, and asks the e2e backend runner to clean up its
guarded database and upload directory when Playwright stops the API server. See
[the frontend README](../../FE/README.md) for browser installation, concurrent ports and
traces.

Performance regressions should assert response behavior alongside database command counts
or returned record sizes. Use deterministic multi-student fixtures and avoid elapsed-time
thresholds in unit tests. Preserve authorization, filtering, rounding and missing-record
semantics while changing query structure.
