# 11 — Monitoring, Support and Production Operations

## 1. Correlation
Propagate a correlation ID across website, NestJS, Agentforce action, Salesforce Case and outbox event. Never use customer email or phone as a trace identifier.

## 2. Metrics
- Agent action success/error/timeout rate.
- Tool calls per conversation and average latency.
- Unsupported intent and human handoff rate.
- Menu card image failure rate.
- Agent API cost/consumption where available.
- Case creation latency and duplicate rate.
- Queue wait and abandonment.
- Salesforce sync lag and outbox backlog.
- Payment/refund projection mismatch.
- API 4xx/5xx and p95 latency.

## 3. Alerts
- Agent action failure above threshold.
- Salesforce outbox backlog age above threshold.
- Case creation failures.
- Handoff queue unavailable.
- Unauthorized access spikes.
- Payment/refund reconciliation mismatch.
- Integration credential expiry/rotation failure.
- Agent behavior regression after deployment.

## 4. Runbooks
Create runbooks for:
- Agentforce disabled or unavailable.
- Embedded Messaging deployment unavailable.
- Named Credential/OAuth failure.
- Salesforce API limit exceeded.
- Outbox backlog/dead-letter replay.
- Duplicate Case creation.
- Wrong order projection in Salesforce.
- Agent returns incorrect menu information.
- Prompt injection/security incident.
- Copado deployment failure.
- Production rollback/feature disable.

## 5. Human ownership
Assign named business/technical owners for Agentforce content, Salesforce admin, integration platform, customer support, privacy/security, release management and incident command.
