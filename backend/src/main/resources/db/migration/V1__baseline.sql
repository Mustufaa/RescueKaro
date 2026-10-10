CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SEQUENCE physical_sticker_serial_seq AS BIGINT START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name VARCHAR(100) NOT NULL, email VARCHAR(320) NOT NULL UNIQUE,
 phone_e164 VARCHAR(16) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL, phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
 role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER','OPERATOR','ADMIN')), enabled BOOLEAN NOT NULL DEFAULT TRUE,
 order_updates BOOLEAN NOT NULL DEFAULT TRUE, replacement_updates BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE otp_challenges (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), phone_e164 VARCHAR(16) NOT NULL, purpose VARCHAR(40) NOT NULL, code_hash VARCHAR(100) NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 5, expires_at TIMESTAMPTZ NOT NULL, next_send_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ, verification_token_hash CHAR(64), verification_expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX otp_phone_created_idx ON otp_challenges(phone_e164, created_at DESC);
CREATE TABLE auth_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), refresh_token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, replaced_by UUID REFERENCES auth_sessions(id), ip_hash CHAR(64), user_agent_hash CHAR(64),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_used_at TIMESTAMPTZ
);
CREATE TABLE password_reset_tokens (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE emergency_profiles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1,
 full_name VARCHAR(100) NOT NULL, blood_group VARCHAR(3) NOT NULL CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
 city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL, date_of_birth DATE,
 allergies TEXT NOT NULL DEFAULT '', medical_condition TEXT NOT NULL DEFAULT '', medication TEXT NOT NULL DEFAULT '', emergency_note TEXT NOT NULL DEFAULT '',
 line1 VARCHAR(200) NOT NULL DEFAULT '', line2 VARCHAR(200) NOT NULL DEFAULT '', landmark VARCHAR(200) NOT NULL DEFAULT '',
 address_city VARCHAR(100) NOT NULL DEFAULT '', address_state VARCHAR(100) NOT NULL DEFAULT '', pin_code VARCHAR(12) NOT NULL DEFAULT '', country VARCHAR(100) NOT NULL DEFAULT 'India',
 show_dob BOOLEAN NOT NULL DEFAULT FALSE, show_age BOOLEAN NOT NULL DEFAULT FALSE, show_address BOOLEAN NOT NULL DEFAULT FALSE,
 show_allergies BOOLEAN NOT NULL DEFAULT FALSE, show_medication BOOLEAN NOT NULL DEFAULT FALSE, show_emergency_note BOOLEAN NOT NULL DEFAULT FALSE,
 show_additional_contacts BOOLEAN NOT NULL DEFAULT TRUE, show_emergency_services BOOLEAN NOT NULL DEFAULT TRUE,
 public_profile_consent_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE emergency_contacts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), emergency_profile_id UUID NOT NULL REFERENCES emergency_profiles(id) ON DELETE CASCADE,
 name VARCHAR(100) NOT NULL, relationship VARCHAR(30) NOT NULL, phone_e164 VARCHAR(16) NOT NULL, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 sort_order SMALLINT NOT NULL CHECK(sort_order BETWEEN 0 AND 4), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(emergency_profile_id, phone_e164), UNIQUE(emergency_profile_id, sort_order)
);
CREATE UNIQUE INDEX one_primary_contact_idx ON emergency_contacts(emergency_profile_id) WHERE is_primary;
CREATE TABLE emergency_profile_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), emergency_profile_id UUID NOT NULL REFERENCES emergency_profiles(id), version INTEGER NOT NULL,
 profile_snapshot JSONB NOT NULL, visibility_snapshot JSONB NOT NULL, changed_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(emergency_profile_id, version)
);
CREATE TABLE emergency_directory_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), country VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL DEFAULT '', city VARCHAR(100) NOT NULL DEFAULT '',
 label VARCHAR(100) NOT NULL, phone_number VARCHAR(20) NOT NULL, source_name VARCHAR(200) NOT NULL, source_url TEXT, verified BOOLEAN NOT NULL DEFAULT FALSE,
 verified_by UUID REFERENCES users(id), last_verified_at TIMESTAMPTZ, active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX directory_location_idx ON emergency_directory_entries(lower(country),lower(state),lower(city)) WHERE active;

CREATE TABLE products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(150) NOT NULL, description TEXT NOT NULL,
 price_paise INTEGER NOT NULL CHECK(price_paise>=0), currency CHAR(3) NOT NULL DEFAULT 'INR', sticker_count INTEGER NOT NULL CHECK(sticker_count>0),
 cover_count INTEGER NOT NULL DEFAULT 0 CHECK(cover_count>=0), active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE shipping_quotes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), product_id UUID NOT NULL REFERENCES products(id), pin_code VARCHAR(12) NOT NULL,
 country VARCHAR(100) NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), charge_paise INTEGER NOT NULL CHECK(charge_paise>=0), available BOOLEAN NOT NULL,
 estimated_min_days INTEGER, estimated_max_days INTEGER, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number VARCHAR(30) NOT NULL UNIQUE, user_id UUID NOT NULL REFERENCES users(id), product_id UUID NOT NULL REFERENCES products(id),
 shipping_quote_id UUID NOT NULL REFERENCES shipping_quotes(id), use_case VARCHAR(30) NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price_paise INTEGER NOT NULL, subtotal_paise INTEGER NOT NULL, shipping_paise INTEGER NOT NULL, tax_paise INTEGER NOT NULL DEFAULT 0,
 discount_paise INTEGER NOT NULL DEFAULT 0, total_paise INTEGER NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'INR',
 payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', order_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING', qr_status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_PAYMENT',
 recipient VARCHAR(100) NOT NULL, delivery_phone VARCHAR(16) NOT NULL, line1 VARCHAR(200) NOT NULL, line2 VARCHAR(200) NOT NULL DEFAULT '', landmark VARCHAR(200) NOT NULL DEFAULT '',
 city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL, pin_code VARCHAR(12) NOT NULL, country VARCHAR(100) NOT NULL,
 emergency_profile_id UUID NOT NULL REFERENCES emergency_profiles(id), emergency_profile_version INTEGER NOT NULL,
 public_profile_consent_at TIMESTAMPTZ NOT NULL, internet_required_accepted_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), cancelled_at TIMESTAMPTZ
);
CREATE INDEX orders_user_created_idx ON orders(user_id,created_at DESC);
CREATE TABLE order_items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id), product_id UUID NOT NULL REFERENCES products(id),
 product_name VARCHAR(150) NOT NULL, quantity INTEGER NOT NULL, sticker_count_each INTEGER NOT NULL, unit_price_paise INTEGER NOT NULL, total_paise INTEGER NOT NULL,
 UNIQUE(order_id,product_id)
);
CREATE TABLE payments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id), provider VARCHAR(30) NOT NULL, provider_order_id VARCHAR(100) UNIQUE,
 provider_payment_id VARCHAR(100) UNIQUE, amount_paise INTEGER NOT NULL, currency CHAR(3) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
 signature_verified_at TIMESTAMPTZ, failure_code VARCHAR(100), failure_message VARCHAR(500), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE payment_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider_event_id VARCHAR(150) NOT NULL UNIQUE, event_type VARCHAR(100) NOT NULL, payment_id UUID REFERENCES payments(id),
 payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb, processing_status VARCHAR(20) NOT NULL, error_message VARCHAR(500),
 received_at TIMESTAMPTZ NOT NULL DEFAULT now(), processed_at TIMESTAMPTZ
);

CREATE TABLE qr_codes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), serial_number BIGINT NOT NULL DEFAULT nextval('physical_sticker_serial_seq') UNIQUE,
 public_token VARCHAR(80) NOT NULL UNIQUE, emergency_profile_id UUID NOT NULL REFERENCES emergency_profiles(id), order_id UUID REFERENCES orders(id),
 order_item_id UUID REFERENCES order_items(id), status VARCHAR(20) NOT NULL CHECK(status IN ('RESERVED','ACTIVE','SUSPENDED','REVOKED','REPLACED')),
 replaced_by_id UUID REFERENCES qr_codes(id), activated_at TIMESTAMPTZ, suspended_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX qr_profile_idx ON qr_codes(emergency_profile_id,created_at DESC);
CREATE TABLE shipments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL UNIQUE REFERENCES orders(id), courier VARCHAR(100), tracking_number VARCHAR(150), tracking_url TEXT,
 status VARCHAR(30) NOT NULL, estimated_delivery_date DATE, delivered_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE order_status_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id), event_type VARCHAR(30) NOT NULL, value VARCHAR(50) NOT NULL,
 actor_user_id UUID REFERENCES users(id), note VARCHAR(500), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE replacement_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), replacement_number VARCHAR(30) NOT NULL UNIQUE, user_id UUID NOT NULL REFERENCES users(id),
 original_qr_code_id UUID NOT NULL REFERENCES qr_codes(id), replacement_qr_code_id UUID REFERENCES qr_codes(id), reason VARCHAR(50) NOT NULL,
 reason_detail VARCHAR(500), status VARCHAR(30) NOT NULL, eligibility VARCHAR(30) NOT NULL, price_paise INTEGER NOT NULL DEFAULT 0,
 shipping_paise INTEGER NOT NULL DEFAULT 0, reviewer_id UUID REFERENCES users(id), review_note VARCHAR(500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), order_id UUID REFERENCES orders(id), customer_name VARCHAR(100) NOT NULL,
 location VARCHAR(150) NOT NULL DEFAULT '', rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5), review TEXT NOT NULL, use_case VARCHAR(30) NOT NULL,
 avatar VARCHAR(10) NOT NULL DEFAULT '', moderation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', verified BOOLEAN NOT NULL DEFAULT FALSE,
 sample BOOLEAN NOT NULL DEFAULT FALSE, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE contact_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL, email VARCHAR(320) NOT NULL, phone VARCHAR(20) NOT NULL,
 subject VARCHAR(150) NOT NULL, message TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'NEW', assigned_to UUID REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE app_settings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key VARCHAR(100) NOT NULL, version INTEGER NOT NULL, value JSONB NOT NULL,
 updated_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(setting_key,version)
);
CREATE TABLE audit_logs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id UUID REFERENCES users(id), actor_role VARCHAR(20), action VARCHAR(100) NOT NULL,
 entity_type VARCHAR(80) NOT NULL, entity_id UUID, metadata_redacted JSONB NOT NULL DEFAULT '{}'::jsonb, ip_hash CHAR(64), user_agent_hash CHAR(64),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type,entity_id,created_at DESC);
CREATE TABLE idempotency_keys (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), route VARCHAR(150) NOT NULL, idempotency_key VARCHAR(100) NOT NULL,
 request_hash CHAR(64) NOT NULL, response_status INTEGER, response_body JSONB, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(user_id,route,idempotency_key)
);

INSERT INTO products(slug,name,description,price_paise,sticker_count,cover_count)
VALUES('starter-kit','RescueKaro Starter Kit','Two weatherproof dynamic emergency QR stickers with protective covers.',9900,2,2);
