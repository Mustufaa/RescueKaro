# AWS migration cleanup report

Historical cleanup snapshot. The later email OTP work is documented in
[EMAIL_OTP_IMPLEMENTATION_REPORT.md](EMAIL_OTP_IMPLEMENTATION_REPORT.md).
Current deployment instructions are in [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

## Pre-change audit (11 October 2026)

- The frontend is Next.js 15 in `frontend/`; it uses a same-origin `/api/v1` rewrite configured through `API_INTERNAL_BASE_URL`.
- The backend is Java 21 and Spring Boot with PostgreSQL, Flyway, JWT, OTP, Razorpay integration, QR issuance, configurable CORS, and health endpoints.
- `compose.yaml` runs frontend, backend, and PostgreSQL with a persistent named database volume. It contains no provider-specific runtime settings.
- Provider-specific files and settings to remove: `vercel.json`, the root `vercel-build` script, `neon.ts`, root `@neon/config` and `@neon/env` dependencies, and the Vercel/Render/Neon deployment instructions in `DEPLOYMENT.md` and `README.md`.
- `frontend/.env.example` has a stale Vercel instruction. No active runtime source contains a Vercel, Render, or Neon endpoint. `DATABASE_URL` in Spring configuration is a generic optional JDBC override, retained for compatibility.
- Existing user edits were present before this audit in README, Compose, backend and frontend code and configuration. Cleanup will preserve those edits. Local `.env` and `.neon` are ignored and will not be inspected, printed, or changed.

## Files removed

- `vercel.json` (provider build configuration).
- `neon.ts` (provider CLI configuration).

## Files modified or replaced

- Root `package.json` and `package-lock.json`: removed the Vercel build command and unused Neon tooling packages.
- `DEPLOYMENT.md`: replaced the earlier provider-specific test deployment guide with independent frontend, backend, database, and local verification instructions. This guide was already an untracked user file before cleanup.
- `README.md`: replaced the provider-specific deployment note.
- `frontend/.env.example`: removed the stale provider instruction. `frontend/config/site.ts` and `frontend/app/layout.tsx`: use configurable `SITE_URL` with a local default.
- `backend/src/main/resources/application-prod.yml`: requires `JWT_SECRET` in the production profile instead of inheriting the development fallback.
- `backend/src/test/java/com/rescuekaro/backend/AuthFlowIntegrationTest.java`: changed the CORS test origin to a neutral example domain without changing the test behavior.

Existing user edits to `compose.yaml`, `backend/Dockerfile`, `backend/pom.xml`, `backend/src/main/resources/application.yml`, frontend API and QR files, and other files were preserved.

## Environment variables required

| Service | Variables | Notes |
| --- | --- | --- |
| Compose local | `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`, `JWT_SECRET`, `PUBLIC_APP_URL`, `FRONTEND_PORT`, `BACKEND_PORT` | Copy root `.env.example` to ignored `.env`; private values must be supplied. |
| Backend | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`; optional `DATABASE_URL` JDBC override | PostgreSQL remains configurable. `SERVER_PORT` or `PORT` sets the listen port. |
| Backend security and links | `JWT_SECRET`, `FRONTEND_URL`, `PUBLIC_APP_URL` | Set exact CORS and public frontend origins. Production links require HTTPS. |
| Backend integrations | `OTP_PROVIDER`, `OTP_TEST_CODE`, `RAZORPAY_MODE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, optional SMTP variables | Mock OTP `000111` and payment simulation are for local development only. |
| Frontend server | `API_INTERNAL_BASE_URL`, `SITE_URL` | Set the API upstream reachable from the Next.js server and the public frontend origin. Browser API calls remain same-origin. |

Examples are in the root, frontend, and backend `.env.example` files. Actual `.env` files are ignored and were not read or changed.

## Configuration status

- **Database:** PostgreSQL driver, JPA, Flyway migrations, and QR serial sequence remain intact. The datasource uses generic `DB_*` variables and an optional JDBC `DATABASE_URL` override. No database was changed.
- **Frontend:** Next.js builds independently from `frontend/`. Its `/api/v1` proxy still uses `API_INTERNAL_BASE_URL`; no prior provider endpoint remains in active frontend configuration.
- **Backend:** Java 21, Spring Boot, port configuration, environment-based CORS, JWT, OTP, Razorpay, QR flow, and `/actuator/health` plus `/api/v1/health` remain. The production profile now requires a supplied JWT secret.
- **Docker Compose:** Three services, networking, health checks, and persistent PostgreSQL volume remain. No Compose service or volume was removed.

## Verification results

- `npm.cmd install --package-lock-only --offline --ignore-scripts`: passed; root lockfile now has no Neon dependency tree.
- `npm.cmd run frontend:typecheck`: passed.
- `npm.cmd run frontend:build`: passed outside the sandbox. The sandbox attempt failed at worker startup with `spawn EPERM`.
- `docker compose config --quiet`: passed against the existing ignored local `.env`; no rendered secrets were printed.
- `backend/mvnw.cmd test`: passed outside the sandbox; 12 tests passed, including PostgreSQL Testcontainers and Flyway migration tests. The sandbox attempt could not open Maven's user-profile dependency lock.
- Targeted source scan: no former provider hostname remains in active runtime source or test configuration. The generic `DATABASE_URL` override is retained intentionally.

## Current status

The application now has email OTP code and a Render Blueprint. Real SMTP delivery,
Razorpay test payments, and emergency QR behavior still require checks against
deployed services. The Compose stack remains for local development. Historical
Neon agent skill files under `.agents/` and `skills-lock.json` are repository
tooling with no runtime role; ignored local `.neon` state was left untouched.
