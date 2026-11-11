# 02 — Solution Architecture

## Logical topology
```text
Customer / Staff Browser
        |
        v
Next.js Web (storefront, account, admin, kitchen, chat UI)
        |
        | HTTPS, typed REST client
        v
NestJS API (modular monolith)
  | Auth / Customer / Outlet / Catalog / Inventory
  | Cart / Pricing / Checkout / Orders
  | Payments / Refunds / Kitchen / Delivery
  | Notifications / Support / Agent Gateway / Salesforce
        |
        +------ PostgreSQL (system of record)
        |
        +------ Outbox + workers + queue
                    |-- Stripe adapter
                    |-- POS/KDS adapter
                    |-- Delivery adapter
                    |-- Notification adapters
                    |-- Salesforce adapter
                    |-- Agentforce action gateway
```

## System ownership
| Data | Authoritative owner | Other systems |
|---|---|---|
| Menu, stock, cart, quote, order, kitchen, delivery | NestJS/PostgreSQL | Salesforce gets selected summary; Agentforce reads via actions |
| Payment/refund provider outcome | Provider + verified backend projection | Salesforce gets reference/status summary |
| Customer service Case | Salesforce | Backend stores support request and Salesforce reference |
| Conversation | Channel/Agentforce platform | Backend stores secure session mapping and action audit |
| Staff permissions | Application identity/RBAC plus Salesforce permissions for CRM UI | Must be mapped explicitly |

## Backend module boundaries
- IdentityModule: authentication/session and customer identity.
- OutletModule: outlets, hours, holidays, service areas and capacity.
- CatalogModule: categories, menu items, variants, modifiers, allergen facts.
- InventoryModule: stock, reservations, movements and recipe mapping.
- CartModule: cart aggregate.
- PricingModule: quote, tax/fee/discount calculations.
- CheckoutModule: orchestration of quote validation, reservation and order creation.
- OrdersModule: order aggregate and transition service.
- PaymentsModule: payment attempts, provider adapter, webhooks and reconciliation.
- RefundsModule: eligibility, approval, provider submission and status.
- KitchenModule: ticket lifecycle and KDS.
- DeliveryModule: assignment and fulfilment.
- NotificationsModule: channel adapters and event-driven delivery.
- SupportModule: support request lifecycle.
- SalesforceModule: CRM projection sync.
- AgentGatewayModule: restricted agent actions.
- AuditModule and ReportingModule.

## Transaction and integration patterns
- Use a transaction to create the order/payment attempt/reservation and outbox command as one durable unit where business invariants require it.
- Do not call Stripe/Salesforce/POS while holding a database transaction open.
- Use transactional outbox for outbound events and inbox/deduplication for inbound webhooks/events.
- Workers use retry with exponential backoff and jitter, maximum attempts, dead-letter handling and replay tooling.
- External IDs are unique and upserted; sync workers must not create duplicates.
- Use correlation IDs across browser/API/database/provider/webhook/Salesforce.

## Deployment topology
- Separate web, API, database and worker processes.
- Use managed PostgreSQL with backups and PITR where available.
- Use managed secret storage and restricted service identities.
- Use CDN/image storage for menu assets.
- Redis/queue service is optional until scale or worker architecture requires it; do not use Redis as the only durable event store.
