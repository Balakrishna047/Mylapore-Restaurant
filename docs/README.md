# Mylapore Express — Antigravity Implementation Specification Pack

**Version:** 1.0  
**Baseline:** Mylapore Express Consolidated Blueprint v2, 11 November 2026  
**Purpose:** Portfolio-grade, implementation-ready specification for Antigravity-assisted delivery.

## What is included

| File | Purpose |
|---|---|
| `AGENTS.md` | Persistent instructions for Antigravity and coding agents |
| `PRD.md` | Product scope, personas, journeys, requirements and acceptance criteria |
| `ARCHITECTURE.md` | System boundaries, modules, deployment, security and reliability design |
| `API_SPEC.yaml` | OpenAPI 3.1 contract for customer, agent, operations and webhook APIs |
| `DATABASE_SCHEMA.md` | PostgreSQL/Prisma logical schema, constraints, indexes and state machines |
| `SALESFORCE_SPEC.md` | Service Cloud, CRM objects, Apex, Flow, security and Copado design |
| `AGENTFORCE_SPEC.md` | Agent portfolio, topics/subagents, action contracts, identity and guardrails |
| `TEST_PLAN.md` | Unit, integration, contract, security, AI evaluation, UAT and release gates |
| `SPRINT_PLAN.md` | 8 two-week sprints plus Sprint 0, ceremonies, goals, deliverables and exit criteria |
| `IMPLEMENTATION_TASKS.md` | Dependency-ordered epics, stories, subtasks and definition of done |
| `DECISION_LOG.md` | Locked decisions, verification items and change-control process |
| `ANTIGRAVITY_RUNBOOK.md` | How to execute the build safely in Antigravity, phase by phase |

## Baseline decisions

1. Next.js owns the user experience.
2. NestJS modular monolith owns commerce rules, authorization and transactions.
3. PostgreSQL is the operational source of truth; Prisma is the ORM.
4. Agentforce owns conversation and orchestration only. It cannot authoritatively set prices, stock, order status or money movement.
5. Stripe remains the v1 payment provider behind a `PaymentProvider` adapter. Stripe India account/payment-method capability is a **pre-build verification gate**. Do not silently substitute another provider.
6. Service Cloud owns Cases, knowledge, queues, human support and refund approvals. NestJS executes approved refunds.
7. CRM synchronization uses a transactional outbox and Salesforce upsert by External ID.
8. Redis is optional and must not be introduced until a concrete use case is accepted.
9. Data Cloud and MuleSoft are out of v1.
10. POS and delivery integrations use adapters with mock implementations until vendors are selected.

## Important status disclaimer

These are implementation specifications derived from the supplied design documents and clarified into engineering contracts. They are not evidence that a repository, Salesforce org, Stripe account, deployment target, licences, or production integration has been inspected or configured. Antigravity must audit the actual repository and connected org before modifying anything.

## Suggested repository layout

```text
mylapore-express/
├── AGENTS.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.yaml
│   ├── DATABASE_SCHEMA.md
│   ├── SALESFORCE_SPEC.md
│   ├── AGENTFORCE_SPEC.md
│   ├── TEST_PLAN.md
│   ├── SPRINT_PLAN.md
│   ├── IMPLEMENTATION_TASKS.md
│   ├── DECISION_LOG.md
│   └── ANTIGRAVITY_RUNBOOK.md
├── apps/
│   ├── storefront/       # Next.js customer experience
│   ├── admin/            # Admin and management UI
│   └── kitchen/          # Kitchen display / operations UI
├── services/
│   └── api/              # NestJS modular monolith
├── database/
│   └── prisma/
├── salesforce/
│   └── force-app/main/default/
├── contracts/
│   └── openapi/
├── infrastructure/
└── .github/workflows/
```

## First action

Run the repository and Salesforce-org discovery checklist in `ANTIGRAVITY_RUNBOOK.md`. Do not generate a second application beside an existing one, overwrite existing configuration, or claim a feature is complete until the code and tests prove it.
