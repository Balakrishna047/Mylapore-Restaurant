# 06 — APIs and Integration Contracts

## 1. API ownership

NestJS exposes the business APIs. Salesforce actions call a narrow Agent Gateway, which delegates to domain services. Salesforce REST APIs are used by the backend integration worker for CRM/service synchronization. Never expose unrestricted Salesforce REST access to the browser or LLM.

## 2. API catalogue

| API | Method | Purpose | Side effect |
|---|---|---|---|
| `/api/v1/agent/menu/search` | POST | Search outlet menu | No |
| `/api/v1/agent/menu/items/{itemId}` | GET | Item detail | No |
| `/api/v1/agent/menu/items/{itemId}/availability` | GET | Live availability | No |
| `/api/v1/agent/outlets/{outletId}/hours` | GET | Outlet hours | No |
| `/api/v1/agent/delivery/serviceability` | POST | Check delivery | No |
| `/api/v1/agent/orders` | GET | List own recent orders | No |
| `/api/v1/agent/orders/{orderId}` | GET | Own order status | No |
| `/api/v1/agent/orders/{orderId}/timeline` | GET | Own order timeline | No |
| `/api/v1/agent/orders/{orderId}/cancellation-preview` | POST | Preview cancellation | No |
| `/api/v1/agent/orders/{orderId}/cancellation` | POST | Submit cancellation | Yes |
| `/api/v1/agent/orders/{orderId}/reschedule-preview` | POST | Preview new slot | No |
| `/api/v1/agent/orders/{orderId}/reschedule` | POST | Submit reschedule | Yes |
| `/api/v1/agent/support/cases` | POST | Create support request/Case sync event | Yes |
| `/api/v1/agent/support/cases/{caseRef}` | GET | Own Case status | No |
| `/api/v1/agent/refunds/eligibility` | POST | Check refund eligibility | No |
| `/api/v1/agent/refunds/requests` | POST | Request review | Yes |

## 3. Authentication and identity

- Require a signed, short-lived service token for Agentforce-to-gateway calls.
- Validate `iss`, `aud`, `sub`, `exp`, `nbf`, `jti`, scopes and signature.
- Bind token to verified customer/guest session and environment.
- Use server-side session lookup for revocation and assurance level.
- Do not accept customer identity from action input.
- Use separate integration identities per environment.
- Rotate credentials and monitor token failures.

## 4. Side-effect request contract

Example cancellation request:

```json
{
  "previewId": "short-lived-preview-id",
  "reasonCode": "CUSTOMER_REQUEST",
  "confirmation": true,
  "idempotencyKey": "unique-client-generated-key"
}
```

The backend must verify:
- preview belongs to current customer and order;
- preview has not expired;
- order state is still eligible;
- no conflicting update has occurred;
- idempotency key has not been used for a different payload;
- policy and refund/fee consequences are current.

## 5. Salesforce synchronization

Use a transactional outbox:
- event ID;
- aggregate type and ID;
- event type/version;
- payload schema version;
- occurred-at;
- retry count and next attempt;
- status and last error code.

Worker uses Salesforce upsert by External ID. Maintain an integration mapping and delivery log. Use exponential backoff with jitter, dead-letter queue and replay tooling.

## 6. Salesforce-to-backend calls

Prefer Salesforce Named Credentials / External Credentials for outbound callouts. Use a dedicated named principal or per-user identity according to the use case. Do not store tokens in custom settings or Apex source.

Apex callout service should:
- use typed request/response DTOs;
- enforce timeout;
- validate response code and schema;
- return safe error types;
- log correlation ID without secrets;
- avoid callouts inside loops;
- use Queueable/Platform Events for async work when appropriate.

## 7. Webhooks and payment events

Stripe webhook endpoint is NestJS-owned:
- verify signature against raw request body;
- dedupe provider event ID;
- process idempotently;
- handle delayed/out-of-order events;
- reconcile unknown payment outcomes;
- never treat browser redirect as payment proof.

Salesforce receives a sanitized payment/order projection asynchronously.

## 8. API consistency requirements

- All paths versioned.
- All timestamps ISO 8601 UTC.
- Money uses integer minor units and currency.
- Stable error codes.
- Correlation ID propagated end-to-end.
- Pagination and maximum result sizes.
- Explicit timeout, retry and rate limit.
- OpenAPI contract checked in CI.
- Contract tests between NestJS and Salesforce action adapters.
