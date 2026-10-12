-- The original users and pending_registrations tables already have unique
-- phone_e164 constraints. Existing rows must be audited before applying this migration.
CREATE SEQUENCE sticker_serial_seq AS BIGINT START WITH 1 INCREMENT BY 1 NO CYCLE;

CREATE TABLE qr_wizard_drafts (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 draft_id UUID NOT NULL UNIQUE,
 step SMALLINT NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 6),
 payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sticker_orders (
 id UUID PRIMARY KEY,
 wizard_draft_id UUID NOT NULL UNIQUE,
 user_id UUID NOT NULL REFERENCES users(id),
 emergency_profile_id UUID NOT NULL REFERENCES emergency_profiles(id),
 sticker_type VARCHAR(20) NOT NULL CHECK (sticker_type IN ('HELMET','CAR','MOBILE_BAG')),
 quantity SMALLINT NOT NULL CHECK (quantity BETWEEN 1 AND 10),
 recipient VARCHAR(100) NOT NULL,
 delivery_phone VARCHAR(16) NOT NULL,
 line1 VARCHAR(200) NOT NULL,
 line2 VARCHAR(200) NOT NULL DEFAULT '',
 landmark VARCHAR(200) NOT NULL DEFAULT '',
 city VARCHAR(100) NOT NULL,
 state VARCHAR(100) NOT NULL,
 pin_code VARCHAR(6) NOT NULL,
 country VARCHAR(100) NOT NULL DEFAULT 'India',
 status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
 payment_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT sticker_orders_payment_check CHECK (payment_status = 'NOT_REQUIRED')
);
CREATE INDEX sticker_orders_user_created_idx ON sticker_orders(user_id, created_at DESC);

ALTER TABLE qr_codes ADD COLUMN sticker_order_id UUID REFERENCES sticker_orders(id);
ALTER TABLE qr_codes ADD COLUMN sticker_serial BIGINT UNIQUE;
CREATE INDEX qr_codes_sticker_order_idx ON qr_codes(sticker_order_id) WHERE sticker_order_id IS NOT NULL;
ALTER TABLE qr_codes ADD CONSTRAINT sticker_qr_identity_check
 CHECK ((sticker_order_id IS NULL AND sticker_serial IS NULL) OR
        (sticker_order_id IS NOT NULL AND sticker_serial IS NOT NULL));

CREATE TABLE profile_emergency_numbers (
 emergency_profile_id UUID PRIMARY KEY REFERENCES emergency_profiles(id) ON DELETE CASCADE,
 ambulance_number VARCHAR(20) NOT NULL DEFAULT '',
 police_number VARCHAR(20) NOT NULL DEFAULT '',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
