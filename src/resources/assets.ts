import { BaseResource } from "./_base.js";

export interface Asset {
  asset: string;
  name: string;
  symbol: string;
  network?: string;
  decimals: number;
  enabled: boolean;
  min_amount?: number | string;
  [key: string]: unknown;
}

export class AssetsResource extends BaseResource {
  list(): Promise<Asset[]> {
    return this.client.request<Asset[]>({ method: "GET", path: "/api/v2/assets" });
  }
}
