# Mylapore Express: End-to-End Enterprise Architecture & Salesforce Agentforce AI Specification Guide

> **Target Audience**: Salesforce Architects, Agentforce Developers, Full-Stack Engineers, Kitchen Operations, and Integration Specialists.  
> **Platform Version**: 2.0.0 (Production Live)  
> **Live Web Application**: [https://mylapore-express-web.onrender.com](https://mylapore-express-web.onrender.com)  
> **Live API & Swagger Docs**: [https://mylapore-express-api.onrender.com/api/docs](https://mylapore-express-api.onrender.com/api/docs)  
> **Live OpenAPI Schema for Salesforce External Services**: [https://mylapore-express-api.onrender.com/api/docs-json](https://mylapore-express-api.onrender.com/api/docs-json)  
> **Live API Health Check**: [https://mylapore-express-api.onrender.com/api/v1/health](https://mylapore-express-api.onrender.com/api/v1/health)

---

## 1. Executive Summary & System Overview

**Mylapore Express** is an enterprise-grade South Indian culinary e-commerce platform delivering authentic, blast-chilled, preservative-free South Indian delicacies (curries, sambars, kootu, poriyal, batters, sweets, and festival thalis) across the San Francisco Bay Area and nationwide.

The platform is designed around **Spec-Driven Development (SDD)** with a decoupled monorepo architecture:
- **Client Frontend**: Next.js 14 (React 18, Tailwind CSS, Lucide icons, responsive mobile drawer & sticky cart system).
- **Application Backend**: NestJS (TypeScript, Node.js 20, modular architecture, OpenAPI 3.0 Swagger documentation).
- **Source of Truth**: Managed Neon Serverless PostgreSQL with Prisma ORM.
- **Enterprise Integration & AI**: Salesforce Service Cloud and **Salesforce Agentforce AI Agents** connected via the Transactional Outbox Pattern and OpenAPI 3.0 External Services.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                           │
│  Next.js 14 Web / Mobile Browser  │  Mobile Sticky Cart Bar  │  Agentforce Chat Widget  │
└───────────────────────────┬────────────────────────────────────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY & BUSINESS ENGINE                                │
│                     NestJS Framework on Node.js 20 (Port 10000)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ Menu & Outlet│  │ Cart & Order │  │ Payment & Tax│  │ Agent Gateway (/api/v1/...)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────────────┬──────────────┘  │
│         │                 │                 │                        │                 │
│         ▼                 ▼                 ▼                        ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Transactional Outbox Daemon (Sweeper interval: 15s)                              │  │
│  └──────────────────────────────────┬───────────────────────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴────────────────────────┐
            ▼                                                  ▼
┌──────────────────────────────┐              ┌──────────────────────────────────────────┐
│   DATABASE PERSISTENCE       │              │      SALESFORCE ENTERPRISE ECOSYSTEM     │
│   Neon PostgreSQL / Prisma   │              │   Service Cloud & Agentforce AI Agents   │
│   - 17 Relational Models     │              │   - Customer Concierge Agent             │
│   - Strict State Machine     │              │   - Order Management Agent               │
│   - Audit & Idempotency Logs │              │   - Customer Support Agent               │
└──────────────────────────────┘              │   - Custom Objects (Order__c, etc.)      │
                                              └──────────────────────────────────────────┘
```

---

## 2. Monorepo Structure & File Map

The repository is structured with strict separation of concerns:

```
Mylapore/
├── apps/
│   ├── api/                                # NestJS Application Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma               # PostgreSQL Prisma Schema (17 Models)
│   │   ├── src/
│   │   │   ├── admin/                      # Kitchen KDS, Order Management, Audits
│   │   │   ├── agent/                      # Salesforce Agentforce Dedicated Endpoints
│   │   │   │   ├── agent.controller.ts     # OpenAPI Endpoints for Agentforce
│   │   │   │   ├── agent.service.ts        # Cancellation Preview, Menu Search, Cases
│   │   │   │   └── agent.module.ts
│   │   │   ├── auth/                       # JWT Authentication, Password Hashing
│   │   │   ├── cart/                       # Session/User Persistent Cart Management
│   │   │   ├── common/                     # JwtAuthGuard, RolesGuard, IdempotencyInterceptor
│   │   │   ├── coupons/                    # Promo codes (e.g., MYLAPORE15, WELCOME5)
│   │   │   ├── delivery/                   # Time slots, delivery fee calculations
│   │   │   ├── integrations/               # Outbox Worker & Salesforce Adapter
│   │   │   │   ├── outbox.service.ts       # Asynchronous Outbox Event Publisher
│   │   │   │   └── salesforce.adapter.ts   # REST/OAuth Sync to Service Cloud
│   │   │   ├── menu/                       # Categories, Items, Dietary Tags, Spices
│   │   │   ├── orders/                     # State Machine, Cancellation Policy, Auto-refund
│   │   │   ├── payments/                   # Stripe Payment Intent & Webhook simulation
│   │   │   ├── prisma/                     # Global Prisma ORM Client Service
│   │   │   ├── support/                    # Ticket creation, sentiment, SLA escalation
│   │   │   ├── app.module.ts               # Root NestJS Module Assembly
│   │   │   ├── health.controller.ts        # /api/v1/health (DB ping, uptime)
│   │   │   └── main.ts                     # NestJS Bootstrap, CORS, Swagger Docs Setup
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                                # Next.js 14 Frontend Application
│       ├── public/
│       │   ├── images/
│       │   │   ├── dishes/                 # Standardized 448x298 WebP Authentic Dish Photos
│       │   │   └── logo.png                # Official Mylapore Express Heritage Emblem
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/page.tsx          # Real-time Kitchen Display System (KDS)
│       │   │   ├── auth/login/page.tsx     # Customer & Admin Sign In
│       │   │   ├── auth/register/page.tsx  # Customer Registration
│       │   │   ├── category/[slug]/page.tsx# Category-Filtered Menu Grid
│       │   │   ├── checkout/page.tsx       # Multi-step Checkout, Tips, Delivery Slot, Stripe
│       │   │   ├── orders/page.tsx         # Active & Past Orders Listing
│       │   │   ├── orders/[id]/page.tsx    # Real-Time 6-Stage Visual Order Tracker
│       │   │   ├── products/[slug]/page.tsx# Dish Details, Allergens, Spice, Reheating
│       │   │   ├── layout.tsx              # Root Layout, Providers, CartDrawer, MobileCartBar
│       │   │   └── page.tsx                # Hero Banner, Collections, Customer Favorites
│       │   ├── components/
│       │   │   ├── CartDrawer.tsx          # Responsive Cart Slide-over (Safe-Area, 34px Targets)
│       │   │   ├── CategoryNav.tsx         # Horizontal Smooth-Scrolling Category Pills
│       │   │   ├── ChatWidget.tsx          # Embedded Agentforce Floating AI Concierge
│       │   │   ├── DishCard.tsx            # Dish Card (38°F Chilled Badge, Inline Quantity)
│       │   │   ├── Footer.tsx              # Heritage Temple Footer, Terms, Privacy
│       │   │   ├── Header.tsx              # Responsive Sticky Navbar, Search, Mobile Drawer
│       │   │   ├── LocationModal.tsx       # Delivery Zip Code & Address Selector
│       │   │   └── MobileCartBar.tsx       # Sticky Bottom Bar for Mobile Viewports
│       │   ├── context/
│       │   │   ├── AuthContext.tsx         # JWT Session & User State
│       │   │   ├── CartContext.tsx         # Universal Cart State & Optimistic Updates
│       │   │   └── LocationContext.tsx     # City, State, Zip Delivery Availability
│       │   └── lib/
│       │       └── api.ts                  # Typed Axios/Fetch Client with session headers
│       ├── next.config.js                  # Cache Headers, API Proxy Rewrites
│       └── tailwind.config.js              # Temple Gold (#C8851A), Terracotta (#D95338)
├── packages/
│   └── database/                           # Shared Database Migrations & Seeds
├── docs/                                   # Architectural Specifications
├── AGENTS.md                               # AI & Autonomous Agent Specification
├── GEMINI.md                               # Monorepo Operating Directives
└── package.json                            # Root Workspace Scripts (pnpm monorepo)
```

---

## 3. Database Schema & State Machine Architecture

The PostgreSQL schema is managed via Prisma ORM and deployed on Neon Serverless Postgres.

### 3.1 Relational Entity Model

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ CustomerAddress : maintains
    User ||--o{ Cart : owns
    Restaurant ||--o{ MenuCategory : offers
    MenuCategory ||--o{ MenuItem : contains
    MenuItem ||--o{ MenuItemVariant : has
    Cart ||--o{ CartItem : holds
    MenuItem ||--o{ CartItem : referenced_in
    Order ||--o{ OrderItem : comprises
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o{ Payment : captures
    Order ||--o{ Refund : issues
    Order ||--o{ SupportTicket : links
    MenuItem ||--o{ OrderItem : details
```

### 3.2 Data Models Breakdown

#### `User` & `CustomerAddress`
- **User Roles**: `SUPER_ADMIN`, `RESTAURANT_ADMIN`, `KITCHEN_MANAGER`, `DELIVERY_MANAGER`, `CUSTOMER_SUPPORT`, `CUSTOMER`.
- **Security**: Passwords hashed using bcrypt. Sensitive data shielded from LLM contexts.

#### `MenuItem` & `MenuCategory`
- **Blast-Chilled Attributes**: `isBlastChilled` (Boolean, default `true`), keeping meals at `38°F` for maximum freshness.
- **Dietary Arrays (JSON)**: `dietaryTags` (`["VEGAN", "JAIN", "GLUTEN_FREE"]`), `allergens` (`["Peanuts", "Sesame", "Wheat"]`).
- **Spice Scale**: `MILD`, `MEDIUM`, `HOT`, `EXTRA_HOT`.
- **Reheating Guidelines**: Oven, microwave, and stovetop instructions stored per dish.

#### `Cart` & `CartItem`
- Supports both **Authenticated Customers** (`userId`) and **Guest Shoppers** (`sessionToken` generated in client `localStorage`).
- Tracks variant selection, custom spice levels, and chef instructions.

#### `Order`, `Payment`, & `Refund`
- **Order Number Format**: Human-readable identifier (e.g. `MYL-2026-1001`).
- **Financial Integrity**: Subtotal, discount, tax (8.25%), delivery fee ($4.99 or free over $45), and optional kitchen tip stored in separate decimal fields.
- **Zero Tampering**: Pricing is recomputed on the backend during order creation; client-sent prices are discarded.

#### `SupportTicket`
- Fields: `id`, `orderId`, `customerName`, `customerEmail`, `subject`, `description`, `priority` (`LOW`, `NORMAL`, `HIGH`, `URGENT`), `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `sentiment` (`POSITIVE`, `NEUTRAL`, `NEGATIVE`), and `salesforceCaseId` (`500_...`).

#### `IntegrationEvent` (Transactional Outbox)
- Fields: `id`, `eventType`, `aggregateType`, `aggregateId`, `payload`, `status` (`PENDING`, `PROCESSING`, `PUBLISHED`, `FAILED`), `retryCount`, `nextRetryAt`.
- Guaranteed At-Least-Once Delivery to Salesforce Service Cloud via background worker polling every 15 seconds.

### 3.3 Strict Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT
    PENDING_PAYMENT --> PAID : Stripe Webhook / Confirm Test Payment
    PENDING_PAYMENT --> CANCELLED : Payment Timeout (15m)
    PAID --> CONFIRMED : Kitchen Auto-Acknowledgment
    CONFIRMED --> ACCEPTED : Kitchen Manager Accepts
    CONFIRMED --> CANCELLED : Customer Cancels (100% Refund)
    ACCEPTED --> PREPARING : KDS Station Assigns Chef
    ACCEPTED --> CANCELLED : Customer Cancels (50% Refund Fee)
    PREPARING --> READY : Blast Chilled to 38°F & Inspected
    PREPARING --> CANCELLED : Kitchen Cancellation Only (100% Refund)
    READY --> OUT_FOR_DELIVERY : Driver Dispatched with Cooler Tote
    OUT_FOR_DELIVERY --> DELIVERED : Geofenced Drop-off Confirmed
    DELIVERED --> COMPLETED : Customer Confirms / SLA Expires (2h)
    DELIVERED --> REFUND_PENDING : Support Ticket Quality Escalation
    REFUND_PENDING --> REFUNDED : Agentforce / Admin Authorizes Refund
```

---

## 4. Frontend Architecture & Flow Specifications

### 4.1 Technology Stack
- **Framework**: Next.js 14 App Router (`apps/web`).
- **Styling**: Tailwind CSS configured with Mylapore authentic palettes:
  - Sand / Cream Background: `#FBF7F0`
  - Deep Heritage Dark: `#1C1917`
  - Terracotta Accent: `#D95338`
  - Temple Gold / Mustard: `#C8851A`
- **Icons**: Lucide React.
- **State Management**: React Context (`CartContext`, `AuthContext`, `LocationContext`).

### 4.2 Key Pages & User Journeys

1. **Menu Discovery (`/` and `/category/[slug]`)**:
   - Dynamic category filter bar with smooth horizontal scroll buttons.
   - Three hero banner cards: *Where should we deliver?*, *Freshly cooked every day*, *Choose & Order*.
   - Responsive Dish Grid displaying standardized 448x298 authentic dish imagery, order volume badges (`1,000+ ordered`), blast-chill temperature badges (`38°F`), dietary pills (`VEGAN`, `JAIN`, `GLUTEN-FREE`), and spice scale.
2. **Item Quick Add & Customization (`DishCard.tsx`)**:
   - `+ Add` button with immediate tactile response.
   - Converts to an inline quantity counter `[ - 1 + ]` with `32px` touch targets.
   - Triggers the **Sticky Mobile Bottom Cart Bar** on viewports `< 640px`.
3. **Cart Slide-over Drawer (`CartDrawer.tsx`)**:
   - Viewport-aware slide-in with `100dvh` support to account for mobile browser URL bars.
   - Free delivery progress meter (`$45.00` threshold).
   - Promo code form supporting verified coupons (`MYLAPORE15`, `WELCOME5`).
   - Touch targets for increment and decrement formatted to `34px x 34px`.
   - Decrementing at quantity 1 triggers safe item deletion.
4. **Checkout Engine (`/checkout`)**:
   - Fulfillment Toggle: Doorstep Delivery vs. Kitchen Hub Pickup.
   - Delivery window slot selector (e.g. *Today, 6:00 PM - 7:00 PM*).
   - Server-calculated quote breakdown (`/api/v1/orders/quote`).
   - Mock PCI-compliant 256-bit encrypted card input.
5. **Real-Time Order Tracking (`/orders/[id]`)**:
   - 6-Stage visual milestone progress bar.
   - Live order status polling.
   - Blast-chilled storage advisory and customer reheating instructions.
6. **Kitchen KDS Portal (`/admin`)**:
   - Kanban board for kitchen staff: New Orders, Preparing, Ready for Blast Chilling, Out for Delivery.
   - Real-time order age tracking with kitchen delay alerts.

---

## 5. Backend Architecture & Complete API Specification

The backend is built with NestJS and structured into decoupled domain modules.

### 5.1 Base Configuration
- **Base URL**: `https://mylapore-express-api.onrender.com/api/v1`
- **Local Dev URL**: `http://localhost:4000/api/v1`
- **Content-Type**: `application/json`
- **Swagger Documentation**: `/api/docs`

### 5.2 Core E-Commerce REST Endpoints

#### 1. System Health
- **`GET /health`**
  - **Description**: Returns database connection health, memory status, and uptime.
  - **Response 200**:
    ```json
    {
      "status": "ok",
      "service": "mylapore-express-api",
      "timestamp": "2026-11-11T16:39:22.407Z",
      "database": "healthy",
      "uptime": 61.03
    }
    ```

#### 2. Menu & Categories
- **`GET /menu/categories`**: Lists all active categories (Curries, Rice, Sambar, Rasam, Chutneys, Desserts, Beverages, Batters, Specials, Pickles).
- **`GET /menu/items?category={slug}&search={query}&dietary={tag}`**:
  - Filter by category slug, free text search, or dietary requirements (`VEGAN`, `JAIN`, `GLUTEN_FREE`).
- **`GET /menu/items/{idOrSlug}`**: Retrieves detailed dish info, variants, ingredients, allergen warnings, and reheating guidelines.

#### 3. Cart Lifecycle
- **`GET /cart`**: Returns current cart items, subtotal, and item count using session header (`x-session-token`) or Bearer JWT.
- **`POST /cart/items`**:
  - **Payload**:
    ```json
    {
      "menuItemId": "c0182a31-011e-4852-bfae-b37ab2c6e10a",
      "quantity": 1,
      "variantId": null,
      "spiceLevel": "MEDIUM",
      "specialInstructions": "Extra curry leaves if possible"
    }
    ```
- **`PATCH /cart/items/{itemId}`**: Updates item quantity.
- **`DELETE /cart/items/{itemId}`**: Removes item from cart.

#### 4. Pricing Quote & Checkout
- **`POST /orders/quote`**:
  - **Description**: Server-side guaranteed financial calculation. Client prices are ignored.
  - **Payload**:
    ```json
    {
      "orderType": "DELIVERY",
      "couponCode": "MYLAPORE15",
      "tip": 3.00,
      "deliveryAddressText": "1244 S Capitol Ave, San Jose, CA 95127"
    }
    ```
  - **Response 200**:
    ```json
    {
      "subtotal": 24.98,
      "discount": 3.75,
      "tax": 1.75,
      "deliveryFee": 4.99,
      "tip": 3.00,
      "total": 30.97,
      "isFreeDelivery": false
    }
    ```

#### 5. Order Management
- **`POST /orders`**:
  - **Description**: Creates order intent, locks pricing, and initializes Stripe payment intent.
  - **Payload**:
    ```json
    {
      "orderType": "DELIVERY",
      "deliveryAddressText": "1244 S Capitol Ave, San Jose, CA 95127",
      "deliverySlot": "Today, 6:00 PM - 7:00 PM",
      "couponCode": "MYLAPORE15",
      "tip": 3.00,
      "specialInstructions": "Please leave at side porch",
      "guestName": "Anand Krishnan",
      "guestEmail": "customer@example.com",
      "guestPhone": "(925) 238-3736"
    }
    ```
  - **Response 201**:
    ```json
    {
      "order": {
        "id": "de182a31-011e-4852-bfae-b37ab2c6e10e",
        "orderNumber": "MYL-2026-1003",
        "status": "PENDING_PAYMENT",
        "total": 30.97
      },
      "paymentIntent": {
        "paymentIntentId": "pi_mock_1794415849962",
        "clientSecret": "pi_mock_secret_1794415849962"
      }
    }
    ```
- **`POST /payments/confirm-test-payment`**: Test confirmation hook to transition payment intent to `SUCCEEDED` and Order to `CONFIRMED`.
- **`GET /orders/{idOrOrderNumber}`**: Real-time status lookup with order history and delivery window.

---

## 6. Salesforce Agentforce Specification & AI Gateway

The platform provides a dedicated, grounded **Agent Gateway API** specifically built for Salesforce Agentforce Actions and External Services.

### 6.1 Agentforce Architectural Boundaries

1. **Zero Hallucination Actions**:
   - AI Agents are strictly barred from inventing prices, modifying inventory directly, or guessing refund amounts.
   - All actions must be cryptographically dispatched to the NestJS `/api/v1/agent/*` endpoints.
2. **Identity & Authorization Guardrails**:
   - The Agentforce Session transmits an authenticated caller token.
   - Cross-tenant or cross-customer order references return a generic `ORDER_NOT_FOUND` to prevent data harvesting.
3. **Audit Trail**:
   - Every Agentforce tool execution creates an immutable record in `AuditLog` capturing:
     - `userId` / `callerSessionId`
     - `action` (e.g. `AGENTFORCE_CANCELLATION_SUBMITTED`)
     - `payload` containing the tool arguments
     - `ipAddress` or Salesforce Pod ID

### 6.2 Agent Gateway Endpoints (`/api/v1/agent`)

#### 1. Menu Search Action
- **`POST /api/v1/agent/menu/search`**
  - **Agent Role**: Customer Concierge Agent
  - **Payload**:
    ```json
    {
      "query": "kurma",
      "dietaryTags": ["VEGAN"],
      "limit": 5
    }
    ```
  - **Response 200**:
    ```json
    {
      "success": true,
      "items": [
        {
          "id": "c0182a31-011e-4852-bfae-b37ab2c6e10a",
          "name": "South Indian Veg Kurma",
          "description": "South Indian Veg Kurma for Parotta. Vegan, has coconut and rich spices.",
          "price": { "amountMinor": 1249, "currency": "USD" },
          "availability": "AVAILABLE",
          "category": "Curries",
          "dietaryTags": ["VEGAN"],
          "spiceLevel": "MEDIUM"
        }
      ],
      "correlationId": "corr_1794415849_ab3d"
    }
    ```

#### 2. Order Status Lookup Action
- **`GET /api/v1/agent/orders/{orderNumber}`**
  - **Agent Role**: Order Management Agent
  - **Response 200**:
    ```json
    {
      "orderNumber": "MYL-2026-1003",
      "status": "CONFIRMED",
      "stage": "Kitchen Accepted",
      "deliveryWindow": "Today, 6:00 PM - 7:00 PM",
      "blastChilledTemp": "38°F",
      "items": [
        { "name": "South Indian Veg Kurma", "quantity": 2, "price": 24.98 }
      ],
      "totalAmount": 30.97
    }
    ```

#### 3. Cancellation Policy Preview Action
- **`POST /api/v1/agent/orders/{orderNumber}/cancellation-preview`**
  - **Agent Role**: Order Management Agent
  - **Description**: Evaluates whether an order can be cancelled and calculates the guaranteed refund percentage based on operational kitchen status.
  - **Response 200**:
    ```json
    {
      "orderNumber": "MYL-2026-1003",
      "eligible": true,
      "currentStatus": "CONFIRMED",
      "refundPercentage": 100,
      "refundAmount": 30.97,
      "cancellationFee": 0.00,
      "previewId": "prev_6f8b2c4e1a",
      "expiresAt": "2026-11-11T17:15:00.000Z",
      "policyMessage": "Order is CONFIRMED and not yet in preparation. 100% full refund available."
    }
    ```

#### 4. Confirmed Cancellation Execution Action
- **`POST /api/v1/agent/orders/{orderNumber}/cancellation`**
  - **Agent Role**: Order Management Agent
  - **Headers**: `Idempotency-Key: {uuid}`
  - **Payload**:
    ```json
    {
      "previewId": "prev_6f8b2c4e1a",
      "confirmation": true,
      "reasonCode": "CUSTOMER_CHANGE_OF_PLANS"
    }
    ```
  - **Response 202**:
    ```json
    {
      "success": true,
      "orderNumber": "MYL-2026-1003",
      "status": "CANCELLED",
      "refundIssued": 30.97,
      "salesforceRefundId": "a03de182a31011e",
      "timestamp": "2026-11-11T17:05:30.000Z"
    }
    ```

#### 5. Salesforce Service Cloud Case Creation Action
- **`POST /api/v1/agent/support/cases`**
  - **Agent Role**: Customer Support Agent
  - **Payload**:
    ```json
    {
      "orderId": "MYL-2026-1003",
      "category": "FOOD_QUALITY",
      "summary": "Customer inquiry regarding reheating instructions for blast-chilled Kurma",
      "preferredContactChannel": "EMAIL",
      "customerEmail": "customer@example.com",
      "customerName": "Anand Krishnan"
    }
    ```
  - **Response 202**:
    ```json
    {
      "caseCreated": true,
      "caseNumber": "500_SF_1794415849",
      "slaTier": "STANDARD",
      "assignedQueue": "Tier_1_Customer_Support"
    }
    ```

---

## 7. The 5 Autonomous Agentforce AI Agents Blueprint

Salesforce administrators and developers should configure these 5 distinct Agentforce agents within the Agentforce Builder:

```
                                  AGENTFORCE NETWORK
  ┌───────────────────────────────────────┬───────────────────────────────────────┐
  │                                       │                                       │
  ▼                                       ▼                                       ▼
1. Concierge Agent             2. Order Management Agent       3. Support & Case Agent
   - Menu & Dietary Filter        - Live Order Tracking           - Complaint Escalation
   - Allergen Grounding           - Cancellation Policy           - Refund Request Sync
   - Spice Customization          - Rescheduling Validation       - Human Agent Handoff
  │                                       │                                       │
  └───────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
          4. Kitchen Ops Agent                    5. Business Insights Agent
             - Prep Delay Monitoring                 - Executive Sales Metrics
             - Blast Chill Freshness Check           - Dish Re-order Trends
             - Dispatch Handoff Alarms               - Retention & Cohorts
```

### Agent 1: Restaurant Customer Concierge Agent
- **Target Persona**: Food Discovery & Recommendations Assistant.
- **Audience**: Guest and authenticated web visitors.
- **Agentforce Topic**: `Food_Discovery_And_Recommendations`
- **Actions Grounding**:
  - `Search_Menu` -> Calls `POST /api/v1/agent/menu/search`.
  - `Get_Menu_Item_Details` -> Calls `GET /api/v1/agent/menu/items/{id}`.
- **System Prompt Directives**:
  ```
  You are the Mylapore Express AI Concierge.
  Your role is to guide customers through authentic South Indian delicacies from Chennai.
  Always inquire about dietary requirements: Jain (no onion/garlic/root veg), Vegan, or Gluten-Free.
  Explain blast-chilled freshness: Meals are freshly cooked and immediately blast-chilled to 38°F
  to retain home-style flavor without artificial preservatives.
  Never invent menu prices or items not returned by Search_Menu.
  ```

### Agent 2: Order Management Agent
- **Target Persona**: Transactional Operations Specialist.
- **Audience**: Customers checking status, rescheduling, or requesting cancellations.
- **Agentforce Topic**: `Order_Lifecycle_Management`
- **Actions Grounding**:
  - `Get_Order_Status` -> Calls `GET /api/v1/agent/orders/{orderNumber}`.
  - `Preview_Cancellation` -> Calls `POST /api/v1/agent/orders/{orderNumber}/cancellation-preview`.
  - `Execute_Cancellation` -> Calls `POST /api/v1/agent/orders/{orderNumber}/cancellation`.
- **Guardrails**:
  - Never process a cancellation without explicitly presenting the `refundPercentage` and `cancellationFee` from `Preview_Cancellation` and receiving explicit customer confirmation (`yes`/`confirm`).

### Agent 3: Customer Support & Service Cloud Agent
- **Target Persona**: Issue Resolution & Escalation Specialist.
- **Audience**: Customers experiencing delivery delays, missing items, or food quality concerns.
- **Agentforce Topic**: `Service_Cloud_Escalation`
- **Actions Grounding**:
  - `Create_Support_Case` -> Calls `POST /api/v1/agent/support/cases`.
  - `Escalate_To_Human` -> Triggers Omni-Channel routing to live Service Cloud agents.
- **Custom Object Output**: Standard Salesforce `Case` record created with Priority, Order Lookup, and Sentiment rating.

### Agent 4: Kitchen Operations Agent
- **Target Persona**: Internal Kitchen Dispatch Overseer.
- **Audience**: Kitchen Managers, Chefs, Delivery Coordinators.
- **Responsibilities**:
  - Monitors order acceptance timeouts (orders exceeding 15 minutes unaccepted are auto-cancelled with 100% refund).
  - Alarms when blast-chilling cooling totes are below threshold.
  - Dispatches driver assignments for scheduled delivery windows.

### Agent 5: Restaurant Business Insights Agent
- **Target Persona**: Executive Culinary Analytics Specialist.
- **Audience**: Restaurant owners, finance managers.
- **Responsibilities**:
  - Computes weekly dish re-order rates (e.g. *South Indian Veg Kurma* vs. *Murungai Keerai Kootu*).
  - Identifies peak ordering hours for blast-chilling batch optimization.
  - Summarizes promo code conversion metrics (`MYLAPORE15`).

---

## 8. Salesforce Custom Objects & Data Schema Mapping

When integrating Salesforce Service Cloud with the NestJS backend, map PostgreSQL tables to the following Salesforce Schema:

| PostgreSQL (Prisma) Table | Salesforce Object Name | API Name | Key Fields Mapped |
|---|---|---|---|
| `User` (Role: CUSTOMER) | **Contact** | `Contact` | `Email`, `FirstName`, `LastName`, `Phone`, `External_ID__c` |
| `CustomerAddress` | **Contact Point Address** | `ContactPointAddress` | `Street`, `City`, `State`, `PostalCode`, `Default__c` |
| `Order` | **Restaurant Order** | `Restaurant_Order__c` | `Name` (MYL-2026-...), `Status__c`, `Total__c`, `Delivery_Slot__c`, `Blast_Chilled_Temp__c` |
| `OrderItem` | **Order Dish Line** | `Order_Dish_Line__c` | `Order__c`, `Menu_Item_Name__c`, `Quantity__c`, `Unit_Price__c`, `Spice_Level__c` |
| `Payment` | **Payment Transaction** | `Payment_Transaction__c` | `Order__c`, `Stripe_Payment_ID__c`, `Amount__c`, `Status__c`, `Payment_Method__c` |
| `Refund` | **Refund Request** | `Refund_Request__c` | `Order__c`, `Amount__c`, `Reason__c`, `Status__c`, `Stripe_Refund_ID__c` |
| `SupportTicket` | **Case** | `Case` | `CaseNumber`, `Subject`, `Description`, `Priority`, `Status`, `Restaurant_Order__c`, `Sentiment__c` |
| `AuditLog` | **Agent Interaction** | `Agent_Interaction__c` | `Agent_Persona__c`, `Action_Executed__c`, `Payload__c`, `Timestamp__c` |

---

## 9. End-to-End Setup, Local Execution & Render Deployment

### 9.1 Local Development Environment

#### Prerequisites
- Node.js 20+
- pnpm 9+
- Git

#### 1. Clone & Install Monorepo
```bash
git clone https://github.com/Balakrishna047/Mylapore-Restaurant.git
cd Mylapore
pnpm install
```

#### 2. Environment Variables Configuration

Create `apps/api/.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://neondb_owner:npg_pj47ZJhkLYsO@ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="mylapore_jwt_enterprise_secret_2026"
CORS_ORIGIN="http://localhost:3000,https://mylapore-express-web.onrender.com"
SALESFORCE_ENABLED=false
```

Create `apps/web/.env.local`:
```env
PORT=3000
API_URL="http://localhost:4000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

#### 3. Database Migration & Seed
```bash
# Push Prisma schema to Postgres
pnpm --filter @mylapore/api db:push:pg

# Seed authentic South Indian dishes, categories, and test orders
pnpm --filter @mylapore/api db:seed
```

#### 4. Run Both Applications Simultaneously
```bash
# Terminal 1: Backend API (Listening on http://localhost:4000)
pnpm --filter @mylapore/api start:dev

# Terminal 2: Frontend Web (Listening on http://localhost:3000)
pnpm --filter @mylapore/web dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

### 9.2 Render Production Architecture & Deployment

The live platform is hosted on Render in the Oregon (`us-west`) region across two synchronized web services:

#### Service 1: Backend API (`mylapore-express-api`)
- **Service ID**: `srv-dbq4qplg1s2s73c1kdp0`
- **Primary URL**: `https://mylapore-express-api.onrender.com`
- **Environment**: Node.js 20
- **Build Command**: `pnpm install && pnpm build:api`
- **Start Command**: `pnpm db:push:pg && pnpm db:seed && node apps/api/dist/main.js`
- **Health Check Path**: `/api/v1/health`
- **Environment Variables**:
  - `DATABASE_URL`: Managed Neon PostgreSQL connection string.
  - `PORT`: `4000`
  - `NODE_ENV`: `production`
  - `CORS_ORIGIN`: `https://mylapore-express-web.onrender.com`

#### Service 2: Frontend Web (`mylapore-express-web`)
- **Service ID**: `srv-dbq4s7lg1s2s73c1okeg`
- **Primary URL**: `https://mylapore-express-web.onrender.com`
- **Environment**: Node.js 20
- **Build Command**: `pnpm install && pnpm build:web`
- **Start Command**: `pnpm --filter @mylapore/web start`
- **Environment Variables**:
  - `API_URL`: `https://mylapore-express-api.onrender.com`
  - `NEXT_PUBLIC_API_URL`: `https://mylapore-express-api.onrender.com`
  - `PORT`: `3000`

---

## 10. Salesforce Team Implementation Checklist

Salesforce architects and developers configuring Agentforce should follow this sequential deployment plan:

1. **Import OpenAPI External Service**:
   - In Salesforce Setup, navigate to **External Services** -> **Add New External Service**.
   - Provide the schema URL: `https://mylapore-express-api.onrender.com/api/docs-json` (or import from `docs/API_SPEC.yaml`).
   - Name the External Service: `MylaporeExpressApi`.
2. **Configure Named Credential**:
   - Label: `Mylapore_Express_API_Credential`
   - URL: `https://mylapore-express-api.onrender.com`
   - Authentication Protocol: Custom Header or OAuth 2.0.
3. **Deploy Custom Objects**:
   - Create Custom Objects: `Restaurant_Order__c`, `Order_Dish_Line__c`, `Payment_Transaction__c`, `Refund_Request__c`, `Agent_Interaction__c`.
   - Map field definitions as outlined in Section 8 of this document.
4. **Create Agentforce Actions**:
   - Create Agent Action: `SearchMenuAction` linking to `POST /api/v1/agent/menu/search`.
   - Create Agent Action: `OrderStatusAction` linking to `GET /api/v1/agent/orders/{orderNumber}`.
   - Create Agent Action: `CancelPreviewAction` linking to `POST /api/v1/agent/orders/{orderNumber}/cancellation-preview`.
   - Create Agent Action: `CancelSubmitAction` linking to `POST /api/v1/agent/orders/{orderNumber}/cancellation`.
   - Create Agent Action: `SupportCaseAction` linking to `POST /api/v1/agent/support/cases`.
5. **Assign Topics & Test Guardrails**:
   - Assign actions to the respective Agentforce Agents (`Customer Concierge`, `Order Management`, `Customer Support`).
   - Validate that conversational queries (e.g. *"Can I get a Jain curry with no onions?"* or *"Track order MYL-2026-1003"*) accurately execute the grounded backend actions and respond with blast-chilled culinary authenticity.

---

*Document Author: Antigravity AI Engineering Architecture Team*  
*Project: Mylapore Express Restaurant E-Commerce & Agentforce Platform*  
*Status: Approved for Production & Salesforce Agentforce Integration*
