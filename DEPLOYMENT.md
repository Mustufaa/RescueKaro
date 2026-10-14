# Supabase, Resend, and Cloud Run deployment

This repository prepares two independent containers: Next.js on Cloud Run and Java 21 Spring Boot on Cloud Run. Supabase hosts PostgreSQL; Resend sends transactional email over HTTPS. Nothing in this guide deploys a PostgreSQL container. Review costs and set billing alerts before creating resources; alerts are **not spending caps** and Cloud Run/Supabase/Resend are not guaranteed free.

## Database connection and data safety

In the Supabase Dashboard, open **Connect → Session pooler**. Copy its actual host and project reference. The backend runtime values are:

```text
DB_URL=jdbc:postgresql://SUPABASE_SESSION_POOLER_HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=YOUR_DATABASE_PASSWORD
```

Use the session pooler on port 5432. Keep the password separate from the JDBC URL. Spring uses the existing PostgreSQL JDBC driver, Flyway migrations, and `ddl-auto=validate`; Hikari starts with maximum 5 and minimum idle 0. With two backend instances the initial cap is 10 application connections, plus migration/administrative connections. Size this against the Supabase plan. [Supabase's connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres) confirms the pooler mode, port, and username form.

For an **empty Supabase database**, connect the backend and let Flyway apply V1–V4. Inspect startup logs and `flyway_schema_history`; never run Flyway clean. The migrations create the existing `BIGINT` physical sticker sequence, unique user phone/email constraints, and QR tables.

For **existing data that must be preserved**, do not point production at an empty database. First take a verified backup from the source, then restore schema, rows, sequences, and `flyway_schema_history` into the destination. Check row counts, current sequence values, existing QR public tokens and serials, and Flyway checksums before switching backend connection. Use a maintenance window so no new QR or user writes are lost. Obtain source and destination credentials privately; this repository does not perform that migration automatically. For dump/restore, Supabase [recommends a direct connection](https://supabase.com/docs/guides/database/connecting-to-postgres), not the pooled app connection. If the destination already contains objects, reconcile it carefully instead of blindly rerunning baseline SQL.

The frontend never uses Supabase credentials, a service-role key, or the Data API. In the Supabase Dashboard, [disable the Data API](https://supabase.com/docs/guides/api/securing-your-api#disable-the-data-api) if unused. If you keep it, enable RLS and least-privilege grants on every exposed application table. Do not assume the backend JWT protects Supabase's independent Data API.

## Resend setup

1. Create a Resend account, add a sending domain or subdomain you own, and add **the exact DNS records shown by Resend** at your DNS host. Wait for verification. Configure `EMAIL_FROM=RescueKaro <noreply@YOUR_VERIFIED_DOMAIN>` using that verified domain. [Resend's domain guide](https://resend.com/docs/dashboard/domains/introduction) covers this flow.
2. Create a sending API key in Resend. Store it only in backend runtime configuration as `RESEND_API_KEY`; use Secret Manager in Cloud Run. The code calls Resend's [Send Email API](https://resend.com/docs/api-reference/emails/send-email) and uses its [idempotency key](https://resend.com/docs/api-reference/emails/send-email#headers).
3. Resend's shared `onboarding@resend.dev` sender is for initial tests and is limited to the email address associated with your Resend account. Verify your own domain before sending signup codes to other people. Confirm the current account limits in your Resend dashboard.
4. For one controlled test, set the verified sender and key privately, run the local Compose stack, register using **your own inbox address**, and inspect the received code. Do not use a real user's address for automated testing. Inspect the Resend Emails and Logs views for accepted requests, bounces, and suppression; [Resend test addresses](https://resend.com/docs/dashboard/emails/send-test-emails) can simulate events but do not deliver to your inbox. An API acceptance ID is not proof of delivery.

## Local PowerShell Docker checks

```powershell
Set-Location F:\RescueKaro
# Create a private root .env containing LOCAL_DB_PASSWORD, JWT_SECRET,
# OTP_HASH_SECRET, API_PROXY_IP_SECRET, RESEND_API_KEY, and EMAIL_FROM.
# All .env files, including examples, are ignored by Git.
docker compose --env-file .env config --quiet
docker compose --env-file .env up --build -d
docker compose --env-file .env ps
Invoke-RestMethod http://localhost:3000/api/v1/health
docker compose --env-file .env logs --tail 100 backend
```

To test against Supabase without a local database, edit the root `.env` for `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and the intended `APP_PUBLIC_BASE_URL`, then run:

```powershell
docker compose --env-file .env -f compose.supabase.yaml config --quiet
docker compose --env-file .env -f compose.supabase.yaml up --build -d
docker compose --env-file .env -f compose.supabase.yaml ps
```

The default `docker compose up --build` starts a local PostgreSQL container. It requires `LOCAL_DB_PASSWORD` and uses `LOCAL_DB_USERNAME` (default `rescuekaro`); both are separate from the Supabase `DB_USERNAME` and `DB_PASSWORD`. If local application containers are running, stop them before starting the Supabase stack so ports 3000 and 8080 are available. Check `docker ps`, then use `docker stop rescuekaro-backend-1` and, if present, `docker stop rescuekaro-frontend-1`. Stopping containers leaves the local database volume intact. The Supabase backend runs pending Flyway migrations on startup, so review the target database and backups before starting it.

These examples use production Dockerfiles. The frontend image can be built without any production secrets. The backend image also has no embedded secrets. `API_INTERNAL_BASE_URL` is read by the Next.js route handler for each request, so a runtime change does not require rebuilding the frontend image. `SITE_URL` is a server-side metadata value. There are no required `NEXT_PUBLIC_*` variables; any added later would be embedded at build time.

## Manual Cloud Run commands (PowerShell)

Run these commands only after replacing placeholders. The first backend revision uses a reserved `.invalid` HTTPS origin because its Cloud Run frontend URL is not yet known. The application blocks new QR issuance while this placeholder is set. Keep secret values in local private files and do not paste them into commands or chat.

```powershell
Set-Location F:\RescueKaro
$ProjectId = 'YOUR_GCP_PROJECT_ID'
$Region = 'asia-south1'
$Repo = 'rescuekaro'
$Tag = 'release-001'
$Registry = "$Region-docker.pkg.dev/$ProjectId/$Repo"
$BackendImage = "$Registry/backend:$Tag"
$FrontendImage = "$Registry/frontend:$Tag"
$ServiceAccount = "rescuekaro-run@$ProjectId.iam.gserviceaccount.com"
gcloud auth login
gcloud config set project $ProjectId
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com iam.googleapis.com
gcloud artifacts repositories create $Repo --repository-format=docker --location=$Region --description='RescueKaro images'
gcloud iam service-accounts create rescuekaro-run --display-name='RescueKaro Cloud Run runtime'
```

Create five secrets in Secret Manager. The extra shared proxy secret signs the client IP sent from the frontend server, so backend OTP limits apply to individual clients. Each `*.secret.txt` below is a private one-line UTF-8 file without a trailing newline that you create locally; do not place it in the repository. If a secret already exists, add a new version instead of recreating it. Pin the version numbers used in deployments.

```powershell
$SecretFiles = @{
  'rescuekaro-db-password' = 'C:\PRIVATE\db-password.secret.txt'
  'rescuekaro-jwt-secret' = 'C:\PRIVATE\jwt.secret.txt'
  'rescuekaro-resend-api-key' = 'C:\PRIVATE\resend.secret.txt'
  'rescuekaro-otp-hash-secret' = 'C:\PRIVATE\otp-hash.secret.txt'
  'rescuekaro-proxy-ip-secret' = 'C:\PRIVATE\proxy-ip.secret.txt'
}
foreach ($Name in $SecretFiles.Keys) {
  $SecretFile = $SecretFiles[$Name]
  gcloud secrets create $Name --replication-policy=automatic
  gcloud secrets versions add $Name --data-file=$SecretFile
  gcloud secrets add-iam-policy-binding $Name --member="serviceAccount:$ServiceAccount" --role='roles/secretmanager.secretAccessor'
}
```

Build and push both images. Cloud Build and Artifact Registry permissions must be enabled for the build identity in your project.

```powershell
gcloud builds submit .\backend --region=$Region --tag=$BackendImage
gcloud builds submit .\frontend --region=$Region --tag=$FrontendImage
```

Deploy the backend first. Replace the Supabase pooler host, project reference, verified sending domain, and frontend origin placeholders. The temporary origin must be updated immediately after the frontend URL is known. The backend is public at the transport layer for this initial setup; protected endpoints still require application JWT authentication.

```powershell
$DbUrl = 'jdbc:postgresql://SUPABASE_SESSION_POOLER_HOST:5432/postgres?sslmode=require'
$DbUser = 'postgres.PROJECT_REF'
$BootstrapOrigin = 'https://not-configured.invalid'
$From = 'RescueKaro <noreply@YOUR_VERIFIED_DOMAIN>'
gcloud run deploy rescuekaro-backend --region=$Region --image=$BackendImage `
  --service-account=$ServiceAccount --allow-unauthenticated --ingress=all `
  --port=8080 --cpu=1 --memory=1Gi --cpu-throttling --min=0 --max=2 `
  --startup-probe='httpGet.path=/actuator/health/readiness,httpGet.port=8080,periodSeconds=10,failureThreshold=24,timeoutSeconds=5' `
  --liveness-probe='httpGet.path=/actuator/health/liveness,httpGet.port=8080,periodSeconds=30,failureThreshold=3,timeoutSeconds=5' `
  --set-secrets='DB_PASSWORD=rescuekaro-db-password:1,JWT_SECRET=rescuekaro-jwt-secret:1,RESEND_API_KEY=rescuekaro-resend-api-key:1,OTP_HASH_SECRET=rescuekaro-otp-hash-secret:1,API_PROXY_IP_SECRET=rescuekaro-proxy-ip-secret:1' `
  --set-env-vars="SPRING_PROFILES_ACTIVE=prod,DB_URL=$DbUrl,DB_USERNAME=$DbUser,EMAIL_PROVIDER=resend,EMAIL_FROM=$From,APP_PUBLIC_BASE_URL=$BootstrapOrigin,CORS_ALLOWED_ORIGINS=$BootstrapOrigin,DB_POOL_MAX_SIZE=5,DB_POOL_MIN_IDLE=0"
$BackendUrl = gcloud run services describe rescuekaro-backend --region=$Region --format='value(status.url)'
```

The frontend has no DB or email secrets. It listens on Cloud Run's `PORT` and sends its same-origin API traffic to the backend URL at runtime. The backend startup probe checks database readiness after Flyway; liveness checks only process state. Spring startup can take several minutes on a cold database.

```powershell
gcloud run deploy rescuekaro-frontend --region=$Region --image=$FrontendImage `
  --service-account=$ServiceAccount --allow-unauthenticated --ingress=all `
  --port=8080 --cpu=1 --memory=512Mi --cpu-throttling --min=0 --max=2 `
  --startup-probe='httpGet.path=/,httpGet.port=8080,periodSeconds=10,failureThreshold=12,timeoutSeconds=5' `
  --set-secrets='API_PROXY_IP_SECRET=rescuekaro-proxy-ip-secret:1' `
  --set-env-vars="API_INTERNAL_BASE_URL=$BackendUrl,NODE_ENV=production"
$FrontendUrl = gcloud run services describe rescuekaro-frontend --region=$Region --format='value(status.url)'
gcloud run services update rescuekaro-backend --region=$Region --update-env-vars="APP_PUBLIC_BASE_URL=$FrontendUrl,CORS_ALLOWED_ORIGINS=$FrontendUrl"
gcloud run services update rescuekaro-frontend --region=$Region --update-env-vars="SITE_URL=$FrontendUrl"
Invoke-RestMethod "$FrontendUrl/api/v1/health"
```

After assigning `rescuekaro.com` to the frontend and verifying DNS/TLS, update backend `APP_PUBLIC_BASE_URL` and `CORS_ALLOWED_ORIGINS` to `https://rescuekaro.com`, and frontend `SITE_URL` likewise. Verify newly generated QR URLs use that origin. Existing QR links and tokens remain unchanged; keep old frontend URLs routed if printed stickers already use them. Set a Cloud Billing budget and alerts in the Google Cloud console; alerts notify you but do not stop spending. Check Cloud Run, Cloud Build, Artifact Registry, network, Supabase, and Resend pricing for your expected use.

## Environment variables

| Variable | Purpose | Secret? | Consuming service |
| --- | --- | --- | --- |
| `DB_URL` | PostgreSQL JDBC URL; Supabase session pooler in production | No, if no credentials embedded | Backend |
| `DB_USERNAME` | PostgreSQL role / `postgres.PROJECT_REF` | No | Backend |
| `DB_PASSWORD` | Supabase PostgreSQL password | Yes | Supabase backend |
| `LOCAL_DB_USERNAME`, `LOCAL_DB_PASSWORD` | Local PostgreSQL role and password | Password only | Local Compose database and backend |
| `DB_NAME`, `DB_PORT` | Local Compose database name/host port | No | Local Compose |
| `DB_POOL_MAX_SIZE`, `DB_POOL_MIN_IDLE` | Hikari pool size | No | Backend |
| `JWT_SECRET` | Sign application JWTs | Yes | Backend |
| `OTP_HASH_SECRET` | HMAC verification codes and rate-limit identifiers | Yes | Backend |
| `API_PROXY_IP_SECRET` | Sign client IP at the frontend proxy for persistent OTP limits | Yes | Frontend server and backend |
| `EMAIL_PROVIDER` | Must equal `resend` | No | Backend |
| `RESEND_API_KEY` | Resend API authentication | Yes | Backend |
| `EMAIL_FROM` | Verified sender identity | No | Backend |
| `APP_PUBLIC_BASE_URL` | Origin in new QR URLs | No | Backend |
| `CORS_ALLOWED_ORIGINS` | Exact browser-direct origin allowlist | No | Backend |
| `API_INTERNAL_BASE_URL` | Fixed backend origin for runtime `/api/v1` proxy | No | Frontend server |
| `SITE_URL` | Frontend metadata origin | No | Frontend server |
| `PORT` | Cloud Run listener port | No | Both containers |
| `SPRING_PROFILES_ACTIVE` | `prod` for Cloud Run/Supabase | No | Backend |

## Verification after deployment

Check backend and frontend health, register using your own email address, verify the code, sign out and sign back in without a login code, reset the password, create an approved emergency profile, and generate a QR. Confirm the QR's origin is the actual frontend URL and that logged-out scans still show only approved emergency data. Inspect Spring/Flyway logs and Resend Emails/Logs on failure. An HTTP health response does not prove email delivery or data migration.
