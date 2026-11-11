# Mylapore Express: Enterprise Full-Stack Restaurant E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-v14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.22-teal.svg)](https://www.prisma.io/)
[![Playwright](https://img.shields.io/badge/Playwright-9%2F9%20Passed-brightgreen.svg)](https://playwright.dev/)
[![Jest](https://img.shields.io/badge/Jest-13%2F13%20Passed-brightgreen.svg)](https://jestjs.io/)

An authentic South Indian culinary commerce and restaurant operations platform delivering blast-chilled, preservative-free traditional delicacies (Potato Kara Kari, Murungai Keerai Kootu, Puliyodarai, Vathal Kuzhambu, Bisi Bele Bath, stone-ground Idly Batter, Filter Coffee, etc.) with real-time order tracking, milestone-gated cancellation/refund policies, kitchen display systems (KDS), geolocation delivery zones, and customer support.

---

## 1. Repository Structure (Full-Stack Monorepo)

```
Mylapore/
├── apps/
│   ├── web/                           # Next.js 14 App Router Storefront (React, Tailwind CSS, Lucide)
│   └── api/                           # NestJS 10 Enterprise Commerce Engine (REST, JWT, Swagger)
│
├── packages/                          # Shared Monorepo Packages
│   ├── config/                        # Shared ESLint, Prettier, TypeScript configurations
│   ├── types/                         # Shared TypeScript interfaces & DTOs
│   └── validation/                    # Shared Zod validation schemas
│
├── specs/                             # Spec-Driven Development (SDD) Documentation
│   ├── 00-project-charter.md
│   ├── 01-business-requirements.md
│   ├── 02-functional-requirements.md
│   ├── 03-non-functional-requirements.md
│   ├── 04-system-architecture.md
│   ├── 05-frontend-specification.md
│   ├── 06-backend-specification.md
│   ├── 07-database-specification.md
│   ├── 08-api-contracts.md
│   ├── 09-security-specification.md
│   ├── 10-payment-specification.md
│   ├── 13-deployment-specification.md
│   ├── 14-testing-strategy.md
│   ├── 15-acceptance-criteria.md
│   ├── 16-risk-register.md
│   └── 17-implementation-roadmap.md
│
├── integrations/                      # Boundary Adapters & Documentation
│   ├── stripe/                        # Webhook signature verification & refund engine
│   └── salesforce/                    # Service Cloud & Agent Gateway boundary documentation
│
├── infrastructure/                    # Production Dockerfiles & Cloud manifests
├── render.yaml                        # Render Cloud Monorepo Deployment Blueprint
└── docker-compose.yml                 # Local PostgreSQL & Redis container stack
```

> **Note on Salesforce CRM**: The Salesforce Service Cloud metadata, custom objects, and Agentforce DX project are maintained in a dedicated companion repository (`Mylapore-Salesforce`).

---

## 2. Order State Machine & Policies

```
PENDING_PAYMENT ──> PAID ──> CONFIRMED ──> ACCEPTED ──> PREPARING ──> READY ──> OUT_FOR_DELIVERY ──> DELIVERED ──> COMPLETED
       │              │           │            │
       └──> CANCELLED <───────────┴────────────┘
```

- **Rescheduling**: Free up to 2 hours before scheduled slot if status is `CONFIRMED` or `ACCEPTED`.
- **Cancellation & Refunds**:
  - `CONFIRMED`: 100% full refund before cooking.
  - `ACCEPTED`: 50% refund during kitchen queue acceptance.
  - `PREPARING` or later: 0% refund (perishability safety threshold).
- **Kitchen Acceptance SLA**: Automatic timeout after 15 minutes of non-acceptance with 100% refund.

---

## 3. Local Development Quickstart (Windows PowerShell)

```powershell
# 1. Install dependencies
pnpm install

# 2. Setup SQLite/Postgres DB & Seed 46 Authentic Dishes
cd apps/api
npx prisma generate
npx prisma db push
pnpm prisma:seed
cd ../..

# 3. Start NestJS Backend API (Port 4000)
pnpm --filter @mylapore/api start:prod
# API: http://localhost:4000/api/v1
# Swagger: http://localhost:4000/api/docs

# 4. Start Next.js Frontend (Port 3000)
pnpm --filter @mylapore/web start
# Storefront: http://localhost:3000
```

---

## 4. Automated Test Suites

### Backend Jest Unit Tests (Pricing, State Machine, Refunds, Agent Gateway)
```powershell
pnpm --filter @mylapore/api test
```
*Result: 13/13 tests passed.*

### Frontend Playwright End-to-End Suite
```powershell
cd apps/web
npx playwright test
```
*Result: 9/9 e2e journeys passed.*

---

## 5. Render Cloud Production Deployment

This monorepo includes a complete `render.yaml` blueprint:
1. Connect this repository to your Render Dashboard.
2. Select **New > Blueprint** and select `render.yaml`.
3. Render provisions:
   - `mylapore-express-api`: NestJS Web Service (`/api/v1/health`)
   - `mylapore-express-web`: Next.js Web Service
   - `mylapore-express-db`: Managed PostgreSQL 16
