# 12 — Gap Register and Architecture Decisions

## 1. Blocking decisions

| ID | Gap / decision | Why it matters | Owner | Exit evidence |
|---|---|---|---|---|
| G-01 | Agentforce entitlement and usage | Agent creation/API/channel may not be enabled | Salesforce admin | License/Setup evidence |
| G-02 | Embedded Messaging vs custom Agent API UI | Determines public chat rendering and auth | Architect | Working POC |
| G-03 | Lightning Types support in chosen surface | Rich output behavior is channel-specific | Salesforce dev | Card renderer POC |
| G-04 | Copado edition and pipeline type | Deployment steps differ | DevOps admin | Pipeline proof |
| G-05 | Org topology and available sandboxes | Controls release/test fidelity | Salesforce admin | Environment matrix |
| G-06 | Account+Contact vs Person Account | Affects customer identity and sharing | CRM owner | Signed ADR |
| G-07 | Identity provider and guest lifecycle | Prevents IDOR and account confusion | Security/backend | Threat model + tests |
| G-08 | Human support hours and queues | Handoff requires operational coverage | Service owner | Queue/SLA matrix |
| G-09 | Refund approval authority | Financial control | Finance/service owner | Approved policy |
| G-10 | Knowledge article ownership | Prevents stale policy | Service owner | Article governance |
| G-11 | POS/KDS provider | Kitchen status source | Operations | Vendor decision |
| G-12 | Delivery provider/model | ETA and tracking source | Operations | Vendor decision |
| G-13 | Stripe India eligibility/payment methods | Payment acceptance varies | Finance | Account verification |
| G-14 | DPDP/retention/consent | Legal and privacy obligations | Privacy/legal | Approved policy |
| G-15 | Multi-outlet sharing model | Prevents cross-outlet data leakage | Salesforce architect | Access tests |
| G-16 | Data 360 requirement | Avoid unnecessary licensing and complexity | Architect | Use-case decision |

## 2. Additional implementation gaps to close
- Define complete Apex class/action inventory and API names.
- Generate final metadata XML from target API version.
- Define complete OpenAPI schemas for every action, not just catalogue.
- Define exact Lightning Type schema and renderer mapping.
- Define image CDN allowlist and image lifecycle.
- Define conversation transcript retention and customer disclosure.
- Define bot-to-human handoff when queue is closed.
- Define Case duplicate detection and reopen rules.
- Define service SLAs and escalation calendar.
- Define integration replay and reconciliation dashboards.
- Define production agent rollback/disable procedure.
- Define cost/usage budgets and alert thresholds.
- Define accessibility test ownership.
- Define API rate limits and abuse prevention.
- Define release compatibility across Salesforce and NestJS versions.

## 3. ADRs to create

- ADR-001: Public chat channel approach.
- ADR-002: Lightning Types versus React rich-card renderer.
- ADR-003: Customer CRM model.
- ADR-004: Agentforce-to-NestJS authentication.
- ADR-005: Salesforce order projection strategy.
- ADR-006: Case routing and handoff.
- ADR-007: Copado pipeline type and branch strategy.
- ADR-008: Data retention and consent.

## 4. Risk-based implementation order
Resolve G-01 through G-08 before full implementation. G-09 through G-16 must be resolved before the affected production capability is enabled. Use mock adapters for undecided POS/delivery providers, but do not claim production tracking until integrated.
