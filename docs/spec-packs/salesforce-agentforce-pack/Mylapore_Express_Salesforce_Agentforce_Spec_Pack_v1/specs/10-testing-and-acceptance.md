# 10 — Testing Strategy and Acceptance Criteria

## 1. Test pyramid

- Apex unit tests: service classes, invocable actions, selector/security logic.
- LWC Jest: card rendering, empty/error/loading states, events and accessibility basics.
- Flow tests: deterministic routing and Case lifecycle.
- API contract tests: request/response schemas and error codes.
- Integration tests: Salesforce ↔ NestJS ↔ Stripe projections.
- Agent tests: intent, action selection, grounding, guardrails and refusal.
- Channel E2E: actual website chat, image cards, authentication, mobile and handoff.
- UAT: service agents and restaurant stakeholders.

## 2. Critical test scenarios

### Identity/security
- Guest cannot view authenticated customer's order.
- Authenticated user cannot view another customer's order.
- Customer-supplied Contact ID is ignored.
- Expired/revoked token is rejected.
- Staff cannot access an unassigned outlet.
- Agent cannot invoke arbitrary object query/update.

### Menu and rich UI
- Available item renders correct image, alt text, name and price.
- Broken image shows fallback.
- Invalid/unapproved image host is rejected.
- Stale menu version triggers refresh.
- Out-of-stock item cannot be added.
- Allergen information is displayed only when verified; unknown data is clearly marked.

### Order/payment/refund
- Browser return URL does not mark payment paid.
- Duplicate webhook is idempotent.
- Delayed payment event reconciles correctly.
- Refund request is not described as refund completed.
- Cancellation preview expires and cannot be replayed.
- Concurrent cancellation/reschedule produces one valid state transition.

### Service
- Case is created once despite action retry.
- Case includes order reference and identity assurance.
- Handoff carries summary and attempted actions.
- Queue unavailable produces fallback.
- Knowledge answer cites/links approved article where supported.
- P1 issue follows escalation policy.

### Agent quality
- Agent asks clarifying question for ambiguous outlet/item.
- Agent refuses to invent ETA.
- Prompt injection in menu text does not change policy.
- Agent does not expose internal IDs/secrets.
- Agent gracefully handles API timeout.
- Agent offers human handoff on repeated failure.

## 3. Acceptance criteria for initial release

1. Customer opens chat from website.
2. Session identity is established or guest mode is explicit.
3. Agent searches menu through live backend.
4. Menu card displays real image URL, alt text, name, price and availability.
5. Card action opens item detail or routes to website item page.
6. Agent does not calculate or invent final checkout total.
7. Authenticated customer can view own order status.
8. Unauthorized order lookup is denied without leaking existence.
9. Customer can create a Case with order reference.
10. Service agent sees summary and relevant context.
11. Salesforce outage does not block order checkout.
12. Copado pipeline promotes tested metadata to QA with recorded evidence.

## 4. Test data
Use synthetic customer identities, orders, payments and menu data. Never copy live payment credentials or unnecessary production PII into DEV/QA. Create test cases for each outlet and timezone.

## 5. Evidence format
For each story retain:
- requirement/story ID;
- commit hash;
- org/environment;
- test run ID;
- Apex/LWC/Flow/agent results;
- screenshots or recording for UI;
- security checks;
- defect links;
- approver and date.
