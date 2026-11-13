# AILAT DATA — Account Security Plan

**Status:** Design and review only. This document does not enable transaction authorization, payments, wallet changes, or supplier fulfilment.

## Current verified state

- The `transaction_security.html` page exists and is linked from the dashboard and profile page.
- The page checks whether the browser reports platform-authenticator availability. It does not enroll a passkey or access fingerprint/face data.
- No transaction PIN endpoint or passkey enrollment endpoint was found in the reviewed Supabase Edge Function list.
- `ailat-backend` validates Firebase ID tokens itself and requires a verified email for its wallet-read route.
- `ailat-order-requests` records order requests only. Its response explicitly states that no payment is taken and no service is delivered.
- `ailat-paystack-test` is restricted to a test key and reports that it does not change wallet balance.
- The listed functions have `verify_jwt=false`; therefore each function must continue to validate its own intended authentication and request constraints. Do not assume the Supabase gateway has authenticated a caller.

## Safe account-security direction

1. Keep Firebase Authentication as the account identity source until a deliberate migration is designed.
2. For account sign-in protection, evaluate WebAuthn/passkeys with server-side challenge creation, one-time challenge consumption, origin and RP-ID validation, signature-counter handling where supported, and credential ownership checks.
3. Never store a raw PIN, fingerprint, face image, biometric template, or reusable authentication secret in browser storage or Firestore.
4. Do not treat browser capability detection as biometric enrollment or proof that a user has authenticated.
5. Keep recovery separate from ordinary sign-in. Require verified account recovery and notify the account owner of credential changes.
6. Rate-limit authentication attempts, use short-lived challenges, prevent replay, and record security events without logging secrets.
7. Keep service-role credentials and all provider/payment secrets server-side. Never place them in GitHub Pages frontend files.

## Explicit non-goals

This plan does not implement a transaction PIN, wallet debit approval, payment authorization, supplier dispatch, or live financial operation. Those require an appropriately authorized production security review and verified provider/payment controls. The existing security page must continue to label unavailable controls honestly.

## Verification checklist for future account sign-in work

- [ ] Confirm exact allowed website origin and WebAuthn RP ID.
- [ ] Confirm Firebase account identity is bound to the credential on the server.
- [ ] Confirm challenges expire and can be consumed only once.
- [ ] Confirm credential registration and authentication signatures are verified server-side.
- [ ] Confirm recovery, credential removal, and lost-device flows.
- [ ] Confirm rate limits and security-event logging.
- [ ] Confirm no secrets or biometric data are written to localStorage, sessionStorage, or logs.
- [ ] Test only with non-financial account sign-in scenarios before release.

## Existing sign-in flow review (2026-11-12)

- `login.html` currently signs users in with Firebase email and password using `signInWithEmailAndPassword`.
- The login page checks `emailVerified` and blocks unverified accounts; it also handles Firebase's too-many-requests response.
- `register.html` creates Firebase email/password accounts, sends an email-verification message, and saves the user profile. It does not register a passkey.
- No WebAuthn credential registration or assertion flow is present in the reviewed login or registration pages.
- Therefore, do not show a passkey button as active and do not describe device-authenticator detection as sign-in authentication. A real passkey sign-in feature needs server-generated one-time challenges and server-side signature verification before the UI can be enabled.
