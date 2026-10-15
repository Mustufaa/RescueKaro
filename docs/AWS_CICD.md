# GitHub Actions on the existing AWS EC2 host

The AWS workflow checks Next.js (build, types, runtime proxy) and Java 21 (Maven verify, including Testcontainers on the runner). Deployment only follows successful checks on main. It uses OIDC and Systems Manager Run Command, not SSH credentials. Supabase and Resend secrets stay in `/home/ec2-user/rescuekaro/.env`.

Deployment is initially disabled. Merging this PR runs CI only. Add the repository variable `AWS_DEPLOY_ENABLED=true` only after completing setup below. No live deployment has been verified as part of this change.

## 1. Prepare EC2 for Systems Manager

In EC2, select the existing RescueKaro instance. Note its actual **instance ID**, **AWS account ID**, and **region**. The private hostname is not an instance ID.

In IAM, create an EC2 service role with the AWS-managed policy `AmazonSSMManagedInstanceCore`. Attach it through EC2 → Actions → Security → Modify IAM role. If an instance role already exists, add the policy to that role instead of replacing existing permissions.

On EC2:

```bash
sudo systemctl status amazon-ssm-agent --no-pager
sudo systemctl enable --now amazon-ssm-agent
git -C /home/ec2-user/rescuekaro status --short
sudo docker compose version
```

If the service is missing, install the official SSM Agent package for the host's OS and architecture first. The instance needs outbound HTTPS access to the regional Systems Manager endpoints and GitHub/build package registries. Confirm it appears **Online** in Systems Manager → Fleet Manager. No inbound SSH rule is needed for this workflow.

The application directory must be a Git checkout owned by `ec2-user`, with origin pointing to this public repository, a clean tracked working tree, the existing root `.env`, and passwordless `sudo docker` access (as on this host). Reconcile deliberate EC2-only configuration edits into Git before enabling deployments. Do not discard those edits blindly. This workflow uses the committed `compose.supabase.yaml`; confirm it matches live ports and settings. Compose must support `--wait` and `--wait-timeout`.

## 2. Configure GitHub OIDC in IAM

IAM → Identity providers → Add provider → OpenID Connect:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Reuse the provider if it already exists. Create role `RescueKaroGitHubDeploy` with this trust policy, replacing ACCOUNT_ID:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {"StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:Mustufaa/RescueKaro:environment:production"
    }}
  }]
}
```

Add this inline permissions policy to that GitHub deployment role, replacing REGION, ACCOUNT_ID, and INSTANCE_ID. This role is separate from the EC2 service role above.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:REGION:ACCOUNT_ID:instance/INSTANCE_ID",
        "arn:aws:ssm:REGION::document/AWS-RunShellScript"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ssm:GetCommandInvocation",
      "Resource": "*"
    }
  ]
}
```

## 3. Configure GitHub

Repository → Settings → Environments → create **production**. Restrict deployment branches to **main** (selected branches). Set this restriction before enabling deployment because the OIDC trust identifies the environment.

Repository → Settings → Secrets and variables → Actions → **Variables** → New repository variable:

| Name | Value |
| --- | --- |
| `AWS_REGION` | Actual EC2 region |
| `EC2_INSTANCE_ID` | Actual `i-...` instance ID |
| `AWS_ROLE_ARN` | ARN of `RescueKaroGitHubDeploy` |
| `AWS_DEPLOY_ENABLED` | Leave absent until ready; set to `true` to deploy |

These identifiers are not credentials. Do not add DB passwords, production `.env`, permanent AWS keys, or an SSH private key to this workflow.

Merge the reviewed workflow, script, and guide into main. Check both CI jobs pass. Then set `AWS_DEPLOY_ENABLED=true`, open Actions → **RescueKaro CI and AWS deployment** → Run workflow → main. On success, subsequent pushes/merges to main deploy automatically. PRs only run CI. Protect main with the `frontend` and `backend` checks to require CI before merging.

## Operational limits and recovery

Docker builds run on the existing EC2 instance, sequentially, after CI. Allow enough free memory and disk for builds alongside running containers; a very small instance can still run out of resources. There is no zero-downtime guarantee: container replacement can briefly interrupt requests. The script does not run `compose down`, delete volumes, prune images, overwrite `.env`, or perform database clean/reset operations. Existing Flyway startup behavior still applies pending migrations to Supabase.

Deployment refuses tracked local edits and checks out the tested commit in detached HEAD mode. It does not force-reset or clean the checkout. It serializes both GitHub deployment jobs and host-side deployment commands. Build or startup failures make the workflow fail. No automatic application or database rollback is performed. Before releases with migrations, ensure there is a recoverable database backup and review compatibility with the previous app version.

Inspect status on EC2 without printing production environment variables:

```bash
cd /home/ec2-user/rescuekaro
sudo docker compose --env-file .env -f compose.supabase.yaml ps
git rev-parse HEAD
cat .git/rescuekaro-previous-sha
```

For failures, inspect the GitHub job and Systems Manager Run Command status. If a runner times out or is cancelled, its remote command may continue: check the command status before retrying. The remote execution timeout is 40 minutes; the runner polls for up to 45 minutes. Review application logs privately because they can contain personal data.

If needed, first set `AWS_DEPLOY_ENABLED=false` and inspect whether the database migration permits an older application. The previous checkout SHA is recorded before replacing containers. After confirming compatibility, manually redeploy that commit using the deployment script (the commit must still be on origin/main):

```bash
cd /home/ec2-user/rescuekaro
previous_sha=$(cat .git/rescuekaro-previous-sha)
RESCUEKARO_ALLOW_OLDER_RELEASE=true bash scripts/deploy-ec2.sh "$previous_sha"
```

This rebuilds the older application; it does not undo migrations. For a failure before that record is written, use Git reflog to identify the previous checkout. After recovery, fix/revert main and run CI before enabling automatic deployment again.

References: [GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws), [Systems Manager Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/walkthrough-cli.html), [Compose up](https://docs.docker.com/reference/cli/docker/compose/up/).
