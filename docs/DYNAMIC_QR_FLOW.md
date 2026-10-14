# Dynamic QR flow

The digital QR contains a URL such as `{APP_PUBLIC_BASE_URL}/qr/{serialCode}/{publicToken}`. The unpredictable token is 32 random bytes encoded URL-safe. The permanent serial comes from the existing PostgreSQL `BIGINT` sequence. Existing one-token URLs still resolve.

After the owner saves and approves an emergency profile, `POST /api/v1/qr-codes` creates or returns its active digital QR. It creates no order or payment. Profile edits preserve the token and immediately affect the same consent-filtered public URL.

Historical physical stickers and order records remain in the database. A revoked or replaced QR returns `410 Gone`; tokens are never reused. Public responses use `no-store` and `noindex`; QR image downloads require ownership. Scanner coordinates remain in the browser unless the scanner explicitly opens or copies a maps link.

## Physical sticker wizard

`/order` is an authenticated six-screen setup followed by the dashboard. Its
draft is stored per user in `qr_wizard_drafts` and restored by `GET
/api/v1/qr-wizard`. `PUT /api/v1/qr-wizard` saves incomplete progress; the
server checks all previous sections before allowing a later step. `POST
/api/v1/qr-wizard/finish` validates every section and confirmation, saves the
profile, creates one `sticker_orders` row, and issues one QR per sticker.
Repeated finish calls for the same draft return the same order and stickers.
`POST /api/v1/qr-wizard/new` starts another request after completion.

Physical stickers use a separate PostgreSQL `BIGINT` sequence starting at 1.
Their public paths are `/qr/1/{publicToken}`, `/qr/2/{publicToken}`, and so on;
the random token remains required. Existing digital QR serials and URLs retain
their legacy format. `APP_PUBLIC_BASE_URL` must be a public HTTPS frontend origin
for physical issuance. A local `http://localhost` URL is rejected.
The public frontend must use the same backend/database that issued the token.
Pointing a local database's QR at a deployed site with a different database
will produce an unavailable sticker page until the correct data/backend is used.

Sticker requests have `REQUESTED` status and `NOT_REQUIRED` payment status.
The application records the request and delivery address; it does not book a
shipment or claim payment. `GET /api/v1/sticker-orders` and `GET
/api/v1/sticker-orders/{id}` return only the authenticated user's requests.
Manual ambulance and police numbers are marked as owner-provided on the public
page; verified directory entries retain their source label.
