# Current Architecture & Data Flow Analysis — Mylapore Express

**Generated Date**: 2026-11-14  
**Project**: Mylapore Express  
**Author**: Principal Enterprise Solutions Architect  

---

## 1. System Architecture Overview

Mylapore Express operates as a **Headless B2C Culinary Commerce & Restaurant Operations** platform. It bridges a modern Next.js 14 client with a NestJS domain engine, Neon PostgreSQL persistence, Stripe payments, and a dual-channel Salesforce Service Cloud & Agentforce AI integration.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                                     │
│  Next.js 14 Web Storefront (App Router)  │  Mobile Cart Drawer  │  Salesforce MIAW Embed │
└───────────────────────────┬────────────────────────────────────────────────────────────┘
                            │ HTTPS / REST (Fetch + Optimistic UI)
                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BFF & API GATEWAY                                   │
│                     NestJS Framework on Node.js 20 (Port 10000)                        │
│                                                                                        │
│  ┌───────────────────────────┐  ┌───────────────────────────┐  ┌─────────────────────┐ │
│  │ MenuModule (/menu/...)    │  │ CartModule (/cart/...)    │  │ OrdersModule        │ │
│  │ - Authoritative Menu Query│  │ - Session-based Carts     │  │ - Checkout Quote    │ │
│  │ - Category & Detail Query │  │ - Optimistic Sync         │  │ - State Machine     │ │
│  └─────────────┬─────────────┘  └─────────────┬─────────────┘  └──────────┬──────────┘ │
│                │                              │                           │            │
│  ┌─────────────┴─────────────┐  ┌─────────────┴─────────────┐             │            │
│  │ AgentModule (/agent/...)  │  │ PaymentsModule (/payments)│             │            │
│  │ - API Key Guarded Tools   │  │ - Stripe Webhook Verify   │             │            │
│  │ - OpenAPI 3.0 Specs       │  │ - Idempotent Refunds      │             │            │
│  └─────────────┬─────────────┘  └─────────────┬─────────────┘             │            │
│                │                              │                           │            │
│                ▼                              ▼                           ▼            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Transactional Outbox Worker Daemon (Interval: 15s)                              │  │
│  │ - Sweeps IntegrationEvent -> syncs to Salesforce custom objects & cases          │  │
│  └──────────────────────────────────┬───────────────────────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴────────────────────────┐
            ▼                                                  ▼
┌──────────────────────────────┐              ┌──────────────────────────────────────────┐
│     DATABASE PERSISTENCE     │              │      SALESFORCE ENTERPRISE ECOSYSTEM     │
│   Neon PostgreSQL / Prisma   │              │   Service Cloud & Agentforce AI Agents   │
│   - Restaurant (Outlets)     │              │   - Customer Concierge Agent             │
│   - MenuCategory & MenuItem  │              │   - Named Credential / External Service  │
│   - MenuItemVariant          │              │   - Restaurant_Order__c, Refund_Request  │
│   - Cart, Order, AuditLog    │              │   - MIAW Embedded Messaging Widget       │
└──────────────────────────────┘              └──────────────────────────────────────────┘
```

---

## 2. The Two Traffic Paths in the Current Application

### Path 1: Standard E-Commerce Browsing & Checkout
1. Next.js (`apps/web`) makes client-side or server-side fetch requests to `/api/v1/menu/categories` and `/api/v1/menu/items`.
2. NestJS `MenuController` delegates to `MenuService`.
3. `MenuService` queries Neon PostgreSQL using Prisma Client.
4. Dishes and variants are returned to React components (`CategoryNav`, `DishCard`, PDP).
5. Quick-add executes **0ms optimistic cart updates** in `CartContext`, buffering item additions locally while `api.addToCart` synchronizes with PostgreSQL in the background.

### Path 2: Agentforce Integration & Outbound Tool Calling
1. Currently, Salesforce Agentforce operates via:
   - **MIAW (Messaging for In-App & Web)**: Script bootstrap injected in `apps/web/src/components/SalesforceChatEmbed.tsx`.
   - **Agent Tools (`AgentController`)**: Endpoints exposed at `/api/v1/agent/*` guarded by `AgentforceApiKeyGuard` (`x-agentforce-api-key`).
   - Agentforce calls `agentforceSearchMenu` (`POST /api/v1/agent/menu/search`) and `agentforceGetMenuItemDetails` (`GET /api/v1/agent/menu/items/:itemId`).
   - `AgentService` queries Prisma and formats output for Agentforce grounding.
2. In the reverse direction (Event Projection):
   - Orders and refunds emit `IntegrationEvent` rows.
   - The `OutboxService` background daemon sweeps events every 15 seconds and syncs them to Salesforce `Restaurant_Order__c` and `Refund_Request__c` via `SalesforceAdapter`.

---

## 3. Current Architecture Constraints & Release 1 Delta

Under the v2.7 Master Specification:
1. **The Chatbot UI must be an internal branded React widget (`ChatWidget`), NOT a raw unstyled iframe.**
2. **The Backend must feature a dedicated Chat BFF (`ChatModule` / `ChatService`) that manages turn lifecycle, session busy locks (`HTTP 423`), and deadline orchestration (25s target).**
3. **The Agent Gateway must validate signed `turn_token` and emit immutable, exact-key `chat_display_block` records correlated by `(session_id, turn_id, request_id, catalog_version_id)`.**
4. **The UI must support a graceful fallback ("Simple Menu Mode")** so if Agentforce or network is interrupted, customers can seamlessly view categories directly from the backend catalog without broken states.
