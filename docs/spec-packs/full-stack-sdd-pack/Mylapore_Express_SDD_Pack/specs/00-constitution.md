# 00 — Project Constitution

## Mission
Build a reliable, multi-outlet-ready restaurant commerce platform for Mylapore Express. The system must support real customer ordering and restaurant operations, with Salesforce Service Cloud and Agentforce enhancing service rather than becoming a dependency for core commerce.

## Architectural principles
1. **Commerce system of record:** NestJS + PostgreSQL own customers' commerce sessions, carts, quotes, orders, inventory reservations, payment projections, refunds, kitchen and delivery workflows.
2. **Payment authority:** Stripe (or another configured provider) owns provider-side payment and refund execution facts. The backend verifies and reconciles them.
3. **CRM/service authority:** Salesforce owns CRM relationship and service-case operations. Salesforce stores linked order/payment summaries, not a competing complete order ledger.
4. **AI is not a system of record:** Agentforce can understand intent and request allowed actions. It cannot invent prices, stock, payment status, order status, eligibility or refund completion.
5. **Backend authorization:** Every protected operation is authorized by NestJS from verified identity and permissions. Never trust a customer ID, role, outlet permission, price or order status supplied by the browser or language model.
6. **Resilience:** Checkout and order processing must not require Salesforce or Agentforce to be online.
7. **Idempotency:** Retried client commands, provider calls, webhooks and integration events must not create duplicate business effects.
8. **Auditability:** Important state transitions, stock adjustments, refund approvals and administrative changes must record actor, reason, timestamp and correlation ID.
9. **Explicit state machines:** Order, payment, refund, inventory reservation, kitchen and delivery lifecycles are separate.
10. **Secure-by-default:** Least privilege, secret management, input validation, rate limiting, PII minimization and safe logging are mandatory.

## Technology baseline
- Next.js App Router + TypeScript.
- NestJS + TypeScript.
- PostgreSQL + Prisma.
- Redis only where required for distributed cache, throttling, ephemeral coordination or queue infrastructure; PostgreSQL remains durable source of truth.
- Stripe adapter, sandbox first.
- Salesforce integration through server-side API credentials and asynchronous outbox.
- Agentforce actions through a restricted gateway with signed identity context.
- GitHub CI/CD for app and DB; Copado for supported Salesforce metadata.

## Mandatory engineering standards
- TypeScript strict mode.
- DTO/schema validation at every API boundary.
- OpenAPI contract kept in version control.
- Database migrations committed and reviewed.
- Unit, integration, contract and E2E tests.
- No secrets in source control or browser bundles.
- No floating-point arithmetic for money.
- No synchronous Salesforce network calls in checkout transactions.
- No provider refund call inside a database transaction.
- No direct Prisma writes from controllers or Agentforce tools.
- All provider adapters have sandbox/mock implementations and contract tests.

## Architecture decision records required
Create an ADR before implementation for:
- Salesforce Person Accounts vs Business Accounts + Contacts.
- Authentication provider and OTP/SMS/email provider.
- Stripe India merchant capability and enabled payment methods.
- POS/KDS vendor or internal KDS first.
- Delivery model/provider.
- Guest checkout verification and guest-to-account merge rules.
- COD enablement.
- Tax/invoice configuration.
- Hosting, database hosting, queue and secret manager.
- Human handoff channel and session continuity.

## Change control
A requirement may be changed only by updating the relevant spec, acceptance tests, API/schema contract and traceability matrix in the same change. Implementation must not silently diverge from a spec. Record unresolved requirements as TBD, with owner and decision date.
