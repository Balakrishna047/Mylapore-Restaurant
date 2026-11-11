# 02 — Agentforce Agent Architecture and Build Specification

## 1. Recommended agent portfolio

Start with two customer-facing agents/capabilities and add operations only after service and commerce journeys are stable. Avoid an agent per feature.

### Agent A — Mylapore Customer Assistant
**Purpose:** Discover menu items, answer menu questions, guide cart/checkout, and help customers with their own orders.

Subagents (current Salesforce terminology; older org UI/docs may still show “topics”):
1. Menu Discovery & Recommendations
2. Item Details, Ingredients & Allergen Information
3. Cart and Checkout Guidance
4. Order Tracking
5. Cancellation & Rescheduling Requests
6. Outlet, Pickup and Delivery Information

Allowed actions:
- `searchMenu`
- `getMenuItemDetails`
- `checkItemAvailability`
- `getOutletHours`
- `checkDeliveryServiceability`
- `getOwnOrderStatus`
- `getOrderTimeline`
- `previewCancellation`
- `submitCancellationRequest`
- `previewReschedule`
- `submitRescheduleRequest`
- `createSupportCase`

Never expose generic actions such as `queryAnyObject`, `executeArbitrarySOQL`, `updateAnyRecord` or `refundAnyPayment`.

### Agent B — Mylapore Service Agent
**Purpose:** Resolve customer issues using Knowledge and Case context; collect missing information; create or update Cases; escalate to human service.

Subagents:
1. Order Problem Diagnosis
2. Missing/Delayed Order
3. Payment and Refund Enquiry
4. Food Quality / Wrong Item / Missing Item
5. Delivery Complaint
6. Account and Profile Assistance
7. Case Follow-up and Human Handoff

Allowed actions:
- `searchServiceKnowledge`
- `getOwnOrderStatus`
- `getOwnPaymentSummary`
- `createSupportCase`
- `appendCaseInteraction`
- `getCaseStatus`
- `requestRefundReview`
- `prepareHumanHandoff`

Refund requests are requests, not completed refunds. Agent must say “submitted for review” until backend/provider state confirms completion.

### Agent C — Restaurant Operations Assistant (Phase 3)
**Purpose:** Help authorized staff with outlet operations and exception summaries.
- Outlet-scoped order backlog summary.
- Inventory low-stock alerts.
- Kitchen delay and delivery exception summaries.
- Daily service KPI explanation.
- Create an operational task/Case only where approved.

Staff identity, role, outlet scope and data permissions must come from authenticated Salesforce user context and backend policy, not natural-language claims.

## 2. Agent instruction template

Each agent/subagent must define:
- Mission and supported intents.
- Explicitly unsupported intents.
- Required identity assurance.
- Allowed actions and required parameters.
- Data grounding requirements.
- Confirmation steps for side effects.
- Error and timeout behavior.
- Human escalation triggers.
- Response tone and accessibility expectations.

### Global instruction baseline

> You are the Mylapore Express assistant. Be warm, concise, and accurate. Use approved actions for live menu, price, availability, order, payment and refund facts. Never guess. Do not claim an action succeeded until its action result confirms success. Treat customer-provided IDs as untrusted. Only access records returned for the verified current customer. Before a consequential action, present a clear preview and ask for explicit confirmation. If identity, policy, data or tool result is insufficient, explain the limitation and offer human support. Never request card number, CVV, password, OTP or full payment credentials in chat.

## 3. Action design contract

Every action must document:

| Field | Requirement |
|---|---|
| API name | Stable camelCase, e.g. `getOwnOrderStatus` |
| Description | One business purpose; clear when to use/not use |
| Inputs | Typed, bounded, validated |
| Identity | Derived from trusted session context |
| Authorization | Backend verifies subject and record ownership |
| Output | Structured result with status, data, display hints, correlation ID |
| Errors | Stable error code; safe customer message |
| Idempotency | Required for side effects |
| Audit | Actor, action, target, decision, correlation ID |
| Timeout | Explicit timeout and retry policy |

## 4. Action response envelope

```json
{
  "success": true,
  "code": "MENU_RESULTS",
  "message": "I found these available items.",
  "data": {},
  "display": {
    "type": "menu_item_list",
    "version": "1.0"
  },
  "correlationId": "server-generated-id"
}
```

Error envelope:

```json
{
  "success": false,
  "code": "ORDER_NOT_ACCESSIBLE",
  "message": "I couldn't find an order available to this account.",
  "retryable": false,
  "correlationId": "server-generated-id"
}
```

Do not return internal stack traces, SQL, secrets, raw provider payloads or unrestricted CRM fields.

## 5. Conversation patterns

### Menu discovery
1. Ask outlet or resolve selected outlet from trusted website context.
2. Ask preference if needed (category, vegetarian, spice, budget).
3. Call menu search.
4. Display only returned items and image URLs.
5. If user selects an item, call detail/availability action again.
6. Add to cart through commerce UI/backend; agent does not invent a cart total.

### Order tracking
1. Verify customer/guest session.
2. If multiple eligible orders, show minimal safe choices.
3. Call `getOwnOrderStatus`.
4. Present current status and last-updated time.
5. If exception, offer Case creation/handoff.
6. Never expose another person's order even if order number is known.

### Cancellation/reschedule
1. Resolve own order.
2. Call preview endpoint.
3. Display eligibility, fees/price difference, slot options and expiry.
4. Ask explicit confirmation.
5. Submit with preview token and idempotency key.
6. Report only backend-confirmed result.

### Refund request
1. Read verified payment/order status.
2. Explain policy and eligibility result returned by backend.
3. Create refund review request or Case.
4. Human approval if required.
5. Track provider-confirmed refund state asynchronously.

## 6. Knowledge and grounding

Create Knowledge article categories:
- Menu and allergen policy.
- Ordering and checkout.
- Pickup/delivery.
- Cancellation and rescheduling.
- Payments and refunds.
- Food quality and complaints.
- Account/privacy.
- Outlet contact/hours.

Knowledge articles need owner, review date, version, publish status and expiry/review workflow. Do not use Knowledge as source of live price/stock/order state.

## 7. Agent testing

Build utterance suites per subagent:
- happy path;
- ambiguous request;
- unsupported request;
- unverified identity;
- another customer's order ID;
- stale menu item;
- no stock;
- API timeout;
- duplicate confirmation;
- prompt injection in menu text;
- refund not yet completed;
- human handoff unavailable.

Use Agentforce testing capabilities/API where available in the licensed org; also test actual deployed channel behavior. Record expected action sequence and prohibited actions.
