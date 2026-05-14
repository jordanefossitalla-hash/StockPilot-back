# StockPilot Backend - Contrat API REST (V1)

Base URL:
- Local: http://localhost:4000/api/v1

## 1) Auth

POST /auth/login
- body: { email, password }
- 200: { accessToken, refreshToken, user }

POST /auth/refresh
- body: { refreshToken }
- 200: { accessToken, refreshToken }

POST /auth/logout
- body: { refreshToken }
- 204

GET /auth/me
- header: Authorization: Bearer <token>
- 200: user profile

## 2) Users

GET /users
POST /users
GET /users/:id
PATCH /users/:id
DELETE /users/:id

Notes:
- soft delete recommande
- role et statut utilisateur exposes pour Settings Users page

## 3) Clients

GET /clients?search=&status=&page=&limit=&sort=
POST /clients
GET /clients/:id
PATCH /clients/:id
DELETE /clients/:id

Endpoints utiles detail page:
GET /clients/:id/history
GET /clients/:id/stats

## 4) Suppliers

GET /suppliers?search=&status=&page=&limit=&sort=
POST /suppliers
GET /suppliers/:id
PATCH /suppliers/:id
DELETE /suppliers/:id

POST /suppliers payload propose:
{
  "code": "SUP-0001",
  "name": "Global Distribution SARL",
  "phone": "+237699112233",
  "email": "contact@global-distribution.cm",
  "address": "Douala, Akwa",
  "status": "ACTIVE",
  "balance": 50000
}

Detail:
GET /suppliers/:id/history
GET /suppliers/:id/stats
POST /suppliers/:id/payments
POST /suppliers/:id/supplies

## 5) Products

GET /products?search=&category=&status=&page=&limit=&sort=
POST /products
GET /products/:id
PATCH /products/:id
DELETE /products/:id

Detail:
GET /products/:id/history
GET /products/:id/stats

## 6) Stock

GET /stock/status?search=&lowStockOnly=&page=&limit=
GET /stock/history?productId=&from=&to=&page=&limit=
POST /stock/entries
POST /stock/exits
POST /stock/adjustments

Regles:
- sortie refusee si stock insuffisant
- chaque mouvement cree une ligne historique

## 7) Sales

GET /sales?status=&from=&to=&clientId=&page=&limit=
POST /sales
GET /sales/:id
PATCH /sales/:id
POST /sales/:id/payments
POST /sales/:id/cancel

POST /sales payload propose:
{
  "clientId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 1200 }
  ],
  "paidAmount": 1000,
  "note": "optional"
}

## 8) Orders

GET /orders?status=&from=&to=&supplierId=&page=&limit=
POST /orders
GET /orders/:id
PATCH /orders/:id
POST /orders/:id/receive
POST /orders/:id/cancel

## 9) Dashboard

GET /dashboard/metrics
GET /dashboard/monthly-performance
GET /dashboard/operations-evolution
GET /dashboard/stock-distribution
GET /dashboard/top-products

## 10) Convention de reponse

Succes liste:
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 120 }
}

Succes detail:
{
  "data": { ... }
}

Erreur:
{
  "code": "...",
  "message": "...",
  "details": [],
  "traceId": "..."
}
