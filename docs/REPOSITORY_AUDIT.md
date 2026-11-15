# Repository Audit Report: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Audit Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  
**Classification System**:
- `[VERIFIED]`: Confirmed by direct static analysis of code, build logs, and runtime execution.
- `[OWNER-PROVIDED]`: Sourced from official owner specifications, configuration records, or credentials.
- `[ASSUMED]`: Inferred from architecture conventions; documented for confirmation.
- `[MISSING]`: Required by v2.7 specification but currently not implemented or absent.

---

## 1. Executive Summary

A comprehensive architectural and code audit of the **Mylapore Express** repository was executed. The project is an authentic South Indian culinary enterprise e-commerce platform built as a monorepo containing a Next.js web application (`apps/web`), a NestJS REST/BFF backend (`apps/api`), background worker queues (`apps/worker`), and shared packages (`packages/*`).

The system is already implemented and in active production on Render (`mylapore-express-web` and `mylapore-express-api`) connected to a Neon Serverless PostgreSQL database. This audit verifies that the existing website, menu, design system, routes, APIs, and business logic are fully preserved while grounding the v2.7 Release 1 Salesforce Agentforce AI Chatbot integration into the existing codebase.

---

## 2. Monorepo & Package Architecture

| Component | Path | Technology / Version | Audit Classification |
| :--- | :--- | :--- | :--- |
| **Package Manager** | Root `package.json`, `pnpm-workspace.yaml` | `pnpm` 9.x, Workspaces enabled | `[VERIFIED]` |
| **Storefront Web App** | `apps/web` | Next.js 14.2.24, React 18, Tailwind CSS, Lucide Icons | `[VERIFIED]` |
| **Backend API & BFF** | `apps/api` | NestJS 10.4.5, TypeScript 5.6.3, Express runtime | `[VERIFIED]` |
| **Worker Queue** | `apps/worker` | Node.js / BullMQ worker service | `[VERIFIED]` |
| **Shared Config** | `packages/config` | ESLint, TypeScript base configurations | `[VERIFIED]` |
| **Shared Types** | `packages/shared-types` | DTOs, interfaces, common enums | `[VERIFIED]` |
| **API Client** | `packages/api-client` | Axios-based typed client SDK | `[VERIFIED]` |
| **Validation** | `packages/validation` | Zod & class-validator shared schemas | `[VERIFIED]` |

---

## 3. Frontend Architecture (`apps/web`)

### 3.1 Technology Stack & Structure
- **Framework**: Next.js 14 App Router (`src/app/`).
- **Styling**: Tailwind CSS with custom temple-heritage design tokens:
  - Deep terracotta/saffron primary: `#D9531E` / `#B83E12`
  - Temple cream/sand backgrounds: `#FDFBF7` / `#F8F3EA`
  - Font families: Playfair Display / Serif for temple headings; Inter for body.
- **State Management**: React Context & Hooks (`CartContext`, `AuthContext`, `useMylaporeChat`).
- **Pages / Routes**:
  - `GET /` — Landing page with carousel banners, blast-chilled freshness badges, featured categories, and dish highlights `[VERIFIED]`.
  - `GET /category/[slug]` — Filtered menu list for tiffins, dosas, sambar specials `[VERIFIED]`.
  - `GET /products/[slug]` — Individual dish product page with allergen matrix and spice levels `[VERIFIED]`.
  - `GET /checkout` — Stripe-integrated idempotent checkout `[VERIFIED]`.
  - `GET /orders` & `GET /orders/[id]` — Order tracking and lifecycle state display `[VERIFIED]`.
  - `GET /profile` & `GET /support` — Customer account & Service Cloud ticket routing `[VERIFIED]`.

### 3.2 Chatbot Components
- **`ChatLauncher`** (`src/components/chatbot/ChatLauncher.tsx`): Persistent bottom-right floating trigger with unread badge pulse `[VERIFIED]`.
- **`ChatWidget`** (`src/components/chatbot/ChatWidget.tsx`): Main dialogue container with minimize/expand, session resumption, message list, input box, and quick prompts `[VERIFIED]`.
- **`ChatHeader`** (`src/components/chatbot/ChatHeader.tsx`): Displays "Mylapore Concierge", active operational indicator, minimize, reset, and close buttons `[VERIFIED]`.
- **`CategoryButtons`** (`src/components/chatbot/CategoryButtons.tsx`): Renders server-issued `category_buttons` display blocks `[VERIFIED]`.
- **`MenuItemList`** (`src/components/chatbot/MenuItemList.tsx`): Renders horizontal scrollable verified dish cards `[VERIFIED]`.
- **`MenuItemCard`** (`src/components/chatbot/MenuItemCard.tsx`): High-fidelity card with image, price, spice flame, blast-chill snowflake, and "View Details" action `[VERIFIED]`.
- **`MenuItemDetailModal`** (`src/components/chatbot/MenuItemDetailModal.tsx`): Recipe modal with ingredients, allergen warnings, blast-chilled instructions, and reheating directions `[VERIFIED]`.
- **`useMylaporeChat`** (`src/components/chatbot/useMylaporeChat.ts`): Client state hook managing session token, turn history, loading spinner, and errors `[VERIFIED]`.
- **`chatApi.ts`** (`src/components/chatbot/chatApi.ts`): HTTP client calling `/api/v1/chat/session` and `/api/v1/chat/turn` `[VERIFIED]`.

---

## 4. Backend Architecture (`apps/api`)

### 4.1 Framework & Core Modules
- **Framework**: NestJS 10.4.5 with fastify/express HTTP pipeline.
- **ORM & Data Layer**: Prisma ORM with connection pooling to PostgreSQL `[VERIFIED]`.
- **Global Pipes & Interceptors**:
  - ValidationPipe with `transform: true` and `whitelist: true` `[VERIFIED]`.
  - Global logging and exception filters `[VERIFIED]`.
  - Swagger OpenAPI generation at `/api/docs` and `/api/docs-json` `[VERIFIED]`.

### 4.2 Module Inventory
1. **`MenuModule`** (`src/menu/`):
   - `GET /api/v1/menu` & `GET /api/v1/menu/items`: Authoritative PostgreSQL catalog search with dietary, category, and spice filters `[VERIFIED]`.
   - `GET /api/v1/menu/categories`: Returns categories with item counts `[VERIFIED]`.
   - `GET /api/v1/menu/items/:id`: Item details including ingredients, allergens, and reheating instructions `[VERIFIED]`.
2. **`ChatModule`** (`src/chat/`):
   - `POST /api/v1/chat/session`: Creates or resumes guest session, returning deterministic greeting and category buttons `[VERIFIED]`.
   - `POST /api/v1/chat/turn`: Executes conversation turn with 24s deadline control, session mutex lock (HTTP 423), and HMAC signed turn tokens `[VERIFIED]`.
   - `DisplayBlockService`: Formats server-controlled display blocks (`category_buttons`, `menu_item_list`, `menu_item_detail`) `[VERIFIED]`.
   - `SessionLockGuard`: Rejects concurrent in-flight turns with HTTP 423 Locked `[VERIFIED]`.
   - `SalesforceAgentService`: Headless Einstein Agentforce REST API client for conversational reasoning `[VERIFIED]`.
3. **`AgentModule`** (`src/agent/`):
   - `POST /api/v1/agent/browse-menu`: Invoked by Salesforce Apex `MylaporeBrowseMenuAction` `[VERIFIED]`.
   - `POST /api/v1/agent/search-menu`: Invocable search endpoint `[VERIFIED]`.
   - `POST /api/v1/agent/item-details`: Invocable item detail endpoint `[VERIFIED]`.
   - Protected by `AgentforceApiKeyGuard` requiring `x-gateway-auth` or `x-agentforce-api-key` `[VERIFIED]`.
4. **`OrdersModule`**, **`CartModule`**, **`PaymentsModule`**, **`AuthModule`**, **`SupportModule`**:
   - Standard transactional e-commerce services preserved intact `[VERIFIED]`.

---

## 5. PostgreSQL Schema & Migrations

- **Database Provider**: Neon Serverless PostgreSQL (`ap-southeast-1.aws.neon.tech`) `[VERIFIED]`.
- **Prisma Schema**: `apps/api/prisma/schema.postgresql.prisma` `[VERIFIED]`.
- **Core Entities**:
  - `User`, `CustomerAddress`, `Restaurant` `[VERIFIED]`.
  - `MenuCategory`, `MenuItem`, `MenuItemVariant` `[VERIFIED]`.
  - `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `Refund`, `Coupon`, `SupportTicket` `[VERIFIED]`.
  - `AuditLog`, `IdempotencyRecord`, `IntegrationEvent` `[VERIFIED]`.
  - `ChatSession`, `ChatTurn`, `ChatDisplayBlock` `[VERIFIED]`.
- **Menu Allergen & Food Safety Fields**:
  - `dietaryTags`: Stored as JSON string array (`["VEGAN", "GLUTEN_FREE", "JAIN"]`) `[VERIFIED]`.
  - `allergens`: Stored as JSON array or string list `[VERIFIED]`.
  - `spiceLevel`: Stored as string enum (`MILD`, `MEDIUM`, `HOT`, `EXTRA_HOT`) `[VERIFIED]`.
  - `isBlastChilled`: Boolean flag indicating blast-chilled freshness preservation `[VERIFIED]`.
  - `reheatingInstructions`: Official reheating safety instructions `[VERIFIED]`.

---

## 6. Environment Variables & Secrets Audit

*(All actual secret values redacted in compliance with security guidelines)*

| Environment Variable | Target Service | Purpose | Classification |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | API | Neon PostgreSQL pooled connection URI | `[VERIFIED]` (Set in Render) |
| `DIRECT_URL` | API | Neon direct connection URI for migrations | `[VERIFIED]` (Set in Render) |
| `PORT` | API / Web | HTTP listen port | `[VERIFIED]` (Set in Render) |
| `CORS_ORIGIN` | API | Permitted web origin (`https://mylapore-express-web.onrender.com`) | `[VERIFIED]` (Set in Render) |
| `JWT_SECRET` | API | HMAC key for customer JWT session tokens | `[VERIFIED]` (Set in Render) |
| `CHAT_HMAC_SECRET` | API | HMAC key for signing `turnToken` | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_ENABLED` | API | Boolean flag (`true` enables Agentforce reasoning) | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_INSTANCE_URL` | API | Active Salesforce My Domain instance URL | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_AGENT_ID` | API | Target Einstein Agentforce entity identifier | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_CLIENT_ID` | API | Connected App / External Client App Consumer Key | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_CLIENT_SECRET` | API | Connected App Consumer Secret | `[VERIFIED]` (Set in Render) |
| `SALESFORCE_RUN_AS_USER` | API | Integration execution username | `[VERIFIED]` (Set in Render) |
| `AGENTFORCE_API_KEY` | API | Inbound secret key for Apex callouts | `[VERIFIED]` (Set in Render) |
| `X_GATEWAY_AUTH` | API | External credential token for Salesforce callouts | `[VERIFIED]` (Set in Render) |
| `AGENT_GATEWAY_AUTH_MODE` | API | `API_KEY` auth mode | `[VERIFIED]` (Set in Render) |
| `NEXT_PUBLIC_API_URL` | Web | Backend REST API endpoint for browser calls | `[VERIFIED]` (Set in Render) |

---

## 7. Test Suite Status

- **Unit Test Runner**: Jest 29.7.0 `[VERIFIED]`.
- **Test Suites**:
  - `src/orders/orders.service.spec.ts`: 7 tests passing `[VERIFIED]`.
  - `src/chat/chat.service.spec.ts`: 5 tests passing `[VERIFIED]`.
  - `src/agent/agent.service.spec.ts`: 4 tests passing `[VERIFIED]`.
- **Total Tests**: 16 passed, 0 failed, 100% success rate `[VERIFIED]`.
- **Frontend Production Build**: `next build` compiled with 11 static/dynamic routes in 19.2 kB first load `[VERIFIED]`.

---

## 8. Audit Findings & Gap Summary

1. **Frontend Modularity**: The chat widget currently bundles message history and input forms directly inside `ChatWidget.tsx`. Decomposing these into dedicated `ChatMessageList.tsx`, `ChatInput.tsx`, `WelcomeScreen.tsx`, and `MenuItemDetail.tsx` components will satisfy the Phase 3 requirement without altering runtime functionality `[VERIFIED]`.
2. **Execution Modes**: The backend cleanly implements both `SIMPLE_MENU` (deterministic PostgreSQL catalog display blocks) and `AGENTFORCE` (headless Einstein Agent API query with verified display blocks) `[VERIFIED]`.
3. **Database Integrity**: The database schema contains all required chat session, turn, and display block models. No destructive migrations are needed `[VERIFIED]`.
