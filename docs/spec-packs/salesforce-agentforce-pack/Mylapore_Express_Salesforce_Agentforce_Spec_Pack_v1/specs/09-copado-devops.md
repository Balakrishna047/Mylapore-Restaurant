# 09 — Copado Org Strategy, Pipeline and Release Governance

## 1. Environment model

Copado tracks Salesforce environments and promotes versioned changes through a release pipeline. Confirm whether the organization uses Copado Source Format / 2nd Generation pipelines or Metadata Format / legacy pipelines; do not mix instructions or assume every CLI feature applies to both.

Recommended path:

`DEV → QA → UAT → PROD`

Optional hotfix path:

`PROD hotfix branch → DEV validation → QA regression → UAT/approval → PROD`

## 2. Org connection setup

In Copado:
1. Confirm Copado package/version and license edition.
2. Identify the Copado admin and release manager.
3. Connect each Salesforce org using the supported authentication method.
4. Verify org identity, username, instance and connection health.
5. Assign org roles and environment type.
6. Configure repository and branch strategy.
7. Configure pipeline stages and promotion order.
8. Configure quality gates and test execution.
9. Configure deployment user/permissions.
10. Run a harmless metadata deployment to DEV/QA before real stories.

Do not store Copado credentials in project files. Exact screens and terminology differ by Copado edition and pipeline type.

## 3. Source control strategy

Suggested branch model:
- `main` — production baseline.
- `develop` — integration branch.
- `feature/MEX-123-case-routing` — isolated story branch.
- `release/1.0.0` — release candidate.
- `hotfix/MEX-456-payment-case` — emergency fix.

For Source Format pipelines, follow Copado's source-format workflow and documented branch/commit/promote semantics. If using Metadata Format, follow that pipeline's supported workflow instead.

## 4. Work item lifecycle

1. Create story with acceptance criteria.
2. Developer creates feature branch / Copado user story as configured.
3. Retrieve/commit changed metadata.
4. Review dependencies and destructive changes.
5. Run local checks and Apex tests.
6. Promote to QA.
7. Run regression, permissions and Agentforce channel tests.
8. Promote to UAT after QA approval.
9. Business owner signs acceptance.
10. Release manager approves production promotion.
11. Deploy and run smoke tests.
12. Record deployment ID, test evidence and rollback/forward-fix plan.

## 5. Quality gates

Required:
- Metadata validation/deployment check.
- Apex tests and coverage review (coverage threshold alone is not quality).
- LWC Jest tests where used.
- Static code/security analysis.
- Permission and sharing review.
- Flow validation.
- Agent utterance/action regression.
- API contract tests.
- No hard-coded secrets or org IDs.
- No unexpected destructive changes.
- Dependency and API version compatibility.
- Manual approval before production.

## 6. Salesforce versus application deployment

Copado deploys Salesforce metadata. It does not replace:
- Next.js deployment;
- NestJS deployment;
- PostgreSQL migrations;
- Stripe configuration;
- CDN assets;
- external secrets/configuration.

Coordinate releases with an application release manifest and backward-compatible API changes. Deploy backend compatibility first where needed, then Salesforce metadata, then enable features using controlled configuration.

## 7. Rollback and recovery

- Salesforce metadata rollback is not always a simple inverse deployment; prepare a forward-fix and known-good commit.
- Preserve prior metadata commit and deployment logs.
- For destructive changes, use explicit approval and dependency analysis.
- Disable agent/action/channel configuration if a production agent causes harm.
- Revert backend feature flags independently.
- Never assume database rollback is safe after customer transactions; use forward migrations and reconciliation.

## 8. Copado proof-of-capability checklist

- [ ] Confirm product edition and pipeline type.
- [ ] Confirm connected DEV, QA, UAT and PROD orgs (as available).
- [ ] Confirm Git provider/repository.
- [ ] Confirm service account and OAuth access.
- [ ] Confirm branch strategy.
- [ ] Confirm Apex test execution.
- [ ] Confirm Agentforce metadata representation/deployment support.
- [ ] Confirm Lightning Types and LWC metadata deploy.
- [ ] Confirm Named Credential/External Credential secret handling.
- [ ] Confirm permission set and profile deployment behavior.
- [ ] Confirm quality gate and approval capability.
- [ ] Run a sample end-to-end promotion and capture evidence.

## 9. Important caution

Copado capabilities and terminology vary across product editions and pipeline generations. The official Copado docs describe separate pipeline families and edition-specific setup. Validate against the licensed product in your workspace before treating this file as a click-by-click screen guide.
