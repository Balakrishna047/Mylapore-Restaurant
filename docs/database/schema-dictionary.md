# Database Schema Dictionary

## Core Tables
- `User`: Accounts for customers and restaurant staff (`SUPER_ADMIN`, `RESTAURANT_ADMIN`, `KITCHEN_MANAGER`, `DELIVERY_MANAGER`, `CUSTOMER_SUPPORT`, `CUSTOMER`).
- `CustomerAddress`: Saved residential delivery addresses with notes and zip codes.
- `Restaurant`: Store profile, operational hours, minimum order values, tax rates (8.25%), and delivery fees.
- `MenuCategory`: Category classification (Curries, Rice, Sambar, Rasam, Chutneys, Desserts, Beverages, Batters, Specials, Pickles).
- `MenuItem`: Dishes with authentic photos, blast-chilling attributes, dietary tags, allergens, and nutritional facts.
- `MenuItemVariant`: Portion size choices (e.g. Regular 16oz, Family 32oz).
- `Cart` & `CartItem`: Persistent server cart items linked to either registered user or guest session token.
- `Order`: Transactional order records with deterministic order state machine.
- `OrderItem`: Snapshot of ordered items with locked-in prices at the moment of checkout.
- `OrderStatusHistory`: Immutable activity log for tracking order status progressions.
- `Payment`: Stripe payment records with transaction references.
- `Refund`: Transactional refund ledger recording reasons and Stripe refund IDs.
- `Coupon`: Promotional vouchers with percentage or fixed discounts and minimum order validation.
- `SupportTicket`: Customer support cases synchronized with Salesforce Service Cloud.
- `AuditLog`: Security audit events capturing user actions and data mutations.
