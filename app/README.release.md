# StockPilot Backend - Release Checklist

## Production Readiness Checklist
1. Environment variables are set from .env.example with strong JWT secrets.
2. PostgreSQL backup policy is active (daily snapshots minimum).
3. API build and tests pass:
   - npm run build
   - npm run test
4. Prisma migration has been applied on target environment:
   - npm run prisma:migrate
5. Seed account removed or password rotated in non-local environments.
6. Health endpoints respond:
   - /api/v1/health
   - /api/v1/health/readiness
7. Swagger reachable for API validation:
   - /docs

## Fast Deploy Commands
1. npm install
2. npm run prisma:generate
3. npm run prisma:migrate
4. npm run build
5. npm run start:prod

## Docker Deploy (Local/Staging)
1. docker compose up -d db
2. npm run dev:bootstrap
3. npm run start:dev

## Critical Smoke Scenarios
1. Login -> refresh -> me
2. Create product -> stock entry -> stock status/history
3. Create sale -> verify stock decrement
4. Create order -> receive -> verify stock increment
5. Dashboard metrics and top products

## Automated Smoke Run
1. Start API and DB first.
2. Run: npm run test:smoke
3. Optional env overrides:
   - API_BASE_URL (default: http://localhost:4000/api/v1)
   - SMOKE_ADMIN_EMAIL (default: admin@stockpilot.local)
   - SMOKE_ADMIN_PASSWORD (default: Admin123!)

## One-Shot Release Pipeline (Windows)
1. From app folder, run: npm run release:oneshot
2. What it does automatically:
   - starts db container
   - install dependencies
   - prisma generate + migrate + seed
   - build API
   - start API in background
   - wait for health endpoint
   - run smoke test
   - stop API background process
3. Optional direct script flags:
   - -SkipDocker
   - -SkipSmoke
   - -ApiBaseUrl http://localhost:4000/api/v1
   - -HealthTimeoutSeconds 90
