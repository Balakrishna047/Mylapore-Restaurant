# Integration Requirements Specification: Mylapore Express & Salesforce Agentforce

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This document specifies the technical and operational integration requirements connecting the **Mylapore Express Full-Stack Platform** (Next.js Storefront + NestJS BFF + PostgreSQL) to **Salesforce Agentforce** (Einstein 1 Platform).

The governing architectural rule across all integration interfaces is:
> **"The AI talks; the backend decides."**
> 
> *Salesforce Agentforce manages natural-language understanding, conversation policy, and dialogue flow. The NestJS backend and PostgreSQL database own all catalog prices, dietary verification tags, allergen safety declarations, inventory availability, and display block contracts.*

---

## 2. Integration Architecture: Two Operating Paths

```
                       [ Customer Browser ]
                                │
                                ▼
                       [ Next.js Storefront ]
                                │
                                ▼ HTTP / JSON
                       [ NestJS Chat BFF ]
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
(Mode: AGENTFORCE)                             (Mode: SIMPLE_MENU)
        │                                               │
        ▼                                               │
[ Salesforce Agent API ]                                │
        │                                               │
        ▼                                               │
[ Einstein Agentforce ]                                 │
        │                                               │
        ▼                                               │
[ Apex Invocables ]                                     │
        │                                               │
        ▼ Named Credential                              │
[ NestJS Agent Gateway ]                                │
        │                                               │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
                    [ Shared Catalog Service ]
                                │
                                ▼
                        [ PostgreSQL DB ]
```

---

## 3. Detailed Interface Requirements

### 3.1 Path 1: Next.js Storefront to NestJS BFF
| Requirement | Description | Status | Classification |
| :--- | :--- | :--- | :--- |
| **Protocol** | HTTPS REST / JSON | Configured | `[VERIFIED]` |
| **Session Tracking** | Client stores `sess_<uuid>` in `localStorage` or `sessionStorage` | Implemented in `useMylaporeChat` | `[VERIFIED]` |
| **Turn Serialization** | Client must wait for turn response or timeout before submitting subsequent turns | Enforced in UI button & input disable | `[VERIFIED]` |
| **Display Block Rendering** | Storefront must render validated display blocks only (`category_buttons`, `menu_item_list`, `menu_item_detail`) | Rendered via dedicated React components | `[VERIFIED]` |
| **Secret Isolation** | Browser must never store Salesforce credentials, API keys, or direct database connections | Strictly quarantined to NestJS BFF | `[VERIFIED]` |

### 3.2 Path 2: NestJS BFF to Salesforce Einstein Agent API
| Requirement | Specification | Status | Classification |
| :--- | :--- | :--- | :--- |
| **OAuth Grant Type** | OAuth 2.0 `client_credentials` (or username/password with security token) | Configured in `SalesforceAgentService` | `[VERIFIED]` |
| **Token Caching** | Bearer token cached in-memory with automatic refresh 60 seconds prior to expiration | Implemented in `SalesforceAgentService` | `[VERIFIED]` |
| **Session Initiation** | `POST https://api.salesforce.com/einstein/ai-agent/v1/agents/{agentId}/sessions` | Configured with `bypassUser: true` | `[VERIFIED]` |
| **Message Streaming / Post** | `POST https://api.salesforce.com/einstein/ai-agent/v1/sessions/{sessionId}/messages` | Configured with sequence ID | `[VERIFIED]` |
| **Timeout Handling** | 24-second deadline wrapper. On timeout, fallback seamlessly to `SIMPLE_MENU` | Implemented via `Promise.race` | `[VERIFIED]` |

### 3.3 Path 3: Salesforce Agentforce to NestJS Agent Gateway
| Requirement | Specification | Status | Classification |
| :--- | :--- | :--- | :--- |
| **Outbound Transport** | Salesforce Named Credential (`Mylapore_Echo_NC` / `Mylapore_Express_API`) | Active in Salesforce CAN96 | `[VERIFIED]` |
| **Authentication** | External Credential injecting `X-Gateway-Auth` header | Validated by `AgentforceApiKeyGuard` | `[VERIFIED]` |
| **Target URL** | `callout:Mylapore_Express_API/api/v1/agent/browse-menu` | Deployed and verified | `[VERIFIED]` |
| **Invocable Actions** | 3 actions: `listMenuCategories`, `searchMenu`, `getMenuItemDetails` | Grounded to PostgreSQL | `[VERIFIED]` |
| **Payload Integrity** | Apex deserializes JSON dish records without altering prices or allergens | Verified in anonymous Apex test | `[VERIFIED]` |

---

## 4. Environment Parameters & Credentials Matrix

| Setting Name | Environment | Value Format | Secret Storage Location | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | `postgresql://...@...neon.tech/neondb?sslmode=require` | Render Environment Secrets | `[VERIFIED]` |
| `SALESFORCE_ENABLED` | Backend | `true` or `false` | Render Environment Config | `[VERIFIED]` |
| `SALESFORCE_INSTANCE_URL` | Backend | `https://...develop.my.salesforce.com` | Render Environment Config | `[VERIFIED]` |
| `SALESFORCE_AGENT_ID` | Backend | `0XxgK000002YIJ7SAO` (18-char Salesforce ID) | Render Environment Config | `[VERIFIED]` |
| `SALESFORCE_CLIENT_ID` | Backend | External Client App Consumer Key | Render Environment Secrets | `[VERIFIED]` |
| `SALESFORCE_CLIENT_SECRET`| Backend | Consumer Secret String | Render Environment Secrets | `[VERIFIED]` |
| `AGENTFORCE_API_KEY` | Backend | Pre-shared key for inbound Apex callouts | Render Environment Secrets | `[VERIFIED]` |
| `X_GATEWAY_AUTH` | Backend / SF | Token matching External Credential header | Render Environment Secrets | `[VERIFIED]` |
| `CHAT_HMAC_SECRET` | Backend | SHA-256 signing secret for `turnToken` | Render Environment Secrets | `[VERIFIED]` |

---

## 5. Non-Functional Integration Constraints

1. **Availability**:
   - The failure, rate-limiting, or downtime of Salesforce Agentforce must never break the customer website. The BFF must seamlessly degrade to `SIMPLE_MENU` mode without displaying error screens to the user.
2. **Idempotency**:
   - Duplicate turn posts with the same `(sessionId, turnNumber)` return the cached turn response.
3. **Audit Trail**:
   - Every agent interaction is captured in the database with timestamps and status codes.
