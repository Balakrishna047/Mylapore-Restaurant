# Salesforce Service Cloud Integration Specification: Mylapore Express

- **Document ID**: SFI-ME-12
- **Systems**: Mylapore Express Core API <---> Salesforce Service Cloud (Enterprise CRM)

---

## 1. System of Record (SoR) Matrix

| Entity | System of Record | Sync Trigger | Target Salesforce Object |
|---|---|---|---|
| **Customer Profile** | PostgreSQL | Registration / Address Update | `Contact` & `Account` |
| **Order Record** | PostgreSQL | Payment Confirmed | `Order` (Custom or Standard) |
| **Order Line Items** | PostgreSQL | Order Confirmed | `OrderItem` |
| **Support Complaint** | Salesforce Service Cloud | Customer Chat Handoff / Contact Form | `Case` |
| **Payment & Refund** | PostgreSQL | Stripe Webhook / Refund Execution | Masked reference only on `Order` (PCI Guardrail) |

## 2. Integration Security & Resilience
- **Credential Storage**: Salesforce Connected App OAuth 2.0 Client Credentials or JWT Bearer flow. Credentials are injected via environment variables (`SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`).
- **Resilience Pattern**: Asynchronous synchronization via queue/worker. If Salesforce API encounters rate limits (API limits) or temporary maintenance, events are held in Redis/Database retry queues with exponential backoff.
- **Mock/Simulator Mode**: When `SALESFORCE_ENABLED=false`, the integration adapter transparently switches to the `SimulatedSalesforceAdapter`, logging structured payloads to disk and maintaining 100% operational fidelity without failing end-user transactions.
