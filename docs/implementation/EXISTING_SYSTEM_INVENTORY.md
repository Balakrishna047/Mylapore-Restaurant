# Existing System Baseline Inventory — Mylapore Express

**Generated Date**: 2026-11-14  
**Project**: Mylapore Express  
**Author**: Principal Enterprise Solutions Architect  
**Objective**: Comprehensive baseline audit of current codebase, packages, schema, API endpoints, Salesforce metadata, and live cloud deployment before implementing v2.7 Release 1 integration.

---

## 1. Monorepo & Package Architecture

| Package / App | Path | Type | Technologies & Versions | Purpose |
|---|---|---|---|---|
| **Web Storefront** | `apps/web` | Next.js App Router | Next.js `14.2.24`, React `18.3.1`, Tailwind CSS `3.4.17`, TanStack Query `5.66.0`, Lucide React | Customer-facing culinary commerce website |
| **API Backend** | `apps/api` | NestJS Modular API | NestJS `10.4.15`, Node.js 20, Prisma `5.22.0`, Swagger `8.1.1`, Passport JWT, Throttler `6.4.0` | Enterprise commerce engine, menu service, agent gateway |
| **Shared Types** | `packages/shared-types` | TypeScript DTO Library | TypeScript `5.7.3` | Shared DTOs (`MenuItemDto`, `MenuCategoryDto`, `UserProfile`, `OrderStatus`) |
| **Validation** | `packages/validation` | Zod Validation Schemas | Zod `3.24.1` | Shared runtime request validation schemas |
| **Monorepo Tools** | Root | pnpm Workspaces | pnpm, Turborepo-ready workspace structure, TypeScript 5.7 | Monorepo package linking and unified builds |

---

## 2. Web Storefront Inventory (`apps/web`)

### 2.1 Framework & Router Configuration
- **Next.js Version**: `14.2.24` (App Router active in `apps/web/src/app`).
- **React Version**: `18.3.1` (Strict Mode enabled).
- **Styling**: Tailwind CSS with custom design tokens (`background`, `foreground`, `surface`, `surface-muted`, `border`, `primary`, `accent`, `warning`, `success`).
- **Icons**: `lucide-react` (v0.475.0).
- **Theme**: Dark and Light mode support via CSS class variables and `body.dark`.

### 2.2 Route Map
| Route | Page File | Rendering Strategy | Functionality |
|---|---|---|---|
| `/` | `apps/web/src/app/page.tsx` | Static / Client | Homepage, hero carousel, categories, popular dishes, reviews |
| `/category/[slug]` | `apps/web/src/app/category/[slug]/page.tsx` | Dynamic | Category-specific dish filtering, grid/list view |
| `/products/[slug]` | `apps/web/src/app/products/[slug]/page.tsx` | Dynamic | Product Detail Page (PDP), interactive spice level, portions, allergens |
| `/checkout` | `apps/web/src/app/checkout/page.tsx` | Static / Client | Order summary, promo code application, delivery details, payment |
| `/orders` | `apps/web/src/app/orders/page.tsx` | Static / Client | Customer order history lookup |
| `/orders/[id]` | `apps/web/src/app/orders/[id]/page.tsx` | Dynamic | Real-time order tracking, state machine status, cancel/reschedule |
| `/admin` | `apps/web/src/app/admin/page.tsx` | Static / Client | Operations dashboard, inventory toggle, audit logs |
| `/support` | `apps/web/src/app/support/page.tsx` | Static / Client | Customer support ticket submission |

### 2.3 Existing UI Components
- `Header.tsx`: Location modal trigger, search bar, dark mode toggle, cart badge.
- `CategoryNav.tsx`: Horizontal category pills with active filter state.
- `DishCard.tsx`: Grid/list card with 0ms optimistic quick-add.
- `HeroCarousel.tsx`: Auto-rotating promotional carousel.
- `CartDrawer.tsx`: Slide-in cart sheet with promo validation and `z-[99999]` elevation.
- `MobileCartBar.tsx`: Sticky bottom cart bar for mobile viewports.
- `LocationModal.tsx`: ZIP code and Bay Area delivery zone selector.
- `SalesforceChatEmbed.tsx`: Official Salesforce MIAW embed script bootstrap.
- `ChatWidget.tsx`: Legacy 71-byte placeholder (ready for v2.7 replacement).

---

## 3. NestJS Backend Inventory (`apps/api`)

### 3.1 Server Architecture
- **Framework**: NestJS v10.4.15 with Express platform.
- **Port**: Bound to `process.env.PORT || 10000` (Render cloud compliance).
- **Security**: Helmet, CORS (origin: true, credentials: true), Throttler rate-limiting (120 req/min).
- **Documentation**: Swagger OpenAPI 3.0 at `/api/docs` and raw JSON at `/api/docs-json`.

### 3.2 Active Backend Modules
1. `AppModule` (`src/app.module.ts`): Root orchestrator.
2. `MenuModule` (`src/menu/`):
   - `MenuController`: `GET /api/v1/menu/categories`, `GET /api/v1/menu/items`, `GET /api/v1/menu/items/:idOrSlug`.
   - `MenuService`: Authoritative PostgreSQL queries via Prisma.
3. `AgentModule` (`src/agent/`):
   - `AgentController`: Guarded by `AgentforceApiKeyGuard` (`x-agentforce-api-key`).
   - `POST /api/v1/agent/menu/search` (`agentforceSearchMenu`)
   - `GET /api/v1/agent/menu/items/:itemId` (`agentforceGetMenuItemDetails`)
   - `GET /api/v1/agent/orders/:orderId` (`agentforceGetOrderStatus`)
   - `POST /api/v1/agent/orders/:orderId/cancellation-preview`
   - `POST /api/v1/agent/orders/:orderId/cancellation`
   - `POST /api/v1/agent/support/cases`
4. `IntegrationsModule` (`src/integrations/`):
   - `Transactional Outbox Worker` (`outbox.service.ts`): 15s daemon syncing `IntegrationEvent` records.
   - `SalesforceAdapter` (`salesforce.adapter.ts`): Order and refund projection sync.
   - `SalesforceWebhookController`: Inbound CRM status webhook receptor.
5. `OrdersModule` (`src/orders/`): Order state machine, checkout pricing, cancel/reschedule.
6. `CartModule` (`src/cart/`): Session-based cart persistence and guest cart merging.
7. `PaymentsModule` (`src/payments/`): Stripe integration, webhook signature verification.
8. `SupportModule` (`src/support/`): Customer support cases and ticketing.
9. `RestaurantsModule` (`src/restaurants/`): Outlet configuration and operating hours.
10. `PrismaModule` (`src/prisma/`): Singleton PrismaClient lifecycle manager.

---

## 4. PostgreSQL Database Schema Inventory

Source schema: `apps/api/prisma/schema.postgresql.prisma`

| Model Name | Physical Table | Key Columns | Relationships / Notes |
|---|---|---|---|
| `Restaurant` | `Restaurant` | `id`, `name`, `taxRate`, `deliveryFee`, `freeDeliveryThreshold`, `minimumOrder`, `currency`, `isAcceptingOrders` | Authoritative outlet configuration entity |
| `MenuCategory` | `MenuCategory` | `id`, `name`, `slug`, `icon`, `displayOrder` | Category definitions; 1-to-many with `MenuItem` |
| `MenuItem` | `MenuItem` | `id`, `slug`, `name`, `description`, `categoryId`, `basePrice`, `image`, `isBlastChilled`, `dietaryTags`, `spiceLevel`, `allergens`, `ingredients`, `isAvailable` | Core dishes; strings for allergens/ingredients |
| `MenuItemVariant`| `MenuItemVariant`| `id`, `menuItemId`, `name`, `price`, `servesCount` | Portion size variants (e.g. Regular 16oz, Family 32oz) |
| `Cart` & `CartItem`| `Cart`, `CartItem`| `id`, `sessionToken`, `userId`, `menuItemId`, `quantity`, `unitPrice` | Ephemeral guest and authenticated cart state |
| `Order` & `OrderItem`| `Order`, `OrderItem`| `id`, `orderNumber`, `status`, `subtotal`, `tax`, `total`, `deliverySlot` | Transactional order lifecycle |
| `AuditLog` | `AuditLog` | `id`, `userId`, `action`, `entity`, `entityId`, `payload`, `ipAddress` | Audit trail |
| `IdempotencyRecord`| `IdempotencyRecord`| `id`, `key`, `scope`, `responseBody`, `statusCode` | Cryptographic deduplication |
| `IntegrationEvent` | `IntegrationEvent` | `id`, `eventType`, `aggregateType`, `aggregateId`, `payload`, `status` | Transactional outbox buffer for CRM sync |

---

## 5. Salesforce Org Baseline Inventory

- **Salesforce CLI**: `@salesforce/cli/2.153.5 win32-x64 node-v24.13.0`
- **Connected Orgs in Environment**:
  - `mylapore` (`00Dg700000Oo6fVEAR`): Used by production MIAW script.
  - `mylapore-dev` (`00DgK00000fMxxtUAC`): Default Org (`🍁`) referenced for Agentforce development.
- **Agentforce Agent**: `Mylapore Menu Agent` (Release 1 target).
- **MIAW Site URL**: `https://orgfarm-b2714d8f72-dev-ed.develop.my.site.com/ESWMylaporeConci1794475036498`
- **SCRT2 Gateway**: `https://orgfarm-b2714d8f72-dev-ed.develop.my.salesforce-scrt.com`

---

## 6. Live Production Deployment Baseline

- **Web Service (`apps/web`)**:
  - Render Service ID: `srv-dbq4s7lg1s2s73c1okeg`
  - URL: `https://mylapore-express-web.onrender.com`
  - Status: **Live** (Commit `48547ca`, HTTP 200 OK)
- **API Backend (`apps/api`)**:
  - Render Service ID: `srv-dbq4qplg1s2s73c1kdp0`
  - URL: `https://mylapore-express-api.onrender.com`
  - Port: `10000`
  - Health: `https://mylapore-express-api.onrender.com/api/v1/health` (HTTP 200 OK)
- **Database (PostgreSQL)**:
  - Neon Serverless PostgreSQL (`ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech`)
  - Schema: `public`
  - Migration tool: `prisma db push` / `prisma migrate`
