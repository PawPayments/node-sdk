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

// Hex-encoded HMAC-SHA256 digest, exactly as the gateway sends it.
const SIGNATURE_RE = /^[0-9a-f]{64}$/i;

// A finite number from a JSON number or a numeric string, else null.
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export const Webhook = {
  verifyRawBody(rawBody: RawBody, headerSignature: string, apiKey: string): boolean {
    // An empty key makes the HMAC computable by anyone.
    if (!apiKey || typeof headerSignature !== "string" || !SIGNATURE_RE.test(headerSignature)) {
      return false;
    }
    return safeEqual(hmac(rawBody, apiKey), headerSignature.toLowerCase());
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

  /**
   * Whether a paid (`success` / `paid_over`) webhook pays an amount you are
   * about to settle, e.g. an order total.
   *
   * The gateway has already judged the payment against its own invoice: it
   * sends `success` only when what arrived is within that invoice's underpay
   * tolerance — whichever one the merchant configured, which the webhook does
   * not carry — and `paid_over` when more arrived. What is left is to check
   * that the invoice is for this amount: it was issued (`initial_fiat_amount`)
   * for at least `total`, in `currency`, give or take a cent of rounding. So a
   * genuine webhook for a cheaper invoice — one made with a stolen API key and
   * an `extra` naming this order, say — never settles it.
   *
   * Every paid webhook the gateway sends carries `initial_fiat_amount`; a
   * payload without it is refused.
   */
  coversAmount(payload: Record<string, unknown>, currency: string, total: number | string): boolean {
    const paidCurrency = String(payload.fiat_currency ?? "").toUpperCase();
    if (!paidCurrency || paidCurrency !== String(currency ?? "").toUpperCase()) return false;

    const issued = toNumber(payload.initial_fiat_amount);
    const expected = toNumber(total);
    if (issued === null || expected === null) return false;

    // In whole cents: as binary floats, 2.02 - 0.01 lands just above 2.01.
    // One cent absorbs rounding of the fiat amounts on either side.
    return Math.round(issued * 100) >= Math.round(expected * 100) - 1;
  },
};
