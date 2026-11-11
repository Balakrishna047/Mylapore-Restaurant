# Acceptance Criteria & Sign-off Matrix: Mylapore Express

- **Document ID**: ACM-ME-15
- **Version**: 2.0

---

## 1. Acceptance Checklist

- [x] **AC-01 (Catalog Authenticity & High Fidelity)**: Menu displays all authentic categories (Curries, Rice, Sambar, Rasam, Chutneys, Desserts, Beverages, Batters, Specials, Pickles) with high-res dish photos, heat meters, allergen declarations, and blast-chilling guidelines.
- [x] **AC-02 (Cart & Server Pricing Verification)**: Cart computes subtotal, item add-ons, delivery charges, and sales tax on server-side. Zero price calculation trust on client.
- [x] **AC-03 (Payment Gateway & Webhook Reconciliation)**: Stripe PaymentIntent integration with signed webhook listener updates order from `PENDING_PAYMENT` to `CONFIRMED`.
- [x] **AC-04 (Order State Machine)**: Strict status transitions (`PENDING_PAYMENT` -> `PAID` -> `CONFIRMED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`).
- [x] **AC-05 (Rescheduling & Cancellation Policies)**: Operational rules enforced: 100% refund before cooking, 50% during prep, 0% after completion. Rescheduling validated against active kitchen time slots.
- [x] **AC-06 (Agentforce AI Concierge)**: Embedded chat interface resolves dish inquiries, dietary constraints, order lookup, and case creation.
- [x] **AC-07 (Salesforce Service Cloud Integration)**: Synced contacts and service cases with graceful degradation when Salesforce credentials are not present in dev mode.
- [x] **AC-08 (Admin Operations & KDS)**: Kitchen display dashboard allows real-time order acceptance, prep updates, and 86'ing out-of-stock items.
- [x] **AC-09 (DevOps & Render Cloud Ready)**: `render.yaml`, environment templates, health check endpoints (`/api/v1/health`), and CI/CD GitHub Actions workflows in place.
