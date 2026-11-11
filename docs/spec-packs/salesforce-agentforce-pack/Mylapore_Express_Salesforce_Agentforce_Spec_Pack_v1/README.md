# Mylapore Express — Salesforce + Agentforce Specification Pack

**Version:** 1.0  
**Status:** Implementation baseline; validate org entitlements and actual Copado pipeline before deployment.

## Purpose

This pack specifies the Salesforce customer-service and Agentforce layer for Mylapore Express, including:
- Agentforce customer commerce, service, and restaurant operations capabilities.
- Salesforce Service Cloud data model, Case lifecycle, Knowledge, routing, and human handoff.
- Lightning-based chat experience, rich menu/product cards, image handling, and external website integration.
- Secure APIs between Salesforce, the Next.js/NestJS commerce platform, Stripe, and optional POS/delivery systems.
- Salesforce Developer Edition/scratch org/sandbox strategy and Copado development/release lifecycle.
- Sprint-by-sprint implementation, test evidence, release gates, and unresolved decisions.

## Read this pack in order

1. `specs/00-constitution.md` — non-negotiable engineering rules.
2. `specs/01-solution-architecture.md` — end-to-end architecture and system ownership.
3. `specs/02-agentforce-design.md` — agent roles, subagents, instructions, actions, guardrails.
4. `specs/03-lightning-chat-experience.md` — chatbot UX, Lightning Types, LWC, image cards, website embedding.
5. `specs/04-service-cloud-design.md` — Cases, Knowledge, queues, Omni-Channel and handoff.
6. `specs/05-salesforce-data-model.md` — objects, fields, relationships and external IDs.
7. `specs/06-api-integration-contracts.md` — API catalogue, authentication, payload patterns and error handling.
8. `specs/07-security-privacy-governance.md` — identity, authorization, data minimization and AI controls.
9. `specs/08-org-strategy-and-setup.md` — org setup and CLI workflows.
10. `specs/09-copado-devops.md` — Copado pipeline setup and deployment governance.
11. `specs/10-testing-and-acceptance.md` — test strategy and acceptance criteria.
12. `specs/11-monitoring-and-operations.md` — supportability and production operations.
13. `specs/12-gap-register-and-decisions.md` — gaps, decisions, owners and closure evidence.
14. `plans/sprint-plan.md` — sprint schedule and deliverables.
15. `plans/release-checklist.md` — release readiness.
16. `contracts/api-catalog.yaml` — API baseline.
17. `setup/org-setup-runbook.md` — practical setup checklist.
18. `prompts/antigravity-salesforce-master-prompt.md` — coding-agent implementation prompt.

## Important scope boundary

This is a specification package, not proof that a Salesforce org, Agentforce entitlement, Copado license, Stripe account, or existing repository has been inspected. Do not mark a capability as available until it has been verified in the target org/account.

## Architecture principle

NestJS/PostgreSQL remain the system of record for menu, price, cart, quote, stock, order, payment, refund execution, kitchen and delivery. Salesforce owns CRM, Case, Knowledge, service routing and interaction context. Agentforce orchestrates approved actions; it must not invent transactional truth or bypass backend policy.

## First implementation slice

Build and prove one vertical slice before adding more agents:

1. Website customer opens the chat.
2. Customer is authenticated or explicitly treated as a guest.
3. Agent asks what the customer needs.
4. Agent calls a read-only menu discovery action.
5. Backend returns approved menu data including image URLs and dietary/allergen facts.
6. Chat renderer displays product cards.
7. Customer selects an item; backend validates current price/availability.
8. Agent explains the next step; checkout remains in the commerce application.
9. An issue can be escalated to Service Cloud with the conversation summary and verified identity level.

## Definition of done

A feature is done only when its metadata/source, tests, security review, acceptance evidence, monitoring, rollback/forward-fix plan, and operational owner are recorded.
