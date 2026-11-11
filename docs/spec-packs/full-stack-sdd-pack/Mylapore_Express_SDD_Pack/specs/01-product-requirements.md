# 01 — Product Requirements

## Product outcomes
- Customers can order from the correct outlet with accurate availability and price.
- Customers can pay and understand the true payment/order state.
- Restaurant staff can accept and fulfill orders.
- Support staff can resolve customer issues with complete, appropriately scoped context.
- AI reduces friction and service effort while remaining bounded by deterministic backend policy.
- Management can monitor operational and financial performance.

## Personas
| Persona | Goals | Access boundary |
|---|---|---|
| Guest | Browse and optionally place verified guest order | Own guest session and its orders only |
| Registered customer | Order, save addresses, view history, request changes | Own profile, carts and orders |
| Outlet manager | Manage outlet menu, stock, hours and exceptions | Assigned outlet(s) only |
| Kitchen staff | View and update kitchen tickets | Assigned outlet and allowed ticket actions |
| Delivery staff | Accept tasks and update fulfilment | Assigned delivery tasks only |
| Support agent | Resolve Cases and customer complaints | Assigned service records and minimum necessary customer data |
| Finance | Reconcile payments/refunds/settlements | Financial records, no unrestricted customer profile access |
| Platform admin | Configure platform | Privileged, MFA, audited access |

## Functional requirements
### Customer experience
- FR-CX-001: The site MUST show outlet selection and selected outlet context.
- FR-CX-002: Menu items MUST show current outlet availability, price, variants and verified allergen facts.
- FR-CX-003: Customers MUST be able to search and filter menu items.
- FR-CX-004: Customers MUST be able to add, update and remove cart items and modifiers.
- FR-CX-005: Cart totals MUST be calculated by the backend.
- FR-CX-006: Checkout MUST validate serviceability, outlet hours, slot capacity, minimum order, stock and quote freshness.
- FR-CX-007: Customers MUST receive an order reference and accurate status after confirmed placement.
- FR-CX-008: Customers MUST be able to view their own order timeline and payment/refund status.
- FR-CX-009: Customers MUST be able to request cancellation/rescheduling only when backend policy allows.
- FR-CX-010: Customer support entry MUST capture issue category, order reference and contact preference.

### Commerce and operations
- FR-CO-001: Menu, prices, outlet hours and stock MUST be outlet-scoped.
- FR-CO-002: Inventory reservation MUST prevent overselling under concurrent checkout.
- FR-CO-003: Order items MUST preserve an immutable order-time snapshot.
- FR-CO-004: Order, payment, refund and delivery states MUST be independent.
- FR-CO-005: Kitchen acceptance/rejection MUST be recorded with actor and reason.
- FR-CO-006: Failed kitchen/delivery paths MUST have explicit recovery policy.
- FR-CO-007: Notification failure MUST NOT roll back a valid order.
- FR-CO-008: Staff actions MUST be role- and outlet-scoped.

### Payment
- FR-PAY-001: Payment initiation MUST be idempotent.
- FR-PAY-002: Provider webhook signature MUST be verified using the raw body as required by provider.
- FR-PAY-003: Duplicate and out-of-order events MUST be handled safely.
- FR-PAY-004: Browser redirect MUST NOT be treated as payment proof.
- FR-PAY-005: Unknown payment outcomes MUST be reconciled before retrying a charge.
- FR-PAY-006: Refund request, approval, provider submission and provider completion MUST be distinct states.

### Salesforce and Agentforce
- FR-SF-001: A support request MUST persist locally before Salesforce synchronization.
- FR-SF-002: Salesforce synchronization MUST use external IDs and be retryable.
- FR-AI-001: Agentforce MUST use allowlisted actions with strict schemas.
- FR-AI-002: Protected actions MUST use signed session identity; model-supplied customer IDs MUST be ignored/rejected.
- FR-AI-003: Purchase, cancellation, rescheduling and refund actions MUST have explicit confirmation and policy validation.
- FR-AI-004: Human escalation MUST preserve verified identity level, issue, order reference, summary and prior action outcomes.
- FR-AI-005: Agentforce outage MUST NOT block core commerce.

## Non-functional requirements
- NFR-001: APIs MUST use TLS in deployed environments.
- NFR-002: All protected reads/writes MUST enforce object-level authorization.
- NFR-003: API errors MUST use a stable error envelope and correlation ID.
- NFR-004: The application MUST provide structured logs and service health endpoints.
- NFR-005: Critical operations MUST be observable through metrics and alerts.
- NFR-006: Database backups and restore MUST be tested before production.
- NFR-007: UI MUST support mobile-first responsive layouts and keyboard navigation.
- NFR-008: Accessibility target SHOULD align with WCAG 2.2 AA, subject to audit.
- NFR-009: The system MUST support environment separation and configuration validation.
- NFR-010: Personal data MUST be minimized, access-controlled and retained/deleted according to approved policy.

## Out of scope for first vertical slice
- Predictive AI demand planning.
- Complex loyalty/referral ledger.
- Multi-country tax engine.
- Autonomous high-value refunds.
- Full third-party POS and delivery integration before vendors are selected.
