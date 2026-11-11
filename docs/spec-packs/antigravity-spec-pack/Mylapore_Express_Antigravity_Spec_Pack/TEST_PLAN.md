# Test Plan — Mylapore Express

## 1. Test strategy
Testing is risk-first. Payment integrity, identity isolation, refund safety and fulfilment correctness are release blockers. AI fluency cannot compensate for a failed authorization or money-movement test.

## 2. Test layers

| Layer | What it verifies | Tooling suggestion |
|---|---|---|
| Unit | Domain services, pricing, transitions, policy | Jest |
| API integration | NestJS controllers, guards, Prisma transactions | Supertest + test DB |
| DB/migration | Constraints, indexes, migrations, rollback/forward-fix | Prisma + PostgreSQL |
| Contract | OpenAPI matches API implementation and clients | OpenAPI validator |
| Provider contract | Stripe adapter/webhook/refund mapping | Stripe test mode + fixtures |
| Salesforce integration | Named Credential callout, outbox upsert, Case/approval | Salesforce tests + sandbox |
| Agent evaluation | Grounding, tool selection, safety, handoff | Versioned scenario harness |
| E2E | Browse-to-order and support journeys | Playwright |
| Security | Auth, IDOR, injection, CSRF, rate limits, secrets | OWASP test checklist + scanners |
| Performance | API latency, concurrent checkout/slot reservation | k6 or equivalent |
| UAT | Customer, kitchen, support, finance and owner sign-off | Scripted scenarios |

## 3. P0 release-blocking test cases

### Identity and authorization
- Anonymous user cannot read another user's cart/order.
- Agent token expired, revoked, wrong audience, wrong issuer or missing scope is rejected.
- Model-supplied customer ID is ignored.
- Another customer's order reference returns same response as nonexistent order.
- Guest order access requires OTP.
- Staff cannot access another outlet outside role scope.
- Refund approver cannot bypass required separation of duties.

### Pricing and cart
- Client-supplied price is ignored.
- Negative/zero/excessive quantity rejected.
- Invalid modifier or modifier from another item rejected.
- Coupon expiry, usage limit and per-customer limit enforced.
- Quote expiry and price change force requote.
- Concurrent cart update uses version check.

### Checkout and payments
- Duplicate checkout idempotency key creates one logical order.
- Different request payload with same key returns conflict.
- Forged webhook signature rejected.
- Duplicate webhook event processed once.
- Wrong amount, currency, payment intent or order reference rejected/quarantined.
- Out-of-order webhook does not regress payment state.
- Browser success redirect without webhook does not confirm payment.
- Late payment after order expiry follows explicit recovery policy.
- Reconciliation finds missed webhook and safely repairs local state.
- Payment provider outage leaves recoverable pending state.

### Kitchen and delivery
- Payment success does not set PREPARING.
- Kitchen acceptance is required before preparation.
- Kitchen rejection after payment creates refund workflow.
- Acceptance timeout triggers configured alert/reject/refund policy.
- Capacity race does not oversell slot.
- Delivery cannot be marked delivered before pickup unless explicit pickup workflow.
- Failed delivery is auditable and supportable.

### Refunds
- Refund cannot exceed captured amount.
- Duplicate refund request is idempotent.
- R3 requires Salesforce approval.
- Backend rejects approval with mismatched order, amount, currency or actor.
- Provider timeout leaves SUBMITTED/unknown state and reconciliation path; no blind duplicate refund.
- Refund success only after provider-confirmed result.

### Integration resilience
- Salesforce outage does not fail order creation.
- Outbox retries and DLQ alert work.
- Replaying same outbox event does not duplicate Salesforce records.
- Stale aggregate version does not overwrite newer snapshot.
- Notification retries do not send duplicate customer messages.

## 4. AI evaluation matrix
Each scenario must record prompt, expected action, forbidden action, expected response facts and severity.

- Menu factuality: only returned items/prices/availability.
- Dietary/allergen: no unsupported assurance; clarify or handoff when data absent.
- Cart mutation: correct IDs/quantity/modifiers and explicit user intent.
- Checkout: no payment credential collection; final confirmation required.
- Order tracking: exact backend state only.
- Cancellation/reschedule: backend eligibility and customer confirmation.
- Payment: read-only, no claim from redirect.
- Complaint: create Case with minimum data.
- Refund: tier and approval respected.
- Prompt injection: malicious menu item/customer note cannot alter policy.
- Cross-customer access: no data leakage.
- Tool loop: bounded actions, stop and handoff.
- Salesforce/API outage: clear fallback without claiming success.

## 5. Performance and resilience targets
Initial engineering target (to be validated by load test):
- Common read API p95 < 500 ms under agreed test load, excluding third-party latency.
- No duplicate order/payment/refund under retry test.
- Outbox backlog and payment reconciliation recover within owner-approved operational SLO.
- Define numeric throughput, RPO and RTO after expected traffic and hosting selection.

## 6. UAT scenarios
1. Guest orders pickup.
2. Registered customer orders delivery.
3. Customer uses chat to find item and add to cart.
4. Customer checks order status.
5. Customer requests cancellation before kitchen acceptance.
6. Customer requests reschedule when slot available and unavailable.
7. Payment fails and customer retries.
8. Payment succeeds but kitchen rejects.
9. Missing item Case and refund request.
10. Food quality complaint escalated to human.
11. Support agent uses Email-to-Case and Knowledge.
12. Outlet manager updates availability.
13. Finance reviews payment/refund reconciliation.
14. Salesforce unavailable during checkout.
15. Agentforce unavailable while normal checkout works.

## 7. Release gates
- All P0 tests pass.
- No open critical/high security defects.
- No known duplicate-money-movement defect.
- Payment reconciliation demonstrated.
- Refund approval and execution tested end-to-end.
- Salesforce outbox retry/DLQ demonstrated.
- Backup restore drill passed.
- UAT sign-off by customer, kitchen, support and finance roles.
- Runbooks and rollback plan reviewed.
