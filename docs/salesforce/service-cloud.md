# Salesforce Service Cloud Integration Guide — Mylapore Express

> **Architecture Status**: Production Verified  
> **API Gateway**: `https://mylapore-express-api.onrender.com/api/v1`  
> **Swagger & OpenAPI 3.0**: `https://mylapore-express-api.onrender.com/api/docs`  
> **Companion Specs**: [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](../../SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md), [`SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md`](../../SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md)

---

## 1. CRM Scope & System Boundaries

- **PostgreSQL as System of Record (SoR)**:
  - PostgreSQL owns all commerce data: live menu items, carts, pricing calculations, blast-chilled temperatures (38°F), driver dispatch, order states, and Stripe payments.
  - Salesforce Service Cloud owns customer relationship history, support cases, omni-channel routing, SLA tracking, and Agentforce reasoning.
- **Security & Financial Guardrails**:
  - Raw credit card PANs and full Stripe secrets are **never** stored in or transferred to Salesforce.
  - Only masked payment references (`pi_...`) and transaction amounts are mapped.
  - All Agentforce calls require Named Credential pre-shared API keys (`X-Agentforce-Api-Key`).

---

## 2. Bidirectional Synchronization Architecture

```
┌───────────────────────────────────────┐                  ┌───────────────────────────────────────┐
│     POSTGRESQL & NESTJS BACKEND       │                  │       SALESFORCE SERVICE CLOUD        │
│                                       │                  │                                       │
│ 1. Transactional Outbox Worker        │                  │                                       │
│    (Sweeps pending events every 15s)  ├──────REST───────►│ - Restaurant_Order__c Projection      │
│    - ORDER_CREATED, PAYMENT_CAPTURED  │                  │ - Contact, Case (500_SF_...)          │
│                                       │                  │                                       │
│ 2. Inbound Webhook Controller         │                  │ 3. Apex Trigger / Salesforce Flow     │
│    (/api/v1/integrations/sf/webhook)  │◄──HMAC SHA256────┤    (Fires when Support Agent cancels  │
│    - Updates Order state & Audit Log  │                  │     or issues courtesy refund)        │
└───────────────────────────────────────┘                  └───────────────────────────────────────┘
```

### 2.1 Outbound: PostgreSQL ➔ Salesforce (Outbox Daemon)
The `OutboxService` (`apps/api/src/integrations/outbox.service.ts`) scans the `IntegrationEvent` table every 15 seconds and invokes `SalesforceAdapter`:
- `syncOrder(order)`: Projects live order into `Restaurant_Order__c`.
- `syncPayment(payment)`: Logs captured amount into `Payment_Transaction__c`.
- `syncRefund(refund)`: Creates audited `Refund_Request__c`.

### 2.2 Inbound: Salesforce ➔ PostgreSQL (Remediating GAP-04)
When a customer service agent cancels an order or grants a concession inside Salesforce Service Console, an Apex trigger publishes a signed HTTP request to:
* **Endpoint**: `POST /api/v1/integrations/salesforce/webhook`
* **Signature Header**: `X-Salesforce-Hmac-Sha256: <base64_hash>`
* **Payload**:
  ```json
  {
    "eventType": "ORDER_STATUS_CHANGED",
    "orderNumber": "MYL-2026-1003",
    "newStatus": "CANCELLED",
    "agentNotes": "Cancelled by Tier 2 support agent due to customer address change"
  }
  ```
The backend verifies the cryptographic HMAC signature, transitions the order status in PostgreSQL, and logs the change to `OrderStatusHistory`.

---

## 3. Custom Objects & Relational Schema Mapping

| PostgreSQL Table | Salesforce Object Name | API Name | Key Fields & Attributes |
|---|---|---|---|
| `User` (Role: CUSTOMER) | **Contact** | `Contact` | `Email`, `FirstName`, `LastName`, `Phone`, `External_ID__c` |
| `CustomerAddress` | **Contact Point Address** | `ContactPointAddress` | `Street`, `City`, `State`, `PostalCode`, `IsDefault` |
| `Order` | **Restaurant Order** | `Restaurant_Order__c` | `Name` (`MYL-2026-XXXX`), `Status__c`, `Total__c`, `Delivery_Slot__c`, `Blast_Chilled_Temp__c` (38°F) |
| `OrderItem` | **Order Dish Line** | `Order_Dish_Line__c` | `Restaurant_Order__c`, `Menu_Item_Name__c`, `Quantity__c`, `Unit_Price__c`, `Spice_Level__c` |
| `Payment` | **Payment Transaction** | `Payment_Transaction__c` | `Restaurant_Order__c`, `Stripe_Payment_ID__c`, `Amount__c`, `Status__c` |
| `Refund` | **Refund Request** | `Refund_Request__c` | `Restaurant_Order__c`, `Amount__c`, `Reason__c`, `Approval_Status__c` |
| `SupportTicket` | **Case** | `Case` | `CaseNumber`, `Subject`, `Description`, `Priority`, `Sentiment__c`, `Order_Number__c` |
| `AuditLog` | **Agent Interaction** | `Agent_Interaction__c` | `Agent_Persona__c`, `Action_Executed__c`, `Session_ID__c`, `Timestamp__c` |

---

## 4. Salesforce Lightning UI Components (LWC) in Service Cloud

Three dedicated Lightning Web Components are deployed to the Salesforce Service Console:

### 4.1 `orderTrackerMapLwc`
* **Placement**: Primary tab of `Restaurant_Order__c` Record Page.
* **Function**: Real-time Lightning Path visualizing the 6 order stages:
  `CONFIRMED` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY (38°F)` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.

### 4.2 `customerReheatingCardLwc`
* **Placement**: Right sidebar of `Case` and `Restaurant_Order__c` Record Pages.
* **Function**: Provides call center agents with instant stovetop, microwave, and tiffin batter reheating protocols, allergen flags, and blast-chilling freshness verbiage to address customer inquiries.

### 4.3 `supportSentimentHandoffLwc`
* **Placement**: Omni-Channel Utility Bar and Case Lightning Page.
* **Function**: Visualizes customer sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`), displays the Agentforce AI conversation recap, and offers a **`1-Click Courtesy Credit`** button for instant resolution.

---

## 5. Security & Named Credentials Configuration

To remediate **GAP-01** (unauthorized access to Agent Gateway):
1. In Salesforce Setup, go to **Named Credentials** ➔ **New**.
2. **Label**: `Mylapore_Express_API`
3. **URL**: `https://mylapore-express-api.onrender.com`
4. **Custom Headers**:
   - Name: `X-Agentforce-Api-Key`
   - Value: `{!$Credential.Password}` (stores the shared `AGENTFORCE_API_KEY`).
5. All External Service actions automatically inherit this secure header, preventing unauthenticated access.
