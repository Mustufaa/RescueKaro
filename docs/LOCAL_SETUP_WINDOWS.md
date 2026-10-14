# Windows local setup

Install Java 21 and Node/npm, then use the development launcher. For the local
database path, also install and start PostgreSQL 16+. The launcher securely
prompts for the PostgreSQL password when no configured password is available:

```powershell
cd F:\RescueKaro\backend
.\run-dev.cmd
```

The same command works from Command Prompt (`cmd.exe`):

```bat
cd /d F:\RescueKaro\backend
run-dev.cmd
```

The password prompt is masked and its value is only passed to child processes.
It is not printed or saved. With no explicit `DB_URL`, the launcher verifies the local PostgreSQL login and
creates `rescuekaro_db` if it does not exist. For a persistent setup, create a
private `backend/.env` with `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`; add the
backend variables listed in `DEPLOYMENT.md` as needed. All `.env` files are
ignored by Git. Real process environment variables override file values.

If `backend/.env` sets `DB_URL` to a managed database such as Supabase, the
launcher skips local PostgreSQL discovery and database creation. Starting Spring
Boot still runs any pending Flyway migrations on the configured database, so
check the target and its backup before launching it.

Do not use PowerShell's `$env:NAME='value'` syntax at a `cmd.exe` prompt. Use
`set NAME=value` in Command Prompt or `$env:NAME='value'` in PowerShell.

In another terminal run `npm.cmd --prefix F:\RescueKaro\frontend run dev`. API health is `http://localhost:8080/api/v1/health`; actuator health is `/actuator/health`.

`localhost` inside a QR is not reachable from a phone. For physical testing, configure `APP_PUBLIC_BASE_URL` to a reachable HTTPS tunnel/development host (or an appropriate LAN host for local-only testing), restart the backend, and ensure the phone can reach both frontend and API. Docker is optional; without it, Testcontainers tests skip while unit tests still run.
