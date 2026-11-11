# System Architecture Document: Mylapore Express

- **Document ID**: SAD-ME-04
- **Version**: 2.0

---

## 1. High-Level Enterprise Topology

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Experience Layer"]
        Browser["Next.js App Router (React, Tailwind CSS, TanStack Query)"]
        MobileWeb["Mobile Web App"]
    end

    subgraph EdgeLayer ["Edge & Ingress (Render CDN)"]
        Ingress["Render TLS Termination & Load Balancer"]
    end

    subgraph BackendLayer ["Backend Services Layer (NestJS Modular Monolith)"]
        API["NestJS Core API Gateway (/api/v1)"]
        AuthModule["Auth & RBAC Module"]
        MenuModule["Menu & Catalog Module"]
        OrderModule["Order & Cart State Machine"]
        PaymentModule["Payment Adapter (Stripe / Local Providers)"]
        WebhookModule["Signed Webhook Processor"]
        SupportModule["Support & Chatbot Engine"]
        AdminModule["Kitchen & Dispatch Admin"]
        SFModule["Salesforce Integration Adapter"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        Postgres[(PostgreSQL 16 - Prisma ORM)]
        RedisCache[(Redis - Cache & Event Queue)]
    end

    subgraph ExternalServices ["External Enterprise Ecosystem"]
        Stripe["Stripe Payments & Refunds"]
        Salesforce["Salesforce Service Cloud (Cases, Contacts)"]
        Agentforce["Salesforce Agentforce AI Services"]
        POSAdapter["Simulated Operational POS Adapter"]
    end

    ClientLayer --> Ingress
    Ingress --> API
    API --> AuthModule
    API --> MenuModule
    API --> OrderModule
    API --> PaymentModule
    API --> WebhookModule
    API --> SupportModule
    API --> AdminModule
    API --> SFModule

    OrderModule --> Postgres
    MenuModule --> Postgres
    AuthModule --> Postgres
    AdminModule --> Postgres
    PaymentModule --> Postgres

    OrderModule -.-> RedisCache
    PaymentModule --> Stripe
    Stripe --> WebhookModule
    SFModule --> Salesforce
    SupportModule --> Agentforce
    AdminModule --> POSAdapter
```

---

## 2. Architectural Decisions & Patterns

### ADR-001: Modular Monolith vs Microservices
- **Decision**: Adopt a Modular Monolith in NestJS with clean domain boundaries (`apps/api`), sharing types via `packages/shared-types`.
- **Justification**: Eliminates network hop overhead, distributed transaction failures, and complex service mesh overhead while allowing rapid development and effortless horizontal scaling on Render.

### ADR-002: Dual System of Record Principle
- **Operational Data (Transactional Master)**: PostgreSQL owns all customer accounts, menu items, orders, line items, payments, delivery statuses, and refund records.
- **CRM Data (Engagement Master)**: Salesforce Service Cloud owns support cases, omni-channel tickets, customer sentiment, and marketing segmentation. Sync occurs asynchronously.

### ADR-003: Idempotent Payment Flow
- **Pattern**: Stripe PaymentIntent creation with unique client order tokens. The order is stored initially with status `PENDING_PAYMENT`. The webhook handler verifies the cryptographic signature from Stripe and executes a transactional update:
```sql
UPDATE "Order" SET status = 'CONFIRMED' WHERE id = :orderId AND status = 'PENDING_PAYMENT';
```
If a duplicate webhook arrives, the query performs no mutation, guaranteeing exactly-once order confirmation.
