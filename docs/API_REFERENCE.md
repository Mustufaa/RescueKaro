# API reference

Base path: `/api/v1`. JSON successes use `{ "data": ..., "meta": { "requestId": ... } }`; errors use `{ "error": { "code", "message", "fields", "requestId" } }`.

Implemented in the current slice:

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | Public | Application health envelope |
| POST | `/auth/otp/send` | Public | Dev/test code is configured server-side; never returned |
| POST | `/auth/otp/verify` | Public | Single-use, expiring verification token |
| POST | `/auth/register` | Public | Requires verified-phone token |
| POST | `/auth/login` | Public | Sets HttpOnly access/refresh cookies |
| POST | `/auth/refresh` | Refresh cookie | Rotates and revokes the previous refresh token |
| POST | `/auth/logout` | Cookie | Revokes refresh session and clears cookies |
| GET | `/auth/session` | Customer | Current user |
| GET/PUT/PATCH | `/emergency-profile` | Customer | Owned, optimistic `version`, 1–5 unique contacts/exactly one primary |
| GET | `/products`, `/products/{slug}` | Public | Server price in paise |
| POST | `/shipping/quote` | Public | Thirty-minute server quote |
| GET | `/qr-codes`, `/qr-codes/{id}` | Owner | Sticker metadata and stable public URL |
| GET | `/qr-codes/{id}.png` | Owner | `private, no-store` download |
| GET | `/public/qr/{publicToken}` | Public | Consent-filtered live profile; 404 invalid/inactive, 410 revoked/replaced |

The plan tracks endpoints not yet implemented. Cookie-authenticated mutation clients must echo the `XSRF-TOKEN` cookie in `X-XSRF-TOKEN`, except auth bootstrap endpoints. Production must use HTTPS.
