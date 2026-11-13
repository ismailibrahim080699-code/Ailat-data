# Exam PIN / Result Checker — API Preparation Map

Audit date: 2026-11-13  
Scope: `exam_result.html`, `exam_order_summary.html`, and deployed Supabase Edge Function inventory.  
Status: documentation and static inspection only; no live provider integration.

## Current frontend flow

- `exam_result.html` offers WAEC, NECO, NABTEB and JAMB.
- The form collects an optional candidate/registration number and a free-text requested service.
- Client validation requires a provider, at least 2 characters for the requested service, and at least 5 characters if an account number is supplied.
- It redirects to `exam_order_summary.html` with `provider`, `account` and `item` query parameters.
- `exam_order_summary.html` validates the provider against the same four values and repeats the account/service length checks.
- Summary values are rendered with `textContent`, not HTML interpolation.
- The summary page checks Firebase login and email verification.
- Both pages clearly state that this is a local preview only. No order is submitted, no PIN is issued and no result is checked.

## Backend comparison

The deployed Supabase project currently lists these Edge Functions: `ailat-backend`, `ailat-order-requests`, `ailat-referral`, `ailat-electricity-orders`, and `ailat-paystack-test`.

There is no dedicated Exam PIN / Result Checker Edge Function. The shared `ailat-order-requests` function currently accepts only `data` and `airtime` service keys. Other service keys are rejected as not enabled. Therefore the Exam form must remain local-preview-only; do not point it at the shared endpoint or imply that an order has been recorded.

## Required provider discovery before implementation

For each exam body and product, obtain official provider documentation and confirm:
1. Exact product types supported (e.g. PIN purchase versus result-checking token).
2. Whether the product is available for resale and any eligibility or authorization requirements.
3. Required fields and format rules; do not collect candidate passwords or secret exam tokens in a generic form.
4. Authoritative price, availability, validity and refund/cancellation rules.
5. Provider sandbox, request authentication, status lookup and reconciliation process.
6. Whether the provider permits the proposed reseller workflow.

Do not guess provider endpoints, product IDs, prices or request fields. Treat WAEC, NECO, NABTEB and JAMB as separate mappings until official documentation confirms otherwise.

## Security and acceptance requirements

- Keep provider credentials server-side only; never put them in GitHub Pages JavaScript, HTML, URLs or logs.
- Authenticate the user server-side and verify the Firebase token, UID and verified-email claim.
- Validate provider, product, candidate identifier and amount server-side against an allowlisted catalogue.
- Use idempotency and unique provider references; reconcile uncertain outcomes before retrying.
- Do not expose provider responses containing secrets or personal data.
- Keep the UI explicit about preview, pending, confirmed, failed and refunded states.
- No payment collection, wallet debit, PIN delivery or result-checking action is enabled by this preparation document.

## Current conclusion

The existing Exam page is a local request preview, not an integrated service. The next safe step is to obtain and review official provider documentation and product eligibility. A backend contract can then be designed without enabling live fulfilment or payment.
