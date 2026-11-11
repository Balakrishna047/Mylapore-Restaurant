# Agentforce AI Autonomous Agent Specifications

## 1. Restaurant Customer Concierge Agent
- **Purpose**: Guide food discovery, explain South Indian regional authenticity, blast-chilled freshness, and dietary compatibility (Jain, Vegan, Gluten-Free).
- **Grounding Data**: Menu items, categories, ingredients list, allergen declarations, reheating instructions.
- **REST Tool**: `POST /api/v1/support/chat`

## 2. Order Management Agent
- **Purpose**: Resolve order inquiries, check live tracking stages, and execute policy-compliant rescheduling or cancellations.
- **Rules**: Zero hallucinations on financial actions; rescheduling and cancellation must execute through authenticated backend APIs (`/api/v1/orders/:id/reschedule`, `/api/v1/orders/:id/cancel`).

## 3. Customer Support Agent
- **Purpose**: Classify customer issues, compute sentiment, create Service Cloud Cases, and handle human agent escalation.

## 4. Restaurant Operations Agent
- **Purpose**: Monitor kitchen preparation queues, identify blast-chilling delays, and alert kitchen supervisors of ticket backlog caps.

## 5. Restaurant Business Insights Agent
- **Purpose**: Deliver real-time executive summaries of GMV, popular dishes, peak ordering slots, and customer retention metrics.
