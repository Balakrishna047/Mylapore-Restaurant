# Decision Log and Verification Register

## Locked v1 decisions

| ID | Decision | Rationale |
|---|---|---|
| ADR-001 | NestJS modular monolith | Clear domain boundaries without premature distributed complexity |
| ADR-002 | PostgreSQL + Prisma | Transactional relational source of truth |
| ADR-003 | Next.js experience layer | Storefront, chat UI, admin and kitchen UI |
| ADR-004 | Stripe behind PaymentProvider adapter | Matches Consolidated Blueprint v2; provider remains swappable |
| ADR-005 | Verify Stripe India capability before live payment | Account, method and settlement capabilities must not be assumed |
| ADR-006 | Four separate state machines | Order, payment, refund and delivery represent different facts |
| ADR-007 | Agentforce is non-authoritative | Backend owns validation and transactions |
| ADR-008 | Three logical agent deployments | Commerce, Service and Management; actual physical topology depends on org entitlements |
| ADR-009 | Five custom Salesforce objects plus standard Case/Contact/Knowledge | Lean CRM model and external ID upsert |
| ADR-010 | Transactional outbox for Salesforce sync | Commerce transaction survives Salesforce outage |
| ADR-011 | Case-first human support; Email-to-Case | Simpler v1; validate Omni-Channel licence and later enable routing |
| ADR-012 | POS and delivery adapters with mock implementations | Vendors not selected |
| ADR-013 | Redis optional | Add only for measured need |
| ADR-014 | No Data Cloud or MuleSoft in v1 | Avoid unnecessary platform complexity |
| ADR-015 | Separate GitHub app pipeline and Copado Salesforce pipeline | Distinct artifact types and release processes |

## Verification register — must be closed before relevant feature is enabled

| ID | Verify | Owner | Blocking phase |
|---|---|---|---|
| V-01 | Salesforce Agentforce entitlement, agent type and session API | Salesforce lead | Sprint 6 |
| V-02 | Agent session context supports immutable server-signed identity claims | Salesforce lead | Sprint 6 |
| V-03 | Agent action input binding prevents model from writing identity | Salesforce lead | Sprint 6 |
| V-04 | Service Cloud, Knowledge, Email-to-Case and Omni-Channel entitlements | Salesforce lead | Sprint 5/7 |
| V-05 | Copado supports selected Agentforce metadata types and API version | DevOps/Salesforce lead | Sprint 5/8 |
| V-06 | Stripe account live readiness, India methods, UPI/COD design and settlement | Product/Finance | Sprint 3 |
| V-07 | Tax/GST, invoice and food business compliance obligations | Business/legal | Sprint 2/8 |
| V-08 | Outlet, service zone, kitchen capacity, delivery model and timezone | Restaurant owner | Sprint 1/3 |
| V-09 | Refund/cancellation/reschedule policies and thresholds | Owner/Finance | Sprint 3/7 |
| V-10 | Data retention, privacy, consent and deletion policy | Product/legal | Sprint 0/8 |
| V-11 | Hosting, backup, restore, RPO/RTO and alert recipients | Tech lead/Owner | Sprint 8 |

## Change control
A locked decision changes only through:
1. Record the new evidence or business requirement.
2. Explain options and consequences.
3. Update this log and affected specs/contracts.
4. Add migration/backward compatibility plan.
5. Update tests and sprint backlog.
6. Obtain product/technical owner approval.

Do not silently change Stripe to another provider, add Data Cloud, introduce microservices, change agent count, or move order truth to Salesforce.
