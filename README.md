# Fastscape

Car rental platform: a customer-facing site, an admin panel, and a REST API behind each.

## Apps

| Path | What | Stack | Dev port |
|---|---|---|---|
| `Client/fastscape-client-frontend` | Customer website | Next.js 16, React 19, Tailwind, next-intl | 5174 |
| `Client/fastscape-client-backend` | Customer API | Express 5, TypeScript, Sequelize, PostgreSQL | `PORT` (required) |
| `Admin/fastscape-admin-frontend` | Admin panel | Vite, React 19, Tailwind, i18next | 5173 |
| `Admin/fastscape-admin-backend` | Admin API | Express 5, TypeScript, Sequelize, PostgreSQL | `PORT` (default 3001) |

Each app is independent: its own `package.json`, `node_modules` and env file. There is no root workspace, so run commands inside the app folder.

## Prerequisites

- Node.js 20+
- PostgreSQL

## Getting started

```bash
git clone https://github.com/JineshDixit/fastscape.git
cd fastscape

# repeat for each app you need
cd Client/fastscape-client-backend
npm install
npm run dev
```

## Environment variables

The backends load `.env.<NODE_ENV>` from the app folder, so `npm run dev` reads `.env.development`. Env files are not committed.

**Both backends**

```
PORT=
NODE_ENV=development
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_EXPIRY=
FRONTEND_URL=
```

**Client backend also uses:** email (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `SUPPORT_EMAIL`, `CONTACT_US_EMAIL`), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), `GOOGLE_MAPS_API_KEY`, and booking/pricing rules (`TAX_RATE`, `PLATFORM_CHARGE_RATE`, `BOOKING_EXPIRATION_MINUTES`, `REQUIRE_*`, …). See `Client/fastscape-client-backend/README.md`.

**Client frontend** (`.env.local`)

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_IMAGE_URL=
```

**Admin frontend** (`.env`)

```
VITE_API_BASE_URL=
```

## Scripts

**Backends**

| Command | Does |
|---|---|
| `npm run dev` | Run with nodemon + ts-node |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run pretty` | Format with Prettier |
| `npm run sync-db` (client) / `npm run sync:db` (admin) | Sync Sequelize models to the database |
| `npm run seed` (admin only) | Seed super admin, vehicles, chauffeurs, locations; `seed:<name>` for one |

**Frontends**

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` (client) / `npm run preview` (admin) | Serve the build |
| `npm run lint` | ESLint |
| `npm run prettier` | Format with Prettier |

## API docs

Swagger UI, once a backend is running:

- Client API: `http://localhost:<PORT>/api-docs`
- Admin API: `http://localhost:<PORT>/api/docs`

## Branches

- `develop`: default branch, integration target
- `main`: production
- `bug-fix`, `module-2`, `release-code-deployment-01`: working branches
