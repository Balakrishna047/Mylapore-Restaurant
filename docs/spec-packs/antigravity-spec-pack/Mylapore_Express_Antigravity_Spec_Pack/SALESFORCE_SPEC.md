# Salesforce Specification — Service Cloud, Agentforce Foundation and Copado

## 1. Purpose and boundary
Salesforce provides CRM, support, knowledge, Case routing, approval and operational visibility. It is not the master database for live menu, cart, price, stock, payment or order state. NestJS/PostgreSQL owns commerce truth.

## 2. V1 Salesforce capabilities
- Service Cloud: Contact, Case, Knowledge, Email-to-Case, queues and Service Console.
- Omni-Channel for agent routing only after org/licence/channel verification.
- Agentforce for customer commerce and service capabilities subject to org entitlement and supported API/session model.
- Flow for Case routing, refund approval orchestration and notifications.
- Apex for controlled backend callouts, custom actions, event handlers and logging.
- Named Credentials / External Credentials for server-to-server authentication.
- Copado for metadata validation and promotion.
- No Data Cloud or MuleSoft in v1.

## 3. Object model

### Standard objects
- `Contact`: CRM customer identity snapshot.
- `Case`: complaints, payment queries, delivery issues and service requests.
- `EmailMessage`: Email-to-Case conversation records.
- `Knowledge__kav` / Knowledge: approved FAQ and service articles.
- `Account`: optional only if restaurant corporate/customer account relationship requires it.

### Custom objects (lean v1)
1. `Restaurant_Order__c`
   - `External_Order_ID__c` (Text, External ID, Unique)
   - `Contact__c` (Lookup Contact)
   - `Outlet_Code__c`
   - `Order_Status_Snapshot__c`
   - `Payment_Status_Snapshot__c`
   - `Fulfilment_Type__c`
   - `Order_Total__c` (Currency)
   - `CurrencyIsoCode`
   - `Last_Synced_At__c`
   - `Aggregate_Version__c`
2. `Payment_Transaction__c`
   - `External_Payment_ID__c` (Text, External ID, Unique)
   - `Restaurant_Order__c`
   - `Amount__c`, `CurrencyIsoCode`
   - `Provider__c`, `Transaction_Status__c`
   - `Verified_At__c`, `Last_Synced_At__c`
3. `Refund_Request__c`
   - `External_Refund_ID__c` (Text, External ID, Unique; nullable until backend creates ID)
   - `Restaurant_Order__c`, `Payment_Transaction__c`
   - `Refund_Amount__c`, `CurrencyIsoCode`
   - `Reason__c`, `Approval_Status__c`, `Refund_Status__c`
   - `Approver__c`, `External_Approval_Reference__c`
4. `Customer_Feedback__c`
   - `External_Feedback_ID__c` (Text, External ID, Unique)
   - `Contact__c`, `Restaurant_Order__c`
   - `Rating__c`, `Comments__c`, `Feedback_Category__c`
5. `Agent_Interaction__c`
   - `External_Interaction_ID__c` (Text, External ID, Unique)
   - `Session_ID__c`, `Channel__c`, `Agent_Name__c`
   - `Outcome__c`, `Escalated__c`, `Action_Count__c`
   - `Safe_Summary__c`, `Created_At_Source__c`

Case fields:
- `External_Order_ID__c` (Text, indexed if supported)
- `Order_Reference__c` (Text)
- `Issue_Category__c` (Picklist)
- `Refund_Tier__c` (Picklist)
- `Customer_Verification_Status__c`
- `Backend_Correlation_ID__c`
- `External_Refund_ID__c`
- `Resolution_Code__c`

Contact fields:
- `External_Customer_ID__c` (Text, External ID, Unique)
- `Preferred_Language__c`
- `Verified_Phone__c`
- `Marketing_Consent_Status__c`
- `Last_Synced_At__c`

Do not copy full order lines, payment credentials or full chat transcripts into Salesforce by default.

## 4. Integration contract
- NestJS outbox worker upserts Contact, Restaurant_Order, Payment_Transaction, Refund_Request, Customer_Feedback and Agent_Interaction by External ID.
- Every event includes event ID, aggregate ID, aggregate version, occurred-at UTC, correlation ID and schema version.
- Salesforce consumer must be idempotent.
- Stale aggregate versions must not overwrite newer snapshots.
- Salesforce-to-backend messages must use an authenticated, scoped service endpoint.
- Approval callback includes Salesforce approval reference, actor, decision, amount, currency, order/refund IDs and timestamp. Backend revalidates all values.
- Store Salesforce Case ID/CaseNumber in `support_references`; do not make Salesforce the owner of order state.

## 5. Apex classes (proposed)
- `BackendApiClient`: Named Credential callout wrapper, typed DTOs, timeout and error mapping.
- `AgentMenuService`: menu query action delegated to backend.
- `AgentOrderService`: owned order status and eligible action facade.
- `AgentPaymentService`: read-only payment status.
- `AgentRefundService`: create refund request and validate approval callback.
- `AgentSupportService`: create/update Case and attach correlation/order references.
- `AgentHandoffService`: package minimal safe context for human handoff.
- `OrderEventHandler`: process Platform Events if selected.
- `IntegrationLogger`: structured error/correlation logging with PII redaction.
- `CaseRoutingService`: route by issue category, outlet and priority.

Apex must not duplicate price, tax, stock, payment or refund policy calculations. Use Queueable/Platform Event patterns for callouts where appropriate; never perform long-running external calls in synchronous triggers.

## 6. Flows and routing
- `Case_Routing_Flow`: set priority, issue category, queue and required fields.
- `Refund_Approval_Flow`: route R3 and configured R2 requests to authorized approvers; persist decision; call backend approval endpoint.
- `Customer_Notification_Flow`: send approved service notifications only after backend-confirmed status.
- `Order_Snapshot_Upsert_Flow` only if a declarative ingestion path is selected; avoid duplicating integration logic across Flow and Apex.

Queues: `Order_Support`, `Payment_Support`, `Delivery_Support`, `Food_Quality_Support`, `General_Support`, `Refund_Approvals`.

## 7. Service Cloud setup
- Case record types or issue-category picklists: General Enquiry, Order Complaint, Payment Complaint, Delivery Complaint, Food Quality Complaint, Refund Request.
- Email-to-Case for support inbox.
- Knowledge lifecycle: draft, review, publish, archive; agent can use published/approved content only.
- Service Console layout with customer, Case, order snapshot, payment snapshot, correlation ID and interaction summary.
- Omni-Channel routing is conditional on licence and configuration verification.
- Case closure requires resolution code and customer communication outcome.
- Duplicate Case detection uses external interaction ID/order/category/open-case matching.

## 8. Security and permissions
- Dedicated integration user with least-privilege permission set.
- Named Credential secret management; no hard-coded credentials.
- Restrict fields containing PII and financial data.
- Separate permissions for Case handling, refund approval, finance review, outlet manager and admin.
- Refund approver cannot approve own request where separation of duties is required.
- Restrict Agentforce action permissions and data access.
- Audit metadata deployment and permission changes.
- Mask/redact sensitive fields from agent context.

## 9. Salesforce metadata and Copado
Suggested metadata areas:
- `objects/`, `fields/`, `recordTypes/`, `layouts/`, `flexipages/`
- `permissionsets/`, `queues/`, `groups/`
- `flows/`, `classes/`, `triggers/`, `platformEvents/`
- `namedCredentials/` or external credential metadata supported by org/API version
- `applications/`, `tabs/`, `customMetadata/`, `labels/`
- Agentforce metadata only if supported by the org and Copado version.

Pipeline:
1. Retrieve from source org and commit to Git.
2. Static checks and dependency validation.
3. Salesforce CLI validation/deployment check.
4. Apex tests and coverage policy.
5. Copado user story / promotion pipeline.
6. Approvals and deployment to target.
7. Post-deploy permission, Flow activation, Named Credential and Agentforce smoke tests.
8. Record deployment evidence and rollback plan.

Keep Salesforce metadata promotion separate from application container deployment. Verify Agentforce metadata support, API version and licence in the actual org before building a pipeline around it.

## 10. Org verification checklist
- Agentforce entitlement and agent type.
- Agent API/session creation method.
- Ability to pass server-generated identity/session context.
- Ability to bind action identity to non-model-writable context.
- Agentforce action invocation mechanism and limits.
- Service Cloud, Knowledge, Email-to-Case and Omni-Channel entitlements.
- External Credentials/Named Credentials availability and permissions.
- Platform Events limits and API version.
- Copado support for every metadata type in use.
- Sandbox/dev/test org availability and deployment path.
