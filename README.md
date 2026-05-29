# Group Project 2026 - E-Commerce System

This implementation covers the **Web App** and **Mobile App** requirements from the "Group Project 2026" brief, including:

- User registration and login
- Product catalog with search and filtering
- Shopping cart management
- Checkout with simulated payment
- Order tracking with status timeline
- Admin dashboard for products, users, and orders (web)

The **testing section is intentionally not implemented yet**, as requested.

## Project Structure

- `backend/` - REST API and data layer
- `web/` - React web application
- `mobile/` - Expo React Native mobile application

## Default Seed Accounts

- Admin:
  - Email: `admin@datamak.local`
  - Password: `Admin@123`
- Customer:
  - Email: `customer@datamak.local`
  - Password: `Customer@123`

## 1. Run Backend

```bash
cd backend
npm install
npm run db:init
npm run dev
```

Backend runs on `http://localhost:4000`.

The backend now uses PostgreSQL. Create `backend/.env` from `backend/.env.example`
and set `DATABASE_URL` before running `npm run db:init`.

Example:

```bash
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/datamak_ecommerce
```

On first initialization, the backend creates the PostgreSQL tables and imports
existing seed data from `backend/data/db.json` if that file is present.

## 2. Run Web App

```bash
cd web
npm install
npm run dev
```

Web runs on `http://localhost:5173`.

To point web to a different API URL, create `web/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## 3. Run Mobile App

```bash
cd mobile
npm install
npm run android
```

The mobile app runs in Expo LAN mode and automatically tries the same LAN host
used by the Expo dev server. Keep the backend running while you scan the Expo
QR code or open the Android app.

If your network changes while Expo is open, stop Expo and run `npm run android`
again so the phone receives the new bundle.

You can still force a specific API URL with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:4000/api
```

For Android emulator, use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/api
```

For iOS simulator, `http://localhost:4000/api` usually works.

## 4. Run Cypress E2E (Web)

Cypress is configured in `web/cypress.config.js` to run against the local loopback address:

- Web app: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000/api`

Start backend and web first:

```bash
cd backend
npm run dev
```

```bash
cd web
npm run dev
```

Then run Cypress from `web/`:

```bash
npm run cy:open
```

or headless:

```bash
npm run cy:run
```

The Cypress npm scripts clear `ELECTRON_RUN_AS_NODE` and use a project-local
Cypress cache so the test runner starts reliably on Windows.

Implemented E2E specs are in `web/cypress/e2e/`:

- `user-registration.cy.js`
- `user-login.cy.js`
- `product-search.cy.js`
- `add-to-cart.cy.js`
- `checkout-process.cy.js`
- `order-tracking.cy.js`

## Implemented API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `GET /api/cart` (auth)
- `POST /api/cart/items` (auth)
- `PUT /api/cart/items/:productId` (auth)
- `DELETE /api/cart/items/:productId` (auth)
- `DELETE /api/cart` (auth)
- `POST /api/checkout` (auth)
- `GET /api/orders` (auth)
- `GET /api/orders/:id` (auth)
- `PATCH /api/orders/:id/status` (admin)
- `GET /api/admin/summary` (admin)
- `GET /api/admin/users` (admin)
- `PATCH /api/admin/users/:id/role` (admin)

## Notes

- Data is persisted in PostgreSQL after first initialization.
- The payment flow is simulated by design for the assignment.
- Admin dashboard is implemented in the web app, while mobile focuses on customer shopping flows.
