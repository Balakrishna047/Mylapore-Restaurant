# Antigravity Runbook — Safe Spec-Driven Execution

## 1. Before starting
1. Open the actual project repository as the Antigravity workspace.
2. Place this specification pack under `/docs` and `AGENTS.md` at repository root.
3. Confirm Git branch and working tree. Commit or stash unrelated changes.
4. Do not paste credentials into prompts or source files.
5. Confirm local Node.js/package manager/PostgreSQL/Salesforce CLI/Copado access required for the current phase.

## 2. Initial audit prompt

Use this prompt first:

> Read `AGENTS.md` and every file in `/docs`. Do not write or modify files yet. Audit the current repository and report: (1) existing architecture and framework versions, (2) current app structure, (3) existing backend modules and routes, (4) database schema and migrations, (5) authentication and authorization, (6) payment implementation, (7) tests and CI, (8) Salesforce metadata and deployment configuration, (9) deployment configuration, (10) gaps against each specification. Classify each finding as Implemented-and-tested, Implemented-but-unverified, Partial, Missing, or Blocked. Cite exact file paths and symbols. Do not infer implementation from documentation. Propose a phased plan that preserves existing working code. Stop before modifying anything.

## 3. Implementation prompt template

> Implement only story `[STORY-ID]` from `/docs/IMPLEMENTATION_TASKS.md`, following `/AGENTS.md` and all relevant specifications. First inspect existing code and dependencies. Do not rebuild existing functionality or introduce unapproved technology. State plan and affected files, then implement the smallest complete vertical slice. Update OpenAPI/schema/migrations/tests/docs as required. Run formatting, lint, typecheck, relevant unit/integration tests and build. Do not mark complete if a test cannot run. Report files changed, exact commands/results, acceptance criteria, risks and remaining work. If a requirement conflicts with existing code or a locked ADR, stop and explain before changing the decision.

## 4. Recommended execution sequence
1. Audit only.
2. Resolve V-01 to V-11 blockers as relevant.
3. Build Sprint 1 vertical slice and demo.
4. Build Sprint 2; verify quote arithmetic with fixtures.
5. Build Sprint 3 in Stripe test mode; never enable live payment yet.
6. Build Sprint 4 with mock kitchen/delivery.
7. Build Salesforce metadata and outbox in a sandbox/dev org.
8. Prove Agentforce identity/session integration with a minimal POC before implementing the agent portfolio.
9. Add Service Agent and refund approval after backend refund policy is tested.
10. Complete regression, security, restore, UAT and release gates.

## 5. Required Antigravity behavior
- Do not generate all application code in one prompt.
- Do not change the architecture because a library suggests a shortcut.
- Do not assume a successful frontend redirect means payment succeeded.
- Do not call Salesforce synchronously in checkout transaction.
- Do not let the LLM pass customer ID or authorize refund.
- Do not fabricate Salesforce metadata support or licence availability.
- Do not use fake API responses in production paths; mocks must be isolated and labelled.
- Do not delete or overwrite existing files without explaining the impact.
- Do not add environment secrets to `.env.example`; include placeholder variable names only.
- Do not call a story complete until tests prove it.

## 6. Environment variables (names only; values supplied securely)
Frontend:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

Backend:
- `DATABASE_URL`
- `SESSION_COOKIE_NAME`
- `SESSION_SIGNING_SECRET` or key reference
- `AGENT_SESSION_SIGNING_KEY`
- `AGENT_SESSION_ISSUER`
- `AGENT_SESSION_AUDIENCE`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SALESFORCE_BASE_URL`
- `SALESFORCE_CLIENT_ID` / secret reference as supported by External Credentials
- `SALESFORCE_NAMED_CREDENTIAL` (metadata/config reference)
- `SENTRY_DSN`
- `APP_ENV`
- `CORS_ALLOWED_ORIGINS`

Never expose secret values to frontend `NEXT_PUBLIC_*` variables.

## 7. Local developer workflow
- Install dependencies using the lockfile's package manager.
- Start PostgreSQL using the approved local setup.
- Apply migrations in a disposable development database.
- Seed deterministic menu/outlet fixtures.
- Start API, storefront and worker.
- Run unit/integration/E2E tests.
- Use Stripe test mode and webhook forwarding only in local/dev.
- Use Salesforce sandbox/dev org for metadata and integration testing.
- Verify all test data is clearly marked and resettable.

## 8. Completion report format
- Story ID and objective.
- Baseline inspected.
- Plan.
- Files changed.
- Migration/API/metadata impact.
- Tests run (exact command and result).
- Acceptance criteria status.
- Security review.
- Known limitations.
- Next story recommendation.
