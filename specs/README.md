# Mylapore Express — Full-Stack Commerce Specifications

This directory houses the formal Spec-Driven Development (SDD) specifications for the **Mylapore Express Enterprise Full-Stack Commerce Engine** (Next.js 14 App Router, NestJS 10, PostgreSQL 16 / Prisma ORM, Stripe Payments, and Render Cloud Deployment):

## Core Specifications
- `00-project-charter.md` — Vision, objectives, and stakeholder matrix
- `01-business-requirements.md` — Product discovery, ordering, delivery windows, and blast-chilled guarantee
- `02-functional-requirements.md` — End-to-end user stories and functional boundary rules
- `03-non-functional-requirements.md` — Performance, availability, accessibility, and WCAG AA compliance
- `04-system-architecture.md` — Monorepo design, clean separation of concerns, and data flows
- `05-frontend-specification.md` — Next.js App Router, Tailwind CSS, design tokens, and components
- `06-backend-specification.md` — NestJS controllers, services, guards, and middleware
- `07-database-specification.md` — PostgreSQL 16 schema, Prisma models, constraints, and indexes
- `08-api-contracts.md` — OpenAPI contracts for RESTful endpoints and error schemas
- `09-security-specification.md` — JWT session tokens, role-based access control, and sanitization
- `10-payment-specification.md` — Stripe payment intents, raw-body webhook verification, and 3-tier refunds
- `13-deployment-specification.md` — Render, Docker, environment templates, and CI/CD pipelines
- `14-testing-strategy.md` — Jest unit tests, Playwright E2E tests, and regression gates
- `15-acceptance-criteria.md` — Strict definition of done and production readiness checklist
- `16-risk-register.md` — Technical and operational risks and mitigations
- `17-implementation-roadmap.md` — Phased epic milestones and deliverables
