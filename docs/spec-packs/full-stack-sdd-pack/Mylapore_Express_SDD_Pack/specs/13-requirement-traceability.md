# 13 — Requirement Traceability Matrix (Starter)

| Requirement ID | User outcome | Frontend | Backend module | Data entities | API | Salesforce/Agentforce | Test |
|---|---|---|---|---|---|---|---|
| FR-CX-001 | Select outlet | Outlet selector | Outlet | outlets | GET /outlets | Agent can list outlets | outlet selection E2E |
| FR-CX-002 | Browse menu | Menu/item detail | Catalog/Inventory | menu_items, modifiers, item_allergens | GET /outlets/{id}/menu | Commerce Agent read action | menu grounding test |
| FR-CX-004 | Manage cart | Cart | Cart | carts, cart_items | /cart | Commerce Agent cart actions | cart CRUD E2E |
| FR-CX-005 | Accurate price | Quote panel | Pricing | price_quotes, quote_lines | POST /quotes | Agent explains quote | pricing unit tests |
| FR-CX-006 | Valid checkout | Checkout | Checkout/Inventory | orders, reservations | POST /checkout | Agent guides, does not bypass | stale quote/oversell tests |
| FR-PAY-002 | Verified payment | Payment return/status | Payments | payment_attempts, webhook_inbox | POST /webhooks/stripe | Agent reads status only | signature/replay tests |
| FR-CO-005 | Kitchen decision | KDS | Kitchen/Orders | kitchen_tickets, order_status_history | kitchen action endpoints | Management agent later | timeout/reject tests |
| FR-CX-008 | Track order | Order tracking | Orders | orders, order_status_history | GET /orders/{id} | Commerce Agent status action | BOLA test |
| FR-SF-001 | Support request | Support form | Support | support_requests, outbox_events | POST /support/requests | Service Agent create request | dedupe/outage test |
| FR-AI-002 | Secure agent access | Chat | AgentGateway | agent_sessions, agent_action_audits | /agent/actions/* | Agentforce actions | cross-customer denial |
| FR-AI-004 | Human escalation | Handoff UI | Support | support_requests | support endpoint | Service Cloud channel | context continuity test |

Add a row for every approved requirement before implementation. A requirement is not complete until its frontend, backend, data, API, integration, test and deployment evidence are linked.
