# Quality Assurance & Testing Strategy: Mylapore Express

- **Document ID**: QAS-ME-14
- **Version**: 2.0

---

## 1. Testing Pyramid & Tooling Matrix

```
       / \
      /   \     E2E / Playwright Tests (User Journey & Checkout)
     /-----\
    /       \    Integration Tests (NestJS Supertest + DB Transactions)
   /---------\
  /           \  Unit Tests (Pricing Engine, Order FSM, DTO Validators)
 /-------------\
```

| Scope | Tool | Target Coverage | Key Test Scenarios |
|---|---|---|---|
| **Unit** | Jest / Vitest | > 85% domain logic | Tax calculation, coupon discounts, status machine transition validity, refund percentage tier rules, HMAC signature verification. |
| **Integration** | Supertest + Prisma | > 80% endpoints | Auth registration, login JWT cycle, menu query with filters, cart item mutation, checkout quote generation, webhook idempotency. |
| **E2E** | Playwright | Critical user journeys | Customer navigation, product customization, guest cart persistence, checkout flow, live order tracking, rescheduling, support chatbot interaction, admin KDS order update. |
