# Authentication, QR wizard, and dashboard implementation

Implemented in the existing Next.js frontend and Java Spring Boot backend.
Signup verification creates the authenticated session and opens `/order`.
Password login opens `/dashboard`, including for users with no QR.
The wizard saves account-owned progress, validates earlier sections before
advancing, and atomically saves the final profile, sticker request, and QR rows.

## Routes and APIs

| Frontend route / action | Backend API | Behavior |
|---|---|---|
| Get Started → `/register` | `POST /api/v1/auth/register` | Pending signup and existing email OTP |
| Signup OTP | `POST /api/v1/auth/verify-email` | Session cookies, then `/order` |
| `/login` | `POST /api/v1/auth/login` | Session cookies, then `/dashboard`; unverified legacy users complete email verification first |
| `/order` | `GET`, `PUT /api/v1/qr-wizard` | Restore/save a private draft and current step |
| Generate additional stickers | `POST /api/v1/qr-wizard/new` | Resume an incomplete draft or start another after completion |
| Preview confirmation | `POST /api/v1/qr-wizard/finish` | Transactional and idempotent sticker issuance |
| `/dashboard` | `GET /api/v1/auth/session`, `/emergency-profile`, `/qr-codes`, `/orders`, `/sticker-orders` | Current user's saved data |
| `/dashboard/rescuekaro` | `GET /api/v1/qr-codes` | All owned QR codes, previews, downloads, public-page actions |
| `/dashboard/orders` | `GET /api/v1/sticker-orders`, `GET /api/v1/orders` | New sticker requests and historical orders |
| `/dashboard/sticker-orders/[id]` | `GET /api/v1/sticker-orders/{id}` | Private delivery information and sticker serials |
| `/dashboard/emergency-profile` | `GET`, `PUT /api/v1/emergency-profile` | Edit the current user's emergency profile |
| `/qr/[serial]/[token]` | `GET /api/v1/public/qr/{serial}/{token}` | Public emergency template; no account/OTP gate |
| Existing `/qr/[token]` | `GET /api/v1/public/qr/{token}` | Existing one-token URL compatibility |

Private APIs derive the user ID from authentication. The public response does
not expose account credentials, account email, wizard data, orders, or delivery
addresses. Emergency address/medical/contact visibility follows profile choices.
Manual ambulance and police numbers are labeled as provided by the profile owner;
directory results are used only when stored as verified with a verification date.

## Database and configuration

`V4__qr_wizard_and_stickers.sql` adds:

- `qr_wizard_drafts`, keyed by authenticated user, with persisted draft ID,
  JSON fields, and current step.
- `sticker_orders`, with a unique draft ID, delivery fields, `REQUESTED` status,
  and constrained `NOT_REQUIRED` payment status.
- `sticker_serial_seq`, an independent PostgreSQL `BIGINT` sequence starting at
  1 with `NO CYCLE`; physical serials have no prefix or fixed width.
- Physical sticker association and unique sticker serial on `qr_codes`.
- `profile_emergency_numbers` for optional owner-entered helplines.

The existing `users.phone_e164` and `pending_registrations.phone_e164` unique
constraints are retained. Phone input is normalized before lookup/storage.
Registered phones return HTTP 409 / `PHONE_ALREADY_REGISTERED` before signup
email is sent. The UI redirects to email-based signin and displays the requested
message. Pending registrations can resume with the same email and normalized
phone after the cooldown; the browser stores challenge metadata without storing
passwords or OTP codes.

Read-only local database audit before schema work: 0 duplicate user phone groups,
0 duplicate unconsumed pending phone groups, and 0 user phones outside normalized
Indian E.164 format. No users were deleted or merged. The local development
backend automatically applied the new V4 migration. Existing V1–V3 source files
were not edited. A stale V4 file in host compiled output caused an initial test
classpath conflict; Maven clean removed that build artifact.

`APP_PUBLIC_BASE_URL` must be the deployed
frontend's public HTTPS origin for production and phone scanning. In the `dev`
profile only (without `prod` or `APP_ENV=production`), localhost and loopback HTTP
origins are allowed for local previews. Production rejects localhost, loopback,
common private IPv4 origins and HTTP. URLs with a path/query/fragment are rejected.
The public frontend must use the same backend/database that issues the token.
The current local setting is still HTTP; the user's exact deployed URL has not
yet been supplied. Set the actual frontend Cloud Run origin on the backend
before issuing physical stickers. `API_INTERNAL_BASE_URL` is read at runtime;
Resend, JWT, and OTP secrets remain backend-only. No secret values are included here.

Sticker QR images contain the configured emergency-page URL and an unpredictable
public token. Existing digital serial formats remain compatible. Physical
requests do not book a shipment automatically or claim that payment was received.
Wizard completion and dashboard QR cards display selectable URLs and Copy link
buttons, with a local-preview message for localhost links.

## Changed files

Backend:

- `backend/src/main/java/com/rescuekaro/backend/auth/AuthService.java`
- `backend/src/main/java/com/rescuekaro/backend/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/rescuekaro/backend/qr/QrIdentity.java`
- `backend/src/main/java/com/rescuekaro/backend/qr/QrCodeService.java`
- `backend/src/main/java/com/rescuekaro/backend/qr/QrWizardService.java`
- `backend/src/main/java/com/rescuekaro/backend/qr/QrWizardController.java`
- `backend/src/main/resources/db/migration/V4__qr_wizard_and_stickers.sql`
- `backend/src/test/java/com/rescuekaro/backend/EmailOtpIntegrationTest.java`
- `backend/src/test/java/com/rescuekaro/backend/MigrationIntegrationTest.java`
- `backend/src/test/java/com/rescuekaro/backend/QrIdentityTest.java`

Frontend:

- `frontend/components/auth/RegisterScreen.tsx`
- `frontend/components/auth/EmailLogin.tsx`
- `frontend/components/auth/EmailOtpVerification.tsx`
- `frontend/components/auth/AuthGate.tsx`
- `frontend/components/qr/QrWizard.tsx`
- `frontend/components/qr/PublicQrPage.tsx`
- `frontend/components/dashboard/MyRescueKaro.tsx`
- `frontend/components/dashboard/DashboardShell.tsx`
- `frontend/components/landing/HomePage.tsx`
- `frontend/components/layout/Navbar.tsx`
- `frontend/app/order/page.tsx`
- `frontend/app/dashboard/page.tsx`
- `frontend/app/dashboard/orders/page.tsx`
- `frontend/app/dashboard/sticker-orders/[id]/page.tsx`
- `frontend/services/api.ts`
- `frontend/services/auth.service.ts`
- `frontend/services/qr.service.ts`
- `frontend/services/qr-wizard.service.ts`

Configuration/documentation:

- Private root, backend, and frontend `.env` files (excluded from Git)
- `DOCKER_SETUP.md`, `DEPLOYMENT.md`
- `docs/AUTHENTICATION_FLOW.md`, `docs/DYNAMIC_QR_FLOW.md`
- `docs/QR_WIZARD_IMPLEMENTATION.md`

## Verification and limits

- Full backend suite: 25 tests passed on isolated PostgreSQL containers; no
  external email delivery was performed by these tests.
- Updated OTP/wizard class: 11 tests passed after QR image decoding and digital
  QR separation were added.
- Final simultaneous-generation test passed: both requests returned one order,
  with two unique physical serials; retry returned the same stickers.
- Covered phone normalization/conflict HTTP status, concurrent signup,
  verification resume, progress restore, missing-field rejection, public QR
  access, decoded QR URL, and another user's sticker order returning 404.
- Frontend typecheck and the final production build passed, including the new
  sticker request detail route. Targeted wizard lint passed after fixing the
  new hook dependency warnings. Next.js still reports the existing multiple
  lockfile/workspace-root warning; it did not block the build.
- `git diff --check` passed without whitespace errors.
- Local health API returned 200; unauthenticated wizard, sticker-order, and QR
  ownership APIs returned 401.

Browser discovery returned no available browser. Mobile rendering, interactive
Back/edit/refresh navigation, and the actual signup/login screen destinations
were reviewed in code but could not be clicked through. No deployment, deployed
database audit, live inbox delivery, or physical phone scan was performed.
Public HTTPS configuration and end-to-end testing on the deployed site remain
pending the exact URL and a frontend/backend/database deployment using this code.
