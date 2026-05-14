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

Latest local verification: `npm run lint` passed; `npm test` passed with 3 suites and 5 tests.

## Defense Flow

1. `POST /auth/register`, then process the email job or use SMTP inbox link.
2. `POST /auth/verify-email`, then `POST /auth/login`.
3. Use `Authorization: Bearer <accessToken>` for protected routes.
4. Demonstrate products, warehouses, stock, reservation, transfer confirm/reject, adjustment, supplier creation, reports.
5. Show queue visibility with `GET /admin/queue/email` and process one job with `POST /admin/queue/email/process-one`.
6. Run dead-stock decay manually with `POST /admin/jobs/dead-stock-decay/run`.

## Email Verification In Production

Registration already creates a verification token and queues an email to the address from the request body. To send it automatically, configure SMTP and run the email worker in the same app process:

```env
APP_BASE_URL=https://YOUR_CLOUD_RUN_URL
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_FROM=LeanStock <verified-sender@your-domain.com>
EMAIL_WORKER_ENABLED=true
```

After `POST /api/v1/auth/register`, the user receives a link like:

```text
https://YOUR_CLOUD_RUN_URL/api/v1/auth/verify-email?token=...
```

The user must open that link before login succeeds.

## Google Cloud Email Setup

Google Cloud does not provide a normal SMTP mailbox by default. Use a transactional email provider, for example SendGrid, Mailgun, SMTP2GO, or Brevo. The simplest path for this project is SendGrid SMTP:

1. Create a SendGrid account and verify a sender identity or domain.
2. Create a SendGrid API key with mail-send permission.
3. In Google Cloud Secret Manager, create secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_PASS`, `DATABASE_URL`, and `REDIS_URL`.
4. Deploy to Cloud Run with environment variables:

```bash
gcloud run deploy leanstock-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,APP_BASE_URL=https://YOUR_CLOUD_RUN_URL,SMTP_HOST=smtp.sendgrid.net,SMTP_PORT=587,SMTP_USER=apikey,SMTP_FROM='LeanStock <verified-sender@your-domain.com>',EMAIL_WORKER_ENABLED=true,CORS_ORIGINS=https://YOUR_FRONTEND_OR_POSTMAN_ORIGIN
```

5. Attach secrets to the Cloud Run service for `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `SMTP_PASS`.
6. Make sure `APP_BASE_URL` is the real Cloud Run URL, because the verification link is built from it.
7. Test in Postman: call register, open the email inbox, click the verification link, then call login.

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
