# Enterprise Architecture Specification — Mylapore Express
**Author**: Certified Technical Architect (CTA) / Principal Enterprise Solutions Architect  
**Project**: Mylapore Express Enterprise Restaurant E-Commerce & Autonomous Agentforce AI Network  
**Target Environments**:  
- Web: `https://mylapore-express-web.onrender.com`  
- API: `https://mylapore-express-api.onrender.com`  
- Database: Neon Serverless PostgreSQL (`ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech/neondb`)  
- Salesforce: Service Cloud Enterprise Edition & Agentforce Autonomous Agent Suite  

---

## 1. Executive Summary & Architectural Tenets
Mylapore Express is an authentic South Indian enterprise culinary e-commerce platform architected according to **Spec-Driven Development (SDD)** and strict **zero-hallucination operational boundaries**:

1. **Single Writer per Business Fact**: NestJS API + PostgreSQL is the sole transactional authority for menus, carts, pricing, order states, and financial movements.
2. **Untrusted AI Orchestration**: Salesforce Agentforce AI agents operate strictly as conversational orchestrators. Agents have **zero direct database access** and must invoke authenticated, idempotent backend REST APIs.
3. **Idempotent Financial Boundaries**: Cancellation, rescheduling, and refund flows utilize two-phase commit tokens (`previewId`) and database-backed `IdempotencyRecord` concurrency locking to guarantee zero duplicate charges or refunds.
4. **Resilient Asynchronous Bi-directional Sync**: Outbound platform events flow via the Transactional Outbox Pattern (`IntegrationEvent`), while inbound operational escalations flow via HMAC-SHA256 signed webhooks (`SalesforceWebhookController`).
5. **Strict SLA & Latency Governance**: Callouts from Salesforce adhere to the hard 10-second platform timeout through cold-start keep-alive daemons, database connection pooling, and sub-second endpoint SLAs.

---

## 2. End-to-End Enterprise Architecture Topology

```mermaid
flowchart TD
    subgraph Client Tier ["Client & Agent Interaction Tier"]
        WEB["Next.js 14 Storefront<br/>(Tailwind CSS, Mobile Drawer)"]
        MIAW["Salesforce MIAW Chat<br/>(embeddedservice_bootstrap)"]
        LWC["Agentforce Custom LWC<br/>(Dish Carousel, Tracking Pill)"]
        KITCHEN_APP["Kitchen Display Portal<br/>(Order Prep, Blast-Chill)"]
    end

    subgraph Gateway ["API & Edge Gateway (NestJS Monolith)"]
        CORS["CORS & Helmet Security"]
        KEY_GUARD["AgentforceApiKeyGuard<br/>(x-agentforce-api-key)"]
        JWT_GUARD["JwtAuthGuard / RolesGuard"]
        SWAGGER["OpenAPI 3.0 Engine<br/>(/api/docs & /api/docs-json)"]
        WEBHOOK_EP["SalesforceWebhookController<br/>(HMAC-SHA256 Auth)"]
    end

    subgraph Services ["NestJS Domain Core"]
        AGENT_SVC["AgentService<br/>(Search, Preview, Cancel)"]
        ORDER_SVC["OrdersService<br/>(Finite State Machine)"]
        PAYMENT_SVC["PaymentsService<br/>(Stripe Connect, Refunds)"]
        OUTBOX_SVC["OutboxService<br/>(Transactional Outbox)"]
    end

    subgraph Data Tier ["Data Persistence & Locking Tier"]
        PG[(Neon PostgreSQL Pooler<br/>Prisma ORM - 17 Entities)]
        IDEMP[(IdempotencyRecord Table<br/>Distributed Request Lock)]
        OUTBOX_TBL[(IntegrationEvent Table<br/>Status: PENDING/PUBLISHED)]
    end

    subgraph External ["External Enterprise Cloud Services"]
        SF_AGENTFORCE["Salesforce Agentforce<br/>(5 Autonomous AI Agents)"]
        SF_SERVICE["Salesforce Service Cloud<br/>(Cases, Escalations, SLAs)"]
        STRIPE["Stripe Payments API<br/>(Webhooks & Refunds)"]
    end

    WEB -->|HTTPS / REST| CORS
    MIAW -->|WebSocket / Live Agent| SF_AGENTFORCE
    LWC -->|Agent Wire Context| SF_AGENTFORCE
    KITCHEN_APP -->|JWT / Admin REST| CORS

    CORS --> KEY_GUARD
    CORS --> JWT_GUARD
    CORS --> WEBHOOK_EP

    KEY_GUARD --> AGENT_SVC
    WEBHOOK_EP --> ORDER_SVC
    JWT_GUARD --> ORDER_SVC

    AGENT_SVC --> ORDER_SVC
    AGENT_SVC --> IDEMP
    ORDER_SVC --> PAYMENT_SVC
    ORDER_SVC --> OUTBOX_SVC

    ORDER_SVC --> PG
    PAYMENT_SVC --> STRIPE
    OUTBOX_SVC --> OUTBOX_TBL
    OUTBOX_SVC -->|Async Push| SF_SERVICE

    SF_AGENTFORCE -->|Named Credential REST| KEY_GUARD
    SF_SERVICE -->|HMAC-Signed Webhook| WEBHOOK_EP
    SWAGGER -.->|Schema Import| SF_AGENTFORCE
```

---

## 3. Data Ownership & System Boundaries

| Business Domain | Authoritative System (Writer) | Read Replicas / Snapshots | Consistency Model |
|---|---|---|---|
| **Catalog, Pricing & Tax** | NestJS / Neon PostgreSQL | Next.js Frontend / Agent Cache | Strong consistency (Real-time DB query) |
| **Cart & Active Quotes** | NestJS / Neon PostgreSQL | Browser Session Storage | Strong consistency (Server-side quote calculation) |
| **Order State Machine** | NestJS / Neon PostgreSQL | Salesforce `OrderSummary` & `OrderStatusHistory` | Eventual consistency via Transactional Outbox |
| **Payment Truth & Intent** | Stripe API + NestJS Verification | Salesforce `Payment` Record | Strong consistency via Stripe Webhook Inbox |
| **Refund Execution** | Stripe API (Triggered by NestJS) | Salesforce `Refund` Object | Strong consistency with DB `IdempotencyRecord` |
| **Support Cases & SLAs** | Salesforce Service Cloud | NestJS `SupportTicket` Table | Eventual consistency via Inbound Webhook (`SF_CASE_SYNC`) |
| **Autonomous AI Reasoning** | Salesforce Agentforce Reasoning Engine | Salesforce `AgentSession` & Audit Log | Ephemeral reasoning; concrete state written via API |

---

## 4. End-to-End Architectural Flows

### Flow A: Conversational Order Tracking & Status Ingestion
```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as MIAW Chat / Storefront
    participant Agent as Concierge / Order Agent (Agentforce)
    participant NC as Salesforce Named Credential
    participant API as NestJS AgentController
    participant Guard as AgentforceApiKeyGuard
    participant DB as Neon PostgreSQL (Prisma)

    Customer->>UI: "Where is my order MYL-2026-1003?"
    UI->>Agent: Prompt routed to Order Management Agent
    Agent->>Agent: Resolve topic 'Order Lookup' & extract OrderNumber
    Agent->>NC: Execute Action: agentforceGetOrderStatus(orderId)
    NC->>API: GET /api/v1/agent/orders/MYL-2026-1003<br/>Header: x-agentforce-api-key
    API->>Guard: Validate shared API Key
    Guard->>API: Key valid (Req.agentforceVerified = true)
    API->>DB: prisma.order.findFirst({ where: { orderNumber } })
    DB-->>API: Return Order, Items, OrderStatusHistory
    API-->>NC: 200 OK { orderId, status: "PREPARING", deliverySlot, customerMessage }
    NC-->>Agent: Action Output JSON
    Agent->>UI: Stream response + render custom LWC OrderTrackingPill
    UI-->>Customer: "Your order is currently being freshly cooked and blast-chilled to 38°F."
```

### Flow B: Idempotent Two-Phase Cancellation & Refund Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Agent as Order Management Agent
    participant NC as Salesforce Named Credential
    participant API as NestJS AgentController
    participant Svc as AgentService & OrdersService
    participant Idemp as IdempotencyRecord Table
    participant Stripe as Stripe Gateway

    Customer->>Agent: "I need to cancel my order."
    Agent->>NC: Callout: POST /agent/orders/:id/cancellation-preview
    NC->>API: Preview Request
    API->>Svc: previewCancellation(orderId)
    Svc-->>API: { previewId: "prev_9831", eligible: true, refundPercentage: 100, refundAmount: 34.50 }
    API-->>Agent: Preview response
    Agent-->>Customer: "Your order is eligible for a 100% refund ($34.50). Do you confirm?"
    Customer->>Agent: "Yes, please confirm cancellation."
    Agent->>NC: Callout: POST /agent/orders/:id/cancellation<br/>Body: { previewId, confirmation: true }<br/>Header: Idempotency-Key
    NC->>API: Submit Cancellation
    API->>Svc: submitCancellation(orderId, body, key)
    Svc->>Idemp: Check if key exists
    alt Key already exists
        Idemp-->>Svc: Return cached response
    else Key new
        Svc->>Svc: Transition Order -> CANCELLED
        Svc->>Stripe: Execute refund via Stripe API
        Svc->>Idemp: Insert { key, scope, responseBody, statusCode: 202 }
    end
    Svc-->>API: { success: true, status: "CANCELLED", refundAmount: 34.50 }
    API-->>Agent: 202 Accepted
    Agent-->>Customer: "Your order has been cancelled and $34.50 has been refunded to your card."
```

### Flow C: Outbox Asynchronous Sync & Inbound Webhook Flow
```mermaid
sequenceDiagram
    autonumber
    participant Nest as NestJS OrdersService
    participant Outbox as IntegrationEvent Table
    participant Worker as OutboxService Daemon
    participant SF_API as Salesforce REST Composite API
    participant SF_Agent as Service Cloud Support Rep
    participant Webhook as SalesforceWebhookController
    participant DB as Neon PostgreSQL

    Nest->>DB: Update Order Status -> PREPARING
    Nest->>Outbox: Insert Event: ORDER_STATUS_CHANGED (status: PENDING)
    Worker->>Outbox: Poll pending events (batch 20)
    Worker->>SF_API: POST /services/data/v60.0/sobjects/Order__c (Upsert)
    SF_API-->>Worker: 200 OK
    Worker->>Outbox: Update Status -> PUBLISHED, processedAt: now()

    Note over SF_Agent,Webhook: Inbound Escalation Flow
    SF_Agent->>SF_API: Escalate Case & Add VIP Note to Order
    SF_API->>Webhook: POST /api/v1/integrations/salesforce/webhook<br/>Header: x-salesforce-signature (HMAC-SHA256)
    Webhook->>Webhook: Verify HMAC-SHA256 signature
    Webhook->>DB: Update SupportTicket + Append OrderStatusHistory note
    Webhook-->>SF_API: 200 OK { received: true, eventId }
```

---

## 5. Security & Governance Architecture

### 5.1 Named Credential Authentication
Every callout executed by Agentforce passes through a dedicated Salesforce Named Credential:
- **Header**: `x-agentforce-api-key: <AGENTFORCE_API_KEY>`
- **Enforcement**: Handled at the NestJS router boundary by `AgentforceApiKeyGuard`. Requests missing or containing invalid keys are rejected immediately with `401 Unauthorized` before invoking service layers.

### 5.2 Inbound Webhook HMAC Verification
Webhooks dispatched from Salesforce Service Cloud to `POST /api/v1/integrations/salesforce/webhook` are protected with cryptographic signatures:
- **Header**: `x-salesforce-signature: <HMAC_HEX>`
- **Algorithm**: `crypto.createHmac('sha256', process.env.SALESFORCE_WEBHOOK_SECRET).update(rawPayload).digest('hex')`
- **Replay Protection**: Verified against unique `eventId` and recorded in `IntegrationEvent` with deduplication constraints.

### 5.3 OpenAPI 3.0 Compatibility for External Services
Salesforce External Services imposes strict validation rules on OpenAPI specifications:
- Every route registered for agent consumption provides an explicit, deterministic `operationId` (`agentforceSearchMenu`, `agentforceGetOrderStatus`, etc.).
- Schema types utilize strict primitive definitions (`string`, `number`, `boolean`, `array`).
- The live API exposes raw JSON at `GET /api/docs-json`, enabling one-click URL schema imports in Salesforce Setup.

---

## 6. Operational Resilience & Keep-Alive Strategy

### 6.1 Mitigation of 10-Second Salesforce Callout Limit
Salesforce Agentforce enforces a hard 10,000ms timeout on HTTP callouts. Cloud hosting providers on free/starter tiers (such as Render) suspend idle compute after 15 minutes of inactivity, introducing cold-start penalties of 30–50 seconds.

**Production Solution**:
1. **Keep-Alive Heartbeat Daemon**: A persistent cron or synthetic probe sends an authenticated lightweight `GET /api/v1/health` ping every 4 minutes.
2. **Neon Connection Pooling**: Database connections utilize Neon's PgBouncer pooler (`ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech`), eliminating TLS handshake overhead during serverless query bursts.
3. **Sub-second Response Ceiling**: Heavy queries are indexed in PostgreSQL (`@@index([status, nextRetryAt])`, `@@index([orderNumber])`).

---

## 7. Monorepo Implementation Mapping

| Architecture Component | Codebase Implementation | Role & Responsibilities |
|---|---|---|
| **API Key Guard** | `apps/api/src/common/agentforce-api-key.guard.ts` | Guards `/agent/*` endpoints against unauthorized callers |
| **Agent Gateway Controller** | `apps/api/src/agent/agent.controller.ts` | Exposes OpenAPI actions with deterministic `operationId`s |
| **Agent Domain Logic** | `apps/api/src/agent/agent.service.ts` | Executes menu search, order retrieval, and cancellation preview |
| **Inbound Webhook Controller** | `apps/api/src/integrations/salesforce-webhook.controller.ts` | Ingests HMAC-signed events from Service Cloud |
| **Transactional Outbox** | `apps/api/src/integrations/outbox.service.ts` | Asynchronously transmits local events to Salesforce |
| **Idempotency Engine** | `apps/api/src/orders/orders.service.ts` + `Prisma.idempotencyRecord` | Guarantees exactly-once financial execution |
| **Storefront Chat Interface** | `apps/web/src/components/chat/ChatWidget.tsx` | Embeds MIAW / Web chat widget for customer interaction |
| **Mobile Web Experience** | `apps/web/src/components/cart/MobileCartBar.tsx` | Responsive 390px viewport navigation and checkout trigger |
