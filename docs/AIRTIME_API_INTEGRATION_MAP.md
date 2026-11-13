# AILAT DATA — Airtime API Contract & Integration Readiness

Date: 2026-11-13
Status: Static review and documentation only. No supplier dispatch, payments, wallet operations, or database changes are enabled.

## 1. Current customer flow

1. `airtime.html` lets a customer choose a network, enter a Nigerian phone number, and select or type an airtime value.
2. The page validates the phone format and a whole-number amount from ₦50 to ₦100,000.
3. It passes `network`, `phone`, and `amount` to `airtime_order_summary.html` using query parameters.
4. The summary page validates those values again, requires a signed-in Firebase user with verified email, and sends an authenticated request to the existing `ailat-order-requests` Edge Function.
5. The Edge Function validates the request and records it only. No airtime provider is contacted and no wallet is charged.

## 2. Current POST contract

Endpoint:
- `POST /functions/v1/ailat-order-requests`

Required headers:
- `apikey: <Supabase publishable key>`
- `Authorization: Bearer <Firebase ID token>`
- `Content-Type: application/json`

Request body:
```json
{
  "service_key": "airtime",
  "idempotency_key": "UUID",
  "customer_data": {
    "network": "MTN",
    "phone": "08000000000",
    "amount": 100
  }
}
```

Illustrative values only. The client creates a fresh UUID request key when the summary page loads. The backend checks UUID format, network, Nigerian phone number, and amount range.

Current success response:
```json
{
  "success": true,
  "order_request": {
    "reference": "AIL-EXAMPLE",
    "service_key": "airtime",
    "requested_amount": 100,
    "currency": "NGN",
    "status": "received"
  },
  "notice": "Request record only. No payment was taken and no service was delivered.",
  "repeated_request": false
}
```

The response example is a shape illustration, not a real request reference.

## 3. Frontend/backend alignment

- Network labels in the UI match the backend allowlist: MTN, Airtel, Glo, 9mobile, Vitel.
- Phone validation is consistent: 11-digit Nigerian mobile format beginning with 070, 080, 081, 090, or 091 patterns represented by `/^0[789][01]\\d{8}$/`.
- Amount validation matches the backend: integer between ₦50 and ₦100,000 inclusive.
- The summary page sends the exact `service_key`, `idempotency_key`, and `customer_data` structure expected by the backend.
- Firebase ID token verification and verified-email enforcement are performed by the Edge Function.
- Duplicate idempotency keys for the same user are handled by returning the existing request record.

## 4. Important integration gaps

- There is no deployed airtime supplier adapter in the inspected Edge Function inventory.
- No official supplier API contract has been attached to this repository for airtime.
- Network identifiers, airtime discount/commission rules, provider status lifecycle, callbacks, and reversals must not be guessed.
- The current amount represents requested airtime value, not a verified customer charge or fee.
- The frontend currently includes Vitel in its network choices, while supplier support for Vitel remains unverified. Keep it request-only and do not label it provider-ready until official documentation confirms support and the exact mapping.

## 5. Official provider documentation required

Before a provider adapter can be designed, the responsible adult/business owner must obtain and verify official documentation covering:
- Sandbox and production base URLs
- Authentication and credential rotation
- Supported Nigerian networks and exact network IDs
- Airtime top-up request schema and minimum/maximum values
- Discount/commission and settlement rules
- Provider transaction references and idempotency behavior
- Status query, callback/webhook signing, and final-state definitions
- Timeout, retry, duplicate prevention, reversal/refund, and reconciliation behavior
- Rate limits and provider support escalation

Never place API credentials, Supabase service-role keys, or Firebase Admin credentials in frontend files, GitHub, chat messages, screenshots, or logs. Privileged credential provisioning and any real-money activation must be handled by the responsible adult/business owner.

## 6. Next safe engineering steps

1. Obtain official provider documentation without sharing credentials.
2. Map provider fields and statuses to a mock-only adapter contract.
3. Add offline tests for validation, network mapping, idempotency, and status parsing.
4. Obtain adult/business-owner and independent security review before any live payment or fulfilment is considered.

## 7. Scope boundary

This document does not enable supplier dispatch, payment collection, wallet debit/credit, withdrawals, or live airtime fulfilment. Existing request-only behavior remains unchanged.
