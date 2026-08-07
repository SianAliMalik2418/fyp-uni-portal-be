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
- `morgan`: HTTP request logging.
- `cookie-parser`: Parses cookies. This is needed for secure HTTP-only refresh/session cookies.

## Configuration and Validation

- `dotenv`: Loads local environment variables.
- `zod`: Runtime validation for environment variables and request payloads.

The current `env.ts` schema requires MongoDB, JWT secrets, Gemini, upload, and client-origin configuration. Validation happens at startup so missing or invalid operational settings fail early.

## Persistence and Files

- `mongoose`: MongoDB object modeling for users and future portal entities.
- `multer`: Multipart file upload handling for assignments, course material, notices, or other uploaded documents.
- `csv-parse`: CSV ingestion for bulk imports such as students, courses, attendance, or marks.
- `nanoid`: Collision-resistant IDs for generated references where MongoDB ObjectIds are not suitable.

## Authentication Direction

Authentication will use Better Auth as the app-level authentication framework.

The only supported sign-in provider for this app will be Gmail through Better Auth's Google social provider. Backend auth configuration should define only the Google provider and the required Google OAuth credentials. Do not enable email/password login, OTP login, magic links, passkeys, GitHub, Microsoft, or any other OAuth provider unless the project requirements change.

The Better Auth documentation MCP server is configured at the repository root in `mcp.json`, pointing to `https://mcp.better-auth.com/mcp`, so AI-capable development tools can query current Better Auth setup and integration docs.

Better Auth agent skills are also installed under `.agents/skills`:

- `better-auth-best-practices`
- `create-auth`
- `better-auth-security-best-practices`
- `email-and-password-best-practices`
- `organization-best-practices`
- `two-factor-authentication-best-practices`

The current backend still contains earlier custom-auth scaffolding that should be treated as legacy during the Gmail-only Better Auth migration:

- `bcryptjs`: Password hashing support.
- `jsonwebtoken`: JWT access/refresh token support.
- `src/models/user.model.ts`: User model with role and password-hash fields.
- `src/validators/auth.validator.ts`: Login request validation.

When the Better Auth migration is implemented, this custom JWT/bcrypt path should be reviewed and either removed or adapted behind Better Auth. Email/password auth should not remain exposed as a user-facing option. Role-based authorization must remain backend-enforced because the requirements require protected API routes, role-based access, data ownership checks, HTTP-only cookies, and restricted AI data access.

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

## Testing and Quality

- `vitest`: Unit and integration test runner.
- `supertest`: HTTP route testing against the Express app.
- `@vitest/coverage-v8`: Coverage reporting.
- `eslint`, `@eslint/js`, `typescript-eslint`, and `globals`: Linting for TypeScript backend code.
- `prettier`: Code formatting.

## Project Requirements Context

The requirements docs define the backend as the authority for authentication, authorization, academic records, file validation, upload storage, AI access checks, and privacy boundaries. Students should only access their own records, teachers should only access assigned sections, HODs should only access their department, and admins have system-wide access.
