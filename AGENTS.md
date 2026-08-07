# Agent Instructions

## Package Management

- Use Bun for package management and package execution in this repo.
- Prefer `bun install`, `bun add`, `bun add -d`, and `bunx --bun`.
- Do not use npm, pnpm, or yarn unless the user explicitly asks for it.
- Keep `bun.lock` as the package lockfile.

## Starting Work

- When the user asks to start something, do not begin implementation immediately.
- First understand the requirements, propose counterarguments when valid, call out relevant edge cases, and ask any useful questions even if the task seems simple.
- If the request is fully straightforward and no meaningful question applies, say the agent is ready to kickoff and is waiting for the user's input.

## Project Ownership

- This is a group final-year project divided between three members from `docs/Portal_Phases_requirements.md`: Sian, Tayabba, and Hammad.
- Follow the phase ownership and responsibility split in the phase plan when choosing implementation scope.
- After a phase is completed and verified by the user, push only when the user explicitly asks to push.
- Before committing or pushing phase work, verify that the Git author name/email and the active GitHub account match the respective member responsible for that work. The account should already be logged in; do not assume it is correct without checking.

## Git Workflow

- Divide commits by feature or coherent implementation chunk. Do not dump unrelated or whole-phase work into one large commit.
- Use industry-standard conventional commit messages, such as `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, and `build:`.
- Keep each commit focused on one behavior, feature slice, test group, or documentation update.
- Include relevant tests or verification changes in the same commit as the behavior they validate when practical.

## Backend Architecture

- Follow the existing MVC layout under `src`.
- Keep request handlers in `controllers`, route registration in `routes`, persistence models in `models`, request validation in `validators`, reusable business logic in `services`, and Express middleware in `middlewares`.
- Validate request input with Zod before business logic.
- Keep authentication, authorization, audit logging, and AI access checks on the backend.
- Never expose `GEMINI_API_KEY`, JWT secrets, database URIs, or refresh tokens to the frontend.
- Do not add public signup/self-registration. The first admin is seeded by developers, and admins create student, teacher, HOD, and additional admin accounts.
- Use email/password as the only login credential pair. Registration numbers and employee IDs are profile/academic identifiers, not login identifiers.

## API Rules

- Use Express routes under `/api`.
- Return JSON responses with predictable shapes.
- Use centralized error handling through `middlewares/error.middleware.ts`.
- Use secure HTTP-only cookies for session tokens when auth is implemented.
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
