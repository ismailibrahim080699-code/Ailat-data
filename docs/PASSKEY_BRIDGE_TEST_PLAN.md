# AILAT DATA — Passkey Bridge Test Plan

**Status:** Test plan only. No endpoint is deployed and no passkey is enrolled.
**Scope:** Account sign-in only. Never transaction approval or payment authorization.

## Test environment prerequisites

- Use a separate Firebase test project and a dedicated test account. Never test with a production customer account.
- Use a dedicated non-production Supabase project or isolated test function.
- A project administrator must provision server credentials directly in the secret manager. Never paste credentials into chat, source control, browser code, issue trackers, or logs.
- Confirm the actual Supabase Edge Runtime version and pin a WebAuthn server library version that explicitly supports it.
- Confirm the HTTPS origin and RP ID on the exact test hostname before creating any credentials.

## Registration tests

1. Reject registration without a valid Firebase ID token.
2. Reject unverified email accounts.
3. Reject expired, unknown, or previously consumed registration challenges.
4. Reject wrong origin and wrong RP ID.
5. Reject an attestation/credential response with invalid cryptographic data.
6. Reject a credential ID already registered to another account.
7. Verify stored records contain only credential public material and required metadata—not biometric templates, device PINs, private keys, or raw secrets.
8. Verify the credential is bound to the exact authenticated Firebase UID.

## Authentication tests

1. Reject unknown credential IDs.
2. Reject expired, mismatched, or replayed challenges.
3. Reject invalid signatures and malformed authenticator data.
4. Reject wrong origin and wrong RP ID.
5. Reject assertions without required user verification.
6. Reject revoked credentials.
7. Confirm the Firebase UID is read only from the verified credential record, never accepted from browser input.
8. Confirm a successful assertion mints a Firebase custom token only for that exact UID.
9. Confirm the browser exchanges the token using Firebase Authentication and does not create a new account.
10. Confirm disabled/deleted Firebase accounts cannot sign in.
11. Confirm generic error messages do not reveal whether an email or credential exists.

## Abuse and recovery tests

- Rate-limit repeated challenge and assertion requests.
- Enforce request body size and schema limits.
- Ensure challenges expire quickly and are consumed atomically exactly once.
- Verify lost-device credential revocation and account recovery.
- Verify notification to the account owner after enrollment and credential removal.
- Confirm password/email login remains available as a recovery method.
- Confirm logs contain no Firebase Admin credentials, ID tokens, challenge secrets, private keys, or full authenticator responses.

## Release gates

Production release is blocked until every test above passes, an independent security review is complete, recovery is verified, and rollback is documented. A capability check in the browser is not proof that a passkey is enrolled or that authentication works.

## Current project state

The production login remains email/password. The current Transaction Security page only checks browser authenticator capability and correctly labels enrollment as unavailable. No passkey endpoint, credential store, or Firebase Admin secret has been verified in production.
