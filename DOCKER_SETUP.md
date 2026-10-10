# Run RescueKaro with Docker Compose (Windows)

This development setup runs the existing Next.js frontend, Spring Boot backend,
and PostgreSQL database together. It does not replace or connect to a separate
PostgreSQL installation on Windows. Compose publishes the app and database ports
on `127.0.0.1` only, and the database data lives in a named Docker volume.

## Prerequisites

1. Install Docker Desktop for Windows and enable the WSL 2 backend in Docker
   Desktop settings. Start Docker Desktop and wait until its engine is running.
2. In Docker Desktop, enable WSL integration for your Linux distribution if you
   use the WSL terminal.
3. Open PowerShell, Command Prompt, or the integrated terminal in this project.

Java and Node.js are not needed on Windows for the containers. The backend image
uses Java 21 and the Maven Wrapper; the frontend image uses Node 22 and npm with
the committed `frontend/package-lock.json`.

## Configure local values

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `DB_PASSWORD` and `JWT_SECRET` to private local values. Keep `.env` private;
Git ignores it. The supplied `DEV_OTP_CODE` defaults to `000111` for this
development profile only. The `prod` Spring profile disables the development
OTP provider; do not deploy this Compose development configuration as production.

The Razorpay and SMTP variables are optional placeholders. The current checkout
does not implement a real payment or SMS provider flow, so these values are not
needed to start the stack. If credentials are supplied later, keep Razorpay
secret and webhook keys, SMTP credentials, and the JWT signing secret in backend
environment only. Only a Razorpay public key should ever be exposed to browser
code when a real checkout is implemented.

| Variable | Purpose | Default |
|---|---|---|
| `DB_NAME` | Compose database name | `rescuekaro_db` |
| `DB_USERNAME`, `DB_PASSWORD` | Compose database credentials | `rescuekaro`, set a private password |
| `DB_PORT` | Windows localhost PostgreSQL port | `5432` |
| `FRONTEND_PORT` | Windows localhost Next.js port | `3000` |
| `BACKEND_PORT` | Windows localhost Spring Boot port | `8080` |
| `PUBLIC_APP_URL` | Base URL written into generated sticker links | `http://localhost:3000` |
| `JWT_SECRET` | Development token signing secret | Set a private random value |
| `DEV_OTP_CODE` | Explicit development OTP code | `000111` |

Browser requests use `/api/v1` on the frontend origin. Next.js proxies them to
the private Compose DNS address `http://backend:8080/api/v1`. The `backend`
hostname is never sent to the browser. Spring Boot allows the configured local frontend origin and retains the
existing cookie and CSRF behavior.

## Start the stack

Run in the foreground to see startup output:

```powershell
docker compose up --build
```

Or start in the background:

```powershell
docker compose up -d --build
```

The database health check gates backend startup. The backend health check gates
frontend startup. Flyway runs the existing migrations when Spring Boot connects
to PostgreSQL. Source files are mounted for development. Frontend dependencies,
Next.js cache, Maven dependencies, Maven build output, and the database data are
stored in isolated named volumes so Windows `node_modules` is never mounted into
the frontend container.

Open:

- Frontend: <http://localhost:3000>
- Backend application health: <http://localhost:8080/api/v1/health>
- Spring Actuator health: <http://localhost:8080/actuator/health>
- PostgreSQL: `localhost:5432` (TCP; use pgAdmin or `psql`)

The backend container watches Java source files, recompiles them with Maven, and
Spring Boot DevTools restarts the application when compiled classes change. This
is an explicit compile-and-restart loop; merely mounting Java source would not
reload compiled code.

## Logs, stop, and rebuild

```powershell
docker compose logs -f
docker compose logs -f backend
docker compose down
```

`docker compose down` stops and removes the project containers and network while
preserving the named PostgreSQL data volume. **`docker compose down -v` deletes
the database volume and its data. Do not run it unless you intentionally want
to erase this Compose database.**

After changing an npm dependency or `package-lock.json`, rebuild the frontend:

```powershell
docker compose build frontend
docker compose up -d frontend
```

After changing Maven dependencies or `pom.xml`, rebuild the backend:

```powershell
docker compose build backend
docker compose up -d backend
```

For a clean image rebuild without reusing build layers (it still preserves named
runtime data volumes):

```powershell
docker compose build --no-cache frontend backend
docker compose up -d
```

## Check connectivity and migrations

Validate Compose interpolation without printing the rendered configuration:

```powershell
docker compose config --quiet
```

Check service health and startup logs:

```powershell
docker compose ps
docker compose logs --tail 150 db backend frontend
Invoke-WebRequest http://localhost:8080/actuator/health
Invoke-WebRequest http://localhost:8080/api/v1/products
```

The product request is an existing public frontend-to-backend API endpoint and
should return the standard JSON response envelope. To see whether Flyway applied
the schema:

```powershell
docker compose exec db psql -U rescuekaro -d rescuekaro_db -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

Use your configured `DB_USERNAME` and `DB_NAME` if you changed their defaults.

## Connect pgAdmin

Create a server in pgAdmin using:

- Host name/address: `127.0.0.1` (or `localhost`)
- Port: the configured `DB_PORT` (default `5432`)
- Maintenance database: the configured `DB_NAME` (default `rescuekaro_db`)
- Username/password: `DB_USERNAME` and `DB_PASSWORD` from the root `.env`

From another container on this Compose network, the database host and port are
`db:5432`; pgAdmin running on Windows uses the published localhost port.

## Port conflicts and existing PostgreSQL

If a port is already in use, change only the corresponding host port in `.env`.
For example, set `DB_PORT=5433` to avoid a Windows PostgreSQL service already
using 5432. Backend containers still connect to `db:5432`; changing `DB_PORT`
changes only the Windows-to-container published port. Similarly, use
`FRONTEND_PORT=3001` or `BACKEND_PORT=8081` when needed. Then open the app at the
new localhost port. The host PostgreSQL service and its databases are not
modified by this Compose setup.

Changing `DB_PASSWORD` in `.env` changes the password supplied to a newly
initialized PostgreSQL data directory. It does **not** change the password in an
already initialized named volume. To change an existing database password,
connect to that database and alter the PostgreSQL role password deliberately;
do not remove the data volume as a shortcut.

## Phone QR scanning

By default, sticker links use `localhost`, which works on the development PC but
not on a phone (`localhost` on the phone means the phone itself). The app and
backend ports are bound to `127.0.0.1`, so they are not exposed to the LAN or
public internet. Phone testing requires deliberately configuring a reachable
frontend URL and a safe access path for both frontend and API. Do not expose the
development services publicly by default. For HTTPS testing, also account for
secure-cookie behavior and trusted proxy headers.

## Troubleshooting

### A service stays unhealthy

```powershell
docker compose ps
docker compose logs --tail 200 db backend frontend
```

Check Docker Desktop is running, `.env` exists, the required values are set, and
the host ports are available. The backend waits for `pg_isready`; on first start,
Maven dependency downloads and database migration can take a few minutes. The
backend health check has a longer startup grace period for that initial build.

### Windows file changes are not detected

The Next.js container enables polling. If edits still fail to appear, restart
the affected service with `docker compose restart frontend` or
`docker compose restart backend`. On WSL2, file watching is generally more
reliable when the checkout is stored inside the WSL Linux filesystem rather than
under `/mnt/c` or another Windows-mounted path. Java changes are compiled by the
backend watcher before DevTools restarts the app; check backend logs for compile
errors.

### Migrations or database login fail

Inspect `docker compose logs db backend`. Confirm the Compose database variables
match the initialized database volume. If `.env` credentials were changed after
first initialization, remember that Postgres does not rewrite the stored role
password automatically. Keep the existing volume if it contains data you need.

### Compose configuration check fails

Make sure you ran the command from the project root and copied `.env.example` to
`.env`. `DB_PASSWORD` and `JWT_SECRET` must not be blank. Run
`docker compose config --quiet` again after correcting the values.
