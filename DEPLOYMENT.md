# Provider-neutral deployment preparation

For the exact Render settings and deployment procedure, see
[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

The application consists of a Next.js server, a Java 21 Spring Boot server, and
PostgreSQL. These services can be run independently or with the development
`compose.yaml`. No cloud infrastructure is defined in this repository.

## Frontend

Build in `frontend/` with `npm ci` and `npm run build`; run the server with
`npm run start`. Set `API_INTERNAL_BASE_URL` to a URL reachable from the Next.js
server, ending in `/api/v1` (for example `http://localhost:8080/api/v1` in local
development). Browser requests use `/api/v1` on the frontend origin and the
Next.js server proxies them to that upstream. Set `SITE_URL` to the public
frontend origin for metadata. Both values are server configuration; backend
secrets must stay out of the frontend environment.

## Backend

Build in `backend/` with `./mvnw package` and run the resulting JAR with Java
21, or build `backend/Dockerfile`. `SERVER_PORT` defaults to `8080`; `PORT` is
also accepted for compatibility with existing deployments. `SERVER_ADDRESS`
defaults to `0.0.0.0`. Health checks are `/actuator/health` and
`/api/v1/health`.

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` for
PostgreSQL. A complete JDBC `DATABASE_URL` can override host, port, and name.
The PostgreSQL JDBC driver and Flyway migrations remain enabled; Hibernate
validates the schema. Use a database account and connection appropriate to
your environment. Do not reset a populated database or its sequences.

Set `JWT_SECRET` and `OTP_HASH_SECRET` to separate private random values of at
least 32 characters. Both are required for production.
Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM`
for authenticated STARTTLS email delivery. Set `FRONTEND_URL` to the exact frontend
origin allowed by CORS and `PUBLIC_APP_URL` to the public frontend origin used
in newly generated QR links. Production QR links require HTTPS.
SMTP credentials belong only in the backend environment. See `backend/.env.example`.

## Local development and checks

Copy root `.env.example` to ignored `.env`, set private local `DB_PASSWORD` and
`JWT_SECRET`, `OTP_HASH_SECRET`, and SMTP settings, then run `docker compose up --build`. Its PostgreSQL
data persists in the `postgres_data` volume. `docker compose config --quiet`
checks configuration without printing secrets.

For independent processes, use `frontend/.env.example` and
`backend/.env.example`. Verify health at the two backend endpoints and through
the frontend `/api/v1/health` proxy. Before an actual production launch,
verify registration, login, OTP delivery, dashboard, digital QR issue and scan,
and public emergency profile behavior with the selected services. Previously
printed QR stickers may contain an old domain and require reprinting after a
domain change; database serials and tokens remain intact.
