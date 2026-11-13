# AILAT DATA — Cable TV API Preparation Map

Audit date: 2026-11-13  
Scope: `tv.html`, `tv_order_summary.html`, and deployed Supabase Edge Function inventory.  
Status: static review and documentation only; no provider calls or payment/order processing enabled.

## Current frontend flow

- `tv.html` offers DStv, GOtv and StarTimes.
- It collects a Smartcard/IUC number and a free-text package name.
- The form requires a 6–20 digit decoder number and a package name of at least 2 characters.
- It passes `provider`, `account` and `item` to `tv_order_summary.html` using query parameters.
- The summary page checks Firebase login and verified email, and renders values with `textContent`.
- The summary is local review only; it does not submit a request.

## Finding fixed during this pass

The summary page previously accepted an empty decoder number or any value of at least five characters, even though the form required 6–20 digits. This allowed a crafted URL to bypass the form's stricter check.

The summary validation now requires:
- Provider is exactly one of DStv, GOtv or StarTimes.
- Smartcard/IUC number matches `^[0-9]{6,20}$`.
- Package name contains at least 2 characters.

The frontend form's existing rule was not changed. This is a client-side consistency fix only; server-side validation will still be required for any future service endpoint.

## Backend comparison

The deployed Supabase Edge Function inventory contains `ailat-backend`, `ailat-order-requests`, `ailat-referral`, `ailat-electricity-orders`, and `ailat-paystack-test`. There is no dedicated Cable TV order function. The shared `ailat-order-requests` function currently accepts only `data` and `airtime` service keys.

Therefore Cable TV must remain local-preview-only. Do not send Cable TV data to the shared endpoint or represent this review page as an order confirmation.

## Provider documentation required

For each provider, independently verify:
1. Supported packages and exact provider product identifiers.
2. Decoder/Smartcard validation process and required fields.
3. Authoritative prices, fees, renewals and package-change rules.
4. Sandbox and production endpoints and authentication requirements.
5. Request references, idempotency, status lookup and signed callbacks.
6. Timeout, retry, reversal/refund, reconciliation and support procedures.
7. Whether reseller distribution is authorized.

Do not guess package IDs, decoder formats, endpoints, prices or status codes. Keep provider credentials server-side; never put them in frontend files, URLs, GitHub, screenshots or chat.

## Current conclusion

Cable TV is a local review flow with no backend order endpoint. The summary validation mismatch has been corrected. A future backend contract must be based on official provider documentation and independently reviewed authorization and privacy controls. This document does not enable supplier dispatch, payment collection, wallet operations or live subscription.
