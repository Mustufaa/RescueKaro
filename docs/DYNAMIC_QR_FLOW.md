# Dynamic QR flow

The physical code contains exactly `{PUBLIC_APP_URL}/qr/{publicToken}`. `publicToken` is 32 cryptographically random bytes encoded URL-safe; the visible permanent sticker serial comes from a separate PostgreSQL `BIGINT` sequence.

After a verified payment, `activateForPaidOrder` locks the order, checks `PAID`, calculates `quantity × stickerCount`, and either creates that exact number of active rows or returns the existing allocation. A count mismatch fails for operator review. Profile edits preserve the token and immediately affect the same consent-filtered public URL.

Replacement policy is new-token/new-serial. Once fulfilled, the former row becomes `REPLACED`, its token returns `410 Gone`, and tokens are never reused. Public responses use `no-store` and `noindex`; QR image downloads require ownership. Scanner coordinates remain in the browser unless the scanner explicitly opens/copies a maps link.
