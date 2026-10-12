# RescueKaro

RescueKaro is organized as a monorepo with the existing Next.js application in
`frontend/`, a Java 21 Spring Boot API in `backend/`, and product/API
documentation in `docs/`.

## Repository layout

```text
RescueKaro/
|-- frontend/  Next.js 15 application
|-- backend/   Spring Boot 4.1 API
|-- docs/      Product, API, and database specification
|-- .gitignore
|-- package.json
`-- README.md
```

## Prerequisites on Windows 10

- Node.js and npm (the frontend keeps its existing `package-lock.json`)
- Java 21; this machine currently has it at `F:\Java`
- PostgreSQL for the normal backend profile

Maven does not need to be installed globally. Use the checked-in Maven Wrapper
(`backend\mvnw.cmd`). Docker is not required.

Open PowerShell in `F:\RescueKaro` and configure Java for the current terminal:

```powershell
$env:JAVA_HOME = 'F:\Java'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

The `F:\Java` value is intentionally not stored in committed IDE settings. If
your JDK moves, change the command locally.

## Frontend setup and start

The existing dependency directory was moved with the application. If it is
missing, or after dependencies change, install from the lockfile:

```powershell
cd F:\RescueKaro\frontend
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

The frontend runs at <http://localhost:3000>. Browser API requests use
`/api/v1`, which Next.js proxies to `API_INTERNAL_BASE_URL`. Only browser-safe configuration belongs in a
`NEXT_PUBLIC_*` variable—never put database, payment, OTP, or signing secrets
there.

From the repository root, the equivalent start command is:

```powershell
npm.cmd run frontend:dev
```

## PostgreSQL and the normal backend profile

Create a local role and database using `psql` while signed in as a PostgreSQL
administrator. Replace the example password with your own local password:

```sql
CREATE DATABASE rescuekaro_db;
```

The simplest Windows startup is the secure development launcher. It prompts for
the PostgreSQL password when one is not already configured, verifies the login,
creates `rescuekaro_db` when needed, and does not print or save the entered
password:

```powershell
cd F:\RescueKaro\backend
.\run-dev.cmd
```

Set backend configuration in the same PowerShell window that will launch it:

```powershell
cd F:\RescueKaro
$env:JAVA_HOME = 'F:\Java'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_NAME = 'rescuekaro_db'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = 'choose-a-local-password'
$env:FRONTEND_URL = 'http://localhost:3000'
$env:PUBLIC_APP_URL = 'http://localhost:3000'
$env:JWT_SECRET = 'replace-with-at-least-32-random-characters'
.\backend\mvnw.cmd -f .\backend\pom.xml spring-boot:run
```

The backend runs at <http://localhost:8080>. Flyway owns schema changes and
Hibernate uses `ddl-auto=validate`; Hibernate will not create or modify the
production schema.

For a persistent local setup, copy `backend\.env.example` to `backend\.env` and
replace `DB_PASSWORD` with the real password for your local PostgreSQL user.
The local file is ignored by Git and is loaded when Maven starts from either the
repository root or `backend\`. Process/CI environment variables override file
values. A complete JDBC URL can alternatively be supplied as `DATABASE_URL`.

The commands above are PowerShell syntax. At a Command Prompt (`cmd.exe`), use
`set DB_PASSWORD=your-password` (and the same `set NAME=value` form for other
variables), or use the `backend\.env` file instead.

## Checks

Run these from the repository root:

```powershell
npm.cmd run frontend:lint
npm.cmd run frontend:typecheck
npm.cmd run frontend:build
npm.cmd run backend:test
```

## Authentication and digital QR

Configure SMTP and `OTP_HASH_SECRET` before starting the backend. Registration
collects a name, email, password, and contact phone, then sends a code to the
email. The account is created only after that code is verified. Login requires
email, password, and a separate email code. Password reset has its own email
code. Phone numbers are contact fields and are not verified by email OTP.

Signed-in users can save an emergency profile and generate, view, and download a
digital QR without payment or a shipping order. Physical sticker ordering and
payment are currently unavailable. Existing order and payment records remain
readable in the dashboard.

`PUBLIC_APP_URL` must be the public frontend origin. Production requires HTTPS;
for example `https://rescuekaro.com`. `FRONTEND_URL` must be the exact frontend
origin allowed by CORS. Configure `API_INTERNAL_BASE_URL` with a backend URL
ending in `/api/v1`. The Next.js
proxy keeps session cookies on the frontend origin. Keep `JWT_SECRET`, database credentials, OTP
configuration on the backend. Flyway applies the additive
`V3__email_otp.sql` migration, preserving existing users, QR data, and serials.
Existing accounts verify their email on their next password-plus-OTP login. The baseline contains the
user, order, payment, sticker, and serial sequence tables.

The customer dashboard and order history now load the current user's records.
Emergency profile edits update the same public token used by printed stickers.
Fulfillment, replacements, reviews/contact, admin CRUD,
exports/deletion, notifications, and background jobs remain separate work.

Emergency data is never embedded in a QR: the QR holds
only a stable URL such as `/qr/RK2026000001/<private-token>`. The visible serial
uses `RK`, the India-local issue year, and a zero-padded PostgreSQL sequence.
The unpredictable token remains required to open the public emergency profile.

## Deployment note

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for the Render Blueprint, manual
service settings, environment variables, and deployment checks. See
[DEPLOYMENT.md](DEPLOYMENT.md) for local and provider-neutral setup. The frontend
API client keeps browser requests on the frontend origin and Next.js rewrites
`/api/v1/*` to the backend, so auth cookies remain same-origin.
