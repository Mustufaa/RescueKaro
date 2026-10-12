# Authentication flow

1. `POST /auth/register` validates name, Indian mobile number, email and an
   exactly six-character password. It stores a pending registration and emails a six-digit
   code. It does not create a session.
   Both local and `+91` phone formats normalize to the same E.164 value.
   Existing registered phones return `409 PHONE_ALREADY_REGISTERED` before an
   OTP is sent; PostgreSQL also enforces uniqueness. A same-email pending
   registration can request another code after the resend cooldown.
2. `POST /auth/verify-email` consumes a valid registration challenge, creates an
   email-verified user and sets HttpOnly access and refresh cookies.
3. `POST /auth/login` checks email and password, then emails a login code. It
   does not set authentication cookies. `POST /auth/verify-login-otp` consumes
   that challenge and creates a session. Legacy users become email-verified at
   this point.
4. `POST /auth/password/reset/request` emails a purpose-specific reset code.
   `POST /auth/password/reset` consumes it, updates the BCrypt password hash,
   and revokes refresh sessions.
5. `POST /auth/resend-otp` applies the cooldown and replaces the previous
   active code. `POST /auth/refresh` rotates a valid refresh token;
   `POST /auth/logout` revokes the session and clears cookies.

JWT authorization remains server-side. Customer services derive ownership from
the authenticated subject. Browser API calls use the Next.js same-origin proxy;
CORS allows only the configured frontend origin.

After signup verification, the frontend opens `/order` at the saved QR wizard.
After login OTP verification, it opens `/dashboard` regardless of QR state.
