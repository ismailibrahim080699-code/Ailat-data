import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dataPage = readFileSync(new URL("../data.html", import.meta.url), "utf8");
const summaryPage = readFileSync(new URL("../order_summary.html", import.meta.url), "utf8");

test("Buy Data loads the server catalogue rather than trusting a local price list", () => {
  assert.match(dataPage, /ailat-order-requests\?action=plans/);
  assert.match(dataPage, /Array\.isArray\(result\.plans\)/);
  assert.match(dataPage, /formatPrice\(item\.amount\)/);
});

test("Buy Data passes the order draft through session storage, not URL parameters", () => {
  assert.match(dataPage, /sessionStorage\.setItem\("ailat_data_order_draft"/);
  assert.match(dataPage, /window\.location\.href="order_summary\.html"/);
  assert.doesNotMatch(dataPage, /[?&](?:phone|plan_id|network)=/i);
});

test("Buy Data validates the Nigerian phone number and selected catalogue plan", () => {
  assert.match(dataPage, /\^0\[789\]\[01\]\\d\{8\}\$/);
  assert.match(dataPage, /if\(!selected\)/);
});

test("Order summary re-loads the catalogue and validates the draft before submission", () => {
  assert.match(summaryPage, /sessionStorage\.getItem\("ailat_data_order_draft"\)/);
  assert.match(summaryPage, /selectedPlan = DATA_PLANS\.find/);
  assert.match(summaryPage, /suppliedNetworkId!==expectedNetworkId/);
  assert.match(summaryPage, /normalizedType\(selectedPlan\.type\)!==purchaseType/);
});

test("Order request requires verified email and uses a stable idempotency key", () => {
  assert.match(summaryPage, /!user\.emailVerified/);
  assert.match(summaryPage, /crypto\.randomUUID\(\)/);
  assert.match(summaryPage, /idempotency_key:requestKey/);
  assert.match(summaryPage, /service_key:"data"/);
});

test("Client does not submit a price or supplier credential with the order draft", () => {
  const requestBody = summaryPage.match(/body:JSON\.stringify\(\{service_key:"data"[\s\S]*?\}\)\}/);
  assert.ok(requestBody, "Buy Data request body must be present");
  assert.doesNotMatch(requestBody[0], /(?:amount|price|api[_-]?key|supplier[_-]?token)\s*:/i);
});
