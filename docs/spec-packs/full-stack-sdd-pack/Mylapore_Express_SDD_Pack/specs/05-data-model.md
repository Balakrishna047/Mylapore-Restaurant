# 05 — PostgreSQL Data Model Specification

## Conventions
- UUID primary keys.
- `created_at`, `updated_at` UTC timestamps where relevant.
- `outlet_id` on outlet-scoped records.
- Money as `BIGINT` minor units plus ISO currency code.
- Foreign keys and unique constraints for business invariants.
- Use append-only event/history tables for financial and state-transition evidence.
- Use explicit status enums or constrained strings; document transition graph.

## Logical entities
### Identity
`customers`, `customer_sessions`, `guest_sessions`, `customer_addresses`, `customer_consents`, `otp_challenges`.

### Restaurant and catalog
`outlets`, `outlet_hours`, `outlet_holidays`, `service_areas`, `delivery_slots`, `menu_categories`, `menu_items`, `item_variants`, `modifier_groups`, `modifiers`, `item_allergens`, `menu_versions`.

### Inventory
`ingredients`, `recipes`, `recipe_items`, `outlet_inventory`, `stock_reservations`, `stock_movements`.

### Cart and pricing
`carts`, `cart_items`, `cart_item_modifiers`, `price_quotes`, `quote_lines`, `promotions`, `coupons`, `coupon_redemptions`.

### Orders and operations
`orders`, `order_items`, `order_item_modifiers`, `order_status_history`, `kitchen_tickets`, `kitchen_ticket_items`, `delivery_tasks`, `delivery_events`.

### Payment and refund
`payment_attempts`, `payment_events`, `webhook_inbox`, `refund_requests`, `refund_approvals`, `refund_events`, `settlement_records`, `reconciliation_runs`.

### Integration and governance
`outbox_events`, `external_id_mappings`, `sync_attempts`, `audit_logs`, `idempotency_keys`, `support_requests`, `agent_sessions`, `agent_action_audits`.

## Key invariants
- A cart belongs to exactly one customer or guest session and one outlet.
- A cart item references a valid menu item/variant/modifier combination for that outlet.
- A quote is immutable, expires, and includes a complete calculation breakdown.
- An order stores snapshots of item name, variant, modifiers, price, tax, discount allocation and notes.
- An order has a unique human-readable order number and internal UUID.
- Provider event IDs are unique per provider/account/environment.
- Idempotency keys are scoped by principal, operation and environment.
- Stock reservations cannot exceed available stock; reservation transitions are one-way and audited.
- Refund total cannot exceed eligible captured amount less previous successful refunds.
- Salesforce external IDs are unique in their mapping scope.
- PII fields are classified and protected; logs store references rather than full sensitive payloads.

## Prisma implementation instructions
Generate Prisma schema only after ERD and constraints review. Use migrations, never `prisma db push` against production. Add indexes for customer order history, outlet status queues, provider event lookup, outbox scheduling, expiry workers and reconciliation. Add migration tests and seed data that is synthetic and clearly marked.
