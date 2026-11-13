import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = readFileSync(new URL("../data.html", import.meta.url), "utf8");
const summary = readFileSync(new URL("../order_summary.html", import.meta.url), "utf8");
test("server catalogue supplies Buy Data plans and prices", () => {
  assert.ok(data.includes("ailat-order-requests? action=plans") || data.includes("ailat-order-requests?action=plans"));
  assert.ok(data.includes("result.plans"));
  assert.ok(data.includes("item.amount"));
});
test("order handoff uses session storage rather than URL query parameters", () => {
  assert.ok(data.includes('sessionStorage.setItem("ailat_data_order_draft"'));
  assert.ok(data.includes('window.location.href="order_summary.html"'));
  assert.ok(!/[?&](?:phone|plan_id|network)=/i.test(data));
});
test("Buy Data validates the Nigerian phone and selected plan", () => {
  assert.ok(data.includes("/^0[789][01]\\d{8}$/"));
  assert.ok(data.includes("if(!selected)"));
});
test("summary re-loads catalogue and validates draft identifiers", () => {
  assert.ok(summary.includes('sessionStorage.getItem("ailat_data_order_draft")'));
  assert.ok(summary.includes("selectedPlan = DATA_PLANS.find"));
  assert.ok(summary.includes("suppliedNetworkId!==expectedNetworkId"));
});
test("submission requires verified email and stable idempotency key", () => {
  assert.ok(summary.includes("!user.emailVerified"));
  assert.ok(summary.includes("crypto.randomUUID()"));
  assert.ok(summary.includes("idempotency_key:requestKey"));
});
test("client request does not send price or supplier credentials", () => {
  const start = summary.indexOf("body:JSON.stringify(");
  const end = summary.indexOf("\n  });", start);
  assert.ok(start >= 0 && end > start);
  const body = summary.slice(start, end);
  assert.ok(body.includes("catalog_plan_id:selectedPlan.id"));
  assert.ok(!/(?:amount|price|api[_-]?key|supplier[_-]?token)\\s*:/i.test(body));
});
