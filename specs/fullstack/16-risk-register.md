# Severity-Ranked Risk Register & Architecture Review Board Findings

- **Document ID**: RR-ME-16
- **Reviewing Entity**: Independent Enterprise Architecture Review Board (EARB)
- **Status**: Critical & High Risks Remediated

---

## 1. Enterprise Architecture Findings & Mitigations

| Finding ID | Area | Severity | Description | Remediation Implemented | Status |
|---|---|---|---|---|---|
| **EARB-F01** | Payment & Security | **CRITICAL** | Client-side price tampering vulnerability if totals are passed from frontend. | Enforced strict backend-only calculation engine. Checkout endpoint only accepts item IDs and quantities, resolving prices strictly from PostgreSQL. | **RESOLVED** |
| **EARB-F02** | Payments | **CRITICAL** | Webhook replay attacks or duplicate charge confirmations causing multiple orders. | Implemented idempotency key checks and HMAC signature verification on `payment_intent.succeeded`. | **RESOLVED** |
| **EARB-F03** | Operations | **HIGH** | Kitchen slot saturation during peak dinner/lunch rushes leading to spoiled blast-chilled delivery timelines. | Added delivery slot capacity limits in order scheduling validator. | **RESOLVED** |
| **EARB-F04** | Integrations | **HIGH** | Outage or credential delay of external Salesforce/Agentforce blocking consumer checkouts. | Decoupled CRM sync behind an asynchronous adapter with resilient mock/simulation fallback mode (`SALESFORCE_ENABLED=false`). | **RESOLVED** |
| **EARB-F05** | Database | **HIGH** | Floating-point inaccuracies in currency computations causing fractional cent rounding errors. | Enforced integer cents or `Decimal(10,2)` in database schema and currency rounding math. | **RESOLVED** |
| **EARB-F06** | Operations | **MEDIUM** | Order cancellation attempted after food has been blast-chilled and dispatched. | Implemented milestone-gated cancellation rules rejecting customer cancellations once status reaches `PREPARING` or later without supervisor override. | **RESOLVED** |
