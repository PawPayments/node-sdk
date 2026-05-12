import { BaseResource } from "./_base.js";
import type { LedgerListParams, ListResult } from "../types.js";

export interface LedgerEntry {
  type: "income" | "payout" | "refund";
  amount: number | string;
  asset: string;
  fiat_amount?: number | string;
  fiat_currency?: string;
  reference_id?: string;
  created_at?: number | string;
  [key: string]: unknown;
}

export class LedgerResource extends BaseResource {
  list(params?: LedgerListParams): Promise<ListResult<LedgerEntry>> {
    return this.client.requestList<LedgerEntry>({
      method: "GET",
      path: "/api/v2/ledger",
      query: params as Record<string, unknown> | undefined,
    });
  }
}
