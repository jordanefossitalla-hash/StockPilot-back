# StockPilot Backend - DevOps, Run local et CI/CD

## 1) Environnements cibles

- local
- staging
- production

## 2) Docker Compose local (propose)

Services:
- api (nestjs)
- db (postgres)
- pgadmin (optionnel)

Variables minimales:
- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- CORS_ORIGIN

## 3) Commandes standard backend

- npm run start:dev
- npm run test
- npm run test:e2e
- npm run lint
- npm run build
- npm run prisma:migrate
- npm run prisma:seed

## 4) CI pipeline minimale

Etapes:
1. install
2. lint
3. test unit
4. build
5. test e2e (optionnel sur DB ephemeral)
6. image build

Gates qualite:
- lint obligatoire
- tests obligatoires
- build obligatoire

## 5) Strategie de deploiement

Option simple:
- build image Docker
- deploy sur VM/container service
- variables via secret manager

Option cloud:
- container registry + orchestration (ECS/Kubernetes/Cloud Run)

## 6) Securite operationnelle

- Secrets hors Git
- Rotation reguliere JWT secrets
- HTTPS obligatoire en prod
- CORS strict par environnement
- Backup PostgreSQL quotidien

## 7) Monitoring

- Healthcheck endpoint: GET /api/v1/health
- Metrics endpoint: GET /api/v1/metrics (optionnel)
- Logs centralises (json)
- Alerting sur:
  - taux erreur 5xx
  - latence P95
  - saturation DB

## 8) Plan de secours

- Procedure rollback image N-1
- Procedure restore DB depuis backup
- Runbook incident (auth down, db slow, stock inconsistency)
