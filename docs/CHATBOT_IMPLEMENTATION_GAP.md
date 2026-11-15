# Chatbot Implementation Gap Analysis: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Audit Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This report establishes the baseline gap analysis between the **v2.7 Master Specification (Release 1 Frozen Scope)** and the current implementation across the frontend web application (`apps/web`), the backend NestJS service (`apps/api`), the PostgreSQL database, and the Salesforce Agentforce agent integration.

The v2.7 Release 1 scope strictly encompasses:
- **Flow 1: Chat Initialization**: Guest session handshake, deterministic welcome text, and menu category button display blocks.
- **Flow 2: Menu Discovery**:
  1. `listMenuCategories`: Retrieve published culinary categories.
  2. `searchMenu`: Natural-language search by dish, dietary tag (Jain, Vegan, Gluten-Free), or spice level.
  3. `getMenuItemDetails`: Retrieve authoritative price, ingredients, allergen warnings, blast-chilled freshness badge, and reheating instructions.
- **Strictly Prohibited**: No cart, checkout, payments, ordering, delivery tracking, loyalty points, contact sync, or support cases inside the chat conversational turn.

---

## 2. Component-by-Component Gap Analysis

### 2.1 Frontend Components (`apps/web/src/components/chatbot`)

| Component Required by v2.7 | Current State in Repository | Implementation Gap | Action Required | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **`ChatLauncher`** | Present & functional | None. Floating bottom-right trigger with badge pulse. | Retain as-is. | `[VERIFIED]` |
| **`ChatWidget`** | Present & functional | Monolithic file combining message display, input form, and modals. | Decompose into sub-components for improved modularity and unit testability. | `[VERIFIED]` |
| **`ChatHeader`** | Present & functional | None. Shows title, operational status, minimize, reset, and close. | Retain as-is. | `[VERIFIED]` |
| **`ChatMessageList`** | Inline inside `ChatWidget` | Not an independent component file. | Extract into dedicated `ChatMessageList.tsx` component. | `[MISSING]` (File Separation) |
| **`ChatInput`** | Inline inside `ChatWidget` | Not an independent component file. | Extract into dedicated `ChatInput.tsx` component with accessibility labels. | `[MISSING]` (File Separation) |
| **`WelcomeScreen`** | Inline inside `ChatWidget` | Not an independent component file. | Create dedicated `WelcomeScreen.tsx` component rendering South Indian welcome and category chips. | `[MISSING]` (File Separation) |
| **`CategoryButtons`** | Present & functional | None. Renders category pills with count badges and click callbacks. | Retain as-is. | `[VERIFIED]` |
| **`MenuItemList`** | Present & functional | None. Horizontal scroll container with scrollbar styling. | Retain as-is. | `[VERIFIED]` |
| **`MenuItemCard`** | Present & functional | None. Card displays image, price, blast-chill badge, and detail trigger. | Retain as-is. | `[VERIFIED]` |
| **`MenuItemDetail`** | Implemented as `MenuItemDetailModal.tsx` | Naming discrepancy with specification (`MenuItemDetailModal` vs `MenuItemDetail`). | Export `MenuItemDetail` alias to satisfy both naming conventions. | `[VERIFIED]` |
| **Loading & Error States** | Present & functional | None. Bouncing three-dot loader and reconnect session error banner. | Retain as-is. | `[VERIFIED]` |

---

### 2.2 Backend Services (`apps/api/src/chat`)

| Capability Required by v2.7 | Current Implementation | Implementation Gap | Action Required | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Chat Session Handshake** | `ChatService.createOrResumeSession` | None. Generates `sess_<uuid>` or resumes existing session. Returns welcome + category block. | Fully verified. | `[VERIFIED]` |
| **Turn Execution Lifecycle** | `ChatService.executeTurn` | None. Persists turn record with monotonically increasing turn number. | Fully verified. | `[VERIFIED]` |
| **Session Mutex Lock** | `SessionLockGuard` | None. Acquires in-memory lock and throws HTTP 423 if turn is in-flight. | Fully verified. | `[VERIFIED]` |
| **Turn Token Signing** | `ChatService.generateTurnToken` | None. HMAC-SHA256 signature over `sessionId:turnNumber:timestamp`. | Fully verified. | `[VERIFIED]` |
| **25s Deadline Control** | `Promise.race` timeout wrapper | None. 24-second timeout promise racing against turn execution. | Fully verified. | `[VERIFIED]` |
| **Display Block Formatting** | `DisplayBlockService` | None. Generates `category_buttons`, `menu_item_list`, `menu_item_detail`. | Fully verified. | `[VERIFIED]` |
| **Exact-Turn Correlation** | `ChatDisplayBlock` table | None. Display blocks are indexed by `(sessionId, turnId, requestId, catalogVersion)`. | Fully verified. | `[VERIFIED]` |
| **Two Execution Modes** | `SIMPLE_MENU` and `AGENTFORCE` | Controlled via `SALESFORCE_ENABLED` flag. Fallback to `SIMPLE_MENU` is seamless. | Ensure turn response logs execution mode. | `[VERIFIED]` |

---

### 2.3 Salesforce Agentforce Integration

| Integration Point | Target Configuration | Current Status | Findings / Notes | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Active Salesforce Org** | CAN96 Developer Edition (`00DgK00000fMxxtUAC`) | Connected & verified | Org contains active Version 4 of `Mylapore Menu Agent` (`0XxgK000002YIJ7SAO`). | `[VERIFIED]` |
| **Connected App / ECA** | `Mylapore_BFF_Client` | Configured | Consumer Key and Consumer Secret active in Render environment. | `[VERIFIED]` |
| **Named Credential** | `Mylapore_Echo_NC` / `Mylapore_Express_API` | Deployed in Salesforce | Points to `https://mylapore-express-api.onrender.com`. Anonymous Apex callout returns HTTP 200 OK. | `[VERIFIED]` |
| **Invocable Apex Classes** | `Mylapore_Menu_Action.cls`, `Mylapore_Search_Menu_Action.cls`, `Mylapore_Item_Details_Action.cls` | Deployed in Salesforce | Grounded against Render API endpoints. | `[VERIFIED]` |
| **MIAW Web Embed** | Embedded script tag in `SalesforceChatEmbed.tsx` | Pointed to expired sandbox | Headless BFF mode is used instead, preserving custom UI and full branding. | `[VERIFIED]` |

---

## 3. Gap Remediation Action Plan

1. **Frontend Refactoring**:
   - Extract `ChatMessageList.tsx`, `ChatInput.tsx`, and `WelcomeScreen.tsx` from `ChatWidget.tsx` into standalone modular components.
   - Create `MenuItemDetail.tsx` as a direct export of the dish detail view.
   - Run `pnpm --filter @mylapore/web build` to verify zero type regressions.
2. **Execution Mode Traceability**:
   - Explicitly tag every turn payload with `executionMode: "AGENTFORCE" | "SIMPLE_MENU"` so telemetry and auditing records reflect the exact pipeline used.
3. **Documentation Finalization**:
   - Publish all required v2.7 contract, architecture, security, and operations documentation.
