# Sprint Plan — Salesforce + Agentforce

**Suggested cadence:** 2-week sprints.  
**Total:** 8 sprints / 16 weeks. Adjust to org access and licensing.

## Sprint 0 — Discovery and environment readiness (Week 0–1)
**Goal:** prove platform access and settle architecture blockers.

Stories:
- S0-01 inventory Salesforce editions, licenses, Agentforce and API access.
- S0-02 inventory Copado edition, pipeline type and connected org capability.
- S0-03 create Salesforce DX repository and DEV org connection.
- S0-04 choose Embedded Messaging or custom Agent API proof of concept.
- S0-05 choose CRM identity model and integration authentication.
- S0-06 establish architecture decision records.

Exit:
- Environment matrix approved.
- Agentforce and channel capabilities proven.
- Copado test promotion completed with sample metadata.
- No critical unknown that invalidates the selected chat architecture.

## Sprint 1 — Salesforce foundation (Weeks 2–3)
**Goal:** deploy core CRM/service metadata.

Stories:
- Create custom outlet reference object.
- Configure Account/Contact model.
- Configure Case fields, record types and layouts.
- Create permission sets and integration user.
- Configure Named/External Credentials.
- Configure queues and initial Case routing.
- Establish Apex test conventions and metadata pipeline.

Exit:
- DEV and QA contain matching baseline metadata.
- Permission matrix passes positive and negative tests.
- Case can be created by approved integration path.

## Sprint 2 — NestJS integration gateway (Weeks 4–5)
**Goal:** secure Salesforce-to-commerce action boundary.

Stories:
- Implement Agent Gateway endpoints.
- Implement token validation, scopes, subject binding and revocation.
- Implement menu search and item detail actions.
- Implement order status action with ownership enforcement.
- Define typed error envelope and correlation IDs.
- Add contract tests and API documentation.

Exit:
- Agent actions cannot select another customer identity.
- Menu and order APIs pass authorization tests.
- API contract is versioned and published.

## Sprint 3 — Agentforce Customer Assistant (Weeks 6–7)
**Goal:** implement read-only customer assistant.

Stories:
- Configure Customer Assistant agent and subagents.
- Add menu discovery, item detail, availability and outlet actions.
- Add order status/timeline action.
- Add grounding and global guardrails.
- Create utterance and negative test suites.
- Configure selected customer channel in DEV.

Exit:
- Menu/order facts are live-action grounded.
- Hallucination and IDOR negative tests pass.
- Agent timeout fallback works.

## Sprint 4 — Lightning rich chat and image cards (Weeks 8–9)
**Goal:** deliver visual customer chat.

Stories:
- Build Lightning Type schema and supported LWC renderer POC.
- Build Salesforce console LWCs for internal service context.
- Build/skin website chat integration or custom React renderer.
- Render image cards, price, availability, tags and alt text.
- Add quick replies, loading, retry and fallback states.
- Validate mobile, keyboard and screen-reader behavior.

Exit:
- Menu image cards work in the actual selected website channel.
- Card actions are safe and route to backend validation.
- Unsupported channel limitations documented.

## Sprint 5 — Service Cloud and human handoff (Weeks 10–11)
**Goal:** operationalize customer support.

Stories:
- Configure Knowledge categories and seed approved articles.
- Build Case create/update actions.
- Configure routing queues and Omni-Channel if licensed.
- Build handoff payload and interaction summary.
- Configure Case SLA/escalation automation.
- Build Case/order context panel.

Exit:
- Customer can create Case from chat.
- Human agent receives identity assurance, order reference and summary.
- Queue unavailable fallback tested.

## Sprint 6 — Side-effect workflows (Weeks 12–13)
**Goal:** cancellation, reschedule and refund request with controls.

Stories:
- Add cancellation preview/execute actions.
- Add reschedule preview/execute actions.
- Add refund eligibility and review request.
- Add idempotency and audit events.
- Add approval and exception routing.
- Test race conditions and duplicate retries.

Exit:
- No consequential action occurs without confirmation.
- Refund request is not reported as completed refund.
- Backend policy is authoritative.

## Sprint 7 — Copado hardening, UAT and release readiness (Weeks 14–15)
**Goal:** production-ready release candidate.

Stories:
- Complete Copado pipeline and quality gates.
- Run Apex, LWC, Flow, API, agent and channel regression.
- Run security/privacy review and permission audit.
- Run outbox/replay and outage drills.
- Complete runbooks, monitoring and support training.
- UAT sign-off and release rehearsal.

Exit:
- All P0/P1 defects closed.
- Rollback/feature-disable plan rehearsed.
- Business, service, security and release owners approve.

## Sprint 8 — Production launch and hypercare (Week 16)
**Goal:** controlled release and measured stabilization.

Stories:
- Deploy Salesforce metadata via Copado approval path.
- Deploy compatible backend/frontend release separately.
- Enable limited pilot outlet/customer cohort.
- Monitor agent quality, Case routing, image failures and sync lag.
- Review daily incidents and customer feedback.
- Expand rollout only after agreed thresholds.

Exit:
- Hypercare exit criteria met.
- Ownership transitions to operations.
- Known issues and next roadmap approved.

## Cross-sprint Definition of Done
- Story acceptance criteria met.
- Apex/LWC/Flow/API/agent tests pass as applicable.
- Permission and negative tests pass.
- Copado promotion evidence captured.
- No secrets or sensitive PII in source/logs.
- Monitoring and runbook updated.
- Business owner accepts behavior.
