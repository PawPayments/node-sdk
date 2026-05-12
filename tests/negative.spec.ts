import { describe, expect, it } from "vitest";

import { PawPayments } from "../src/client.js";
import { PawPaymentsApiError } from "../src/errors.js";

const apiKey = process.env.PAW_API_KEY;
const baseUrl = process.env.PAW_BASE ?? "https://api.pawpayments.com";

const skip = !apiKey;

async function expectApiError(
  fn: () => Promise<unknown>,
  predicate: (err: PawPaymentsApiError) => boolean,
  hint: string,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    expect(err, hint).toBeInstanceOf(PawPaymentsApiError);
    expect(predicate(err as PawPaymentsApiError), `${hint} — ${JSON.stringify(err, null, 2)}`).toBe(true);
    return;
  }
  throw new Error(`Expected API error: ${hint}`);
}

describe.skipIf(skip)("Native V2 live negative cases", () => {
  it("rejects missing api key with 401/403", async () => {
    const client = new PawPayments({ apiKey: "definitely-not-valid", baseUrl });
    await expectApiError(
      () => client.balance.get(),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "bad api key → 4xx",
    );
  });

  it("rejects invoices.create with no body", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () => client.invoices.create({} as never),
      (e) => e.httpStatus === 422 || (e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500),
      "invoices.create empty → 4xx",
    );
  });

  it("rejects invoices.create with unknown asset", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () =>
        client.invoices.create({
          amount: 5,
          fiat_currency: "USD",
          billing_type: "STATIC",
          asset: "doge_doge",
        }),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "invoices.create unknown asset → 4xx",
    );
  });

  it("rejects invoices.create with negative amount", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () =>
        client.invoices.create({
          amount: -1,
          fiat_currency: "USD",
          billing_type: "STATIC",
          asset: "usdt_tron",
        }),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "invoices.create negative amount → 4xx",
    );
  });

  it("returns 4xx when fetching a non-existent invoice", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () => client.invoices.get("ffffffffffffffffffffffff"),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "invoices.get unknown → 4xx",
    );
  });

  it("rejects payout from a non-whitelisted IP or with insufficient balance (403/4xx)", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () =>
        client.payouts.create({
          address: "TTestAddress1234567890",
          amount: 10,
          fiat_currency: "USD",
          asset: "usdt_tron",
        }),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "payout → 4xx (IP/balance)",
    );
  });

  it("returns 4xx for an unknown payout id", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () => client.payouts.get("ffffffffffffffffffffffff"),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "payouts.get unknown → 4xx",
    );
  });

  it("rejects permanent.create with bad family", async () => {
    const client = new PawPayments({ apiKey: apiKey!, baseUrl });
    await expectApiError(
      () =>
        client.permanent.create({
          user_id: "live-test-user",
          family: "not_a_family" as never,
        }),
      (e) => e.httpStatus !== null && e.httpStatus >= 400 && e.httpStatus < 500,
      "permanent.create bad family → 4xx",
    );
  });
});
