import { BaseResource } from "./_base.js";

export interface Balance {
  available: number;
  total_income: number;
  total_payouts: number;
  [key: string]: unknown;
}

export class BalanceResource extends BaseResource {
  get(): Promise<Balance> {
    return this.client.request<Balance>({ method: "GET", path: "/api/v2/balance" });
  }
}
