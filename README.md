# Mi Tiendita — Abarrotes

POS para **tiendas de abarrotes** y comercios de barrio. Multi-tenant, caja, catálogo e impresión de tickets.

Stack: Vue.js (frontend), Express.js (backend) y MongoDB.

## Correr en local
```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:8081  

Copia `backend/.env.example` → `backend/.env`.

## Flujo de la tienda
1. **Vender** (`/pos`) — categorías + productos → ticket → *Registrar venta*
2. **Caja** (`/orders`) — abrir turno, cobrar, imprimir ticket, corte
3. **Productos** (`/products`) — categorías y artículos (solo admin)
4. **Más** — resumen, empleados, facturación SaaS, configuración

Rutas antiguas de restaurante (`/main`, `/kitchen`, `/waitlist`) redirigen al POS.

## Configuración inicial
Tras registrarte, el wizard pide nombre de tienda, tipo (abarrotes / conveniencia / farmacia) y logo.

## Billing (suscripción Mi Tiendita)
SaaS **100% nube** (sin instalar). **Básico** $150 · **Crecimiento** $399 · **Pro** $799 /mes. Incluyen **Inventario Mágico**. Ver `/billing`.

## Platform admin
```bash
cd backend && npm run seed:platform-admin
```
Login `platform` / `Platform123!` → `/platform`

## Docker
```bash
docker compose up --build -d
```
