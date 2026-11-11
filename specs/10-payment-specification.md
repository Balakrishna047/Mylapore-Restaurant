# Payment Specification: Mylapore Express

- **Document ID**: PAY-ME-10
- **Version**: 2.0

---

## 1. Provider Abstraction Pattern
To support both global card processing via Stripe and international/Indian local gateways (e.g. Razorpay, UPI) without altering order management business logic, Mylapore Express employs the **Payment Gateway Adapter Pattern**:

```typescript
export interface PaymentGatewayAdapter {
  createPaymentIntent(params: CreateIntentParams): Promise<PaymentIntentResult>;
  capturePayment(paymentIntentId: string): Promise<CaptureResult>;
  processRefund(params: RefundParams): Promise<RefundResult>;
  verifyWebhookSignature(payload: Buffer, signature: string): Promise<WebhookEvent>;
}
```

## 2. Order Payment State Lifecycle

1. **Intent Generation**:
   - Customer initiates checkout.
   - Backend calculates subtotal + taxes + delivery - discount.
   - Backend invokes `StripeAdapter.createPaymentIntent()`.
   - Creates a pending `Order` record with status `PENDING_PAYMENT` and linked `Payment` record with status `REQUIRES_PAYMENT_METHOD`.
   - Client receives `clientSecret`.
2. **Client Execution**:
   - Customer enters card details into Stripe Elements.
   - Stripe processes authentication (3D Secure if applicable).
3. **Webhook Resolution**:
   - Stripe dispatches `payment_intent.succeeded` event to `/api/v1/payments/stripe-webhook`.
   - Controller verifies HMAC signature against `STRIPE_WEBHOOK_SECRET`.
   - Database transaction marks `Payment.status = 'SUCCEEDED'` and `Order.status = 'CONFIRMED'`.
   - Kitchen notification is emitted.
4. **Refund Processing**:
   - Initiated via customer self-service cancellation or admin override.
   - Backend checks cancellation milestone to calculate refund percentage (100%, 50%, or 0%).
   - If refundable amount > 0, invokes `StripeAdapter.processRefund()`.
   - Writes `Refund` entity and updates `Order.status = 'REFUNDED'`.
