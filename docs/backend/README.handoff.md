# StockPilot Backend - Handoff pour une autre instance Copilot

Ce document sert de checklist et de brief operable pour lancer le developpement complet backend.

## 1) Brief a donner a l instance suivante

Objectif:
- Implementer un backend NestJS + PostgreSQL complet pour StockPilot
- Respecter les documents dans docs/backend

Documents de reference obligatoires:
- README.backend.md
- README.architecture.md
- README.api.md
- README.data-model.md
- README.devops.md

## 2) Resultat attendu

A la fin, le backend doit inclure:
- code NestJS modulaire
- schema Prisma + migrations
- auth JWT access/refresh
- endpoints V1 complets
- Swagger OpenAPI
- tests unit + integration/e2e
- Docker Compose local
- README backend final executable

## 3) Ordre de travail recommande

1. Initialiser projet NestJS
2. Config env + Prisma + DB
3. Module auth + users
4. Modules clients/suppliers/products
5. Module stock transactionnel
6. Modules sales/orders
7. Module dashboard stats
8. Swagger + tests + docker + CI

## 4) Criteres d acceptance

- Build et tests passent
- Swagger couvre tous endpoints V1
- Flux critiques verifies:
  - login/refresh/logout
  - stock entry/exit
  - create sale (decrement stock)
  - receive order (increment stock)
- Pagination et filtres actifs sur listes

## 5) Risques a surveiller

- Incoherence stock en cas de concurrence
- Dette technique si DTO insuffisants
- Contrat API non aligne frontend
- Gestion erreurs heterogene

## 6) Prompt conseille pour la prochaine instance

"Develop the complete backend for StockPilot using NestJS + TypeScript + PostgreSQL + Prisma. Follow strictly the documents in docs/backend. Implement V1 modules: auth/users, clients, suppliers, products, stock, sales, orders, dashboard. Expose REST /api/v1 with Swagger. Add migrations, seed, tests, docker compose, and production-ready error handling and logging."
