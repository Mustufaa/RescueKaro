# Email OTP setup

The backend uses SMTP for all email OTP delivery. Set `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM` in the backend
environment. Set `SMTP_FROM_NAME` for the sender display name. `SMTP_AUTH`,
`SMTP_STARTTLS`, `SMTP_STARTTLS_REQUIRED`, `SMTP_CONNECTION_TIMEOUT_MS`,
`SMTP_READ_TIMEOUT_MS`, and `SMTP_WRITE_TIMEOUT_MS` are configurable; their
defaults are `true`, `true`, `true`, `5000`, `5000`, and `5000`.

For Gmail, enable [2-Step Verification and create an App Password](https://support.google.com/accounts/answer/2461835), then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USERNAME` to the Gmail address, `SMTP_PASSWORD` to the App Password, and `SMTP_FROM` to the same verified address. Do not use the normal account password. [Gmail imposes sending limits](https://support.google.com/mail/answer/22839); it is not an unlimited free delivery service. [Render Free web services block outbound SMTP ports 25, 465, and 587](https://render.com/docs/free), so Gmail SMTP needs a Render plan that permits the connection. An alternate provider and port may work if supported by that provider.
`OTP_HASH_SECRET` must be a separate random secret of at least 32 characters in
production. Keep it and `JWT_SECRET` out of the frontend and Git.

Email codes contain six random digits, expire after five minutes, and are stored
as challenge-bound HMAC-SHA256 hashes. They are single-use, purpose-specific,
limited to five failed checks, and replaced on resend. Cooldown is 60 seconds;
each address may request five codes per hour, with an additional per-IP limit.
The password login endpoint also has per-address and per-IP hourly limits.

No fixed-code or mock OTP provider is available. No code is returned by the API
or logged. Compose uses the root `.env` SMTP settings. The example points at
Mailpit (`http://localhost:8025`), which captures messages without delivering
them to real inboxes. Set the root `SMTP_*` settings to a real provider and
recreate the backend container for actual inbox delivery.

New signup and password-reset passwords must be exactly six characters.
Existing accounts with longer passwords can continue using them to sign in.

The phone number remains profile data and is not verified by email OTP. Older
users are marked email-unverified by the additive migration and prove email
ownership with OTP on their next password login. Existing sessions for those
users cannot refresh until they complete that step.

Open `docs/email-previews/signup.html`, `login.html`, or `password-reset.html`
locally to review the HTML layout. Their `123456` codes and Sample User names
are labeled preview data. Runtime emails are rendered by `EmailOtpTemplate`
with the real name and a new random code, and include a plain-text alternative.
