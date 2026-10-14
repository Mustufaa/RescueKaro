# RescueKaro

RescueKaro keeps the existing Next.js frontend (`frontend/`) and Java 21 Spring Boot API (`backend/`). PostgreSQL and Flyway hold users, sessions, QR tokens, sticker serials, and OTP challenges. The backend alone connects to PostgreSQL and Resend. Browser API calls use the frontend's same-origin `/api/v1/*` proxy.

## Local Docker workflow

From PowerShell in the repository root:

```powershell
# Create a private root .env containing LOCAL_DB_PASSWORD, JWT_SECRET,
# OTP_HASH_SECRET, API_PROXY_IP_SECRET, RESEND_API_KEY, and EMAIL_FROM.
# See DEPLOYMENT.md for the complete variable list. Do not commit .env.
docker compose --env-file .env config --quiet
docker compose --env-file .env up --build -d
docker compose --env-file .env ps
Invoke-RestMethod http://localhost:3000/api/v1/health
```

The Compose database uses a named persistent volume. It publishes port 5432 on localhost only. The backend waits for PostgreSQL; the frontend waits for backend readiness. No live email is sent by builds or automated tests. A signup test sends email only when you enter your own address through the app.

The local CORS example allows both `http://localhost:3000` and `http://127.0.0.1:3000`. If you change `CORS_ALLOWED_ORIGINS` in `.env`, recreate the backend container for the new value to take effect.

`docker compose up --build` uses the local PostgreSQL container. If your root `.env` contains Supabase credentials, use `docker compose --env-file .env -f compose.supabase.yaml up --build` for Supabase instead. The two Compose files use separate database variables, so a Supabase username cannot accidentally be sent to the local database. If a local PostgreSQL volume already exists, use its existing local username and password; changing the Compose values does not change accounts inside that volume.

For direct development, create a private `backend/.env` with `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `OTP_HASH_SECRET`, `API_PROXY_IP_SECRET`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_PUBLIC_BASE_URL`, and `CORS_ALLOWED_ORIGINS`. Create a private `frontend/.env.local` with `API_INTERNAL_BASE_URL` and `API_PROXY_IP_SECRET`; `SITE_URL` is optional for local metadata. Then run `backend/run-dev.cmd` and `npm.cmd --prefix frontend run dev` in separate terminals. Spring imports `backend/.env`; Next.js reads `frontend/.env.local`. Compose reads the root `.env` and injects variables into containers. See [DEPLOYMENT.md](DEPLOYMENT.md) for variable meanings. All `.env` files, including examples, are ignored by Git.

## Authentication

Signup collects name, unique normalized Indian mobile number, email, and password; email verification uses a six-digit code that expires in 10 minutes. A verified user signs in with email and password and goes directly to the dashboard. Accounts from earlier versions with `email_verified=false` receive a verification code after a correct password, then continue to the dashboard. Password reset still uses a separate code. QR creation and public scans do not add an OTP step.

The app uses `APP_PUBLIC_BASE_URL` for newly issued QR URLs. Set this to the actual HTTPS frontend origin before issuing physical stickers. Existing token routes and PostgreSQL `BIGINT` serial sequences remain intact.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Supabase, Resend, Cloud Run, and migration steps.

## Vercel frontend project

If the frontend is deployed on Vercel, set the project's **Root Directory** to
`frontend` under **Settings → Build and Deployment → Root Directory**, save it,
and redeploy. The repository root `package.json` contains helper scripts; the
Next.js dependency and `build` script are in `frontend/package.json`. Leave the
Framework Preset as **Next.js** and use the default install, build, and output
settings. Do not add Next.js to the repository root to work around a wrong Root
Directory.

For the deployed frontend, set `API_INTERNAL_BASE_URL` to the backend's HTTPS
origin, `API_PROXY_IP_SECRET` to the same private value used by the backend,
and `SITE_URL` to the public frontend HTTPS origin. These are server runtime
variables; no `NEXT_PUBLIC_*` variable is required. See [DEPLOYMENT.md](DEPLOYMENT.md)
for the backend and database variables.
