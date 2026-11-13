# AILAT DATA — Data Catalogue Audit
Date: 2026-11-13
Scope: Read-only inspection of `public.data_plan_catalog` and Edge Function `ailat-order-requests` v21.
Safety: No supplier requests, purchases, wallet debits, or production data mutations were performed.

## Catalogue counts

| Network | Total | Active | Verified |
|---|---:|---:|---:|
| MTN | 46 | 46 | 0 |
| Airtel | 39 | 38 | 0 |
| Glo | 34 | 34 | 10 |
| 9mobile | 11 | 11 | 0 |
| Vitel | 40 | 40 | 0 |
| **Total** | **170** | **169** | **10** |

## Verified plans

Only Glo SME catalogue IDs 220–229 are currently marked verified. Their provider network ID is 3 and provider plan IDs match the catalogue IDs.

## Items requiring supplier-side confirmation

- Glo plan 230: database supplier amount is ₦3,560 while the supplied provider catalogue documentation listed ₦3,480. Do not mark verified until reconciled.
- Airtel plans 231–260: currently unmapped. Several database supplier amounts differ from the supplied documentation; examples include plan 231 (DB ₦3,000 vs docs ₦2,850), plan 232 (₦780 vs ₦760), and plan 233 (₦290 vs ₦285).
- MTN plans 262 and 265–273: currently unmapped even where some amounts appear consistent with the supplied documentation. Amount similarity alone is not proof of plan-ID correctness.
- 9mobile: 11 active plans remain unmapped.
- Vitel: 40 active plans have a supplier plan ID but no supplier network ID; the current order function intentionally cannot accept these as provider-ready.

## Duplicate-looking active catalogue entries

These share network, purchase type, bundle name, and validity. They require review; do not delete or merge automatically.

| Network | Bundle | Validity | Catalogue IDs |
|---|---|---|---|
| Airtel | 1.5GB | 1 day | 240, 241 |
| Airtel | 1.5GB | 7 days | 238, 239 |
| Airtel | 10GB | 30 days | 231, 252 |
| MTN | 25GB | 30 days | 285, 286 |

## Order function review

Edge Function `ailat-order-requests` v21:
- Validates Firebase JWT and verified email for authenticated order-request operations.
- Resolves plan and price from the server-side catalogue, not client-supplied prices.
- Rejects plans without verified provider mapping.
- Checks provider network IDs against expected network IDs; Vitel is explicitly blocked.
- Uses an idempotency key and returns the existing request on a duplicate-key collision.
- Builds a provider-format request preview only. Provider dispatch remains disabled (`disabled_safe_mode`); no live supplier call or wallet debit occurs.

## Pricing smoke-test calculations

The ₦50/GB rule produces the following arithmetic:
- 500MB: ₦25 margin
- 1GB: ₦50 margin
- 2GB: ₦100 margin
- 2.5GB: ₦125 margin

These are calculation checks only, not purchase tests.

## Next safe steps

1. Reconcile every supplier plan ID and supplier amount against the current official provider catalogue.
2. Review duplicate-looking plans with the provider catalogue before changing records.
3. Verify Vitel's provider network ID from official documentation.
4. Continue frontend tests with mocked responses only.

Live dispatch, payment collection, wallet debits, and fulfilment are intentionally outside this audit.


## Follow-up source-catalogue join audit (read-only)

A second read-only comparison joined active app catalogue rows to `public.legitdataway_data_plan_catalog` by supplier plan ID, then compared provider network IDs and source price fields.

| Network | Active plans | Exactly one source row marked verified | Network ID agrees | Source amount missing | App rows already marked verified |
|---|---:|---:|---:|---:|---:|
| 9mobile | 11 | 11 | 11 | 11 | 0 |
| Airtel | 38 | 38 | 38 | 38 | 0 |
| Glo | 34 | 34 | 34 | 24 | 10 |
| MTN | 46 | 46 | 46 | 46 | 0 |
| Vitel | 40 | 40 | 0 | 40 | 0 |

Additional observations:
- Each active app plan found exactly one source-catalogue row with the same supplier plan ID; no duplicate source-ID matches were found in this join.
- For 9mobile, Airtel, Glo, and MTN, the supplier network ID stored in the app row agrees with the matched source row.
- Vitel's source rows have no provider network ID, and the app catalogue rows also lack one. Vitel remains unmapped.
- The source catalogue's `amount` field is NULL for every matched row in this audit. Therefore the source table cannot currently confirm supplier prices, even when `source_verified=true`.
- A matching numeric plan ID and matching network ID are useful consistency signals, but they do not independently prove the current provider price or the plan's live availability.

Conclusion: do not bulk-change mapping statuses or activate additional plans based on ID matches alone. The missing source amount field must be corrected from an authoritative supplier catalogue export/API response before the plan-price comparison can be considered complete. Existing Glo verified status should also be reviewed against the current authoritative source data before any live use.
