import { BaseResource } from "./_base.js";
import type { LedgerListParams, ListResult } from "../types.js";

export interface LedgerEntry {
  type: "income" | "payout" | "refund";
  amount: number | string;
  reference_id: string;
  invoice_id?: string;
  currency?: string | null;
  asset?: string | null;
  fee?: number | string | null;
  status?: string | null;
  created_at?: number | string | null;
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
