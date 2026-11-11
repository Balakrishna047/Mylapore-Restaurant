# 07 — Integration Contracts

## Adapter interfaces
Implement interfaces first, then concrete adapters:
- `PaymentProvider`: createPayment, retrievePayment, cancelPaymentIfSupported, createRefund, retrieveRefund, verifyWebhook, list/reconcile transactions.
- `PosAdapter`: submitOrder, getAcknowledgement, updateTicket, cancelTicket, healthCheck.
- `DeliveryProvider`: quote, createTask, assignTask, getTask, cancelTask, webhook verification.
- `NotificationProvider`: sendTemplate, getDeliveryStatus.
- `CrmAdapter`: upsertCustomer, upsertOrderSummary, createOrUpdateCase, syncInteraction.

Each adapter must return normalized internal result types and provider-specific sanitized metadata. Never leak raw provider payloads to the client.

## Stripe
- Sandbox first.
- Verify merchant account and India capabilities before production.
- Use stable internal idempotency keys.
- Verify webhook signature on raw body.
- Persist webhook event in inbox before asynchronous processing.
- Deduplicate by provider event ID and provider account/environment.
- Handle retries, out-of-order events, unknown outcomes and reconciliation.
- Never store card PAN/CVV.
- Refund is asynchronous and must be reconciled.

## Salesforce
- Use a dedicated integration user with least privilege.
- Use external IDs for upsert and prevent duplicate records.
- Sync customer/order/payment/refund summaries only as needed for service.
- Use outbox; no synchronous CRM call in checkout transaction.
- Include `lastSyncedAt`, `sourceSystem`, external IDs and correlation ID.
- Define conflict policy: commerce facts flow from NestJS to Salesforce; service-case facts flow from Salesforce to backend only when a defined event requires it.
- Retry transient errors, dead-letter permanent errors, support replay.

## POS and delivery
- Vendor TBD. Implement `MockPosAdapter` and `ManualDeliveryAdapter` first.
- Define canonical payload and mapping before selecting a vendor.
- Vendor event signature, duplicate delivery and mapping tests are mandatory.
- Never assume vendor supports every status or cancellation operation.

## Notifications
- Event-driven and non-blocking.
- Template version, locale, consent, destination, provider ID and delivery outcome recorded.
- Retry transient errors; dead-letter permanent errors.
- Avoid sending sensitive order/payment data in message content.
