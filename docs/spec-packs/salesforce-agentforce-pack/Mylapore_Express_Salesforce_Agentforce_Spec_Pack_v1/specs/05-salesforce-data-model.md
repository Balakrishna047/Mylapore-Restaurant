# 05 — Salesforce Data Model and Metadata Specification

## 1. Design approach

Prefer standard Salesforce objects for CRM/service. Use custom objects only for durable Salesforce-owned concepts or references needed by service teams. Do not replicate the entire commerce schema.

## 2. Standard objects

| Object | Usage | Notes |
|---|---|---|
| Account | Organization/household/customer grouping | Decide Person Accounts vs Account+Contact |
| Contact | Identified customer | External customer ID |
| Case | Support lifecycle | Primary service record |
| Knowledge__kav | Approved service articles | Standard Knowledge |
| User | Staff identity | Salesforce internal identity |
| Task/Event | Follow-up and appointments | Optional |
| MessagingSession / MessagingEndUser | Messaging records | Availability depends on channel/configuration |

## 3. Custom objects (proposed)

### `Restaurant_Outlet__c`
Fields: `External_Outlet_Id__c` (unique external ID), Name, Active__c, Time_Zone__c, Region__c, Support_Queue_Key__c.

### `Restaurant_Order__c`
Purpose: service-side reference/projection, not authoritative order ledger.
Fields: `External_Order_Id__c` (unique external ID), Customer_External_Id__c, Outlet_External_Id__c, Order_Status__c, Order_Created_At__c, CurrencyIsoCode, Total_Amount_Minor__c, Last_Synced_At__c, Commerce_Record_URL__c.
Keep PII minimal. Avoid duplicating order lines unless agents/service users need a justified subset.

### `Payment_Transaction__c`
Purpose: support visibility into payment attempts/outcomes.
Fields: `External_Payment_Id__c` (unique external ID), External_Order_Id__c, Provider__c, Status__c, Amount_Minor__c, CurrencyIsoCode, Provider_Reference_Masked__c, Last_Synced_At__c.
No PAN/CVV or secrets.

### `Refund_Request__c`
Purpose: Salesforce workflow/approval tracking if required.
Fields: `External_Refund_Request_Id__c` (unique external ID), External_Order_Id__c, Case__c, Status__c, Amount_Minor__c, CurrencyIsoCode, Reason__c, Approval_Required__c, Provider_Refund_Reference_Masked__c.
Backend/Stripe remain authoritative for execution outcome.

### `Agent_Interaction__c`
Purpose: governed interaction summary and audit reference.
Fields: External_Interaction_Id__c (unique external ID), Case__c, Contact__c, Channel__c, Identity_Level__c, Intent__c, Summary__c, Started_At__c, Ended_At__c, Correlation_Id__c, Outcome__c.
Do not store full transcript by default; use retention and consent policy.

## 4. Relationships

- Contact → many Cases.
- Case → optional Restaurant_Order__c reference.
- Case → optional Refund_Request__c.
- Restaurant_Order__c → many Payment_Transaction__c references.
- Agent_Interaction__c → optional Case and Contact.
- Restaurant_Outlet__c → many Restaurant_Order__c references.

Use lookup relationships unless deletion/ownership semantics require master-detail. Define sharing separately.

## 5. External ID strategy

- All commerce records synchronized to Salesforce carry stable immutable external IDs.
- Upsert on external ID; do not match by email/name.
- Store provider references only when needed and mask them.
- Define uniqueness scope: global or outlet-scoped.
- Avoid using Salesforce record IDs as public commerce identifiers.

## 6. Security model

- Permission sets grouped by job function.
- Integration user has only required API and object/field permissions.
- Service agent can read permitted customer/order projections and create/update Cases.
- Refund approver has separate permission set and approval authority.
- Outlet staff see only assigned outlet data where applicable.
- Restrict field-level access for PII, payment references and interaction summaries.
- Review sharing rules, restriction rules and Apex sharing behavior.

## 7. Decisions before metadata generation

1. Person Accounts or Account+Contact.
2. Whether Restaurant_Order__c is needed or live order lookups are sufficient.
3. Whether refund approval is Salesforce-native or backend admin workflow.
4. Whether Agent_Interaction__c is needed versus native Messaging records plus summaries.
5. Outlet object ownership and sharing model.
6. Currency model: single INR initially or multi-currency.
7. Case relationship to external order: lookup to projection or text external ID.
