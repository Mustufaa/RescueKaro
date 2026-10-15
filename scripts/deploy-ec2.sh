#!/usr/bin/env bash
set -Eeuo pipefail

# Executed as ec2-user by AWS Systems Manager, never with bash -x.
app=/home/ec2-user/rescuekaro
sha=${1:?Pass the tested commit SHA}
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
cd "$app"
git rev-parse --is-inside-work-tree > /dev/null
exec 9>"$(git rev-parse --git-path rescuekaro-deploy.lock)"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }

test -f .env || { echo 'Production .env is missing' >&2; exit 1; }
test -z "$(git status --porcelain --untracked-files=no)" || {
  echo 'Tracked EC2 files have local changes. Reconcile them before deployment.' >&2
  exit 1
}
sudo -n docker info > /dev/null
sudo -n docker compose up --help | grep -q -- --wait-timeout
command -v curl > /dev/null

git fetch --no-tags origin main
git merge-base --is-ancestor "$sha" FETCH_HEAD || {
  echo 'Requested commit is not part of origin/main' >&2; exit 1;
}
if [[ "$sha" != "$(git rev-parse FETCH_HEAD)" && "${RESCUEKARO_ALLOW_OLDER_RELEASE:-false}" != true ]]; then
  echo 'A newer main commit exists; skipping this superseded deployment.'
  exit 0
fi
if git cat-file -e "$sha:.env" 2>/dev/null; then
  echo 'Refusing a release that tracks the production .env path' >&2
  exit 1
fi
previous_sha=$(git rev-parse HEAD)
git checkout --detach "$sha"

compose=(sudo -n docker compose --parallel 1 --project-name rescuekaro-supabase
  --env-file "$app/.env" -f "$app/compose.supabase.yaml")
"${compose[@]}" config --quiet
# Builds complete before Compose replaces any running application containers.
# Build sequentially to reduce pressure on a small EC2 instance.
"${compose[@]}" build backend
"${compose[@]}" build frontend
printf '%s\n' "$previous_sha" > "$(git rev-parse --git-path rescuekaro-previous-sha)"
"${compose[@]}" up -d --no-build --wait --wait-timeout 240

# Read the configured published port, including a non-default FRONTEND_PORT.
binding=$("${compose[@]}" port frontend 3000)
port=${binding##*:}
[[ "$port" =~ ^[0-9]+$ ]]
curl --fail --silent --show-error --max-time 15 \
  --retry 12 --retry-delay 5 --retry-all-errors \
  "http://127.0.0.1:$port/api/v1/health" > /dev/null
"${compose[@]}" ps
printf 'Successfully deployed %s\n' "$sha"
