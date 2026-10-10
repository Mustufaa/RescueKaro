# OTP setup

Local development uses `OTP_PROVIDER=development` and `DEV_OTP_CODE=000111`. The code is BCrypt-hashed in PostgreSQL, expires in five minutes, has a resend cooldown, is single-use, and is never returned by the API or logged. The development provider fails closed under the `prod` profile.

Before production, implement and select a legitimate SMS adapter, keep credentials server-side, register the Indian DLT entity/header/templates where applicable, record consent, and add shared rate limiting by phone, IP, account, and device signals. Email verification does not prove phone ownership.
