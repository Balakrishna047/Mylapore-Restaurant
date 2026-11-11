# Product Requirements Document — Mylapore Express

**Version:** 1.0 | **Status:** Build baseline | **Product type:** Portfolio-grade restaurant e-commerce and AI service platform

## 1. Product vision

Mylapore Express lets customers discover restaurant food, customize items, place and pay for orders, track fulfilment and resolve issues through a responsive website. A conversational Agentforce experience reduces discovery and service friction. Restaurant staff operate orders through admin and kitchen interfaces; Salesforce Service Cloud manages Cases, knowledge, queues and human support.

The AI assistant is an additional way to use the shop—not a dependency for the shop to function.

## 2. Goals and measurable outcomes

### Product goals
- Enable end-to-end web ordering for pickup and delivery.
- Provide accurate menu, price, availability, quote and order information.
- Support payment confirmation through verified provider events.
- Give kitchen and delivery staff operational visibility.
- Provide conversational menu discovery, cart assistance and order support.
- Give support staff a unified Case workspace and safe escalation.
- Give owners operational and commercial reporting.

### KPI definitions
- Conversion rate = completed paid/COD-accepted orders ÷ eligible unique storefront sessions.
- Average order value = net order merchandise + applicable delivery/fees, excluding refunded amounts, divided by completed orders; finance must approve final accounting definition.
- Cart abandonment = carts with checkout intent but no placed order within configured window ÷ checkout-intent carts.
- Chat-assisted conversion = orders attributed to a chat session under a documented attribution window ÷ eligible chat sessions.
- First-contact resolution = Cases resolved without reopening or additional transfer within configured measurement window ÷ resolved Cases.
- Refund rate = refunded order value ÷ captured order value.
- Payment success rate = verified successful payment attempts ÷ eligible payment attempts.

Targets are not assumed. Establish a 4–8 week baseline before setting numeric targets.

## 3. Personas

| Persona | Needs | Permissions |
|---|---|---|
| Guest customer | Browse, build cart, checkout without account | Guest session and own guest cart/order with OTP verification |
| Registered customer | Saved details, own orders, tracking and support | Own customer data and commerce resources |
| Support agent | Investigate complaints and communicate | Assigned/queued Cases and permitted customer/order snapshots |
| Kitchen staff | Accept, prepare and complete food orders | Kitchen operations for assigned outlet |
| Outlet manager | Orders, availability, outlet performance | Assigned outlet scope |
| Finance | Payments, refunds and reconciliation | Financial views and approved refund workflow |
| Restaurant owner | Business performance and configuration | Authorized business-wide view |
| System administrator | Configuration and access | Least-privilege admin functions |

## 4. Scope

### V1 must-have
1. Responsive storefront and restaurant information.
2. Menu categories, search, item details, images, variants, modifiers, allergen/ingredient disclosures and outlet availability.
3. Cart, server-side pricing, promotions/coupons with basic rules, taxes/fees configuration.
4. Pickup and delivery checkout, address/service-zone validation, outlet and fulfilment slot selection.
5. Pending order creation, payment initiation, verified webhook confirmation, order history and tracking.
6. Order cancellation eligibility and reschedule request/validation.
7. Admin menu/outlet/order management.
8. Kitchen display: accept/reject, preparing, ready, dispatch/collection.
9. Delivery workflow through mock adapter; delivery provider integration deferred until vendor chosen.
10. Customer Commerce Agent: concierge, menu search/recommendation, cart guidance, order lifecycle and read-only payment status.
11. Customer Service Agent: FAQ/Knowledge, Case creation, complaint categorization, escalation and refund request workflow.
12. Service Cloud Cases, Contacts, Knowledge, queues, Email-to-Case and human support routing, subject to licence/org verification.
13. Outbox-based Salesforce synchronization, audit, monitoring and operational dashboards.
14. Role-based access and outlet scoping.

### V1 explicitly out of scope
- Data Cloud and MuleSoft.
- Microservices decomposition.
- Full loyalty/referral program.
- Advanced marketing automation and abandoned-cart campaigns.
- Predictive demand forecasting.
- Real POS integration before vendor selection.
- Real delivery-partner integration before vendor selection.
- Fully autonomous refunds or autonomous complaint closure.
- Multi-country tax and currency support.

## 5. Functional requirements

### FR-01 Storefront
- Show restaurant story, location, hours, delivery/pickup options, categories, promotions and featured items.
- Responsive mobile-first layout; accessible keyboard navigation and semantic labels.
- Show item availability and last-updated state where relevant.
- Show vegetarian/non-vegetarian indicators and verified allergen/ingredient data.
- Never infer allergen safety from an AI response.

**Acceptance:** customer can browse menu on mobile/desktop without login; unavailable items cannot be added to a valid checkout quote.

### FR-02 Menu management
- Admin can create/update/deactivate categories, products, variants, modifiers and combos.
- Maintain outlet-specific price, availability and preparation time.
- Record allergens, ingredients, dietary labels and source/verification status.
- Publish/unpublish changes with audit history.

**Acceptance:** every public menu response comes from backend; changes are reflected according to documented cache policy.

### FR-03 Cart and pricing
- Add/update/remove items and modifiers.
- Support guest and authenticated carts.
- Server calculates subtotal, discount, tax, fees, delivery and final amount.
- Revalidate price, promotion, outlet, stock and fulfilment before order creation.
- Cart quote has expiry/version.

**Acceptance:** changing browser-supplied price has no effect; stale quote is rejected and recalculated.

### FR-04 Checkout
- Choose delivery or pickup.
- Validate address, service zone, outlet, opening hours, kitchen capacity and slot.
- Display final quote and policy before explicit confirmation.
- Create order in `AWAITING_PAYMENT` for online payment.
- COD may transition to `PLACED` only when outlet and policy allow it.

**Acceptance:** duplicate submission with same idempotency key returns the same logical order; no order is marked paid from browser redirect.

### FR-05 Payments
- Use `PaymentProvider` abstraction with Stripe v1 adapter.
- Create provider payment intent server-side.
- Verify webhook signature using raw body.
- Verify provider object, order reference, amount and currency.
- Deduplicate provider event IDs and handle out-of-order events.
- Reconcile unresolved pending payments.

**Acceptance:** forged, duplicate, wrong-amount and wrong-currency events do not confirm an order.

### FR-06 Order lifecycle
- Display live order state from NestJS.
- Maintain separate order, payment, refund and delivery state machines.
- Record every transition with actor, reason, timestamp and correlation ID.
- Cancellation/reschedule are policy- and capacity-controlled requests.
- Completed orders are not rewritten; post-delivery problems become Cases.

**Acceptance:** illegal transitions are rejected and audited.

### FR-07 Kitchen and delivery
- Kitchen queue shows eligible paid/COD orders.
- Kitchen can accept/reject with reason, start preparation and mark ready.
- Acceptance timeout is configurable; paid rejected orders trigger refund workflow.
- Delivery adapter supports mock dispatch, assignment, pickup and delivered/failed states.

**Acceptance:** an order is never described as preparing until a kitchen event says so.

### FR-08 Customer Commerce Agent
- Natural-language menu discovery using current backend data.
- Recommendations constrained by price, availability and verified product attributes.
- Cart changes call backend actions.
- Checkout handoff displays authoritative quote and requires explicit customer confirmation.
- Order lookup and changes require session identity and authorization.
- Payment status is read-only.

**Acceptance:** model-supplied customer ID is ignored; cross-customer order lookup returns generic `ORDER_NOT_FOUND`.

### FR-09 Customer Service Agent
- Answer FAQs from approved Knowledge.
- Categorize complaint and gather only required details.
- Create or update Case with order reference and interaction summary.
- Route high-risk or policy-exception cases to humans.
- Refunds follow tiered approval and backend execution.

**Acceptance:** no refund is issued by prompt-only approval; every request is traceable to a Case and backend refund ID.

### FR-10 Admin, reporting and security
- Enforce roles and outlet scope on backend.
- Provide sales, orders, cancellation, refund, payment, preparation and delivery metrics.
- Log security-relevant actions and redact secrets.
- Provide data export/deletion request workflow subject to applicable law/policy.

## 6. Critical customer journeys

### Journey A — Guest browse to paid order
1. Guest opens storefront.
2. Frontend fetches active outlet/menu.
3. Guest selects item/modifiers.
4. Backend validates product and adds to guest cart.
5. Guest chooses delivery/pickup and provides required details.
6. Backend validates serviceability, outlet, slot and capacity.
7. Backend creates expiring quote.
8. Guest reviews amount and confirms.
9. Backend creates pending order and payment intent idempotently.
10. Payment provider completes customer payment.
11. Verified webhook updates payment and order transactionally.
12. Kitchen receives eligible order; acceptance event changes order state.
13. Customer sees live state and receives notification.
14. Outbox asynchronously syncs Salesforce snapshot.

### Journey B — Agent-assisted cart
1. Chat gateway creates session bound to guest/customer.
2. Agent asks menu action for verified menu data.
3. Agent shows products and asks which to add.
4. Agent calls cart action with product ID, quantity and modifiers only.
5. Backend validates session, availability and price.
6. Agent presents backend-calculated cart.
7. Customer moves to secure checkout page.
8. Checkout follows Journey A.

### Journey C — Track/cancel/reschedule
1. Agent obtains identity from signed session context.
2. Backend queries only orders owned by that principal.
3. Backend returns current order/payment/delivery states.
4. If cancel/reschedule requested, backend evaluates current state, policy and capacity.
5. Agent presents exact effect and asks for confirmation.
6. Backend executes allowed transition or creates a support request.
7. Audit and CRM event are emitted.

### Journey D — Complaint and refund
1. Customer verifies order access.
2. Agent classifies missing item, wrong item, quality, delivery or payment issue.
3. Agent creates Case with safe summary and evidence references.
4. Policy engine determines refund tier.
5. R1 deterministic system-caused failure may auto-approve under backend policy.
6. R2 low-value goodwill follows configured limits.
7. R3 high-value, disputed or sensitive requests require human approval in Salesforce.
8. NestJS revalidates approval and invokes provider refund.
9. Provider event/reconciliation confirms refund.
10. Case and customer are updated.

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Availability | Storefront and core commerce must degrade independently of Salesforce/Agentforce |
| Performance | Establish baseline; initial target p95 < 500 ms for common read APIs excluding external provider latency |
| Security | OWASP-aligned validation, auth, authorization, secrets, rate limits and audit |
| Reliability | Idempotency, transactional writes, outbox, retries, dead-letter handling and reconciliation |
| Accessibility | WCAG 2.1 AA target for key customer and staff flows |
| Scalability | Modular monolith with stateless API instances and indexed PostgreSQL |
| Observability | Correlation ID across web, API, payment, outbox and Salesforce |
| Privacy | Minimize transcripts and PII; retention and deletion policy documented |
| Recovery | Define and test backup, restore, RPO and RTO before production |
| Maintainability | API-first, module boundaries, tests and generated OpenAPI client/types |

## 8. Business policies requiring owner confirmation

- Outlet opening hours, order cut-off and kitchen acceptance timeout.
- Delivery radius/zones, fees, slot capacity and address validation provider.
- Tax/GST calculation and invoice requirements.
- Menu allergen and ingredient data owner/verification process.
- Cancellation and reschedule cut-off rules.
- Refund tiers, limits, goodwill budget and approval matrix.
- COD eligibility, collection and reconciliation.
- Stripe account readiness and supported India payment methods.
- Data retention, marketing consent and privacy/legal requirements.

## 9. Release acceptance

V1 may be released only when all P0 acceptance criteria pass, no unresolved critical security/payment defect remains, payment reconciliation is demonstrated, restore procedure is tested, human support route works, Salesforce outage does not block commerce, and operational owners sign off UAT.
