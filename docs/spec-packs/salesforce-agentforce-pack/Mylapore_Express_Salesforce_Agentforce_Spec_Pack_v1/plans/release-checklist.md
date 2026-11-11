# Salesforce Release Readiness Checklist

## Org and access
- [ ] Correct target org and environment verified.
- [ ] Agentforce entitlement and channel availability verified.
- [ ] Copado pipeline type/edition confirmed.
- [ ] Integration user and permission sets reviewed.
- [ ] MFA and OAuth policies verified.

## Metadata
- [ ] Source committed and peer reviewed.
- [ ] Dependencies and API versions checked.
- [ ] Apex tests pass.
- [ ] LWC Jest tests pass.
- [ ] Flow validation passes.
- [ ] Agent metadata deployment validated.
- [ ] Lightning Type and renderer metadata validated.
- [ ] Named Credential references deployed; secrets provisioned securely.
- [ ] No unintended destructive changes.

## Functional
- [ ] Menu images and cards render in target channel.
- [ ] Authenticated and guest flows tested.
- [ ] Order ownership negative tests pass.
- [ ] Case creation and routing pass.
- [ ] Handoff context is complete.
- [ ] Cancellation/reschedule preview and confirmation pass.
- [ ] Refund review path does not overstate status.

## Operations
- [ ] Monitoring and alerts enabled.
- [ ] Outbox retry/replay tested.
- [ ] Agent disable/rollback procedure tested.
- [ ] Human support queue coverage confirmed.
- [ ] Runbooks and owners assigned.
- [ ] UAT sign-off recorded.
- [ ] Production smoke tests prepared.
