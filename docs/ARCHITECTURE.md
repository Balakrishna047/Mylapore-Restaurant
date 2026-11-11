# Architecture Specification — Mylapore Express

## 1. Architecture principles
1. Single writer per business fact.
2. NestJS is the policy and transaction boundary.
3. PostgreSQL is operational truth.
4. Agentforce is untrusted orchestration, not an authority.
5. Salesforce is CRM/service system and snapshot consumer.
6. Integrations are asynchronous where possible and idempotent.
7. External vendors are isolated behind adapters.
8. Build a modular monolith before considering microservices.

## 2. Logical architecture

```text
Browser / Mobile Web
  ├── Next.js Storefront + Customer Chat UI
  ├── Admin Portal
  └── Kitchen Operations UI
          │ HTTPS / cookie session
          ▼
      NestJS API
  ├── Identity & Session
  ├── Outlet & Menu
  ├── Cart & Pricing
  ├── Checkout & Slot Capacity
  ├── Order State Machine
  ├── Payment & Refund
  ├── Kitchen & Delivery
  ├── Support & CRM Integration
  ├── Agent Session Gateway / Agent API
  ├── Notification
  ├── Outbox / Reconciliation
  └── Reporting
          │
          ├── PostgreSQL + Prisma
          ├── Stripe PaymentProvider adapter
          ├── POS adapter (mock v1)
          ├── Delivery adapter (mock v1)
          ├── Email/SMS adapter (provider TBD)
          └── Salesforce integration
                 ├── Service Cloud
                 ├── Agentforce
                 ├── Flow / Apex
                 └── Platform Events (optional)
```

## 3. System ownership

| Domain | Writer | Read copies |
|---|---|---|
| Menu, price, availability | NestJS/PostgreSQL | Optional frontend cache |
| Cart and quote | NestJS/PostgreSQL | None authoritative |
| Order and lifecycle | NestJS/PostgreSQL | Salesforce snapshot |
| Payment truth | NestJS based on verified Stripe events | Salesforce snapshot |
| Charge/refund movement | Stripe, invoked by NestJS | Salesforce refund snapshot |
| Kitchen/delivery events | Operations UI/POS through NestJS | Reporting projections |
| Customer commerce profile/consent | PostgreSQL | Salesforce Contact snapshot |
| Cases, notes, queues, approval | Salesforce | Case reference/status in PostgreSQL |
| Agent reasoning | Agentforce | Safe summary/outcome in Salesforce |

## 4. Backend module boundaries

- `identity`: authentication, sessions, OTP/step-up, staff roles.
- `customers`: profile, addresses, consent.
- `outlets`: outlet config, opening hours, service zones.
- `catalog`: categories, products, variants, modifiers, combos, allergens.
- `availability`: outlet item availability and capacity checks.
- `cart`: guest/customer carts and cart lines.
- `pricing`: quote calculation, tax/fee/discount rules.
- `promotions`: coupon validation and usage limits.
- `checkout`: quote locking, fulfilment, idempotent order creation.
- `orders`: order state machine, immutable line snapshots and history.
- `payments`: provider adapter, intents, webhook inbox and reconciliation.
- `refunds`: policy tier, approvals, provider execution and reconciliation.
- `kitchen`: queue, acceptance timeout, prep events.
- `delivery`: provider adapter and delivery state machine.
- `support`: Case reference and customer support integration.
- `agent`: chat sessions, identity token, action facade and budgets.
- `notifications`: deduplicated communication jobs.
- `integration`: Salesforce API client, outbox consumer, retry and DLQ.
- `audit`: security and business audit events.
- `reporting`: read-only aggregates and KPI definitions.

Do not let modules query another module's tables directly where a service interface is practical. Use shared transaction services for multi-module atomic operations.

## 5. Trust and identity

### Customer session
- Browser authenticates with secure session cookie.
- Chat gateway creates a server-side `chat_sessions` record.
- Gateway issues short-lived signed identity token: `sub`, `session_id`, `aud`, `iss`, `iat`, `exp`, `jti`, `scopes`.
- Token is passed server-to-server to the Agentforce session/action context.
- Model cannot set or override identity claims.
- Agent action API validates token, session revocation, scope and request schema.
- Backend derives customer/guest principal from token, never request body.
- Staff actions use separate staff identity and role claims; do not reuse customer token.
- Sensitive actions require step-up verification.

### Failure behavior
- Expired/revoked token: 401 `SESSION_EXPIRED`.
- Missing scope: 403 `ACTION_NOT_ALLOWED`.
- Missing or non-owned order: same 404 `ORDER_NOT_FOUND`.
- Agentforce unavailable: chat unavailable/fallback to normal website and support form; commerce remains operational.

## 6. API and transaction conventions
- Prefix: `/api/v1`.
- Customer APIs: `/api/v1/...`.
- Agent APIs: `/api/v1/agent/...`.
- Provider webhooks: `/api/v1/webhooks/...`.
- Staff APIs: `/api/v1/admin/...` and `/api/v1/operations/...`.
- JSON request/response; ISO-8601 UTC timestamps.
- Money: integer minor units plus currency.
- Mutating requests require `Idempotency-Key`.
- Error envelope: `{ code, message, correlationId, details? }`; do not expose stack traces.
- Validate all input with DTO schemas.
- Pagination uses opaque cursor or bounded page/limit.
- API contract is `API_SPEC.yaml`; update it with code.

## 7. Payment and order orchestration

### Payment sequence
1. Validate quote, customer, outlet and fulfilment.
2. Create `AWAITING_PAYMENT` order and payment row in one database transaction.
3. Create Stripe PaymentIntent using stable idempotency key and order metadata.
4. Return client secret only to authorized checkout session.
5. Verify webhook signature on raw body.
6. Insert provider event into webhook inbox with unique provider event ID.
7. Validate event type, intent reference, amount, currency and order mapping.
8. In one transaction update payment, order state and outbox event.
9. Kitchen eligibility is based on order policy; payment success alone is not preparation.
10. Reconciliation job compares provider state to local pending/unknown records.

### Four state machines
- Order: `AWAITING_PAYMENT`, `PLACED`, `ACCEPTED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `DELIVERY_FAILED`.
- Payment: `NOT_STARTED`, `REQUIRES_ACTION`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `DISPUTED`, `COD_PENDING`, `COD_COLLECTED`.
- Refund: `REQUESTED`, `PENDING_APPROVAL`, `APPROVED`, `SUBMITTED`, `SUCCEEDED`, `FAILED`, `REJECTED`.
- Delivery: `UNASSIGNED`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `FAILED`.

Each transition has allowed source states, actor role, reason, policy and audit record. Never update status directly from a controller.

## 8. Refund control

- R1: deterministic platform/restaurant failure with clear evidence; backend may auto-approve only under configured policy.
- R2: low-value goodwill within configured per-order/customer limits; policy and abuse controls apply.
- R3: high-value, disputed, suspected fraud, food safety or exception; Salesforce human approval required.
- Salesforce approval is not itself money movement.
- NestJS verifies approval identity, approval status, amount, currency, order and remaining refundable balance before calling provider.
- Provider refund result/webhook/reconciliation determines final refund state.
- Enforce cumulative refunds <= captured amount.

## 9. Reliable Salesforce synchronization

Use transactional outbox:
- Business transaction writes domain state and outbox event in the same PostgreSQL transaction.
- Worker claims pending events with lease/lock, sends to Salesforce, marks success.
- Retry exponential backoff with jitter; after threshold route to DLQ and alert.
- Upsert Salesforce records by unique External ID.
- Include aggregate version/event timestamp; reject stale updates.
- Consumer must be idempotent.
- Provide replay and reconciliation command/runbook.
- Salesforce outage must not roll back successful commerce transactions.

Events: `CustomerUpdated`, `OrderPlaced`, `OrderStatusChanged`, `PaymentConfirmed`, `OrderCancelled`, `RefundRequested`, `RefundCompleted`, `FeedbackSubmitted`, `CaseReferenceUpdated`.

## 10. Provider adapters
- `PaymentProvider`: createIntent, retrievePayment, createRefund, retrieveRefund, verifyWebhook, mapProviderStatus.
- `PosAdapter`: publishOrder, retrieveStatus, healthCheck. v1 mock only.
- `DeliveryProvider`: createDelivery, assign, retrieve, cancel, verifyWebhook. v1 mock only.
- Notification provider adapter: sendEmail/sendSms/sendWhatsApp (provider TBD).
- Adapters must expose provider-neutral domain results and preserve provider references for audit.

## 11. Deployment topology
Initial deployment:
- Next.js storefront/admin/kitchen apps (can be a single app with role-protected routes initially).
- NestJS API as one service.
- Managed PostgreSQL.
- Optional Redis only after requirement.
- Background worker can run as a separate process from same codebase.
- Salesforce org and Copado pipeline separate from application deployment.
- Secrets stored in hosting provider secret manager.
- Environments: local, dev, SIT, QA, UAT, production. If budget permits fewer physical environments, preserve config separation and release gates.

## 12. Observability and operations
- Correlation ID generated at edge/API and propagated to outbox, provider metadata and Salesforce integration log.
- Structured logs with event name, actor type, resource ID, result, duration and correlation ID.
- Metrics: API latency/error, payment conversion, webhook age/failures, outbox backlog, DLQ count, stuck orders, kitchen acceptance time, refund pending age, agent action error/loop/cost.
- Alerts: payment webhook signature failure spike, paid-but-unaccepted order threshold, outbox backlog, failed reconciliation, refund stuck, database saturation.
- Dashboards for customer journey and operations.
- Runbooks for provider outage, Salesforce outage, stuck payment, late webhook, failed refund, kitchen rejection, delivery failure and restore.

## 13. Resilience and recovery
- Database automated backups and point-in-time recovery where available.
- Restore drill before production.
- Define RPO/RTO with business owner; do not invent targets.
- Use expand/contract schema migrations.
- Queue/outbox replay must not duplicate money movement.
- Circuit-break external providers and degrade gracefully.
