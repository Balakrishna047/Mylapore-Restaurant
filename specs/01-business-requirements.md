# Business Requirements Specification: Mylapore Express

## Document Control
- **Document ID**: BRS-ME-01
- **Status**: Approved by Enterprise Architecture Review Board
- **Scope**: Omnichannel Restaurant E-commerce, Inventory, Payment, and CRM Orchestration

---

## 1. Core Business Capabilities

### B-REQ-001: Authentic South Indian Culinary Catalog
- **Business Rationale**: South Indian cuisine requires exact dietary attributes: Pure Vegetarian, Vegan, Jain (no root vegetables like onion/garlic), spice levels (Mild, Medium, Hot, Extra Hot), blast-chill reheatable items, and batter freshness lifespans (Idly/Dosa/Adai).
- **Metric**: 100% of items display clear allergen lists, reheating guidelines, and dietary tags.

### B-REQ-002: Dynamic Delivery Zone & Slot Allocation
- **Business Rationale**: Fresh blast-chilled culinary items cannot sit in transit indefinitely. The platform must enforce delivery radiuses, address geolocation verification, and time-slot scheduling (e.g. Lunch 11:30 AM - 1:30 PM, Dinner 6:00 PM - 8:30 PM).
- **Metric**: Zero orders accepted outside authorized service zip codes or saturated kitchen preparation time slots.

### B-REQ-003: Financial Governance & Idempotency
- **Business Rationale**: Prevent double-charging, cart manipulation, and inconsistent discount claims.
- **Metric**: 100% backend server-side pricing recalculation and idempotency key enforcement on all checkout requests.

### B-REQ-004: Self-Service Order Modification & Policy Enforcement
- **Business Rationale**: Customers frequently need to reschedule delivery times or cancel an order. Once food preparation begins (`ACCEPTED` or `PREPARING`), cancellations must follow progressive refund penalty rules to protect kitchen food cost.
- **Rules**:
  - `CONFIRMED` / `PAID` (before kitchen acceptance): 100% refund.
  - `ACCEPTED` / `PREPARING`: 50% refund or store credit only if within 15 minutes of acceptance; 0% refund once packaging/cooking is completed.
  - Rescheduling: Permitted up to 2 hours prior to scheduled delivery window, subject to target slot availability.

### B-REQ-005: Enterprise CRM & Agentic Support
- **Business Rationale**: Reduce support overhead while maintaining VIP customer touchpoints. Salesforce Service Cloud serves as the single pane of glass for customer service reps, while Agentforce AI resolves tier-1 FAQs, order tracking, and refund eligibility.
- **Data Boundary**: Customer PII and order metadata sync to Salesforce; raw credit card numbers and full Stripe tokens remain strictly inside payment provider boundaries.
