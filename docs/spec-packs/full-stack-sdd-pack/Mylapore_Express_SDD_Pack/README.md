# Mylapore Express — Spec-Driven Development Pack

**Version:** 1.0  
**Date:** 11 November 2026  
**Purpose:** Build the Mylapore Express restaurant commerce platform end-to-end using specification-driven implementation.

## What this package is
This package is the implementation contract for a full-stack application:
- **Frontend:** Next.js App Router, TypeScript, responsive customer storefront and operational interfaces.
- **Backend:** NestJS modular monolith, TypeScript, REST API, OpenAPI.
- **Database:** PostgreSQL with Prisma migrations.
- **Payments:** Stripe behind a provider adapter; merchant/account capabilities must be verified before production.
- **CRM/service:** Salesforce Service Cloud integration through an asynchronous integration layer.
- **AI:** Agentforce integration through a restricted, authenticated action gateway.
- **Deployment:** Web/API deployment and database migration pipeline are separate from Salesforce metadata deployment through Copado.

## Read these in order
1. `specs/00-constitution.md`
2. `specs/01-product-requirements.md`
3. `specs/02-architecture.md`
4. `specs/03-frontend-spec.md`
5. `specs/04-backend-spec.md`
6. `specs/05-data-model.md`
7. `contracts/openapi-baseline.yaml`
8. `specs/06-commerce-workflows.md`
9. `specs/07-integrations.md`
10. `specs/08-salesforce-agentforce.md`
11. `specs/09-security-privacy.md`
12. `specs/10-testing-acceptance.md`
13. `specs/11-devops-observability.md`
14. `specs/12-gap-register.md`
15. `plans/implementation-roadmap.md`
16. `prompts/antigravity-master-prompt.md`

## Normative language
- **MUST** = mandatory acceptance requirement.
- **SHOULD** = recommended unless an ADR records a justified exception.
- **MAY** = optional.
- **TBD** = a decision or external capability that must be verified. Do not fabricate a value.

## Source and assumptions
This package expands the Mylapore Express architecture decisions already discussed: Next.js + NestJS + PostgreSQL, Stripe, Salesforce Service Cloud, Agentforce and Copado. POS and delivery vendors remain undecided, so adapters and mock/manual implementations are specified. It does not claim that any real Salesforce org, Stripe merchant account, repository, legal compliance status or provider entitlement has been audited.

## Definition of first release
A customer can select an outlet, browse a live menu, customize items, manage a cart, receive a server-calculated quote, check out, pay in a verified provider flow, receive an order, and track it through kitchen/pickup or a controlled delivery workflow. A customer can request support; the backend persists the request and synchronizes a Case to Salesforce when configured. The platform remains usable if Salesforce or Agentforce is unavailable.

## Build policy
Do not implement all phases in one giant generation. Implement one vertical slice at a time. Every slice must include UI, API, persistence, authorization, tests, observability and documentation. No placeholder action may be presented as a completed payment, refund, Salesforce handoff or order transition.
