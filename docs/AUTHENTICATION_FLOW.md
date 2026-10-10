# Authentication flow

1. Send a normalized phone and purpose to `/auth/otp/send`.
2. Verify the expiring, attempt-limited code at `/auth/otp/verify` and receive a short-lived single-use phone verification token.
3. Register with that token. Passwords use BCrypt cost 12. Login and registration set a 15-minute signed JWT cookie plus a 30-day opaque refresh cookie.
4. `/auth/refresh` locks the current database session, creates a new session/token, and revokes the old refresh token.
5. `/auth/logout` revokes the database session and expires both cookies.

JWT authorization is server-side; `CUSTOMER`, `OPERATOR`, and `ADMIN` map to scoped authorities. Customer services derive ownership from the authenticated subject, never a body/query user ID. Cookie mutations use CSRF protection; CORS credentials are restricted to `FRONTEND_URL`.
