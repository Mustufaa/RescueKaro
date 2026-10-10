# RescueKaro backend implementation plan

## Current-state audit (2026-10-10)

The existing Next.js application has been moved into `frontend/` without changing its visual design. Its service layer has an API-envelope-aware fetch helper, but most screens still depend on mock data, browser `localStorage`, simulated OTP/payment services, hard-coded prices/order references, and browser-generated static QR payloads containing emergency data. The backend currently contains only a health controller, CORS configuration, validation error handling, and the initial PostgreSQL sticker serial sequence.

The master prompt overrides the older static/offline sections of `FRONTEND_BACKEND_API_DB_SPEC.md`. The implementation therefore treats the QR as a stable URL (`{PUBLIC_APP_URL}/qr/{publicToken}`), stores no medical data in the QR itself, and resolves only owner-approved fields from the live emergency profile. Historical profile versions and consents remain immutable audit records; the live profile is updateable.

## Route to API to persistence map

| Frontend route/use | API | Main persistence | Current gap |
|---|---|---|---|
| Register/login/reset | `/api/v1/auth/*` | `users`, `otp_challenges`, `auth_sessions`, `password_reset_tokens` | UI uses mock OTP/session |
| Dashboard settings | `/api/v1/users/me` | `users`, `audit_logs` | Mock user |
| Emergency profile | `/api/v1/emergency-profile` | `emergency_profiles`, `emergency_contacts`, `profile_versions`, `profile_consents` | Local mock; obsolete offline language |
| Public scan | `/api/v1/public/qr/{publicToken}` | `qr_codes` plus current approved profile | `/scan` is static; `/qr/[publicToken]` absent |
| Owner QR management | `/api/v1/qr-codes`, `/{id}`, `/{id}.png`, `/{id}.svg` | `qr_codes` | Browser embeds sensitive payload |
| Products and quote | `/api/v1/products`, `/shipping/quote` | `products`, `shipping_quotes` | Hard-coded Rs 99 and mock shipping |
| Checkout/payment | `/api/v1/orders`, `/payments/*` | `orders`, `order_items`, `payments`, `payment_events`, `idempotency_keys` | Simulated payment and hard-coded order |
| Orders/dashboard | `/api/v1/orders/*` | orders, QR codes, shipment/history | Mock orders |
| Replacements | `/api/v1/replacements/*` | `replacement_requests`, new `qr_codes` | Mock flow; must issue new serial/token |
| Reviews/contact | `/api/v1/reviews`, `/contact` | `reviews`, `contact_messages` | Partly mocked |
| Admin | `/api/v1/admin/*` | operational tables plus `audit_logs` | Mock lists/actions |

## Dynamic QR decisions

- PostgreSQL sequence `physical_sticker_serial_seq` begins at 1. Every physical sticker gets a UUID primary key, permanent `BIGINT` serial, and random 256-bit URL-safe token.
- Tokens, not serials, resolve public profiles. The QR content is exactly the public HTTPS URL in production.
- A profile update changes the approved public response at the same URL and records a version/consent event.
- Replacement policy: a fulfilled replacement receives a new serial and token. The replaced sticker is set to `REPLACED` and its public endpoint returns `410 Gone`; tokens are never reused.
- Allocation happens only in the verified-payment transaction and is guarded by unique payment/order-item allocation constraints and idempotency records.
- Public responses are allow-listed DTOs, use `Cache-Control: no-store`, omit internal IDs/account/payment data, and never record scanner coordinates.

## DTO changes

- `EmergencyProfile` gains `id`, `version`, `updatedAt`, and explicit visibility selections.
- `Product` uses `pricePaise`, `slug`, `description`, and `active`.
- `Order` uses server totals (`subtotalPaise`, `shippingPaise`, `amountPaise`) and exposes an array of sticker metadata where product quantity/sticker count creates more than one sticker.
- QR metadata exposes `serialNumber`, `status`, `publicUrl`, and protected asset links. It never exposes the raw public token separately where a URL suffices.
- Consent changes from `offlineDisclosureAccepted`/`staticQrAcknowledged` to `publicEmergencyProfileAccepted`, `internetRequiredAccepted`, and explicit field visibility.

## Phased checklist

- [x] Inspect repository, frontend contracts, mocks, and both specifications.
- [ ] Phase 1: complete Maven foundation, profiles, full baseline migration, response envelope, errors, OpenAPI, actuator health, migration tests.
- [ ] Phase 2: OTP provider abstraction, registration, password login, JWT access cookie, rotating refresh session, logout/reset, RBAC and CSRF/origin controls.
- [ ] Phase 3: owned emergency profile CRUD, contact constraints, optimistic versioning, consent/version history, verified directory.
- [ ] Phase 4: secure sticker token allocation, public resolver, PNG/SVG generation, owner endpoints, `/qr/[publicToken]`, location/WhatsApp user action.
- [ ] Phase 5: server-priced product/quote/order flow, Razorpay test adapter, signature/webhook verification, exactly-once sticker activation.
- [ ] Phase 6: replace customer mocks and hard-coded values with APIs.
- [ ] Phase 7: fulfillment/admin/replacement/review/contact/settings/audit APIs.
- [ ] Phase 8: Testcontainers concurrency/security/payment suite, documentation, and mobile scan verification.

## Verification gates

Each phase must compile before the next. Database behavior is verified against PostgreSQL Testcontainers when Docker is available; pure unit/MockMvc tests cover deterministic validation and security behavior without Docker. Razorpay is never treated as live without environment credentials and signed provider confirmation.

## Production blockers to close

Legal review is required for emergency/medical data, public-field consent, retention/deletion, and replacement/refund text. Production also requires a managed encryption key, an Indian DLT-compliant SMS provider, Razorpay production approval and secrets, a public HTTPS origin, delivery-provider rules, centralized rate limiting, backups/restore testing, and observability with sensitive-data redaction.
