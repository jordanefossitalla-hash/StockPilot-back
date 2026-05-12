# StockPilot Backend - Modele de donnees (PostgreSQL)

## 1) Entites principales

- users
- refresh_tokens
- clients
- suppliers
- categories
- products
- stock_movements
- sales
- sale_items
- sale_payments
- orders
- order_items
- supplier_payments
- dashboard_snapshots (optionnel)

## 2) Champs clefs (resume)

users
- id (uuid, pk)
- email (unique)
- password_hash
- role (enum: admin|manager|agent)
- is_active
- created_at, updated_at

clients / suppliers
- id, code (unique), name, phone, email, address
- status (active|blocked|warning)
- balance (numeric)
- created_at, updated_at

products
- id, sku (unique), name, category_id
- cost_price, sale_price
- stock_quantity
- stock_min_threshold
- status
- created_at, updated_at

stock_movements
- id
- product_id
- type (entry|exit|adjustment|sale|order_receive)
- quantity
- unit_cost (nullable)
- reference_type (sale|order|manual)
- reference_id (nullable)
- note
- created_by
- created_at

sales
- id, code (unique)
- client_id
- status (draft|confirmed|partial|paid|cancelled)
- subtotal, total, paid_amount, remaining_amount
- sold_at
- created_by

sale_items
- id, sale_id, product_id, quantity, unit_price, line_total

sale_payments
- id, sale_id, amount, method, paid_at, recorded_by

orders
- id, code (unique)
- supplier_id
- status (draft|ordered|partial_received|received|cancelled)
- subtotal, total
- ordered_at, received_at
- created_by

order_items
- id, order_id, product_id, quantity, unit_cost, line_total, received_quantity

supplier_payments
- id, supplier_id, order_id (nullable), amount, paid_at, recorded_by

## 3) Contraintes et index

Contraintes:
- email unique users
- sku unique products
- code unique sales/orders/clients/suppliers
- remaining_amount >= 0
- stock_quantity >= 0 (ou strictement gere via service)

Index recommandes:
- clients(name), suppliers(name), products(name)
- sales(sold_at), orders(ordered_at)
- stock_movements(product_id, created_at)
- sales(status), orders(status)

## 4) Regles metier critiques

- Vente confirmee => decrement stock par item
- Annulation vente => compensation stock
- Reception commande => increment stock
- Paiement vente => maj paid_amount, remaining_amount, status
- Paiement fournisseur => maj balance fournisseur

## 5) Migrations

- Migrations Prisma versionnees en Git
- Seed initial: users admin + jeux de donnees demo

## 6) Types monetaires

- Utiliser NUMERIC(14,2) pour montants
- Eviter float/double pour finance

## 7) Timezone

- Stockage UTC en DB
- Conversion timezone au niveau presentation si besoin
