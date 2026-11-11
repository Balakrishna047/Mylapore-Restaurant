# 07 — Security, Privacy and AI Governance

## 1. Threat model

Threats include account takeover, order enumeration, IDOR, forged identity, prompt injection, malicious menu content, replayed actions, webhook spoofing, excessive Salesforce permissions, PII leakage, image URL abuse, credential exposure and integration outage.

## 2. Controls

| Risk | Required control |
|---|---|
| Customer accesses another order | Server-side subject/order ownership check |
| LLM changes customer ID | Ignore caller-supplied identity; derive from token |
| Duplicate cancellation/refund | Idempotency + state transition lock |
| Prompt injection | Allowlisted actions, instruction hierarchy, untrusted content treatment |
| Forged payment status | Signed Stripe webhook + reconciliation |
| Salesforce data overexposure | Permission sets, FLS, sharing, scoped Apex |
| Token replay | Short TTL, `jti`, session lookup, replay detection |
| Image URL abuse | HTTPS + host allowlist + URL validation |
| PII in logs | Structured redaction and retention |
| Salesforce outage | Outbox, retries, dead-letter and replay |
| Agent hallucination | Grounding and no-action fallback |

## 3. Salesforce controls
- Dedicated integration user per environment.
- OAuth-based auth; no username/password flow unless explicitly approved and justified.
- Least privilege object/field permissions.
- Restrict API access and connected app policies.
- Named Credentials for outbound callouts.
- Review guest user profile and sharing; never grant broad record access.
- Separate staff roles and outlet access.
- Use Shield/Event Monitoring only if licensed and justified.
- Review audit history and setup changes.

## 4. AI controls
- Agent actions are allowlisted and narrowly scoped.
- No arbitrary SOQL, DML or generic API action.
- Require confirmation for consequential actions.
- Human approval for refund exceptions and sensitive compensation.
- Knowledge content has owner and approval lifecycle.
- Never ask for OTP, password, CVV or full card number.
- Do not include unnecessary PII in prompts or action outputs.
- Provide refusal/fallback for unsupported or uncertain requests.
- Test adversarial prompts and untrusted menu/review text.

## 5. Privacy
- Define lawful purpose and consent for chat, analytics, marketing and notifications.
- Minimize transcript storage; store concise service summary where sufficient.
- Define retention, deletion, correction and access request workflows.
- Separate transactional messages from marketing consent.
- Review Indian DPDP Act/rules, applicable payment rules, GST and FSSAI obligations with qualified compliance/legal owners.
- Do not assume Salesforce or vendor defaults satisfy the business's legal obligations.

## 6. Security acceptance evidence
- Threat model reviewed.
- Permission matrix approved.
- Negative IDOR tests pass.
- OAuth/token validation tests pass.
- Webhook replay/signature tests pass.
- Prompt injection tests pass.
- Secrets scanning and dependency scanning pass.
- PII masking verified in logs and traces.
