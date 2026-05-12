import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PawPayments } from "../src/client.js";

const apiKey = process.env.PAW_API_KEY;
const baseUrl = process.env.PAW_BASE ?? "https://api.pawpayments.com";

const skip = !apiKey;

describe.skipIf(skip)("Native V2 live happy-path", () => {
  let client: PawPayments;
  let createdInvoiceId: string | null = null;

  beforeAll(() => {
    client = new PawPayments({ apiKey: apiKey!, baseUrl });
  });

  afterAll(() => {
    if (skip) console.warn("\nLive tests skipped: set PAW_API_KEY to enable.\n");
  });

  it("GET /api/v2/assets returns enabled assets", async () => {
    const assets = await client.assets.list();
    expect(Array.isArray(assets)).toBe(true);
    expect(assets.length).toBeGreaterThan(0);
    const enabled = assets.filter((a) => a.enabled !== false);
    expect(enabled.length).toBeGreaterThan(0);
  });

  it("GET /api/v2/rates returns USD rates map", async () => {
    const rates = await client.rates.get({ base: "USD" });
    expect(rates.base).toBe("USD");
    expect(typeof rates.rates).toBe("object");
    expect(Object.keys(rates.rates).length).toBeGreaterThan(0);
  });

  it("GET /api/v2/balance returns merchant balance", async () => {
    const balance = await client.balance.get();
    expect(balance).toBeTruthy();
    expect(typeof balance.available).toBe("number");
    expect(typeof balance.total_income).toBe("number");
    expect(typeof balance.total_payouts).toBe("number");
  });

  it("POST /api/v2/invoices creates an invoice", async () => {
    const invoice = await client.invoices.create({
      amount: 25,
      fiat_currency: "USD",
      billing_type: "STATIC",
      asset: "usdt_tron",
      description: "Node SDK live test",
      ttl: 1800,
    });
    expect(invoice.order_id).toBeTruthy();
    expect(invoice.status).toBeTruthy();
    expect(invoice.fiat_currency).toBe("USD");
    createdInvoiceId = String(invoice.order_id);
  });

  it("GET /api/v2/invoices/{id} returns the invoice we just created", async () => {
    expect(createdInvoiceId).toBeTruthy();
    const invoice = await client.invoices.get(createdInvoiceId!);
    expect(invoice.order_id).toBe(createdInvoiceId);
  });

  it("GET /api/v2/invoices paginates", async () => {
    const page = await client.invoices.list({ page: 1, per_page: 5 });
    expect(page.pagination.page).toBe(1);
    expect(page.pagination.per_page).toBe(5);
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("GET /api/v2/payouts paginates (read-only, IP-independent)", async () => {
    const page = await client.payouts.list({ page: 1, per_page: 5 });
    expect(page.pagination.page).toBe(1);
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("GET /api/v2/ledger merges entries", async () => {
    const page = await client.ledger.list({ page: 1, per_page: 5 });
    expect(page.pagination.page).toBe(1);
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("GET /api/v2/notifications lists deliveries", async () => {
    const page = await client.notifications.list({ page: 1, per_page: 5 });
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("POST /api/v2/notifications/test fires a probe", async () => {
    const probe = await client.notifications.test("https://httpbin.org/status/200");
    expect(probe.url).toBe("https://httpbin.org/status/200");
    expect(typeof probe.delivered).toBe("boolean");
  });

  it("GET /api/v2/permanent paginates", async () => {
    const page = await client.permanent.list({ page: 1, per_page: 5 });
    expect(page.pagination.page).toBe(1);
    expect(Array.isArray(page.items)).toBe(true);
  });
});
