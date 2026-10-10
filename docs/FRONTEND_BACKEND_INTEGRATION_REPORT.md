# RescueKaro Frontend–Backend Integration Report

**Reviewed:** 10 October 2026  
**Repository:** `F:\RescueKaro`  
**Scope:** Read-only integration audit of the current checkout. No application code or tests were changed or run for this report.

## Executive summary

The repository contains a functioning Spring Boot/PostgreSQL foundation and a Next.js frontend, but the full customer journey described in the integration brief is **not yet integrated end to end**. PostgreSQL configuration, a Flyway baseline, backend authentication, emergency-profile persistence, product reads, shipping quotes, and dynamic QR resolution exist. A frontend API client and QR scan page also exist.

The main blocker is incomplete commerce and account UI wiring: the order flow still simulates payment, uses browser-local mock state, and builds QR content locally; dashboards and admin pages still consume mock records. The backend has no order or payment endpoints, so a real order-to-Razorpay-to-sticker journey cannot currently complete. Admin, replacement, reviews, contact, and emergency-directory persistence endpoints are also absent from this backend slice.

This document reports the implementation that was found; it does not claim the whole integration brief is complete.

## Verified API coverage

Backend controller mappings under `/api/v1`:

| Method | Endpoint | Current implementation |
|---|---|---|
| GET | `/health` | Public application health envelope. |
| POST | `/auth/otp/send` | Creates an OTP challenge; development OTP is configured server-side. |
| POST | `/auth/otp/verify` | Verifies a challenge and returns a verification token. |
| POST | `/auth/register` | Creates an account after phone verification and sets session cookies. |
| POST | `/auth/login` | Authenticates and sets HttpOnly access/refresh cookies. |
| POST | `/auth/refresh` | Rotates the refresh session from the refresh cookie. |
| POST | `/auth/logout` | Revokes the refresh session and clears cookies. |
| GET | `/auth/session` | Returns the authenticated user. |
| GET | `/auth/csrf` | Issues/returns CSRF token data for cookie-authenticated mutations. |
| GET, PUT, PATCH | `/emergency-profile` | Authenticated profile read/save, including optimistic version and contact validation. |
| GET | `/products`, `/products/{slug}` | Reads active products and server-set paise prices. |
| POST | `/shipping/quote` | Calculates and persists a server-side quote. |
| GET | `/qr-codes`, `/qr-codes/{id}` | Lists/reads the authenticated user's sticker records. |
| GET | `/qr-codes/{id}.png` | Generates a PNG for an owned QR record. |
| GET | `/public/qr/{publicToken}` | Resolves an active, consented QR to visibility-filtered emergency data. |

The public URL generated for a sticker is `{PUBLIC_APP_URL}/qr/{publicToken}`. Sticker serials are allocated from PostgreSQL's `physical_sticker_serial_seq`, starting at 1. QR allocation after a paid order exists as a service method, but no payment/order API currently calls it.

### Not implemented in the backend

- `POST /orders`, `GET /orders`, `GET /orders/{id}`
- Razorpay order creation, signature verification, and webhook endpoints
- Password-forgot/reset APIs
- Admin statistics, customer, fulfillment, settings, audit-action APIs
- Replacement request and eligibility APIs
- Review submission/listing and contact-message APIs
- Emergency directory query/management APIs

The Spring Security configuration contains access rules for several future routes; those rules do not mean the endpoints exist.

## Frontend integration status

### Connected foundations

- `frontend/services/api.ts` uses the configured API base URL (default `http://localhost:8080/api/v1`), includes cookies, unwraps success envelopes, and maps API error envelopes to `ApiError`.
- `frontend/.env.example` defines `NEXT_PUBLIC_API_BASE_URL`.
- `frontend/services/auth.service.ts`, `emergency-profile.service.ts`, and other service files are present for API access; presence alone does not establish that each screen uses them.
- `/qr/[publicToken]` is the intended public dynamic QR route. `docs/FRONTEND_INTEGRATION.md` describes its loading, invalid/revoked, location-permission, and WhatsApp behavior.

### Still using mock or static data

- `components/order/OrderFlow.tsx` uses mock OTP/payment, mock local storage, static product pricing, mock shipping/directory services, and browser-generated QR content. The displayed payment is explicitly a simulation.
- Dashboard pages/components use mock user, emergency-profile, order, or local-storage data.
- Admin dashboard/order/detail pages use mock orders/profile data; admin counts are identified in the UI as mock operational data.
- Reviews use bundled mock reviews.
- `/scan` falls back to a mock emergency profile and is separate from the token-based `/qr/[publicToken]` flow.
- `GeneratedQRPanel` creates a QR from a mock profile rather than a backend-owned sticker record.
- `services/payment.service.ts`, `shipping.service.ts`, and `emergency-directory.service.ts` export mock implementations.

Consequently, a successful-looking checkout or locally generated QR is not evidence of persisted order, verified payment, or activated sticker data.

## Database and persistence

`backend/src/main/resources/db/migration/V1__baseline.sql` defines the current schema and seed product. It includes:

- Identity and security: `users`, `otp_challenges`, `auth_sessions`, `password_reset_tokens`
- Emergency profile: `emergency_profiles`, `emergency_contacts`, `emergency_profile_versions`, `emergency_directory_entries`
- Catalog and commerce schema: `products`, `shipping_quotes`, `orders`, `order_items`, `payments`, `payment_events`
- Stickers and fulfillment: `qr_codes`, `shipments`, `order_status_events`, `replacement_requests`
- Operations: `reviews`, `contact_messages`, `app_settings`, `audit_logs`, `idempotency_keys`

The presence of tables is not equivalent to working API persistence. In this checkout, confirmed controller/service use is concentrated in auth, profiles, product reads, shipping quotes, and QR reads/public resolution. Order/payment/admin/replacement/review/contact tables have no corresponding implemented route flow identified in this audit.

Database settings are environment-driven in `backend/src/main/resources/application.yml`; Flyway is enabled and Hibernate is set to `ddl-auto: validate`. The development database defaults to `rescuekaro_db` on `localhost:5432`.

## Security and configuration observations

- Spring Security supports access tokens in the `rk_access` HttpOnly cookie and refresh tokens in the `rk_refresh` HttpOnly cookie. Cookie `Secure` follows the incoming request's secure flag; production must run behind correctly configured HTTPS/forwarded headers.
- CORS allows configured explicit origins with credentials enabled; the default origin is `http://localhost:3000`.
- CSRF uses a readable `XSRF-TOKEN` cookie and expects `X-XSRF-TOKEN` on unsafe cookie-authenticated requests; the frontend API client attempts to attach it when present.
- Development OTP defaults to `000111`; the OTP service is documented to fail closed under the production profile. Do not expose this value using a `NEXT_PUBLIC_*` variable.
- **Configuration hygiene:** `backend/.env.example` currently contains a database password value instead of a clearly inert placeholder. Replace it with a placeholder before distributing the repository or using it as a template; keep actual credentials in an ignored local `.env`.
- No Razorpay credentials are present in the checked-in environment template, and provider integration is explicitly documented as not implemented.

## Files inspected

Frontend: `frontend/app/**`, `frontend/components/**`, `frontend/services/**`, `frontend/data/**`, `frontend/types/**`, `frontend/.env.example`, and `frontend/package.json`.

Backend: `backend/pom.xml`, `backend/src/main/java/com/rescuekaro/backend/**`, `backend/src/main/resources/application*.yml`, `backend/src/main/resources/db/migration/V1__baseline.sql`, `backend/.env.example`, and `backend/src/test/**`.

Documentation: `docs/API_REFERENCE.md`, `docs/FRONTEND_INTEGRATION.md`, `docs/FRONTEND_BACKEND_API_DB_SPEC.md`, `docs/LOCAL_SETUP_WINDOWS.md`, `docs/OTP_SETUP.md`, and `docs/RAZORPAY_TEST_SETUP.md`.

## Test and build results

**Not run for this report.** No Java or TypeScript build/test command was executed during the audit, so there are no test results to claim. The repository contains Spring Boot tests, including a Testcontainers PostgreSQL migration/sequence test that is configured to be disabled when Docker is unavailable. The frontend package exposes `typecheck` and `build` scripts.

## Local startup commands

Prerequisites: Java 21, Node.js/npm, and PostgreSQL installed and running. Docker is not required for ordinary local development.

1. From PowerShell or Command Prompt, start the backend using the existing Windows launcher (it prompts for a local database password when needed and creates the configured database):

   ```bat
   cd /d F:\RescueKaro\backend
   run-dev.cmd
   ```

2. In a second terminal, start the frontend:

   ```bat
   npm.cmd --prefix F:\RescueKaro\frontend run dev
   ```

3. Local URLs:
   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:8080/api/v1/health`
   - Actuator health: `http://localhost:8080/actuator/health`

The current repository does not contain root-level `start-dev.cmd` or `stop-dev.cmd` scripts, and the API reference's Swagger URL is not backed by an identified Swagger/OpenAPI dependency in `backend/pom.xml`.

## Known remaining work

1. Wire registration/login/OTP screens to the backend, then verify registration-to-session behavior in the browser.
2. Replace checkout mock calls with backend product, shipping quote, order, and Razorpay flows. Implement and verify payment/webhook idempotency before activating QR stickers.
3. Load and save dashboard profile, QR, and order data through the existing APIs; enforce route authorization on the server.
4. Implement admin, replacement, review, contact, and directory endpoints before connecting their screens.
5. Replace static/mock QR generation with owned QR records and downloads; retire or explicitly label the legacy `/scan` demo route.
6. Add request timeouts/retry policy where safe and complete DTO/type alignment for all connected views.
7. Replace the checked-in example database password with an inert placeholder.
8. Add end-to-end coverage for account, profile, commerce/payment, sticker lifecycle, public scan, ownership, and administration before describing the requested goal as operational.
