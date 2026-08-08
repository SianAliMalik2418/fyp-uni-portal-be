# Backend Technical Overview

This document summarizes the backend technical choices for the University Portal FYP and explains why each package or tool is present.

## Runtime and Build

- `bun`: Package manager and script runner for this workspace.
- `typescript`: Static typing for source, configuration, and tests.
- `tsx`: Development runner for TypeScript files with watch mode.
- `node`: Production runtime after `tsc` builds to `dist`.

## API Framework

- `express`: HTTP API framework. Routes are mounted under `/api`.
- `cors`: Allows the frontend origin to call the API with credentials.
- `helmet`: Sets security-related HTTP headers.
- `express-rate-limit`: Basic request rate limiting for API protection.
- `pino` and `pino-http`: Structured application and HTTP request logging.
- `cookie-parser`: Parses cookies. This is needed for secure HTTP-only session cookies.

## Configuration and Validation

- `dotenv`: Loads local environment variables.
- `zod`: Runtime validation for environment variables and request payloads.

The current `env.ts` schema requires MongoDB, Gemini, upload, auth-cookie, session-TTL, and client-origin configuration. Validation happens at startup so missing or invalid operational settings fail early.

## Persistence and Files

- `mongoose`: MongoDB object modeling for users and future portal entities.
- `multer`: Multipart file upload handling for assignments, course material, notices, or other uploaded documents.
- `csv-parse`: CSV ingestion for bulk imports such as students, courses, attendance, or marks.
- `nanoid`: Collision-resistant IDs for generated references where MongoDB ObjectIds are not suitable.

## Authentication

The current backend uses custom email/password session authentication.

Account creation is admin-provisioned. A developer-created super admin creates initial admin accounts, and admins create teacher, HOD, student, and other role accounts. Newly created users receive the default temporary password `@Abc1234`, stored only as a secure hash, and must change it before normal portal access.

The Better Auth documentation MCP server is configured at the repository root in `mcp.json`, pointing to `https://mcp.better-auth.com/mcp`, so AI-capable development tools can query current Better Auth setup and integration docs.

Better Auth agent skills are also installed under `.agents/skills`:

- `better-auth-best-practices`
- `create-auth`
- `better-auth-security-best-practices`
- `email-and-password-best-practices`
- `organization-best-practices`
- `two-factor-authentication-best-practices`

Current auth implementation:

- `src/models/user.model.ts`: User model with role, active state, password hash, and temporary-password flags.
- `src/models/session.model.ts`: Server-side session records with hashed session tokens, expiry, revocation, and last-used tracking.
- `src/services/auth.service.ts`: Password hashing, password verification, session token hashing, login, logout, session resolution, and password-change logic.
- `src/controllers/auth.controller.ts`: Cookie-setting login/logout handlers, current-user response, and password-change handler.
- `src/middlewares/auth.middleware.ts`: Backend session resolution and protected-route enforcement.
- `src/validators/auth.validator.ts`: Zod validation for login and password-change payloads.

Passwords are hashed with Node `crypto.scryptSync`. Session tokens are random, sent in HTTP-only cookies, and stored in MongoDB only as SHA-256 hashes. Role-based authorization must remain backend-enforced because the requirements require protected API routes, role-based access, data ownership checks, HTTP-only cookies, password-change onboarding checks, and restricted AI data access.

Better Auth docs and local Better Auth skills are available for a future migration, but Better Auth is not the current runtime auth provider.

## AI Integration

- `@google/generative-ai`: Gemini SDK used by `src/services/ai.service.ts`.

The requirements state that chatbot access must be scoped to the authenticated user's identity. The backend must not trust student IDs supplied in chat messages, and Gemini access should remain read-only against approved student/user data.

## API Structure

The backend follows an MVC-style layout:

- `src/app.ts`: Express app composition and middleware.
- `src/server.ts`: Runtime entry point.
- `src/routes`: Route registration.
- `src/controllers`: Request handlers.
- `src/services`: Reusable business logic and integrations.
- `src/models`: Mongoose persistence models.
- `src/validators`: Zod request validation.
- `src/middlewares`: Error and not-found handling.
- `src/config`: Environment and database setup.

## Code Quality Principles

Backend implementation should consistently follow SOLID, DRY, and clean code principles. Keep controllers thin, place reusable business logic in services, avoid duplicated validation or authorization paths, prefer clear names and small cohesive modules, and keep abstractions aligned with the MVC-style architecture.

## Testing and Quality

- `vitest`: Unit and integration test runner.
- `supertest`: HTTP route testing against the Express app.
- `@vitest/coverage-v8`: Coverage reporting.
- `eslint`, `@eslint/js`, `typescript-eslint`, and `globals`: Linting for TypeScript backend code.
- `prettier`: Code formatting.

## Project Requirements Context

The requirements docs define the backend as the authority for authentication, authorization, academic records, file validation, upload storage, AI access checks, and privacy boundaries. Students should only access their own records, teachers should only access assigned sections, HODs should only access their department, and admins have system-wide access.
