# Mylapore Express: AI & Agentforce Specification Guide

This repository contains the architecture, specifications, backend services, frontend applications, and Salesforce Agentforce AI agents powering the **Mylapore Express Enterprise Restaurant E-commerce Platform**.

## Autonomous AI Agent Network
The platform integrates 5 purpose-built AI agents:

1. **Restaurant Customer Concierge Agent**: Guides food discovery, dietary filtering (Jain, Vegan, Gluten-Free, Allergens), heat levels, and South Indian regional authenticity.
2. **Order Management Agent**: Handles conversational order lookup, rescheduling validation, operational cancellation policies, and refund calculations.
3. **Customer Support Agent**: Integrates with Salesforce Service Cloud for ticket/case creation, SLA escalation, sentiment analysis, and agent handoff.
4. **Restaurant Operations Agent**: Monitors kitchen backlogs, preparation delay alarms, delivery driver handoffs, and blast-chilling freshness inventory thresholds.
5. **Restaurant Business Insights Agent**: Delivers real-time executive analytics, dish re-order rates, peak ordering windows, and customer retention metrics.

## Architectural Boundary & Security Guardrails
- **Zero Hallucination Actions**: All transactional operations (rescheduling, cancellations, refunds, inventory reservations) require cryptographic execution through authenticated backend REST APIs (`/api/v1/orders/:id/reschedule`, `/api/v1/orders/:id/cancel`).
- **No Direct DB Access**: AI agents are grounded strictly via structured OpenAPI tools and read-only schema contexts.
- **Audit Logging**: Every agent-invoked tool execution is captured in the backend `AuditLog` and `IntegrationEvent` tables with timestamp, agent persona, and caller user ID.
