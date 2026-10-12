# Deploy RescueKaro on Render

The repository has `frontend/` (Next.js 15, npm), `backend/` (Java 21, Spring Boot, Maven), and `render.yaml` at the root. Next.js is a Node web service because the app has dynamic `/qr/[publicToken]` routes and a same-origin `/api/v1` proxy. The backend is a Docker web service. PostgreSQL holds users, OTP challenges, orders, profiles, QR tokens, and serials; Flyway owns schema migrations and Hibernate validates them. Local `compose.yaml` remains a development option.

**The Blueprint explicitly selects Free plans for preview/testing. Do not use them for emergency QR production availability.** Render's Free web services sleep after 15 minutes without inbound traffic and may take about a minute to wake. Two running Free web services share a workspace allowance of 750 instance-hours per calendar month. Free Postgres expires 30 days after creation, with a 14-day upgrade grace period; after that, data is deleted. Free web services cannot receive private network traffic and cannot send SMTP traffic on ports 25, 465, or 587. For real email OTP on a Free backend, use an SMTP provider that supports another port such as 2525; otherwise choose a suitable always-on plan. Production needs always-on frontend and backend services, durable Postgres, a working email provider, monitoring, and a tested restore process. Review [Render Free limits](https://render.com/docs/free) before creating services.

## Push the repository

Review `git status` and `git diff` first. Keep `.env`, `.neon`, secrets, and local data out of Git. Commit the intended changes, including `render.yaml`, both service directories, and the lockfiles, then push the branch to GitHub. For example, after review: `git add render.yaml RENDER_DEPLOYMENT.md README.md DEPLOYMENT.md backend frontend` followed by `git commit -m "Prepare RescueKaro for Render"` and `git push origin <branch>`. The working tree contains other in-progress changes; include those only after reviewing them. Connect that GitHub repository and branch to Render.

## Blueprint deployment

1. In Render, choose **New > Blueprint**, select the repository and branch, and review the proposed resources and plan before approving creation. This task does not provision them.
2. `render.yaml` creates `rescuekaro-db`, `rescuekaro-backend`, and `rescuekaro-frontend` in Singapore. It explicitly selects Free plans for testing. If that region or plan is unsuitable, edit the file *before* creating resources. Never accept an unintended paid plan.
3. Render prompts for `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM`. Enter real private values in Render, never in Git. The backend requires working SMTP settings and strong `JWT_SECRET` and `OTP_HASH_SECRET`. The Blueprint generates the two secrets without putting them in the repository. It does not expose secrets through `NEXT_PUBLIC_*` variables.
4. The Blueprint references the database's **internal** connection string as `RENDER_DATABASE_URL`. Backend startup converts `postgresql://user:password@host:port/name` to a JDBC URL and separate credentials. The connection remains on Render's private network; the raw `postgresql://` URL is never handed to JDBC. It also references the frontend's Render hostname as `RENDER_FRONTEND_HOST`, from which the backend derives `https://...` for CORS and new QR links. No service URL needs to be guessed before creation.
5. For the Free preview, the frontend receives the backend's public `*.onrender.com` hostname as `API_INTERNAL_BASE_URL`. Its Next.js rewrite supplies `https://` and `/api/v1` exactly once. This public hop is required because a Free backend cannot receive private network traffic. Browser traffic still stays on the frontend origin. `SITE_URL` defaults to the Render frontend HTTPS hostname for metadata. When you move the backend to a paid plan, change the Blueprint reference to its `hostport` property, rebuild the frontend, and use the private route.
6. Wait for Flyway and both services to start. Test the routes below before using any issued QR links. If a Free Docker instance runs out of memory, change the backend plan deliberately after reviewing Render pricing; the Blueprint does not select a paid plan.

Render's `sync: false` values are prompted only on initial Blueprint creation. Add or change them manually under the backend service's **Environment** tab on later syncs. Blueprint cross-service references update on sync, not immediately after a referenced value changes. See the [Blueprint reference](https://render.com/docs/blueprint-spec).

## Manual service creation

Create the Postgres database first in the **same region** as both web services. For testing, Free is an option with the expiry above; select a durable plan for production. Preserve any existing populated database and migrate its data deliberately; do not start with a blank database if printed QR tokens and user data must remain valid. Use the database's **internal** host/port/name/user/password. Do not use its external connection URL for same-region services.

| Resource | Render setting | Value |
| --- | --- | --- |
| Backend | Type/runtime | Web Service / Docker |
| Backend | Root directory | Repository root (blank) |
| Backend | Docker context | `./backend` |
| Backend | Dockerfile path | `./backend/Dockerfile` |
| Backend | Build/start | Dockerfile multi-stage Maven build / Dockerfile `java -jar app.jar` |
| Backend | Health check | `/api/v1/health` |
| Frontend | Type/runtime | Web Service / Node.js |
| Frontend | Root directory | `frontend` |
| Frontend | Build command | `npm ci && npm run build` |
| Frontend | Start command | `npm run start -- -H 0.0.0.0 -p $PORT` |
| Frontend | Health check | `/` |

The backend listens on `0.0.0.0:${PORT}` and defaults to 8080 locally. The frontend start command binds `0.0.0.0` and Render's `PORT`. Node and Java builds use the checked-in npm lockfile and Maven project, respectively. The Docker runtime uses an unprivileged user. No persistent app files are required by the current QR flow.

For a manual backend setup, either set `RENDER_DATABASE_URL` to Render Postgres's **internal** `postgresql://` connection string, or set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` from the internal connection details. A `DATABASE_URL` override must be a **JDBC** URL such as `jdbc:postgresql://<internal-host>:5432/<database>`; set `DB_USERNAME` and `DB_PASSWORD` separately. Do not paste a `postgresql://` URL into `DATABASE_URL`. Use `SPRING_PROFILES_ACTIVE=prod`, generated `JWT_SECRET` and `OTP_HASH_SECRET` of at least 32 characters each, and the SMTP settings. `SERVER_PORT` can override the local fallback, but Render provides `PORT`.

For a manual frontend setup, set `API_INTERNAL_BASE_URL` **before building**. With a Free backend, use its public `*.onrender.com` hostname or full `https://<backend>.onrender.com/api/v1` URL. With a paid backend in the same region, use its private `host:port` or `http://host:port/api/v1`. Set `SITE_URL` to the frontend public HTTPS origin for metadata, or let the app use `RENDER_EXTERNAL_HOSTNAME`. Keep all database, SMTP, JWT, and OTP secrets on the backend. No `NEXT_PUBLIC_*` secret is used.

For manual URLs, set backend `FRONTEND_URL` to the exact frontend HTTPS origin allowed by CORS and `PUBLIC_APP_URL` to the HTTPS origin embedded in newly generated QR URLs. The Blueprint derives both from `RENDER_FRONTEND_HOST` if you omit them. You can create the frontend and backend without knowing their final URLs, then set these two values after Render assigns the hostname and redeploy the backend. The same-origin proxy handles normal browser API calls; explicit CORS still governs cross-origin calls.

## Domain and URL changes

Attach your RescueKaro custom domain to the **frontend** Render web service, follow Render's DNS and TLS instructions, and confirm HTTPS works. Then set frontend `SITE_URL=https://<your-domain>` and backend `FRONTEND_URL=https://<your-domain>` plus `PUBLIC_APP_URL=https://<your-domain>`; do not add a trailing slash. Rebuild/redeploy the **frontend** after changing `SITE_URL` or `API_INTERNAL_BASE_URL`, because Next.js reads the rewrite during build and metadata can be pre-rendered. Redeploy the **backend** after changing `FRONTEND_URL`, `PUBLIC_APP_URL`, database settings, or secrets. Sync the Blueprint again if a referenced service hostname changes, then rebuild the frontend proxy.

The URL path generated for a sticker is `/qr/<serial>/<private-token>`. The serial and token stay in PostgreSQL. The app also keeps `/qr/<private-token>` for existing one-token links. Changing `PUBLIC_APP_URL` affects **newly generated** links and QR images, but does **not** automatically repair already printed QR stickers: their old hostname remains in the printed pixels. Keep the old domain routed to this frontend or reprint affected stickers. Do not reset the QR sequence, token values, or Flyway history.

## Verification and troubleshooting

1. Check `https://<backend>.onrender.com/api/v1/health` returns a small `UP` response and `https://<frontend>.onrender.com/` loads. `/actuator/health` exists, but the Blueprint uses the narrow application health path and does not expose other Actuator endpoints.
2. Check `https://<frontend>.onrender.com/api/v1/health` and `/api/v1/products`. A proxy 404 or 502 usually means `API_INTERNAL_BASE_URL` is wrong, points at a private Free backend, lacks the reachable paid private port, or the frontend was not rebuilt after changing it. The prefix is `/api/v1` exactly once.
3. Inspect backend startup logs for a Flyway migration success and Hibernate validation. A database login failure means the internal connection details are wrong, the service is in another region, or a raw `postgresql://` URL was put in `DATABASE_URL`. Do not delete a database or migration table to bypass an error.
4. With real SMTP credentials, test registration, email OTP delivery and verification, login, password reset, dashboard data, and digital QR generation. Free web instances cannot contact SMTP ports 25/465/587. If email fails, use a supported alternate port from your provider or a plan that allows the required connection.
6. After a test sticker request, open the exact owner QR URL in a logged-out browser, confirm approved emergency details and tap-to-call links, then update the profile and scan again. A QR page 404 can mean the URL was issued on a different host, the token/serial does not match, the sticker is inactive, or a migration/database switch lost the original data. The two route shapes above must remain available.
7. For CORS errors on direct cross-origin requests, compare the request's Origin header with backend `FRONTEND_URL` exactly, including scheme and subdomain. For ordinary app calls, confirm the browser uses the frontend's `/api/v1` path, not the backend's private hostname.

If a deployment build fails, inspect the relevant Render build log. The frontend must run `npm ci` inside `frontend/`; the backend Docker build context must be `./backend`. Startup failures often come from missing generated secrets, SMTP settings, an inaccessible database, or Flyway validation. A healthy `/api/v1/health` only proves the process answers requests; it does not prove email, payment, authentication, or public scans work. Local validation does not prove Render deployment succeeded.
