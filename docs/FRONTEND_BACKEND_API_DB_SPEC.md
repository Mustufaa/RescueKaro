# RescueKaro Frontend → Backend API & Database Specification

This is the single implementation contract for building the production backend used by the current Next.js frontend. It is based on the routes, forms, TypeScript types, service files, mock data, checkout flow, customer dashboard, and admin screens in this repository.

## 1. Product behavior the backend must preserve

RescueKaro sells physical stickers containing a **static, offline QR payload**. The QR does not point to a web profile and must remain readable without internet, login, or a RescueKaro server.

Important consequences:

- The customer maintains a current emergency profile in their account.
- At checkout, the customer reviews and approves selected fields.
- On successful payment, the backend creates an **immutable snapshot** of the approved profile, selected emergency-directory records, normalized QR text, and fingerprint for that order.
- Editing the account profile later must not alter an already generated/printed QR snapshot.
- A replacement creates a new snapshot and new physical sticker. The old sticker remains readable.
- Never expose emergency-profile data through a public unauthenticated endpoint or encode a public database URL in the QR.

## 2. Recommended conventions

- Base URL: `/api/v1` (set `NEXT_PUBLIC_API_BASE_URL=/api/v1`).
- JSON property names: `camelCase`.
- Database columns: `snake_case`.
- IDs: UUID/ULID internally. Also generate human-readable references such as `RK-2026-1042` and `RPL-2026-044`.
- Currency: store integer minor units (`amountPaise`); never use floating point. ₹99 = `9900`.
- Dates/times: ISO 8601 UTC, for example `2026-10-10T08:00:00.000Z`.
- Date-only values: `YYYY-MM-DD`.
- Phone numbers: normalize to E.164 (for example `+919876543210`).
- Pagination: `?page=1&pageSize=20`; return `meta.page`, `meta.pageSize`, `meta.total`, `meta.totalPages`.
- Every write endpoint validates input again on the server.
- Use HTTPS only in production.

### Standard success and error shapes

Return resources directly under `data` so errors and metadata stay consistent:

```json
{
  "data": {},
  "meta": { "requestId": "req_01..." }
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": { "email": "Enter a valid email address." },
    "requestId": "req_01..."
  }
}
```

Use these status codes: `200` read/update, `201` create, `204` delete/logout, `400` malformed input, `401` unauthenticated, `403` unauthorized, `404` absent resource, `409` duplicate/invalid state transition, `422` validation, `429` rate limit, `500` unexpected failure.

Suggested stable error codes include `VALIDATION_ERROR`, `AUTH_REQUIRED`, `FORBIDDEN`, `EMAIL_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_RATE_LIMITED`, `ORDER_NOT_PAYABLE`, `PAYMENT_NOT_VERIFIED`, `INVALID_STATUS_TRANSITION`, `PIN_NOT_SERVICEABLE`, and `RESOURCE_NOT_FOUND`.

## 3. Authentication and authorization

Preferred browser auth: short-lived access token plus rotating refresh token in `Secure`, `HttpOnly`, `SameSite=Lax` cookies. If frontend and API use different sites, configure explicit CORS origins, credentials, CSRF protection, and `SameSite=None; Secure` only where required. Never store long-lived tokens in `localStorage`.

Roles:

- `customer`: only their own profile, orders, QR assets, replacements, and settings.
- `operator`: operational orders/replacements and fulfillment updates.
- `admin`: operator permissions plus product, review, emergency-directory, user, and system settings management.

Every `/admin/*` endpoint must enforce role authorization on the server. Ownership checks are required for every `/:id` customer endpoint.

## 4. Canonical frontend DTOs

These DTOs use the names already expected by `types/index.ts`. Extend the frontend types to use the optional fields below rather than creating competing shapes.

```ts
type UseCase =
  | "Helmet"
  | "Bike / Scooter"
  | "Car"
  | "Bag"
  | "ID / Personal"
  | "Other";

type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  role: "customer" | "operator" | "admin";
  notificationPreferences: {
    orderUpdates: boolean;
    replacementUpdates: boolean;
  };
  createdAt: string;
}

interface Address {
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: "Parent" | "Spouse" | "Sibling" | "Friend" | "Guardian" | "Relative" | "Other";
  phone: string;
  primary: boolean;
}

interface MedicalInformation {
  allergies: string;
  condition: string;
  medication: string;
  note: string;
}

interface QRSelections {
  dob: boolean;
  age: boolean;
  address: boolean;
  allergies: boolean;
  medication: boolean;
  emergencyNote: boolean;
  additionalContacts: boolean;
  emergencyServices: boolean;
}

interface EmergencyServiceNumber {
  id: string;
  label: string;
  number: string;
  verified: boolean;
}

interface EmergencyServiceDirectory {
  country: string;
  state: string;
  city: string;
  services: EmergencyServiceNumber[];
  verificationStatus: "verified" | "partial" | "unavailable";
  source: string;
  lastVerified: string; // date-only; empty only when unavailable
}

interface EmergencyProfile {
  id: string;
  version: number;
  fullName: string;
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  dateOfBirth?: string;
  age?: string; // preferably derive this from dateOfBirth; retained for current UI compatibility
  contacts: EmergencyContact[];
  medical: MedicalInformation;
  address: Address;
  emergencyServices?: EmergencyServiceDirectory;
  selections: QRSelections;
  updatedAt: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  stickerCount: number;
  coverCount: number;
  active: boolean;
}

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";
type OrderStatus = "Processing" | "Printing" | "Shipped" | "Delivered" | "Cancelled";
type QRStatus = "Awaiting verification" | "Verified" | "Generated";

interface Order {
  id: string;                 // internal id
  orderNumber: string;        // RK-2026-1042
  createdAt: string;
  date: string;               // optional formatted display value for current UI
  product: string;
  productId: string;
  useCase: UseCase;
  quantity: number;
  subtotalPaise: number;
  shippingPaise: number;
  amountPaise: number;
  amount: number;             // optional rupee display value during migration
  payment: PaymentStatus;
  status: OrderStatus;
  qrStatus: QRStatus;
  tracking?: string;
  courierName?: string;
  trackingUrl?: string;
  deliveryAddress: Address & { recipient: string; phone: string };
  statusHistory: Array<{ status: string; occurredAt: string; note?: string }>;
}
```

## 5. API endpoint contract

### 5.1 Authentication, OTP, and password recovery

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/auth/otp/send` | No | Send phone verification OTP |
| POST | `/auth/otp/verify` | No | Verify OTP and issue a short-lived verification token |
| POST | `/auth/register` | No | Create customer account using verified phone token |
| POST | `/auth/login` | No | Start authenticated session |
| POST | `/auth/refresh` | Refresh cookie | Rotate session |
| POST | `/auth/logout` | Yes | Revoke current session |
| POST | `/auth/forgot-password` | No | Email a single-use reset link; always return the same message |
| POST | `/auth/reset-password` | No | Consume reset token and set new password |
| GET | `/auth/session` | Yes | Return signed-in user and role |

`POST /auth/otp/send`

```json
{ "phone": "+919876543210", "purpose": "registration" }
```

```json
{ "data": { "requestId": "otp_01...", "expiresIn": 300, "resendAfter": 30 } }
```

Allowed purposes: `registration`, `checkout_phone_verification`, `phone_change`. Rate-limit by phone, IP, account, and device signal; store only a secure OTP hash; cap attempts; expire and invalidate after successful use. Production responses must never return the OTP.

`POST /auth/otp/verify`

```json
{ "requestId": "otp_01...", "code": "123456" }
```

```json
{ "data": { "verified": true, "verificationToken": "short_lived_one_time_token" } }
```

`POST /auth/register`

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "phone": "+919876543210",
  "password": "minimum-8-characters",
  "phoneVerificationToken": "short_lived_one_time_token"
}
```

`POST /auth/login`: `{ "email": "aarav@example.com", "password": "..." }`. Return `{ data: { user } }` and set cookies. Passwords must be hashed with Argon2id (or an appropriately configured bcrypt fallback). Rate-limit and audit authentication failures without logging passwords or OTPs.

`POST /auth/forgot-password`: `{ "email": "aarav@example.com" }`.

`POST /auth/reset-password`: `{ "token": "single-use-token", "password": "new-password" }`.

### 5.2 User account and settings

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Get customer profile/settings |
| PATCH | `/users/me` | Update `fullName`, email/phone through verification workflows, or notification preferences |
| POST | `/users/me/data-export` | Request asynchronous personal-data export |
| POST | `/users/me/deletion-request` | Request account deletion/review |

Do not allow direct unverified email/phone replacement. Treat deletion carefully because financial/fulfillment records may require legal retention; anonymize eligible personal fields and explain that already printed static QR codes cannot be remotely deleted.

### 5.3 Emergency profile

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/emergency-profile` | Get current authenticated user's profile |
| PUT | `/emergency-profile` | Create/replace complete profile |
| PATCH | `/emergency-profile` | Partially update profile |

Server validation:

- `fullName`: 2–100 characters.
- `bloodGroup`: enum above.
- `city`, `state`: 2–100 characters.
- `dateOfBirth`: valid date, not future.
- `age`: if retained, integer string `0`–`120`; preferably derive from DOB.
- `contacts`: 1–5; exactly one `primary`; unique normalized phones; name 2–100; valid E.164 phone.
- Medical fields: optional plain text with conservative limits (for example 500 characters each). Strip control characters; render only as text, never HTML.
- Address country defaults to `India`; Indian `pinCode` must be six digits when supplied.
- All `QRSelections` keys are required booleans.
- Optimistic concurrency: accept `version` (or `If-Match`) and return `409` if the client edits a stale profile.

Profile updates do not modify `order_qr_snapshots`.

### 5.4 Emergency-service directory

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/emergency-directory?country=India&state=Uttar%20Pradesh&city=Lucknow` | Customer | Return reviewed services for QR selection |
| GET | `/admin/emergency-directory` | Operator/Admin | Search/paginate records |
| POST | `/admin/emergency-directory` | Admin | Add service record |
| PATCH | `/admin/emergency-directory/:id` | Admin | Edit, verify, or retire record |
| DELETE | `/admin/emergency-directory/:id` | Admin | Soft-delete/retire record |

Lookup response must match `EmergencyServiceDirectory`. If no exact location is available, return national verified defaults where applicable and set `verificationStatus` to `partial`; otherwise return `services: []` and `unavailable`. Only records with `verified=true`, a source, a verifier, and `lastVerified` may enter a QR snapshot. Directory changes must not rewrite old order snapshots.

### 5.5 Products and shipping quote

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/products` | No | List active products/current prices |
| GET | `/products/:slug` | No | Product detail |
| POST | `/shipping/quote` | No/Customer | Validate PIN and calculate quote |
| GET | `/admin/products` | Admin | All products |
| POST | `/admin/products` | Admin | Create product |
| PATCH | `/admin/products/:id` | Admin | Update price/content/active state |

`POST /shipping/quote`

```json
{ "pinCode": "226001", "country": "India", "productId": "prod_01", "quantity": 1 }
```

```json
{
  "data": {
    "quoteId": "shipq_01...",
    "available": true,
    "chargePaise": 5900,
    "charge": 59,
    "currency": "INR",
    "expiresAt": "2026-10-10T09:00:00.000Z",
    "estimatedMinDays": 3,
    "estimatedMaxDays": 7
  }
}
```

The server must recalculate product and shipping totals when creating the order. Never trust totals supplied by the browser.

### 5.6 Checkout, orders, QR snapshot, and payments

Recommended flow:

1. Frontend collects and previews the emergency profile.
2. Frontend persists the current profile with `PUT/PATCH /emergency-profile`.
3. Frontend requests a shipping quote.
4. Frontend calls `POST /orders` with IDs, delivery details, consent, and profile version—not a trusted amount.
5. Backend validates the verified phone, profile, directory services, consents, product, quote, and price; then creates a `Pending` order and immutable QR snapshot in one database transaction.
6. Frontend calls `POST /payments/order` for the internal order.
7. Frontend opens Razorpay using the returned provider order ID and public key.
8. Frontend sends provider result to `/payments/verify`; backend also processes signed webhooks.
9. Only a verified provider signature/webhook marks payment `Paid`, QR `Generated`, and order `Processing`.
10. Frontend fetches the resulting order and authorized QR asset.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/orders?page=1&pageSize=20` | Current customer's orders |
| GET | `/orders/:id` | Customer-owned order detail |
| POST | `/orders` | Create pending order and immutable QR snapshot |
| POST | `/payments/order` | Create provider payment order for internal order |
| POST | `/payments/verify` | Verify provider checkout signature/result |
| POST | `/payments/webhook` | Provider-signed webhook; no browser auth |
| GET | `/orders/:id/qr` | Authorized QR metadata/payload preview |
| GET | `/orders/:id/qr.png` | Authorized downloadable PNG |

`POST /orders` example:

```json
{
  "productId": "prod_starter_kit",
  "quantity": 1,
  "useCase": "Helmet",
  "emergencyProfileId": "eprof_01...",
  "emergencyProfileVersion": 3,
  "shippingQuoteId": "shipq_01...",
  "deliveryAddress": {
    "recipient": "Aarav Sharma",
    "phone": "+919876543210",
    "line1": "Flat 10",
    "line2": "Hazratganj",
    "landmark": "Near ...",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "pinCode": "226001",
    "country": "India"
  },
  "consent": {
    "detailsVerified": true,
    "offlineDisclosureAccepted": true
  },
  "idempotencyKey": "client-generated-uuid"
}
```

Creation response includes the complete `Order`. Require `Idempotency-Key` header (or the shown body value during initial integration) on order creation and payment-order creation to prevent double orders/charges.

`POST /payments/order`: `{ "orderId": "ord_01..." }`.

```json
{
  "data": {
    "paymentId": "pay_01...",
    "provider": "razorpay",
    "providerOrderId": "order_...",
    "amountPaise": 15800,
    "currency": "INR",
    "publicKey": "rzp_live_public_key_only"
  }
}
```

`POST /payments/verify` accepts `orderId`, `providerOrderId`, `providerPaymentId`, and `providerSignature`. The backend verifies the signature with the secret, checks amount/currency/order identity, and responds with the updated order. Never send the Razorpay secret to the browser. Webhooks must validate the raw-body signature, be idempotent by provider event ID, and handle out-of-order delivery.

QR snapshot fields must include the exact normalized text and fingerprint. The existing frontend uses FNV-1a to display an 8-character fingerprint; for production integrity, additionally store a server-generated SHA-256 checksum. Generate PNG/SVG from the immutable `normalizedText`, not from the mutable live profile. Restrict QR asset access to owner/operator/admin because it contains sensitive readable data.

Allowed state transitions:

- Payment: `Pending → Paid | Failed`; `Paid → Refunded` through an audited refund flow.
- QR: `Awaiting verification → Verified → Generated`.
- Order: `Processing → Printing → Shipped → Delivered`; cancellation only before the configured production cutoff.
- Every transition appends an immutable history event with actor and timestamp.

### 5.7 Replacements

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/replacements` | Customer replacement history |
| GET | `/replacements/eligible-orders` | Active stickers/orders eligible for replacement |
| POST | `/replacements` | Create replacement request and new QR snapshot |
| GET | `/replacements/:id` | Owned replacement detail |
| POST | `/replacements/:id/payment-order` | Payment when not free |
| GET | `/admin/replacements` | Admin queue |
| PATCH | `/admin/replacements/:id` | Review/approve/reject/fulfill |

Reasons: `Information changed`, `Sticker damaged`, `Sticker lost`, `Placement issue`, `Other`.

Statuses: `submitted`, `reviewing`, `approved`, `payment_pending`, `paid`, `printing`, `shipped`, `delivered`, `rejected`.

`POST /replacements`:

```json
{
  "orderId": "ord_01...",
  "reason": "Information changed",
  "reasonDetail": "optional text",
  "emergencyProfileId": "eprof_01...",
  "emergencyProfileVersion": 4,
  "deliveryAddress": { "recipient": "...", "phone": "+91...", "line1": "...", "line2": "", "landmark": "", "city": "Lucknow", "state": "Uttar Pradesh", "pinCode": "226001", "country": "India" },
  "staticQrAcknowledged": true,
  "idempotencyKey": "client-generated-uuid"
}
```

The server calculates free-replacement eligibility and price from policy/order history; never trust the browser. Enforce the configured free replacement count transactionally.

### 5.8 Reviews and contact/support

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/reviews?status=published` | No | Published genuine reviews |
| POST | `/reviews` | Customer | Submit review, preferably only for delivered orders |
| GET | `/admin/reviews` | Admin | Moderation queue |
| PATCH | `/admin/reviews/:id` | Admin | Publish/reject/edit moderation status |
| POST | `/contact` | No | Submit website contact form |

Contact request fields: `name` (2–100), `email`, `phone` (8–20), `subject` (2–150), `message` (10–5000). Add spam/rate-limit controls. Store status (`new`, `in_progress`, `resolved`, `spam`) and do not pretend success before persistence succeeds.

Published review response follows the current `Review` shape: `id`, `customerName`, `location`, `rating` (1–5), `review`, `useCase`, `avatar`, `createdAt`, `verified`, `sample`. Production should normally return only `sample=false`; `verified=true` means linked to a delivered order.

### 5.9 Admin dashboard and fulfillment

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | Counts, revenue, queue summaries, recent orders |
| GET | `/admin/orders` | Filtered/paginated order list |
| GET | `/admin/orders/:id` | Customer, delivery, payment, QR snapshot, and history |
| PATCH | `/admin/orders/:id` | Controlled status transition |
| POST | `/admin/orders/:id/verify-information` | Record operator verification |
| POST | `/admin/orders/:id/verify-qr` | Record QR/payload verification |
| POST | `/admin/orders/:id/mark-printed` | Move to printing/printed fulfillment state |
| POST | `/admin/orders/:id/shipment` | Add courier/tracking and mark shipped |
| POST | `/admin/orders/:id/mark-delivered` | Mark delivered |
| GET | `/admin/orders/:id/qr.png` | Download production QR asset |
| GET/PATCH | `/admin/settings` | Pricing/policy configuration if not managed per product |

List filters should include `search`, `orderStatus`, `paymentStatus`, `qrStatus`, `from`, `to`, `page`, and `pageSize`. Shipment input: `courierName`, `trackingNumber`, optional `trackingUrl`, and optional estimated delivery date. Status changes, directory edits, QR downloads, refunds, and settings updates require audit records.

## 6. Relational database schema

PostgreSQL is recommended. Use foreign keys, transactions, unique constraints, check constraints, and soft deletion only where historical records must remain. Encrypt especially sensitive profile/snapshot columns at application or database level; protect backups and restrict operator access.

### Identity and security

**users**

- `id uuid pk`
- `full_name varchar(100)`
- `email citext unique not null`
- `phone_e164 varchar(20) unique not null`
- `password_hash text not null`
- `phone_verified_at timestamptz`
- `role enum(customer, operator, admin) default customer`
- `status enum(active, suspended, deletion_requested, anonymized)`
- `order_updates_enabled boolean default true`
- `replacement_updates_enabled boolean default true`
- `created_at`, `updated_at`, `last_login_at`

**auth_sessions**: `id`, `user_id`, hashed refresh token/family ID, IP/user-agent metadata, `expires_at`, `revoked_at`, timestamps.

**otp_challenges**: `id`, `phone_e164`, `purpose`, `code_hash`, `attempt_count`, `max_attempts`, `expires_at`, `verified_at`, `consumed_at`, timestamps. Add indexes on phone and expiry; regularly purge expired rows.

**password_reset_tokens**: `id`, `user_id`, `token_hash unique`, `expires_at`, `used_at`, timestamps.

### Emergency data

**emergency_profiles**

- `id uuid pk`, `user_id uuid unique fk users`
- `version integer not null default 1`
- `full_name`, `blood_group`, `city`, `state`, `date_of_birth`
- encrypted/text medical columns: `allergies`, `medical_condition`, `medication`, `emergency_note`
- address fields: `line1`, `line2`, `landmark`, `address_city`, `address_state`, `pin_code`, `country`
- selection booleans for all eight `QRSelections` values
- `created_at`, `updated_at`

**emergency_contacts**: `id`, `emergency_profile_id fk`, `name`, `relationship`, encrypted `phone_e164`, `is_primary`, `sort_order`, timestamps. Enforce at most five and exactly one primary in transaction/service logic (and a partial unique index for one primary).

**emergency_directory_entries**: `id`, normalized `country/state/city`, `label`, `phone_number`, `source_name`, `source_url`, `verification_status`, `verified_by fk users`, `last_verified_at`, `active`, timestamps. Unique active location + label; retain history rather than overwriting silently.

### Commerce and fulfillment

**products**: `id`, `slug unique`, `name`, `description`, `price_paise`, `currency`, `sticker_count`, `cover_count`, `active`, timestamps.

**shipping_quotes**: `id`, optional `user_id`, `pin_code`, `country`, `product_id`, `quantity`, `charge_paise`, `available`, provider/service fields, estimates, `expires_at`, timestamps.

**addresses**: `id`, optional `user_id`, recipient, phone, all address fields, timestamps. Orders must still snapshot the delivery address so later address edits cannot change fulfillment history.

**orders**

- `id uuid pk`, `order_number varchar unique`
- `user_id fk`, `product_id fk`, `shipping_quote_id fk`
- `use_case`, `quantity`
- `unit_price_paise`, `subtotal_paise`, `shipping_paise`, `tax_paise`, `discount_paise`, `total_paise`, `currency`
- `payment_status`, `order_status`, `qr_status`
- snapshotted recipient/phone/address columns
- `details_verified_at`, `offline_disclosure_accepted_at`
- `created_at`, `updated_at`, optional `cancelled_at`

**order_items**: `id`, `order_id`, `product_id`, product-name snapshot, quantity, unit price and total. Keep even if the first release only supports one item.

**order_qr_snapshots**

- `id`, `order_id unique fk`, `source_profile_id`, `source_profile_version`
- `profile_snapshot jsonb` (exact approved fields)
- `directory_snapshot jsonb` (exact verified numbers/source metadata)
- `normalized_text text`
- `frontend_fingerprint varchar(8)`
- `sha256_checksum char(64)`
- protected asset/storage references, `generated_at`, `verified_at`, `verified_by`, timestamps

**payments**: `id`, `order_id fk`, `provider`, provider order/payment IDs, amount/currency, status, signature verification timestamp, failure code/message, timestamps. Add unique constraints to provider IDs.

**payment_events**: `id`, unique provider event ID, event type, validated payload/reference (redacted as needed), processing status/error, received/processed timestamps. This makes webhooks idempotent.

**shipments**: `id`, `order_id fk`, courier, tracking number/url, status, estimated/delivered dates, raw provider reference, timestamps.

**order_status_events**: `id`, `order_id`, status type/value, actor user/system ID, note, `created_at`. Append-only.

### Replacements, content, and operations

**replacement_requests**: `id`, `replacement_number unique`, `user_id`, `original_order_id`, `reason`, `reason_detail`, `status`, `eligibility`, `price_paise`, `shipping_paise`, `payment_id`, snapshotted delivery address, acknowledgement timestamp, reviewer/note fields, timestamps.

**replacement_qr_snapshots**: same snapshot/checksum approach as order QR snapshots, linked to replacement request. Do not overwrite the original order snapshot.

**reviews**: `id`, `user_id`, optional delivered `order_id`, customer display name, location, rating check 1–5, review text, use case, avatar initials, moderation status, verified flag, published timestamp, timestamps.

**contact_messages**: `id`, name, email, phone, subject, message, status, assigned admin, timestamps.

**app_settings**: versioned key/value configuration with type, updated by, timestamps. Prefer product price in `products`; use settings for replacement allowance/policy and operational flags.

**audit_logs**: `id`, actor user ID/role, action, entity type/ID, before/after metadata with sensitive fields redacted, IP/user agent, `created_at`. Append-only and access-controlled.

**idempotency_keys**: scoped key, user ID, route, request hash, response/status, expiry. Unique on user + route + key.

## 7. Privacy and security requirements

- Emergency/medical data is highly sensitive. Collect only fields shown in the UI, encrypt at rest where practical, use TLS, enforce least privilege, and maintain access/audit logs.
- Never log passwords, OTP codes, auth tokens, full payment payloads, full medical notes, QR normalized text, or unmasked phone numbers.
- Do not put emergency data in analytics, error trackers, email subject lines, URLs, or query strings.
- QR downloads must send `Cache-Control: private, no-store` and require authorization. Object-storage URLs must be short-lived signed URLs, if used.
- Validate and normalize all text/phones server-side. Render user text escaped; do not accept HTML.
- Add request/body limits, rate limits, brute-force protection, secure headers, CSRF protection for cookie-authenticated mutations, and strict CORS.
- Payment success is authoritative only after server-side signature verification/webhook confirmation.
- Admin list endpoints should mask phone/medical data unless the role and task require full access.
- Backups, exports, and deletion workflows need the same protection as the live database.
- Obtain legal/privacy review for retention, deletion, medical information handling, consent text, refund/replacement policies, and payment compliance before production launch.

## 8. Backend jobs and integrations

Use an asynchronous worker/queue for:

- email/SMS OTP delivery;
- order, shipment, replacement, password-reset, and contact notifications;
- Razorpay webhook processing/reconciliation;
- QR PNG/SVG generation and protected storage;
- courier tracking synchronization;
- data-export and deletion/anonymization jobs;
- cleanup of expired OTP, reset, session, shipping-quote, and idempotency records.

Jobs must be idempotent, retry with backoff, and move permanently failing work to a visible dead-letter/admin queue.

## 9. Frontend integration changes required

The backend alone will not connect the current UI because several screens still use local mocks. Replace these deliberately:

1. Change `services/api.ts` to use `/api/v1`, include cookie credentials (`credentials: "include"`), parse the standard envelope, and surface API error messages/field errors.
2. Replace `services/mock/otp.service.ts` with `/auth/otp/send` and `/auth/otp/verify`. Remove the public demo OTP and `NEXT_PUBLIC_DEMO_OTP_CODE` in production.
3. Replace mock shipping with `POST /shipping/quote` and retain `quoteId` for order creation.
4. Replace mock emergency directory with `GET /emergency-directory`.
5. Wire login/register/forgot/reset forms to auth endpoints and protect `/dashboard/*` and `/admin/*` by session/role.
6. Replace `mockUser`, `mockOrders`, and `mockEmergencyProfile` reads with `/users/me`, `/orders`, and `/emergency-profile`.
7. In `OrderFlow`, create/persist the profile, create the pending order, open Razorpay, verify payment, then render IDs/amounts/QR from the API. Remove hard-coded `RK-2026-1042`.
8. Generate final downloadable QR from the immutable server snapshot. Client-side QR generation can remain only as an explicitly labeled pre-payment preview.
9. Wire replacement, contact, reviews, account settings/deletion, admin orders/actions, products, directory, reviews, and settings to their endpoints.
10. Replace `localStorage` mock repository with API persistence. Do not store sensitive emergency profiles in browser storage beyond the active form session; if draft recovery is required, define explicit encrypted/server-side drafts.
11. Update amounts to `amountPaise`/`pricePaise` and format via `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`.
12. Refresh order/payment state after return from the payment window and handle pending, failed, retry, duplicate-click, and network-loss cases.

## 10. Minimum acceptance checklist

- A customer can register only after real OTP verification, log in/out, recover a password, and maintain a secure session.
- Customer and admin routes enforce ownership/role on the server.
- Customer can save a valid 1–5-contact emergency profile with exactly one primary contact.
- Directory lookup returns only verified records with source and verification date.
- Shipping/product totals are calculated by the server.
- Retried order/payment requests do not create duplicate orders or charges.
- A successful verified payment creates one immutable QR snapshot and one auditable order history.
- Editing the live emergency profile does not change an existing order's QR checksum.
- Customer can list/view only their orders and download only their QR assets.
- Admin can verify, print, ship with tracking, and deliver using valid state transitions.
- Replacement eligibility is server-calculated and the replacement has a separate immutable QR snapshot.
- Contact/review submissions persist and display success only after the API succeeds.
- Webhook signatures, replay/idempotency, out-of-order events, failure/retry flows, rate limits, validation, authorization, and sensitive-data redaction have automated tests.
- Database migrations, seed data (starter kit and verified directory records), backups, monitoring, and restore procedure exist before launch.

## 11. Suggested implementation order

1. Database migrations, validation schemas, standard response/error middleware.
2. Auth/session/OTP/password recovery and RBAC.
3. User and emergency-profile APIs.
4. Products, emergency directory, and shipping quote.
5. Order transaction and immutable QR snapshot generation.
6. Razorpay checkout, verification, webhook idempotency, and reconciliation.
7. Customer orders/dashboard and protected QR assets.
8. Admin fulfillment, audit history, and notifications.
9. Replacements, contact messages, reviews, settings, export/deletion.
10. Remove all frontend mock paths and run end-to-end tests for checkout, payment recovery, fulfillment, and replacement.

