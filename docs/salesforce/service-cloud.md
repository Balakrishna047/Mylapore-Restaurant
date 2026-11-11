# Salesforce Service Cloud Integration Guide

## 1. CRM Scope & System Boundaries
- **System of Record (SoR)**:
  - PostgreSQL owns all transactions, payments, delivery statuses, and orders.
  - Salesforce Service Cloud owns customer relationships, support cases, and SLA tracking.
- **Security Guardrail**: Raw credit card numbers and full Stripe tokens are never transferred into Salesforce.

## 2. Objects & Sync Mapping
- `User` (Customer) -> Salesforce `Contact`
- `SupportTicket` -> Salesforce `Case`
  - Mapping:
    - `Subject` -> `Case.Subject`
    - `Description` -> `Case.Description`
    - `Priority` -> `Case.Priority`
    - `Status` -> `Case.Status`
    - `CustomerEmail` -> `Case.SuppliedEmail`
    - `OrderNumber` -> `Case.Order_Number__c`

## 3. Configuration & Resilient Fallback
- `SALESFORCE_ENABLED=true` enables live OAuth 2.0 REST client synchronization.
- When `SALESFORCE_ENABLED=false`, the adapter transparently runs in simulation mode, generating simulated IDs (e.g., `500_SF_...`) so that customer support submissions succeed seamlessly.
