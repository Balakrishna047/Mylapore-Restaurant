# Stripe Payment & Webhook Integration Guide

## 1. Gateway Pattern
The backend encapsulates Stripe behind the `StripeAdapter` class. In development or test environments where live credentials have not yet been provisioned, the adapter provides a built-in simulation engine.

## 2. Order Confirmation Lifecycle
1. Customer initiates checkout on `/checkout`.
2. Backend calls `StripeAdapter.createPaymentIntent()`.
3. Order created in `PENDING_PAYMENT` state with linked `Payment` record in `REQUIRES_PAYMENT_METHOD` state.
4. Client completes payment authorization.
5. Stripe sends signed webhook event `payment_intent.succeeded` to `/api/v1/payments/stripe-webhook`.
6. Webhook controller verifies HMAC SHA-256 signature against `STRIPE_WEBHOOK_SECRET`.
7. Database transaction atomically updates:
   - `Payment.status = 'SUCCEEDED'`
   - `Order.status = 'CONFIRMED'`
   - Appends log to `OrderStatusHistory`.

## 3. Webhook CLI Testing
```powershell
# Forward events using Stripe CLI
stripe listen --forward-to localhost:4000/api/v1/payments/stripe-webhook
```
