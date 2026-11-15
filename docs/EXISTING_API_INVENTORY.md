# Existing API Inventory: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Host URL (Render Production)**: `https://mylapore-express-api.onrender.com`  
**Audit Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This inventory catalogues all public, internal, and Salesforce-facing REST APIs exposed by the NestJS backend (`apps/api`). The APIs are grouped by architectural role:
1. **Chatbot BFF Endpoints**: Consumed by the React storefront chat widget.
2. **Agent Gateway Invocable Endpoints**: Consumed by Salesforce Apex Callouts / Agentforce Actions.
3. **Menu Catalog Public Endpoints**: Consumed by the website menu pages and shared catalog services.
4. **Platform & Health Endpoints**: Monitoring, OpenAPI schema, and database connectivity.

---

## 2. Chatbot BFF API (`ChatModule`)

| Endpoint | Method | Auth / Header | Request Payload | Response Schema | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/chat/session` | `POST` | None (Guest handshake) | `{ sessionToken?: string, outletId?: string }` | `{ sessionToken: string, sessionId: string, status: string, outletId: string, welcomeMessage: string, displayBlocks: DisplayBlock[] }` | `[VERIFIED]` |
| `/api/v1/chat/turn` | `POST` | `x-session-token` or payload `sessionToken` | `{ sessionToken: string, userQuery: string }` | `{ turnId: string, turnNumber: number, turnToken: string, agentText: string, displayBlocks: DisplayBlock[] }` | `[VERIFIED]` |
| `/api/v1/chat/history/:sessionId` | `GET` | Optional auth | Path parameter `sessionId` | `{ sessionId: string, turns: ChatTurnRecord[] }` | `[VERIFIED]` |

### Security & Reliability Constraints:
- **Session Mutex Lock (`SessionLockGuard`)**: If an in-flight turn is currently executing for the provided `sessionToken`, incoming requests immediately return **HTTP 423 Locked** (`{"statusCode": 423, "message": "Session is busy processing a turn."}`).
- **Deadline Control**: A 24-second timer wrapper races against agent processing to ensure turns resolve within the 25-second API gateway timeout.
- **Signed Turn Token**: Every completed turn returns a cryptographic HMAC-SHA256 `turnToken` signing `sessionId:turnNumber:timestamp`.

---

## 3. Agent Gateway Invocable API (`AgentModule`)

These endpoints serve as the authoritative grounding gateway for Salesforce Agentforce Apex Invocable Actions. They enforce the core doctrine: **"The AI talks; the backend decides."**

| Endpoint | Method | Required Auth Header | Purpose | Response Schema | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/agent/browse-menu` | `POST` | `x-gateway-auth` or `x-agentforce-api-key` | Query catalog by category, dietary tag, or spice level | `{ success: boolean, count: number, items: AgentMenuItem[], categories: AgentCategory[] }` | `[VERIFIED]` |
| `/api/v1/agent/search-menu` | `POST` | `x-gateway-auth` or `x-agentforce-api-key` | Fuzzy natural language dish query | `{ success: boolean, count: number, items: AgentMenuItem[] }` | `[VERIFIED]` |
| `/api/v1/agent/item-details` | `POST` | `x-gateway-auth` or `x-agentforce-api-key` | Exact recipe, allergens, ingredients, and reheating steps | `{ success: boolean, item: AgentMenuItemDetail }` | `[VERIFIED]` |
| `/api/v1/agent/place-order` | `POST` | `x-gateway-auth` or `x-agentforce-api-key` | Transactional order placement *(Frozen out of Chatbot v2.7 Scope)* | `{ success: boolean, orderId: string, status: string }` | `[VERIFIED]` |
| `/api/v1/agent/order-status/:id` | `GET` | `x-gateway-auth` or `x-agentforce-api-key` | Order status lookup *(Frozen out of Chatbot v2.7 Scope)* | `{ success: boolean, order: OrderSummary }` | `[VERIFIED]` |

### Authentication Guard:
- `AgentforceApiKeyGuard` (`src/common/agentforce-api-key.guard.ts`) validates inbound callouts against either:
  1. `X-Gateway-Auth` header injected by Salesforce Named Credential External Credential (`Mylapore_Gateway_ExtCred`), OR
  2. `X-Agentforce-API-Key` header (`AGENTFORCE_API_KEY`).
- Unauthorized requests return **HTTP 401 Unauthorized**.

---

## 4. Public Menu Catalog API (`MenuModule`)

| Endpoint | Method | Auth | Query Parameters | Description | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/menu` | `GET` | Public | `categoryId`, `dietary`, `spiceLevel`, `search` | Backward-compatible root endpoint for Apex callouts and website menu | `[VERIFIED]` |
| `/api/v1/menu/items` | `GET` | Public | `categoryId`, `dietary`, `spiceLevel`, `search` | Returns paginated list of published dishes with category join | `[VERIFIED]` |
| `/api/v1/menu/categories` | `GET` | Public | None | Returns active categories ordered by `displayOrder` with item counts | `[VERIFIED]` |
| `/api/v1/menu/items/:id` | `GET` | Public | None | Returns complete dish record by UUID or unique slug | `[VERIFIED]` |
| `/api/v1/menu/featured` | `GET` | Public | None | Returns curated hero items with social proof badges | `[VERIFIED]` |

---

## 5. System Health & Documentation Endpoints

| Endpoint | Method | Auth | Output Format | Description | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Public | JSON | Database connection pool probe, uptime, and service timestamp | `[VERIFIED]` |
| `/api/docs` | `GET` | Public | HTML (Swagger UI) | Interactive API exploration and parameter testing | `[VERIFIED]` |
| `/api/docs-json` | `GET` | Public | JSON (OpenAPI 3.0) | Authoritative OpenAPI specification consumed by Salesforce External Services | `[VERIFIED]` |

---

## 6. Rate Limiting & CORS Configuration

- **CORS Allowlist**: Strictly limited to production storefront domain (`https://mylapore-express-web.onrender.com`) and local development origins (`http://localhost:3000`, `http://localhost:3001`) `[VERIFIED]`.
- **Global Rate Limiting**: NestJS `@nestjs/throttler` configured for 60 requests per minute per IP address on public endpoints `[VERIFIED]`.
- **Turn Rate Limiting**: Protected by per-session concurrency mutex to eliminate duplicate turns or race conditions `[VERIFIED]`.
