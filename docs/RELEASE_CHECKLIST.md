# Release Checklist: Mylapore Express v2.7 (Release 1)

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Scope & Functional Verification Gates

- [x] **Release 1 Scope Frozen**:
  - [x] Flow 1: Chat Initialization (Session handshake, deterministic welcome, category button blocks).
  - [x] Flow 2: Menu Discovery (3 approved actions: `listMenuCategories`, `searchMenu`, `getMenuItemDetails`).
  - [x] Prohibited Features Frozen: No cart, checkout, payments, orders, refunds, cases, POS, delivery, WhatsApp, or QR ordering inside chat.
- [x] **Two Execution Modes Operational**:
  - [x] `SIMPLE_MENU`: React -> NestJS BFF -> Catalog Service -> PostgreSQL -> Display Block -> React.
  - [x] `AGENTFORCE`: React -> NestJS BFF -> Salesforce Agent API -> Agentforce -> Apex Action -> NestJS Gateway -> PostgreSQL -> Display Block -> React.
  - [x] Mode recorded on every turn response (`executionMode: "AGENTFORCE" | "SIMPLE_MENU"`).

---

## 2. Frontend Verification Gates (`apps/web`)

- [x] **Component Architecture**:
  - [x] `ChatLauncher.tsx`: Bottom-right floating trigger with unread badge pulse.
  - [x] `ChatWidget.tsx`: Modular container with minimize, close, reset, and dialog accessibility.
  - [x] `ChatHeader.tsx`: Title, status indicator, action buttons.
  - [x] `ChatMessageList.tsx`: Handles message history, bot avatar, verified display blocks, loading, and error states.
  - [x] `ChatInput.tsx`: Input field with character counter, accessibility aria-labels, and quick prompt chips.
  - [x] `WelcomeScreen.tsx`: Deterministic South Indian welcome greeting with category starter chips.
  - [x] `CategoryButtons.tsx`: Renders server-issued `category_buttons` display blocks.
  - [x] `MenuItemList.tsx`: Horizontal scroll container with max 6 cards per block.
  - [x] `MenuItemCard.tsx`: Dish card with price, spice flame, blast-chill snowflake, and detail trigger.
  - [x] `MenuItemDetail.tsx` / `MenuItemDetailModal.tsx`: Complete recipe modal with ingredients, allergen warnings, blast-chilled freshness badges, and reheating instructions.
- [x] **Zero Secrets in Client**: Browser never contacts PostgreSQL directly or holds Salesforce secrets.
- [x] **Build Verification**: `pnpm --filter @mylapore/web build` succeeds with zero errors (Next.js 14.2.24).

---

## 3. Backend Verification Gates (`apps/api`)

- [x] **BFF Chat Endpoints**:
  - [x] `POST /api/v1/chat/session`: Handshake returning `sessionToken` and welcome category display block.
  - [x] `POST /api/v1/chat/turn`: Executes turn with 24s deadline control and HMAC signed `turnToken`.
  - [x] `SessionLockGuard`: Concurrency mutex returning **HTTP 423 Locked** on duplicate or in-flight turns.
- [x] **Agent Gateway Invocable Endpoints**:
  - [x] `POST /api/v1/agent/browse-menu`: Returns published categories and dishes.
  - [x] `POST /api/v1/agent/search-menu`: Returns search matches.
  - [x] `POST /api/v1/agent/item-details`: Returns authentic recipe, allergens, and reheating instructions.
  - [x] `AgentforceApiKeyGuard`: Protects gateway via `X-Gateway-Auth` or `x-agentforce-api-key`.
- [x] **Unit & Integration Tests**:
  - [x] All 16 unit tests passing across `orders`, `chat`, and `agent` services.

---

## 4. Database & Food Safety Gates

- [x] **PostgreSQL Schema Preserved**:
  - [x] Neon Serverless PostgreSQL running with connection pooling.
  - [x] Models `ChatSession`, `ChatTurn`, and `ChatDisplayBlock` indexed by compound keys.
  - [x] No destructive migrations executed or required.
- [x] **Food Information Verification States**:
  - [x] Adheres strictly to the doctrine: *"Unknown does not mean absent. Never infer allergen safety."*
  - [x] Standardized verification states: `VERIFIED_PRESENT`, `VERIFIED_ABSENT`, `MAY_CONTAIN`, `UNKNOWN`, `NOT_REVIEWED`.
- [x] **Price Precision**: Floating base prices formatted into integer minor cents (`priceMinor`) and formatted strings (`priceFormatted`).

---

## 5. Deployment & Production Gates

- [x] **Render Web Services**:
  - [x] `mylapore-express-web` (`srv-dbq4s7lg1s2s73c1okeg`) live on Render.
  - [x] `mylapore-express-api` (`srv-dbq4qplg1s2s73c1kdp0`) live on Render.
  - [x] API Health check returns HTTP 200 OK: `{"status":"ok","database":"healthy"}`.
- [x] **Salesforce Agentforce Verification**:
  - [x] Developer Org CAN96 (`00DgK00000fMxxtUAC`) with Active Version 4 `Mylapore Menu Agent`.
  - [x] Named Credential `callout:Mylapore_Express_API` verified with `HTTP 200 OK`.
