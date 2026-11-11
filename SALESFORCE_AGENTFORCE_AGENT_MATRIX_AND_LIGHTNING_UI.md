# Salesforce Agentforce: 5 Autonomous AI Agents, Topics, Actions & Lightning UI Specification

> **Platform**: Salesforce Agentforce, Service Cloud & Next.js 14 Monorepo  
> **Repository**: `Balakrishna047/Mylapore-Restaurant`  
> **Companion Documents**:  
> - [`SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md`](./SALESFORCE_AGENTFORCE_DEVELOPER_GUIDE.md)  
> - [`SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md`](./SALESFORCE_AGENTFORCE_GAPS_AND_ADVANCED_FEATURES.md)  
> **Document Purpose**: Complete, production-grade specification for every Agentforce Agent (Topics, System Prompts, Actions, Gaps) paired with dedicated **Salesforce Lightning UI Components (LWC)**.

---

## Master Architecture: The 5-Agent Network

```
                                  AGENTFORCE NETWORK
  ┌───────────────────────────────────────┬───────────────────────────────────────┐
  │                                       │                                       │
  ▼                                       ▼                                       ▼
AGENT 1: Concierge Agent        AGENT 2: Order Management       AGENT 3: Customer Support
UI: conciergeMenuCarouselLwc    UI: orderActionSheetLwc         UI: supportSentimentHandoffLwc
Topics: Discovery, Dietary      Topics: Tracking, Cancel, Slot  Topics: Case Creation, Escalation
  │                                       │                                       │
  └───────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
          AGENT 4: Kitchen Operations             AGENT 5: Business Insights
          UI: kitchenKdsKanbanLwc                 UI: executiveCulinaryInsightsLwc
          Topics: 15m Timeout, 38°F Alarms        Topics: Re-order Rates, Peak Windows
```

---

## Agent 1: Restaurant Customer Concierge Agent

### 1. Persona & Architectural Role
* **Role**: Culinary Concierge, Food Discovery, Dietary Filtering, and Blast-Chilling Freshness Guide.
* **Target Users**: Guest visitors and authenticated customers browsing the menu.
* **Hosting Context**: Embedded in Next.js web application via Salesforce MIAW and Experience Cloud customer portal.

### 2. Topics Breakdown
1. `Menu_Discovery_And_Recommendations`: Queries authentic dishes by category, name, or craving.
2. `Dietary_And_Allergen_Safety`: Filters dishes strictly matching Jain, Vegan, Gluten-Free, or allergen exclusions (Peanuts, Sesame, Wheat).
3. `Blast_Chilled_Freshness_Education`: Explains rapid blast-chilling at 38°F and home reheating protocols.

### 3. Clear System Instructions (System Prompt)
```
You are the Mylapore Express AI Culinary Concierge, representing an authentic South Indian restaurant from Chennai.
Your mission is to guide customers to delicious, preservative-free comfort meals with warmth, hospitality ("Vanakkam"), and uncompromising dietary accuracy.

CORE OPERATING DIRECTIVES:
1. ALWAYS ground your dish recommendations using the SearchMenuAction tool. NEVER invent dishes, prices, or ingredients.
2. DIETARY FILTERING:
   - JAIN: Strictly no onions, garlic, or root vegetables. Only recommend items with the JAIN dietary tag (e.g. Puliyodarai, Vathal Kuzhambu, Potato Kara Kari - Jain option).
   - VEGAN: 100% plant-based made with cold-pressed sesame or groundnut oils (e.g. South Indian Veg Kurma, Murungai Keerai Kootu).
   - GLUTEN-FREE: Recommend verified gluten-free items and mention that kitchen uses strict cross-contamination prevention.
3. FRESHNESS EXPLANATION:
   - Emphasize that our dishes are freshly prepared and immediately blast-chilled to 38°F to lock in flavor without chemical preservatives.
   - Advise customers to reheat thoroughly to 165°F (stovetop pan for dry dishes, microwave for curries/rice).
4. RESTRICTIONS:
   - Do not process payments or collect credit card information in chat.
   - Do not promise delivery outside our San Jose / Bay Area delivery territory.
```

### 4. Registered Actions & Schema Contracts
* **Action Name**: `SearchMenuAction`
  * **Target Endpoint**: `POST /api/v1/agent/menu/search`
  * **Inputs**: `query` (String), `dietaryTags` (Array of Strings: `["JAIN", "VEGAN", "GLUTEN_FREE"]`), `limit` (Integer: 1–10).
  * **Outputs**: `items` (Array of Dish Objects: `id`, `name`, `description`, `price.amountMinor`, `category`, `spiceLevel`).
* **Action Name**: `GetMenuItemDetailsAction`
  * **Target Endpoint**: `GET /api/v1/agent/menu/items/{id}`
  * **Inputs**: `itemId` (String).
  * **Outputs**: `reheatingInstructions`, `allergens`, `ingredients`, `nutritionServing`.

### 5. Identified Gaps & Edge Cases
* ❌ *Gap*: In text-only chat, the customer cannot see the authentic dish photo, causing hesitation.
* ❌ *Gap*: Customer cannot add the recommended dish directly into the cart from chat.
* ✅ *Remediation*: Deploy **`conciergeMenuCarouselLwc`** into the Agentforce chat window.

### 6. Advanced Lightning UI: `conciergeMenuCarouselLwc`
Renders an interactive dish card carousel with image, spice flame, 38°F badge, and 1-click cart addition.

#### `conciergeMenuCarouselLwc.html`
```html
<template>
    <div class="slds-scrollable_x slds-p-around_x-small carousel-container">
        <div class="slds-grid slds-gutters_x-small">
            <template for:each={dishes} for:item="dish">
                <div key={dish.id} class="slds-col slds-size_10-of-12 slds-medium-size_5-of-12 card-wrapper">
                    <div class="dish-card slds-box slds-box_x-small slds-theme_default slds-radius_medium">
                        <!-- Image & 38°F Badge -->
                        <div class="image-container">
                            <img src={dish.imageUrl} alt={dish.name} class="dish-img" />
                            <span class="temp-badge">❄️ 38°F Chilled</span>
                        </div>
                        <!-- Dish Details -->
                        <div class="slds-p-around_x-small">
                            <div class="slds-grid slds-grid_align-spread">
                                <h4 class="slds-text-heading_small slds-truncate font-serif">{dish.name}</h4>
                                <span class="price-tag">${dish.formattedPrice}</span>
                            </div>
                            <p class="slds-text-body_small slds-m-top_xx-small text-muted slds-line-clamp_2">
                                {dish.description}
                            </p>
                            <!-- Dietary Tags -->
                            <div class="slds-m-top_x-small">
                                <template for:each={dish.dietaryTags} for:item="tag">
                                    <span key={tag} class="dietary-pill">{tag}</span>
                                </template>
                            </div>
                            <!-- Add to Cart Button -->
                            <button class="add-cart-btn slds-m-top_small" onclick={handleAddToCart} data-id={dish.id}>
                                + Add to Order (${dish.formattedPrice})
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
```

#### `conciergeMenuCarouselLwc.js`
```javascript
import { LightningElement, api } from 'lwc';

export default class ConciergeMenuCarouselLwc extends LightningElement {
    @api dishes = [];

    handleAddToCart(event) {
        const dishId = event.target.dataset.id;
        const selectedDish = this.dishes.find(d => d.id === dishId);
        
        // Dispatch custom event to parent MIAW chat container
        this.dispatchEvent(new CustomEvent('addtocart', {
            bubbles: true,
            composed: true,
            detail: { dishId, dishName: selectedDish.name, price: selectedDish.formattedPrice }
        }));
    }
}
```

---

## Agent 2: Order Management Agent

### 1. Persona & Architectural Role
* **Role**: Autonomous Order Tracking, Cancellation Policy Execution, and Delivery Slot Rescheduling.
* **Target Users**: Customers inquiring about active orders (`MYL-2026-XXXX`).

### 2. Topics Breakdown
1. `Order_Status_Tracking`: Queries real-time preparation milestone, blast-chill state, and arrival window.
2. `Order_Cancellation_And_Refunds`: Previews policy fee and executes cryptographic cancellation.
3. `Order_Rescheduling_Validation`: Checks kitchen slot availability and adjusts delivery window.

### 3. Clear System Instructions (System Prompt)
```
You are the Mylapore Express Order Management Agent.
You handle transactional order modifications with absolute accuracy, zero hallucination, and strict policy adherence.

CORE OPERATING DIRECTIVES:
1. ORDER LOOKUP: Always request the Order Reference (e.g. MYL-2026-1003). Call GetOrderStatusAction to ground your response.
2. CANCELLATION WORKFLOW (MANDATORY 2-STEP):
   - STEP 1 (Preview): Call PreviewCancellationAction first. State the current status, refund percentage, and any cancellation fee to the customer.
   - STEP 2 (Confirmation): Ask: "Do you confirm cancellation of order [OrderNumber] with a [RefundPercentage]% refund of $[RefundAmount]?"
   - STEP 3 (Execution): ONLY after customer replies "Yes" or "Confirm", call SubmitCancellationAction with the previewId.
3. STRICT POLICY CONSTRAINTS:
   - If order status is PREPARING, OUT_FOR_DELIVERY, or DELIVERED, explain politely that meals are freshly blast-chilled and perishable, so self-serve cancellation is not permitted. Offer to connect to Customer Support.
4. RESCHEDULING:
   - Rescheduling is permitted free of charge up to 2 hours before the scheduled window.
```

### 4. Registered Actions & Schema Contracts
* **Action Name**: `GetOrderStatusAction`
  * **Target Endpoint**: `GET /api/v1/agent/orders/{orderNumber}`
  * **Outputs**: `status`, `stage`, `deliveryWindow`, `blastChilledTemp`, `items`, `totalAmount`.
* **Action Name**: `PreviewCancellationAction`
  * **Target Endpoint**: `POST /api/v1/agent/orders/{orderNumber}/cancellation-preview`
  * **Outputs**: `eligible` (Boolean), `refundPercentage` (100, 50, 0), `refundAmount` (Float), `previewId` (String), `expiresAt` (ISO Date).
* **Action Name**: `SubmitCancellationAction`
  * **Target Endpoint**: `POST /api/v1/agent/orders/{orderNumber}/cancellation`
  * **Inputs**: `previewId` (String), `confirmation` (Boolean: true), `reasonCode` (String).
  * **Outputs**: `status: "CANCELLED"`, `refundIssued` (Float), `salesforceRefundId` (String).

### 5. Identified Gaps & Edge Cases
* ❌ *Gap*: User types *"Cancel my order right now!"* and an LLM might skip the preview step and trigger an unverified refund.
* ❌ *Gap*: Network retry causes dual execution of `SubmitCancellationAction`.
* ✅ *Remediation*: Enforce server-side `previewId` validation and render **`orderActionSheetLwc`** with an interactive confirmation modal.

### 6. Advanced Lightning UI: `orderActionSheetLwc`
Interactive Lightning component displaying the live refund calculation meter and confirmation action.

#### `orderActionSheetLwc.html`
```html
<template>
    <lightning-card title="Order Action & Cancellation Review" icon-name="standard:order">
        <div class="slds-p-around_medium">
            <!-- Order Header -->
            <div class="slds-grid slds-grid_align-spread slds-m-bottom_medium">
                <div>
                    <h3 class="slds-text-heading_medium font-serif">{orderNumber}</h3>
                    <p class="slds-text-color_weak">Status: <strong class={statusClass}>{orderStatus}</strong></p>
                </div>
                <div class="slds-text-align_right">
                    <span class="slds-text-title">Total Paid</span>
                    <h4 class="slds-text-heading_small">${totalPaid}</h4>
                </div>
            </div>

            <!-- Refund Percentage Meter -->
            <div class="slds-box slds-theme_shade slds-m-bottom_medium">
                <div class="slds-grid slds-grid_align-spread slds-m-bottom_xx-small">
                    <span class="slds-text-title_bold">Guaranteed Refund Eligibility</span>
                    <span class="slds-badge slds-theme_success">{refundPercentage}% Refund</span>
                </div>
                <lightning-progress-bar value={refundPercentage} variant="circular" size="large"></lightning-progress-bar>
                <div class="slds-grid slds-grid_align-spread slds-m-top_x-small slds-text-body_small">
                    <span>Refund Amount: <strong class="slds-text-color_success">${refundAmount}</strong></span>
                    <span>Cancellation Fee: <strong>${cancellationFee}</strong></span>
                </div>
            </div>

            <!-- Confirmation Buttons -->
            <div class="slds-grid slds-grid_align-end slds-gutters_x-small">
                <button class="slds-button slds-button_neutral" onclick={handleKeepOrder}>Keep My Order</button>
                <button class="slds-button slds-button_destructive" onclick={handleExecuteCancellation} disabled={isProcessing}>
                    {confirmButtonLabel}
                </button>
            </div>
        </div>
    </lightning-card>
</template>
```

#### `orderActionSheetLwc.js`
```javascript
import { LightningElement, api, track } from 'lwc';

export default class OrderActionSheetLwc extends LightningElement {
    @api orderNumber;
    @api orderStatus;
    @api totalPaid;
    @api refundPercentage = 100;
    @api refundAmount;
    @api cancellationFee = 0.00;
    @api previewId;
    @track isProcessing = false;

    get confirmButtonLabel() {
        return this.isProcessing ? 'Processing Refund...' : `Confirm Cancellation ($${this.refundAmount} Refund)`;
    }

    get statusClass() {
        return this.orderStatus === 'CONFIRMED' ? 'slds-text-color_success' : 'slds-text-color_warning';
    }

    handleExecuteCancellation() {
        this.isProcessing = true;
        this.dispatchEvent(new CustomEvent('executecancellation', {
            detail: { previewId: this.previewId, orderNumber: this.orderNumber }
        }));
    }

    handleKeepOrder() {
        this.dispatchEvent(new CustomEvent('closeactionsheet'));
    }
}
```

---

## Agent 3: Customer Support & Service Cloud Agent

### 1. Persona & Architectural Role
* **Role**: Complaint Triage, Sentiment Detection, Service Cloud Case Creator, and Omni-Channel Live Agent Handoff.
* **Target Users**: Customers reporting missing items, packaging spills, or reheating difficulties.

### 2. Topics Breakdown
1. `Complaint_Classification`: Categorizes issues into Food Quality, Delivery Delay, Missing Item, or Payment.
2. `Case_Creation_And_SLA`: Logs official Salesforce `Case` record with sentiment rating.
3. `Omni_Channel_Escalation`: Routes conversation to human agent queue when resolution fails.

### 3. Clear System Instructions (System Prompt)
```
You are the Mylapore Express Customer Support Specialist.
Your demeanor is empathetic, solutions-oriented, and apologetic when operational issues occur.

CORE OPERATING DIRECTIVES:
1. ISSUE TRIAGE: Identify the core issue:
   - Missing or incorrect dish
   - Spilled packaging in transit
   - Delivery delay beyond scheduled window
   - Payment or duplicate charge query
2. DATA COLLECTION: Request the Order Reference and specific dish names affected.
3. RESOLUTION PATHS:
   - For missing or spilled dishes: Apologize and call CreateSupportCaseAction with category "FOOD_QUALITY" and priority "HIGH".
   - If customer expresses strong frustration, set sentiment to "NEGATIVE" and call EscalateToLiveAgentAction immediately.
4. RESTRICTIONS:
   - Never promise a financial refund over $50 without a Case being reviewed by human management.
   - Do not disconnect without providing the generated Salesforce Case Number (e.g. 500_SF_...).
```

### 4. Registered Actions & Schema Contracts
* **Action Name**: `CreateSupportCaseAction`
  * **Target Endpoint**: `POST /api/v1/agent/support/cases`
  * **Inputs**: `orderId` (String), `category` (String), `summary` (String), `customerEmail` (String), `customerName` (String).
  * **Outputs**: `caseCreated` (Boolean), `caseNumber` (String: `500_SF_...`), `assignedQueue` (String).
* **Action Name**: `EscalateToLiveAgentAction`
  * **Outputs**: `omniChannelRouted` (Boolean), `queueName: "Tier_1_Customer_Support"`.

### 5. Identified Gaps & Edge Cases
* ❌ *Gap*: Service Cloud human agent accepts case in Omni-Channel but has no visibility into what the AI agent discussed.
* ❌ *Gap*: Sentiment score is stored only as text without visual alert on the Console.
* ✅ *Remediation*: Deploy **`supportSentimentHandoffLwc`** into the Service Cloud Lightning Console.

### 6. Advanced Lightning UI: `supportSentimentHandoffLwc`
Utility component in Salesforce Service Console highlighting customer sentiment, conversation recap, and 1-click refund authorization.

#### `supportSentimentHandoffLwc.html`
```html
<template>
    <lightning-card title="Agentforce Customer Sentiment & Escalation Summary" icon-name="standard:service_crew_member">
        <div class="slds-p-around_medium">
            <!-- Sentiment Gauge -->
            <div class="slds-grid slds-grid_align-spread slds-box slds-m-bottom_small" style={sentimentBackgroundStyle}>
                <div class="slds-media slds-media_center">
                    <div class="slds-media__figure">
                        <lightning-icon icon-name={sentimentIcon} size="medium"></lightning-icon>
                    </div>
                    <div class="slds-media__body">
                        <h4 class="slds-text-heading_small slds-text-title_bold">Sentiment: {sentimentScore}</h4>
                        <p class="slds-text-body_small">Tone: {sentimentTone}</p>
                    </div>
                </div>
                <div class="slds-text-align_right">
                    <span class="slds-badge slds-theme_error">Priority: {priority}</span>
                </div>
            </div>

            <!-- AI Summary of Chat -->
            <div class="slds-form-element slds-m-bottom_small">
                <label class="slds-form-element__label slds-text-title_bold">Agentforce Conversation Recap</label>
                <div class="slds-form-element__control slds-box slds-box_xx-small slds-theme_shade">
                    <p class="slds-text-body_small">{aiSummary}</p>
                </div>
            </div>

            <!-- 1-Click Agent Action -->
            <div class="slds-grid slds-grid_align-end slds-gutters_x-small">
                <lightning-button label="View Order in Postgres" onclick={handleOpenOrder}></lightning-button>
                <lightning-button variant="brand" label="Issue Courtesy Credit ($10)" onclick={handleIssueCredit}></lightning-button>
            </div>
        </div>
    </lightning-card>
</template>
```

#### `supportSentimentHandoffLwc.js`
```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import SENTIMENT_FIELD from '@salesforce/schema/Case.Sentiment__c';
import SUMMARY_FIELD from '@salesforce/schema/Case.Description';
import PRIORITY_FIELD from '@salesforce/schema/Case.Priority';

export default class SupportSentimentHandoffLwc extends LightningElement {
    @api recordId; // Case ID

    @wire(getRecord, { recordId: '$recordId', fields: [SENTIMENT_FIELD, SUMMARY_FIELD, PRIORITY_FIELD] })
    caseRecord;

    get sentimentScore() {
        return getFieldValue(this.caseRecord.data, SENTIMENT_FIELD) || 'NEUTRAL';
    }

    get sentimentIcon() {
        return this.sentimentScore === 'NEGATIVE' ? 'utility:sentiment_negative' : 'utility:sentiment_positive';
    }

    get sentimentBackgroundStyle() {
        return this.sentimentScore === 'NEGATIVE' ? 'background-color: #FEF2F2; border-color: #F87171;' : 'background-color: #F0FDF4; border-color: #4ADE80;';
    }

    get aiSummary() {
        return getFieldValue(this.caseRecord.data, SUMMARY_FIELD) || 'No conversation summary recorded.';
    }

    get priority() {
        return getFieldValue(this.caseRecord.data, PRIORITY_FIELD) || 'NORMAL';
    }
}
```

---

## Agent 4: Restaurant Operations / Kitchen KDS Agent

### 1. Persona & Architectural Role
* **Role**: Operational Dispatcher, Kitchen Acceptance Timeout Watchdog (15m SLA), and Blast-Chilling Freshness Monitor.
* **Target Users**: Kitchen Managers, Head Chefs, Delivery Dispatchers.

### 2. Topics Breakdown
1. `Kitchen_Acceptance_Monitoring`: Detects unaccepted orders approaching the 15-minute auto-refund deadline.
2. `Blast_Chilled_Inventory_Audit`: Validates that dishes are chilled to 38°F before packaging into insulated totes.
3. `Driver_Dispatch_Coordination`: Triggers driver assignment for scheduled delivery time windows.

### 3. Clear System Instructions (System Prompt)
```
You are the Mylapore Express Kitchen Operations Overseer.
You monitor real-time KDS state, delay alarms, and blast-chilled freshness standards.

CORE OPERATING DIRECTIVES:
1. 15-MINUTE ACCEPTANCE TIMEOUT WATCHDOG:
   - Orders in PAID or CONFIRMED stage must be accepted by a kitchen manager within 15 minutes.
   - If elapsed time exceeds 12 minutes, trigger a HIGH PRIORITY alert banner on the KDS console.
   - If elapsed time reaches 15 minutes, trigger automated auto-cancellation with 100% refund.
2. TEMPERATURE INTEGRITY (38°F):
   - Do not allow order status to transition to READY until the blast-chilling temperature logs confirm 38°F or below.
3. DISPATCH WINDOWS:
   - Flag orders scheduled for the current delivery window (e.g. 12:30 PM–1:30 PM or 6:00 PM–7:00 PM) that have not been assigned a delivery driver 45 minutes prior to window start.
```

### 4. Registered Actions & Schema Contracts
* **Action Name**: `GetKitchenQueueMetricsAction`
  * **Target Endpoint**: `GET /api/v1/admin/kitchen/queue`
  * **Outputs**: `activeOrdersCount`, `overdueCount`, `blastChillCapacityPercent`.
* **Action Name**: `AcknowledgeKitchenDelayAction`
  * **Target Endpoint**: `POST /api/v1/admin/orders/{id}/delay-notice`
  * **Inputs**: `minutesDelay` (Integer), `reason` (String).

### 5. Identified Gaps & Edge Cases
* ❌ *Gap*: Kitchen staff cooking during rush hours cannot read text chat; they need a visual Kanban with color-coded timers.
* ✅ *Remediation*: Deploy **`kitchenKdsKanbanLwc`** on the Kitchen Display Station touchscreens.

### 6. Advanced Lightning UI: `kitchenKdsKanbanLwc`

#### `kitchenKdsKanbanLwc.html`
```html
<template>
    <div class="kds-dashboard slds-p-around_small">
        <!-- Top Operational Metrics Bar -->
        <div class="slds-grid slds-gutters slds-m-bottom_medium">
            <div class="slds-col slds-size_1-of-4">
                <div class="metric-card bg-confirmed">
                    <span class="metric-title">Needs Acceptance</span>
                    <h2 class="metric-val">{unacceptedCount}</h2>
                    <span class="metric-sub">Auto-refund timeout: 15m</span>
                </div>
            </div>
            <div class="slds-col slds-size_1-of-4">
                <div class="metric-card bg-preparing">
                    <span class="metric-title">In Prep & Cooking</span>
                    <h2 class="metric-val">{inPrepCount}</h2>
                    <span class="metric-sub">Active chef stations</span>
                </div>
            </div>
            <div class="slds-col slds-size_1-of-4">
                <div class="metric-card bg-chilling">
                    <span class="metric-title">Blast Chilling (38°F)</span>
                    <h2 class="metric-val">{blastChillingCount}</h2>
                    <span class="metric-sub">Rapid chill cycle: 20m</span>
                </div>
            </div>
            <div class="slds-col slds-size_1-of-4">
                <div class="metric-card bg-ready">
                    <span class="metric-title">Driver Ready</span>
                    <h2 class="metric-val">{driverReadyCount}</h2>
                    <span class="metric-sub">Insulated totes sealed</span>
                </div>
            </div>
        </div>

        <!-- Kanban Board Columns -->
        <div class="slds-grid slds-gutters">
            <template for:each={kdsColumns} for:item="col">
                <div key={col.id} class="slds-col slds-size_1-of-4">
                    <div class="column-container slds-box slds-box_xx-small">
                        <div class="column-header">
                            <h3>{col.title} ({col.orders.length})</h3>
                        </div>
                        <div class="orders-list">
                            <template for:each={col.orders} for:item="order">
                                <div key={order.id} class="order-tile slds-box slds-m-bottom_x-small" style={order.urgencyStyle}>
                                    <div class="slds-grid slds-grid_align-spread">
                                        <strong class="font-serif">{order.orderNumber}</strong>
                                        <span class="timer-badge">{order.elapsedTime}</span>
                                    </div>
                                    <p class="order-items slds-m-top_xx-small">{order.itemsText}</p>
                                    <div class="slds-m-top_x-small slds-grid slds-grid_align-end">
                                        <button class="action-btn" onclick={handleAdvanceOrder} data-id={order.id} data-next={col.nextStatus}>
                                            {col.actionLabel} ➔
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
```

---

## Agent 5: Restaurant Business Insights Agent

### 1. Persona & Architectural Role
* **Role**: Executive Culinary Analyst & Menu Performance Specialist.
* **Target Users**: Restaurant Owners, Financial Controllers, Inventory Planners.

### 2. Topics Breakdown
1. `Culinary_Sales_Analytics`: Analyzes revenue by dish category, delivery vs. pickup split, and ticket size.
2. `Dish_Reorder_Retention`: Computes 14-day customer re-order rates across authentic recipes.
3. `Peak_Ordering_Windows`: Analyzes order distribution to optimize blast-chilling batch scheduling.

### 3. Clear System Instructions (System Prompt)
```
You are the Mylapore Express Business Insights Specialist.
Your mission is to provide accurate culinary revenue intelligence and menu retention metrics.

CORE OPERATING DIRECTIVES:
1. Ground all metrics using GetDishReorderRatesAction and GetPeakHourlyVolumeAction.
2. Never expose Customer PII (passwords, phone numbers, full addresses) in analytical summaries.
3. Compute and highlight the highest performing authentic dishes (e.g. South Indian Veg Kurma, Murungai Keerai Kootu, Potato Kara Kari).
4. Highlight promo code conversion ROI (e.g. MYLAPORE15 vs WELCOME5).
```

### 4. Registered Actions & Schema Contracts
* **Action Name**: `GetDishReorderRatesAction`
  * **Target Endpoint**: `GET /api/v1/admin/analytics/dish-reorders`
  * **Outputs**: `topDishes` (Array of objects: `name`, `totalVolume`, `reorderPercentage14Days`).
* **Action Name**: `GetPeakHourlyVolumeAction`
  * **Target Endpoint**: `GET /api/v1/admin/analytics/hourly-volume`
  * **Outputs**: `peakHours` (Array: `hour`, `averageOrders`, `deliverySlotDemand`).

### 5. Identified Gaps & Edge Cases
* ❌ *Gap*: Analytical data returned as raw numbers is difficult for restaurant owners to interpret on mobile tablets.
* ✅ *Remediation*: Deploy **`executiveCulinaryInsightsLwc`** in the Salesforce Lightning Dashboard.

### 6. Advanced Lightning UI: `executiveCulinaryInsightsLwc`

#### `executiveCulinaryInsightsLwc.html`
```html
<template>
    <lightning-card title="Mylapore Express Culinary Performance & Retention" icon-name="standard:chart">
        <div class="slds-p-around_medium">
            <!-- Top Metric Badges -->
            <div class="slds-grid slds-gutters slds-m-bottom_medium">
                <div class="slds-col slds-size_1-of-3">
                    <div class="slds-box slds-theme_shade">
                        <span class="slds-text-title">Top Re-ordered Dish</span>
                        <h3 class="slds-text-heading_medium font-serif slds-text-color_success">South Indian Veg Kurma</h3>
                        <p class="slds-text-body_small">78% 14-Day Re-order Rate</p>
                    </div>
                </div>
                <div class="slds-col slds-size_1-of-3">
                    <div class="slds-box slds-theme_shade">
                        <span class="slds-text-title">Peak Delivery Window</span>
                        <h3 class="slds-text-heading_medium font-serif">6:00 PM – 7:00 PM</h3>
                        <p class="slds-text-body_small">64% of Daily Volume</p>
                    </div>
                </div>
                <div class="slds-col slds-size_1-of-3">
                    <div class="slds-box slds-theme_shade">
                        <span class="slds-text-title">Blast-Chilled Freshness Score</span>
                        <h3 class="slds-text-heading_medium font-serif slds-text-color_success">99.4%</h3>
                        <p class="slds-text-body_small">Totes delivered at &le;38°F</p>
                    </div>
                </div>
            </div>

            <!-- Dish Ranking Table -->
            <table class="slds-table slds-table_cell-buffer slds-table_bordered">
                <thead>
                    <tr class="slds-line-height_reset">
                        <th scope="col"><div class="slds-truncate">Authentic Dish</div></th>
                        <th scope="col"><div class="slds-truncate">Category</div></th>
                        <th scope="col"><div class="slds-truncate">Units Ordered</div></th>
                        <th scope="col"><div class="slds-truncate">Repeat Order Rate</div></th>
                    </tr>
                </thead>
                <tbody>
                    <template for:each={rankedDishes} for:item="item">
                        <tr key={item.name}>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.category}</td>
                            <td>{item.orderedCount}</td>
                            <td><lightning-badge label={item.repeatRate} class="slds-theme_success"></lightning-badge></td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </lightning-card>
</template>
```

---

## Summary of All 5 Lightning Components to Deploy

| Agent | Lightning Web Component | Hosting Location | Key Functional Value |
|---|---|---|---|
| **Agent 1 (Concierge)** | `conciergeMenuCarouselLwc` | MIAW Chat & Portal | Visual dish cards with 38°F chilled badge, dietary pills & direct "+ Add" action. |
| **Agent 2 (Order Management)** | `orderActionSheetLwc` | Flow / Lightning Modal | Policy preview meter, guaranteed refund calculation & 1-click cancellation confirmation. |
| **Agent 3 (Customer Support)** | `supportSentimentHandoffLwc` | Service Cloud Console | Sentiment score gauge, AI conversation recap, and 1-click courtesy credit authorization. |
| **Agent 4 (Kitchen Ops)** | `kitchenKdsKanbanLwc` | KDS Touchscreen Console | Operational metric tiles, 15m timeout alarm, and stage advancement buttons. |
| **Agent 5 (Business Insights)**| `executiveCulinaryInsightsLwc`| Salesforce Dashboard | Executive retention scoreboard, repeat order rankings, and peak window analysis. |

---

*Document Reference: `SALESFORCE_AGENTFORCE_AGENT_MATRIX_AND_LIGHTNING_UI.md`*  
*Repository: Balakrishna047/Mylapore-Restaurant*  
*Classification: Production Agentforce & Lightning UI Architecture*
