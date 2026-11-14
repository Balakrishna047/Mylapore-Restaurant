# v2.7 Gap & Reuse Matrix — Mylapore Express

**Generated Date**: 2026-11-14  
**Project**: Mylapore Express  
**Author**: Principal Enterprise Solutions Architect  
**Scope**: Frozen Release 1 (Flow 1: Chat Initialization & Flow 2: Menu Discovery)

---

## 1. Component Reuse & Gap Classification Matrix

| Layer / Area | Component / Artifact | Current State in Repository | Classification | Planned Action for v2.7 Integration |
|---|---|---|---|---|
| **Web UI** | Homepage & Navigation (`page.tsx`, `Header.tsx`) | Fully built, responsive, dark/light mode | **Reuse without changes** | Keep existing header, location modal, and hero section completely intact. |
| **Web UI** | Existing Menu & Categories (`CategoryNav.tsx`, `DishCard.tsx`) | Fully built, responsive, 0ms optimistic quick-add | **Reuse without changes** | Keep existing browsing experience and styling tokens. |
| **Web UI** | `apps/web/src/components/chatbot/` | Missing (only placeholder `ChatWidget.tsx` exists) | **New implementation required** | Implement modular React components: `ChatLauncher.tsx`, `ChatWidget.tsx`, `ChatHeader.tsx`, `ChatMessageList.tsx`, `ChatInput.tsx`, `WelcomeScreen.tsx`, `CategoryButtons.tsx`, `MenuItemList.tsx`, `MenuItemCard.tsx`, `MenuItemDetail.tsx`. |
| **Web UI** | `useMylaporeChat.ts` hook & `chatApi.ts` service | Missing | **New implementation required** | Build dedicated chat state machine hook managing guest session, turns, optimistic display blocks, and Simple Menu Mode toggle. |
| **Web UI** | Display Block Schema Validation | Missing | **New implementation required** | Implement `displayBlock.schema.ts` (Zod) enforcing strict composite keys `(session_id, turn_id, request_id, catalog_version_id)`. |
| **NestJS BFF** | `MenuModule` (`src/menu/`) | Implemented with `getCategories`, `getItems`, `getItemByIdOrSlug` | **Reuse and extend** | Reuse existing catalog database queries; expose as shared catalog service for both website and chat. |
| **NestJS BFF** | `ChatModule` & `ChatService` | Missing (chat was solely handled via external MIAW iframe) | **New implementation required** | Add dedicated Chat BFF module owning guest session lifecycle, turn state, 423 session busy lock, signed `turn_token`, and 25s deadline control. |
| **NestJS BFF** | `AgentApiModule` | Missing | **New implementation required** | Implement Einstein Agent API client for outbound communication between BFF and Salesforce Agentforce. |
| **NestJS Gateway**| `AgentModule` (`src/agent/`) | Has `searchMenu` & `getMenuItemDetails` guarded by API key | **Extend existing implementation** | Add `listMenuCategories` action, signed `turn_token` validation, exact display block persistence, and audit logging. |
| **Database** | `MenuCategory`, `MenuItem`, `MenuItemVariant`, `Restaurant` | In PostgreSQL via Prisma | **Reuse existing schema** | Use existing menu models without duplicating tables or creating conflicting entities. |
| **Database** | `ChatSession`, `ChatTurn`, `ChatDisplayBlock` | Missing in Prisma schema | **New implementation required** | Add non-destructive models for session tracking, turn history, and immutable display blocks correlated by `(session_id, turn_id, request_id, catalog_version_id)`. |
| **Salesforce** | Org `mylapore-dev` (`00DgK00000fMxxtUAC`) | Registered in SF CLI, Winter '27 | **Extend existing implementation** | Re-authenticate CLI session, deploy/verify 3 Apex Invocables (`Mylapore_Menu_Action`, `Mylapore_Search_Menu_Action`, `Mylapore_Item_Details_Action`), verify Named Credential `Mylapore_Echo_NC`. |
| **Salesforce** | Agentforce Agent `Mylapore Menu Agent` | Version 4 reported | **Validate & Bind** | Bind Agent topics to the 3 Invocables, configure grounded grounding prompt, and run Gate A–E integration tests. |

---

## 2. Detailed Gap Analysis by Discipline

### 2.1 Database Layer (PostgreSQL)
- **Current State**: Contains 17 models (`User`, `Restaurant`, `MenuCategory`, `MenuItem`, `MenuItemVariant`, `Cart`, `Order`, `Payment`, `Refund`, `Coupon`, `SupportTicket`, `AuditLog`, `IdempotencyRecord`, `IntegrationEvent`).
- **Reuse**: `MenuCategory`, `MenuItem`, `MenuItemVariant`, and `Restaurant` are 100% reusable as the authoritative source of truth for the menu.
- **Delta/Additions**:
  1. `ChatSession`: Tracks guest/customer session, outlet scope, status (`ACTIVE`, `CLOSED`), expiry.
  2. `ChatTurn`: Tracks turn lifecycle (`turn_id`, `turn_number`, `user_query`, `agent_response`, `turn_status`, `turn_token`).
  3. `ChatDisplayBlock`: Stores immutable verified display blocks keyed by `(sessionId, turnId, requestId, catalogVersion)`.

### 2.2 Backend Layer (NestJS)
- **Current State**: Solid monolithic NestJS backend with modular controllers and Prisma service.
- **Reuse**: `MenuService` queries PostgreSQL cleanly with category slug and search support.
- **Delta/Additions**:
  1. `ChatModule`: Controller `POST /api/v1/chat/session`, `POST /api/v1/chat/turn`, `GET /api/v1/chat/display/:turnId`.
  2. `SessionLockGuard`: Enforces `423 Session Busy` if another turn is actively processing for the same session.
  3. `TurnTokenService`: Issues HMAC-SHA256 signed turn tokens (`turn_token`) preventing replay and out-of-order execution.
  4. `SimpleMenuService`: Fallback provider allowing the chat widget to display categories and items directly if Agentforce times out (>25s).

### 2.3 Frontend Layer (Next.js 14)
- **Current State**: Storefront has an active shopping flow, responsive drawer, and an embedded Salesforce MIAW script.
- **Reuse**: Full branding, Tailwind design tokens, `DishCard` styling, responsive mobile drawer patterns.
- **Delta/Additions**:
  1. Internal branded `MylaporeChatWidget`: Self-contained React floating launcher and sliding panel.
  2. Display Block Renderers:
     - `category_buttons`: Renders horizontal/wrapped category buttons retrieved from backend.
     - `menu_item_list`: Renders max 6 verified menu cards with images, prices, and spice tags.
     - `menu_item_detail`: Renders deep dish specifications (ingredients, allergens, blast-chilling notice).
  3. Correlation Safeguard: Only renders blocks matching current `turn_id` and `session_id`.

---

## 3. Scope Freezing & Non-Functional Boundaries (Release 1)

The following capabilities are **explicitly frozen and excluded** from Release 1:
- ❌ No in-chat add-to-cart or cart mutation (customer explores menu; uses existing website for cart/checkout).
- ❌ No payment or Stripe triggers in chat.
- ❌ No order creation, modification, cancellation, or refund processing inside chat.
- ❌ No delivery tracking or live driver mapping in chat.
- ❌ No live human agent handoff or Omni-Channel queue routing in chat.
- ❌ No multi-lingual translation models.
- ❌ No secondary database tables for menu items or prices.
