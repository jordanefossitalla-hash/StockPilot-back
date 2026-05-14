# StockPilot Back

StockPilot backend monorepo root.

## Structure

- app: NestJS backend API (production code)
- docs: project specifications and architecture docs

## Main Docs

- Backend README: app/README.md
- Release checklist: app/README.release.md
- Local setup: app/README.local.md

## CI/CD

GitHub Actions workflows are configured in:
- .github/workflows/ci.yml
- .github/workflows/cd-vps.yml

CD workflow deploys to VPS over SSH using GitHub Secrets.
Required secrets:
- VPS_HOST
- VPS_USER
- VPS_SSH_KEY
- VPS_PORT
- VPS_APP_DIR

Deployment guide for a fresh VPS:
- DEPLOY_VPS.md

## Quick Start

From app directory:

```bash
npm install
npm run dev:bootstrap
npm run start:dev
```
jordan talla