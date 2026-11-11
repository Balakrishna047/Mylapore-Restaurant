# 08 — Salesforce Org Strategy and Setup

## 1. Recommended environment topology

For a portfolio build without an existing production org, use:
- `MEX-DEV-HUB` — Dev Hub if scratch-org workflow is enabled and available.
- `MEX-DEV-01` — Developer Edition / development org for persistent Agentforce and metadata work, subject to feature availability.
- `MEX-SCRATCH-*` — temporary scratch orgs for isolated source-driven work, where supported.
- `MEX-QA` — Developer/Developer Pro sandbox or suitable test org.
- `MEX-UAT` — Partial/Full sandbox only if sourced from a production org and licensed; otherwise a separate test org with controlled synthetic data.
- `MEX-PROD` — production org only when business, licensing and security readiness are met.

For a portfolio project, do not pretend a Developer Edition org is a production-equivalent sandbox. Verify Agentforce entitlements, Messaging, Omni-Channel, Knowledge and API limits in every target org.

## 2. Org purpose

| Org | Purpose | Data | Deployment |
|---|---|---|---|
| DEV | Build Apex, LWC, Flow, objects, agent config | Synthetic | Frequent |
| QA | Integration, regression, permission and channel tests | Synthetic/masked | Copado promotion |
| UAT | Business acceptance and operational rehearsal | Masked/synthetic | Approved promotion |
| PROD | Live customer service | Real, governed | Controlled release only |

## 3. Setup checklist

1. Confirm org edition, licenses, API access and Agentforce entitlements.
2. Enable required Einstein/Agentforce features according to current org setup guidance.
3. Enable Knowledge and configure data categories if needed.
4. Configure Service Cloud features and Case settings.
5. Configure Messaging for In-App and Web / Embedded Messaging only if selected and licensed.
6. Configure Omni-Channel, queues, presence and routing only if licensed.
7. Create permission sets and integration users.
8. Configure Named Credentials / External Credentials.
9. Configure Remote Site Settings only for legacy cases; prefer Named Credentials.
10. Configure custom objects, fields, record types, layouts and Lightning pages.
11. Configure Agentforce agents/subagents, actions and guardrails.
12. Configure channel and authentication.
13. Load synthetic test data.
14. Run tests and capture evidence.

## 4. Salesforce CLI project

Suggested project structure:

```text
mylapore-salesforce/
  sfdx-project.json
  config/
    project-scratch-def.json
  force-app/main/default/
    classes/
    lwc/
    objects/
    permissionsets/
    flows/
    flexipages/
    layouts/
    namedCredentials/
    externalCredentials/
    remoteSiteSettings/
    bots/
    genAiPlannerBundles/
    genAiFunctions/
    genAiPlugins/
  scripts/
    apex/
    soql/
  manifest/
  .gitignore
  README.md
```

Metadata types and exact folder support vary by Salesforce CLI/API version and feature. Retrieve/deploy a small proof-of-concept component first, then confirm actual metadata representation for Agentforce assets in the target org.

## 5. CLI bootstrap

Install current Salesforce CLI and VS Code Salesforce Extension Pack. Verify commands with `sf --help`; use current command reference rather than copying obsolete `sfdx` syntax.

```bash
sf --version
sf plugins
sf org login web --alias MEX-DEV --set-default
sf org display --target-org MEX-DEV
sf project generate --name mylapore-salesforce
cd mylapore-salesforce
sf project deploy start --target-org MEX-DEV --source-dir force-app
```

Scratch org flow, if Dev Hub is available:

```bash
sf org login web --alias MEX-HUB --set-default-dev-hub
sf org create scratch --definition-file config/project-scratch-def.json --alias MEX-SCRATCH-01 --duration-days 7
sf org display --target-org MEX-SCRATCH-01
```

Do not assume the scratch definition enables every Agentforce feature. Validate required features and entitlement. Some capabilities require a supported sandbox/Developer Edition environment rather than a generic scratch org.

## 6. Example scratch definition baseline

```json
{
  "orgName": "Mylapore Express Agentforce Dev",
  "edition": "Developer",
  "features": ["EnableSetPasswordInApi"],
  "settings": {
    "lightningExperienceSettings": {
      "enableS1DesktopEnabled": true
    }
  }
}
```

This is a minimal starting point, not an Agentforce entitlement guarantee. Add only settings/features documented for the org and API version you actually use.

## 7. Agentforce readiness verification

Record screenshots/export evidence for:
- Agentforce Agents available in Setup;
- agent creation enabled;
- required licenses/usage entitlements;
- Agentforce Builder and action availability;
- Agent API availability if headless/custom UI is selected;
- Messaging deployment availability if Embedded Messaging selected;
- Lightning Types/custom LWC renderer support for selected surface;
- Knowledge and Omni-Channel availability.

## 8. Org naming and access
- Use aliases, not usernames, in scripts.
- Never commit auth URLs, refresh tokens or `.sf` auth files.
- Use named user accounts for developers and separate integration identities.
- MFA and login IP/session policies should follow organization security.
- Remove stale scratch orgs and rotate credentials.
