# StockPilot Backend

Backend API for StockPilot built with NestJS, TypeScript, Prisma, and PostgreSQL.

This project is production-oriented and provides:
- JWT authentication (access + refresh)
- REST API versioned under /api/v1
- Stock, sales, and orders transactional workflows
- Dashboard metrics endpoints
- Swagger documentation
- Unit tests and automated smoke run

## Tech Stack

- Node.js 20+
- NestJS 11
- Prisma ORM
- PostgreSQL
- Jest
- Docker Compose

## Features

- Auth
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET /auth/me
- Users
  - CRUD + pagination/search
- Clients / Suppliers / Products
  - CRUD + pagination/filtering
- Stock
  - GET /stock/status
  - GET /stock/history
  - POST /stock/entries
  - POST /stock/exits
  - POST /stock/adjustments
- Sales
  - GET /sales
  - POST /sales
  - GET /sales/:id
  - PATCH /sales/:id
  - POST /sales/:id/payments
  - POST /sales/:id/cancel
- Orders
  - GET /orders
  - POST /orders
  - GET /orders/:id
  - PATCH /orders/:id
  - POST /orders/:id/receive
  - POST /orders/:id/cancel
- Dashboard
  - GET /dashboard/metrics
  - GET /dashboard/monthly-performance
  - GET /dashboard/operations-evolution
  - GET /dashboard/stock-distribution
  - GET /dashboard/top-products

## Project Structure

src/
- common/
  - filters/
- config/
- database/
- modules/
  - auth/
  - users/
  - clients/
  - suppliers/
  - products/
  - stock/
  - sales/
  - orders/
  - dashboard/

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Start PostgreSQL (Docker)

```bash
docker compose up -d db
```

3. Configure environment

```bash
copy .env.example .env
```

4. Generate Prisma client and apply migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed demo data

```bash
npm run prisma:seed
```

6. Start API

```bash
npm run start:dev
```

## Default URLs

- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs
- Health: http://localhost:4000/api/v1/health
- Readiness: http://localhost:4000/api/v1/health/readiness

## Scripts

- Development
  - npm run start:dev
  - npm run build
  - npm run start:prod
- Database
  - npm run prisma:generate
  - npm run prisma:migrate
  - npm run prisma:seed
  - npm run dev:bootstrap
- Quality
  - npm run test
  - npm run test:cov
  - npm run test:smoke
  - npm run release:check
- Release
  - npm run release:oneshot

## One-Shot Release

For a complete Windows local release pipeline:

```bash
npm run release:oneshot
```

This command handles db startup, install, generate/migrate/seed, build, health check, smoke run, and cleanup.

## Testing

- Unit tests are located next to modules (.spec.ts)
- Smoke script: scripts/smoke-e2e.ts

Run all unit tests:

```bash
npm run test
```

Run smoke flow (API must be running):

```bash
npm run test:smoke
```

## Documentation

- Local run notes: README.local.md
- Release checklist: README.release.md
- Product/backend specs source: ../docs/backend/

## License

UNLICENSED (private project)
Jordane fossi talla 
