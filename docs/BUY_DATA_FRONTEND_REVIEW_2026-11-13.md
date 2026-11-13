# Buy Data Frontend Review
Date: 2026-11-13
Files reviewed: `data.html`, `order_summary.html`
Backend reviewed: `ailat-order-requests` v21
Scope: Static code review only. No browser purchase, live supplier request, wallet debit, or production mutation was performed.

## Confirmed good controls

- Buy Data loads plans from the backend `?action=plans` endpoint rather than maintaining a separate hard-coded bundle list.
- Both pages use the server-returned plan ID and network/type values to validate the selection.
- The summary page reloads the signed-in Firebase user, requires verified email, and sends a fresh Firebase ID token.
- The backend independently reloads the selected catalogue plan and calculates the selling price; it does not trust a client-supplied amount.
- The UI clearly states that the current flow records a request only; it does not take payment or deliver data.
- The backend blocks plans whose supplier mapping is not verified.

## Issue to address before any wider rollout

### Idempotency key is regenerated on every page load

In `order_summary.html`, `requestKey` is initialized with `crypto.randomUUID()` in page memory. This prevents duplicate clicks within the same loaded page when the first request succeeds, and the database unique constraint can catch retries using the same key. However, refreshing or reopening the summary page creates a new key. If the first request was saved but the browser did not receive its response, a user retry after refresh could create a second request record.

Recommended safe frontend improvement: persist a request key for the current order draft in session storage, keyed by a deterministic fingerprint of the non-secret order details (network, purchase type, phone, catalogue plan ID). Reuse it after refresh until a successful response; then clear that draft key. Do not put authentication tokens or API secrets in storage.

## Additional observations

- The frontend's supplier network ID map is currently unused in the summary page; the backend remains authoritative for provider mapping.
- Vitel appears in the network selector but currently has no verified supplier plans, so it should display an empty/unavailable state rather than imply fulfilment readiness.
- The UI's wording "Submit Order Request" is accurate for the current safe-mode behavior. Avoid changing it to "Buy Now" or "Successful Purchase" while no fulfilment/payment is active.
- The current catalogue endpoint filters to verified plans, so the visible plan list is intentionally limited.

## Safe validation checklist

- [x] Static source inspection of Buy Data page.
- [x] Static source inspection of order summary page.
- [x] Static source inspection of backend validation and idempotency handling.
- [ ] Browser test on mobile with mocked backend responses.
- [ ] Refresh/retry idempotency test with a mocked backend.
- [ ] Supplier catalogue reconciliation for remaining unmapped plans.

No code was changed in this review. The idempotency persistence improvement should be implemented and tested with mock responses before being considered complete.
