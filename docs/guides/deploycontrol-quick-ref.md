# Deploy Control — Quick Reference for Non-Technical Members

> **Deploy Control** is Dhwani RIS's internal platform at [platform.dhwaniris.in](https://platform.dhwaniris.in). It has two features: **Quick Deploy** (spin up a site) and **GitHub Token Generator** (get a code-push token for AI tools).

**Last updated:** 2026-03-20

---

## Quick Deploy

Use this to request a new site for a client or project. DevOps handles the infrastructure — you just fill in the form.

### Steps

1. Log in at platform.dhwaniris.in
2. Click **Quick Deploy** -> **New Request**
3. Select **Client**, **Project**, **Environment** (DEV is the default), and **Frappe Version**
4. Select **apps** to install — Frappe Framework is pre-selected and locked; optional apps are:
   - ERPNext
   - HRMS
   - India Compliance
   - Mobile Control
5. Check **"Need a custom app repo?"** only if required — this pauses the pipeline and requires DevOps to intervene manually
6. Review the **Deployment Summary** -> set an admin password (minimum 6 characters)
7. Click **Request Deployment Approval**
8. Track progress in **Pipeline Tracker** — if stuck at Install Apps, use the **Request DevOps** button

### Pipeline Stages

```
Approval -> Create Repo -> Create Bench -> Create Site -> Install Apps
```

### Environment Types

| Environment | Purpose | Who Gets Access |
|-------------|---------|-----------------|
| **DEV** | Development and experimentation | Engineers, vibe coders |
| **UAT** | User acceptance testing | PMs, QA, client stakeholders |
| **Staging** | Pre-production validation | PMs, QA (client-facing) |
| **Production** | Live client site | Controlled access only |

**Rule:** Always deploy to DEV first. Promote to UAT after testing. Promote to Staging after UAT sign-off. Production deploys require explicit DevOps approval.

---

## GitHub Token Generator

Use this to get a short-lived token that lets an AI tool push code to a specific repo. No personal GitHub account needed.

### Steps

1. Log in at platform.dhwaniris.in
2. Click the **GitHub Token** tab
3. Enter the **exact repo name** — confirm this with your developer first, there is no validation
4. Click **Generate Scoped Token**
5. Copy the token immediately
6. Paste it into your AI tool (Claude Code, Codex, etc.) when prompted
7. Attach **Security_DRIS.md** and **CLAUDE.md** to your session before starting
8. Work on a feature branch -> push -> developer reviews -> developer merges

### Token Details

| Detail | Value |
|--------|-------|
| Lifetime | 1 hour |
| Scope | Single repo only |
| Permissions | Read + Write |
| Service account | dhwani-jenkins |

### Token Safety Rules

- Never store a token in a file, commit, or environment variable
- Never share a token over Slack, email, or any messaging tool
- Never paste a token into an AI prompt — use the tool's auth mechanism instead
- If a token is accidentally exposed, it expires in 1 hour — but report it to DevOps immediately
- Generate a fresh token for every session — do not reuse old tokens

---

## The Two Mandatory Files

| File | What It Is | Rule |
|------|-----------|------|
| **CLAUDE.md** | The AI's memory for your repo. Stores project context, tech stack, architecture decisions, session log. Lives in the repo root. | Update every session. Raise a PR to commit it. |
| **Security_DRIS.md** | Dhwani RIS security standards for AI-generated code. | Attach to every AI coding session. No exceptions. Never commit to public repos. |

### How to Attach These Files

**Claude Code (CLI):**
- CLAUDE.md: Place in repo root — Claude reads it automatically at session start
- Security_DRIS.md: Place in repo root or `~/.claude/` — Claude reads it automatically

**Claude UI (web):**
- Upload both files as attachments at the start of your conversation

**Cursor / Copilot:**
- Place both files in your project root — they are read as context files

---

## Frappe Bench — Common Commands Reference

For team members who need to run bench commands during vibe coding or deployment.

### Daily Operations

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `bench start` | Start the development server | Local development |
| `bench --site {site} migrate` | Run pending migrations | After pulling code changes |
| `bench --site {site} build --app {app}` | Build frontend assets for an app | After CSS/JS changes |
| `bench --site {site} clear-cache` | Clear all cached data | After DB changes (translations, property setters) |
| `bench restart` | Restart all bench processes | After code or config changes in production |

### Site Management

| Command | What It Does |
|---------|-------------|
| `bench new-site {site} --admin-password {pw}` | Create a new site |
| `bench --site {site} install-app {app}` | Install an app on a site |
| `bench --site {site} uninstall-app {app}` | Remove an app from a site |
| `bench --site {site} set-admin-password {pw}` | Reset admin password |
| `bench --site {site} console` | Open a Python console for the site |

### Code Updates

| Command | What It Does |
|---------|-------------|
| `bench get-app {url}` | Clone a Frappe app from a git URL |
| `bench update` | Pull all apps + migrate + build (use with caution) |
| `bench --site {site} execute {method}` | Run a specific Python method |

### Deployment Sequence (After PR Merge)

```bash
# 1. Pull the latest code
cd apps/{app} && git pull origin main && cd ../..

# 2. Run migrations
bench --site {site} migrate

# 3. Build frontend assets
bench --site {site} build --app {app}

# 4. Clear cache
bench --site {site} clear-cache

# 5. Restart (production only)
bench restart
```

**Important:** Never run `bench update` on production without DevOps approval — it pulls ALL apps and runs ALL migrations.

---

## Best Practices

| # | Practice | Why It Matters |
|---|----------|----------------|
| 1 | Always attach Security_DRIS.md | No guardrails = insecure code |
| 2 | Maintain CLAUDE.md in every repo | It is the agent's memory — without it, context is lost every session |
| 3 | Confirm repo name with your developer | No validation on the field — a wrong name silently fails |
| 4 | Generate a fresh token every session | Tokens expire in 1 hour — never reuse an old one |
| 5 | Work on a feature branch | Never push to `main` or `develop` directly |
| 6 | Dev reviews, dev merges | Every AI-generated change must go through a PR |
| 7 | Test on DEV/UAT before staging | Catch issues before they reach client-facing environments |
| 8 | Never commit secrets | No passwords, API keys, or tokens in code — ever |
| 9 | Update CLAUDE.md at end of session | The next session (yours or someone else's) depends on it |
| 10 | Start small, review often | Ask the AI for one change at a time, review output before moving on |

---

## Troubleshooting

| Problem | What to Do |
|---------|-----------|
| Cannot log in | Check credentials, try email link, contact DevOps |
| Client or project missing from dropdown | Get it added in People HRMS |
| Pipeline stuck at Install Apps | Use the Request DevOps button in Pipeline Tracker |
| Token does not work | Wrong repo name — confirm with developer and generate a new token |
| Token expired | Tokens last 1 hour — generate a new one |
| Push rejected | You are likely on a protected branch — create a feature branch first |
| `bench migrate` fails | Check error message — usually a missing app dependency or syntax error in the latest commit |
| `bench build` fails | Check for JavaScript/CSS syntax errors in the app's `public/` directory |
| Site shows old data after deploy | Run `bench --site {site} clear-cache` |
| "Site not found" error | Check `sites/currentsite.txt` or specify the site explicitly with `--site` |

---

## 60-Second Checklists

### Quick Deploy

- [ ] Logged in to platform.dhwaniris.in
- [ ] Client, Project, and Environment selected correctly
- [ ] Correct Frappe Version chosen
- [ ] Apps selected (only what is needed)
- [ ] Custom app repo checkbox checked only if required (will pause pipeline)
- [ ] Admin password set (min 6 characters)
- [ ] Deployment Approval requested
- [ ] Pipeline Tracker open to monitor progress

### GitHub Token Session

- [ ] Repo name confirmed with developer (exact spelling)
- [ ] Token generated at platform.dhwaniris.in -> GitHub Token tab
- [ ] Token copied immediately (not stored anywhere)
- [ ] Security_DRIS.md attached to AI session
- [ ] CLAUDE.md attached to AI session
- [ ] Working on a feature branch (not main or develop)
- [ ] Session complete -> CLAUDE.md updated -> PR raised for dev review

### Post-Deploy Verification

- [ ] Site is accessible at the expected URL
- [ ] Login works with admin credentials
- [ ] Key pages load without errors
- [ ] Data from previous environment carried over correctly (if applicable)
- [ ] Custom apps are listed in `bench --site {site} list-apps`
