# Functional Requirements Document: Mylapore Express

- **Document ID**: FRD-ME-02
- **Version**: 2.0 (Post-Review Board Resolution)

---

## 1. Requirement Traceability Matrix

| Req ID | Module | Title | Priority | Description | Acceptance Criteria |
|---|---|---|---|---|---|
| **F-REQ-101** | Catalog | Dynamic Taxonomy & Filtering | P0 | Filter menu by category (Curries, Rice, Sambar, Rasam, Chutneys, Desserts, Beverages, Batters, Specials, Pickles) and dietary tags (Vegetarian, Vegan, Jain, Heat Level). | Filtering updates product grid instantaneously; URL query params persist state. |
| **F-REQ-102** | Catalog | Item Customization & Add-ons | P0 | Allow spice level customization, portion size (8oz, 16oz, 32oz), grain pairing, and optional side add-ons. | Selected options update unit price accurately; backend re-validates option prices on submission. |
| **F-REQ-103** | Cart | Persistent & Guest Cart | P0 | Guest carts stored in local storage/session; merged into authenticated customer cart on login without dropping items. | Items added as guest exist after login; duplicate items combine quantities. |
| **F-REQ-104** | Checkout | Server-Side Pricing Engine | P0 | Computes subtotal, coupon discount, delivery fee, sales tax (8.25%), packaging fee, and tip. Frontend prices are purely informational. | Tampered checkout payloads are rejected with `400 Bad Request`. |
| **F-REQ-105** | Payments | Stripe Payment Intent & Webhook | P0 | Create Stripe PaymentIntent, securely collect card details on client, confirm order strictly via signed Stripe webhook (`payment_intent.succeeded`). | No order marked `PAID` without verified HMAC webhook signature. |
| **F-REQ-106** | Orders | Order State Machine | P0 | Enforce deterministic transitions: `PENDING_PAYMENT` -> `PAID` -> `CONFIRMED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`. | Invalid transitions (e.g. `DELIVERED` -> `PREPARING`) throw `409 Conflict`. |
| **F-REQ-107** | Lifecycle | Rescheduling Workflow | P1 | Allow customers to select a new eligible delivery slot if order is prior to kitchen cutoff. | Slot capacity is checked; updated timestamp logged in `OrderStatusHistory`. |
| **F-REQ-108** | Lifecycle | Cancellation & Automated Refunds | P1 | Calculate refund entitlement based on order stage; trigger Stripe refund API and create `Refund` audit record. | Refund state transitions to `REFUND_PENDING` -> `REFUNDED`; Stripe refund ID recorded. |
| **F-REQ-109** | Operations | Admin Kitchen KDS & Order Dispatch | P0 | Real-time / polling dashboard for kitchen managers to view active tickets, mark prep time, and request delivery pickup. | Kitchen can update order state with one-click feedback; order notes displayed prominently. |
| **F-REQ-110** | Support | Conversational Agentforce AI Bot | P1 | AI chatbot embedded on customer portal answering dish inquiries, checking order status, and filing support cases. | AI accurately fetches live order status by Order Number and Phone/Email. |
| **F-REQ-111** | CRM | Salesforce Sync & Case Creation | P1 | Push orders and customer profiles to Salesforce Contact/Order objects; generate Service Cloud Case upon refund disputes or negative feedback. | System of record clearly defined: PostgreSQL is transactional master; Salesforce is CRM master. |
