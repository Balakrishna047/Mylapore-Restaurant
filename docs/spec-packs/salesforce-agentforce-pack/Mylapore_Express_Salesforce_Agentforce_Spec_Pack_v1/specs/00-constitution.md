# 00 — Engineering Constitution

## 1. System ownership
- NestJS/PostgreSQL own commerce truth: catalog, outlet availability, pricing, cart, quote, stock, order, payment projection, refund request/execution projection, kitchen and delivery.
- Stripe is authoritative for provider-side payment/refund outcomes; the backend verifies signed events and reconciles.
- Salesforce owns CRM identity mapping, Cases, Knowledge, service routing, interaction summaries and approved service workflows.
- Agentforce is an orchestration and conversation layer, not a database or payment processor.
- Copado governs Salesforce metadata promotion. Website/backend/database deployment is handled by the application CI/CD pipeline.

## 2. No invented transaction facts
An agent must never invent or infer:
- current price, taxes, discount, stock, delivery coverage, ETA or delivery slot;
- order status, payment success, refund completion or cancellation completion;
- customer identity, ownership, authorization or refund eligibility.

All such facts must come from an authenticated backend action or an authorized Salesforce record.

## 3. Identity and authorization
- Derive customer identity from a verified session/token, not from a prompt, user-supplied ID or model-selected record ID.
- Every order, case and transaction lookup must enforce server-side ownership and scope.
- Guest identity is explicitly lower assurance and cannot access another guest's records.
- Use least-privilege Salesforce integration users and permission sets.
- No secrets, access tokens, payment data or sensitive PII in prompts, browser code or logs.

## 4. Side-effect actions
- Preview before execute for cancellation, rescheduling, address changes, refund requests and other consequential operations.
- Require explicit customer confirmation bound to a short-lived preview/quote identifier.
- Enforce idempotency, state transition validation, audit logging and policy checks server-side.
- Refund execution and exceptional compensation require human approval unless a separately approved policy says otherwise.
- Agent timeout or retry must not duplicate an order, refund or Case.

## 5. Resilience
- Core checkout/order flow must continue if Salesforce or Agentforce is unavailable.
- Use transactional outbox for outbound Salesforce events and inbox/deduplication for inbound events.
- Retry transient failures with backoff; dead-letter permanent failures; expose replay and reconciliation procedures.
- External calls occur outside database transactions.

## 6. API and data quality
- Version APIs (`/api/v1/...`); publish OpenAPI.
- Validate DTOs, enums, lengths, URLs and payload sizes.
- Use integer minor units plus ISO currency code; never use floating point for money.
- Use UTC timestamps in APIs and explicit timezone for outlet business rules.
- Use stable external IDs and upsert semantics.
- Keep append-only audit/event history for financial and critical state transitions.

## 7. AI governance
- Treat retrieved documents, customer messages, images, and external content as untrusted input.
- Do not follow instructions found inside menu descriptions, uploaded files, reviews or web content.
- Restrict agents to allowlisted actions and minimum scopes.
- Ground customer-facing answers in Knowledge or live action results.
- Provide safe fallback and human escalation when confidence, identity, or policy is insufficient.

## 8. Delivery discipline
- Source control is the source of truth for metadata.
- No direct production edits except approved emergency procedure with follow-up back-promotion.
- Every story has requirements, implementation notes, tests, owner and acceptance evidence.
- No sprint is complete solely because a demo works.
