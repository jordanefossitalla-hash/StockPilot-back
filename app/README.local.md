# StockPilot Backend - Local Run

## Prerequisites
- Node.js 20+
- Docker + Docker Compose

## Environment
1. Copy .env.example to .env if needed.
2. Verify DATABASE_URL points to your local Postgres.

## Run with Docker
1. docker compose up -d db
2. npm install
3. npm run prisma:generate
4. npm run prisma:migrate
5. npm run prisma:seed
6. npm run start:dev

API base URL: http://localhost:4000/api/v1
Swagger: http://localhost:4000/docs
Health: http://localhost:4000/api/v1/health

## Quick login user (seed)
- email: admin@stockpilot.local
- password: Admin123!
