import { BaseResource } from "./_base.js";
import type {
  BatchPayoutItem,
  CreatePayoutParams,
  ListResult,
  PayoutListParams,
  RequestOptions,
} from "../types.js";

export interface Payout {
  order_id: string;
  status: string;
  address: string;
  amount: number | string;
  fiat_amount?: number | string;
  fiat_currency?: string;
  asset: string;
  ref?: string;
  tx_hash?: string;
  batch_id?: string | null;
  created_at?: number | string;
  [key: string]: unknown;
}

export interface PayoutCreated {
  order_id: string;
  [key: string]: unknown;
}

export interface BatchPayoutResult {
  batch_id: string;
  count: number;
  items: PayoutCreated[];
  [key: string]: unknown;
}

function uuid4(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class PayoutsResource extends BaseResource {
  create(params: CreatePayoutParams, options?: RequestOptions): Promise<PayoutCreated> {
    return this.client.request<PayoutCreated>(
      { method: "POST", path: "/api/v2/payouts", body: params },
      { ...options, uniqId: options?.uniqId ?? uuid4() },
    );
  }

  get(payoutId: string): Promise<Payout> {
    return this.client.request<Payout>({
      method: "GET",
      path: `/api/v2/payouts/${encodeURIComponent(payoutId)}`,
    });
  }

  list(params?: PayoutListParams): Promise<ListResult<Payout>> {
    return this.client.requestList<Payout>({
      method: "GET",
      path: "/api/v2/payouts",
      query: params as Record<string, unknown> | undefined,
    });
  }

  batch(items: BatchPayoutItem[], options?: RequestOptions): Promise<BatchPayoutResult> {
    return this.client.request<BatchPayoutResult>(
      { method: "POST", path: "/api/v2/payouts/batch", body: { items } },
      { ...options, uniqId: options?.uniqId ?? uuid4() },
    );
  }
}
