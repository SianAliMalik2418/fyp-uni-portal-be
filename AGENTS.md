# Backend Agent Instructions

## Required Reading

- Before backend work, read `docs/TECHNICAL_OVERVIEW.md`.
- For phase ownership or product requirements, read the relevant files under `docs/`.

## Package Scope

- Work from the `BE/` directory for backend package commands.
- Use Bun for backend dependency and script execution.
- Keep `BE/bun.lock` as the backend package lockfile.
- Before every push, explicitly tell the user which GitHub account will be used and wait for their confirmation.
- Keep commit wording distinct for each project member while still using conventional prefixes. Sian should use short direct implementation wording, Tayyaba should use clearer workflow or handoff wording, and Hammad should use more system/technical wording. Do not reuse the same phrasing style across all three members.

## Backend Architecture

- Follow the MVC-style layout described in `docs/TECHNICAL_OVERVIEW.md`.
- Keep Express app composition in `src/app.ts`.
- Keep runtime bootstrap in `src/server.ts`.
- Keep route registration in `src/routes`.
- Keep request handlers in `src/controllers`.
- Keep reusable business logic and integrations in `src/services`.
- Keep persistence models in `src/models`.
- Keep request validation in `src/validators`.
- Keep Express middleware in `src/middlewares`.
- Keep environment and database setup in `src/config`.

## API and Security Rules

- Mount HTTP routes under `/api`.
- Return JSON responses with predictable shapes.
- Validate request input with Zod before business logic.
- Use centralized error handling through `middlewares/error.middleware.ts`.
- Keep authentication, authorization, audit logging, AI access checks, and data ownership checks on the backend.
- Use secure HTTP-only cookies for session tokens.
- Never expose `GEMINI_API_KEY`, auth secrets, database URIs, session tokens, or other backend secrets to the frontend.
- Do not add public signup/self-registration unless requirements change.
- Use email/password as the only login credential pair. Registration numbers and employee IDs are profile or academic identifiers, not login identifiers.
- Keep Gemini access read-only and scoped to approved authenticated user data.

## Backend Verification

- After backend changes, run the relevant Bun-backed scripts from `BE/`, such as `bun run test`, `bun run build`, `bun run lint`, and `bun run format:check`.

## Backend Testing

- Use Vitest for unit and integration tests.
- Use Supertest for HTTP route tests that verify real request and response behavior.
- Put backend tests next to the code they cover using `*.test.ts`.
- Prefer behavior-focused tests based on validators, API contracts, authorization rules, persistence behavior, and edge cases.
- Mock only slow, external, nondeterministic, paid, or network-only services such as Gemini calls.
- Every test must have meaningful assertions.
