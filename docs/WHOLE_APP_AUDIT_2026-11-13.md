# AILAT DATA — Whole-App Audit (2026-11-13)

## Audit status

This is the first whole-app audit pass, not a final sign-off. It combines a recursive GitHub tree review, static inspection of key HTML/JavaScript files, read-only Supabase project/table/advisor checks, and inspection of deployed Edge Function source. No browser end-to-end tests were run.

## Repository inventory

The main branch contains the customer-facing pages for authentication, dashboard, Buy Data, Airtime, Airtime to Cash, Electricity, Cable TV, Exam PIN/Result, Referral, Transaction History, wallet funding/withdrawal, profile, order summaries, and transaction security. It also contains service placeholders such as Bulk SMS, card printing, gift cards, and other planned service pages.

## Findings confirmed

1. The Supabase project is active and contains wallet, transaction, service-order-request, data-plan-catalogue, referral, refund, and test-payment tables.
2. The five deployed Edge Functions discovered are `ailat-backend` (v7), `ailat-order-requests` (v20), `ailat-referral` (v5), `ailat-electricity-orders` (v8), and `ailat-paystack-test` (v2). Their platform-level `verify_jwt` setting is false; the inspected functions implement their own Firebase JWT verification. This needs to remain explicitly tested and reviewed.
3. The inspected data and electricity order-request flows record requests only. Their code explicitly says no provider request is sent and no wallet is charged.
4. The repository's airtime provider adapter is a scaffold and is not among the deployed Edge Functions. It explicitly does not contact the supplier.
5. The Paystack function is restricted in code to a test secret prefix and test-domain verification, and its comments/responses state that wallet balance is not changed. It must not be treated as live wallet funding.
6. Supabase advisors report three private-schema tables with RLS disabled. A separate read-only privilege check confirmed that `anon` and `authenticated` have no USAGE on the `private` schema and no table privileges on those private tables. Therefore the advisor's blanket claim that these private tables are directly exposed to browser roles is not supported by the checked grants. RLS remains valuable defense in depth, but enabling it is not being done blindly.
7. The same read-only privilege check found no direct table SELECT/INSERT/UPDATE privileges for browser roles on the listed public tables, and RLS is enabled on those public tables. The security advisor reports RLS-enabled tables without policies; this currently means browser-role access is denied rather than proving public data exposure. Server-side service-role Edge Functions are a separate privileged access path and require their own authorization review.
8. Static inspection found dynamic HTML rendering in transaction history, referral history, and order summaries. The inspected transaction/referral renderers escape dynamic text before inserting it into HTML. This does not replace a full review of every rendering path.
9. Key authentication pages use Firebase Auth. Several customer pages enforce email verification, but the full set of page guards and every deep-link path still need systematic review.
10. The top-level project inventory includes all expected HTML routes, but a complete automated broken-link and browser navigation test has not yet been run.

## Required next audit passes

- Build a complete internal-link inventory and verify every local route/file case-sensitively.
- Review every page's authentication guard, email-verification behavior, form validation, loading/error/empty states, and mobile layout.
- Review all dynamic HTML insertion points and query-string handling.
- Compare every frontend API request with its deployed Edge Function method, request schema, response schema, CORS behavior, and authorization checks.
- Review database policies, grants, function ownership, SECURITY DEFINER routines, and server-side service-role access without weakening current restrictions.
- Run safe, non-financial checks where possible. Do not use real payments, wallet changes, withdrawals, or supplier fulfilment as test cases.

## API integration gate

Do not enable live API fulfilment until provider documentation, exact network/plan mappings, pricing, status reconciliation, duplicate-request protection, refund handling, secrets, and an independently reviewed authorization model are verified. Never place provider secrets or Supabase service-role keys in frontend files.

## Changes made during this audit

No production database schema, RLS policy, Edge Function deployment, payment setting, or supplier setting was changed during this audit. This report is documentation only.


## Follow-up general QA pass — 2026-11-13

### Checks completed from repository source
- Reviewed 18 high-priority HTML pages: landing, login, registration, dashboard, Data, Airtime, Electricity, Cable TV, Exam, order summaries, wallet pages, transaction history, settings, profile and referral.
- Checked local `.html` references on those 18 pages against the repository tree: no missing local HTML target was found in that sample.
- Inspected dynamic `innerHTML` use on Registration, Dashboard, Airtime summary, Transaction History and Referral. The Registration/Dashboard occurrences replace fixed UI icons; the Transaction History and Referral renderers use escaping helpers for dynamic text; the Airtime summary writes a fixed error template.
- Confirmed Supabase Edge Function inventory at time of check: `ailat-backend` v7, `ailat-order-requests` v21, `ailat-referral` v5, `ailat-electricity-orders` v8, and `ailat-paystack-test` v2, all reporting ACTIVE.
- Confirmed `ailat-order-requests` v21 contains the Airtime safe-integer amount guard.

### Checks not completed
- A live browser request to the GitHub Pages URL could not be completed in this test environment. Therefore HTTP status, page rendering, mobile layout, JavaScript runtime errors, and real Firebase sign-in flows remain unverified.
- No authenticated end-to-end request was sent; no test user session or database test fixture was used.
- No supplier dispatch, wallet debit/credit, Paystack payment, or real customer data was used.

### QA result
Static source checks passed for the sampled pages and their local HTML links. This is not a complete 37-page browser test and is not a production-readiness sign-off. Remaining release gate: browser/device testing by the project owner or a responsible adult tester using test accounts and sandbox-only credentials, followed by independent security review.

## Follow-up route and order-summary review — 2026-11-13

### Additional source checks
- Reviewed `transaction_history.html`, `referral.html`, `airtime_to_cash.html`, `tv.html`, `exam_result.html`, and `profile.html`.
- Confirmed the inspected account pages check Firebase sign-in and email verification before showing account-specific content.
- Airtime-to-Cash remains a preview-only flow and explicitly states that the conversion service is not active; no conversion partner is contacted.
- Reviewed Data, Airtime, Cable TV, and Exam summary pages. Cable TV and Exam summaries use text-only DOM updates for query values and clearly state that no provider order/payment is submitted.
- Data and Airtime summaries send authenticated requests to the shared request-recording endpoint only. Their UI responses explicitly state that no payment was taken and no service was delivered.
- The Data and Airtime summary pages create an idempotency key in page memory. Reloading the page creates a new key; stable retry protection across reloads and server-side uniqueness/reconciliation remain required before production use.

### QA boundary
- These are source-level checks only. No submit buttons were activated, no customer request was created, and no wallet/payment/provider operation was run.
- No browser rendering, device layout, Firebase live-session, or backend end-to-end test was performed in this pass.
- No production payment, wallet, supplier, database, or security configuration was changed.
