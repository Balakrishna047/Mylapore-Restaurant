# Sprint Plan — 16-Week Delivery

**Cadence:** 8 two-week sprints plus a short Sprint 0 discovery/setup.  
**Team assumption:** 1 product owner/restaurant SME, 1 tech lead, 1–2 full-stack engineers, 1 backend engineer, 1 Salesforce/Agentforce developer, QA support (roles may be combined for a portfolio build). This is a planning model, not a guaranteed duration.  
**Capacity rule:** do not commit every available hour; reserve 15–20% for defects, integration uncertainty and learning.

## Sprint 0 — Discovery, audit and foundations (3–5 working days)
**Goal:** establish the real baseline before generating or changing code.

Stories/tasks:
- S0-01 Inspect repository, branches, manifests, lockfiles, existing app, tests and deployment files.
- S0-02 Inspect current Prisma/database state and migration history.
- S0-03 Inspect Salesforce org, API version, licences, Agentforce agent type, Service Cloud features, Named Credentials and Copado metadata support.
- S0-04 Verify Stripe account readiness, test mode, webhook capability, supported methods and settlement assumptions for India.
- S0-05 Confirm business policies: outlet, menu owner, tax/GST review, fulfilment, refunds, cancellation and kitchen SLA.
- S0-06 Create ADR/decision log, environment matrix, risk register and baseline CI.

Deliverables:
- Repository audit report.
- Salesforce capability matrix.
- Payment-provider verification report.
- Prioritized backlog and dependency map.
- CI skeleton and local setup guide.

Exit criteria:
- No unknown existing application structure.
- Blockers and assumptions recorded.
- No secrets committed.
- P0 architecture and provider decisions confirmed or explicitly blocked.

## Sprint 1 — Storefront and catalog foundation
**Goal:** a customer can browse accurate outlet-specific menu data.

Stories:
- S1-01 App shell, routing, responsive design system and accessibility baseline.
- S1-02 Outlet selection and opening-hours display.
- S1-03 Menu category and item APIs.
- S1-04 Catalog schema, seed data and admin CRUD foundation.
- S1-05 Search/filter and item detail page.
- S1-06 Dietary/allergen/ingredient display and data-quality flags.

Acceptance:
- Menu data originates from PostgreSQL.
- Outlet-specific price and availability are returned.
- Unavailable products cannot be treated as available.
- Mobile and desktop smoke tests pass.
- No AI-generated menu facts.

## Sprint 2 — Cart, pricing, promotion and quote
**Goal:** customer can create a cart and receive a server-authoritative quote.

Stories:
- S2-01 Guest/customer cart ownership and session persistence.
- S2-02 Add/update/remove cart line and modifiers.
- S2-03 Pricing service for subtotal, tax/fee configuration and discount.
- S2-04 Coupon validation, limits and redemption reservation.
- S2-05 Quote creation, expiry, version and itemized breakdown.
- S2-06 Idempotency and concurrency controls.
- S2-07 Cart UI and quote review.

Acceptance:
- Client cannot alter price.
- Quote expiry/stale catalog forces refresh.
- Duplicate mutation is safe.
- Unit/integration tests cover price and coupon edge cases.

## Sprint 3 — Checkout, payments and order lifecycle
**Goal:** customer can place an order and receive payment-confirmed status safely.

Stories:
- S3-01 Delivery/pickup checkout and address capture.
- S3-02 Service-zone, outlet hours, slot capacity and fulfilment validation.
- S3-03 Order and order-line snapshot schema.
- S3-04 PaymentProvider interface and Stripe adapter.
- S3-05 Payment intent creation and idempotency.
- S3-06 Raw-body webhook verification, inbox dedupe and reconciliation.
- S3-07 Four state machines and audit event history.
- S3-08 Order history/detail/tracking UI.
- S3-09 Cancellation/reschedule eligibility service.

Acceptance:
- No browser-only payment confirmation.
- Forged/duplicate/wrong-amount webhook tests pass.
- Duplicate checkout cannot create duplicate order.
- Order/payment/refund/delivery states remain separate.

## Sprint 4 — Kitchen, delivery and operational controls
**Goal:** paid/COD-eligible orders flow through kitchen and delivery operations.

Stories:
- S4-01 Kitchen queue and outlet-scoped access.
- S4-02 Accept/reject/start/ready transitions.
- S4-03 Acceptance timeout and paid rejection refund workflow.
- S4-04 DeliveryProvider interface and mock provider.
- S4-05 Assign/pickup/delivered/failed events.
- S4-06 Admin roles and outlet scope.
- S4-07 Notification adapter and deduplicated order notifications.
- S4-08 Stuck-order and delayed-fulfilment dashboard.

Acceptance:
- Payment success alone never sets PREPARING.
- Illegal transitions rejected.
- Mock delivery path completes end-to-end.
- Kitchen role cannot access finance/admin actions.

## Sprint 5 — Salesforce Service Cloud and integration foundation
**Goal:** CRM/support workflows and reliable backend synchronization work without coupling commerce to Salesforce uptime.

Stories:
- S5-01 Create Salesforce metadata baseline and permission sets.
- S5-02 Contact and five custom object fields/external IDs.
- S5-03 Case fields, categories, queues and console layouts.
- S5-04 Knowledge and Email-to-Case configuration.
- S5-05 Named Credential/External Credential and integration user.
- S5-06 PostgreSQL transactional outbox and worker.
- S5-07 Salesforce upsert by External ID and aggregate version.
- S5-08 Retry, DLQ, replay and reconciliation.
- S5-09 Case creation/reference synchronization.

Acceptance:
- Salesforce outage does not block checkout/order creation.
- Duplicate events do not duplicate CRM records.
- Stale snapshot cannot overwrite newer state.
- Integration permissions are least privilege.

## Sprint 6 — Customer Commerce Agentforce
**Goal:** customer can use chat for menu discovery, cart assistance and order status safely.

Stories:
- S6-01 Verify Agentforce API/session and context binding in target org.
- S6-02 Chat gateway and signed identity token.
- S6-03 Agent API guard and scope validation.
- S6-04 Configure Commerce Agent and concierge/menu/cart sub-capabilities.
- S6-05 Implement menu, cart, quote and order-status actions.
- S6-06 Add explicit confirmation and secure checkout handoff.
- S6-07 Add action budgets, safe fallback and telemetry.
- S6-08 Build AI evaluation suite for factuality, IDOR and prompt injection.

Acceptance:
- Identity is server-derived and model cannot override it.
- Cross-customer lookup fails generically.
- Agent cannot fabricate menu/price/status.
- Website checkout works with Agentforce disabled.

## Sprint 7 — Customer Service Agent, refund workflow and management insights
**Goal:** service cases and controlled refunds work end-to-end; initial internal insights are available.

Stories:
- S7-01 Service Agent FAQ/Knowledge grounding.
- S7-02 Complaint classification and Case creation.
- S7-03 Human handoff context contract and routing.
- S7-04 Refund tiers R1/R2/R3 and policy assessment endpoint.
- S7-05 Salesforce R3 approval Flow and callback.
- S7-06 Backend approval revalidation and provider refund.
- S7-07 Refund webhook/reconciliation and Case status update.
- S7-08 Basic owner dashboard and Management Agent read-only aggregate actions.

Acceptance:
- No prompt-only refund.
- R3 requires human approval.
- Backend revalidates amount/order/currency/approval.
- Customer receives confirmed refund status only after provider confirmation.

## Sprint 8 — Hardening, UAT, deployment and release
**Goal:** production-like release candidate with operational evidence.

Stories:
- S8-01 Full regression and E2E journeys.
- S8-02 Security testing: IDOR, JWT, CSRF, injection, rate limits, secrets.
- S8-03 Performance and concurrency testing.
- S8-04 Backup/restore drill and RPO/RTO proposal.
- S8-05 Sentry/logging/metrics/alerts and dashboards.
- S8-06 Runbooks: Stripe outage, Salesforce outage, late webhook, stuck order, refund, kitchen rejection, delivery failure.
- S8-07 GitHub Actions pipeline and environment promotion.
- S8-08 Copado validation/promotion and post-deploy smoke tests.
- S8-09 UAT sign-off and demo data reset.
- S8-10 Release notes, known limitations and rollback plan.

Acceptance:
- All P0 tests pass.
- No open critical/high defect.
- Reconciliation and restore demonstrated.
- UAT sign-off captured.
- App and Salesforce releases independently reproducible.

## Sprint ceremonies
- Planning: sprint goal, story acceptance, dependencies and capacity.
- Daily: progress, blockers, integration risks, test status.
- Refinement: keep next sprint stories ready with acceptance criteria.
- Review: demonstrate working vertical slice, not slides only.
- Retrospective: identify rework, AI-generated code defects and process changes.
- Release readiness: QA, security, product, finance and operations sign-off.

## Cross-sprint dependency gates
- No checkout build before authoritative pricing/quote contract.
- No live payment before Stripe capability and webhook verification.
- No Agentforce action build before identity/session proof-of-concept.
- No refund execution before tier policy and approval contract.
- No Salesforce sync dependency inside order transaction.
- No production release before reconciliation, backup/restore and human support are tested.

## Portfolio-size adjustment
If one developer is doing most work, keep the same dependency order but plan 20–28 calendar weeks or reduce scope. Do not compress security, payment verification or reconciliation to preserve an arbitrary date.
