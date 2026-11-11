# 08 — Salesforce Service Cloud and Agentforce Specification

## Salesforce data model proposal
| Object | Purpose | External key |
|---|---|---|
| Account/Contact or Person Account | Customer CRM identity | External_Customer_ID__c |
| Case | Support issue | External_Support_Request_ID__c |
| Knowledge | Approved support content | Salesforce Knowledge identity |
| Restaurant_Order__c | CRM-facing order summary | External_Order_ID__c |
| Payment_Transaction__c | Payment reference/status summary | External_Payment_ID__c |
| Refund_Request__c | Refund request and approval summary | External_Refund_ID__c |
| Restaurant_Outlet__c | Outlet reference | External_Outlet_ID__c |
| Agent_Interaction__c | Minimal interaction/action summary | External_Interaction_ID__c |

The Account model must be decided by ADR. Confirm actual org capabilities, licenses, limits, field-level security, API access and Copado metadata support.

## Agent deployments
### Customer Commerce Agent
- Search menu and outlet.
- Explain verified item details and allergen data.
- Recommend from available catalog facts.
- Add/update cart after customer intent.
- Produce quote and explain price breakdown.
- Guide checkout.
- Read own order/payment status.
- Check cancellation/reschedule eligibility.
- Submit confirmed eligible requests.

### Customer Service Agent
- Answer approved Knowledge questions.
- Capture complaint and create support request/Case.
- Read scoped order/payment facts.
- Request refund review.
- Escalate to human with context.

### Restaurant Management Agent (later phase)
- Outlet-scoped performance summaries.
- Stock/kitchen/delivery exception summaries.
- No unrestricted customer PII or autonomous financial writes.

## Agent action contract rules
- Every action has strict JSON schema, version, timeout, auth scope and stable error codes.
- Signed identity context is injected by trusted gateway; model cannot select subject/customer ID.
- Read actions are preferred initially.
- Side-effect actions require preview, confirmation and idempotency.
- Refunds and high-risk exceptions require human approval.
- Tool output is factual and bounded; model must not infer unavailable values.
- Log action name/version, subject reference, session, correlation ID, result code and latency; minimize PII.

## Identity propagation
1. Customer authenticates with NestJS.
2. Server creates chat session bound to customer/guest identity and expiry.
3. Gateway issues short-lived signed token with subject, audience, session, scopes and token ID.
4. Agentforce action call reaches gateway server-to-server.
5. Gateway validates signature, audience, expiry, session revocation and scope.
6. Backend query is scoped to authenticated subject.
7. Browser and model never receive Salesforce integration credentials.

This must be proven in the actual Agentforce channel/action implementation. A Salesforce service credential alone does not identify the end customer.

## Human handoff payload
- Verified customer/guest identity level.
- Chat/session reference.
- Outlet and order reference.
- Issue category/severity.
- Concise conversation summary.
- Actions already attempted and results.
- Backend correlation ID and safe error codes.
- Contact preference and consent.
Do not claim a human has joined until the channel confirms handoff.

## Evaluation suite
- Correct menu answer from source data.
- No hallucinated stock, price, allergen or ETA.
- Cross-customer order access denied.
- Prompt injection in menu/review content does not change tool permissions.
- Customer confirmation required before side effects.
- Refund policy respected.
- Human handoff preserves context.
- Agent outage falls back to non-agent support.
