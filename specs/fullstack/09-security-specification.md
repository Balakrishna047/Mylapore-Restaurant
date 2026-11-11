# Security Specification: Mylapore Express

- **Document ID**: SEC-ME-09
- **Version**: 2.0

---

## 1. Threat Modeling & Defense Strategies

| Threat Vector | Mitigation Strategy | Implementation |
|---|---|---|
| **Price Tampering** | Backend Source of Truth | Total amounts are computed exclusively on the backend from database product records. Frontend submitted totals are disregarded. |
| **Duplicate Payments & Replays** | Idempotency Keys & Signed Webhooks | Stripe PaymentIntents enforce idempotency tokens; webhook handler rejects signatures failing HMAC verification or matching processed webhook event IDs. |
| **Unauthorized State Mutation** | Role-Based Access Control (RBAC) | Order cancellation and rescheduling require customer ownership verification; staff status advances require `@Roles('KITCHEN_MANAGER', 'RESTAURANT_ADMIN')`. |
| **Credential Stuffing & Brute Force** | Rate Limiting & Throttling | NestJS Throttler applies maximum 5 login attempts per IP per minute. |
| **Data Breach / PII Leakage** | Field Masking & Sanitization | Passwords hashed with bcrypt (rounds: 12). Credit card details never enter backend memory or database. Payment IDs logged with masked references only. |
| **XSS & Content Injection** | HTML Sanitization & CSP Headers | React JSX default escaping + strict Helmet headers with restrictive script-src directives. |

## 2. Webhook Cryptographic Verification Standard
The Stripe webhook controller receives raw buffer payloads and verifies:
```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,
  signatureHeader,
  process.env.STRIPE_WEBHOOK_SECRET
);
```
Unverified payloads immediately return `400 Bad Request` and terminate execution.
