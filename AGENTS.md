# Backend Agent Instructions

## Required Reading

- Before backend work, read `docs/TECHNICAL_OVERVIEW.md`.
- For phase ownership or product requirements, read the relevant files under `docs/`.

## Package Scope

- Work from the `BE/` directory for backend package commands.
- Use Bun for backend dependency and script execution.
- Keep `BE/bun.lock` as the backend package lockfile.
- For git-only requests such as commit, push, or commit and push, do only the requested Git workflow. Do not run lint, tests, builds, or format checks unless the user explicitly asks for verification.

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
- Do not combine route registration, validation, controllers, business logic, and Mongoose models in one file. Each backend feature should follow the existing route/controller/service/model/validator split.
- Before adding a backend feature, inspect a similar completed feature such as `departments`, `programs`, or `users`, and mirror its structure unless there is a concrete reason to differ.
- Keep controllers thin: parse/validate request input, call services, and return JSON. Put relationship checks, duplicate checks, persistence behavior, and transaction-like workflows in services.

## Backend Structure Checklist

Before handing off backend work, verify:

- New endpoints are mounted through `src/routes/index.ts` and feature route files under `src/routes`.
- Request body/params validation lives in `src/validators`, not inline inside controllers.
- Controllers do not contain Mongoose query workflows beyond calling a service.
- Services own persistence and business rules, and models stay under `src/models`.
- Route tests cover the HTTP contract and authorization for new routes.

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
- Always use the `simplify` skill before handing backend work over for review.

## Backend Testing

- Add or update backend tests with every new feature or meaningful API/business-rule change unless the user explicitly says not to. Do not rely only on manual verification for new routes, validators, authorization rules, persistence behavior, or service workflows.
- Use Vitest for unit and integration tests.
- Use Supertest for HTTP route tests that verify real request and response behavior.
- Put backend tests next to the code they cover using `*.test.ts`.
- Use unit tests for validators, pure helpers, authorization decisions, and business-rule branches that do not need HTTP.
- Use service or integration tests for persistence behavior, relationship checks, duplicate handling, and transaction-like workflows.
- Use Supertest route tests for every new or changed HTTP endpoint, including success, validation failure, unauthorized/forbidden access, and important edge cases.
- When backend changes support a frontend final-state objective, coordinate with the frontend e2e coverage and update the full-stack seed/spec when needed.
- Prefer behavior-focused tests based on validators, API contracts, authorization rules, persistence behavior, and edge cases.
- Mock only slow, external, nondeterministic, paid, or network-only services such as Gemini calls.
- Every test must have meaningful assertions.
