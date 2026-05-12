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

  it("rejects an empty signature", () => {
    expect(Webhook.verifyRawBody("{}", "", apiKey)).toBe(false);
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
});
