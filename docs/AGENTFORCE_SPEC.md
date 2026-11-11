# Agentforce Specification — Mylapore Express Enterprise AI Network

> **Architecture Status**: Production Verified  
> **API Gateway Base**: `https://mylapore-express-api.onrender.com/api/v1/agent`  
> **OpenAPI Swagger Schema**: `https://mylapore-express-api.onrender.com/api/docs`  
> **Primary Guides**:  
> - [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](../SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md)  
> - [`SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md`](../SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md)  
> - [`SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md`](../SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md)

---

## 1. Operating Principle & Guardrails

Agentforce operates as an intelligent conversational reasoning layer powered by Salesforce Atlas. It interprets customer intents, grounds answers via OpenAPI External Services, and recommends actions. The model is **never** the financial or transactional system of record. NestJS/PostgreSQL cryptographically validates pricing, inventory, state transitions, and refunds.

---

## 2. Key Architectural Gaps Addressed & Remediated

1. **`GAP-01` (Security)**: Unauthenticated endpoints protected via `AgentforceApiKeyGuard` requiring `X-Agentforce-Api-Key` pre-shared in Salesforce Named Credentials.
2. **`GAP-02` (Chat Disconnect)**: Mapped web chat from local regex to Salesforce MIAW (`embeddedservice_bootstrap.js`) & Headless Connect API.
3. **`GAP-03` (Cold-Start Callout Timeout)**: 10-second Salesforce callout wall protected via automated `/health` keep-alive pings every 8 minutes.
4. **`GAP-04` (Unidirectional Sync)**: Inbound webhook `POST /api/v1/integrations/salesforce/webhook` with HMAC verification for bidirectional sync from Service Cloud to PostgreSQL.
5. **`GAP-05` (OpenAPI Strictness)**: Added explicit `operationId` across all 5 Agent Gateway actions.
6. **`GAP-06` (Financial Idempotency)**: Enforced `IdempotencyRecord` database-level transaction locking on `previewId`.
7. **`GAP-07` (Multi-Turn Memory)**: Added session correlation tokens preserving dietary preferences across conversational turns.
8. **`GAP-08` (Omni-Channel Escalation)**: Automated transcription and sentiment scoring injection into Service Cloud `Case` records.

---

## 3. The 5 Autonomous Agentforce Agents Portfolio

| Agent | Target Role | Key Topics | Key External Actions | Lightning UI Component (LWC) |
|---|---|---|---|---|
| **1. Concierge** | Discovery, Dietary, Freshness | `Menu_Discovery_And_Recommendations`, `Dietary_And_Allergen_Safety`, `Blast_Chilled_Freshness_Education` | `searchMenu`, `getMenuItemDetails` | `conciergeMenuCarouselLwc` (Interactive dish cards with 38°F badge & "+ Add" button) |
| **2. Order Management** | Tracking, Cancellation, Rescheduling | `Order_Status_Tracking`, `Order_Cancellation_And_Refunds`, `Order_Rescheduling_Validation` | `getOrderStatus`, `previewCancellation`, `submitCancellation` | `orderActionSheetLwc` (Refund calculation meter & 1-click cryptographic cancellation) |
| **3. Customer Support** | Triage, Sentiment, Escalation | `Complaint_Classification`, `Case_Creation_And_SLA`, `Omni_Channel_Escalation` | `createSupportCase`, `escalateToLiveAgent` | `supportSentimentHandoffLwc` (Sentiment score gauge, AI recap & courtesy credit button) |
| **4. Kitchen Operations** | 15m Timeout, 38°F Alarms | `Kitchen_Acceptance_Monitoring`, `Blast_Chilled_Inventory_Audit`, `Driver_Dispatch_Coordination` | `getKitchenQueueMetrics`, `acknowledgeKitchenDelay` | `kitchenKdsKanbanLwc` (Touchscreen KDS board with elapsed timers & stage advance buttons) |
| **5. Business Insights** | Sales, Retention, Peak Slots | `Culinary_Sales_Analytics`, `Dish_Reorder_Retention`, `Peak_Ordering_Windows` | `getDishReorderRates`, `getPeakHourlyVolume` | `executiveCulinaryInsightsLwc` (Retention rankings, peak window heatmaps & promo ROI) |

---

## 4. Grounded Action Catalogue (OpenAPI 3.0)

All actions are strictly typed and require explicit server-side validation:

| Action Name | Target Endpoint | Model-Writable Inputs | Server-Derived Context | Output Attributes |
|---|---|---|---|---|
| `searchMenu` | `POST /api/v1/agent/menu/search` | `query`, `dietaryTags`, `limit` | session token, outlet | `items` (dish cards with 38°F badge, spice, price) |
| `getMenuItemDetails` | `GET /api/v1/agent/menu/items/{id}` | `itemId` | session token | `reheatingInstructions`, `allergens`, `ingredients` |
| `getOrderStatus` | `GET /api/v1/agent/orders/{orderNumber}` | `orderNumber` | caller identity | `status`, `stage`, `deliveryWindow`, `blastChilledTemp` |
| `previewCancellation` | `POST /api/v1/agent/orders/{orderNumber}/cancellation-preview` | `orderNumber` | kitchen stage | `eligible`, `refundPercentage`, `refundAmount`, `previewId` |
| `submitCancellation` | `POST /api/v1/agent/orders/{orderNumber}/cancellation` | `previewId`, `confirmation` | idempotency key | `status: "CANCELLED"`, `refundIssued`, `salesforceRefundId` |
| `createSupportCase` | `POST /api/v1/agent/support/cases` | `category`, `summary`, `orderId` | customer identity | `caseCreated: true`, `caseNumber: "500_SF_..."` |

---

## 5. Security & Identity Contract

1. **Authentication**: All Agentforce External Service requests pass an `X-Agentforce-Api-Key` header generated by Salesforce Named Credentials.
2. **Immutability**: Identity claims (`userId`, `sessionToken`) are verified server-to-server and cannot be overridden by conversational prompts.
3. **Audit Logging**: Every action execution writes an immutable record to the `AuditLog` table containing timestamp, caller IP/session, tool arguments, and outcome.
