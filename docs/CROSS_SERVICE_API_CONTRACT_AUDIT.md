# AILAT DATA — Cross-Service API Contract Audit

Date: 2026-11-13  
Scope: static comparison of customer summary pages and deployed `ailat-order-requests` v20 source.  
No live orders, payments, supplier calls, database changes or Edge Function deployments were performed.

## Confirmed shared endpoint contract

Endpoint: `/functions/v1/ailat-order-requests`

- `GET?action=plans`: public active data-plan catalogue, filtered to rows marked verified with supplier IDs.
- Authenticated `GET`: verifies Firebase JWT issuer, audience, subject and `email_verified=true`, then returns only rows whose `user_id` matches the token subject (limit 100).
- `POST`: verifies Firebase JWT and verified email; accepts JSON with `service_key`, UUID `idempotency_key` and object `customer_data`.
- Currently enabled service keys: `data` and `airtime` only.
- Other service keys are rejected. This endpoint does not call a supplier or debit a wallet; it inserts a request record with status `received`.
- CORS allows the GitHub Pages origin `https://ismailibrahim080699-code.github.io`, plus the required authorization, apikey and content-type headers.
- Platform `verify_jwt=false`; custom Firebase verification in the function is therefore essential.

## Field comparison

### Buy Data
Frontend sends `service_key=data`, UUID key, network, internal network ID, phone, bundle label, purchase type and catalogue plan ID. Backend validates the network ID, phone, purchase type and server-side catalogue plan, derives price from server catalogue, checks verified supplier mapping, then records the request. Client bundle label is not trusted for price.

### Airtime
Frontend sends `service_key=airtime`, UUID key, network, phone and amount. Backend validates network and phone and checks amount is within ₦50–₦100,000. Backend currently uses `Number(...)` and finite/range checks, so decimal values can pass server validation even though the UI intends whole-number amounts. Tighten server validation to `Number.isSafeInteger(amount)` before any production use.

### Electricity
The customer summary is review-only and does not call `ailat-electricity-orders`. That function remains a separate endpoint with a live-disabled guard. Do not treat the shared order endpoint as an Electricity endpoint.

### Cable TV and Exam PIN
Neither summary page calls the shared endpoint. The shared endpoint rejects these service keys. No dedicated deployed Edge Functions exist for them in the inspected inventory.

## Cross-cutting risks and follow-up

1. **Idempotency lifetime:** frontend UUIDs are generated in page memory. A reload creates a new key, so a customer retry after refresh can create a second request. A future implementation needs a stable, per-intent request key retained through the retry window and server-side uniqueness/reconciliation. Do not store sensitive data in that key.
2. **Airtime integer validation:** backend currently accepts decimal amounts despite UI whole-number intent. Fix and test server-side before considering any live flow.
3. **Authentication platform setting:** `verify_jwt=false` is acceptable only if custom Firebase JWT verification remains correct and is independently tested on every protected route.
4. **GET catalogue exposure:** plans endpoint is intentionally public and returns catalogue fields only. Keep internal credentials and private supplier data out of the selected response.
5. **CORS:** fixed-origin allowlist is appropriate for the deployed Pages origin. Recheck exact origin on any future custom domain.
6. **Error responses:** frontend displays backend error text for failed POSTs. Keep server errors generic and never return credentials, stack traces, SQL text or provider secrets.
7. **Request data:** phone numbers and service details are persisted in request records. Establish retention and access rules before expanding service coverage.

## Safe offline test matrix

- Missing, malformed, expired, wrong-audience and wrong-issuer Firebase tokens are rejected.
- Unverified email is rejected.
- User A cannot list or retrieve User B's requests.
- Unsupported methods and unsupported service keys are rejected.
- Malformed JSON, oversized body, invalid UUID and non-object customer data are rejected.
- Data plan ID/network/type mismatches and unverified supplier mappings are rejected.
- Airtime rejects non-integer, below-minimum and above-maximum values.
- Duplicate idempotency key for the same user returns the original request, not a second row.
- Cross-user reuse of an idempotency key does not expose another user's record.
- CORS preflight and allowed-origin behavior are verified.
- No test sends a supplier request, charges a wallet, changes a balance, or uses real customer information.

## Conclusion

The Data and Airtime request-recording paths have matching high-level frontend/backend contracts, with an Airtime server-side integer-validation gap and a retry-key lifetime limitation. Electricity is separate and locked; Cable TV and Exam are not backend-integrated. These are static findings, not a production security sign-off.
