import { createHmac, timingSafeEqual } from "node:crypto";

type RawBody = string | Buffer | Uint8Array;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function hmac(message: RawBody, apiKey: string): string {
  return createHmac("sha256", apiKey).update(message).digest("hex");
}

export const Webhook = {
  verifyRawBody(rawBody: RawBody, headerSignature: string, apiKey: string): boolean {
    if (!headerSignature) return false;
    return safeEqual(hmac(rawBody, apiKey), headerSignature);
  },

  parsePayload(rawBody: RawBody): Record<string, unknown> {
    const text = typeof rawBody === "string" ? rawBody : Buffer.from(rawBody).toString("utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid webhook payload: not valid JSON");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid webhook payload: not valid JSON");
    }
    return parsed as Record<string, unknown>;
  },
};
