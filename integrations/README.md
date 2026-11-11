# Mylapore Express Integrations Guide

This directory documents the boundary adapters and external service integrations powering the platform:

## 1. Salesforce Service Cloud (`integrations/salesforce/`)
- **Backend Adapter**: `apps/api/src/integrations/salesforce.adapter.ts`
- **Transactional Outbox Worker**: `apps/api/src/integrations/outbox.service.ts`
- **Metadata Package**: `salesforce/force-app/`
- **Specification**: `specs/salesforce/` & `salesforce/specs/`
- **Objects Synchronized**:
  - `Contact` (External Customer ID sync)
  - `Restaurant_Order__c` (Service Cloud Order Snapshot)
  - `Payment_Transaction__c` (Payment attempt visibility)
  - `Refund_Request__c` (Refund audit & approval tracking)
  - `Case` (Support ticket escalation)
  - `Agent_Interaction__c` (Agentforce AI session audit)

## 2. Salesforce Agentforce (`integrations/agentforce/`)
- **Action Gateway**: `apps/api/src/agent/` (`/api/v1/agent/*`)
- **OpenAPI Catalog**: `salesforce/contracts/api-catalog.yaml`
- **Identity & Security**: Server-to-server signed JWT bearer tokens (`/api/v1/auth/session-token`)
- **Guardrails**: Zero direct DB access; model-immutable identity; cryptographic 5-minute cancellation previews.

## 3. Stripe Payments (`integrations/stripe/`)
- **Backend Adapter**: `apps/api/src/payments/stripe.adapter.ts`
- **Service**: `apps/api/src/payments/payments.service.ts`
- **Security**: Raw-body cryptographic webhook signature verification (`stripe-signature`).
- **Features**: Payment intents, automatic confirmation, and 3-tier cancellation refunds (100% CONFIRMED, 50% ACCEPTED, 0% PREPARING).
