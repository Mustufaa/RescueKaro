# Security checklist

- [x] Random public token separate from sequential serial
- [x] Public response allow-list and inactive-token 404/410 behavior
- [x] `no-store` QR responses and `noindex` public scan API
- [x] Password hashing, expiring/attempt-limited hashed OTP, rotating refresh sessions
- [x] Strict CORS origin, credential support, CSRF repository, server ownership
- [x] Paise amounts, database constraints, Flyway ownership, `ddl-auto=validate`
- [ ] Distributed rate limiting and abuse monitoring
- [ ] Application-layer medical/contact encryption with managed key rotation
- [ ] Verify password-reset mail delivery with production SMTP credentials
- [ ] Admin audit UI, backup/restore drill, retention/deletion workflow
- [ ] Privacy, medical-data, consent, and replacement legal review
