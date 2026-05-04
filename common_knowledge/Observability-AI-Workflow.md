## Observability → Seer → Claude workflow

This repo already uses Datadog for runtime observability (see [`common_knowledge/Datadog.md`](./Datadog.md)). This guide and accompanying GitHub Action wire that signal into an AI-driven remediation loop inspired by the "Sentry + Seer + Claude" workflow described in the shared post.

### What you get
- Datadog (or Sentry, if enabled) raises an error and calls a GitHub repository dispatch webhook.
- The new `observability-seer-autofix.yml` workflow forwards that payload to Seer (or any compatible webhook endpoint) so it can attempt a fix and open a PR.
- Once the PR is opened, the Claude Code Review GitHub App can automatically review it.

### 1) Configure secrets in GitHub
Add these to the repo’s **Settings → Secrets and variables → Actions**:
- `SEER_WEBHOOK_URL`: The Seer/Codex/AI remediation webhook that accepts a JSON payload describing the incident.
- `SEER_WEBHOOK_TOKEN`: Bearer/API token for that endpoint.
- `OBSERVABILITY_SOURCE_URL` (optional): Link back to Datadog/Sentry for the alert; used only for context in the payload and Action summary.

### 2) Wire Datadog (current logging/alerting stack)
1. Create or update a monitor and add a **Custom Webhook** notification.
2. Point it to GitHub’s repository dispatch endpoint:
   ```
   POST https://api.github.com/repos/hicommonwealth/commonwealth/dispatches
   Authorization: Bearer <PAT with repo:dispatch scope>
   Accept: application/vnd.github+json

   {
     "event_type": "observability_error",
     "client_payload": {
       "source": "datadog",
       "title": "{{title}}",
       "severity": "{{severity}}",
       "service": "{{service.name}}",
       "link": "{{link}}",
       "message": "{{text}}",
       "host": "{{host.name}}",
       "timestamp": "{{timestamp}}"
     }
   }
   ```
3. Save the monitor; Datadog will now ping the repo when the alert fires.

### 3) (Optional) Wire Sentry
If you also run Sentry, add a **Custom Webhook** integration pointing to the same dispatch URL. Map fields such as `event_type="observability_error"`, `source="sentry"`, `title`, `culprit`, `timestamp`, and a link to the issue/permalink.

### 4) Claude Code Review
Install the Claude Code Review GitHub App for this repo. No workflow changes are needed—Claude will review any PR Seer opens.

### 5) How the GitHub Action works
- File: [`.github/workflows/observability-seer-autofix.yml`](../.github/workflows/observability-seer-autofix.yml)
- Triggers: `repository_dispatch` with `event_type: observability_error` or manual `workflow_dispatch`.
- Steps:
  1. Validate that `SEER_WEBHOOK_URL` and `SEER_WEBHOOK_TOKEN` are present; fail fast if not.
  2. Capture the incoming payload into `seer-payload.json` (includes source, title, severity, links, and commit info).
  3. `curl` the payload to the configured Seer webhook so Seer can attempt the fix and open a PR.
  4. Publish a short summary (and link back to Datadog/Sentry if provided) in the GitHub Actions log.

### 6) Manual kick-off for testing
You can dry-run via **Actions → Observability → Run workflow** and provide sample inputs (title, severity, message, link). The Action will send those to Seer using the same secrets.

### Notes & guardrails
- The Action does not modify code; it delegates remediation to your Seer/Codex endpoint. Ensure that endpoint is responsible for opening the PR with changes.
- Use a narrowly scoped PAT for the Datadog/Sentry webhook that can only dispatch events (no write code permissions).
- If you later add other telemetry systems, reuse the same `event_type` and payload shape so the workflow stays compatible.
