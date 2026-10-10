# Frontend integration

`services/api.ts` targets `/api/v1`, unwraps the standard envelope, and sends cookies. The implemented public page is `/qr/[publicToken]`; it handles loading, missing/revoked profiles, direct calls, explicit geolocation permission, WhatsApp prefilled-message handoff, copy-location, and manual live-location guidance.

Remaining integration work is deliberately visible: checkout, dashboard, legacy `/scan`, admin, replacement, and several content screens still reference mock/static-QR behavior. They must be migrated endpoint-by-endpoint after commerce/admin APIs exist. Do not expose `DEV_OTP_CODE` via `NEXT_PUBLIC_*`, generate final QR medical payloads in the browser, or persist emergency profiles in `localStorage`.
