import { BaseResource } from "./_base.js";
import type { FiatCurrency, RatesParams } from "../types.js";

export interface Rates {
  base: FiatCurrency;
  rates: Record<string, number | string>;
  [key: string]: unknown;
}

export class RatesResource extends BaseResource {
  get(params?: RatesParams): Promise<Rates> {
    const query: Record<string, unknown> = {};
    if (params?.base) query.base = params.base;
    if (params?.assets) query.assets = params.assets;
    return this.client.request<Rates>({ method: "GET", path: "/api/v2/rates", query });
  }
}
