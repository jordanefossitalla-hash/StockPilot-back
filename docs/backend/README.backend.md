# StockPilot Backend - README principal

Ce document definit la vision et le scope du backend StockPilot pour un demarrage de developpement complet via une autre instance Copilot.

## 1) Objectif

Construire un backend robuste pour alimenter le frontend StockPilot avec:
- auth securisee (JWT access + refresh)
- API REST documentee OpenAPI
- persistence PostgreSQL
- architecture modulaire et testable

## 2) Stack cible

- Runtime: Node.js 20+
- Framework: NestJS + TypeScript
- DB: PostgreSQL
- ORM: Prisma (recommande)
- Validation: class-validator + class-transformer (DTO Nest)
- Auth: JWT access token + refresh token rotation
- Docs API: Swagger OpenAPI
- Tests: Jest + Supertest
- Lint/format: ESLint + Prettier
- Packaging: Docker + Docker Compose

## 3) Scope fonctionnel V1

Modules requis:
- Auth / Users
- Clients
- Fournisseurs
- Produits
- Stock (mouvements entree/sortie + etat)
- Ventes
- Commandes
- Dashboard / Stats

## 4) Principes d architecture

- Monolithe modulaire NestJS
- Regles metier dans les services (pas dans les controllers)
- DTO explicites pour toutes les entrees/sorties
- Endpoints REST versionnes: /api/v1/...
- Erreurs normalisees (code, message, details)
- Transactions DB pour operations critiques (vente, commande, stock)
- Tracabilite des mouvements de stock et paiements

Voir details dans:
- README.architecture.md
- README.api.md
- README.data-model.md
- README.devops.md
- README.handoff.md

## 5) Exigences non fonctionnelles

- Securite: hash mot de passe, refresh token stocke de facon securisee, rate-limit auth
- Performance: pagination par defaut, index DB sur filtres frequents
- Qualite: couverture tests mini 70% sur services critiques
- Observabilite: logs structurels, correlation-id

## 6) Contrat de livraison backend V1

Definition of Done minimale:
- Tous les endpoints V1 implementes et testes
- Swagger complet et coherent
- Migrations DB versionnees
- Docker Compose up fonctionnel (api + postgres)
- Seed de donnees de demo
- README de run local et CI/CD valides

## 7) Plan d implementation recommande

1. Bootstrap NestJS + Prisma + PostgreSQL + auth
2. Implementer modules de reference: Users + Clients + Produits
3. Implementer Stock avec transactions
4. Implementer Ventes + Commandes + paiements
5. Implementer Dashboard/Stats
6. Finaliser tests, docs, docker, CI

## 8) Variables d environnement (proposees)

- NODE_ENV=development
- PORT=4000
- API_PREFIX=api/v1
- DATABASE_URL=postgresql://...
- JWT_ACCESS_SECRET=...
- JWT_ACCESS_EXPIRES_IN=15m
- JWT_REFRESH_SECRET=...
- JWT_REFRESH_EXPIRES_IN=7d
- CORS_ORIGIN=http://localhost:5173
- RATE_LIMIT_TTL=60
- RATE_LIMIT_MAX=100

## 9) Compatibilite frontend

Le backend doit repondre aux besoins des pages frontend deja existantes:
- dashboard
- clients
- fournisseurs
- produits
- stock status/history/entry/exit
- sales
- orders
- settings users/profile/shop

Les formats de payloads de sortie doivent rester stables et documentes.
