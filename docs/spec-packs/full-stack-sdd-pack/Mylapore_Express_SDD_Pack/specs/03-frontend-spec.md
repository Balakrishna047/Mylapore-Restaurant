# 03 — Frontend Specification (Next.js)

## Application routes
```text
/                         Home and outlet discovery
/outlets                  Outlet list / location selection
/menu                     Outlet-scoped menu
/menu/[slug]              Item detail
/search                   Menu search
/cart                     Cart
/checkout                 Address, fulfilment, slot, quote and payment
/orders/[orderNumber]     Protected order status
/account                  Profile dashboard
/account/addresses        Address book
/account/orders           Order history
/account/orders/[id]      Order detail
/account/preferences      Preferences and consent
/support                  Create support request
/chat                     Customer commerce assistant
/admin                    Staff dashboard
/admin/menu               Menu management
/admin/inventory          Stock management
/admin/orders             Order exceptions
/kitchen                  Kitchen display
/delivery                 Delivery task interface
```

## Shared UI requirements
- Mobile-first, responsive and keyboard accessible.
- Design system: typography, spacing, color tokens, buttons, form fields, cards, status chips, dialogs and alerts.
- Loading skeleton, empty state, retry state, validation error and offline/degraded state for every data-driven screen.
- Display outlet name and service mode persistently in ordering context.
- Never calculate or present a client-side amount as authoritative; display API quote breakdown.
- Do not expose secrets, provider credentials or internal authorization claims.

## Cart and checkout interaction
1. Cart changes call backend and return normalized cart state.
2. Quote endpoint returns item subtotal, discounts, taxes, packaging, delivery, total, currency, quote ID and expiry.
3. Checkout confirms fulfilment method, address and slot.
4. Backend revalidates quote and stock immediately before order creation.
5. Customer sees explicit final amount and confirms placement/payment.
6. Payment UI uses provider-approved client integration; server verifies outcome.
7. Order confirmation screen loads authoritative order state from API.

## Chat UI
- Chat responses may include structured menu item cards and safe action proposals.
- Side effects must show a confirmation summary before execution.
- Show action status: checking, requires confirmation, submitted, completed, failed or human support requested.
- Never display “paid”, “cancelled”, “refunded” or “human connected” before backend/channel confirmation.
- Provide a non-chat route to all core tasks.

## Frontend state and data
- Use server state/query caching with invalidation after mutations.
- Cart and checkout must be server-authoritative; local persistence may improve UX but must be reconciled.
- Use generated API client from OpenAPI or a typed shared contract.
- Do not store payment secrets or long-lived access tokens in localStorage.
- Protect staff routes in UI and again in backend guards; UI hiding is not authorization.
