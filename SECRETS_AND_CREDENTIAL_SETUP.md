# Secrets and Credential Setup Guide: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Security Doctrine & Secrets Policy

1. **Zero Secret Leaks**:
   - Secret keys, bearer tokens, database passwords, and client secrets must **never** be hardcoded in application repositories, printed to standard output logs, committed to Git, or exposed to the client-side browser runtime.
2. **Environment Variable Storage**:
   - Production secrets are stored exclusively in the **Render Managed Environment Variables Dashboard** (`srv-dbq4qplg1s2s73c1kdp0`).
   - Local development secrets reside in `.env` (strictly excluded by `.gitignore`).
   - Only `.env.example` containing empty placeholder values is committed.
3. **Least Privilege Principle**:
   - Salesforce integration users require only permissions to execute Invocable Actions and query Agent API endpoints.

---

## 2. Salesforce Agentforce Credential Parameters

| Parameter | Configuration Purpose | Production Format / Requirement | Secret? |
| :--- | :--- | :--- | :--- |
| `SALESFORCE_ENABLED` | Feature flag toggling Agentforce | `true` (prod) / `false` (local dev) | No |
| `SALESFORCE_LOGIN_URL` | Base login domain | `https://login.salesforce.com` | No |
| `SALESFORCE_INSTANCE_URL` | Salesforce My Domain instance | `https://<my-domain>.develop.my.salesforce.com` | No |
| `SALESFORCE_AGENT_ID` | Einstein Agentforce Entity ID | 18-character Salesforce ID starting with `0Xx` | No |
| `SALESFORCE_CLIENT_ID` | Connected App / External Client App Consumer Key | 80+ character OAuth client string | Yes |
| `SALESFORCE_CLIENT_SECRET` | Connected App Consumer Secret | 64-character alphanumeric secret string | **YES (CRITICAL)** |
| `SALESFORCE_RUN_AS_USER` | Integration execution user email | Dedicated service account email | No |
| `AGENTFORCE_API_KEY` | Inbound API Key for Apex callouts | Cryptographic pre-shared secret string | **YES (CRITICAL)** |
| `X_GATEWAY_AUTH` | External Credential header token | Cryptographic pre-shared secret string | **YES (CRITICAL)** |
| `CHAT_HMAC_SECRET` | Turn token signing key | SHA-256 HMAC secret key (>=32 chars) | **YES (CRITICAL)** |

---

## 3. Salesforce OAuth 2.0 Token Lifecycle

### 3.1 Grant Type Selection
The NestJS BFF (`SalesforceAgentService`) supports two industry-standard headless server-to-server OAuth flows:

1. **Client Credentials Flow (`grant_type=client_credentials`)**:
   - Recommended for External Client Apps.
   - Endpoint: `${SALESFORCE_INSTANCE_URL}/services/oauth2/token`
   - Parameters:
     - `grant_type`: `client_credentials`
     - `client_id`: `${SALESFORCE_CLIENT_ID}`
     - `client_secret`: `${SALESFORCE_CLIENT_SECRET}`
2. **Password & Security Token Flow (`grant_type=password`)**:
   - Fallback for developer sandbox environments.
   - Endpoint: `${SALESFORCE_LOGIN_URL}/services/oauth2/token`
   - Parameters:
     - `grant_type`: `password`
     - `client_id`: `${SALESFORCE_CLIENT_ID}`
     - `client_secret`: `${SALESFORCE_CLIENT_SECRET}`
     - `username`: `${SALESFORCE_RUN_AS_USER}`
     - `password`: `${SALESFORCE_PASSWORD}${SALESFORCE_SECURITY_TOKEN}`

### 3.2 Required OAuth Scopes
- `api`: Access and manage your data via APIs.
- `einstein_gpt_api`: Access Einstein AI Agent and Generative Experience endpoints.
- `refresh_token, offline_access`: If using refresh token flows.

### 3.3 Token Expiry & Proactive In-Memory Renewal
- The returned Salesforce OAuth token typically carries a 1-hour or 2-hour TTL (`expires_in: 7200`).
- `SalesforceAgentService` caches the token in-memory and proactively refreshes it **60 seconds before expiration**, eliminating mid-turn token expirations.
- Tokens are never persisted to disk or databases.

---

## 4. Agent Gateway Credential Setup (Inbound Apex Callouts)

When Salesforce invokes the backend (`callout:Mylapore_Express_API/api/v1/agent/*`), the request is protected by:

1. **Named Credential**:
   - Name: `Mylapore_Express_API`
   - URL: `https://mylapore-express-api.onrender.com`
   - Identity Type: Named Principal
   - Authentication Protocol: Custom / External Credential
2. **External Credential**:
   - Name: `Mylapore_Gateway_ExtCred`
   - Custom Header Parameter:
     - Name: `X-Gateway-Auth`
     - Value: `<X_GATEWAY_AUTH_VALUE>`
3. **Backend Validation Guard**:
   - `AgentforceApiKeyGuard` inspects `req.headers['x-gateway-auth']` and `req.headers['x-agentforce-api-key']`.
   - If neither matches the environment variable, the request is rejected with `HTTP 401 Unauthorized`.

---

## 5. Verification Checklist for Credentials

- [x] `SALESFORCE_ENABLED="true"` active in Render API environment.
- [x] `SALESFORCE_INSTANCE_URL` set to target My Domain.
- [x] `SALESFORCE_AGENT_ID` verified against Agentforce Builder.
- [x] `SALESFORCE_CLIENT_ID` and `SALESFORCE_CLIENT_SECRET` populated.
- [x] `X_GATEWAY_AUTH` and `AGENTFORCE_API_KEY` synced between Salesforce External Credential and Render environment.
- [x] `CHAT_HMAC_SECRET` configured for turn token signing.
- [x] Anonymous Apex callout test verified with `HTTP 200 OK`.
