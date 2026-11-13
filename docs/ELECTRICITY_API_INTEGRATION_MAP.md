# AILAT DATA — Electricity API Contract & Integration Readiness

Date: 2026-11-13
Status: Static review only. No provider calls, payments, wallet changes, database changes, or deployments were performed.

## 1. Current customer flow

1. `electricity.html` lets a signed-in, email-verified customer choose a distribution company, meter type, meter number, and requested amount.
2. The form validates a known Disco ID (1–10), prepaid/postpaid, a 6–20 digit meter number, and a whole-number amount from ₦100 to ₦1,000,000.
3. It passes the selected values to `electricity_order_summary.html` as URL query parameters.
4. `electricity_order_summary.html` validates the parameters again and displays a review-only page.
5. The summary page has a disabled button. It does not call the Edge Function.

Therefore, the current customer-facing flow is review-only: it does not create an order-request record, contact a provider, charge a wallet, or issue a token.

## 2. Current Edge Function interface (not called by the frontend)

Deployed function: `ailat-electricity-orders` (version 8; platform `verify_jwt=false`, with custom Firebase JWT verification in function code).

Expected method:
- `POST /functions/v1/ailat-electricity-orders`

Required headers:
- `apikey: <Supabase publishable key>`
- `Authorization: Bearer <Firebase ID token>`
- `Content-Type: application/json`

Expected body shape:
```json
{
  "idempotency_key": "UUID",
  "customer_data": {
    "disco": 5,
    "meter_type": "prepaid",
    "meter_number": "12345678901",
    "amount": 1000
  }
}
```

Illustrative values only. The function validates the Firebase token and verified-email claim, request UUID, Disco ID, meter type, meter number, and amount range.

## 3. Disco mapping found in frontend and backend

| ID | Distribution company |
|---:|---|
| 1 | Ikeja Electricity |
| 2 | Eko Electricity |
| 3 | Kano Electricity |
| 4 | Port Harcourt Electricity |
| 5 | Jos Electricity |
| 6 | Ibadan Electricity |
| 7 | Kaduna Electric |
| 8 | Abuja Electricity |
| 9 | Yola Electricity |
| 10 | Benin Electricity |

The labels and numeric IDs match between the two inspected files. This is a code-level consistency check, not independent verification against an official provider catalogue.

## 4. Important gaps and security observations

- The frontend summary does not call the Edge Function. The deployed function is not currently part of the customer flow.
- The function contains a hard-coded `LIVE_ENABLED = false` safety lock. With the current setting, it returns HTTP 503 and states that no order was sent or payment made.
- The function source contains dormant supplier-authentication and bill-purchase code after that lock. It must not be enabled as-is. The exact provider contract, authentication, request schema, response semantics, and operational controls need independent review first.
- The dormant code returns a provider electricity token in the function response when a provider success is detected. Before any future use, token access, account ownership, response exposure, logging, and customer privacy need a separate security review.
- The function reserves an idempotency key before a supplier call and intentionally holds uncertain timeouts in a processing state. This is safer than blind retries, but a documented manual status-reconciliation process is still required.
- The function currently uses `verify_jwt=false` at the platform layer. Its custom Firebase token verification is security-critical and must be tested independently.
- No proof was obtained that the provider's Disco IDs match the IDs in the UI. Confirm them from official supplier documentation rather than assuming they are universal.

## 5. Official documentation required

The responsible adult/business owner must obtain and verify official supplier documentation for:
- Supported Discos and exact Disco identifiers
- Prepaid and postpaid support and meter validation
- Sandbox and production endpoints
- Authentication and credential rotation
- Purchase request schema and provider reference/idempotency behavior
- Provider response fields, token format, and final status definitions
- Status inquiry and signed callback/webhook behavior
- Timeout, retry, duplicate prevention, reversal/refund, and reconciliation rules
- Provider charges, commissions, fees, limits, and support escalation

Never place supplier credentials, Supabase service-role keys, or Firebase Admin credentials in browser code, GitHub files, chat messages, screenshots, or logs. Privileged credential provisioning and any real-money activation must be handled by the responsible adult/business owner.

## 6. Next safe engineering steps

1. Obtain official provider documentation without sharing credentials.
2. Design a mock-only adapter and test fixtures from verified documentation.
3. Add offline tests for Disco mapping, input validation, idempotency, and status parsing.
4. Independently review token handling, access control, audit logging, timeout reconciliation, and refund procedures before considering live use.

## 7. Scope boundary

This document does not enable supplier dispatch, electricity payments, wallet debit/credit, withdrawals, or token issuance. Existing review-only customer behavior and the deployed safety lock remain unchanged.
