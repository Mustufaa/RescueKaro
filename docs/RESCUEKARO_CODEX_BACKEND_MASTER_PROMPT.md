# RescueKaro — Codex Backend & PostgreSQL Master Prompt

> Paste this entire file into Codex, or ask Codex to read it from the repository root. Keep `FRONTEND_BACKEND_API_DB_SPEC.md` alongside it.

## Role and objective

Act as a principal Java/Spring Boot backend engineer, PostgreSQL architect, security engineer, and Next.js integration engineer. Implement a working, production-oriented **RescueKaro** backend and integrate it with the existing frontend. Do not replace or redesign the existing UI. Inspect the actual repository before making changes, and write real code, database migrations, tests, and setup instructions—not just a plan.

**Primary input:** `FRONTEND_BACKEND_API_DB_SPEC.md`. Read it fully, including DTOs, endpoint contract, database schema, order/checkout flow, admin screens, replacements, acceptance checklist, and frontend mock-removal instructions. Preserve its API envelope (`data`, `meta`, `error`), camelCase JSON, snake_case database columns, `/api/v1` prefix, roles, payment security, validation, and customer ownership rules unless overridden below.

**Explicit overrides to the attached specification:** Its **static/offline QR text payload**, immutable QR text snapshots, no-public-profile rule, and static-QR acknowledgement are obsolete. Implement **dynamic URL QR codes**, public approved emergency profiles, and updateable profile content instead. Preserve immutable *order, payment, consent, profile-version, and fulfillment audit records*, but do not freeze the live public emergency profile. The QR URL must remain stable when the user updates their approved details. Reconcile any frontend labels, DTOs, and consent fields that still refer to offline QR behavior.

## Technology and structure

- Java 21; choose a stable compatible Spring Boot release and dependency versions; Maven.
- Spring Web MVC, Spring Security, Spring Data JPA/Hibernate, Jakarta Validation, Flyway, PostgreSQL, HikariCP, Spring Actuator, Springdoc OpenAPI, ZXing, Spring Mail where needed.
- Short-lived JWT access sessions with rotating, revocable refresh tokens in Secure/HttpOnly cookies; CSRF protection for cookie-authenticated mutations, strict origin allowlist, server-side RBAC/ownership, Argon2id or suitably configured bcrypt.
- JUnit 5, Mockito, MockMvc, Spring Boot integration tests, PostgreSQL Testcontainers. Use constructor injection and clear feature modules. Avoid microservices and Docker as a prerequisite for local development.
- Repository target: preserve existing `frontend/` if present; create `backend/` if absent. If frontend lives at root, do not move it destructively. Proposed backend modules: `common`, `config`, `security`, `auth`, `user`, `emergency`, `directory`, `qr`, `product`, `shipping`, `order`, `payment`, `replacement`, `review`, `contact`, `admin`, `audit`, `notification`.

## First inspect and plan

1. Inspect project tree, `package.json`, Next.js routes/components, `types/index.ts`, `services/api.ts`, mock services, checkout, dashboard, admin, and QR template.
2. Read `FRONTEND_BACKEND_API_DB_SPEC.md` fully. Generate `docs/BACKEND_IMPLEMENTATION_PLAN.md` with route-to-API-to-entity mapping, gaps, updated QR behavior, DTO changes, and phased implementation checklist.
3. Implement phase by phase, compiling and testing each phase; do not stop at the plan. Never claim successful tests without running them. Report blockers accurately.

## Dynamic QR: permanent sequential serial numbers

Every **physical sticker** receives a permanent sequential numeric serial: **1, 2, 3, 4, ...** with no date prefix, no fixed digit length, and no reset. Use a PostgreSQL `BIGINT` sequence beginning at 1 (`nextval`), a `UNIQUE` constraint, and a UUID internal primary key. Sequence gaps on rollbacks are acceptable. Never generate a new serial on each scan. Each sticker has its own serial, even if several stickers belong to one profile. Ensure retries and duplicate payment notifications do not issue duplicate stickers.

**Security:** Do not expose sequential serial numbers as the lookup key for sensitive public profiles. Generate a separate high-entropy, cryptographically random URL-safe **public token** (`SecureRandom`) with a database uniqueness constraint. QR contents must be exactly the public URL, e.g. `https://rescuekaro.com/qr/{publicToken}`. The serial can be printed on the sticker and displayed in the account. Store sticker lifecycle (reserved/active/suspended/revoked/replaced), profile FK, timestamps, purchase/order item, and replacement link. Decide and document whether replacements revoke prior tokens; implement a deliberate policy, never silently reuse tokens.

On verified Razorpay payment, atomically finalize sticker allocation/activation and fulfillment records. For products containing multiple stickers, generate the correct count of unique sticker rows. Make the process idempotent. Produce scannable PNG/SVG with ZXing, accessible to the owner/admin via protected download endpoints. Support a non-final prepayment preview clearly labeled as such.

## Public QR scan and emergency page

- Implement unauthenticated `GET /api/v1/public/qr/{publicToken}` with a **strict public DTO** containing only the emergency fields explicitly approved by the owner: display name, blood group, selected medical notes, selected contact names/phones, approved address/city, verified emergency directory numbers, and sticker state. Do not return account email, password, payment information, or private internal IDs.
- Validate active token and consent; return safe 404/410 responses for invalid/revoked profiles; rate-limit scraping and abuse; do not leak sensitive information through logs, caching, SEO metadata, analytics, or error reporting. Use `Cache-Control: no-store` where appropriate.
- Create/integrate existing Next.js route `/qr/[publicToken]`, displaying RescueKaro's existing logo, dark theme with red/blue accents, large tap-to-call actions, accessible text, and responsive layout on iPhone Safari and Android Chrome. The scan page must work **without login or OTP**, but requires internet access. Show graceful invalid/revoked/offline/network states.
- Updating the account emergency profile must update the *approved* information on the public page without reprinting the QR. Preserve versioned audit events of edits and field-visibility consent.
- WhatsApp location action: on explicit scanner interaction, request browser geolocation permission, create a Google Maps pinned-coordinate URL, and open a `wa.me` deep link to the selected emergency contact with a **pre-filled** message; the scanner must press Send. Add Copy Location, direct Call, and helpful fallback on permission denial. **Do not claim the browser can automatically share native WhatsApp live location or send messages without user action.** Provide separate instructions for manual WhatsApp live-location sharing. Do not store scanner coordinates by default.

## Authentication and OTP

Implement the specification's auth endpoints:

`POST /api/v1/auth/otp/send`, `/auth/otp/verify`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`; `GET /api/v1/auth/session`.

Use `CUSTOMER`, `OPERATOR`, `ADMIN` roles; verified phone required for account creation as defined by the contract. Normalize phones to E.164; prevent enumeration, brute force, session fixation, and unverified email/phone changes. OTPs must be hashed, expire in 5 minutes, enforce resend cooldown and attempt limits, and be single-use. Rate-limit by phone, IP, account, and available device signals.

Provide `OtpProvider` interface with:

1. **Development provider**: entirely free local testing; optionally support fixed code `000111` **only in dev/test profiles** behind explicit configuration, never production; avoid exposing OTP in public API responses.
2. **Production SMS adapter**: pluggable legitimate Indian SMS gateway with credentials from env; do not claim real production SMS is permanently free. If provider is absent in production, fail closed. Document DLT/template/consent considerations where relevant.
3. Optional SMTP email OTP/password reset where appropriate; email OTP is not equivalent to verified phone ownership.

## PostgreSQL database

Create Flyway SQL migrations for the specification's relational entities, adapted for dynamic QR:

- `users`, `auth_sessions`, `otp_challenges`, `password_reset_tokens`
- `emergency_profiles`, `emergency_contacts`, `emergency_directory_entries`, profile consent/version history
- `products`, `shipping_quotes`, `addresses`
- `orders`, `order_items`, `payments`, `payment_events`, `shipments`, `order_status_events`
- `qr_codes` (UUID PK, `serial_number BIGINT UNIQUE`, `public_token UNIQUE`, profile FK, order/item FK, status, timestamps, replacement linkage)
- `replacement_requests`, `reviews`, `contact_messages`, `app_settings`, `audit_logs`, `idempotency_keys`

Use FK, unique/check constraints, useful indexes, transactions, UTC timestamptz, `BIGINT` for sticker serial, integer paise for money, and JSONB only when warranted. Use application-level protection/encryption for sensitive medical/contact data where feasible, and document key management. Use Flyway; Hibernate `ddl-auto=validate` (not `update`) outside tests. Snapshot delivery addresses, purchase prices, payment decisions, and consent history, **not static offline QR payloads**. Use database-backed sequences, never `MAX(serial)+1`.

## Products, shipping, orders, and Razorpay TEST

Implement the complete product, shipping, order, customer dashboard, and fulfillment APIs from the specification. Keep server-authoritative prices and shipping; default starter kit price ₹99 (`9900` paise) **plus calculated shipping**, unless the current repository/spec contains a different approved active product configuration. Product `stickerCount` determines sticker quantity; support per-sticker unique serials. Validate shipping quotes, profile version, consents, and ownership before order creation. Require idempotency keys on order/payment-order creation.

Integrate **Razorpay Test Mode** with env-configured `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_MODE=test`. Implement `POST /api/v1/payments/order`, `/payments/verify`, `/payments/webhook`. Create Razorpay orders server-side; verify signatures with provider-supported algorithms using the correct raw signed input; check order/payment identity, amount, currency, and authoritative captured/paid state; verify webhook raw-body signature; deduplicate events, handle retries/out-of-order delivery, and reconcile status. Never accept browser success alone as payment proof. Never leak the secret. Do not create real charges while configured for test mode. Provide test-card/UPI instructions only from current official Razorpay documentation or link to the provider's official test documentation without inventing credentials.

After verified payment, mark order paid and activate exactly the purchased sticker records once. Provide QR preview/download in customer dashboard and production QR for authorized fulfillment. Implement payment failure, retry, cancellation, refund state and history handling.

## Remaining API coverage

Implement all applicable endpoints in `FRONTEND_BACKEND_API_DB_SPEC.md`:

- `/users/me`, data export, deletion request
- `/emergency-profile` GET/PUT/PATCH, 1–5 contacts, exactly one primary, optimistic versioning, field visibility
- `/emergency-directory` and verified-source admin CRUD
- `/products`, `/shipping/quote`
- `/orders`, order details, QR metadata/assets; adapt to multiple stickers
- `/qr-codes` owner list/detail/download, permitted status changes, public token resolver
- `/replacements`, eligible orders, payment order, admin approval/fulfillment, new serial/token for replacement
- `/reviews`, `/contact`
- `/admin/dashboard`, orders/status transitions, QR verification/printing, shipment/tracking/delivery, products, directory, reviews, settings, audit logs

Keep standard JSON response/error envelopes and existing TypeScript DTO compatibility, updating types only when necessary for the dynamic-QR change. Enforce server-side `CUSTOMER` ownership and `OPERATOR`/`ADMIN` authorization. Make state transitions auditable and safe.

## Frontend integration

Preserve the existing Next.js frontend, routes, dark branding, and responsive design. Replace mocks with API-backed services after each endpoint is implemented and tested. Configure `/api/v1` and `credentials: 'include'` correctly for local dev. Integrate register/login/OTP, dashboard, emergency profile, shipping quote, order creation, Razorpay Checkout, payment verification, QR preview/download, replacements, reviews, contact, and admin pages. Remove demo OTP, hard-coded order numbers, hard-coded prices, and localStorage persistence of sensitive profile data from production paths. Preserve meaningful loading, error, payment-pending, duplicate-click, and network-failure states.

## Windows local development (no Docker requirement)

Provide working `application.yml`, `application-dev.yml`, `application-test.yml`, `application-prod.yml`, `.env.example`, `.gitignore`, and clear Windows setup instructions. Use local PostgreSQL database `rescuekaro_db`, default Spring Boot port 8080 and Next.js port 3000; explain environment-variable loading (do not assume Spring Boot automatically reads `.env`). Example variables:

```dotenv
SPRING_PROFILES_ACTIVE=dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rescuekaro_db
DB_USERNAME=postgres
DB_PASSWORD=
JWT_SECRET=
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
PUBLIC_APP_URL=http://localhost:3000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_MODE=test
OTP_PROVIDER=development
DEV_OTP_CODE=000111
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
```

Never commit secrets. Document how to create the database, run Flyway, launch backend/frontend, test Swagger, configure Razorpay webhook via a reachable development endpoint, and scan QR on a real phone. Explain that `localhost` URLs in QR codes are **not reachable from other devices**; configure a publicly reachable HTTPS dev URL or suitable LAN access for mobile testing.

## Automated acceptance tests

Write and run tests for: migrations; registration and OTP expiry/attempts; login/refresh/logout; ownership/RBAC; 1–5 contacts and primary validation; profile update and public visibility; serial starts at 1; concurrent uniqueness and monotonic sequence allocation; public token unpredictability/uniqueness; multiple stickers per product; invalid/revoked QR; dynamic profile changes reflected at same URL; payment signatures and webhook replay/out-of-order events; no duplicate sticker allocation; server-side pricing; order idempotency; admin fulfillment transitions; replacement serial/token allocation; data redaction. Use PostgreSQL Testcontainers for integration tests, and report any tests that cannot run in the current environment.

## Documentation and deliverables

Create:

- `docs/BACKEND_IMPLEMENTATION_PLAN.md`
- `docs/API_REFERENCE.md`
- `docs/DATABASE_SCHEMA.md` (with Mermaid ER diagram)
- `docs/AUTHENTICATION_FLOW.md`
- `docs/OTP_SETUP.md`
- `docs/RAZORPAY_TEST_SETUP.md`
- `docs/DYNAMIC_QR_FLOW.md`
- `docs/FRONTEND_INTEGRATION.md`
- `docs/LOCAL_SETUP_WINDOWS.md`
- `docs/SECURITY_CHECKLIST.md`
- Postman collection or equivalent API examples

At the end of each phase, report changed files, implemented endpoints, applied migrations, commands run, tests passed/failed, and external credentials still required. Do not pretend unconfigured integrations are live. Flag unresolved privacy/compliance considerations before production.

## Execution phases

1. **Inspect + foundation:** plan, backend skeleton, PostgreSQL/Flyway, common response/error handling, OpenAPI, health endpoint.
2. **Auth + OTP:** users, sessions, JWT, RBAC, OTP dev provider, password recovery.
3. **Emergency profile:** contacts, directory, consent and profile versioning.
4. **Dynamic QR:** sequence from 1, secure token, QR asset generation, public API, Next.js scan page, WhatsApp pinned-location sharing.
5. **Commerce:** products, shipping quotes, orders, Razorpay Test Mode, verified payment and idempotent sticker activation.
6. **Customer frontend:** dashboard, order history, QR management/download, replace mocks.
7. **Admin and replacements:** fulfillment, shipping, reviews, contact, settings, audits.
8. **Quality:** full integration/security tests, documentation, Windows setup, mobile scan verification.

**Start now:** inspect the actual repository and the attached specification; write the implementation plan; then implement and test each phase. Continue as far as the environment allows. Ask for missing external secrets only when required; never invent them. Prioritize a verified working vertical slice (registration → profile → Razorpay test payment → dynamic QR → mobile scan) over a large number of unfinished placeholder endpoints.
