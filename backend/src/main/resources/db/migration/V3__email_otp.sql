ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE pending_registrations (
 id UUID PRIMARY KEY,
 full_name VARCHAR(100) NOT NULL,
 email VARCHAR(320) NOT NULL UNIQUE,
 phone_e164 VARCHAR(16) NOT NULL UNIQUE,
 password_hash VARCHAR(100) NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_otp_challenges (
 id UUID PRIMARY KEY,
 user_id UUID REFERENCES users(id),
 pending_registration_id UUID REFERENCES pending_registrations(id),
 email VARCHAR(320) NOT NULL,
 purpose VARCHAR(32) NOT NULL CHECK (purpose IN ('REGISTRATION','LOGIN','PASSWORD_RESET')),
 otp_hash CHAR(64) NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
 expires_at TIMESTAMPTZ NOT NULL,
 next_send_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ,
 ip_hash CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT email_otp_subject CHECK (
  ((user_id IS NULL) <> (pending_registration_id IS NULL)) OR
  (purpose='PASSWORD_RESET' AND user_id IS NULL AND pending_registration_id IS NULL)
 )
);
CREATE INDEX email_otp_email_created_idx ON email_otp_challenges(email, created_at DESC);
CREATE INDEX email_otp_ip_created_idx ON email_otp_challenges(ip_hash, created_at DESC);
CREATE INDEX email_otp_user_idx ON email_otp_challenges(user_id, purpose, created_at DESC);

CREATE TABLE email_otp_verification_attempts (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ip_hash CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_otp_verify_ip_created_idx ON email_otp_verification_attempts(ip_hash, created_at DESC);

CREATE TABLE auth_login_attempts (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 email_hash CHAR(64) NOT NULL,
 ip_hash CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auth_login_email_created_idx ON auth_login_attempts(email_hash, created_at DESC);
CREATE INDEX auth_login_ip_created_idx ON auth_login_attempts(ip_hash, created_at DESC);

