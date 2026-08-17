# Backend Agent Instructions

The backend is a strict TypeScript Express 5 API backed by MongoDB/Mongoose, with Zod request validation, server-side cookie sessions, and Pino logging.

## Required Reading and Scope

- Before backend work, read `docs/TECHNICAL_OVERVIEW.md` from `BE/`.
- For phase ownership or product requirements, read only the relevant files under `docs/`.
- Work from `BE/` for backend package commands. Use Bun and keep `BE/bun.lock` as the package lockfile.
- For Git-only requests, do only the requested Git workflow. Do not run checks unless the user asks for verification.

## Ask Before You Assume

- Ask when a request could reasonably mean different endpoints, roles, ownership boundaries, response shapes, failure behavior, or persistence rules.
- Ask before changing an HTTP contract, authentication/session behavior, role permissions, a Mongoose schema/index, data retention, or a bulk-operation policy.
- Do not invent status transitions, authorization rules, validation limits, audit requirements, or destructive behavior.
- Do not widen a backend change into adjacent endpoints or data cleanup without authorization.

## Backend Architecture

The request path is: Express route → validation/auth middleware → controller → service → Mongoose model → MongoDB.

- Keep app composition in `src/app.ts`, runtime bootstrap in `src/server.ts`, and route registration in `src/routes`.
- Keep request handlers in `src/controllers`, business/persistence workflows in `src/services`, models in `src/models`, Zod validation in `src/validators`, middleware in `src/middlewares`, and environment/database/logging setup in `src/config`.
- Do not combine route registration, validation, controllers, business logic, and models in one file.
- Controllers stay thin: consume validated input, call services, and return JSON. Relationship checks, duplicate handling, authorization decisions beyond generic middleware, and multi-model workflows belong in services.
- Inspect a comparable completed feature such as `departments`, `programs`, or `users` before introducing a new structure.
- Mount new endpoints through `src/routes/index.ts` and feature route files under `src/routes`.

## API Contracts and Type Safety

- Mount HTTP routes under `/api` and preserve predictable JSON response shapes.
- Validate request bodies, params, and query strings with feature Zod validators before business logic.
- Treat all external input as `unknown` until validated or narrowed.
- Type errors are failures. Do not introduce `any`, unsafe non-null assertions, or casts used only to silence the compiler. Do not weaken `tsconfig.json` or lint rules.
- Prefer types inferred from Zod schemas when the schema is the runtime source of truth.
- When an HTTP contract changes, update validators, controllers/services, frontend API/types, and route/e2e tests in the same work.
- Current expected errors use `{ message, details? }`; Zod failures use `{ message: "Validation failed", errors }`. Do not silently introduce a different error envelope or status-code convention.
- Use the shared `ApiError` for expected application failures and centralized `errorMiddleware` for responses. Unexpected errors must remain 500s.

## Naming and Persistence

- Files use the established suffixes: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.model.ts`, and `*.validator.ts`.
- Functions use domain verbs such as `createDepartment`, `listPrograms`, `updateUser`, and `deleteCourse`; avoid vague verbs such as `handle`, `process`, or `doThing` when a domain action is known.
- Booleans read as assertions (`isActive`, `hasAccess`, `canPublish`).
- API paths use lowercase plural resource nouns and the existing routing vocabulary.
- Mongoose fields use the existing camelCase convention. Reuse domain terms already present in models, validators, and UI.
- Test files sit beside source as `*.test.ts`.
- Do not mutate historical data or add a migration/backfill script without explicit requirements for rollout, rollback, and affected records.

## Security and Error Handling

- Keep authentication, authorization, audit logging, AI access, and data ownership enforcement on the backend. Frontend visibility is not authorization.
- Use secure HTTP-only cookies for session tokens. Never expose `GEMINI_API_KEY`, auth secrets, database URIs, session tokens, or server configuration to the frontend or logs.
- Do not add public signup/self-registration unless requirements change. Email/password is the only login pair; registration numbers and employee IDs are profile identifiers.
- Keep Gemini access read-only and scoped to approved data belonging to the authenticated user.
- Never use an empty `catch` or reduce an error to an unstructured `console.log`. Handle it with recovery/context or let it propagate.
- Log structured context such as `requestId`, authenticated user ID, resource IDs, method, and path. Never log passwords, cookies, raw session tokens, secrets, or unnecessarily sensitive academic data.
- Error messages must state what failed without leaking internals. Do not convert an actual failure into a successful response.

## Query and Performance Rules

- Filter, sort, project, and paginate in MongoDB. Do not fetch a collection and then implement database work in application memory.
- New or changed list endpoints must be bounded. Use explicit pagination or a justified domain limit; do not add unbounded `.find()` queries.
- Select only fields the response or business rule needs, especially for user documents. Never expose `passwordHash` or session-token hashes.
- Avoid N+1 queries. Populate/project, batch with `$in`, or aggregate instead of querying once per result row.
- Add an index with a new recurring query pattern when the filter/sort is not covered. For large-collection changes, inspect the query plan with `explain("executionStats")` and report what was checked.
- Bound uploads, request bodies, CSV row counts, and AI inputs using established configuration or explicit validated limits.
- Finish data-reading features with a performance pass and mention query count, bounds/pagination, projection, and index impact in the handoff.

## Verification and Testing

Use the smallest relevant command while iterating and complete the loop before handoff:

```bash
bun run build
bun run lint
bun run format:check
bun run test
```

- Start meaningful API/business-rule changes with a failing test when a unit, service, or route test can express the behavior.
- Use Vitest for unit/integration tests and Supertest for real HTTP request/response behavior.
- Cover every new or changed endpoint's success path, validation failure, unauthenticated/forbidden behavior, and important edge cases.
- Use service/integration tests for persistence, relationship checks, duplicate handling, and multi-model workflows.
- Coordinate with `FE/tests/e2e/full-stack/` and `bun run seed:e2e` when backend work changes a cross-stack final-state objective.
- Mock only slow, external, nondeterministic, paid, or network-only services such as Gemini. Every test needs meaningful assertions.
- Never skip or weaken a test to get green. If a test expectation is wrong, explain the contract change before updating it.
- Do not use `bun run dev` or watch mode as final verification.
- Always use the `simplify` skill after the implementation and automated checks are green, before handoff.

## Backend Failure Log

- Do not put persistence or relationship workflows in controllers; keep them in services.
- Do not treat frontend role checks as authorization; enforce role and ownership constraints on every protected backend path.
- Do not return a new error envelope casually; clients currently consume the established `message`-based shapes.
- Do not add an unbounded collection read to a new or changed list endpoint.
- Do not log session cookies, raw tokens, passwords, secrets, or full sensitive academic payloads.
