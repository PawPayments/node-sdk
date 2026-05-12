import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function hmac(message: string | Buffer, apiKey: string): string {
  return createHmac("sha256", apiKey).update(message).digest("hex");
}

export const Webhook = {
  verifyRawBody(rawBody: string | Buffer, headerSignature: string, apiKey: string): boolean {
    if (!headerSignature) return false;
    return safeEqual(hmac(rawBody, apiKey), headerSignature);
  },

  parsePayload(rawBody: string | Buffer): Record<string, unknown> {
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
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
