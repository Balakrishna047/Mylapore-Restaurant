# Database Specification — PostgreSQL + Prisma

## 1. Conventions
- UUID primary keys.
- `created_at`, `updated_at` as UTC `timestamptz`.
- Store money as integer minor units plus ISO currency code; INR paise is a business default to confirm.
- Use explicit outlet foreign keys on outlet-scoped records.
- Use soft deactivation for catalog records referenced by historical orders.
- Snapshot order-line name, SKU, modifiers and price at order time.
- Add unique constraints for external/provider IDs.
- Never cascade-delete financial history.
- Every state transition writes an append-only event/audit row.

## 2. Logical entities

### Identity and customer
- `customers(id, email, phone, display_name, status, created_at, updated_at)`
- `auth_identities(id, customer_id, provider, provider_subject, created_at)` unique(provider, provider_subject)
- `customer_addresses(id, customer_id, label, address_lines, city, state, postal_code, country, lat, lng, delivery_instructions, is_default)`
- `customer_consents(id, customer_id, purpose, status, captured_at, source, policy_version)`
- `staff_users(id, external_identity, display_name, status)`
- `staff_roles(id, staff_user_id, role, outlet_id nullable)`; role assignment is scoped.

### Outlet and catalog
- `outlets(id, code, name, timezone, address, phone, is_active, opening_hours_json)`
- `service_zones(id, outlet_id, postal_code/polygon_ref, is_active, delivery_fee_minor, minimum_order_minor)`
- `menu_categories(id, name, sort_order, is_active)`
- `menu_items(id, sku, category_id, name, description, image_url, is_active, dietary_labels, allergen_labels, ingredients, prep_minutes)`
- `outlet_menu_items(id, outlet_id, menu_item_id, price_minor, currency, is_available, valid_from, valid_to, version)`
- `menu_variants(id, menu_item_id, name, price_delta_minor, is_active)`
- `modifiers(id, menu_item_id, name, price_delta_minor, is_required, min_select, max_select, is_active)`
- `combos(id, outlet_id, name, price_minor, currency, is_active)`
- `combo_lines(id, combo_id, menu_item_id, quantity)`
- `availability_events(id, outlet_id, menu_item_id, status, reason, actor_id, occurred_at)`

### Cart, quote and promotion
- `carts(id, customer_id nullable, guest_session_id nullable, outlet_id, status, version, expires_at)`
- `cart_lines(id, cart_id, menu_item_id, quantity, special_instructions, selected_options_json)`
- `quotes(id, cart_id, principal_ref, outlet_id, fulfilment_type, address_snapshot_json, slot_id, subtotal_minor, discount_minor, tax_minor, fee_minor, total_minor, currency, quote_version, expires_at, status)`
- `promotions(id, code, kind, value, min_order_minor, starts_at, ends_at, usage_limit, per_customer_limit, active)`
- `promotion_redemptions(id, promotion_id, customer_id nullable, order_id, discount_minor, redeemed_at)` unique(order_id)

### Orders and fulfilment
- `orders(id, public_reference, customer_id nullable, guest_session_id nullable, outlet_id, quote_id, order_status, fulfilment_type, customer_note, subtotal_minor, discount_minor, tax_minor, delivery_fee_minor, total_minor, currency, accepted_at, completed_at, created_at)`
- `order_lines(id, order_id, menu_item_id nullable, sku_snapshot, name_snapshot, quantity, unit_price_minor, modifiers_snapshot_json, line_total_minor, tax_snapshot_json)`
- `order_events(id, order_id, from_status, to_status, actor_type, actor_id, reason, correlation_id, occurred_at)`
- `fulfilment_slots(id, outlet_id, fulfilment_type, starts_at, ends_at, capacity, reserved_count, active)`
- `order_modification_requests(id, order_id, request_type, requested_payload_json, status, decision_reason, requested_by, decided_by, created_at)`

### Payments and refunds
- `payments(id, order_id, provider, provider_payment_id, amount_minor, currency, payment_status, idempotency_key, last_verified_at, created_at)` unique(provider, provider_payment_id)
- `payment_webhook_events(id, provider, provider_event_id, event_type, payload_hash, received_at, processed_at, processing_status, failure_reason)` unique(provider, provider_event_id)
- `refunds(id, order_id, payment_id, provider_refund_id, amount_minor, currency, refund_status, tier, reason, requested_by, approved_by, created_at)` unique(provider_refund_id) where non-null
- `idempotency_records(id, scope, idempotency_key, request_hash, response_snapshot_json, resource_id, expires_at)` unique(scope, idempotency_key)

### Kitchen and delivery
- `kitchen_tickets(id, order_id, outlet_id, status, accepted_by, accepted_at, started_at, ready_at, rejection_reason)`
- `kitchen_events(id, kitchen_ticket_id, event_type, actor_id, reason, occurred_at)`
- `deliveries(id, order_id, provider, provider_delivery_id, delivery_status, rider_reference, estimated_at, picked_up_at, delivered_at, failure_reason)`
- `delivery_events(id, delivery_id, event_type, payload_json, occurred_at)`

### Agent, support, integration and audit
- `chat_sessions(id, principal_type, customer_id nullable, guest_session_id nullable, status, scopes, token_jti, expires_at, revoked_at, channel, created_at)`
- `agent_interactions(id, chat_session_id, agent_name, outcome, escalated, action_count, safe_summary, created_at)`
- `support_references(id, customer_id nullable, order_id nullable, salesforce_case_id, case_number, sync_status, created_at)`
- `outbox_events(id, aggregate_type, aggregate_id, aggregate_version, event_type, payload_json, occurred_at, published_at, attempts, next_attempt_at, status, last_error)`
- `integration_dead_letters(id, outbox_event_id, destination, payload_json, failure_reason, created_at, resolved_at)`
- `audit_logs(id, actor_type, actor_id, action, resource_type, resource_id, outcome, reason, correlation_id, metadata_redacted_json, occurred_at)`

## 3. Required indexes and constraints
- `customers(email)` and normalized `customers(phone)` where present; unique only after business rules for shared household contacts are confirmed.
- `outlet_menu_items(outlet_id, menu_item_id)` unique.
- `orders(public_reference)` unique; indexes `(customer_id, created_at desc)`, `(outlet_id, order_status, created_at)`.
- `order_lines(order_id)`.
- `payments(provider, provider_payment_id)` unique.
- `payment_webhook_events(provider, provider_event_id)` unique.
- `refunds(provider_refund_id)` unique where non-null; index `(order_id, refund_status)`.
- `outbox_events(status, next_attempt_at)` and `(aggregate_type, aggregate_id, aggregate_version)`.
- `chat_sessions(token_jti)` unique; index expiry/revocation.
- `fulfilment_slots(outlet_id, starts_at, fulfilment_type)`.
- Check constraints: quantity > 0; all amount fields >= 0; currency uppercase 3 chars; refund cumulative amount <= captured amount enforced transactionally.

## 4. State transition rules
### Order
`AWAITING_PAYMENT -> PLACED | EXPIRED | CANCELLED`  
`PLACED -> ACCEPTED | REJECTED | CANCELLED`  
`ACCEPTED -> PREPARING | REJECTED | CANCELLED`  
`PREPARING -> READY | REJECTED | CANCELLED` (cancellation requires staff override and policy)  
`READY -> OUT_FOR_DELIVERY | COMPLETED`  
`OUT_FOR_DELIVERY -> COMPLETED | DELIVERY_FAILED`  
`DELIVERY_FAILED -> COMPLETED | CANCELLED`  
Terminal: `COMPLETED`, `REJECTED`, `CANCELLED`, `EXPIRED` except explicit delivery-failure recovery rule.

### Payment
`NOT_STARTED -> REQUIRES_ACTION | PROCESSING | FAILED`  
`REQUIRES_ACTION -> PROCESSING | SUCCEEDED | FAILED | CANCELED`  
`PROCESSING -> SUCCEEDED | FAILED | CANCELED`  
`SUCCEEDED -> PARTIALLY_REFUNDED | REFUNDED | DISPUTED`  
`PARTIALLY_REFUNDED -> PARTIALLY_REFUNDED | REFUNDED | DISPUTED`  
COD: `COD_PENDING -> COD_COLLECTED`; dispute handling is separate.

### Refund
`REQUESTED -> PENDING_APPROVAL | APPROVED | REJECTED`  
`PENDING_APPROVAL -> APPROVED | REJECTED`  
`APPROVED -> SUBMITTED`  
`SUBMITTED -> SUCCEEDED | FAILED`  
Retry must reuse provider idempotency strategy; do not create duplicate refunds.

### Delivery
`UNASSIGNED -> ASSIGNED -> PICKED_UP -> DELIVERED`  
`ASSIGNED | PICKED_UP -> FAILED`; reassignment requires explicit event and audit.

## 5. Concurrency and transactional rules
- Reserve slot capacity atomically using conditional update/row lock; reject when capacity is exhausted.
- Revalidate item availability and quote expiry inside checkout transaction.
- Use optimistic `version` for cart/quote updates.
- Create order, lines, payment record and outbox event atomically where applicable.
- Webhook handler inserts event inbox row before processing; unique event ID makes retries safe.
- Use `SELECT ... FOR UPDATE` or equivalent transaction isolation for refund balance and slot reservation.
- Never call external payment APIs while holding a long-running DB transaction. Persist intent, call provider with idempotency key, then reconcile state.
- Outbox workers use leases/`SKIP LOCKED` or equivalent claim semantics.
- All timestamps are UTC; outlet timezone is stored separately.

## 6. Prisma implementation notes
- Generate Prisma models from this logical design after repository audit.
- Use explicit enums for state machines.
- Use JSON only for snapshots/provider payloads where schema is intentionally external; keep queryable business facts in typed columns.
- Create migrations incrementally and review SQL before applying.
- Seed only development/test data. Never seed real payment success.
- Include migration tests and a documented rollback/forward-fix plan.
