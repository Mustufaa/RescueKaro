# GitHub Actions deployment to EC2

The `frontend` and `backend` jobs run on pull requests and main. After both pass on main, the `images` job builds linux/amd64 images on a GitHub runner and pushes full-SHA tags to GHCR. The `deploy` job runs only when `AWS_DEPLOY_ENABLED=true`; it sends the tested SHA and the two pushed image digests to EC2 over host-verified SSH. Production secrets stay in `/home/ec2-user/rescuekaro/.env`.

## One-time GitHub setup

1. Before merging this change, temporarily set repository variable `AWS_DEPLOY_ENABLED=false` while preparing EC2. Restore it to `true` after the checks below. The existing main-only condition and the `production` environment still gate deployment. Restrict the `production` environment to the main branch in **Settings → Environments**.
2. Keep the existing Actions secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, and `EC2_KNOWN_HOSTS`. `EC2_HOST` must be a DNS name or IP reachable by SSH from a GitHub-hosted runner; `EC2_USER` is `ec2-user` on this Amazon Linux host. The private SSH key must correspond to a public key in that user's `~/.ssh/authorized_keys`. Keep the key and known-hosts data in separate secrets. Populate `EC2_KNOWN_HOSTS` from the instance's actual SSH host public key, verified through a trusted EC2 console/session; do not trust an unverified `ssh-keyscan` result. The workflow requires strict host-key checking.
3. Ensure the EC2 security group and network permit SSH from the chosen runner egress path. GitHub-hosted runner IPs can change; use a controlled network path or maintain an appropriately restricted allowlist. Avoid opening SSH to the internet solely for this workflow.
4. In **Packages**, confirm both `rescuekaro-backend` and `rescuekaro-frontend` allow this repository's Actions to write, especially if either package already exists. The workflow grants only its image job `packages: write` and authenticates with the built-in `GITHUB_TOKEN`. Both images carry a source-repository label. Do not change package visibility as part of this rollout. New GHCR packages are private by default; check the actual visibility and access settings after their first push.
5. Protect main with the existing `frontend` and `backend` checks. Merge only after they pass. Once EC2 preparation is complete, set `AWS_DEPLOY_ENABLED=true` and run the workflow from **Actions → RescueKaro CI and AWS deployment → Run workflow → main**. Future main pushes deploy automatically after both tests and both image pushes succeed.

The old `AWS_REGION`, `EC2_INSTANCE_ID`, and `AWS_ROLE_ARN` repository variables and AWS OIDC/SSM permissions are no longer used by this workflow. Remove them later if no other automation uses them.

## One-time EC2 setup

1. Confirm `/home/ec2-user/rescuekaro` is a Git checkout of `Mustufaa/RescueKaro`, owned by `ec2-user`, with a clean tracked working tree and the existing root `.env`. Do not copy `.env` into GitHub or into an image build. Confirm passwordless `sudo docker`, Compose with `--wait`/`--wait-timeout`, `flock`, `curl`, and outbound HTTPS to `ghcr.io` and GitHub. No npm, Maven, or Docker build tool is needed on EC2 for deployments.
2. Keep the current Compose project name `rescuekaro-supabase`. The new `compose.production.yaml` has the same service names, runtime variables, ports, health check and dependency settings as `compose.supabase.yaml`. Its logging limits are 10 MB × 3 files per service. Check that the committed Compose settings still match the live service before enabling deployment.
3. If the GHCR packages are **private**, create a GitHub personal access token (classic) for a dedicated account that can read both packages, with `read:packages` and any repository access GitHub requires for that account. Authorize SSO if the account's organization requires it. Log Docker in as the same user that runs Docker during deployment (`root` via `sudo`). Type the token at the hidden prompt; the command does not print it or put it in shell history:

   ```bash
   read -r -s -p 'GHCR read token: ' GHCR_READ_TOKEN; printf '\n'
   printf '%s' "$GHCR_READ_TOKEN" | sudo docker login ghcr.io -u GITHUB_USERNAME --password-stdin
   unset GHCR_READ_TOKEN
   ```

   Replace `GITHUB_USERNAME` with the token owner's login. Check `/root/.docker/config.json` is readable only by root. Docker's default config may store a reversible credential there; use a Docker credential helper if available and rotate the token under your normal credential policy. If packages are public, anonymous pulls are possible and this EC2 login is unnecessary. Never publish private packages just to avoid authentication.
4. From a trusted admin session, verify repository access, the SSH authorized key, Docker and Compose, and root `.env` presence without printing secrets:

   ```bash
   cd /home/ec2-user/rescuekaro
   git status --short
   test -f .env
   sudo -n docker info >/dev/null
   sudo -n docker compose up --help | grep -- --wait-timeout
   ```

The Docker build contexts are `frontend/` and `backend/`, so the root `.env` is outside both. Both `.dockerignore` files exclude local/nested `.env` files, keys and secret directories. The build jobs have no production secrets or build secret inputs.

## Deployment and recovery

The deploy script holds a host-side `flock`, verifies the requested commit is on main, checks out that commit without resetting local edits, validates production Compose, and pulls **both** digest references before `compose up`. It then waits for Compose health and checks the frontend API health URL. GitHub also serializes production deployment jobs. It never runs `docker build`, npm or Maven on EC2, calls `compose down`, deletes volumes, prunes images, edits `.env`, or automatically reverses database migrations. Flyway startup may apply forward migrations; review backup and app compatibility before a release.

Immediately before replacing containers, the script writes `.git/rescuekaro-previous-sha` and `.git/rescuekaro-previous-images`. The latter contains the previous commit plus `backend` and `frontend` GHCR digest references. On the first transition from locally built images, it records `backend-image-id` and `frontend-image-id` instead because those images have no registry digest. Keep those local images for a possible manual rollback; the deployment does not prune them.

To inspect a release without printing environment variables:

```bash
cd /home/ec2-user/rescuekaro
cat .git/rescuekaro-previous-images
sudo docker ps --filter label=com.docker.compose.project=rescuekaro-supabase
git rev-parse HEAD
```

For a manual application rollback, first set `AWS_DEPLOY_ENABLED=false`, examine any database migration for backward compatibility, and inspect `.git/rescuekaro-previous-images`. For a previous digest-based release, read the two `ghcr.io/...@sha256:...` references and run the checked-in script from an admin session with the previous SHA and the two **digest portions** (backend first, frontend second):

```bash
cd /home/ec2-user/rescuekaro
previous_sha=$(cat .git/rescuekaro-previous-sha)
backend_ref=$(awk '$1 == "backend" {print $2}' .git/rescuekaro-previous-images)
frontend_ref=$(awk '$1 == "frontend" {print $2}' .git/rescuekaro-previous-images)
test -n "$backend_ref" && test -n "$frontend_ref"
RESCUEKARO_ALLOW_OLDER_RELEASE=true bash scripts/deploy-ec2.sh \
  "$previous_sha" "${backend_ref##*@}" "${frontend_ref##*@}"
```

This also overwrites the one-deep previous-image record with the now-current release; save a copy before rollback if you need both records. For the first transition, the previous images are local image IDs and the older commit may lack `compose.production.yaml`; manually restore those existing images with the old Compose file after checking migration compatibility. No database rollback is performed by the script.

References: [GitHub's image publishing guide](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [GHCR authentication and visibility](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [Compose pull](https://docs.docker.com/reference/cli/docker/compose/pull/).
