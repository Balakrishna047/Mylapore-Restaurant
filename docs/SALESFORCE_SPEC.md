# Salesforce Specification — Service Cloud, Agentforce Foundation, & Monorepo Architecture

> **Architecture Status**: Production Verified  
> **Backend Base URL**: `https://mylapore-express-api.onrender.com/api/v1`  
> **OpenAPI Swagger Schema**: `https://mylapore-express-api.onrender.com/api/docs`  
> **Primary Guides**:  
> - [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](../SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md)  
> - [`SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md`](../SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md)  
> - [`SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md`](../SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md)

---

## 1. Purpose & System Boundaries

Salesforce provides CRM, customer service, case routing, Agentforce AI reasoning, and executive analytics. It is **not** the master transactional database for live menu availability, cart state, or payment execution. NestJS/PostgreSQL owns commerce truth.

---

## 2. Key Architectural Gaps Addressed & Remediated

| Gap ID | Area | Risk Addressed | Production Solution Implemented |
|---|---|---|---|
| **GAP-01** | **Agent Gateway Security** | Open endpoints vulnerable to unauthorized cancellation. | Added `AgentforceApiKeyGuard` requiring `X-Agentforce-Api-Key` pre-shared in Salesforce Named Credentials. |
| **GAP-02** | **Chat Disconnect** | Web chat using local regex instead of Agentforce. | Mapped integration to Salesforce MIAW (`embeddedservice_bootstrap.js`) & Headless Connect API. |
| **GAP-03** | **Callout Timeout** | Render cold start (40s) exceeding SF 10s timeout. | Automated `/health` keep-alive ping or persistent container upgrade. |
| **GAP-04** | **Unidirectional Sync** | Changes in Service Cloud not updating PostgreSQL. | Built `POST /api/v1/integrations/salesforce/webhook` with HMAC-SHA256 signature verification. |
| **GAP-05** | **OpenAPI Strictness** | External Services rejecting ambiguous actions. | Added explicit `operationId` on all 5 Agent Gateway routes. |
| **GAP-06** | **Financial Idempotency** | Double refund risk on repeated conversational turns. | Enforced database-level `IdempotencyRecord` locking on `previewId`. |
| **GAP-07** | **Multi-Turn Memory** | Context loss across Agentforce turns. | Introduced `SessionContextDTO` containing session token & dietary constraints. |
| **GAP-08** | **Omni-Channel Handoff** | Context loss during human escalation. | Injected conversation recap and sentiment score into `Case` fields. |

---

## 3. Custom Objects Schema (Production)

### 1. `Restaurant_Order__c`
- `Name`: Auto-generated or set to `MYL-2026-XXXX`.
- `External_Order_ID__c` (Text, External ID, Unique): PostgreSQL UUID.
- `Contact__c` (Lookup Contact): Customer record.
- `Status__c` (Picklist): `PENDING_PAYMENT`, `PAID`, `CONFIRMED`, `ACCEPTED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REFUNDED`.
- `Order_Total__c` (Currency): Total calculated by backend.
- `Delivery_Slot__c` (Text): Scheduled delivery window.
- `Blast_Chilled_Temp__c` (Text): Default `38°F`.
- `Last_Synced_At__c` (DateTime).

### 2. `Order_Dish_Line__c`
- `Restaurant_Order__c` (Master-Detail).
- `Menu_Item_Name__c` (Text).
- `Quantity__c` (Number).
- `Unit_Price__c` (Currency).
- `Spice_Level__c` (Text: `MILD`, `MEDIUM`, `HOT`, `EXTRA_HOT`).

### 3. `Payment_Transaction__c`
- `External_Payment_ID__c` (Text, External ID, Unique).
- `Restaurant_Order__c` (Lookup).
- `Stripe_Payment_ID__c` (Text): Masked reference (`pi_...`).
- `Amount__c` (Currency).
- `Status__c` (Text: `SUCCEEDED`, `FAILED`, `REFUNDED`).

### 4. `Refund_Request__c`
- `External_Refund_ID__c` (Text, External ID, Unique).
- `Restaurant_Order__c` (Lookup).
- `Amount__c` (Currency).
- `Reason__c` (Text).
- `Approval_Status__c` (Picklist: `PENDING`, `APPROVED`, `REJECTED`).

### 5. `Agent_Interaction__c`
- `External_Interaction_ID__c` (Text, External ID, Unique).
- `Agent_Persona__c` (Text: `Concierge`, `Order_Management`, `Support`, `Kitchen_Ops`, `Insights`).
- `Session_ID__c` (Text).
- `Intent__c` (Text).
- `Summary__c` (Long Text Area).
- `Timestamp__c` (DateTime).

---

## 4. Salesforce Lightning UI Components (LWC)

The platform provides 5 purpose-built Lightning Web Components:

1. **`conciergeMenuCarouselLwc`**: Dish card carousel embedded in Agentforce chat with image, 38°F chilled badge, dietary pills, and "+ Add to Order" button.
2. **`orderActionSheetLwc`**: Interactive Lightning Flow modal displaying the guaranteed refund meter (100% vs 50% vs 0%) and 1-click cryptographic cancellation.
3. **`supportSentimentHandoffLwc`**: Console utility bar component displaying customer sentiment score, conversation summary, and a **`1-Click Courtesy Credit ($10)`** action.
4. **`kitchenKdsKanbanLwc`**: Touchscreen KDS board with operational metric tiles, 15m timeout alarm, and stage advancement buttons.
5. **`executiveCulinaryInsightsLwc`**: Lightning Dashboard widget featuring top re-ordered dishes, repeat rate badges, and delivery slot demand heatmaps.

---

## 5. Bidirectional Integration Architecture

### Outbound Sync (PostgreSQL ➔ Salesforce)
The NestJS `OutboxService` sweeps pending events from the `IntegrationEvent` table every 15 seconds, invoking `SalesforceAdapter` to update `Restaurant_Order__c`, `Payment_Transaction__c`, and `Refund_Request__c`.

### Inbound Webhook (Salesforce ➔ PostgreSQL)
Salesforce publishes updates to `POST /api/v1/integrations/salesforce/webhook` with an `X-Salesforce-Hmac-Sha256` signature header whenever a service agent updates order status or authorizes a concession.
