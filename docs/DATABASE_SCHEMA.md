# Database schema

Flyway migration `V1__baseline.sql` creates UUID-keyed relational tables, UTC `timestamptz` audit fields, integer paise amounts, constrained states, and targeted indexes. Hibernate validates only; it does not mutate the schema.

```mermaid
erDiagram
  USERS ||--o{ AUTH_SESSIONS : owns
  USERS ||--|| EMERGENCY_PROFILES : owns
  EMERGENCY_PROFILES ||--|{ EMERGENCY_CONTACTS : contains
  EMERGENCY_PROFILES ||--o{ EMERGENCY_PROFILE_VERSIONS : audits
  USERS ||--o{ ORDERS : places
  PRODUCTS ||--o{ ORDERS : selected
  ORDERS ||--|{ ORDER_ITEMS : contains
  ORDERS ||--o{ PAYMENTS : paid_by
  PAYMENTS ||--o{ PAYMENT_EVENTS : receives
  EMERGENCY_PROFILES ||--o{ QR_CODES : publishes
  ORDERS ||--o{ QR_CODES : activates
  QR_CODES ||--o| REPLACEMENT_REQUESTS : replaced_by
  ORDERS ||--o| SHIPMENTS : ships
```

`physical_sticker_serial_seq` starts at 1, never cycles, and is independent of the UUID key and random public token. Sequence gaps are expected. Live profile content is not snapshotted into QR payloads; `emergency_profile_versions` preserves consent/edit history. Order price, address, payment, status, and fulfillment records remain historical.
