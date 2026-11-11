# Org Setup Runbook — Practical Sequence

## A. Before creating anything
1. List all Salesforce orgs and identify Developer Edition, sandbox, Dev Hub and production.
2. Capture org ID, edition, instance, API version, enabled features and licenses in a secure environment inventory.
3. Confirm Agentforce, Messaging, Knowledge, Omni-Channel, API and Copado entitlements.
4. Confirm no real customer data is copied into portfolio DEV.

## B. Local developer machine
1. Install current Salesforce CLI.
2. Install VS Code and Salesforce Extension Pack.
3. Install Git and configure SSH/HTTPS access to repository.
4. Verify `sf --version`.
5. Create project with `sf project generate`.
6. Authenticate DEV using `sf org login web --alias MEX-DEV`.
7. Verify `sf org display --target-org MEX-DEV`.
8. Retrieve a harmless metadata component to prove access.

## C. DEV org
1. Enable Agentforce/Einstein according to current Salesforce setup guide and available entitlement.
2. Enable Knowledge and configure categories.
3. Configure Case settings and queues.
4. Configure Messaging only if chosen channel is licensed and selected.
5. Create integration user and permission sets.
6. Configure External Credential and Named Credential.
7. Deploy custom objects/fields and Apex/LWC.
8. Configure agent and action metadata using supported builder/Agentforce DX flow.
9. Test read-only menu action before any side effect.

## D. QA org
1. Connect QA in Copado.
2. Deploy baseline metadata.
3. Provision environment-specific credentials out-of-band.
4. Load synthetic data.
5. Run Apex/LWC/Flow/API/agent/channel tests.
6. Verify sharing and permission behavior using representative users.

## E. Copado
1. Confirm product edition and pipeline generation.
2. Connect orgs and repository.
3. Create stages and branch mapping.
4. Create a sample story.
5. Commit one harmless component.
6. Promote DEV → QA.
7. Run tests and capture deployment evidence.
8. Do not connect production until governance and approvals are ready.

## F. Evidence template
- Org alias:
- Org ID (store in internal inventory, not public repo):
- Edition:
- API version:
- Agentforce enabled:
- Agent API available:
- Messaging available:
- Lightning Type renderer proven:
- Knowledge enabled:
- Omni-Channel enabled:
- Copado edition:
- Pipeline type:
- Git repository:
- Last successful promotion:
- Known limitations:
