# AILAT DATA — Firebase Passkey Bridge Design

**Status:** Architecture specification only; not deployed or enabled.
**Scope:** Optional passwordless sign-in to an existing Firebase account. Not transaction approval, wallet access approval, payment authorization, or supplier fulfilment.

## 1. Decision

Keep Firebase Authentication as the single identity provider. Do not enable Supabase Auth passkeys as a parallel sign-in system for current users.

A future WebAuthn bridge may authenticate an existing Firebase user only after the server verifies the WebAuthn assertion and securely mints a Firebase custom token for the exact Firebase UID bound at credential enrollment.

## 2. Required ceremony

### Enrollment (user already signed in)

1. Require a current Firebase ID token and verified email; re-check the account server-side.
2. Server issues a short-lived, cryptographically random, one-time WebAuthn registration challenge.
3. Browser invokes WebAuthn registration in a secure HTTPS context.
4. Server verifies challenge, origin, RP ID, user-verification requirement, attestation policy, and credential uniqueness.
5. Store only the credential public key, credential ID, supported counter/backup metadata, Firebase UID, timestamps, and minimal authenticator metadata in a private server-side table.
6. Notify the account owner. Do not store biometric data, device PIN, private key, or raw authenticator response beyond what verification requires.

### Sign-in (no Firebase session yet)

1. Browser requests a discoverable-credential authentication challenge.
2. Server returns short-lived request options and stores the challenge server-side.
3. Browser invokes WebAuthn authentication.
4. Server verifies the assertion against the stored public key and checks challenge, origin, RP ID, signature, user-verification flag, credential status, and replay/counter rules.
5. Server resolves the exact Firebase UID from the verified credential record and mints a Firebase custom token for that UID using a Firebase Admin service account held only in protected server secrets.
6. Browser exchanges that custom token with Firebase Authentication using `signInWithCustomToken`.
7. Existing Firebase email-verification and account-state checks remain in force. A passkey must never silently create a new Firebase account.

## 3. Server requirements

- Use a maintained WebAuthn server library compatible with the selected Deno/Supabase Edge Runtime. Confirm current version and API before implementation.
- Generate challenges with a cryptographically secure random generator; store only a hash if practical.
- Challenges expire quickly (for example, 3–5 minutes), are bound to a ceremony and account where applicable, and are consumed atomically once.
- Enforce the exact production origin: `https://ismailibrahim080699-code.github.io`.
- Candidate RP ID is `ismailibrahim080699-code.github.io`; confirm browser/WebAuthn RP-ID compatibility and deployment constraints before enabling. RP ID must remain stable after credentials are enrolled.
- Require user verification; do not claim this means fingerprint specifically. Device may use its configured screen lock, biometric, PIN, or security key.
- Apply per-IP and per-account rate limits, request-size limits, generic sign-in errors, and security event logging without secrets.
- Credential records and challenges belong in a private schema/table inaccessible to browser roles. No public RLS policies.
- Firebase Admin service-account credentials must be stored as Supabase Edge Function secrets, never in GitHub, frontend code, Firestore documents, or logs.
- The bridge must verify Firebase account status and email verification at enrollment. At sign-in, define how disabled/deleted/revoked accounts are checked before issuing a custom token.
- Provide account recovery, lost-device removal, credential revocation, and notifications before launch.

## 4. Existing AILAT DATA constraints found during review

- Frontend account identity currently comes from Firebase Authentication (`firebase.js`, `login.html`, `register.html`).
- Existing Supabase Edge Functions independently verify Firebase ID tokens; they do not currently implement WebAuthn.
- Existing Edge Functions use `verify_jwt=false`, so any new endpoint must perform its own strict authentication/ceremony validation.
- No passkey bridge endpoint or private credential store was identified in the reviewed project.
- No Firebase Admin custom-token signing secret was verified as configured. Do not assume one exists.
- The Supabase Auth passkey feature is experimental and authenticates Supabase Auth users, not the current Firebase identities. It is not the selected integration path.

## 5. Rollout gates

Do not implement or enable until all are true:

- [ ] Confirm current Supabase Edge Runtime and compatible WebAuthn library/API.
- [ ] Confirm exact RP ID and allowed HTTPS origin on the actual production hostname.
- [ ] Confirm Firebase Admin service-account credential is provisioned securely as a server secret.
- [ ] Create private credential/challenge storage with strict privileges and verified atomic one-time challenge consumption.
- [ ] Implement registration and assertion verification with negative tests for wrong origin, wrong RP ID, expired/replayed challenge, wrong UID, invalid signature, disabled credential, and missing user verification.
- [ ] Implement Firebase custom-token exchange without creating accounts.
- [ ] Implement recovery, revocation, rate limits, notifications, and monitoring.
- [ ] Test only with a dedicated non-production test account first.
- [ ] Keep password/email login available as a recovery route.
- [ ] Complete a security review before any production release.

## 6. Explicit exclusions

This passkey bridge is for account sign-in only. It must not authorize wallet debits, top-ups, withdrawals, payments, transaction PINs, data purchases, or supplier API requests. Do not reuse an account-login assertion as transaction approval.

## Supabase private-schema access audit (2026-11-13)

Read-only inspection of project `bdogulpsybiggpgipdbt` confirmed:

- The `private` schema grants neither `USAGE` nor `CREATE` to `anon` or `authenticated`; both are false. `service_role` and `postgres` have schema access.
- For `private.data_plan_catalog`, `private.refund_requests`, and `private.refund_reviewers`, the inspected table grants showed only `postgres` and/or `service_role`; no `anon` or `authenticated` table grants were present.
- No policies exist on those three tables and RLS is currently disabled.
- The `private.create_refund_request` and `private.review_refund_request` routines are owned by `postgres`, are SECURITY DEFINER, and pin `search_path` to an empty value. Their definitions access the private refund tables.

### Interpretation

The generic security advisor flagged RLS-disabled tables. However, this inspection did **not** find direct schema usage or table grants for browser roles on these private-schema tables. The current boundary is therefore materially stronger than a public-schema table exposed to anon/authenticated. This is not a complete proof of API exposure configuration, and it does not replace periodic privilege review.

### Safe remediation proposal — not applied

Supabase's advisor explicitly says not to auto-apply the RLS remediation. The candidate statements are:

```sql
ALTER TABLE private.data_plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.refund_reviewers ENABLE ROW LEVEL SECURITY;
```

Do not add browser-facing policies. Before applying, verify that all legitimate access remains through the server-side `service_role` or tightly controlled SECURITY DEFINER functions, and verify function EXECUTE grants. Do not use FORCE ROW LEVEL SECURITY without a separate review because it changes owner behavior. This SQL has **not** been executed.

### Passkey readiness conclusion

The inspected project still has no confirmed Firebase Admin custom-token signing secret, no WebAuthn credential/challenge tables, and no WebAuthn Edge Function. No production schema or function was changed. The next implementation gate remains secure provisioning and review of the Firebase Admin credential, followed by a dedicated isolated WebAuthn endpoint and private storage—not modifications to existing wallet/order functions.

## Runtime compatibility research (2026-11-13)

- Supabase Edge Functions use a Deno-compatible TypeScript runtime.
- SimpleWebAuthn server documentation currently lists Deno 2.4.x+ support for the v14 line. Do not pin or deploy this dependency until the actual Supabase Edge Runtime version is confirmed to satisfy that requirement and the package API is reviewed against the selected version.
- Firebase custom-token documentation confirms the server must mint a signed custom token for the exact Firebase UID. It documents service-account key files and Google-managed signing via a service-account ID/IAM permissions as distinct approaches. Do not assume the IAM approach works from Supabase without establishing a supported workload identity and the required signing permission.
- No production code, secret, database schema, or Edge Function was changed during this research.

References:
- Supabase Edge Functions runtime: https://supabase.com/docs/guides/functions
- SimpleWebAuthn server / Deno compatibility: https://simplewebauthn.dev/docs/packages/server/
- Firebase custom tokens and service-account signing: https://firebase.google.com/docs/auth/admin/create-custom-tokens

## Latest read-only project inspection (2026-11-13)

- Supabase project ref: `bdogulpsybiggpgipdbt`.
- The live Edge Function inventory contains `ailat-backend` v7, `ailat-order-requests` v20, `ailat-referral` v5, `ailat-electricity-orders` v8, and `ailat-paystack-test` v2. No dedicated WebAuthn/passkey function is present.
- The inspected `private` schema table inventory contains no `passkey_credentials` or `passkey_challenges` tables.
- No production database DDL or Edge Function deployment was performed in this inspection.
- The Supabase function inventory does not expose the deployed Deno/Edge Runtime version. Compatibility must therefore be tested in a controlled non-production function before selecting and pinning a WebAuthn dependency.
- Do not change existing login or deploy a partially working passkey endpoint. The next safe engineering step is a separately isolated test implementation after a qualified project administrator has provisioned the required signing configuration and reviewed the security design.
