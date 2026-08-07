# Agent Instructions

## Package Management

- Use Bun for package management and package execution in this repo.
- Prefer `bun install`, `bun add`, `bun add -d`, and `bunx --bun`.
- Do not use npm, pnpm, or yarn unless the user explicitly asks for it.
- Keep `bun.lock` as the package lockfile.

## Backend Architecture

- Follow the existing MVC layout under `src`.
- Keep request handlers in `controllers`, route registration in `routes`, persistence models in `models`, request validation in `validators`, reusable business logic in `services`, and Express middleware in `middlewares`.
- Validate request input with Zod before business logic.
- Keep authentication, authorization, audit logging, and AI access checks on the backend.
- Never expose `GEMINI_API_KEY`, JWT secrets, database URIs, or refresh tokens to the frontend.

## API Rules

- Use Express routes under `/api`.
- Return JSON responses with predictable shapes.
- Use centralized error handling through `middlewares/error.middleware.ts`.
- Use secure HTTP-only cookies for refresh tokens when auth is implemented.
- Keep Gemini access read-only and scoped to approved student/user data.

## Verification

- After backend changes, run the relevant Bun-backed scripts, such as `bun run test`, `bun run build`, `bun run lint`, and `bun run format:check`.

## Testing Guidelines

- Add or update tests for meaningful behavior changes. Do not add tests that only mirror the current implementation.
- Prefer behavior-focused tests based on requirements, validators, API contracts, authorization rules, persistence behavior, and edge cases.
- Use Vitest for unit and integration tests.
- Use Supertest for HTTP route tests that verify real request and response behavior.
- Put backend tests next to the code they cover using `*.test.ts`.
- For services, validators, utilities, and middleware, test happy paths, invalid input, permission failures, error paths, and important regressions.
- Avoid excessive mocking. Prefer real validation, real middleware, realistic fixtures, in-memory fakes, or test databases when practical.
- Mock only slow, external, nondeterministic, paid, or network-only services such as Gemini calls.
- Every test must have meaningful assertions. Avoid weak assertions such as only checking that a value exists unless existence is the actual requirement.
- Before calling work done, run the relevant test/build/lint commands and report any failures clearly.
