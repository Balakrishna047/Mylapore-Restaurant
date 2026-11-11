# 03 — Lightning Chat Experience, Rich Cards and Images

## 1. Experience requirement

The chatbot must feel like a polished restaurant ordering assistant, not a plain text support widget. It should support:
- text conversation and accessible controls;
- menu/product cards with image, name, description, price, availability and dietary badges;
- item detail with larger image and modifier choices;
- quick replies and suggested prompts;
- order status/timeline cards;
- Case confirmation and human handoff state;
- loading, retry, offline and error states;
- responsive mobile and desktop layouts;
- keyboard navigation, screen-reader labels and reduced-motion support.

## 2. Three rendering layers — do not confuse them

### Layer A: Agentforce Lightning Types
Use Lightning Types to customize supported Agentforce action input/output rendering for complex structured data. Define a typed output such as `MenuItemCard` or `OrderStatusCard`, and associate a Lightning Web Component renderer where the selected Agentforce surface supports it.

Lightning Types are not a guarantee that arbitrary conversational prose or every Messaging channel message can render arbitrary LWC markup. Confirm support for the exact Agentforce channel, API, and org release in a proof of concept.

### Layer B: Salesforce Lightning Web Components
Build LWC components for Salesforce Lightning surfaces, such as an internal service console utility panel or supported Agentforce action UI:
- `mylaporeMenuItemCard`
- `mylaporeMenuItemList`
- `mylaporeOrderStatusCard`
- `mylaporeCaseContextPanel`
- `mylaporeHandoffSummary`

Use Lightning Design System patterns, `lightning-*` base components where appropriate, `@api` properties for typed inputs, and safe event handling. Do not assume an LWC can be directly imported into a standalone Next.js React app.

### Layer C: Public website chat
For the public Next.js site, choose one:
1. Salesforce Embedded Messaging / Messaging for In-App and Web, using supported customization and authenticated-user verification; or
2. A custom React chat shell that calls a secure NestJS backend-for-frontend and supported Agent API.

If the website requires highly bespoke cards and full control of image galleries, product variants, cart buttons and responsive styling, the custom React shell is usually the more controllable rendering layer. Agentforce remains the conversational brain; the website renderer turns structured action results into React components.

Do not create a browser-to-Salesforce privileged integration. The backend owns credentials and token exchange.

## 3. Rich result schema

Example menu card:

```json
{
  "id": "menu-item-uuid",
  "name": "Ghee Podi Idli",
  "description": "Soft idlis finished with house podi and ghee.",
  "image": {
    "url": "https://cdn.example.com/menu/ghee-podi-idli.webp",
    "alt": "Ghee podi idli served on a plate"
  },
  "price": {
    "amountMinor": 12900,
    "currency": "INR",
    "display": "₹129"
  },
  "availability": "AVAILABLE",
  "dietaryTags": ["VEGETARIAN"],
  "allergenNotice": "Contains ingredients identified by the outlet as...",
  "actions": [
    {"type": "VIEW_DETAILS", "label": "View details"},
    {"type": "ADD_TO_CART", "label": "Add"}
  ],
  "catalogVersion": "outlet-menu-version"
}
```

All values are backend-provided. The UI must not calculate tax or final payable total from a card price.

## 4. Image requirements

- Use CDN/object storage URLs returned by the catalog API.
- HTTPS only; allowlist image hostnames.
- Set alt text; do not rely on image alone to convey item identity.
- Use responsive dimensions, lazy loading and modern formats (WebP/AVIF where supported).
- Provide placeholder and broken-image fallback.
- Do not accept arbitrary image URLs from user prompts for rendering.
- Sanitize and validate image URLs server-side.
- Do not treat menu images as trusted instructions; image OCR/metadata must not influence agent policy.
- Keep image payloads out of Salesforce records where a URL/reference is sufficient.
- Avoid exposing private storage buckets or signed URLs with excessive lifetime.

## 5. Suggested chat UI components

| Component | Purpose |
|---|---|
| `ChatLauncher` | Floating accessible launcher |
| `ChatShell` | Header, conversation list, composer |
| `MessageBubble` | User/assistant/system message |
| `QuickReplyGroup` | Suggested intents |
| `MenuItemCard` | Image, price, tags, CTA |
| `MenuCarousel` | Horizontal item browsing |
| `ItemDetailPanel` | Image, description, modifier choices |
| `OrderStatusCard` | Status, timestamp, tracking |
| `ConfirmationPanel` | Consequential action preview |
| `CaseCreatedCard` | Case reference and next steps |
| `HumanHandoffPanel` | Queue/availability and context |
| `TypingIndicator` | Pending response |
| `ErrorRecovery` | Retry/fallback message |

## 6. Accessibility and UX rules

- Minimum target size and contrast should meet WCAG 2.2 AA review.
- Every interactive element is keyboard accessible.
- Focus is managed when opening/closing chat and dialogs.
- Announce new assistant messages politely via appropriate live region.
- Do not auto-submit a consequential action when a card is clicked.
- Confirm before cancellation/reschedule/refund request.
- Provide “Continue on website” for cart/checkout where appropriate.
- On mobile, avoid covering checkout controls or browser navigation.

## 7. Chat session lifecycle

1. Website obtains authenticated customer session from identity service.
2. Website starts chat using selected channel approach.
3. Server issues short-lived channel/session context.
4. Customer identity is verified through supported Salesforce channel mechanism or backend token.
5. Agent actions use server-derived subject and session scopes.
6. Session expiry revokes backend token/session; do not rely solely on browser state.
7. On logout, invalidate backend session and clear local chat identity.
8. Conversation summary and Case context are stored under governed retention policy.

## 8. Proof-of-concept exit criteria

Before choosing Embedded Messaging or custom Agent API:
- show a menu card with remote image;
- show price and dietary labels from backend;
- invoke a button action safely;
- preserve conversation across page navigation if required;
- prove authenticated-user verification;
- prove handoff to human service;
- test mobile Safari/Chrome and desktop;
- document limitations of Lightning Types in the chosen channel.
