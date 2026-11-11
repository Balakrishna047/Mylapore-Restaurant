# AGENTS.md — Mylapore Express Engineering Agent Contract

## 1. Mission

Build Mylapore Express as a reliable restaurant commerce platform with an Agentforce conversational layer and Salesforce Service Cloud support operations. Work from the specifications in `/docs`. The source of truth for decisions is `DECISION_LOG.md`; the product contract is `PRD.md`; API contract is `API_SPEC.yaml`.

## 2. Non-negotiable architecture rules

- Next.js is the presentation layer. Never put authoritative pricing, payment, order, refund or authorization rules in browser code.
- NestJS is the business transaction and authorization boundary.
- PostgreSQL is the operational source of truth for customers' commerce profile, menu, outlet availability, carts, quotes, orders, payments, refunds, kitchen and delivery events.
- Salesforce stores CRM/service records and clearly labelled snapshots. Salesforce order/payment snapshots are not the live source of truth.
- Agentforce may interpret intent and request an action. It must never invent facts or independently execute money movement.
- Normal browse, cart, checkout and order APIs must remain usable when Salesforce or Agentforce is unavailable.
- Every customer-owned resource lookup must be scoped to the authenticated principal. Ignore customer IDs supplied by the LLM or request body.
- Every mutation that can be retried must be idempotent.
- Every order/payment/refund/delivery transition must be validated by a state-transition service and written to an audit/event history.
- Do not log secrets, full payment credentials, OTPs, raw access tokens or unnecessary sensitive conversation content.

## 3. Technology baseline

- Frontend: Next.js, React, TypeScript.
- Backend: NestJS, TypeScript, REST, OpenAPI 3.1.
- Data: PostgreSQL, Prisma.
- Payments: Stripe through a `PaymentProvider` interface. Verify Stripe account eligibility, India-specific methods and settlement before enabling real payments.
- CRM/AI: Salesforce Service Cloud and Agentforce.
- Deployment: Vercel for Next.js and Render or equivalent for NestJS/PostgreSQL; deployment provider is configurable.
- CI: GitHub Actions for app; Copado for Salesforce metadata promotion.
- Redis: optional only after a measured requirement.
- Monitoring: structured JSON logs, correlation IDs, Sentry or equivalent.

Do not upgrade major versions or introduce new infrastructure without recording the reason and migration impact.

## 4. Work protocol

Before coding:
1. Inspect the repository tree, package manifests, lockfiles, current branch, uncommitted changes and existing conventions.
2. Inspect current Prisma schema/migrations and tests before proposing schema changes.
3. Inspect Salesforce metadata and org capabilities before assuming Agentforce APIs, action bindings, licences or Omni-Channel features exist.
4. Map the requested work to an epic/story in `IMPLEMENTATION_TASKS.md`.
5. State assumptions and identify blockers. Never fabricate credentials, org IDs, API versions, provider capabilities or environment variables.

During coding:
1. Implement one vertical slice at a time.
2. Keep modules cohesive; avoid circular imports.
3. Validate DTOs at the API boundary.
4. Use decimal-safe money representation: integer minor units (paise) in persistence and API contracts; do not use floating-point arithmetic for money.
5. Add migrations, tests, OpenAPI updates and audit events with each relevant feature.
6. Use transactions for related financial and order-state writes.
7. Use an outbox for reliable Salesforce/event delivery.
8. Use adapters for payment, POS and delivery providers.
9. Keep secrets in environment/secret management, never source control.
10. Update documentation when behavior or contract changes.

After coding:
1. Run formatting, lint, typecheck, unit tests, integration tests relevant to the change and build.
2. Report exact commands and pass/fail results.
3. Identify unrun tests and environment blockers honestly.
4. Do not mark a story Done if its acceptance criteria or required tests are incomplete.

## 5. Security rules

- Use secure, HttpOnly, SameSite cookies for browser sessions where applicable.
- Apply CSRF protection to cookie-authenticated state-changing browser requests.
- Use short-lived signed chat-session identity tokens with `sub`, `session_id`, `aud`, `exp`, `jti` and scopes.
- Validate JWT signature, issuer, audience, expiry, revocation/session status and action scope.
- Identity claims are server-created context, never model-writable action inputs.
- Return the same `ORDER_NOT_FOUND` response for nonexistent and non-owned orders.
- Enforce role and outlet scope in backend guards/services, not only in UI.
- Verify Stripe webhook signatures against the raw request body; validate event type, amount, currency and provider object reference.
- Store webhook event IDs with a unique constraint; process each event once.
- Require explicit confirmation for checkout, cancellation, rescheduling and refund requests.
- Use step-up verification for sensitive account changes and high-risk actions.
- Apply rate limits, request size limits, input validation, output minimization and prompt-injection defenses.

## 6. Agentforce rules

- Agent instructions are not a substitute for backend authorization.
- Expose narrowly scoped actions; prefer fewer than or equal to eight actions per subagent.
- Read menu, price, stock, order and payment facts from NestJS actions.
- The model may suggest; the backend validates.
- Never expose internal stack traces, Salesforce IDs, provider secrets or another customer's records.
- Set a bounded action/turn budget and loop detection.
- Hand off uncertain, high-risk, policy-exception and emotionally escalated cases to a human.
- Record a safe interaction summary and outcome; avoid storing unnecessary full transcripts.

## 7. Data and code quality

- Use UTC timestamps in storage; convert to outlet/customer timezone at presentation.
- Use explicit currency codes. INR is the v1 default only after product/business confirmation.
- Use immutable order-line snapshots for item name, SKU, selected modifiers, quantity and unit price at order time.
- Add unique constraints for external IDs and provider transaction IDs.
- Prefer expand-and-contract database migrations.
- No destructive production migration without backup, rollback plan and approval.
- Do not seed production with demo credentials or fake payment success.

## 8. Definition of Done

A story is Done only when:
- Acceptance criteria pass.
- Authorization and negative-path tests exist.
- Relevant API/schema/docs are updated.
- Lint, typecheck, tests and build pass.
- Observability and audit behavior are present where needed.
- No secrets or sensitive data are exposed.
- A reviewer can reproduce the result from documented commands.
- Deployment and rollback implications are documented.

## 9. Required response format for each Antigravity task

Return:
1. Scope and files inspected.
2. Plan and assumptions.
3. Files changed and why.
4. API/schema/metadata changes.
5. Tests run with exact results.
6. Risks, blockers and follow-up tasks.
7. Acceptance criteria checklist.

Never claim “implemented” based only on generated code. Verify the working tree and execute tests.
