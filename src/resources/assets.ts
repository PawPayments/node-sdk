import { BaseResource } from "./_base.js";

export interface Asset {
  asset: string;
  symbol: string;
  chain: string;
  type: string;
  network_family?: string | null;
  min_amount: number;
  enabled: boolean;
  [key: string]: unknown;
}

export class AssetsResource extends BaseResource {
  list(): Promise<Asset[]> {
    return this.client.request<Asset[]>({ method: "GET", path: "/api/v2/assets" });
  }
}
