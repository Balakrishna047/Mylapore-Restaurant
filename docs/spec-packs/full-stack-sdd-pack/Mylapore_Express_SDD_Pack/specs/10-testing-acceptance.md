# 10 — Testing Strategy and Acceptance Criteria

## Test layers
1. Unit: pricing, promotions, tax, state transitions, eligibility, inventory reservation.
2. Integration: PostgreSQL transactions, outbox/inbox, Stripe adapter, Salesforce adapter.
3. Contract: OpenAPI, provider adapters, Agentforce action schemas.
4. E2E: customer journeys from outlet selection to order completion and support.
5. Security: BOLA/IDOR, role scope, webhook spoof/replay, rate limits, prompt injection.
6. Resilience: provider timeout, Salesforce outage, POS outage, duplicate event, queue backlog.
7. Performance: browse/menu, quote, checkout and status reads under expected load.
8. Accessibility: keyboard, focus, labels, contrast and screen-reader review.
9. UAT: customer, manager, kitchen, delivery, support and finance scenarios.

## Mandatory acceptance scenarios
- A guest can browse and add items to a guest cart.
- A registered customer can sign in and access only their own orders.
- A customer cannot retrieve another customer's order by guessing UUID/order number.
- Two concurrent checkouts cannot oversell the last unit.
- A stale quote cannot be silently charged.
- Repeated checkout request with same idempotency key creates one order/payment attempt.
- Duplicate Stripe webhook creates no duplicate state transition.
- Invalid webhook signature is rejected.
- Payment timeout followed by provider success reconciles to one paid order.
- Payment success after reservation expiry follows configured re-reserve/refund policy.
- Kitchen rejection after payment triggers defined customer/refund workflow.
- POS outage does not lose paid order.
- Refund request is not displayed as completed until provider confirms.
- Salesforce outage does not block checkout; sync catches up later.
- Duplicate support request does not create duplicate Salesforce Case.
- Agentforce cannot access another customer's order.
- Agentforce cannot invent menu price, stock, allergen, ETA or refund completion.
- Human handoff preserves context and verified identity level.
- Notification provider outage does not roll back order.
- Database restore test completes within approved RTO/RPO.

## Definition of done for every feature
- Spec and acceptance criteria updated.
- UI states and accessibility covered.
- API contract and DTO validation implemented.
- Database migration and constraints reviewed.
- AuthZ and audit implemented.
- Failure/retry/timeout behavior tested.
- Unit/integration/E2E tests pass.
- Metrics/logs/alerts/runbook updated.
- Deployment configuration and rollback strategy documented.
