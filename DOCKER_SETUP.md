# Docker setup

Use the local and Supabase Compose commands in [DEPLOYMENT.md](DEPLOYMENT.md). Production Dockerfiles build independently of database and email credentials. The frontend's `API_INTERNAL_BASE_URL` is read by its Next.js route handler at request time, so changing the backend URL requires only a frontend restart or new Cloud Run revision, not an image rebuild.

The default `docker compose up --build` uses the local PostgreSQL container and `LOCAL_DB_PASSWORD`. To use the Supabase credentials in the root `.env`, run `docker compose --env-file .env -f compose.supabase.yaml up --build`. The Supabase stack starts the backend and frontend only. Check the database and its backup before starting it because Flyway applies pending migrations on backend startup.

`docker compose down` stops the stack without deleting its PostgreSQL volume. Keep backups before switching databases. Do not use `down -v` for data you need.
