# Deployment Runbook: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Platform**: Render Cloud & Neon Serverless PostgreSQL  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Production Architecture Overview

The Mylapore Express platform is deployed across high-availability managed infrastructure:

1. **Frontend Storefront**: Next.js 14 App Router deployed as a Web Service on Render (`srv-dbq4s7lg1s2s73c1okeg` / `https://mylapore-express-web.onrender.com`).
2. **Backend API & BFF**: NestJS 10 REST API deployed as a Web Service on Render (`srv-dbq4qplg1s2s73c1kdp0` / `https://mylapore-express-api.onrender.com`).
3. **Primary Database**: Neon Serverless PostgreSQL (`ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech`).
4. **AI Reasoning Layer**: Salesforce Einstein Agentforce Developer Org CAN96 (`00DgK00000fMxxtUAC`), Agent ID `0XxgK000002YIJ7SAO`.

---

## 2. Service Build & Start Configurations

### 2.1 Backend Service: `mylapore-express-api`
- **Render Service ID**: `srv-dbq4qplg1s2s73c1kdp0`
- **Git Branch**: `master` (and `main`)
- **Root Directory**: `.`
- **Build Command**: `pnpm install && pnpm --filter @mylapore/api build`
- **Start Command**: `node apps/api/dist/main.js`
- **Health Check Path**: `/api/v1/health`
- **Auto-Deploy**: Enabled on Git push

### 2.2 Frontend Service: `mylapore-express-web`
- **Render Service ID**: `srv-dbq4s7lg1s2s73c1okeg`
- **Git Branch**: `master`
- **Root Directory**: `.`
- **Build Command**: `pnpm install && pnpm --filter @mylapore/web build`
- **Start Command**: `pnpm --filter @mylapore/web start`
- **Auto-Deploy**: Enabled on Git push

---

## 3. Environment Variables Master Verification

### Backend Environment Variables (`srv-dbq4qplg1s2s73c1kdp0`)
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://neondb_owner:***@ep-jolly-hat-a1w9iu5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
CORS_ORIGIN=https://mylapore-express-web.onrender.com
SALESFORCE_ENABLED=true
SALESFORCE_INSTANCE_URL=https://orgfarm-aa5be92666-dev-ed.develop.my.salesforce.com
SALESFORCE_AGENT_ID=0XxgK000002YIJ7SAO
SALESFORCE_CLIENT_ID=3MVG9rZjd7MXFdLirc6i5XbMjlTpIbvKBqY9O3ExUHxMD47LJe8mAIHmGnLA.jcRTKNnYgVQcPmHNaUw8UNul
SALESFORCE_CLIENT_SECRET=***
SALESFORCE_RUN_AS_USER=balamechanical047.9ff158395f8b@agentforce.com
AGENTFORCE_API_KEY=mylapore-agentforce-secret-key-2026
X_GATEWAY_AUTH=mylapore-gateway-auth-token-2026
AGENT_GATEWAY_AUTH_MODE=API_KEY
CHAT_HMAC_SECRET=mylapore-chat-secret-key-2026
```

### Frontend Environment Variables (`srv-dbq4s7lg1s2s73c1okeg`)
```bash
NODE_ENV=production
PORT=10000
NEXT_PUBLIC_API_URL=https://mylapore-express-api.onrender.com/api/v1
```

---

## 4. Pre-Deployment & Verification Steps

1. **Local Test Execution**:
   ```bash
   pnpm --filter @mylapore/api test
   pnpm --filter @mylapore/web build
   ```
2. **Git Commit & Push**:
   ```bash
   git add .
   git commit -m "feat(v2.7): complete full-stack salesforce agentforce integration"
   git push origin master
   git push origin main
   ```
3. **Monitor Deploy Status**:
   - Check Render API service deployment status until `live`.
   - Probe live health check:
     ```bash
     curl -s https://mylapore-express-api.onrender.com/api/v1/health
     ```
     Expected Response: `{"status":"ok","service":"mylapore-express-api","database":"healthy"}`.

---

## 5. Rollback & Disaster Recovery Procedures

1. **Instant Rollback via Render**:
   - Navigate to Render Dashboard -> `mylapore-express-api` -> Deploys.
   - Locate previous stable deploy ID (e.g. `dep-dbs83kek1f9s738i4pv0`).
   - Click **Rollback to this deploy**. Service resumes within 60 seconds.
2. **Database Point-in-Time Recovery**:
   - Neon automatically manages continuous WAL archiving.
   - Point-in-Time Recovery (PITR) is available via the Neon console down to the second.
3. **Feature-Flag Kill Switch**:
   - If Salesforce Agentforce experiences external service outages, set `SALESFORCE_ENABLED="false"` in the Render dashboard.
   - The BFF immediately falls back to `SIMPLE_MENU` mode without redeploying code.
