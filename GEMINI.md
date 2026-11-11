# Google Antigravity & Gemini Project Directives: Mylapore Express

## Project Vision & Operating Principles
Mylapore Express is an authentic South Indian enterprise culinary e-commerce platform. The project is executed using **Spec-Driven Development (SDD)** with zero shortcuts:

1. **Enterprise Grade**: Monorepo architecture with clean separation of concerns (`apps/web`, `apps/api`, `apps/worker`, `packages/*`).
2. **PostgreSQL as Source of Truth**: All customer records, order lifecycle states, payments, and inventory live in normalized PostgreSQL with Prisma ORM.
3. **Strict State Machine**: Order transitions follow exact operational workflows (`PENDING_PAYMENT` -> `PAID` -> `CONFIRMED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`).
4. **Idempotent Financial Operations**: Signed webhooks, idempotent transaction keys, and backend-calculated pricing prevent duplicate charges, race conditions, or client-side tampering.
5. **Brand Authenticity**: High-fidelity visual identity matching the authentic South Indian heritage of Mylapore, Chennai: temple architectural iconography, warm sand/cream palette, terracotta accents, blast-chilled fresh meal preservation, allergen matrices, and spice scale levels.
