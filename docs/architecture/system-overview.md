# Architecture Overview & System Topology

## 1. Domain Separation
The platform follows a modular monolith approach designed to minimize distributed transaction failures while retaining clean separation between modules:

1. **`apps/web`**: Next.js 14 App Router (React 18, Tailwind CSS, TanStack Query)
2. **`apps/api`**: NestJS 10 REST API Gateway with Swagger OpenAPI documentation
3. **`packages/shared-types`**: TypeScript interfaces, enums (`UserRole`, `OrderStatus`, `PaymentStatus`, `DietaryTag`, `SpiceLevel`)
4. **`packages/validation`**: Zod runtime schema validation

## 2. Source of Truth
- **PostgreSQL / Prisma**: System of Record for orders, customers, dishes, payments, and refunds.
- **Salesforce Service Cloud**: System of Record for CRM engagement, service cases, customer satisfaction, and escalation tickets.
- **Stripe**: PCI DSS tokenized payment processing engine.
