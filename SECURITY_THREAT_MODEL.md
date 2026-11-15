# Security Threat Model: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary & Security Doctrine

The security architecture of **Mylapore Express v2.7** adheres to strict defense-in-depth principles and the core engineering doctrine:
> **"The AI talks; the backend decides."**
> 
> *The AI agent has zero authority to execute financial mutations, alter prices, override allergen declarations, or access the underlying PostgreSQL database directly.*

---

## 2. Threat Analysis (STRIDE Model)

| STRIDE Threat Category | Potential Attack Vector | Platform Countermeasure & Defense Implementation | Severity | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Adversary imitates Salesforce Agentforce callouts to invoke backend APIs | `AgentforceApiKeyGuard` requires TLS header `X-Gateway-Auth` or `x-agentforce-api-key`. Unauthenticated calls are rejected with `HTTP 401`. | Critical | Negligible |
| **Spoofing** | Attacker impersonates a customer chat session | Guest sessions issue cryptographically random `sess_<uuid>`. Monotonic turns require signed HMAC-SHA256 `turnToken`. | High | Low |
| **Tampering** | Attacker attempts to modify dish prices or allergen tags in transit | All prices and allergen badges are constructed exclusively on the NestJS backend and serialized into typed display blocks. Frontend is presentation-only. | Critical | Zero |
| **Repudiation** | User denies performing actions or orders | Every chat turn, session initiation, and integration callout is logged in `ChatTurn`, `ChatDisplayBlock`, and `AuditLog` tables. | Medium | Low |
| **Information Disclosure** | Leakage of Salesforce client secret or DB connection strings | Zero credentials exposed in browser client. Render managed secrets used exclusively. Secrets redacted in logs. | Critical | Zero |
| **Denial of Service (DoS)** | Concurrent turn race attacks causing memory exhaustion or duplicate turns | `SessionLockGuard` locks concurrent turns per session, returning **HTTP 423 Locked**. Rate limiter enforces 60 req/min per IP. | High | Negligible |
| **Elevation of Privilege** | Chatbot tricked into checkout or refund operations via prompt injection | Strict scope freezing: Release 1 chat handles only initialization and discovery actions (`listMenuCategories`, `searchMenu`, `getMenuItemDetails`). Ordering tools are disabled. | Critical | Zero |

---

## 3. Reliability & Operational Guardrails

### 3.1 Session Mutex Lock (HTTP 423 Locked)
To prevent race conditions where a customer or script sends concurrent prompts before previous turns resolve:
- `SessionLockGuard.acquire(sessionToken)` acquires an in-memory lock.
- If a turn is currently `PROCESSING`, subsequent requests immediately receive:
  ```json
  {
    "statusCode": 423,
    "message": "Session is busy processing a turn."
  }
  ```
- The lock is reliably released in a `finally` block upon turn completion, failure, or timeout.

### 3.2 24-Second Deadline Control & Late Response Rejection
- Salesforce Einstein Agent API or network hops may occasionally hang or exceed gateway thresholds.
- The BFF enforces a **24-second deadline control promise**:
  ```ts
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Agent turn processing timed out')), 24000);
  });
  ```
- If the agent fails to respond within 24 seconds, the turn gracefully falls back to the deterministic category display block.
- Late-arriving responses are rejected and cannot overwrite completed turns or subsequent turns.

### 3.3 Strict Turn Correlation
- Every display block carries `turn_id` and `request_id`.
- The frontend chat state checks `turn_id` against active conversation sequence before rendering blocks.
- Stale, mismatched, or expired blocks (past `expires_at`) are discarded.

### 3.4 Food Safety & Allergen Guardrails
- **"Unknown does not mean absent. Never infer allergen safety."**
- Dishes missing verified laboratory or culinary testing are classified as `UNKNOWN` or `NOT_REVIEWED` and excluded from strict allergen-safe query results.
- Blast-chilled handling instructions and reheating FDA thresholds (165°F) are embedded directly in verified display block metadata.

### 3.5 CORS & SSRF Protection
- CORS origin is locked to `https://mylapore-express-web.onrender.com`.
- Webhooks and external callouts validate URL allowlists to prevent Server-Side Request Forgery (SSRF).
- Images are sourced exclusively from the authenticated Cloudinary CDN domain (`res.cloudinary.com`).
