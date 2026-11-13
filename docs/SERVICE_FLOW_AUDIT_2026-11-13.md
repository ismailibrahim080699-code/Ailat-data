# AILAT DATA — Service Flow Audit
Date: 2026-11-13
Scope: Static source review of dashboard routes, service forms, summary pages, and the aila​t-order-requests Edge Function. No live purchase, payment, wallet debit, supplier dispatch, or real transaction was attempted.

## Dashboard route verification
The following referenced files were confirmed present in the GitHub default branch:
- Core: `data.html`, `airtime.html`, `airtime_to_cash.html`, `electricity.html`, `tv.html`, `exam_result.html`, `referral.html`, `transaction_history.html`.
- Additional/pre-API: `bulk_sms.html`, `data_card_printing.html`, `recharge_card_printing.html`, `smile.html`, `alpha.html`, `kirani.html`, `gift_card.html`, `dollar_card.html`, `bonus_transfer.html`.
- Account/wallet/assets: `settings.html`, `profile.html`, `withdrawal.html`, `fund_wallet.html`, `login.html`, `firebase.js`, `assets/ailat-mark.svg`.

## Core service flow findings
### Buy Data
- `data.html` loads active plans through `ailat-order-requests?action=plans`.
- The Edge Function exposes only plans with `supplier_mapping_status = verified` and non-null supplier plan/network IDs.
- The UI passes selected plan details to `order_summary.html`.
- `order_summary.html` authenticates the user and POSTs a request record to `ailat-order-requests`.
- This is a request-recording flow, not proof of supplier delivery or payment.
- The frontend reuses a tab-session idempotency key for the same order fingerprint. Refresh/retry protection exists, but a deliberate repeat order with identical details in the same tab needs a clear new-order lifecycle before this is final.

### Buy Airtime
- `airtime.html` validates network, Nigerian phone number, and amount, then opens `airtime_order_summary.html`.
- `airtime_order_summary.html` authenticates and records an airtime request through `ailat-order-requests`.
- The UI explicitly states no payment was taken and no airtime was sent. This is not live fulfilment.

### Airtime to Cash
- `airtime_to_cash.html` validates details and opens `airtime_to_cash_summary.html`.
- The summary validates/displays details, but the reviewed script has no backend request call or submission workflow.
- The page indicates coming soon. Do not treat it as operational.

### Electricity
- `electricity.html` validates disco, meter type, meter number, and amount, then opens `electricity_order_summary.html`.
- The summary validates/displays details; the reviewed script has no backend submission call.
- This is review-only, not an electricity token purchase.

### Cable TV
- `tv.html` validates provider, smartcard/IUC number, and package, then opens `tv_order_summary.html`.
- The summary validates/displays details; no provider API or order-recording call was found in the reviewed script.

### Exam
- `exam_result.html` validates exam body and requested service, then opens `exam_order_summary.html`.
- The summary validates/displays details; no provider API or order-recording call was found in the reviewed script.

## Wallet safety
- `fund_wallet.html` states funding is unavailable and does not request payment.
- `withdrawal.html` states withdrawals are not enabled and does not collect payout details.
- No wallet payment/debit/withdrawal workflow was activated or tested.

## Limitations
- Static source review only; not a real Android browser QA run.
- No purchase POST, supplier API request, Paystack transaction, wallet debit, or live customer fulfilment was performed.
- A page or request record does not mean a service is live.

## Recommended safe next work
1. Complete non-live integration contracts and sandbox/mock tests for services currently limited to review screens.
2. Verify supplier catalogue mappings before any authorized adult operator considers live activation.
3. Design a safe idempotency lifecycle for intentional repeat orders.
4. Keep wallet funding and withdrawal disabled until an authorized adult business operator completes payment-provider approval, reconciliation, and security review.
