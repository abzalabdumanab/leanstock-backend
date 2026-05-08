# LeanStock Backend

Production-ready multi-tenant inventory backend for the LeanStock final defense. The system uses Express, Prisma ORM, PostgreSQL, Redis-backed rate limiting/locks/queues, JWT auth with refresh-token rotation, RBAC, async email delivery, and documented business workflows.

## Implemented Scope

- Auth: register, email verification, login, refresh, logout, password reset by email.
- RBAC: `SUPER_ADMIN`, `TENANT_ADMIN`, `WAREHOUSE_MANAGER`, `ANALYST`.
- Inventory: products/variants, warehouses, stock levels, Redis-protected reservations, atomic transfers, adjustments.
- Directory and admin: suppliers, platform tenant list/create/suspend.
- Reports: valuation, turnover risk, dead-stock recommendations.
- Background work: Redis-backed email queue, manual queue processor endpoint, scheduled dead-stock price decay.
- Documentation: Swagger UI at `/docs`, contract in `openapi.yaml`, Postman collection in `postman_collection.json`.

## Architecture Notes

- Database access is exclusively through Prisma Client. No raw SQL queries are used in application code.
- Every tenant-owned query is scoped by `tenantId` from the verified JWT user.
- Transfer creation uses Redlock plus a Prisma transaction so source stock is deducted atomically.
- Email is queued in `EmailJob` and Redis; API calls do not wait for SMTP.
- Production startup rejects wildcard CORS and missing SMTP credentials.

## Setup

1. Install Node.js 20+, PostgreSQL 15+, Redis 7+.
2. Create databases:

```sql
CREATE DATABASE leanstock_dev;
CREATE DATABASE leanstock_test;
```

3. Configure environment:

```bash
copy .env.example .env
```

Fill `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and real SMTP settings.

4. Install and migrate:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

5. Run:

```bash
npm run dev
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/docs`  
Health: `http://localhost:3000/health`

## Tests And Quality

```bash
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npx prisma migrate deploy
npm run lint
npm test
```

Latest local verification: `npm run lint` passed; `npm test` passed with 6 suites and 10 tests.

## Defense Flow

1. `POST /auth/register`, then process the email job or use SMTP inbox link.
2. `POST /auth/verify-email`, then `POST /auth/login`.
3. Use `Authorization: Bearer <accessToken>` for protected routes.
4. Demonstrate products, warehouses, stock, reservation, transfer confirm/reject, adjustment, supplier creation, reports.
5. Show queue visibility with `GET /admin/queue/email` and process one job with `POST /admin/queue/email/process-one`.
6. Run dead-stock decay manually with `POST /admin/jobs/dead-stock-decay/run`.

## Useful Commands

```bash
npm run dev
npm start
npm run migrate
npm run migrate:deploy
npm run seed
npm run lint
npm test
docker compose up --build
```
