# 11 — DevOps, Observability and Release

## Environments
`local → DEV → QA → UAT → PROD`
Each environment has isolated DB, secrets, Stripe mode/account, Salesforce endpoint/org, webhook secrets, allowed origins and provider adapters. Never reuse production credentials in lower environments.

## CI pipeline
- Install locked dependencies.
- Format/lint/typecheck.
- Unit tests.
- Build.
- Secret/dependency scan.
- API/schema compatibility check.
- Migration validation.
- Integration/contract tests.
- Build immutable artifact.
- Deploy to environment with approval gates.
- Run smoke tests.

## Salesforce pipeline
- Version Salesforce metadata in source control.
- Validate dependencies and org-specific configuration.
- Use Copado for supported metadata promotion and approvals.
- Verify Agentforce assets and dependencies are supported by the actual Copado version/org.
- Keep Salesforce deployment separate from app deployment.
- Run post-deploy permission, API, action and Case smoke tests.

## Database release
- Use reviewed migrations.
- Prefer expand-and-contract for breaking schema changes.
- Back up before risky migration.
- Never use schema push as production migration process.
- Test restore and forward-fix/rollback plan.

## Observability
Structured logs include timestamp, service, environment, level, correlation ID, request ID, safe subject reference and operation. Exclude secrets and unnecessary PII.
Metrics:
- API latency/error rate.
- Checkout conversion and failure.
- Payment unknown/pending age and mismatch.
- Webhook processing delay/failure.
- Outbox backlog/dead letters.
- Salesforce sync lag.
- Kitchen acceptance time and rejection rate.
- Refund pending age/failure.
- Delivery failure rate.
- Agent action error/latency/escalation.
- Notification delivery failure.

## Runbooks
Create runbooks for duplicate charge suspicion, payment unknown, refund stuck, webhook outage, Salesforce outage, POS outage, delivery provider outage, suspected data breach, agent unsafe action, DB restore and failed deployment.
