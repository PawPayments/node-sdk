import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { Webhook } from "../src/webhook.js";

const apiKey = "test_api_key_abc123";

function hmacHex(message: string): string {
  return createHmac("sha256", apiKey).update(message).digest("hex");
}

describe("Webhook.verifyRawBody", () => {
  it("accepts a valid signature", () => {
    const body = '{"order_id":"abc","status":"success"}';
    expect(Webhook.verifyRawBody(body, hmacHex(body), apiKey)).toBe(true);
  });

  it("rejects a wrong signature", () => {
    const body = '{"order_id":"abc","status":"success"}';
    expect(Webhook.verifyRawBody(body, "deadbeef", apiKey)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const body = '{"order_id":"abc","status":"success"}';
    const sig = hmacHex(body);
    const tampered = '{"order_id":"abc","status":"cancelled"}';
    expect(Webhook.verifyRawBody(tampered, sig, apiKey)).toBe(false);
  });

  it("works with Buffer input", () => {
    const body = '{"order_id":"abc"}';
    expect(Webhook.verifyRawBody(Buffer.from(body), hmacHex(body), apiKey)).toBe(true);
  });

  it("works with Uint8Array input", () => {
    const body = '{"order_id":"abc"}';
    expect(Webhook.verifyRawBody(new TextEncoder().encode(body), hmacHex(body), apiKey)).toBe(true);
  });

  it("rejects an empty signature", () => {
    expect(Webhook.verifyRawBody("{}", "", apiKey)).toBe(false);
  });

  it("rejects an empty api key", () => {
    const body = '{"order_id":"abc"}';
    const sig = createHmac("sha256", "").update(body).digest("hex");
    expect(Webhook.verifyRawBody(body, sig, "")).toBe(false);
  });

  it("accepts an uppercase hex signature", () => {
    const body = '{"order_id":"abc"}';
    expect(Webhook.verifyRawBody(body, hmacHex(body).toUpperCase(), apiKey)).toBe(true);
  });

  it("rejects a header that is not exactly 64 hex characters", () => {
    const body = '{"order_id":"abc"}';
    const sig = hmacHex(body);
    expect(Webhook.verifyRawBody(body, sig.slice(0, 63), apiKey)).toBe(false);
    expect(Webhook.verifyRawBody(body, `${sig}0`, apiKey)).toBe(false);
    expect(Webhook.verifyRawBody(body, `${sig}\n`, apiKey)).toBe(false);
    expect(Webhook.verifyRawBody(body, "g".repeat(64), apiKey)).toBe(false);
  });
});

describe("Webhook.parsePayload", () => {
  it("returns a parsed object", () => {
    const body = '{"order_id":"abc","status":"success","amount":100.5}';
    const payload = Webhook.parsePayload(body);
    expect(payload.order_id).toBe("abc");
    expect(payload.amount).toBe(100.5);
  });

  it("rejects invalid JSON", () => {
    expect(() => Webhook.parsePayload("not json")).toThrow(/not valid JSON/);
  });

  it("rejects non-object JSON", () => {
    expect(() => Webhook.parsePayload("[1,2,3]")).toThrow(/not valid JSON/);
  });

  it("accepts Buffer input", () => {
    const payload = Webhook.parsePayload(Buffer.from('{"a":1}'));
    expect(payload.a).toBe(1);
  });

  it("accepts Uint8Array input", () => {
    const payload = Webhook.parsePayload(new TextEncoder().encode('{"a":1}'));
    expect(payload.a).toBe(1);
  });
});

describe("Webhook.coversAmount", () => {
  it("accepts an invoice issued for the total", () => {
    const payload = { initial_fiat_amount: 100, fiat_amount: 100, fiat_currency: "USD" };
    expect(Webhook.coversAmount(payload, "USD", 100)).toBe(true);
    expect(Webhook.coversAmount(payload, "usd", "100.00")).toBe(true);
    expect(Webhook.coversAmount({ ...payload, fiat_currency: "usd" }, "USD", 100)).toBe(true);
  });

  it("trusts the gateway's own underpay tolerance", () => {
    // A merchant may accept 20% short; the gateway then sends `success` with 80.
    const payload = { initial_fiat_amount: "100", fiat_amount: "80", fiat_currency: "EUR" };
    expect(Webhook.coversAmount(payload, "EUR", 100)).toBe(true);
  });

  it("refuses a webhook for a cheaper invoice", () => {
    const payload = { initial_fiat_amount: 1, fiat_amount: 1, fiat_currency: "USD" };
    expect(Webhook.coversAmount(payload, "USD", 500)).toBe(false);
  });

  it("allows only a cent of rounding", () => {
    expect(Webhook.coversAmount({ initial_fiat_amount: 99.99, fiat_currency: "USD" }, "USD", 100)).toBe(true);
    expect(Webhook.coversAmount({ initial_fiat_amount: 99.98, fiat_currency: "USD" }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: 120, fiat_currency: "USD" }, "USD", 100)).toBe(true);
  });

  it("counts the cent exactly for every amount up to 1000.00", () => {
    // 2.02 - 0.01 is a hair above 2.01 in binary floating point.
    expect(Webhook.coversAmount({ initial_fiat_amount: 2.01, fiat_currency: "USD" }, "USD", 2.02)).toBe(true);
    const wrong: number[] = [];
    for (let cents = 2; cents <= 100000; cents++) {
      const total = cents / 100;
      const oneShort = { initial_fiat_amount: (cents - 1) / 100, fiat_currency: "USD" };
      const twoShort = { initial_fiat_amount: (cents - 2) / 100, fiat_currency: "USD" };
      if (!Webhook.coversAmount(oneShort, "USD", total) || Webhook.coversAmount(twoShort, "USD", total)) {
        wrong.push(total);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("refuses another or a missing currency", () => {
    expect(Webhook.coversAmount({ initial_fiat_amount: 100000, fiat_currency: "IDR" }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: 100 }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: 100, fiat_currency: "USD" }, "", 100)).toBe(false);
    // Unknown on both sides is not a match.
    expect(Webhook.coversAmount({ initial_fiat_amount: 100 }, "", 100)).toBe(false);
  });

  it("refuses a payload without the issued amount", () => {
    expect(Webhook.coversAmount({ fiat_amount: 100, fiat_currency: "USD" }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: "x", fiat_currency: "USD" }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: null, fiat_currency: "USD" }, "USD", 100)).toBe(false);
    expect(Webhook.coversAmount({ initial_fiat_amount: "", fiat_currency: "USD" }, "USD", 100)).toBe(false);
  });

  it("refuses a total that is not a number", () => {
    const payload = { initial_fiat_amount: 100, fiat_currency: "USD" };
    expect(Webhook.coversAmount(payload, "USD", "")).toBe(false);
    expect(Webhook.coversAmount(payload, "USD", "abc")).toBe(false);
    expect(Webhook.coversAmount(payload, "USD", Number.NaN)).toBe(false);
  });
});
