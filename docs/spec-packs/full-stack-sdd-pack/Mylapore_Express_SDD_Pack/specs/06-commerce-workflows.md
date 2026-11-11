# 06 — Commerce Workflows and State Machines

## A. Browse to cart
1. Resolve selected outlet and validate it is published/open or clearly show closed status.
2. Fetch menu version and item availability.
3. Validate item/modifier selection on backend.
4. Add/update cart with server response as authoritative.
5. Revalidate menu version and availability when quote is created.

## B. Quote and checkout
1. `POST /quotes` computes all line amounts and totals.
2. Quote includes `quoteId`, `expiresAt`, outlet, fulfilment method, line snapshots, fees, tax, discount, grand total and currency.
3. Checkout checks quote ownership, expiry, outlet status, serviceability, slot capacity, minimum order, current price and stock.
4. If anything changed, return `QUOTE_STALE` or a structured re-quote response; do not silently charge a changed amount.
5. Reserve stock atomically with expiry.
6. Create order in `AWAITING_PAYMENT`, payment attempt and outbox command.
7. Provider interaction happens outside DB transaction.
8. Only verified provider success permits paid/placed progression.

## C. Payment lifecycle
`CREATED → REQUIRES_ACTION / PROCESSING → SUCCEEDED | FAILED | CANCELLED | UNKNOWN`
- UNKNOWN is a first-class state requiring provider retrieval/reconciliation.
- Browser success URL is informational only.
- Webhook inbox stores event before processing.
- Duplicate provider event ID is ignored after first durable acceptance.
- Amount, currency, provider account and internal mapping must match.

## D. Order lifecycle
Illustrative states:
`AWAITING_PAYMENT → PLACED → ACCEPTED → PREPARING → READY → COMPLETED`
Alternative branches: `REJECTED`, `CANCEL_REQUESTED`, `CANCELLED`, `EXPIRED`, `DELIVERY_FAILED`.
Every transition validates actor, current state, business rule, version and evidence. No arbitrary status PATCH endpoint.

## E. Refund lifecycle
`REQUESTED → PENDING_APPROVAL → APPROVED → SUBMITTED → PROCESSING → SUCCEEDED`
Failure/decline branches: `REJECTED`, `FAILED`.
A refund request is not a refund success. Provider call is asynchronous. Partial refunds are supported only with cumulative amount guard and line-level policy if business requires it.

## F. Reschedule
- Check current order state and cutoff.
- Check new slot capacity and outlet hours.
- Recalculate delivery fee/tax/price differences.
- Present exact changes to customer.
- Require explicit confirmation.
- Persist request and apply atomic transition/reservation update.
- If additional payment is required, do not apply schedule change until payment succeeds.
- If price decreases, create policy-governed refund/credit; never silently retain an unexplained difference.

## G. Cancellation
- Check state/cutoff and kitchen progress.
- Return eligibility, reason and financial consequence.
- Require explicit confirmation.
- If paid, create refund request when policy requires; cancellation and refund remain separate state machines.
- If kitchen has started, require configured manager review where appropriate.

## H. Inventory reservation
`HELD → CONSUMED | RELEASED | EXPIRED`
- Reservation TTL is configurable.
- Expiry worker releases held stock.
- Late payment success after expiry follows explicit policy: re-reserve if possible, otherwise submit refund workflow and alert.
- Use atomic conditional updates/locks and concurrency tests.

## I. Kitchen/POS
- Paid/placed order emits durable kitchen dispatch event.
- Adapter sends to POS/KDS or internal kitchen screen.
- Acknowledgement and every update is idempotent.
- Acceptance timeout creates alert and configured rejection/escalation path.
- Rejection of a paid order initiates customer notification and refund review.
- POS outage does not lose order; retry and show pending kitchen acceptance.

## J. Delivery/pickup
- Validate fulfilment mode at quote and checkout.
- Pickup requires ready state and verification code/QR where configured.
- Delivery includes assignment, pickup, transit, proof, failed reason and recovery.
- Delivery state is separate from order/payment state.
- COD, if enabled, requires cash ledger and shift reconciliation.

## K. Salesforce and Agentforce outage
- Persist commerce/support events locally.
- Retry Salesforce sync via outbox and show sync lag operationally.
- Core commerce remains functional without Agentforce.
- Provide standard support form/contact route if chat is unavailable.
