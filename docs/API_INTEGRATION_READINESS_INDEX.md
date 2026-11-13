# AILAT DATA — API Preparation Index

Audit date: 2026-11-13  
Purpose: one place to track service readiness before any provider integration. This is a documentation/static-review milestone, not a production launch approval.

## Service readiness matrix

| Service | Current customer flow | Backend status | Main blocker |
|---|---|---|---|
| Buy Data | Catalogue → review → authenticated request record | Shared `ailat-order-requests` function; request-only | Official supplier docs, verified mappings, independent security review |
| Airtime | Form → review → authenticated request record | Shared `ailat-order-requests` function; request-only | Official supplier docs, network support/commission rules |
| Electricity | Form → review-only summary | `ailat-electricity-orders` deployed with `LIVE_ENABLED = false`; frontend does not call it | Dormant supplier code review and official Disco/product mapping |
| Cable TV | Form → local review-only summary | No dedicated Cable TV function; shared function does not accept it | Official package catalogue and dedicated server contract |
| Exam PIN / Result Checker | Form → local review-only summary | No dedicated function; shared function does not accept it | Product eligibility, official exam-body catalogue and product-specific fields |

## Detailed maps

- `BUY_DATA_API_INTEGRATION_MAP.md`
- `AIRTIME_API_INTEGRATION_MAP.md`
- `ELECTRICITY_API_INTEGRATION_MAP.md`
- `CABLE_TV_API_INTEGRATION_MAP.md`
- `EXAM_PIN_API_INTEGRATION_MAP.md`

## Cross-service requirements

Before any service can be considered provider-ready, the responsible adult/business owner and an independent reviewer must verify:
1. Official provider documentation and reseller eligibility.
2. Sandbox/production separation and exact endpoint/authentication details.
3. Server-side input validation, authorization, and ownership checks.
4. Server-controlled product catalogue and pricing; never trust browser-supplied prices.
5. Idempotency, unique references, status reconciliation, and safe timeout handling.
6. Signed callback verification and protection against replay.
7. Privacy-safe logs and minimal personal data retention.
8. Refund/reversal procedures, support escalation, rate limits, and monitoring.
9. Secrets stored only in approved server-side secret storage; never in frontend files, GitHub, screenshots or chat.
10. Offline tests and independent security review before any production consideration.

## Current boundary

The current Data and Airtime endpoints record requests only. Electricity remains behind a disabled live lock and its customer summary does not submit. Cable TV and Exam remain local previews. Paystack remains a separate test-only function; this index does not authorize payment collection, wallet debit/credit, withdrawals, or live supplier fulfilment.

No database schema, RLS policy, production Edge Function, payment setting, or supplier setting is changed by this index.

## Supplier API readiness checkpoint — 2026-11-13

### Deployed function inventory checked
- `ailat-order-requests`: ACTIVE v21 — Data/Airtime request recording and catalogue validation; not a live supplier fulfilment adapter.
- `ailat-backend`: ACTIVE v7 — wallet read path; does not establish a supplier integration.
- `ailat-referral`: ACTIVE v5.
- `ailat-electricity-orders`: ACTIVE v8 — live fulfilment remains disabled.
- `ailat-paystack-test`: ACTIVE v2 — test-only and separate from supplier API integration.

### Remaining supplier integration blockers
- No verified official supplier API specification has been committed to the repository for Data/Airtime.
- The current Data/Airtime endpoint records requests; it is not evidence that supplier purchases are sent or completed.
- Cable TV and Exam have no dedicated provider-order Edge Functions.
- Electricity remains disabled pending a separate provider contract and review.
- Supplier credentials, production URLs, network IDs, product IDs, callback signatures, and status codes must come from the supplier's official documentation; none should be guessed or placed in browser code or GitHub.

### QA boundary and go/no-go
- Source-level route and validation review only. No purchase request, payment, wallet debit, supplier call, or production transaction was executed.
- This checkpoint is not a live-integration approval. Any future live activation requires the responsible adult/business owner and an independent security reviewer to verify supplier eligibility, official docs, credential custody, pricing, idempotency, callbacks, reconciliation, reversals, and operational support.
