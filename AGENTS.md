# Mylapore Express: AI & Agentforce Specification Guide (v2.7 Master Specification)

This repository contains the architecture, specifications, backend services, frontend applications, and Salesforce Agentforce AI agents powering the **Mylapore Express Enterprise Restaurant E-commerce Platform**.

> 📖 **Comprehensive Developer & Implementation Guide**:  
> For the complete, end-to-end architectural documentation, REST API contracts, database schema, and step-by-step Salesforce Agentforce setup, refer to:  
> [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](./SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md)

---

## 1. Governing Engineering Doctrine
> **"The AI talks; the backend decides."**
> 
> *The AI agent handles natural language conversation, intent recognition, and customer interaction. The backend owns prices, item availability, diet tags, display blocks, session state, and transactional authorization. The AI is never allowed to invent, recalculate, or hallucinate restaurant data.*

---

## 2. Release 1 Frozen Scope & Boundary Rules

To guarantee enterprise food safety, operational compliance, and cryptographic reliability, the customer-facing concierge strictly implements **two flows** and **three discovery actions**:

### Flow 1: Chat Initialization
- Open chat widget.
- Create or resume guest session (`sess_<uuid>`).
- Render deterministic South Indian welcome greeting.
- Present server-issued category button display blocks.

### Flow 2: Menu Discovery
The three approved, grounded Agentforce actions are:
1. `listMenuCategories`: Retrieve published culinary categories (`POST /api/v1/agent/browse-menu`).
2. `searchMenu`: Natural-language search by dish, dietary tag (Jain, Vegan, Gluten-Free), or spice level (`POST /api/v1/agent/search-menu`).
3. `getMenuItemDetails`: Retrieve authoritative price, ingredients, allergen warnings, blast-chilled freshness badge, and reheating instructions (`POST /api/v1/agent/item-details`).

### Strictly Prohibited inside Chatbot Concierge:
- No cart modification (`cart-add`).
- No checkout or payment processing.
- No direct order placement or refunds inside chat.
- No Case/Ticket creation inside discovery turns.
- No POS, WhatsApp, or third-party delivery dispatch inside discovery turns.

---

## 3. Two Server-Controlled Execution Modes

### Mode A: `SIMPLE_MENU` (Deterministic Local Fallback)
```
React Storefront → NestJS BFF → Catalog Service → PostgreSQL → Display Block → React
```
- Completely deterministic; zero dependency on external AI services.
- Never described as Agentforce execution.
- Activated automatically on local development or if Salesforce Agentforce is disabled/unreachable.

### Mode B: `AGENTFORCE` (Full Headless Einstein Agentforce Invocable Mode)
```
React Storefront → NestJS BFF → Salesforce Agent API → Agentforce → Apex Action → Named Credential → NestJS Agent Gateway → Catalog Service → PostgreSQL → Display Block → React
```
- Active in production when `SALESFORCE_ENABLED="true"`.
- Uses Einstein Agent API for natural-language conversational reasoning.
- Invokes Apex Invocable Actions (`Mylapore_Menu_Action.cls`, `Mylapore_Search_Menu_Action.cls`, `Mylapore_Item_Details_Action.cls`) grounded in PostgreSQL.
- Every turn response records the actual mode executed (`executionMode: "AGENTFORCE" | "SIMPLE_MENU"`).

---

## 4. Architectural Boundary & Security Guardrails
- **Zero Direct DB Access**: AI agents are grounded strictly via structured OpenAPI tools and read-only schema contexts through the NestJS Agent Gateway (`/api/v1/agent/*`).
- **Session Mutex Lock (HTTP 423)**: Prevents turn concurrency races and duplicate AI queries.
- **24-Second Deadline Control**: Turn timeout promise races against external agent responses, gracefully degrading to `SIMPLE_MENU` display blocks.
- **Exact-Turn Correlation**: Display blocks carry `(sessionId, turnId, requestId, catalogVersion)`. Client rejects expired or mismatched blocks.
- **Audit Logging**: Every turn and agent-invoked tool execution is captured in the backend `ChatTurn`, `ChatDisplayBlock`, and `AuditLog` tables with timestamps and caller user IDs.
