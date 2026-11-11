# 04 — Backend Specification (NestJS)

## API conventions
- Base path: `/api/v1`.
- JSON request/response unless explicitly documented.
- ISO-8601 timestamps in UTC.
- Money: integer minor units plus currency.
- Pagination: cursor-based for large/event lists; bounded page size.
- Errors: `{ "error": { "code": "STABLE_CODE", "message": "Safe message", "details": [], "correlationId": "..." } }`.
- All mutating endpoints accept or derive an idempotency key where duplicate effects are possible.
- Validate all request DTOs and reject unexpected properties.

## Required controllers
- AuthController
- OutletController
- MenuController
- CartController
- QuoteController
- CheckoutController
- OrderController
- PaymentController
- RefundController
- SupportController
- AdminMenuController
- AdminInventoryController
- KitchenController
- DeliveryController
- AgentActionController
- HealthController

## Authorization
- Public: published outlets/menu and limited discovery.
- Guest: guest-session-bound cart/quote/guest order access.
- Customer: own profile, address, cart and orders.
- OutletManager: assigned outlet administration.
- Kitchen: assigned outlet ticket actions only.
- Delivery: assigned task actions only.
- Support: permitted support/case context.
- Finance: payment/refund/reconciliation scope.
- PlatformAdmin: privileged operations with MFA and audit.
Every database lookup for a protected resource MUST include the authenticated subject and required scope, not fetch by ID and authorize later as an optional step.

## State transitions
All state changes go through domain transition services. Each transition checks current state, actor permission, policy, concurrency version and required evidence. Store transition history. Reject invalid or duplicate transitions with stable error codes.

## Background workers
- Outbox dispatcher.
- Stripe webhook/inbox processor.
- Payment reconciliation.
- Refund submission/reconciliation.
- Salesforce sync.
- POS/KDS delivery.
- Notification dispatch.
- Reservation expiry.
- Kitchen acceptance timeout.
- Scheduled order/slot processing.

## Error handling
- Distinguish validation, authentication, authorization, conflict, provider unavailable, unknown provider outcome and internal error.
- Never leak stack traces, secrets, tokens or provider payloads to clients.
- Use retryable vs terminal classification.
- Preserve provider response IDs and sanitized failure codes for support.
