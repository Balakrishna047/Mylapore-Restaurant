# 12 — Gap Register and Cross-Check

Status values: `NOT AUDITED`, `OPEN`, `IN PROGRESS`, `VERIFIED`. Do not mark a gap resolved without evidence.

| ID | Priority | Gap / risk | Required resolution | Verification evidence |
|---|---|---|---|---|
| G-001 | P0 | Agent-to-customer identity propagation | Signed short-lived context, scope validation, revocation | Cross-customer attack test denied |
| G-002 | P0 | Payment unknown/late outcome | Inbox, reconciliation, late-payment policy | Timeout + late webhook E2E |
| G-003 | P0 | Inventory oversell | Atomic reservation and expiry | Concurrent last-unit test |
| G-004 | P0 | Kitchen rejects paid order | Timeout/reject/refund workflow | Kitchen timeout test |
| G-005 | P0 | Salesforce outage | Transactional outbox and replay | Checkout works during outage |
| G-006 | P0 | Stripe India capability | Merchant/payment-method verification | Provider confirmation + sandbox evidence |
| G-007 | P0 | Salesforce org entitlement | Capability and license matrix | Target-org proof of concept |
| G-008 | P0 | Guest-to-account lifecycle | Guest verification, merge and ownership rules | Guest order/account-link tests |
| G-009 | P0 | Object-level authorization | Central policies and query scoping | BOLA/IDOR negative suite |
| G-010 | P1 | Delivery failure lifecycle | Assignment, proof, reassignment, return | Failed delivery UAT |
| G-011 | P1 | Kitchen/KDS completeness | Stations, item states, rework, shift handover | Staff UAT |
| G-012 | P1 | Case lifecycle | Routing, SLA, reopen, resolution, CSAT | Full Case E2E |
| G-013 | P1 | Refund approvals | Tier thresholds, dual control, async provider execution | Approval matrix tests |
| G-014 | P1 | Finance reconciliation | Settlement, tax, fees, refund and COD ledger | Daily balanced report |
| G-015 | P1 | Notifications | Consent, dedupe, retry, status | Provider failure test |
| G-016 | P1 | Staff permissions | Role/outlet matrix | Negative role tests |
| G-017 | P1 | Tax/invoice/FSSAI/privacy | Qualified compliance review | Signed business/legal evidence |
| G-018 | P1 | Human handoff continuity | Explicit session/context contract | Agent-to-human test |
| G-019 | P2 | Loyalty fraud and ledger | Ledger, expiry and abuse rules | Ledger reconciliation |
| G-020 | P2 | Analytics correctness | KPI definitions and data quality | Metric reconciliation |
| G-021 | P2 | Localization | Reviewed content and language evaluations | Per-language golden suite |
| G-022 | P2 | DR objectives | RPO/RTO and restore drills | Recorded restore evidence |

## Cross-document consistency checks
- All public API paths use `/api/v1`; Agentforce paths use `/api/v1/agent/actions/...`.
- Order, payment, refund, inventory reservation, kitchen and delivery have separate state machines.
- Payment state does not use `REFUNDED` as its own lifecycle; refund aggregate owns refund states.
- Refund provider calls are asynchronous.
- Checkout never waits on Salesforce.
- Agentforce identity is not a writable model parameter.
- POS and delivery are adapters until vendors are selected.
- UI never treats redirect as payment proof.
- Every side effect has idempotency and audit.
- Every requirement maps to a test and deployment environment.
