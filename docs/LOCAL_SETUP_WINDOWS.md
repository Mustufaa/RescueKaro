# Windows local setup

Install Java 21, Node/npm, and PostgreSQL 16+, ensure PostgreSQL is running, then
use the development launcher. It securely prompts for the PostgreSQL password
when no configured password is available:

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
It is not printed or saved. The launcher verifies the PostgreSQL login and
creates `rescuekaro_db` if it does not exist. For a persistent setup, copy
`.env.example` to `.env` and replace the password placeholder; `.env` is ignored
by Git. Real process environment variables override file values.

Do not use PowerShell's `$env:NAME='value'` syntax at a `cmd.exe` prompt. Use
`set NAME=value` in Command Prompt or `$env:NAME='value'` in PowerShell.

In another terminal run `npm.cmd --prefix F:\RescueKaro\frontend run dev`. API health is `http://localhost:8080/api/v1/health`; actuator health is `/actuator/health`.

`localhost` inside a QR is not reachable from a phone. For physical testing, configure `PUBLIC_APP_URL` to a reachable HTTPS tunnel/development host (or an appropriate LAN host for local-only testing), restart the backend, and ensure the phone can reach both frontend and API. Docker is optional; without it, Testcontainers tests skip while unit tests still run.
