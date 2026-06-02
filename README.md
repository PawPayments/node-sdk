# PawPayments — Node.js SDK

Official Node.js SDK for the [PawPayments](https://pawpayments.com) Native V2 API.
Lightweight, TypeScript-first, no runtime dependencies (uses built-in `fetch`).

## Install

```bash
npm install @pawpayments/sdk
# or
pnpm add @pawpayments/sdk
# or
yarn add @pawpayments/sdk
```

Requires Node.js **18+**.

## Quickstart

```ts
import { PawPayments } from "@pawpayments/sdk";

const paw = new PawPayments({ apiKey: process.env.PAW_API_KEY! });

const invoice = await paw.invoices.create({
  amount: 25,
  fiat_currency: "USD",
  billing_type: "STATIC",
  asset: "usdt_tron",
  description: "Pro plan, 1 month",
  notify_url: "https://example.com/paw/webhook",
});

console.log(invoice.payment_url);
```

Supported `fiat_currency` values: USD, EUR, GBP, CAD, AUD, CHF, JPY, NZD, SGD,
HKD, NGN, KRW, ILS, RON, ARS, INR, IDR, MXN, MYR, TRY, PLN, BRL, THB. Payouts
additionally accept `"native"` to send a raw crypto amount.

## Resources

| Group | Methods |
|-------|---------|
| `paw.assets` | `list()` |
| `paw.rates` | `get({ base, assets })` |
| `paw.balance` | `get()` |
| `paw.invoices` | `create()`, `get(id)`, `list()`, `notify(id)` |
| `paw.payouts` | `create(params, { uniqId })`, `get(id)`, `list()`, `batch(items, { uniqId })` |
| `paw.ledger` | `list({ type, ... })` |
| `paw.notifications` | `list()`, `test(url?)` |
| `paw.permanent` | `create()`, `get(id)`, `list()`, `deactivate(id)` |

`paw.payouts.create` and `paw.payouts.batch` accept an optional `uniqId` (UUIDv4)
for explicit idempotency control. If omitted, the SDK generates one with
`crypto.randomUUID()`. The same `uniqId` re-used within 2 hours yields a 409.
Payout requests use `address`. Invoice responses expose `address_to` and may
include `address_from`.

Each payout (and each batch item) accepts an optional `fee_bearer` of
`"merchant"` or `"client"` to choose who covers the network fee — defaults to
`"merchant"`:

```ts
await paw.payouts.create({
  address: "T…",
  amount: 50,
  fiat_currency: "USD",
  asset: "usdt_tron",
  fee_bearer: "client",
});
```

## Webhook verification

Verify the `X-Paw-Signature` header against the raw request body:

```ts
import { Webhook } from "@pawpayments/sdk";
import express from "express";

const app = express();
app.post("/paw/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sigHeader = req.header("X-Paw-Signature") ?? "";
  if (!Webhook.verifyRawBody(req.body, sigHeader, process.env.PAW_API_KEY!)) {
    return res.status(401).end();
  }
  const payload = Webhook.parsePayload(req.body);
  // …handle invoice updates
  res.status(200).end();
});
```

## Errors

Every API failure (HTTP 4xx/5xx, network, or invalid JSON) throws a
`PawPaymentsApiError` carrying `code`, `httpStatus`, optional `details`:

```ts
import { PawPaymentsApiError } from "@pawpayments/sdk";

try {
  await paw.invoices.create({ /* ... */ });
} catch (err) {
  if (err instanceof PawPaymentsApiError) {
    console.error(err.code, err.httpStatus, err.message, err.details);
  }
}
```

## Testing

- `pnpm test` — webhook unit tests (no network).
- `PAW_API_KEY=… pnpm test:live` — live happy-path + negative cases against `https://api.pawpayments.com`. Tests skip silently if `PAW_API_KEY` is not set.
- `pnpm typecheck` — TypeScript strict check.
- `pnpm build` — emits `dist/index.{js,mjs,d.ts}`.

## License

MIT
