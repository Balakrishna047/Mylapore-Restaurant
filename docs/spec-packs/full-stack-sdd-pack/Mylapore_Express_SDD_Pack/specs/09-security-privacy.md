# 09 — Security and Privacy Specification

## Authentication
- Use a proven identity provider or a reviewed secure implementation.
- Hash passwords with a modern password hashing algorithm.
- OTP must be short-lived, rate-limited, single-use and stored hashed.
- Refresh tokens rotate and can be revoked.
- Guest sessions use high-entropy secrets, expiry and narrowly scoped access.
- Require step-up verification for sensitive account/payment actions.

## Authorization
- Enforce RBAC plus outlet and object scope.
- Derive subject and role from verified server-side claims.
- Every query/mutation enforces owner/scope.
- Staff actions record actor and outlet.
- Admin/finance privileged actions require MFA and audit; high-risk refunds use dual control where configured.

## Application security
- TLS in deployed environments.
- CSRF protection for cookie-based auth.
- CORS allowlist.
- Rate limits on auth, search, chat and mutations.
- Validate payloads and file uploads.
- Secure headers and CSP.
- Dependency and secret scanning in CI.
- Encrypt backups and sensitive data at rest using managed platform controls.
- Never log passwords, OTP, access tokens, payment credentials or full sensitive provider payloads.

## AI safety
- Treat retrieved content, menu descriptions, reviews, emails and user text as untrusted.
- Tool allowlist and strict schemas.
- No model-controlled identity, role, outlet permission or arbitrary URL.
- Confirm side effects and use backend policy.
- Ground allergens/food safety only in verified records.
- Human approval for defined high-risk actions.
- Evaluate prompt injection, data exfiltration and cross-user access.

## Privacy and regulatory verification
- Maintain data inventory, purpose, legal basis/notice, processor list, retention and deletion workflow.
- Obtain qualified India legal/accounting review for applicable privacy rules, GST/invoice obligations, FSSAI requirements, payment and messaging rules.
- Verify SMS/WhatsApp consent and provider template requirements.
- Review cross-border processing and data residency commitments.
- This specification is not legal advice or a compliance certification.
