# Operations Runbook: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. System Health Monitoring & Incident Triage

### 1.1 Key Observability Endpoints
| Service | Check URL | Target Metric / Expected Output | Alert Threshold |
| :--- | :--- | :--- | :--- |
| **API Health Probe** | `/api/v1/health` | `{"status":"ok","database":"healthy"}` | HTTP 500 or response time > 2000ms |
| **Storefront Web** | `https://mylapore-express-web.onrender.com` | HTTP 200, HTML contains `<title>Mylapore Express` | HTTP 5xx or DNS failure |
| **OpenAPI Spec** | `/api/docs-json` | Valid JSON document (OpenAPI 3.0) | Invalid JSON or HTTP 404 |
| **Neon PostgreSQL Pool** | Neon Cloud Metrics | Active connections < 80% pool limit | Active connections > 90% |

---

## 2. Common Operational Incidents & Resolution

### Incident 1: HTTP 423 "Session is busy processing a turn"
- **Symptom**: Customer sees temporary lock message or UI button spinner.
- **Root Cause**: Customer double-clicked submit or issued a prompt while the previous turn is awaiting the 24s deadline.
- **Resolution**:
  - The client UI automatically disables the submit button during `isLoading = true`.
  - The lock automatically releases via `finally { SessionLockGuard.release(sessionToken) }` upon turn resolution.
  - If a turn crashed without releasing, restarting the API service clears the in-memory map.

### Incident 2: Salesforce OAuth Token Failure (HTTP 401 / 400 from Agent API)
- **Symptom**: Logs display `Salesforce OAuth token request failed`. Chatbot automatically degrades to `SIMPLE_MENU` mode.
- **Root Cause**: Expired client secret, changed password, or revoked Connected App access.
- **Resolution**:
  1. Verify credentials in Salesforce: Setup -> External Client Apps -> Consumer Key / Secret.
  2. Verify `SALESFORCE_INSTANCE_URL` matches the active My Domain domain.
  3. Update Render environment variables for `srv-dbq4qplg1s2s73c1kdp0`.
  4. Notice: Customer traffic is **never broken** because `SIMPLE_MENU` provides seamless deterministic menu discovery while Agentforce is repaired.

### Incident 3: Apex Invocable Action Callout Error (HTTP 401 Unauthorized at `/api/v1/agent/*`)
- **Symptom**: Salesforce Agentforce fails to retrieve menu data; Apex logs show `Unauthorized`.
- **Root Cause**: `X-Gateway-Auth` token in Salesforce External Credential does not match backend `X_GATEWAY_AUTH`.
- **Resolution**:
  1. In Salesforce Setup, go to **Named Credentials** -> **External Credentials** -> `Mylapore_Gateway_ExtCred`.
  2. Verify the custom header parameter `X-Gateway-Auth` matches `X_GATEWAY_AUTH` in Render.

### Incident 4: Turn Timeout (25-Second API Gateway Exceeded)
- **Symptom**: Customer sees delay advisory: *"Apologies, I encountered a brief delay preparing that information..."*.
- **Root Cause**: External network latency to Salesforce Einstein API exceeded 24 seconds.
- **Resolution**:
  - The turn automatically falls back to deterministic category display blocks.
  - Check Salesforce Einstein Trust Layer status and network latency.

---

## 3. Maintenance & Auditing Tasks

### 3.1 Inspecting Chat Turns & Display Blocks
Run via Prisma CLI or PostgreSQL console:
```sql
-- View latest 10 chat turns
SELECT id, "sessionId", "turnNumber", "userQuery", "agentText", status, "createdAt"
FROM "ChatTurn"
ORDER BY "createdAt" DESC
LIMIT 10;

-- View display blocks generated for a specific session
SELECT id, "turnId", type, "catalogVersion", "createdAt", "expiresAt"
FROM "ChatDisplayBlock"
WHERE "sessionId" = 'sess_...'
ORDER BY "createdAt" DESC;
```

### 3.2 Purging Expired Display Blocks
Display blocks carry an `expiresAt` timestamp (default 24 hours). A weekly cron maintenance query purges expired blocks:
```sql
DELETE FROM "ChatDisplayBlock" WHERE "expiresAt" < NOW();
```
