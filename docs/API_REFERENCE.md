# API reference

Base path: `/api/v1`. JSON successes use `{ "data": ..., "meta": { "requestId": ... } }`; errors use `{ "error": { "code", "message", "fields", "requestId" } }`.

Implemented in the current slice:

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | Public | Application health envelope |
| POST | `/auth/register` | Public | Accepts name, contact phone, email, password, confirmation, and optional `previousRequestId` when correcting signup email; sends registration email OTP and returns challenge metadata |
| POST | `/auth/verify-email` | Public | Consumes registration OTP, activates account and sets HttpOnly session cookies |
| POST | `/auth/login` | Public | Validates email/password and sets HttpOnly session cookies for verified users; returns `verification` challenge for an existing unverified user |
| POST | `/auth/resend-otp` | Public | Replaces an active challenge after cooldown |
| POST | `/auth/password/reset/request` | Public | Sends password reset OTP to a registered email |
| POST | `/auth/password/reset` | Public | Consumes reset OTP, changes password and revokes refresh sessions |
| POST | `/auth/refresh` | Refresh cookie | Rotates and revokes the previous refresh token |
| POST | `/auth/logout` | Cookie | Revokes refresh session and clears cookies |
| GET | `/auth/session` | Customer | Current user |
| GET/PUT/PATCH | `/emergency-profile` | Customer | Owned, optimistic `version`, 1–5 unique contacts/exactly one primary |
| GET | `/products`, `/products/{slug}` | Public | Server price in paise |
| POST | `/shipping/quote` | Public | Thirty-minute server quote |
| GET | `/qr-codes`, `/qr-codes/{id}` | Owner | Sticker metadata and stable public URL |
| POST | `/qr-codes` | Owner | Creates or returns a free digital QR for an approved emergency profile; no payment or order |
| GET | `/qr-codes/{id}.png` | Owner | `private, no-store` download |
| GET | `/public/qr/{publicToken}` | Public | Consent-filtered live profile; 404 invalid/inactive, 410 revoked/replaced |
| GET | `/orders`, `/orders/{id}` | Owner | Historical order records only; no new checkout |

The plan tracks endpoints not yet implemented. Cookie-authenticated mutation clients must echo the `XSRF-TOKEN` cookie in `X-XSRF-TOKEN`, except auth bootstrap endpoints. Production must use HTTPS.
