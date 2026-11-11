# Render Cloud Production Deployment Runbook

## 1. Prerequisites
- Render Cloud Account (free or paid)
- GitHub repository with this codebase pushed to `main` branch.

## 2. One-Click Blueprint Setup
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Select your GitHub repository (`Mylapore`).
4. Render will parse [`render.yaml`](../../render.yaml) and automatically create:
   - `mylapore-express-api` (Web Service for NestJS backend)
   - `mylapore-express-web` (Web Service for Next.js frontend)
   - `mylapore-express-db` (PostgreSQL 16 database)
   - `mylapore-express-redis` (Redis key-value store)

## 3. Environment Variable Configuration
In Render Dashboard:
- Under `mylapore-express-api` > Environment:
  - Add your live `STRIPE_SECRET_KEY` (e.g. `sk_live_...` or `sk_test_...`)
  - Add your `STRIPE_WEBHOOK_SECRET` (e.g. `whsec_...`)
  - If integrating live Salesforce, set:
    - `SALESFORCE_ENABLED=true`
    - `SALESFORCE_CLIENT_ID`
    - `SALESFORCE_CLIENT_SECRET`
    - `SALESFORCE_USERNAME`
    - `SALESFORCE_PASSWORD`
    - `SALESFORCE_SECURITY_TOKEN`

## 4. Verification & Health Monitoring
- Verify backend health:
  `GET https://mylapore-express-api.onrender.com/api/v1/health`
- Verify Swagger API contract:
  `GET https://mylapore-express-api.onrender.com/api/docs`
- Open customer website:
  `https://mylapore-express-web.onrender.com`
