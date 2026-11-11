// AILAT DATA — Airtime provider adapter scaffold
// STATUS: NOT DEPLOYED / NOT LIVE.
// This file intentionally does not call LegitDataWay, charge a wallet,
// create a transaction, or claim that airtime has been delivered.
// Complete vendor-specific settings and adult operational review before
// any live payment or fulfilment workflow is considered.

import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const FIREBASE_PROJECT_ID = "ailat-data";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const NETWORK_IDS: Record<string, number | null> = {
  mtn: 1,
  airtel: 2,
  glo: 3,
  "9mobile": 4,
  vitel: null, // Vendor has not supplied this ID. Do not guess.
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://ismailibrahim080699-code.github.io",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return json({ error: "Login required" }, 401);
  }

  try {
    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub) return json({ error: "Invalid account" }, 401);

    const body = await req.json();
    const network = String(body.network ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const amount = Number(body.amount);

    if (!(network in NETWORK_IDS)) {
      return json({ error: "Unsupported network" }, 400);
    }
    if (NETWORK_IDS[network] === null) {
      return json({
        error: "Network setup pending",
        code: "NETWORK_ID_NOT_CONFIRMED",
        network,
      }, 409);
    }
    if (!/^0[789][01][0-9]{8}$/.test(phone)) {
      return json({ error: "Invalid Nigerian phone number format" }, 400);
    }
    if (!Number.isInteger(amount) || amount < 50 || amount > 100000) {
      return json({ error: "Invalid airtime amount" }, 400);
    }

    // Intentionally disabled: no provider request is sent.
    // Pending vendor confirmations:
    // 1) accepted phone format (local 0... or international 234...)
    // 2) meaning of response field "discount" and authoritative sell price
    // 3) pending/failure response formats and status-check endpoint
    // 4) VITEL network ID
    // 5) adult-supervised payment, wallet ledger, refund and reconciliation design
    return json({
      ok: false,
      status: "not_live",
      message: "Airtime integration scaffold is prepared; provider fulfilment is disabled pending vendor confirmations and operational review.",
      network,
      network_id: NETWORK_IDS[network],
      phone,
      amount,
      provider_call_made: false,
      wallet_charged: false,
      airtime_delivered: false,
    }, 202);
  } catch {
    return json({ error: "Invalid login token" }, 401);
  }
});
