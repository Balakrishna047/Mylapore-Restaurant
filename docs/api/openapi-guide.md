# OpenAPI & Swagger Contract Guide

## Interactive Documentation
- **Live Swagger UI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Base Endpoint**: `/api/v1`

## Key REST Endpoints
- `POST /api/v1/auth/register`: Create customer account
- `POST /api/v1/auth/login`: Issue JWT authentication token
- `GET /api/v1/auth/me`: Retrieve current user profile
- `GET /api/v1/menu/categories`: Get all categories with icon pills
- `GET /api/v1/menu/items`: Filter items by category, dietary tag, spice level, or keyword
- `GET /api/v1/menu/items/:idOrSlug`: Retrieve detailed item specifications
- `GET /api/v1/cart`: Fetch persistent active cart
- `POST /api/v1/cart/items`: Add item with portion size & spice options
- `POST /api/v1/checkout/quote`: Server-side pricing calculation (8.25% tax, delivery, tip)
- `POST /api/v1/checkout/create-intent`: Initialize Stripe PaymentIntent
- `POST /api/v1/payments/stripe-webhook`: Cryptographic HMAC signed webhook confirmation
- `GET /api/v1/orders/:idOrNumber`: Get order status and timeline
- `POST /api/v1/orders/:id/reschedule`: Reschedule delivery slot
- `POST /api/v1/orders/:id/cancel`: Cancel order with automated refund entitlement computation
- `POST /api/v1/support/chat`: Autonomous Agentforce AI Concierge query engine
- `POST /api/v1/support/tickets`: File Salesforce Service Cloud case
- `GET /api/v1/admin/dashboard`: Kitchen Display System (KDS) and real-time revenue analytics
- `PATCH /api/v1/admin/inventory/:id/toggle`: 86 out-of-stock menu dish
- `GET /api/v1/health`: Cloud deployment uptime check
