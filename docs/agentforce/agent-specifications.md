# Agentforce AI Autonomous Agent Specifications — Mylapore Express

> **Architecture Status**: Production Verified  
> **Target System**: Salesforce Agentforce Builder (Atlas Reasoning Engine) & External Services  
> **API Gateway**: `https://mylapore-express-api.onrender.com/api/v1/agent`  
> **Companion Specs**: [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](../../SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md), [`SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md`](../../SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md)

---

## The 5 Autonomous Agentforce AI Agents Blueprint

```
                                  AGENTFORCE NETWORK
  ┌───────────────────────────────────────┬───────────────────────────────────────┐
  │                                       │                                       │
  ▼                                       ▼                                       ▼
1. Concierge Agent             2. Order Management Agent       3. Support & Case Agent
   - Menu & Dietary Filter        - Live Order Tracking           - Complaint Escalation
   - Allergen Grounding           - Cancellation Policy           - Refund Request Sync
   - Spice Customization          - Rescheduling Validation       - Human Agent Handoff
   UI: conciergeMenuCarouselLwc   UI: orderActionSheetLwc         UI: supportSentimentHandoffLwc
  │                                       │                                       │
  └───────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
          4. Kitchen Ops Agent                    5. Business Insights Agent
             - Prep Delay Monitoring                 - Executive Sales Metrics
             - Blast Chill Freshness Check           - Dish Re-order Trends
             - Dispatch Handoff Alarms               - Retention & Cohorts
             UI: kitchenKdsKanbanLwc                 UI: executiveCulinaryInsightsLwc
```

---

## Agent 1: Restaurant Customer Concierge Agent

- **Persona**: Cultural Food Discovery, Dietary Guide, and Freshness Educator.
- **Audience**: Guest and signed-in customers browsing dishes on the web or mobile app.
- **Agentforce Topics**:
  - `Menu_Discovery_And_Recommendations`: Queries authentic dishes by category or craving.
  - `Dietary_And_Allergen_Safety`: Enforces strict Jain (no root veg/onions/garlic), Vegan, or Gluten-Free filtering.
  - `Blast_Chilled_Freshness_Education`: Details 38°F blast-chilled preservation and stovetop/microwave reheating instructions.
- **Registered External Actions (OpenAPI 3.0)**:
  - `searchMenu`: `POST /api/v1/agent/menu/search` (Inputs: `query`, `dietaryTags`, `limit`).
  - `getMenuItemDetails`: `GET /api/v1/agent/menu/items/{id}` (Inputs: `itemId`).
- **Grounded System Prompt**:
  ```
  You are the Mylapore Express AI Concierge. Guide customers with authentic warmth ("Vanakkam").
  Always ground dish recommendations via searchMenu. Never invent prices or recipes.
  Enforce dietary safety: Jain (strictly no onion, garlic, or root vegetables).
  Highlight blast-chilled freshness: meals are chilled to 38°F without chemical preservatives.
  ```
- **Lightning UI (`conciergeMenuCarouselLwc`)**:
  Interactive carousel card component embedded in Salesforce MIAW or Experience Cloud showing dish photography, spice scale, 38°F badge, and direct "+ Add to Order" button.

---

## Agent 2: Order Management Agent

- **Persona**: Order Tracking & Transactional Operations Specialist.
- **Audience**: Customers checking status, rescheduling delivery, or requesting cancellations.
- **Agentforce Topics**:
  - `Order_Status_Tracking`: Queries real-time order milestone (`CONFIRMED`, `ACCEPTED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`).
  - `Order_Cancellation_And_Refunds`: Evaluates cancellation policies and executes confirmed cancellations.
  - `Order_Rescheduling_Validation`: Validates 2-hour cutoff rule and updates arrival windows.
- **Registered External Actions (OpenAPI 3.0)**:
  - `getOrderStatus`: `GET /api/v1/agent/orders/{orderNumber}`.
  - `previewCancellation`: `POST /api/v1/agent/orders/{orderNumber}/cancellation-preview`.
  - `submitCancellation`: `POST /api/v1/agent/orders/{orderNumber}/cancellation` (Requires `previewId` & confirmation).
- **Mandatory 2-Step Cancellation Rule**:
  Never execute `submitCancellation` without first invoking `previewCancellation` and presenting the guaranteed refund percentage and cancellation fee to the customer for explicit confirmation.
- **Lightning UI (`orderActionSheetLwc`)**:
  Interactive modal displaying the guaranteed refund meter (100% vs 50% vs 0%), cancellation fee breakdown, and a cryptographic 1-click confirmation button.

---

## Agent 3: Customer Support & Service Cloud Agent

- **Persona**: Triage, Sentiment Detection, and Service Cloud Escalation Specialist.
- **Audience**: Customers experiencing food quality issues, missing items, transit spills, or delivery delays.
- **Agentforce Topics**:
  - `Complaint_Classification`: Categorizes issues into Food Quality, Delivery Delay, Missing Item, or Payment.
  - `Case_Creation_And_SLA`: Generates official Salesforce `Case` record (e.g. `500_SF_...`) with sentiment analysis.
  - `Omni_Channel_Escalation`: Hands off context, transcript, and sentiment to human Service Cloud agents.
- **Registered External Actions (OpenAPI 3.0)**:
  - `createSupportCase`: `POST /api/v1/agent/support/cases` (Inputs: `orderId`, `category`, `summary`, `customerEmail`, `customerName`).
  - `escalateToLiveAgent`: Transmits conversation history to the Omni-Channel Tier 1 queue.
- **Lightning UI (`supportSentimentHandoffLwc`)**:
  Console utility component visualizing customer sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`), conversation summary, and a **`1-Click Courtesy Credit ($10)`** action for instant resolution.

---

## Agent 4: Restaurant Operations / Kitchen KDS Agent

- **Persona**: Kitchen Dispatcher & Operational Watchdog.
- **Audience**: Kitchen Managers, Station Chefs, Delivery Coordinators.
- **Agentforce Topics**:
  - `Kitchen_Acceptance_Monitoring`: Monitors unaccepted orders reaching the 15-minute auto-refund threshold.
  - `Blast_Chilled_Inventory_Audit`: Confirms that meals have reached 38°F before insulated tote packaging.
  - `Driver_Dispatch_Coordination`: Schedules driver pickup 45 minutes prior to delivery window start.
- **Registered External Actions (OpenAPI 3.0)**:
  - `getKitchenQueueMetrics`: `GET /api/v1/admin/kitchen/queue`.
  - `acknowledgeKitchenDelay`: `POST /api/v1/admin/orders/{id}/delay-notice`.
- **Lightning UI (`kitchenKdsKanbanLwc`)**:
  Touchscreen KDS dashboard with operational metric tiles, 15m timeout alarm banners, and 1-tap stage advancement buttons.

---

## Agent 5: Restaurant Business Insights Agent

- **Persona**: Executive Culinary Analyst & Revenue Intelligence Specialist.
- **Audience**: Restaurant Owners, Financial Officers, Kitchen Planners.
- **Agentforce Topics**:
  - `Culinary_Sales_Analytics`: Analyzes sales trends, category distribution, and average ticket size.
  - `Dish_Reorder_Retention`: Computes 14-day customer re-order rates across authentic recipes.
  - `Peak_Ordering_Windows`: Identifies delivery slot volume distribution to optimize batch cooking.
- **Registered External Actions (OpenAPI 3.0)**:
  - `getDishReorderRates`: `GET /api/v1/admin/analytics/dish-reorders`.
  - `getPeakHourlyVolume`: `GET /api/v1/admin/analytics/hourly-volume`.
- **Lightning UI (`executiveCulinaryInsightsLwc`)**:
  Lightning Dashboard widget featuring top re-ordered dishes, repeat rate badges, and delivery slot demand heatmaps.

---

## Key Architectural Gaps Addressed & Remediated

1. **Named Credential Security Guard (`GAP-01`)**: All endpoints require `X-Agentforce-Api-Key` header.
2. **Real-time Chat Binding (`GAP-02`)**: Next.js client connected via Salesforce MIAW (`embeddedservice_bootstrap.js`) or Headless Connect API.
3. **Render Cold-Start Timeout Protection (`GAP-03`)**: Pinging `/api/v1/health` prevents Render free tier cold-start timeout during 10s Agentforce synchronous callouts.
4. **Bidirectional Webhook Sync (`GAP-04`)**: Service Cloud updates sync into PostgreSQL via `POST /api/v1/integrations/salesforce/webhook`.
5. **OpenAPI Schema Strictness (`GAP-05`)**: Explicit `operationId` on all 5 agent actions guarantees clean External Services registration.
6. **Financial Idempotency Locking (`GAP-06`)**: Database-level `IdempotencyRecord` locking prevents double refunds on repeated user chat prompts.
