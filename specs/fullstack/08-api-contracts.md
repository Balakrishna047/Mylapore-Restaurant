# API Contracts & Endpoints: Mylapore Express

- **Document ID**: APIC-ME-08
- **Base URL**: `/api/v1`
- **Specification Standard**: OpenAPI 3.0 / Swagger

---

## 1. Core Endpoints Summary

### Authentication & Customer Profile
- `POST /api/v1/auth/register` - Create customer account.
- `POST /api/v1/auth/login` - Authenticate customer or staff and return JWT tokens.
- `GET /api/v1/auth/me` - Fetch authenticated user profile & permissions.
- `GET /api/v1/customers/addresses` - List saved delivery addresses.
- `POST /api/v1/customers/addresses` - Add new delivery address.

### Menu & Restaurant Catalog
- `GET /api/v1/restaurants/info` - Restaurant operating hours, holiday status, minimum order.
- `GET /api/v1/menu/categories` - Fetch all categories with thumbnail icons.
- `GET /api/v1/menu/items` - Filterable catalog (`category`, `dietary`, `spiceLevel`, `search`).
- `GET /api/v1/menu/items/:id` - Detailed item payload with allergens, nutrition, variants.

### Cart & Checkout
- `GET /api/v1/cart` - Retrieve active session/user cart.
- `POST /api/v1/cart/items` - Add item with variant selections & add-ons.
- `PUT /api/v1/cart/items/:id` - Update quantity or options.
- `DELETE /api/v1/cart/items/:id` - Remove item.
- `POST /api/v1/checkout/quote` - Calculate verified server-side totals, delivery fee, taxes.
- `POST /api/v1/checkout/create-intent` - Initialize Stripe PaymentIntent with server totals.

### Order Management & Lifecycle
- `GET /api/v1/orders` - List customer orders or kitchen queue (if admin).
- `GET /api/v1/orders/:id` - Comprehensive order status, items, timeline.
- `POST /api/v1/orders/:id/reschedule` - Request new delivery time slot.
- `POST /api/v1/orders/:id/cancel` - Request cancellation; triggers refund calculator.
- `PATCH /api/v1/orders/:id/status` - Staff status advancement (`CONFIRMED` -> `ACCEPTED` -> etc.).

### Payments & Webhooks
- `POST /api/v1/payments/stripe-webhook` - Verifies Stripe HMAC signature and confirms order.

### Customer Support & Chatbot
- `POST /api/v1/support/chat` - Conversational Agentforce AI concierge interface.
- `POST /api/v1/support/tickets` - File complaint / Service Cloud case.

### Admin & Operations
- `GET /api/v1/admin/dashboard` - Real-time GMV, active order count, kitchen bottlenecks.
- `PATCH /api/v1/admin/inventory/:itemId/toggle` - 86 / restock menu dish.
- `GET /api/v1/admin/audit-logs` - View historical operational mutations.
