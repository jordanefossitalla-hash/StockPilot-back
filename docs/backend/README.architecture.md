# StockPilot Backend - Architecture

## 1) Structure projet recommandee

src/
- main.ts
- app.module.ts
- common/
  - decorators/
  - filters/
  - guards/
  - interceptors/
  - pipes/
  - utils/
- config/
  - env.validation.ts
  - swagger.config.ts
- database/
  - prisma.service.ts
  - prisma.module.ts
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

Chaque module contient:
- controller
- service
- dto
- entities/types
- tests unitaires

## 2) Pattern technique

- Controllers: HTTP only, pas de regle metier
- Services: logique metier + orchestration transactionnelle
- Repository/ORM: acces DB via Prisma
- DTOs: validation stricte en entree
- Mapper: conversion modele DB -> response DTO

## 3) AuthN/AuthZ

- Login retourne accessToken + refreshToken
- Access token court (15 min)
- Refresh token long (7 jours) avec rotation
- Logout invalide refresh token
- Role minimal V1: admin, manager, agent
- Guard JWT global sur routes privees

## 4) Gestion des erreurs

Format erreur JSON propose:
{
  "code": "VALIDATION_ERROR",
  "message": "Payload invalide",
  "details": [ ... ],
  "traceId": "..."
}

Codes metier minimum:
- VALIDATION_ERROR
- UNAUTHORIZED
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- STOCK_INSUFFICIENT
- BUSINESS_RULE_VIOLATION
- INTERNAL_ERROR

## 5) Transactions critiques

Transactions DB obligatoires pour:
- creation vente + lignes + decrement stock
- creation commande + lignes + increment stock si reception
- enregistrement paiement + mise a jour soldes
- correction de stock (ajustement)

## 6) Journalisation et audit

- Logs JSON (niveau, traceId, userId, route, duration)
- Audit table pour operations sensibles:
  - authentification
  - modification stock
  - annulation vente/commande
  - suppression logique d entites

## 7) Versioning et compatibilite

- Prefix API: /api/v1
- Toute rupture contractuelle -> /api/v2
- Deprecation documentee via OpenAPI

## 8) Tests

- Unit tests services critiques
- Integration tests endpoints principaux
- E2E smoke test sur parcours:
  - login
  - create client
  - create product
  - stock entry
  - sale create
  - dashboard summary
