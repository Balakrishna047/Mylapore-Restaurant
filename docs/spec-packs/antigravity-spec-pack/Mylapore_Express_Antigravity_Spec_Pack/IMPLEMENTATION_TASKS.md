# Implementation Backlog — Epics, Stories and Task Checklist

Priority: **P0** release-critical; **P1** important v1; **P2** post-v1.  
Story points are intentionally omitted until repository audit and team capacity are known.

## EPIC E00 — Discovery and delivery foundation (P0)
- E00-01 Repository audit: document current structure, versions, commands and uncommitted changes.
- E00-02 Salesforce org capability audit: Agentforce, Service Cloud, API, Named Credentials, Copado.
- E00-03 Payment provider readiness: Stripe India account, methods, webhook and refund capability.
- E00-04 Business policy workshop: tax, outlet, fulfilment, cancellation, refunds, kitchen and delivery.
- E00-05 Environment/configuration matrix and secrets inventory.
- E00-06 CI baseline and branch protection.

## EPIC E01 — Storefront and catalog (P0)
- E01-01 Next.js app shell, responsive navigation and design tokens.
- E01-02 Outlet selector, outlet hours and service availability.
- E01-03 Prisma catalog models and migration.
- E01-04 Category/item/menu read APIs and OpenAPI contract.
- E01-05 Search, filters and product detail.
- E01-06 Admin category/product CRUD with role guards.
- E01-07 Variant/modifier/combo support.
- E01-08 Dietary/allergen/ingredient metadata and content verification workflow.
- E01-09 Catalog seed data and deterministic test fixtures.

## EPIC E02 — Cart and pricing (P0)
- E02-01 Guest/customer cart model and ownership.
- E02-02 Cart line add/update/remove.
- E02-03 Modifier validation.
- E02-04 Pricing engine with integer minor units.
- E02-05 Tax/fee configuration boundary (rates are business/legal inputs, not hard-coded assumptions).
- E02-06 Promotion/coupon validation and redemption limits.
- E02-07 Quote creation, expiry, version and itemized response.
- E02-08 Cart/quote concurrency and idempotency.
- E02-09 Cart UI, totals and stale-quote recovery.

## EPIC E03 — Checkout and payment (P0)
- E03-01 Customer address and guest checkout flow.
- E03-02 Service-zone validation.
- E03-03 Slot capacity reservation.
- E03-04 Order and immutable order-line snapshots.
- E03-05 Idempotent checkout endpoint.
- E03-06 PaymentProvider interface.
- E03-07 Stripe adapter and test-mode integration.
- E03-08 Webhook raw-body signature verification.
- E03-09 Webhook inbox deduplication and out-of-order handling.
- E03-10 Payment/order transactional state update and outbox.
- E03-11 Payment reconciliation and late-event policy.
- E03-12 Order history, details and live status UI.
- E03-13 Cancellation/reschedule eligibility and confirmation.

## EPIC E04 — Kitchen, delivery and notifications (P0/P1)
- E04-01 Staff identity, role and outlet guards.
- E04-02 Kitchen ticket generation.
- E04-03 Kitchen accept/reject/preparing/ready workflow.
- E04-04 Acceptance timeout and rejection/refund orchestration.
- E04-05 DeliveryProvider interface and mock adapter.
- E04-06 Delivery assignment/pickup/delivered/failed workflow.
- E04-07 Notification adapter and event-driven notifications.
- E04-08 Notification dedupe/retry and failure visibility.
- E04-09 Operations dashboard and stuck-order alerts.

## EPIC E05 — Salesforce Service Cloud (P0)
- E05-01 Contact external customer ID and fields.
- E05-02 Restaurant_Order__c snapshot object.
- E05-03 Payment_Transaction__c snapshot object.
- E05-04 Refund_Request__c object.
- E05-05 Customer_Feedback__c object.
- E05-06 Agent_Interaction__c object.
- E05-07 Case fields, categories, record types and queues.
- E05-08 Knowledge approval/publishing lifecycle.
- E05-09 Email-to-Case and Service Console.
- E05-10 Permission sets and integration user.
- E05-11 Named Credential and callout tests.
- E05-12 Case creation and backend reference sync.

## EPIC E06 — Reliable integration (P0)
- E06-01 Outbox schema and transactional writer.
- E06-02 Worker claim/lease and retry with backoff.
- E06-03 Salesforce external-ID upsert.
- E06-04 Aggregate version/stale event protection.
- E06-05 Dead-letter queue and alert.
- E06-06 Replay/reconciliation CLI or admin operation.
- E06-07 Correlation ID propagation.
- E06-08 Integration dashboard and runbook.

## EPIC E07 — Customer Commerce Agentforce (P0)
- E07-01 Agentforce org/session/context POC.
- E07-02 Chat session and signed identity token.
- E07-03 Token validation/revocation/scope guard.
- E07-04 Menu search action.
- E07-05 Cart actions.
- E07-06 Quote/checkout handoff action.
- E07-07 Order status action.
- E07-08 Cancel/reschedule eligibility and confirm flow.
- E07-09 Agent instructions, fallback, action budget and loop detection.
- E07-10 AI evaluation dataset and automated checks.

## EPIC E08 — Customer Service and refund (P0)
- E08-01 Knowledge-grounded FAQ.
- E08-02 Complaint classification.
- E08-03 Case create/update and duplicate detection.
- E08-04 Human handoff payload and routing.
- E08-05 Refund policy assessment endpoint.
- E08-06 R1/R2/R3 rules and thresholds configuration.
- E08-07 Salesforce approval Flow for R3.
- E08-08 Backend approval callback validation.
- E08-09 Provider refund execution and reconciliation.
- E08-10 Customer/Case notification and audit.

## EPIC E09 — Management insights (P1)
- E09-01 KPI definitions and aggregation views.
- E09-02 Outlet performance dashboard.
- E09-03 Product/category performance.
- E09-04 Kitchen/delivery SLA reporting.
- E09-05 Read-only Management Agent actions with outlet filtering.

## EPIC E10 — Security, quality and release (P0)
- E10-01 Unit and integration test coverage for domain services.
- E10-02 E2E customer journeys.
- E10-03 IDOR/JWT/CSRF/rate-limit/security tests.
- E10-04 Prompt injection and AI tool misuse tests.
- E10-05 Payment/refund duplicate and reconciliation tests.
- E10-06 Load and concurrency tests.
- E10-07 Sentry/logging/metrics/alerts.
- E10-08 Backup/restore drill.
- E10-09 GitHub Actions app pipeline.
- E10-10 Copado Salesforce pipeline.
- E10-11 UAT and sign-off.
- E10-12 Release/rollback/runbooks.

## Story template
**ID / Title:**  
**User story:** As a [persona], I want [capability], so that [outcome].  
**Priority:** P0/P1/P2  
**Dependencies:**  
**Acceptance criteria:** Given/When/Then, including negative paths.  
**API/schema/metadata:**  
**Security and audit:**  
**Tests:** unit, integration, E2E, contract, AI evaluation as applicable.  
**Observability:** events, metrics and alerts.  
**Definition of Done:** see `AGENTS.md`.

## Dependency order
E00 → E01 → E02 → E03 → E04. E05 and E06 can start after contracts are stable. E07 requires E03 core actions and E00 Agentforce proof. E08 requires E05/E06 and refund policy. E09 requires reliable data. E10 runs continuously and gates release.
