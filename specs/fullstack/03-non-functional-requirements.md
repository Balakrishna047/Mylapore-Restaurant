# Non-Functional Requirements: Mylapore Express

- **Document ID**: NFR-ME-03
- **Version**: 2.0

---

## 1. Performance & Latency Targets
- **NFR-P01 (Page Load Time)**: First Contentful Paint (FCP) < 1.2s, Largest Contentful Paint (LCP) < 2.0s on 4G mobile networks.
- **NFR-P02 (API Response Time)**: 95th percentile API response time < 180ms for catalog reads, < 350ms for order creation and state transitions.
- **NFR-P03 (Database Throughput)**: PostgreSQL pool configured for 100 concurrent checkout connections with connection pooling (e.g. Prisma connection pool / PgBouncer on Render).

## 2. Security & Compliance
- **NFR-S01 (PCI-DSS Scope Minimization)**: Zero credit card numbers or CVVs ever touch Mylapore Express application servers. Stripe Elements / SDK is utilized client-side.
- **NFR-S02 (Authentication & Passwords)**: Passwords hashed using bcrypt (12 salt rounds) or Argon2. JWT tokens signed with SHA-256 with 24-hour expiration for access tokens and 7-day refresh tokens.
- **NFR-S03 (OWASP Top 10 Protections)**:
  - Input validation on all DTOs using `class-validator` / `zod`.
  - SQL injection mitigated via Prisma parameterized query engine.
  - Rate limiting on sensitive endpoints (`/auth/login`, `/checkout`, `/orders`) using NestJS Throttler.
  - Strict Content-Security-Policy (CSP), CORS, and HTTP security headers via `helmet`.

## 3. Reliability & Availability
- **NFR-R01 (Uptime Target)**: 99.9% availability on Render Web Services and PostgreSQL.
- **NFR-R02 (Graceful Degradation)**: If external CRM (Salesforce) or background worker is unreachable, core restaurant ordering and customer checkout continue uninterrupted using dead-letter retry queues.
- **NFR-R03 (Auditability)**: Immutable append-only audit trail for all order cancellations, refunds, staff overrides, and administrative actions.

## 4. Accessibility & Mobile Responsiveness
- **NFR-A01 (Accessibility)**: Conformance with WCAG 2.1 Level AA standards including keyboard navigation, ARIA landmarks, screen-reader readable color contrast ratios (> 4.5:1), and descriptive alt attributes on all food imagery.
- **NFR-A02 (Responsive Viewports)**: Flawless layout on 320px mobile viewports up to 4K ultra-wide screens.
