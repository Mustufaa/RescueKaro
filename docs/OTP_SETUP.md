# Email verification and Resend

The backend uses Resend's HTTPS `POST /emails` API with a 5-second connection timeout, 10-second request timeout, and an idempotency key derived from each challenge ID. A successful API response means Resend accepted the message; inbox delivery can still fail. Provider errors return a safe failure response and roll back the new challenge. No API key is sent to the frontend or logged.

Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, `OTP_HASH_SECRET`, `API_PROXY_IP_SECRET`, and `APP_PUBLIC_BASE_URL` on the backend. Set the same `API_PROXY_IP_SECRET` on the frontend server to sign client IPs. Production startup fails clearly when required email settings or the OTP hash secret are missing. Codes are random six-digit values, stored only as HMACs, expire after 10 minutes, and allow five failed attempts. Resend cooldown is 60 seconds; send limits per email and IP and verification attempts are stored in PostgreSQL.

Resend setup and a controlled inbox test are in [DEPLOYMENT.md](../DEPLOYMENT.md#resend-setup).
