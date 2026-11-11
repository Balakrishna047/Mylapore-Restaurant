# Implementation Roadmap

## Phase 0 — Audit and decisions
Deliver:
- Repository and existing code audit.
- Current DB schema/migration audit.
- Salesforce org/licence/capability audit.
- Stripe merchant and sandbox capability verification.
- ADRs for account model, auth, POS, delivery, payment methods, COD, tax/invoice and chat handoff.
Exit: all P0 unknowns have an owner and testable resolution plan.

## Phase 1 — Foundation
Deliver:
- Monorepo/workspace, lint, TypeScript strict, CI.
- Next.js shell and design system.
- NestJS health/auth/outlet modules.
- PostgreSQL/Prisma migrations and seed.
- OpenAPI baseline and generated client.
Exit: local and DEV environments build repeatably.

## Phase 2 — Menu and cart vertical slice
Deliver:
- Outlet selection, menu categories/items, item detail and modifiers.
- Admin menu publishing.
- Cart CRUD and server-side pricing quote.
- Availability and allergen data contract.
Exit: customer can select outlet, browse, customize and quote cart; tests pass.

## Phase 3 — Checkout and payments
Deliver:
- Address/serviceability and fulfilment selection.
- Quote expiry and stock reservation.
- Pending order and payment attempt.
- Stripe sandbox adapter, webhook inbox, reconciliation and idempotency.
Exit: all payment acceptance scenarios pass; no duplicate charge/order.

## Phase 4 — Kitchen and fulfilment
Deliver:
- KDS/internal kitchen interface and acceptance timer.
- Pickup workflow; delivery adapter/manual task flow.
- Notification outbox and staff RBAC.
Exit: paid order can be accepted, prepared, handed over and completed; exceptions tested.

## Phase 5 — Salesforce Service Cloud
Deliver:
- Account model decision, Contact/Case/Knowledge configuration.
- Custom order/payment/refund summary objects only where justified.
- Integration user, external IDs, outbox sync, retry/replay.
Exit: support request creates one Case; Salesforce outage recovery proven.

## Phase 6 — Agentforce
Deliver:
- Signed chat session gateway.
- Read-only menu/order actions.
- Cart actions with preview/confirmation.
- Service request and human escalation.
- Evaluation suite and audit.
Exit: identity isolation and agent safety tests pass in target org/channel.

## Phase 7 — Hardening and release
Deliver:
- Security, performance, accessibility and failure-injection.
- Finance reconciliation.
- Backup restore and runbooks.
- Copado Salesforce promotion and app release pipeline.
- UAT and production readiness review.
Exit: signed readiness checklist and rollback plan.

## Build cadence
For each feature: read spec → write/confirm acceptance tests → implement vertical slice → run tests → review diff → update docs/traceability → commit. Do not move to next phase while P0 acceptance tests fail.
